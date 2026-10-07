# Norma de documentación del código fuente

## Propósito

Establecer una documentación estructural mínima, verificable y mantenible para el código fuente de QvaPay-AI, de modo que una persona desarrolladora cualificada pueda comprender y modificar un módulo sin reconstruir desde cero su propósito, límites y restricciones.

## Alcance

La norma aplica al código mantenido bajo `src/`, excepto declaraciones generadas `*.d.ts`. Los artefactos generados, dependencias externas y código generado por herramientas no se documentan mediante comentarios manuales.

## Encabezado obligatorio de archivo

Todo archivo aplicable debe comenzar con un bloque JSDoc en español que incluya como mínimo:

- `@archivo`: ruta lógica del archivo.
- `@proposito`: propósito funcional.
- `@responsabilidades`: responsabilidades principales y límites.
- `@ubicacion`: ubicación dentro de la arquitectura.

Los archivos críticos deben incluir además:

- `@dependencias`: dependencias e integraciones relevantes.
- `@seguridad`: credenciales, autorización, datos sensibles, límites o supuestos de seguridad.
- `@superficie-publica`: exports o interfaces que otros módulos consumen.
- `@mantenimiento`: referencia controlada a la documentación, contrato o requisito que debe mantenerse alineado.

Los identificadores técnicos, rutas, nombres de librerías, API externas, estados persistidos y contratos externos permanecen en su forma técnica cuando sea necesario.

## Archivos críticos

El control determinista exige actualmente el conjunto crítico inicial:

- `src/application/scanner-runtime.ts`
- `src/domain/market.ts`
- `src/domain/offer.ts`
- `src/infrastructure/qvapay/qvapay-account-client.ts`
- `src/infrastructure/qvapay/qvapay-p2p-client.ts`
- `src/infrastructure/qvapay/p2p-mapper.ts`

Este conjunto es el primer bloque obligatorio y deberá ampliarse cuando se incorporen nuevos componentes críticos o cuando una revisión arquitectónica determine que otro archivo debe quedar sujeto al mismo nivel.

## Funciones, métodos y clases

Las funciones, clases y métodos públicos, no triviales, sensibles o vinculados a reglas de negocio deben documentar su contrato mediante TSDoc/JSDoc cuando el significado no sea evidente únicamente por el tipo.

La documentación debe cubrir, según corresponda:

- propósito y comportamiento;
- parámetros;
- valor de retorno;
- efectos secundarios;
- errores relevantes;
- requisitos de seguridad;
- invariantes y reglas de negocio.

No se exige comentar cada línea ni repetir información que ya sea inequívoca en el tipo o en el nombre.

## Historial y mantenimiento

Git es la fuente autoritativa del historial detallado. El encabezado `@mantenimiento` no duplica commits ni changelogs: identifica la documentación, contrato o requisito que debe permanecer sincronizado con el archivo.

Los cambios estructurales deben quedar trazables mediante Issue, Pull Request y, cuando corresponda, ADR o Solution Card.

## Verificación automática

El control se ejecuta mediante:

```text
npm run check:code-docs
```

El Quality Gate ejecuta este control antes de aceptar el cambio. El comprobador:

1. recorre el código TypeScript mantenido bajo `src/`;
2. excluye `*.d.ts`;
3. valida los cuatro marcadores base de todos los archivos aplicables;
4. valida los ocho marcadores de los archivos críticos;
5. verifica que las funciones y clases exportadas con comportamiento tengan TSDoc/JSDoc inmediatamente antes de su declaración;
6. informa cada incumplimiento de forma determinista y no usa excepciones silenciosas.

El comprobador es estructural; no sustituye una revisión semántica humana de la calidad de la documentación.

## Criterio de aceptación

Un cambio de código documentable no se considera completo si introduce un archivo aplicable sin encabezado o una API de comportamiento exportada sin documentación exigible. La ampliación del conjunto crítico y la revisión semántica forman parte del mantenimiento continuo de esta norma.
