/**
 * @archivo vitest.d1.config.ts
 * @proposito Configurar pruebas de integración contra D1 local de Cloudflare.
 * @responsabilidades Ejecutar exclusivamente la suite de concurrencia con el runtime Workers y el binding D1 de Wrangler.
 * @dependencias @cloudflare/vitest-plugin, Vitest y wrangler.toml.
 * @seguridad Usa D1 local simulado por Miniflare; no se conecta a la base de datos remota.
 * @ubicacion Configuración de pruebas de integración del repositorio.
 */

import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: {
        configPath: "./wrangler.toml",
      },
    }),
  ],
  test: {
    include: ["tests/integration/p2p-operation-store.d1.test.ts"],
    testTimeout: 15_000,
  },
});
