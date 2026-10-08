/**
 * @archivo src/infrastructure/cloudflare/application-shell-module-mount.ts
 * @proposito Define la frontera estructural donde el Application Shell monta el contenido funcional de los módulos.
 * @responsabilidades Aislar la composición del shell de la implementación interna de cada módulo.
 * @ubicacion src/infrastructure/cloudflare dentro de la arquitectura de QvaPay-AI.
 */

/** Contrato estructural para el punto de montaje de módulos. */
export interface ApplicationShellModuleMount {
  readonly id: string;
  readonly ariaLabel: string;
}

/** Configuración pública del punto de montaje de módulos. */
export const APPLICATION_SHELL_MODULE_MOUNT: ApplicationShellModuleMount = {
  id: "modulos-aplicacion",
  ariaLabel: "Contenido funcional de los módulos",
};

/** Renderiza la apertura del punto de montaje de módulos. */
export function renderApplicationShellModuleMountStart(): string {
  const mount = APPLICATION_SHELL_MODULE_MOUNT;
  return `<div id="${mount.id}" aria-label="${mount.ariaLabel}">`;
}

/** Renderiza el cierre del punto de montaje de módulos. */
export function renderApplicationShellModuleMountEnd(): string {
  return "</div>";
}