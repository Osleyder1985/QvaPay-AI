/**
 * @archivo tests/application-shell-routing.test.ts
 * @proposito Verifica las rutas y la navegación del Application Shell.
 * @responsabilidades Detectar regresiones en rutas y aislamiento visual accesible.
 */

import { describe, expect, it } from "vitest";

import {
  APPLICATION_SHELL_MODULES,
  renderApplicationShellNavigation,
} from "../src/infrastructure/cloudflare/application-shell.js";
import { DASHBOARD_CLIENT_SCRIPT } from "../src/presentation/dashboard/dashboard-client.js";
import { renderDashboardModuleView } from "../src/presentation/dashboard/dashboard-view.js";
import { renderApplicationShellHeader } from "../src/infrastructure/cloudflare/application-shell-header.js";

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

  it("expone un encabezado accesible y contextual por ruta", () => {
    const header = renderApplicationShellHeader("mercado");

    expect(header).toContain('aria-labelledby="page-title"');
    expect(header).toContain('<h1 id="page-title">Mercado P2P</h1>');
  });

  it("renderiza encabezados específicos para las nueve rutas", () => {
    const expected = [
      ["inicio", "Centro de mando"],
      ["cuenta", "Cuenta QvaPay"],
      ["mercado", "Mercado P2P"],
      ["arbitraje", "Arbitraje"],
      ["operaciones", "Operaciones"],
      ["usuarios", "Usuarios y acceso"],
      ["seguridad", "Seguridad y auditoría"],
      ["monitor", "Monitor y observabilidad"],
      ["configuracion", "Configuración"],
    ] as const;

    for (const [moduleId, title] of expected) {
      const header = renderApplicationShellHeader(moduleId);
      expect(header).toContain(`<h1 id="page-title">${title}</h1>`);
      expect(header).toContain('id="logoutButton"');
      expect(header).toContain('aria-labelledby="page-title"');
    }
  });

  it("usa un encabezado seguro por defecto para identificadores desconocidos", () => {
    expect(renderApplicationShellHeader("unknown")).toContain(
      '<h1 id="page-title">Centro de mando</h1>',
    );
  });

  it("delega el enrutamiento al servidor", () => {
      expect(DASHBOARD_CLIENT_SCRIPT).not.toContain("initializeModulePage");
      expect(DASHBOARD_CLIENT_SCRIPT).not.toContain("visibleByModule");
      expect(DASHBOARD_CLIENT_SCRIPT).toContain(
        'if(moduleId==="cuenta")refreshAccount()',
      );
      expect(DASHBOARD_CLIENT_SCRIPT).toContain(
        "Implementación funcional pendiente",
      );
  });

  it("envía únicamente el contenido funcional del módulo solicitado", () => {
    const home = renderDashboardModuleView("inicio");
    expect(home).toContain('id="coin"');
    expect(home).not.toContain('id="mercado"');
    expect(home).not.toContain('id="cuenta"');

    const account = renderDashboardModuleView("cuenta");
    expect(account).toContain('id="cuenta"');
    expect(account).toContain('id="seguridad-cuenta"');
    expect(account).not.toContain('id="administracion"');
    expect(account).not.toContain('id="mercado"');
    expect(account).not.toContain('id="controles"');

    const market = renderDashboardModuleView("mercado");
    expect(market).toContain('id="mercado"');
    expect(market).toContain('id="coin"');
    expect(market).not.toContain('id="cuenta"');
    expect(market).not.toContain('id="administracion"');

    const security = renderDashboardModuleView("seguridad");
    expect(security).toContain('id="controles"');
    expect(security).toContain('id="auditoria"');
    expect(security).not.toContain('id="cuenta"');
    expect(security).not.toContain('id="administracion"');

    const operations = renderDashboardModuleView("operaciones");
    expect(operations).toContain('id="operaciones"');
    expect(operations).not.toContain('id="mercado"');
    expect(operations).not.toContain('id="cuenta"');

    const users = renderDashboardModuleView("usuarios");
    expect(users).toContain('id="administracion"');
    expect(users).not.toContain('id="cuenta"');
    expect(users).not.toContain('id="mercado"');
  });

  it("renderiza placeholders honestos en el servidor para módulos pendientes", () => {
    for (const moduleId of ["arbitraje", "monitor", "configuracion"]) {
      const view = renderDashboardModuleView(moduleId);
      expect(view).toContain('id="module-placeholder"');
      expect(view).toContain("Implementación funcional pendiente");
      expect(view).not.toContain('id="mercado"');
      expect(view).not.toContain('id="operaciones"');
      expect(view).not.toContain('id="administracion"');
    }
  });
});
