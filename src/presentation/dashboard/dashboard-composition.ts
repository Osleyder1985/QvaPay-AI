/**
 * @archivo src/presentation/dashboard/dashboard-composition.ts
 * @proposito Define la composición pública del módulo Dashboard.
 * @responsabilidades Mantener juntos los recursos de presentación sin depender de Cloudflare ni HTTP.
 * @ubicacion src/presentation/dashboard dentro de la arquitectura de QvaPay-AI.
 */

import { DASHBOARD_CLIENT_SCRIPT } from "./dashboard-client.js";
import { DASHBOARD_STYLES } from "./dashboard-styles.js";
import { renderDashboardView } from "./dashboard-view.js";

export interface DashboardComposition {
  readonly styles: string;
  readonly body: string;
  readonly script: string;
}

export const DASHBOARD_COMPOSITION: DashboardComposition = {
  styles: DASHBOARD_STYLES,
  body: renderDashboardView(),
  script: DASHBOARD_CLIENT_SCRIPT,
};
