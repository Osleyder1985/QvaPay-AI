# Política de verificación y certificación

## Propósito

Establecer el criterio obligatorio para determinar cuándo un elemento de QvaPay-AI puede considerarse implementado, probado, verificado o certificado.

## Regla maestra

Nada se considerará completo, terminado, aprobado, operativo o certificado hasta disponer de evidencia objetiva, suficiente y reproducible frente a los requisitos y criterios de aceptación aplicables.

## Estados

- **Defined:** requisito definido y aprobado para su evolución.
- **Designed:** existe diseño suficiente.
- **Implemented:** existe implementación identificable.
- **Tested:** existe una prueba ejecutada con resultado satisfactorio.
- **Verified:** existe evidencia suficiente frente a los criterios aplicables.
- **Certified:** se completó la verificación requerida y la evidencia quedó registrada.
- **Failed / Rejected:** la evidencia demuestra incumplimiento o el elemento fue rechazado.
- **Blocked:** la verificación requerida no puede ejecutarse por una dependencia o condición externa.

## Distinciones obligatorias

- Implemented ≠ Tested.
- Tested ≠ Verified.
- Verified ≠ Certified.
- Merged ≠ Certified.
- CI green ≠ Certified.
- Deployment successful ≠ Certified.

## Cadena de evidencia

Requirement → Design → Implementation → Automated Tests → Integration / Contract Tests → Runtime Verification → Production Verification → Evidence → Certification.

## Regla de cierre

Cuando la certificación sea aplicable, Done significa Certified. Un estado inferior debe conservarse explícitamente cuando falte evidencia.

## Trazabilidad

Cada estado deberá poder relacionarse con un requisito, implementación, prueba y evidencia verificable. La matriz de trazabilidad es el registro transversal de esta relación.

## Auditoría

Esta política se aplica a requisitos, arquitectura, diseño, código, APIs, integraciones, datos, seguridad, documentación, infraestructura, CI/CD, despliegues, operaciones, migraciones y releases.