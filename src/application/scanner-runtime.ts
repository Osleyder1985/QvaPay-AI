/**
 * @archivo src/application/scanner-runtime.ts
 * @proposito Orquesta la ejecución del scanner, su estado y la programación siguiente.
 * @responsabilidades Implementar y proteger las reglas propias de este módulo sin mezclar responsabilidades de otras capas.
 * @ubicacion src/application dentro de la arquitectura de QvaPay-AI.
 */

import type { Market } from "../domain/market.js";
import type { MarketProvider } from "./ports/market-provider.js";
import type { ScannerScheduler } from "./ports/scanner-scheduler.js";
import { scanMarket } from "./use-cases/scan-market.js";

export interface ScannerRuntimeOptions {
  readonly coin: string;
  readonly intervalSeconds: number;
  readonly scheduler: ScannerScheduler;
}

export interface ScannerRuntimeState {
  readonly status: "idle" | "running" | "failed";
  readonly lastStartedAt: string | null;
  readonly lastCompletedAt: string | null;
  readonly lastError: string | null;
  readonly nextRunAt: string | null;
}

const MIN_INTERVAL_SECONDS = 5;
const MAX_INTERVAL_SECONDS = 300;

/**
 * @proposito API pública ScannerRuntime: implementa el comportamiento expuesto por este módulo.
 * @responsabilidades Aplicar las validaciones y reglas de negocio definidas por el contrato del módulo.
 */
export class ScannerRuntime {
  private running = false;
  private state: ScannerRuntimeState = {
    status: "idle",
    lastStartedAt: null,
    lastCompletedAt: null,
    lastError: null,
    nextRunAt: null,
  };

  constructor(
    private readonly provider: MarketProvider,
    private readonly options: ScannerRuntimeOptions,
    private readonly clock: () => Date = () => new Date(),
  ) {
    validateInterval(options.intervalSeconds);
    if (!options.coin.trim()) {
      throw new Error("La moneda del scanner no puede estar vacía");
    }
  }

  getState(): ScannerRuntimeState {
    return { ...this.state };
  }

  async run(): Promise<Market | null> {
    if (this.running) {
      return null;
    }

    this.running = true;
    const startedAt = this.clock();
    this.state = {
      ...this.state,
      status: "running",
      lastStartedAt: startedAt.toISOString(),
      lastError: null,
    };

    try {
      const market = await scanMarket(this.provider, this.options.coin);
      const completedAt = this.clock();
      const nextRunAt = new Date(
        completedAt.getTime() + this.options.intervalSeconds * 1000,
      );
      this.state = {
        ...this.state,
        status: "idle",
        lastCompletedAt: completedAt.toISOString(),
        nextRunAt: nextRunAt.toISOString(),
      };
      await this.options.scheduler.scheduleNext(nextRunAt);
      return market;
    } catch (error) {
      this.state = {
        ...this.state,
        status: "failed",
        lastError: error instanceof Error ? error.message : String(error),
      };
      throw error;
    } finally {
      this.running = false;
    }
  }
}

/**
 * @proposito API pública validateInterval: implementa el comportamiento expuesto por este módulo.
 * @responsabilidades Aplicar las validaciones y reglas de negocio definidas por el contrato del módulo.
 * @returns Resultado de la operación pública.
 */
export function validateInterval(intervalSeconds: number): void {
  if (
    !Number.isInteger(intervalSeconds) ||
    intervalSeconds < MIN_INTERVAL_SECONDS ||
    intervalSeconds > MAX_INTERVAL_SECONDS
  ) {
    throw new Error(
      "El intervalo del scanner debe ser un entero entre " +
        MIN_INTERVAL_SECONDS +
        " y " +
        MAX_INTERVAL_SECONDS +
        " segundos",
    );
  }
}
