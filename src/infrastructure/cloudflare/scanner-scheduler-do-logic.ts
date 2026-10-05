import type { MarketProvider } from "../../application/ports/market-provider.js";
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

export const createInitialScannerRuntimeExecutionState =
  (): ScannerRuntimeExecutionState => ({
    lastStartedAt: null,
    lastCompletedAt: null,
    lastError: null,
    lastOfferCount: 0,
    lastBuyCount: 0,
    lastSellCount: 0,
  });

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

    await storage.put<Market>(SCANNER_MARKET_SNAPSHOT_KEY, market);
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
