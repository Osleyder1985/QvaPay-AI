/**
 * Propósito: Durable Object que coordina scanner, Alarm y Auto Apply.
 * Ubicación: src/infrastructure/cloudflare/scanner-scheduler-do.ts
 * Historial: 2026-10-06 — actualización relacionada con Issue #222; cambios funcionales sujetos a auditoría #166.
 */

import { DurableObject } from "cloudflare:workers";
import type { DurableObjectStorage, D1Database } from "@cloudflare/workers-types";
import type { Market } from "../../domain/market.js";
import type { AutoApplyConfig } from "../../application/p2p-auto-apply.js";
import { QvaPayP2PClient } from "../qvapay/qvapay-p2p-client.js";
import {
  ensureScannerScheduled,
  executeScannerAlarm,
  SCANNER_EXECUTION_STATE_KEY,
  SCANNER_MARKET_SNAPSHOT_KEY,
  type ScannerRuntimeExecutionState,
  type ScannerSchedulerPersistentStorage,
} from "./scanner-scheduler-do-logic.js";
import {
  type ScannerSchedulerConfig,
  type SchedulerState,
} from "./scanner-scheduler-config.js";

export interface ScannerSchedulerEnvironment {
  readonly QVAPAY_API_BASE_URL: string;
  readonly QVAPAY_APP_ID: string;
  readonly QVAPAY_APP_SECRET: string;
}

export interface ScannerSchedulerRuntimeState extends SchedulerState {
  readonly execution: ScannerRuntimeExecutionState;
  readonly market: Market | null;
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

  async configureAutoApply(config: AutoApplyConfig) {
    return configureAutoApply(this.storage, config);
  }

  async getAutoApplyConfig() {
    return getAutoApplyConfig(this.storage);
  }

  async getAutoApplyState(): Promise<AutoApplyState> {
    return (
      (await this.storage.get<AutoApplyState>(AUTO_APPLY_STATE_KEY)) ??
      createInitialAutoApplyState()
    );
  }

  async getState(): Promise<ScannerSchedulerRuntimeState> {
    const config =
      await this.storage.get<ScannerSchedulerConfig>("scanner-config");
    const alarm = await this.storage.getAlarm();
    const execution =
      (await this.storage.get<ScannerRuntimeExecutionState>(
        SCANNER_EXECUTION_STATE_KEY,
      )) ?? {
        lastStartedAt: null,
        lastCompletedAt: null,
        lastError: null,
        lastOfferCount: 0,
        lastBuyCount: 0,
        lastSellCount: 0,
      };
    const market =
      (await this.storage.get<Market>(SCANNER_MARKET_SNAPSHOT_KEY)) ?? null;

    return {
      configured: config !== undefined,
      coin: config?.coin ?? null,
      intervalSeconds: config?.intervalSeconds ?? null,
      nextAlarmAt: alarm,
      execution,
      market,
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
      appId: this.env.QVAPAY_APP_ID,
      appSecret: this.env.QVAPAY_APP_SECRET,
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
