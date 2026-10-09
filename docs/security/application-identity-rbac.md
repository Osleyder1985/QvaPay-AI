# Identidad y control de acceso de la aplicación

## Objetivo

QvaPay-AI no expone módulos operativos públicamente. El acceso sigue una cadena server-side:

`Login → sesión firmada → usuario D1 → rol → autorización → módulo`.

La alineación con ISO/IEC 27001, ISO 9001 y principios de segregación de funciones es una referencia de diseño y no constituye certificación.

## Roles

| Rol            | Consulta | Operaciones                  | Administración de usuarios |
| -------------- | -------- | ---------------------------- | -------------------------- |
| Administration | Sí       | Sí, según contrato existente | Sí                         |
| Auditor        | Sí       | No                           | No                         |

El navegador no puede elegir ni elevar su rol. La autorización se verifica en backend para cada frontera protegida.

## Credenciales

Las contraseñas se almacenan únicamente como verificadores PBKDF2-HMAC-SHA-256 con salt aleatorio y 100000 iteraciones. `ACCOUNT_AUTH_SECRET` participa en la firma de sesiones y permanece fuera del navegador. El primer usuario Administration se crea mediante el secret privado `INITIAL_ADMIN_BOOTSTRAP_TOKEN`, configurado por el propietario en GitHub Actions. El token no se imprime en logs, summaries, HTML ni respuestas de la aplicación; se invalida lógicamente cuando D1 deja de estar vacío.

## Sesiones

La sesión usa una cookie `HttpOnly; Secure; SameSite=Strict` con TTL de ocho horas. El payload contiene el identificador del usuario y expiración; la firma HMAC se valida en servidor y el rol se obtiene nuevamente desde D1.

## Auditoría

Los eventos de login, logout, rechazo de sesión, denegación de autorización y cambios administrativos se registran en `security_audit_log`. El registro es append-only desde la aplicación: no existe endpoint operativo para borrarlo.

## Continuidad funcional

La capa de seguridad no modifica las reglas de mercado, scanner, arbitrage ni Account Center. Solo determina quién puede alcanzar cada módulo. El scanner 24/7 continúa ejecutándose mediante Durable Object Alarm independientemente de que exista una sesión de navegador.

## Bootstrap de Administration

Cuando D1 no contiene usuarios, `/setup` permite iniciar la configuración inicial. El propietario utiliza el token de configuración de un solo uso generado por el despliegue y elige el nombre de usuario y la contraseña de la primera cuenta Administration. El endpoint rechaza el token cuando ya existe cualquier usuario. Una vez creado el primer usuario, `/setup` deja de estar disponible y el flujo normal usa la identidad D1. El administrador debe crear las cuentas Auditor y Administration adicionales desde el módulo de Administración.

## Evidencia requerida antes de producción

1. Migración D1 aplicada.
2. Quality Gate verde.
3. Security Gate verde.
4. Root sin sesión muestra únicamente Login.
5. APIs operativas sin sesión devuelven 401/403 sin datos.
6. Administration puede crear y desactivar usuarios.
7. Auditor puede consultar pero recibe 403 ante mutaciones.
8. Scanner 24/7 mantiene sus ciclos después del cambio de control de acceso.

## Smoke de autenticación en producción

El despliegue productivo no depende de una cuenta humana preexistente ni modifica sus credenciales. El smoke crea una cuenta Administration efímera con prefijo `ci-smoke-`, valida el flujo completo de login, sesión, autorización y Account Center, y la elimina mediante el token interno de bootstrap al finalizar el job. La cuenta temporal no forma parte del inventario operativo.
