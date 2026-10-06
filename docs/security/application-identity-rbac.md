# Identidad y control de acceso de la aplicación

## Objetivo

QvaPay-AI no expone módulos operativos públicamente. El acceso sigue una cadena server-side:

`Login → sesión firmada → usuario D1 → rol → autorización → módulo`.

La alineación con ISO/IEC 27001, ISO 9001 y principios de segregación de funciones es una referencia de diseño y no constituye certificación.

## Roles

| Rol | Consulta | Operaciones | Administración de usuarios |
|---|---:|---:|---:|
| Administration | Sí | Sí, según contrato existente | Sí |
| Auditor | Sí | No | No |

El navegador no puede elegir ni elevar su rol. La autorización se verifica en backend para cada frontera protegida.

## Credenciales

Las contraseñas se almacenan únicamente como verificadores PBKDF2-HMAC-SHA-256 con salt aleatorio y 120000 iteraciones. El secret `ACCOUNT_AUTH_SECRET` solo participa en el bootstrap inicial cuando la tabla de usuarios está vacía y en la firma de sesiones; su valor nunca se almacena en Git.

## Sesiones

La sesión usa una cookie `HttpOnly; Secure; SameSite=Strict` con TTL de ocho horas. El payload contiene el identificador del usuario y expiración; la firma HMAC se valida en servidor y el rol se obtiene nuevamente desde D1.

## Auditoría

Los eventos de login, logout, rechazo de sesión, denegación de autorización y cambios administrativos se registran en `security_audit_log`. El registro es append-only desde la aplicación: no existe endpoint operativo para borrarlo.

## Continuidad funcional

La capa de seguridad no modifica las reglas de mercado, scanner, arbitrage ni Account Center. Solo determina quién puede alcanzar cada módulo. El scanner 24/7 continúa ejecutándose mediante Durable Object Alarm independientemente de que exista una sesión de navegador.

## Bootstrap de Administration

Cuando D1 no contiene usuarios, un login válido contra `ACCOUNT_AUTH_SECRET` crea el primer usuario con rol Administration. Una vez creado, el flujo normal usa la identidad D1. El administrador debe crear las cuentas Auditor y Administration adicionales desde el módulo de Administración.

## Evidencia requerida antes de producción

1. Migración D1 aplicada.
2. Quality Gate verde.
3. Security Gate verde.
4. Root sin sesión muestra únicamente Login.
5. APIs operativas sin sesión devuelven 401/403 sin datos.
6. Administration puede crear y desactivar usuarios.
7. Auditor puede consultar pero recibe 403 ante mutaciones.
8. Scanner 24/7 mantiene sus ciclos después del cambio de control de acceso.
