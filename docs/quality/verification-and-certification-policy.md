# Verification and Certification Policy

## Propósito

Establecer la regla transversal que determina cuándo un elemento de QvaPay-AI puede considerarse terminado, verificado o certificado.

Esta política aplica a todo el proyecto y prevalece sobre cualquier interpretación informal de estado basada únicamente en la existencia de código, documentación, un Pull Request, un merge, un pipeline exitoso o un deployment.

## Regla maestra

**Nada en QvaPay-AI se considerará completo, terminado, correcto, listo, aprobado, operativo o certificado hasta que exista evidencia objetiva, suficiente y reproducible de que cumple los requisitos y criterios de aceptación aplicables.**

La ausencia de evidencia impide la certificación.

## Estados del ciclo de vida

| Estado | Significado |
|---|---|
| **Defined** | El elemento está definido y tiene alcance identificable. |
| **Designed** | Existe un diseño o decisión técnica suficiente para implementarlo. |
| **Implemented** | Existe una implementación identificable. |
| **Tested** | Se ejecutaron pruebas aplicables. |
| **Verified** | Las pruebas o comprobaciones produjeron evidencia satisfactoria frente a los criterios definidos. |
| **Certified** | Se completó la verificación requerida para el nivel del elemento y la evidencia quedó registrada. |
| **Failed / Rejected** | La evidencia demuestra incumplimiento o el elemento fue rechazado. |
| **Blocked** | La verificación requerida no puede ejecutarse por una dependencia o condición externa; no implica conformidad. |

Los estados no son equivalentes.

En particular:

- **Implemented ≠ Tested**
- **Tested ≠ Verified**
- **Verified ≠ Certified**
- **Merged ≠ Certified**
- **CI green ≠ Certified**
- **Deployment successful ≠ Certified**

## Cadena de evidencia

Para los elementos que lo requieran, la trazabilidad deberá cubrir:

```text
Requirement
    ↓
Design
    ↓
Implementation
    ↓
Automated Tests
    ↓
Integration / Contract Tests
    ↓
Runtime Verification
    ↓
Production Verification
    ↓
Evidence
    ↓
Certification
```

No todas las etapas son obligatorias para todos los elementos. La matriz de trazabilidad deberá identificar cuáles son aplicables.

## Reglas de certificación

Un elemento solamente podrá pasar a **Certified** cuando:

1. sus requisitos aplicables estén identificados;
2. sus criterios de aceptación estén definidos;
3. exista una implementación o artefacto verificable cuando corresponda;
4. se hayan ejecutado las pruebas aplicables;
5. las pruebas hayan producido resultados satisfactorios;
6. se haya realizado la verificación adicional requerida por el nivel del elemento;
7. las dependencias externas relevantes hayan sido comprobadas o estén formalmente fuera de alcance;
8. la evidencia sea suficiente para reproducir o auditar la conclusión;
9. la evidencia esté vinculada a la versión, commit, entorno o artefacto evaluado;
10. no existan fallos abiertos que invaliden los criterios de aceptación.

## Evidencia mínima

Cuando sea aplicable, la evidencia deberá registrar:

- Requirement ID;
- criterio de aceptación;
- versión o commit;
- entorno;
- prueba o procedimiento ejecutado;
- fecha/hora;
- resultado;
- artefacto, log, reporte o referencia verificable;
- estado final;
- responsable o mecanismo que realizó la verificación.

No se deben registrar secretos, tokens ni credenciales como evidencia.

## Niveles de verificación

### Requisitos

La definición y trazabilidad no demuestran que el requisito esté implementado o funcionando.

### Código y componentes

El análisis estático y las pruebas unitarias demuestran propiedades concretas, pero no sustituyen las verificaciones de integración o runtime que sean necesarias.

### Integraciones externas

Las afirmaciones sobre comportamiento de QvaPay deberán distinguir entre:

- documentación publicada;
- contrato documentado;
- prueba de contrato;
- integración real;
- verificación en producción.

La documentación de un proveedor no constituye por sí sola evidencia de funcionamiento de nuestra implementación.

### Infraestructura y deployment

Un deployment exitoso demuestra que el artefacto pudo desplegarse. La certificación requiere además verificar el comportamiento esperado en el entorno correspondiente.

### Releases

Una release solamente podrá certificarse cuando sus requisitos y criterios de aceptación aplicables tengan evidencia suficiente y trazable.

## Bloqueos

Si una verificación requiere acceso, credenciales, un entorno, un proveedor externo o cualquier otra dependencia que no esté disponible, el estado será **Blocked**.

No se convertirá un bloqueo en **Verified** o **Certified** mediante una suposición.

## Auditoría y trazabilidad

La matriz de trazabilidad es el registro transversal para relacionar:

```text
Requirement
→ Objective / Source
→ System Requirement
→ Software Requirement
→ Architecture / Design
→ Implementation
→ Test
→ Verification Evidence
→ Certification
```

Cada cambio relevante deberá mantener esta cadena actualizada.

## Aplicación obligatoria

Esta política aplica a:

- requisitos;
- arquitectura;
- diseño;
- código;
- componentes;
- APIs;
- integraciones;
- datos;
- seguridad;
- documentación técnica;
- infraestructura;
- CI/CD;
- deployments;
- operaciones;
- migraciones;
- releases.

No existe una excepción implícita por tratarse de documentación, infraestructura o un cambio aparentemente pequeño.

## Definition of Done

Para QvaPay-AI, "Done" significa que el elemento ha alcanzado el estado requerido por sus criterios de aceptación y que existe evidencia suficiente para justificar ese estado.

Cuando la certificación sea un requisito aplicable, **Done = Certified**.

Si todavía falta evidencia, el trabajo debe permanecer en el estado correspondiente y no presentarse como terminado.
