/**
 * @archivo src/infrastructure/cloudflare/scanner-scheduler.ts
 * @proposito Adapta el scheduler de aplicación al Durable Object.
 * @responsabilidades Implementar y proteger las reglas propias de este módulo sin mezclar responsabilidades de otras capas.
 * @ubicacion src/infrastructure/cloudflare dentro de la arquitectura de QvaPay-AI.
 */

import type { ScannerScheduler } from "../../application/ports/scanner-scheduler.js";

export interface DurableObjectAlarmStorage {
  setAlarm(scheduledTimeMs: number): void | Promise<void>;
}

export class CloudflareScannerScheduler implements ScannerScheduler {
  constructor(private readonly storage: DurableObjectAlarmStorage) {}

  async scheduleNext(runAt: Date): Promise<void> {
    await this.storage.setAlarm(runAt.getTime());
  }
}
