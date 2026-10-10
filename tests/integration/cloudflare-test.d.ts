/**
 * @archivo tests/integration/cloudflare-test.d.ts
 * @proposito Declarar el binding tipado usado por las pruebas Cloudflare Workers.
 * @responsabilidades Permitir que TypeScript valide la suite que el pool de Workers resuelve en ejecución.
 * @dependencias Tipos oficiales de D1 de Cloudflare Workers.
 * @seguridad Solo declara tipos de prueba; no configura credenciales ni conexiones remotas.
 * @ubicacion Declaraciones de tipos para pruebas de integración.
 */

declare module "cloudflare:test" {
  export const env: {
    DB: import("@cloudflare/workers-types").D1Database;
  };
}
