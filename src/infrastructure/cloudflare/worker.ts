import type { DurableObjectNamespace } from "@cloudflare/workers-types";
import { ScannerSchedulerDurableObject } from "./scanner-scheduler-do.js";
import { QvaPayP2PClient } from "../qvapay/qvapay-p2p-client.js";
import {
  createPublicAppResponse,
  createPublicScannerStateResponse,
  toPublicScannerState,
} from "./public-app.js";

export interface ScannerWorkerEnvironment {
  readonly SCANNER_SCHEDULER: DurableObjectNamespace<ScannerSchedulerDurableObject>;
  readonly QVAPAY_API_BASE_URL: string;
  readonly QVAPAY_APP_ID: string;
  readonly QVAPAY_APP_SECRET: string;
  readonly SCANNER_COIN: string;
  readonly SCANNER_INTERVAL_SECONDS: string;
  readonly SCANNER_BOOTSTRAP_TOKEN: string;
  readonly P2P_ACTION_TOKEN?: string;
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

    const applyMatch = url.pathname.match(/^\/api\/p2p\/([^/]+)\/apply$/);
    if (applyMatch) {
      if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

      const actionToken = env.P2P_ACTION_TOKEN;
      if (!actionToken || request.headers.get("x-p2p-action-token") !== actionToken) {
        return new Response("Unauthorized", { status: 401 });
      }

      const uuid = decodeURIComponent(applyMatch[1] ?? "");
      if (!uuid || uuid.length > 100) return new Response("Invalid offer id", { status: 400 });

      const provider = new QvaPayP2PClient({
        baseUrl: env.QVAPAY_API_BASE_URL,
        appId: env.QVAPAY_APP_ID,
        appSecret: env.QVAPAY_APP_SECRET,
      });

      try {
        return Response.json(await provider.applyOffer(uuid), {
          status: 201,
          headers: { "cache-control": "no-store" },
        });
      } catch (error) {
        const status =
          error instanceof Error && "status" in error
            ? Number((error as { status: number }).status)
            : 502;
        return Response.json(
          { error: error instanceof Error ? error.message : String(error) },
          { status: Number.isInteger(status) && status >= 400 && status < 600 ? status : 502 },
        );
      }
    }

    if (url.pathname === "/api/scanner/status") {
      if (request.method !== "GET") {
        return new Response("Method not allowed", { status: 405 });
      }

      return createPublicScannerStateResponse(
        toPublicScannerState(await stub.getState()),
      );
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
