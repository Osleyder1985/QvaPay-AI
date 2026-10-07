/**
 * @archivo src/infrastructure/cloudflare/scanner-scheduler-config.ts
 * @proposito Define y valida la configuración persistente del scheduler.
 * @responsabilidades Implementar y proteger las reglas propias de este módulo sin mezclar responsabilidades de otras capas.
 * @ubicacion src/infrastructure/cloudflare dentro de la arquitectura de QvaPay-AI.
 */

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
    throw new Error("La moneda del scanner no puede estar vacía");
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
