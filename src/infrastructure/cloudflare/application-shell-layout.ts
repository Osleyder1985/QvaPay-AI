/**
 * @archivo src/infrastructure/cloudflare/application-shell-layout.ts
 * @proposito Define la composición estructural del Application Shell público.
 * @responsabilidades Separar la navegación, el marco lateral y el área de trabajo de la presentación de módulos.
 * @ubicacion src/infrastructure/cloudflare dentro de la arquitectura de QvaPay-AI.
 */

import { renderApplicationShellNavigation } from "./application-shell.js";

/** Renderiza la apertura estructural del Application Shell. */
export function renderApplicationShellStart(): string {
  return `<body>
<div class="shell">
<aside class="sidebar">
<div class="brand"><div class="logo">⚡</div><div><strong>QvaPay-AI</strong><span>Centro operativo</span></div></div>
<nav aria-label="Navegación principal">
${renderApplicationShellNavigation()}
</nav>
<div class="framework"><b>MARCO DE GESTIÓN</b><p>Calidad · seguridad · continuidad · trazabilidad. Alineación ISO no equivale a certificación.</p></div>
</aside>
<main id="contenido-principal" tabindex="-1">`;
}

/** Renderiza el cierre estructural del Application Shell. */
export function renderApplicationShellEnd(): string {
  return `</main>
</div>`;
}
