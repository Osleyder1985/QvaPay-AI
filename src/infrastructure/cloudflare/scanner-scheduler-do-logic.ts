import type { MarketProvider } from "../../application/ports/market-provider.js";
import { ScannerRuntime } from "../../application/scanner-runtime.js";
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

export const SCANNER_CONFIG_KEY = "scanner-config";

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

  if (currentAlarm === null || configurationChanged) {
    await storage.setAlarm(now + normalized.intervalSeconds * 1000);
  }

  const alarm = await storage.getAlarm();
  return createScannerSchedulerState(normalized, alarm);
}

export async function executeScannerAlarm(
  storage: ScannerSchedulerPersistentStorage,
  config: ScannerSchedulerConfig,
  provider: MarketProvider,
): Promise<void> {
  const scheduler = new CloudflareScannerScheduler(storage);
  const runtime = new ScannerRuntime(provider, {
    coin: config.coin,
    intervalSeconds: config.intervalSeconds,
    scheduler,
  });

  try {
    await runtime.run();
  } catch (error) {
    console.error("Scanner alarm execution failed", error);
    await scheduler.scheduleNext(
      new Date(Date.now() + config.intervalSeconds * 1000),
    );
  }
}
