export interface ScannerScheduler {
  scheduleNext(runAt: Date): Promise<void>;
}
