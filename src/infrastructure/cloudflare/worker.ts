import type {
  DurableObjectNamespace,
  ExecutionContext,
} from "@cloudflare/workers-types";
import { ScannerSchedulerDurableObject } from "./scanner-scheduler-do.js";

export interface ScannerWorkerEnvironment {
  readonly SCANNER_SCHEDULER: DurableObjectNamespace<ScannerSchedulerDurableObject>;
  readonly QVAPAY_API_BASE_URL: string;
  readonly SCANNER_COIN: string;
  readonly SCANNER_INTERVAL_SECONDS: string;
  readonly SCANNER_BOOTSTRAP_TOKEN: string;
}

const OBJECT_NAME = "default";

export default {
  async fetch(
    request: Request,
    env: ScannerWorkerEnvironment,
    _ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname !== "/internal/scanner/start") {
      return new Response("Not found", { status: 404 });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const authorization = request.headers.get("authorization");
    if (authorization !== `Bearer ${env.SCANNER_BOOTSTRAP_TOKEN}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    const intervalSeconds = Number(env.SCANNER_INTERVAL_SECONDS);
    const stub = env.SCANNER_SCHEDULER.getByName(OBJECT_NAME);
    const state = await stub.ensureScheduled({
      coin: env.SCANNER_COIN,
      intervalSeconds,
    });

    return Response.json(state);
  },
};

export { ScannerSchedulerDurableObject };
