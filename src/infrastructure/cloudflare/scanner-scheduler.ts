import type { DurableObjectStorage } from "@cloudflare/workers-types";
import type { ScannerScheduler } from "../../application/ports/scanner-scheduler.js";

export class CloudflareScannerScheduler implements ScannerScheduler {
  constructor(private readonly storage: DurableObjectStorage) {}

  async scheduleNext(runAt: Date): Promise<void> {
    await this.storage.setAlarm(runAt.getTime());
  }
}
