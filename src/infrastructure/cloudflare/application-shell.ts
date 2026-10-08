/**
 * @archivo src/infrastructure/cloudflare/application-shell.ts
 * @proposito Define el contrato estructural del Application Shell público.
 * @responsabilidades Centralizar módulos de navegación y su renderizado sin introducir autoridad de negocio.
 * @ubicacion src/infrastructure/cloudflare dentro de la arquitectura de QvaPay-AI.
 */
export interface ApplicationShellModule {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly href: string;
  readonly administratorOnly?: boolean;
}
export const APPLICATION_SHELL_MODULES: readonly ApplicationShellModule[] = [
  { id: "inicio", label: "Inicio", icon: "⌂", href: "/app/inicio" },
  { id: "cuenta", label: "Cuenta QvaPay", icon: "◎", href: "/app/cuenta" },
  { id: "mercado", label: "Mercado P2P", icon: "◈", href: "/app/mercado" },
  { id: "arbitraje", label: "Arbitraje", icon: "⇄", href: "/app/arbitraje" },
  { id: "operaciones", label: "Operaciones", icon: "↔", href: "/app/operaciones" },
  { id: "usuarios", label: "Usuarios y acceso", icon: "♙", href: "/app/usuarios", administratorOnly: true },
  { id: "seguridad", label: "Seguridad y auditoría", icon: "✓", href: "/app/seguridad" },
  { id: "monitor", label: "Monitor", icon: "◉", href: "/app/monitor" },
  { id: "configuracion", label: "Configuración", icon: "⚙", href: "/app/configuracion" },
];
export const APPLICATION_SHELL_VERSION = "2";
/** Renderiza navegación por rutas, marcando la página activa. */
export function renderApplicationShellNavigation(activeModuleId = "inicio"): string {
  return APPLICATION_SHELL_MODULES.map(({ id, label, icon, href, administratorOnly }) => {
    const attributes = [
      `class="navitem${id === activeModuleId ? " active" : ""}"`,
      `href="${href}"`,
      id === activeModuleId ? 'aria-current="page"' : "",
      administratorOnly ? 'id="adminNav" hidden' : "",
    ].filter(Boolean).join(" ");
    return `<a ${attributes}><span class="navicon" aria-hidden="true">${icon}</span><span>${label}</span></a>`;
  }).join("\n");
}
