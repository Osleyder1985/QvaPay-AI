import type { ScannerSchedulerDurableObject } from "./scanner-scheduler-do.js";

interface Env {
  SCANNER_SCHEDULER: DurableObjectNamespace<ScannerSchedulerDurableObject>;
  QVAPAY_API_BASE_URL: string;
  SCANNER_COIN: string;
  SCANNER_INTERVAL_SECONDS: string;
  SCANNER_BOOTSTRAP_TOKEN: string;
}
