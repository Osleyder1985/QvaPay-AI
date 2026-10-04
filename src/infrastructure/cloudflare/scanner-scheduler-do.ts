import { DurableObject } from "cloudflare:workers";
import type { DurableObjectStorage } from "@cloudflare/workers-types";
import { QvaPayP2PClient } from "../qvapay/qvapay-p2p-client.js";
import {
  ensureScannerScheduled,
  executeScannerAlarm,
  type ScannerSchedulerPersistentStorage,
} from "./scanner-scheduler-do-logic.js";
import {
  type ScannerSchedulerConfig,
  type SchedulerState,
} from "./scanner-scheduler-config.js";

export interface ScannerSchedulerEnvironment {
  readonly QVAPAY_API_BASE_URL: string;
}

export class ScannerSchedulerDurableObject extends DurableObject<ScannerSchedulerEnvironment> {
  private readonly storage: DurableObjectStorage;

  constructor(ctx: DurableObjectState, env: ScannerSchedulerEnvironment) {
    super(ctx, env);
    this.storage = ctx.storage;
  }

  async ensureScheduled(
    config: ScannerSchedulerConfig,
  ): Promise<SchedulerState> {
    return ensureScannerScheduled(this.storage, config);
  }

  async getState(): Promise<SchedulerState> {
    const config = await this.storage.get<ScannerSchedulerConfig>(
      "scanner-config",
    );
    const alarm = await this.storage.getAlarm();

    return {
      configured: config !== undefined,
      coin: config?.coin ?? null,
      intervalSeconds: config?.intervalSeconds ?? null,
      nextAlarmAt: alarm,
    };
  }

  override async alarm(): Promise<void> {
    const config = await this.storage.get<ScannerSchedulerConfig>(
      "scanner-config",
    );
    if (!config) {
      return;
    }

    const provider = new QvaPayP2PClient({
      baseUrl: this.env.QVAPAY_API_BASE_URL,
    });

    await executeScannerAlarm(
      this.storage satisfies ScannerSchedulerPersistentStorage,
      config,
      provider,
    );
  }
}

export type {
  ScannerSchedulerConfig,
  SchedulerState,
} from "./scanner-scheduler-config.js";
