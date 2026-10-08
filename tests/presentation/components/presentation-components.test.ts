import { describe, expect, it } from "vitest";
import { renderAlert } from "../../../src/presentation/components/alert.js";
import { renderDataTable } from "../../../src/presentation/components/data-table.js";
import { renderMetricCard } from "../../../src/presentation/components/metric-card.js";
import { renderStatusPanel } from "../../../src/presentation/components/status-panel.js";

describe("componentes de presentación", () => {
  it("escapa contenido dinámico de tarjetas y tablas", () => {
    expect(
      renderMetricCard("<Métrica>", "<valor>", "ready"),
    ).not.toContain("<Métrica>");

    const table = renderDataTable(
      "Tabla",
      [{ key: "value", label: "Valor" }],
      [{ id: "<row>", cells: { value: "<valor>" } }],
    );
    expect(table).not.toContain("<row>");
  });

  it("expone el estado y sus límites de interacción", () => {
    const panel = renderStatusPanel("error", "Mercado", "No disponible");
    expect(panel).toContain("No disponible");
    expect(panel).toContain("La interacción con datos está limitada");
  });

  it("usa roles coherentes con la severidad", () => {
    expect(renderAlert("warning", "Aviso", "Revisar")).toContain(
      'role="alert"',
    );
    expect(renderAlert("info", "Info", "Disponible")).toContain(
      'role="status"',
    );
  });
});
