import type { MarketProvider } from "../../application/ports/market-provider.js";
import { findAutoApplyCandidate, normalizeAutoApplyConfig, type AutoApplyConfig } from "../../application/p2p-auto-apply.js";
import type { QvaPayP2PClient } from "../qvapay/qvapay-p2p-client.js";
import { ScannerRuntime } from "../../application/scanner-runtime.js";
import type { Market } from "../../domain/market.js";
import { CloudflareScannerScheduler } from "./scanner-scheduler.js";
import {
  createScannerSchedulerState,
  normalizeScannerSchedulerConfig,
  type ScannerSchedulerConfig,
  type SchedulerState,
} from "./scanner-scheduler-config.js";

export interface ScannerSchedulerPersistentStorage {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
  getAlarm(): Promise<number | null>;
  setAlarm(scheduledTimeMs: number): void | Promise<void>;
}

export interface ScannerRuntimeExecutionState {
  readonly lastStartedAt: string | null;
  readonly lastCompletedAt: string | null;
  readonly lastError: string | null;
  readonly lastOfferCount: number;
  readonly lastBuyCount: number;
  readonly lastSellCount: number;
}

export const SCANNER_CONFIG_KEY = "scanner-config";
export const SCANNER_EXECUTION_STATE_KEY = "scanner-execution-state";
export const SCANNER_MARKET_SNAPSHOT_KEY = "scanner-market-snapshot";
export const AUTO_APPLY_CONFIG_KEY = "auto-apply-config";
export const AUTO_APPLY_STATE_KEY = "auto-apply-state";

export interface AutoApplyState {\n  readonly lastAttemptAt: string | null;\n  readonly lastAction: "BUY" | "SELL" | null;\n  readonly lastOfferId: string | null;\n  readonly lastResult: "APPLIED" | "FAILED" | "SKIPPED" | null;\n  readonly lastError: string | null;\n  readonly lastDetail: unknown | null;\n}\n\nexport const createInitialAutoApplyState = (): AutoApplyState => ({\n  lastAttemptAt: null,\n  lastAction: null,\n  lastOfferId: null,\n  lastResult: null,\n  lastError: null,\n  lastDetail: null,\n});\n\nexport const createInitialScannerRuntimeExecutionState =
  (): ScannerRuntimeExecutionState => ({
    lastStartedAt: null,
    lastCompletedAt: null,
    lastError: null,
    lastOfferCount: 0,
    lastBuyCount: 0,
    lastSellCount: 0,
  });

export async function configureAutoApply(
  storage: ScannerSchedulerPersistentStorage,
  config: AutoApplyConfig,
): Promise<AutoApplyConfig> {
  const normalized = normalizeAutoApplyConfig(config);
  await storage.put(AUTO_APPLY_CONFIG_KEY, normalized);
  return normalized;
}

export async function getAutoApplyConfig(
  storage: ScannerSchedulerPersistentStorage,
): Promise<AutoApplyConfig | null> {
  return (await storage.get<AutoApplyConfig>(AUTO_APPLY_CONFIG_KEY)) ?? null;
}

