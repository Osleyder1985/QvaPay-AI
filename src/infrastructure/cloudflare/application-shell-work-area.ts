/**
 * @archivo src/infrastructure/cloudflare/application-shell-work-area.ts
 * @proposito Define el contenedor estructural del área de trabajo del Application Shell.
 * @responsabilidades Separar el marco del shell de la presentación funcional de sus módulos.
 * @ubicacion src/infrastructure/cloudflare dentro de la arquitectura de QvaPay-AI.
 */

/** Contrato estructural del área de trabajo. */
export interface ApplicationShellWorkArea {
  readonly id: string;
  readonly ariaLabel: string;
}

/** Configuración del área de trabajo pública. */
export const APPLICATION_SHELL_WORK_AREA: ApplicationShellWorkArea = {
  id: "contenido-principal",
  ariaLabel: "Área de trabajo principal",
};

/** Renderiza el contenedor estructural del área de trabajo. */
export function renderApplicationShellWorkAreaStart(): string {
  const area = APPLICATION_SHELL_WORK_AREA;
  return `<main id="${area.id}" aria-label="${area.ariaLabel}" tabindex="-1">`;
}

/** Renderiza el cierre del contenedor estructural del área de trabajo. */
export function renderApplicationShellWorkAreaEnd(): string {
  return "</main>";
}
