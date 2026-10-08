/**
 * @archivo src/presentation/components/alert.ts
 * @proposito Presentar advertencias e información operativa de forma inequívoca.
 * @responsabilidades Comunicar severidad sin ejecutar acciones.
 * @ubicacion src/presentation/components dentro de la arquitectura de presentación.
 */

import { escapeHtml } from "./escape-html.js";

export type AlertTone = "info" | "positive" | "warning" | "negative";

/** Genera una alerta de presentación con semántica accesible. */
export function renderAlert(tone: AlertTone, title: string, detail: string): string {
  return (
    '<aside class="qva-alert qva-alert--' +
    tone +
    '" role="' +
    (tone === "negative" || tone === "warning" ? "alert" : "status") +
    '">' +
    '<strong>' +
    escapeHtml(title) +
    "</strong>" +
    "<span>" +
    escapeHtml(detail) +
    "</span></aside>"
  );
}
