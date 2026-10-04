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
