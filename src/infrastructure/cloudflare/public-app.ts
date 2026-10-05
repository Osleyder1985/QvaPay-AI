const HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="QvaPay-AI production scanner dashboard">
  <title>QvaPay-AI</title>
  <style>
    :root { color-scheme: dark; font-family: system-ui, sans-serif; }
    body { margin: 0; min-height: 100vh; background: #0b1020; color: #eef2ff; }
    main { max-width: 760px; margin: 0 auto; padding: 32px 20px; }
    h1 { margin-bottom: 4px; }
    .muted { color: #aab4d0; }
    .card { margin-top: 24px; padding: 20px; border: 1px solid #27324f; border-radius: 14px; background: #121a2e; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
    .metric { padding: 14px; border-radius: 10px; background: #0d1427; }
    .label { display: block; font-size: 12px; color: #9eabd0; text-transform: uppercase; letter-spacing: .05em; }
    .value { display: block; margin-top: 6px; font-size: 18px; font-weight: 650; }
    #status.ok { color: #72e6a5; } #status.error { color: #ff8e9e; }
    footer { margin-top: 28px; font-size: 13px; color: #7f8bad; }
  </style>
</head>
<body>
  <main>
    <h1>QvaPay-AI</h1>
    <p class="muted">Production scanner dashboard · server-side runtime</p>
    <section class="card" aria-live="polite">
      <div id="status">Loading…</div>
      <div class="grid">
        <div class="metric"><span class="label">Coin</span><span class="value" id="coin">—</span></div>
        <div class="metric"><span class="label">Interval</span><span class="value" id="interval">—</span></div>
        <div class="metric"><span class="label">Last completed</span><span class="value" id="completed">—</span></div>
        <div class="metric"><span class="label">Next run</span><span class="value" id="next">—</span></div>
      </div>
    </section>
    <footer>Read-only dashboard. Scanner execution remains server-side; no browser session is required.</footer>
  </main>
  <script>
    const status = document.getElementById("status");
    const coin = document.getElementById("coin");
    const interval = document.getElementById("interval");
    const completed = document.getElementById("completed");
    const next = document.getElementById("next");

    const format = (value) => value ? new Date(value).toLocaleString() : "Not available";

    async function refresh() {
      try {
        const response = await fetch("/api/scanner/status", { headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error("Status HTTP " + response.status);
        const state = await response.json();
        status.textContent = state.running ? "Scanner running" : (state.configured ? "Scanner online" : "Scanner not configured");
        status.className = state.configured ? "ok" : "error";
        coin.textContent = state.coin ?? "—";
        interval.textContent = state.intervalSeconds ? state.intervalSeconds + " s" : "—";
        completed.textContent = format(state.lastCompletedAt);
        next.textContent = format(state.nextAlarmAt);
      } catch (error) {
        status.textContent = "Unable to load scanner status";
        status.className = "error";
      }
    }

    refresh();
    setInterval(refresh, 10000);
  </script>
</body>
</html>`;

export interface PublicScannerState {
  readonly configured: boolean;
  readonly coin: string | null;
  readonly intervalSeconds: number | null;
  readonly nextAlarmAt: number | null;
  readonly running: boolean;
  readonly lastStartedAt: string | null;
  readonly lastCompletedAt: string | null;
}

export function createPublicAppResponse(): Response {
  return new Response(HTML, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=UTF-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

export function createPublicScannerStateResponse(
  state: PublicScannerState,
): Response {
  return Response.json(state, {
    headers: {
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