async function executeAutoApply(
  storage: ScannerSchedulerPersistentStorage,
  market: Market,
  provider: QvaPayP2PClient,
): Promise<void> {
  const config = await getAutoApplyConfig(storage);
  if (!config?.enabled) return;

  const now = Date.now();
  const recentAttempts =
    (await storage.get<number[]>("auto-apply-attempts")) ?? [];
  const activeAttempts = recentAttempts.filter((timestamp) => now - timestamp < 60_000);
  if (activeAttempts.length >= 2) {
    return;
  }

  const appliedIds =
    (await storage.get<string[]>("auto-apply-applied-ids")) ?? [];
  const balance = await provider.fetchApplicationBalance();
  const candidate = findAutoApplyCandidate(market.offers, config, { qusd: balance });
  if (!candidate || appliedIds.includes(candidate.offer.id)) {
    return;
  }

  await storage.put("auto-apply-attempts", [...activeAttempts, now]);
  const attemptedAt = new Date(now).toISOString();

  try {
    const result = await provider.applyOffer(candidate.offer.id);
    let detail: unknown = null;
    let detailError: string | null = null;
    try {
      detail = await provider.fetchOfferDetail(candidate.offer.id);
    } catch (error) {
      detailError = error instanceof Error ? error.message : String(error);
    }

    await storage.put("auto-apply-applied-ids", [
      ...appliedIds.slice(-499),
      candidate.offer.id,
    ]);
    await storage.put<AutoApplyState>(AUTO_APPLY_STATE_KEY, {
      lastAttemptAt: attemptedAt,
      lastAction: candidate.action,
      lastOfferId: candidate.offer.id,
      lastResult: "APPLIED",
      lastError: detailError,
      lastDetail: detail,
    });
    console.info("QvaPay Auto Apply completed", {
      action: candidate.action,
      offerId: candidate.offer.id,
      detailAvailable: detail !== null,
    });
    void result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await storage.put<AutoApplyState>(AUTO_APPLY_STATE_KEY, {
      lastAttemptAt: attemptedAt,
      lastAction: candidate.action,
      lastOfferId: candidate.offer.id,
      lastResult: "FAILED",
      lastError: message,
      lastDetail: null,
    });
    console.error("QvaPay Auto Apply failed", {
      action: candidate.action,
      offerId: candidate.offer.id,
      error: message,
    });
  }
}

export async function ensureScannerScheduled(
  storage: ScannerSchedulerPersistentStorage,
  config: ScannerSchedulerConfig,
  now = Date.now(),
): Promise<SchedulerState> {
  const normalized = normalizeScannerSchedulerConfig(config);
  const previous =
    await storage.get<ScannerSchedulerConfig>(SCANNER_CONFIG_KEY);
  const currentAlarm = await storage.getAlarm();
  const configurationChanged =
    previous?.coin !== normalized.coin ||
    previous?.intervalSeconds !== normalized.intervalSeconds;

  await storage.put(SCANNER_CONFIG_KEY, normalized);

  if (currentAlarm === null || currentAlarm <= now || configurationChanged) {
    await storage.setAlarm(now + normalized.intervalSeconds * 1000);
  }

  const alarm = await storage.getAlarm();
  return createScannerSchedulerState(normalized, alarm);
}

export async function executeScannerAlarm(
  storage: ScannerSchedulerPersistentStorage,
  config: ScannerSchedulerConfig,
  provider: MarketProvider,
  now = Date.now(),
): Promise<void> {
  const scheduler = new CloudflareScannerScheduler(storage);
  const previousState =
    (await storage.get<ScannerRuntimeExecutionState>(
      SCANNER_EXECUTION_STATE_KEY,
    )) ?? createInitialScannerRuntimeExecutionState();

  await storage.put(SCANNER_EXECUTION_STATE_KEY, {
    ...previousState,
    lastStartedAt: new Date(now).toISOString(),
    lastError: null,
  });

  const runtime = new ScannerRuntime(provider, {
    coin: config.coin,
    intervalSeconds: config.intervalSeconds,
    scheduler,
  });

  try {
    const market = await runtime.run();
    if (!market) {
      throw new Error("Scanner returned no market snapshot");
    }

    const buyCount = market.offers.filter(
      (offer) => offer.side === "BUY",
    ).length;
    const sellCount = market.offers.filter(
      (offer) => offer.side === "SELL",
    ).length;

    await storage.put<Market>(SCANNER_MARKET_SNAPSHOT_KEY, market);\n    await executeAutoApply(storage, market, provider as QvaPayP2PClient);
    await storage.put<ScannerRuntimeExecutionState>(
      SCANNER_EXECUTION_STATE_KEY,
      {
        lastStartedAt: new Date(now).toISOString(),
        lastCompletedAt: new Date().toISOString(),
        lastError: null,
        lastOfferCount: market.offers.length,
        lastBuyCount: buyCount,
        lastSellCount: sellCount,
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Scanner alarm execution failed", error);
    await storage.put(SCANNER_EXECUTION_STATE_KEY, {
      ...previousState,
      lastStartedAt: new Date(now).toISOString(),
      lastError: message,
    });
    await scheduler.scheduleNext(
      new Date(Date.now() + config.intervalSeconds * 1000),
    );
  }
}
