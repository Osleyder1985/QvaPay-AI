import { validateInterval } from "../../application/scanner-runtime.js";

export interface ScannerSchedulerConfig {
  readonly coin: string;
  readonly intervalSeconds: number;
}

export interface SchedulerState {
  readonly configured: boolean;
  readonly coin: string | null;
  readonly intervalSeconds: number | null;
  readonly nextAlarmAt: number | null;
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
