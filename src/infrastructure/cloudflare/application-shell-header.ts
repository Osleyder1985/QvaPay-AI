/**
 * @archivo src/infrastructure/cloudflare/application-shell-header.ts
 * @proposito Define el encabezado contextual del Application Shell.
 * @responsabilidades Separar navegación y presentación contextual de módulos.
 * @ubicacion Capa de infraestructura Cloudflare de QvaPay-AI.
 */

/** Metadatos por defecto cuando una ruta no tiene encabezado específico. */
const DEFAULT_MODULE_HEADER = {
  title: "Centro de mando",
  description:
    "Una vista clara del estado operativo y los indicadores esenciales.",
};

/** Metadatos contextuales del encabezado para cada módulo. */
const MODULE_HEADERS: Readonly<
  Record<string, { title: string; description: string }>
> = {
  inicio: {
    title: "Centro de mando",
    description:
      "Una vista clara del estado operativo y los indicadores esenciales.",
  },
  cuenta: {
    title: "Cuenta QvaPay",
    description:
      "Identidad y datos financieros obtenidos de la API autenticada.",
  },
  mercado: {
    title: "Mercado P2P",
    description:
      "Lectura del mercado, ofertas y calidad del snapshot observado.",
  },
  arbitraje: {
    title: "Arbitraje",
    description: "Análisis por moneda y mercado, sin enviar órdenes.",
  },
  operaciones: {
    title: "Operaciones",
    description: "Seguimiento de las operaciones disponibles para tu sesión.",
  },
  usuarios: {
    title: "Usuarios y acceso",
    description:
      "Administración de usuarios y permisos para roles autorizados.",
  },
  seguridad: {
    title: "Seguridad y auditoría",
    description:
      "Controles de seguridad, auditoría y trazabilidad operativa.",
  },
  monitor: {
    title: "Monitor y observabilidad",
    description: "Estado del runtime, escaneos, frescura de datos y errores.",
  },
  configuracion: {
    title: "Configuración",
    description:
      "Preferencias y parámetros disponibles para esta aplicación.",
  },
};

/**
 * Renderiza el encabezado contextual de la ruta activa.
 * @param moduleId Identificador de la ruta solicitada.
 * @returns Fragmento HTML del encabezado.
 */
export function renderApplicationShellHeader(moduleId = "inicio"): string {
  const header = MODULE_HEADERS[moduleId] ?? DEFAULT_MODULE_HEADER;
  return [
    '<header class="top" id="pageHeader" aria-labelledby="inicio-title">',
    '<div class="title">',
    `<h1 id="inicio-title">${header.title}</h1>`,
    `<p>${header.description}</p>`,
    "</div>",
    '<div id="live" class="live">',
    '<i class="dot"></i>',
    '<strong id="liveText">CONECTANDO</strong>',
    "<span>·</span>",
    '<span id="updated">—</span>',
    '<button class="logout-button" id="logoutButton" type="button">Cerrar sesión</button>',
    "</div>",
    "</header>",
  ].join("");
}
