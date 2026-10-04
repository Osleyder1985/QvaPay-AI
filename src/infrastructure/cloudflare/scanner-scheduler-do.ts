import { DurableObject } from "cloudflare:workers";
import type { DurableObjectStorage } from "@cloudflare/workers-types";
import { QvaPayP2PClient } from "../qvapay/qvapay-p2p-client.js";
import {
  ensureScannerScheduled,
  executeScannerAlarm,
  SCANNER_EXECUTION_STATE_KEY,
  type ScannerRuntimeExecutionState,
  type ScannerSchedulerPersistentStorage,
} from "./scanner-scheduler-do-logic.js";
import {
  type ScannerSchedulerConfig,
  type SchedulerState,
} from "./scanner-scheduler-config.js";

export interface ScannerSchedulerEnvironment {
  readonly QVAPAY_API_BASE_URL: string;
}

export interface ScannerSchedulerRuntimeState extends SchedulerState {
  readonly execution: ScannerRuntimeExecutionState;
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

  async getState(): Promise<ScannerSchedulerRuntimeState> {
    const config =
      await this.storage.get<ScannerSchedulerConfig>("scanner-config");
    const alarm = await this.storage.getAlarm();
    const execution = (await this.storage.get<ScannerRuntimeExecutionState>(
      SCANNER_EXECUTION_STATE_KEY,
    )) ?? {
      lastStartedAt: null,
      lastCompletedAt: null,
      lastError: null,
    };

    return {
      configured: config !== undefined,
      coin: config?.coin ?? null,
      intervalSeconds: config?.intervalSeconds ?? null,
      nextAlarmAt: alarm,
      execution,
    };
  }

  override async alarm(): Promise<void> {
    const config =
      await this.storage.get<ScannerSchedulerConfig>("scanner-config");
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
