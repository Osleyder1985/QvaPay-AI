/**
 * @archivo src/infrastructure/cloudflare/application-shell-header.ts
 * @proposito Define la composición del encabezado contextual del Application Shell.
 * @responsabilidades Mantener separada la presentación del contexto de navegación respecto de los módulos.
 * @ubicacion src/infrastructure/cloudflare dentro de la arquitectura de QvaPay-AI.
 */

/** Contrato de datos para el encabezado contextual del Application Shell. */
export interface ApplicationShellHeader {
  readonly title: string;
  readonly description: string;
  readonly liveTextId: string;
  readonly updatedId: string;
}

/** Configuración actual del encabezado contextual del Dashboard. */
export const APPLICATION_SHELL_HEADER: ApplicationShellHeader = {
  title: "Dashboard operativo",
  description:
    "Observabilidad, control y trazabilidad del mercado P2P en un único centro.",
  liveTextId: "liveText",
  updatedId: "updated",
};

/** Renderiza el encabezado contextual sin crear estado operativo nuevo. */
export function renderApplicationShellHeader(): string {
  const header = APPLICATION_SHELL_HEADER;
  return `<header class="top" id="inicio" aria-labelledby="inicio-title"><div class="title"><h1 id="inicio-title">${header.title}</h1><p>${header.description}</p></div><div id="live" class="live"><i class="dot"></i><strong id="${header.liveTextId}">CONECTANDO</strong><span>·</span><span id="${header.updatedId}">—</span><button class="logout-button" id="logoutButton" type="button">Cerrar sesión</button></div></header>`;
}
