/**
 * @archivo src/application/ports/scanner-scheduler.ts
 * @proposito Define el puerto para programar la siguiente ejecución del scanner.
 * @responsabilidades Implementar y proteger las reglas propias de este módulo sin mezclar responsabilidades de otras capas.
 * @ubicacion src/application/ports dentro de la arquitectura de QvaPay-AI.
 */

export interface ScannerScheduler {
  scheduleNext(runAt: Date): Promise<void>;
}
