import type { DurableObjectNamespace } from "@cloudflare/workers-types";
import { ScannerSchedulerDurableObject } from "./scanner-scheduler-do.js";
import {
  createPublicAppResponse,
  createPublicScannerStateResponse,
} from "./public-app.js";

export interface ScannerWorkerEnvironment {
  readonly SCANNER_SCHEDULER: DurableObjectNamespace<ScannerSchedulerDurableObject>;
  readonly QVAPAY_API_BASE_URL: string;
  readonly QVAPAY_APP_ID: string;
  readonly QVAPAY_APP_SECRET: string;
  readonly SCANNER_COIN: string;
  readonly SCANNER_INTERVAL_SECONDS: string;
  readonly SCANNER_BOOTSTRAP_TOKEN: string;
}

const OBJECT_NAME = "default";

export default {
  async fetch(
    request: Request,
    env: ScannerWorkerEnvironment,
  ): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      if (request.method !== "GET") {
        return new Response("Method not allowed", { status: 405 });
      }

      return createPublicAppResponse();
    }

    const stub = env.SCANNER_SCHEDULER.getByName(OBJECT_NAME);

    if (url.pathname === "/api/scanner/status") {
      if (request.method !== "GET") {
        return new Response("Method not allowed", { status: 405 });
      }

      const state = await stub.getState();
      return createPublicScannerStateResponse({
        configured: state.configured,
        coin: state.coin,
        intervalSeconds: state.intervalSeconds,
        nextAlarmAt: state.nextAlarmAt,
        running: state.execution.lastStartedAt !== null &&
          (state.execution.lastCompletedAt === null ||
            state.execution.lastStartedAt > state.execution.lastCompletedAt),
        lastStartedAt: state.execution.lastStartedAt,
        lastCompletedAt: state.execution.lastCompletedAt,
      });
    }

    if (
      url.pathname !== "/internal/scanner/start" &&
      url.pathname !== "/internal/scanner/state"
    ) {
      return new Response("Not found", { status: 404 });
    }

    if (request.method !== "POST" && request.method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    }

    const authorization = request.headers.get("authorization");
    if (authorization !== `Bearer ${env.SCANNER_BOOTSTRAP_TOKEN}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (url.pathname === "/internal/scanner/state") {
      if (request.method !== "GET") {
        return new Response("Method not allowed", { status: 405 });
      }

      return Response.json(await stub.getState());
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const intervalSeconds = Number(env.SCANNER_INTERVAL_SECONDS);
    const state = await stub.ensureScheduled({
      coin: env.SCANNER_COIN,
      intervalSeconds,
    });

    return Response.json(state);
  },
};

export { ScannerSchedulerDurableObject };
