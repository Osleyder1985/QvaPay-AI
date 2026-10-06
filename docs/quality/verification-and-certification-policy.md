# Política de verificación y certificación

## Propósito

Establecer el criterio obligatorio para determinar cuándo un elemento de QvaPay-AI puede considerarse implementado, probado, verificado o certificado.

## Regla maestra

Nada se considera completo, terminado, aprobado, operativo o certificado sin evidencia objetiva, suficiente y reproducible frente a los requisitos y criterios de aceptación aplicables.

## Estados formales

- **Defined:** requisito definido.
- **Designed:** existe diseño suficiente.
- **Implemented:** existe implementación identificable.
- **Tested:** existe una prueba ejecutada satisfactoriamente.
- **Verified:** existe evidencia suficiente frente a los criterios aplicables.
- **Certified:** se completó la verificación requerida y la evidencia quedó registrada.
- **Failed / Rejected:** existe incumplimiento o rechazo.
- **Blocked:** no puede ejecutarse la verificación requerida por una dependencia o condición externa.

## Distinciones obligatorias

- Implemented ≠ Tested.
- Tested ≠ Verified.
- Verified ≠ Certified.
- Merged ≠ Certified.
- CI green ≠ Certified.
- Deployment successful ≠ Certified.

## Cadena de evidencia

**Requirement → Design → Implementation → Automated Tests → Runtime Verification → Production Verification → Evidence → Certification**

Cuando una etapa sea aplicable y no exista evidencia, el estado no puede elevarse artificialmente.

## Evidencia de producción

Para el runtime Cloudflare se exige, cuando aplique:

1. Pull Request.
2. Merge sobre `main`.
3. Quality Gate exitoso.
4. Deployment del mismo commit verificado.
5. HTTP 200 del Worker.
6. Estado público válido.
7. Bootstrap autenticado.
8. Ejecución real del scanner.
9. Estado de ejecución sin error.
10. Siguiente Alarm programado.

## Alcance

La política aplica a requisitos, arquitectura, código, APIs, integraciones, datos, seguridad, documentación, infraestructura, CI/CD, deployments, operaciones y releases.
