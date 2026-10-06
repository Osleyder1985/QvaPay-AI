import type { DurableObjectNamespace } from "@cloudflare/workers-types";
import { ScannerSchedulerDurableObject } from "./scanner-scheduler-do.js";
import { QvaPayP2PClient } from "../qvapay/qvapay-p2p-client.js";
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

    const applyMatch = url.pathname.match(/^\\/api\\/p2p\\/([^/]+)\\/apply$/);\n    if (applyMatch) {\n      return Response.json(\n        { error: "Las operaciones P2P reales no están habilitadas desde el dashboard público." },\n        { status: 403, headers: { "cache-control": "no-store" } },\n      );\n    }\n\n    if (url.pathname === "/api/account") {\n      if (request.method !== "GET") {\n        return new Response("Method not allowed", { status: 405 });\n      }\n\n      const accessContext = ctx as ExecutionContext & {\n        access?: { getIdentity: () => Promise<unknown> };\n      };\n      if (!accessContext.access) {\n        return Response.json({ error: "Application authentication required." }, { status: 403 });\n      }\n\n      try {\n        const provider = new QvaPayAccountClient({\n          baseUrl: env.QVAPAY_API_BASE_URL,\n          appId: env.QVAPAY_APP_ID,\n          appSecret: env.QVAPAY_APP_SECRET,\n          userApiToken: env.QVAPAY_USER_API_TOKEN,\n        });\n        const account = await provider.fetchAccount();\n        return Response.json(\n          { account },\n          {\n            headers: {\n              "cache-control": "no-store",\n              "x-content-type-options": "nosniff",\n            },\n          },\n        );\n      } catch (error) {\n        console.error("Account endpoint failed", error);\n        return Response.json(\n          { error: "No se pudo consultar la cuenta conectada." },\n          { status: 502 },\n        );\n      }\n    }\n\n    if (url.pathname === "/api/scanner/status") {
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
