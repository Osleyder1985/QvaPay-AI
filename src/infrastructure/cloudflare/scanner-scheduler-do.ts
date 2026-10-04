import { DurableObject } from "cloudflare:workers";
import type { DurableObjectStorage } from "@cloudflare/workers-types";
import {
  ScannerRuntime,
  validateInterval,
} from "../../application/scanner-runtime.js";
import { QvaPayP2PClient } from "../qvapay/qvapay-p2p-client.js";
import { CloudflareScannerScheduler } from "./scanner-scheduler.js";

const CONFIG_KEY = "scanner-config";

export interface ScannerSchedulerConfig {
  readonly coin: string;
  readonly intervalSeconds: number;
}

export interface ScannerSchedulerEnvironment {
  readonly QVAPAY_API_BASE_URL: string;
}

export interface SchedulerState {
  readonly configured: boolean;
  readonly coin: string | null;
  readonly intervalSeconds: number | null;
  readonly nextAlarmAt: number | null;
}

export class ScannerSchedulerDurableObject\n  extends DurableObject<ScannerSchedulerEnvironment> {
  private readonly storage: DurableObjectStorage;

  constructor(
    ctx: DurableObjectState,
    env: ScannerSchedulerEnvironment,
  ) {
    super(ctx, env);
    this.storage = ctx.storage;
  }

  async ensureScheduled(
    config: ScannerSchedulerConfig,
  ): Promise<SchedulerState> {
    const normalized = normalizeScannerSchedulerConfig(config);
    const previous =
      await this.storage.get<ScannerSchedulerConfig>(CONFIG_KEY);
    const currentAlarm = await this.storage.getAlarm();
    const configurationChanged =
      previous?.coin !== normalized.coin ||
      previous?.intervalSeconds !== normalized.intervalSeconds;

    await this.storage.put(CONFIG_KEY, normalized);

    if (currentAlarm === null || configurationChanged) {
      const nextRunAt = new Date(
        Date.now() + normalized.intervalSeconds * 1000,
      );
      await this.storage.setAlarm(nextRunAt.getTime());
    }

    return this.getState();
  }

  async getState(): Promise<SchedulerState> {
    const config = await this.storage.get<ScannerSchedulerConfig>(CONFIG_KEY);
    const alarm = await this.storage.getAlarm();

    return {
      configured: config !== undefined,
      coin: config?.coin ?? null,
      intervalSeconds: config?.intervalSeconds ?? null,
      nextAlarmAt: alarm,
    };
  }

  override async alarm(): Promise<void> {
    const config = await this.storage.get<ScannerSchedulerConfig>(CONFIG_KEY);
    if (!config) {
      return;
    }

    const provider = new QvaPayP2PClient({
      baseUrl: this.env.QVAPAY_API_BASE_URL,
    });
    const scheduler = new CloudflareScannerScheduler(this.storage);
    const runtime = new ScannerRuntime(provider, {
      coin: config.coin,
      intervalSeconds: config.intervalSeconds,
      scheduler,
    });

    try {
      await runtime.run();
    } catch (error) {
      console.error("Scanner alarm execution failed", error);
      const retryAt = new Date(
        Date.now() + config.intervalSeconds * 1000,
      );
      await scheduler.scheduleNext(retryAt);
    }
  }
}

export function normalizeScannerSchedulerConfig(
  config: ScannerSchedulerConfig,
): ScannerSchedulerConfig {
  const coin = config.coin.trim();
  if (!coin) {
    throw new Error("Scanner coin must not be empty");
  }

  validateInterval(config.intervalSeconds);

  return {
    coin,
    intervalSeconds: config.intervalSeconds,
  };
}

export function createScannerSchedulerState(
  config: ScannerSchedulerConfig | undefined,
  alarm: number | null,
): SchedulerState {
  return {
    configured: config !== undefined,
    coin: config?.coin ?? null,
    intervalSeconds: config?.intervalSeconds ?? null,
    nextAlarmAt: alarm,
  };
}
