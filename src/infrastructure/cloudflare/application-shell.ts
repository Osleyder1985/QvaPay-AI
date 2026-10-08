/**
 * @archivo src/infrastructure/cloudflare/application-shell.ts
 * @proposito Define el contrato estructural del Application Shell público.
 * @responsabilidades Centralizar módulos de navegación y su renderizado sin introducir autoridad de negocio.
 * @ubicacion src/infrastructure/cloudflare dentro de la arquitectura de QvaPay-AI.
 */

/** Contrato de un módulo navegable del Application Shell. */
export interface ApplicationShellModule {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly href: string;
  readonly administratorOnly?: boolean;
}

/** Módulos de navegación disponibles en el Application Shell. */
export const APPLICATION_SHELL_MODULES: readonly ApplicationShellModule[] = [
  { id: "inicio", label: "Inicio", icon: "⌂", href: "#inicio" },
  { id: "cuenta", label: "Cuenta", icon: "◎", href: "#cuenta" },
  { id: "mercado", label: "Mercado P2P", icon: "◈", href: "#mercado" },
  { id: "operaciones", label: "Operaciones", icon: "↔", href: "#operaciones" },
  { id: "controles", label: "Controles", icon: "◉", href: "#controles" },
  {
    id: "administracion",
    label: "Usuarios",
    icon: "⚙",
    href: "#administracion",
    administratorOnly: true,
  },
  { id: "auditoria", label: "Auditoría", icon: "✓", href: "#auditoria" },
];

/** Versión estructural del Application Shell. */
export const APPLICATION_SHELL_VERSION = "1";

/** Renderiza la navegación a partir del contrato central de módulos. */
export function renderApplicationShellNavigation(): string {
  return APPLICATION_SHELL_MODULES.map(
    ({ id, label, icon, href, administratorOnly }) =>
      '<a class="navitem' +
      (id === "inicio" ? " active" : "") +
      '" href="' +
      href +
      '"' +
      (administratorOnly
        ? ' id="adminNav" style="display:none"'
        : "") +
      '><span class="navicon" aria-hidden="true">' +
      icon +
      '</span><span>' +
      label +
      "</span></a>",
  ).join("\n");
}
