/**
 * @archivo tests/application-shell-routing.test.ts
 * @proposito Verifica las rutas y la navegación del Application Shell.
 * @responsabilidades Detectar regresiones en rutas, navegación accesible y aislamiento visual.
 */

import { describe, expect, it } from "vitest";

import {
  APPLICATION_SHELL_MODULES,
  renderApplicationShellNavigation,
} from "../src/infrastructure/cloudflare/application-shell.js";
import { DASHBOARD_CLIENT_SCRIPT } from "../src/presentation/dashboard/dashboard-client.js";

describe("rutas y navegación del Application Shell", () => {
  it("define las rutas de los módulos", () => {
    expect(APPLICATION_SHELL_MODULES.map((module) => module.href)).toEqual([
      "/app/inicio",
      "/app/cuenta",
      "/app/mercado",
      "/app/arbitraje",
      "/app/operaciones",
      "/app/usuarios",
      "/app/seguridad",
      "/app/monitor",
      "/app/configuracion",
    ]);
  });

  it("marca la ruta activa y oculta Usuarios por defecto", () => {
    const navigation = renderApplicationShellNavigation("cuenta");

    expect(navigation).toContain('href="/app/cuenta"');
    expect(navigation).toContain('aria-current="page"');
    expect(navigation).toContain('href="/app/usuarios"');
    expect(navigation).toContain('id="adminNav" hidden');
    expect(navigation).not.toContain('href="#cuenta"');
  });

  it("documenta módulos funcionales pendientes", () => {
    expect(DASHBOARD_CLIENT_SCRIPT).toContain("initializeModulePage");
    expect(DASHBOARD_CLIENT_SCRIPT).toContain("visibleByModule");
    expect(DASHBOARD_CLIENT_SCRIPT).toContain(
      "Implementación funcional pendiente",
    );
  });
});
