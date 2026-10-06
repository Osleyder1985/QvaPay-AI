import type { DurableObjectNamespace } from "@cloudflare/workers-types";
import { ScannerSchedulerDurableObject } from "./scanner-scheduler-do.js";
import { QvaPayAccountClient } from "../qvapay/qvapay-account-client.js";
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
  readonly QVAPAY_USER_API_TOKEN: string;
  readonly SCANNER_COIN: string;
  readonly SCANNER_INTERVAL_SECONDS: string;
  readonly SCANNER_BOOTSTRAP_TOKEN: string;
}

const OBJECT_NAME = "default";

export default {
  async fetch(
    request: Request,
    env: ScannerWorkerEnvironment,
    ctx: ExecutionContext,
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
      return Response.json(
        {
          error:
            "Las operaciones P2P reales no están habilitadas desde el dashboard público.",
        },
        { status: 403, headers: { "cache-control": "no-store" } },
      );
    }

    if (url.pathname === "/api/account") {
      if (request.method !== "GET") {
        return new Response("Method not allowed", { status: 405 });
      }

      const accessContext = ctx as ExecutionContext & {
        access?: { getIdentity: () => Promise<unknown> };
      };
      if (!accessContext.access) {
        return Response.json(
          { error: "Application authentication required." },
          { status: 403 },
        );
      }

      try {
        const provider = new QvaPayAccountClient({
          baseUrl: env.QVAPAY_API_BASE_URL,
          appId: env.QVAPAY_APP_ID,
          appSecret: env.QVAPAY_APP_SECRET,
          userApiToken: env.QVAPAY_USER_API_TOKEN,
        });
        const account = await provider.fetchAccount();
        return Response.json(
          { account },
          {
            headers: {
              "cache-control": "no-store",
              "x-content-type-options": "nosniff",
            },
          },
        );
      } catch (error) {
        console.error("Account endpoint failed", error);
        return Response.json(
          { error: "No se pudo consultar la cuenta conectada." },
          { status: 502 },
        );
      }
    }

    if (url.pathname === "/api/scanner/status") {
      if (request.method !== "GET") {
        return new Response("Method not allowed", { status: 405 });
      }

      await stub.ensureScheduled({
        coin: env.SCANNER_COIN,
        intervalSeconds: Number(env.SCANNER_INTERVAL_SECONDS),
      });

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
