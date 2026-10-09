# Norma de formato del repositorio: Prettier 3.9.9

**Estado:** norma de trabajo para cambios nuevos y existentes
**Herramienta fijada:** Prettier `3.9.9` (dependencia de desarrollo declarada en `package.json`)
**Configuración del proyecto:** `.prettierrc.json`
**Idioma de este documento:** español

## 1. Objetivo y regla obligatoria de trabajo

Prettier es la autoridad de formato del repositorio. Antes de crear o modificar cualquier archivo que Prettier pueda procesar, se debe consultar la configuración vigente y escribir o editar el contenido conforme a ella. No se debe confiar únicamente en el formato manual ni dejar el ajuste para una futura tarea.

Flujo obligatorio:

1. Leer `package.json`, `.prettierrc.json` y, si existen, `.editorconfig`, `.prettierignore` y las reglas `overrides` aplicables.
2. Confirmar la versión fijada en el proyecto: `prettier@3.9.9`. No sustituirla por una versión global ni por una versión flotante.
3. Al crear un archivo, redactarlo desde el principio según las reglas aplicables; antes de finalizar, ejecutar Prettier sobre ese archivo.
4. Al modificar un archivo, conservar su comportamiento y sus contratos, aplicar el cambio y ejecutar Prettier sobre el archivo completo. No reformatear archivos ajenos al cambio sin necesidad.
5. Revisar el diff después del formateo para comprobar que el cambio no alteró lógica, contenido embebido, cadenas, plantillas, documentación normativa ni requisitos certificados.
6. Ejecutar `npm run format:check` y los demás controles de calidad pertinentes. No declarar el trabajo terminado ni fusionar un PR mientras el control obligatorio de formato falle.
7. Si el formato entra en conflicto con una plantilla, un bloque embebido o un requisito funcional, investigar el caso. Usar una excepción local `prettier-ignore` solo cuando sea necesaria, limitada y documentada; nunca desactivar globalmente el control para ocultar un fallo.
8. En la descripción del PR o en la evidencia de trabajo, indicar qué comprobaciones se ejecutaron y sus resultados reales. No afirmar que pasaron sin evidencia.

Comandos recomendados:

```sh
# Ver la versión instalada
npx prettier --version

# Formatear solo los archivos del cambio
npx prettier --write ruta/al/archivo.ts ruta/al/otro-archivo.md

# Comprobar esos archivos sin modificarlos
npx prettier --check ruta/al/archivo.ts ruta/al/otro-archivo.md

# Control completo definido por el repositorio
npm run format:check
```

El comando `npm run format` ejecuta `prettier --write .` y puede cambiar muchos archivos; no se debe usar a ciegas en un cambio pequeño. Preferir `npx prettier --write <archivos-del-cambio>` y revisar el diff.

## 2. Configuración efectiva actual de QvaPay-AI

La configuración actual de `.prettierrc.json` declara expresamente estas opciones:

- **Opción:** `semi`; **Valor efectivo:** `true`; **Aplicación:** Usar punto y coma al final de las sentencias cuando corresponda.
- **Opción:** `singleQuote`; **Valor efectivo:** `false`; **Aplicación:** Preferir comillas dobles en cadenas JavaScript/TypeScript; la elección puede variar cuando otra clase de comilla evita escapes.
- **Opción:** `trailingComma`; **Valor efectivo:** `"all"`; **Aplicación:** Añadir comas finales donde la sintaxis lo permita, incluidos parámetros y argumentos multilínea.

Las opciones no declaradas se rigen por los valores predeterminados de Prettier 3.9.9, salvo que una configuración aplicable de editor, una regla `overrides` o una opción de ejecución las sustituya. La configuración local del repositorio es la referencia principal: no inventar reglas adicionales ni asumir que las preferencias personales reemplazan esta configuración.

El script de control del proyecto es:

```json
"format:check": "prettier --check .",
"format": "prettier --write ."
```

Por tanto, el control examina los archivos que Prettier descubre en el repositorio y que no estén excluidos por sus reglas de ignorado. No cambiar el alcance de ese control como solución rápida a un error de formato.

## 3. Catálogo de opciones de formato de Prettier 3.9.9

Esta sección resume las opciones públicas de configuración más relevantes de Prettier, sus valores predeterminados y su significado. La columna «predeterminado» describe Prettier; no implica que el repositorio haya fijado expresamente ese valor. Para detalles de compatibilidad y cambios de versión, consultar la documentación oficial enlazada al final.

### 3.1. Ancho, indentación y estructura

- **Opción:** `printWidth`; **Predeterminado:** `80`; **Regla:** Ancho objetivo de línea; no es un límite rígido. Prettier puede superar el ancho cuando la sintaxis o la legibilidad lo requieren.
- **Opción:** `tabWidth`; **Predeterminado:** `2`; **Regla:** Número de espacios por nivel de indentación.
- **Opción:** `useTabs`; **Predeterminado:** `false`; **Regla:** Usar espacios, no tabuladores, para indentar.
- **Opción:** `semi`; **Predeterminado:** `true`; **Regla:** Añadir punto y coma al final de sentencias cuando corresponda. **El repositorio lo fija en `true`.**
- **Opción:** `trailingComma`; **Predeterminado:** `"all"`; **Regla:** Comas finales en estructuras multilínea donde la sintaxis las admite. **El repositorio lo fija en `"all"`.**
- **Opción:** `bracketSpacing`; **Predeterminado:** `true`; **Regla:** Espacios dentro de llaves de objetos: `{ clave: valor }`.
- **Opción:** `bracketSameLine`; **Predeterminado:** `false`; **Regla:** Mantener el cierre de etiquetas JSX/HTML multilínea en su propia línea cuando corresponda.
- **Opción:** `objectWrap`; **Predeterminado:** `"preserve"`; **Regla:** Conservar el salto de línea inicial de un literal de objeto cuando exista; `"collapse"` permite compactarlo si cabe.
- **Opción:** `singleAttributePerLine`; **Predeterminado:** `false`; **Regla:** No forzar por defecto un atributo por línea en HTML, Vue y JSX.
- **Opción:** `arrowParens`; **Predeterminado:** `"always"`; **Regla:** Mantener paréntesis alrededor del parámetro de una función flecha, por ejemplo `(x) => x`.

### 3.2. Comillas y propiedades

- **Opción:** `singleQuote`; **Predeterminado:** `false`; **Regla:** Preferir comillas dobles en JavaScript/TypeScript. **El repositorio lo fija en `false`.**
- **Opción:** `jsxSingleQuote`; **Predeterminado:** `false`; **Regla:** Preferir comillas dobles en atributos JSX.
- **Opción:** `quoteProps`; **Predeterminado:** `"as-needed"`; **Regla:** Entrecomillar nombres de propiedades solo cuando sea necesario. También admite `"consistent"` y `"preserve"`.

La elección de comillas no debe hacerse mediante sustituciones de texto ciegas: las comillas pueden tener significado dentro de cadenas, expresiones regulares, HTML, JSX y plantillas.

### 3.3. Selección de archivos y análisis sintáctico

- **Opción:** `parser`; **Predeterminado:** Inferido por extensión; **Regla:** No establecerlo globalmente; Prettier debe detectar el analizador por el tipo de archivo. Si un archivo necesita un analizador especial, configurarlo de forma acotada mediante `overrides`.
- **Opción:** `filepath` / `--stdin-filepath`; **Predeterminado:** Ninguno; **Regla:** En entradas por stdin, indicar la ruta real para que Prettier infiera el analizador correcto. Es una opción de CLI/API, no una regla general del archivo de configuración.
- **Opción:** `rangeStart`; **Predeterminado:** `0`; **Regla:** Inicio del rango opcional que se desea formatear.
- **Opción:** `rangeEnd`; **Predeterminado:** `Infinity`; **Regla:** Fin del rango opcional. En el flujo normal del repositorio se formatea el archivo completo, no un rango parcial.
- **Opción:** `requirePragma`; **Predeterminado:** `false`; **Regla:** No exigir un comentario `@prettier` o `@format` para procesar un archivo.
- **Opción:** `insertPragma`; **Predeterminado:** `false`; **Regla:** No insertar automáticamente un marcador `@format`.
- **Opción:** `checkIgnorePragma`; **Predeterminado:** `false`; **Regla:** No excluir automáticamente archivos por comentarios `@noprettier` o `@noformat`, salvo que se active expresamente.
- **Opción:** `plugins`; **Predeterminado:** Ninguno adicional; **Regla:** No agregar plugins sin justificar su necesidad y fijar su dependencia/versionado. Los plugins pueden cambiar los analizadores y el resultado del formato.

Prettier elige automáticamente el analizador para los tipos de archivo que reconoce. No se debe fijar `parser` globalmente porque eso puede hacer que archivos de otros tipos se interpreten incorrectamente.

### 3.4. Texto, Markdown y documentos

- **Opción:** `proseWrap`; **Predeterminado:** `"preserve"`; **Regla:** En prosa, conservar el ajuste de línea existente por defecto. También admite `"always"` y `"never"`.
- **Opción:** `embeddedLanguageFormatting`; **Predeterminado:** `"auto"`; **Regla:** Formatear automáticamente código embebido cuando Prettier pueda identificarlo.
- **Opción:** `endOfLine`; **Predeterminado:** `"lf"`; **Regla:** Usar finales de línea LF. Puede verse afectado por una configuración `.editorconfig` aplicable.
- **Opción:** `htmlWhitespaceSensitivity`; **Predeterminado:** `"css"`; **Regla:** Respetar la sensibilidad de espacios en blanco de HTML según las reglas CSS. También admite `"strict"` y `"ignore"`.
- **Opción:** `vueIndentScriptAndStyle`; **Predeterminado:** `false`; **Regla:** No indentar adicionalmente por defecto el contenido de las etiquetas `<script>` y `<style>` en archivos Vue.

En Markdown, conservar la estructura semántica: encabezados, listas, tablas, enlaces, bloques de código y front matter cuando exista. El formateo no autoriza a cambiar el significado de la documentación, los requisitos, las decisiones arquitectónicas ni los comentarios normativos.

### 3.5. Opciones experimentales

- **Opción:** `experimentalTernaries`; **Predeterminado:** `false`; **Regla:** No activar el formato experimental de ternarios sin una decisión de proyecto.
- **Opción:** `experimentalOperatorPosition`; **Predeterminado:** `"end"`; **Regla:** En expresiones multilínea, mantener el comportamiento predeterminado de los operadores al final de la línea anterior.

No activar opciones experimentales de forma incidental. Un cambio de estilo global requiere revisar el impacto en el repositorio, documentar el motivo y validar el diff completo.

### 3.6. Opciones específicas de sintaxis

Algunas opciones solo afectan a determinados lenguajes o formatos; no todas se aplican a TypeScript. Prettier puede ofrecer opciones específicas para Angular, CSS, Flow, GraphQL, HTML, JSON, JSX, Markdown, TypeScript, Vue, YAML y otros analizadores admitidos. Entre ellas se encuentran, según el formato y la versión, opciones para el orden o formato de atributos, saltos de línea en etiquetas, sintaxis de CSS, formato de elementos de listas, comentarios, decoradores o lenguaje embebido.

Reglas para estas opciones:

- No introducir una opción específica sin confirmar que Prettier 3.9.9 la admite para el analizador y tipo de archivo afectado.
- Si se necesita una diferencia por tipo de archivo, usar `overrides` con un patrón de archivo concreto, en lugar de alterar el formato global.
- No copiar configuraciones de versiones antiguas de Prettier: algunas opciones cambian, se renombran o se eliminan entre versiones mayores.
- Consultar la documentación de la versión fijada cuando se requiera el inventario completo de opciones de un analizador específico.

## 4. Reglas prácticas para escribir y modificar código

### TypeScript y JavaScript

- Aplicar punto y coma y comillas según la configuración efectiva.
- Mantener comas finales en estructuras multilínea donde la sintaxis las permita.
- Dejar que Prettier decida los saltos de línea y el espaciado; no comprimir expresiones complejas solo para reducir líneas.
- No usar el formateador para resolver errores de TypeScript, lint, pruebas o diseño: son controles diferentes.
- Revisar especialmente funciones, imports, objetos de configuración, tipos, genéricos, expresiones asíncronas y bloques de control después de formatear.

### Pruebas

- Aplicar las mismas reglas de formato que al código de producción.
- No modificar el significado, las aserciones, los datos de prueba ni la cobertura al resolver un fallo de formato.
- Tras el formato, comprobar el diff y ejecutar las pruebas pertinentes.

### JSON y configuración

- Mantener JSON válido, comillas dobles y la estructura que exija el formato.
- No añadir comentarios ni comas finales a JSON estricto si el analizador no los permite.
- No cambiar la configuración de Prettier para hacer que un archivo mal formado pase inadvertidamente.

### HTML, JSX y plantillas embebidas

- Verificar los atributos, el anidamiento y la semántica después del formato.
- En cadenas de plantilla que contienen HTML/JavaScript para entrega literal, confirmar si Prettier intenta formatear el lenguaje embebido.
- Usar una excepción `prettier-ignore` únicamente si el formato automático altera contenido cuyo espaciado es semánticamente significativo o rompe una plantilla; explicar por qué y mantener el alcance mínimo.
- No añadir `prettier-ignore` como respuesta automática a un error de CI.

### Markdown y documentación

- Mantener coherencia en encabezados, listas, tablas y cercado de código.
- No reescribir requisitos certificados ni alterar contenido normativo solo para mejorar el estilo.
- El contenido documental del repositorio debe seguir en español conforme a las reglas de gobernanza del proyecto; los nombres de archivos y títulos técnicos pueden mantenerse en inglés cuando así lo exija la convención del repositorio.

## 5. Resolución de errores de formato en CI

Si `npm run format:check` falla:

1. Leer todos los archivos que Prettier enumera como incorrectos.
2. Confirmar que el cambio usa Prettier 3.9.9 y la configuración del repositorio.
3. Ejecutar `npx prettier --write <lista-exacta-de-archivos>`.
4. Inspeccionar el diff para detectar cambios de contenido inesperados.
5. Ejecutar `npx prettier --check <lista-exacta-de-archivos>`.
6. Ejecutar `npm run format:check` para verificar el alcance completo.
7. Repetir los controles de build, lint y pruebas que correspondan.
8. Informar resultados basados en salidas reales. Si algún control no se pudo ejecutar, declarar explícitamente que está pendiente.

No eliminar archivos del alcance, no reducir la cobertura del script y no cambiar las reglas de formato únicamente para conseguir una CI verde.

## 6. Gestión de cambios a esta norma

Cualquier modificación de `.prettierrc.json`, de la versión de Prettier, de los scripts de formato o de las exclusiones debe:

- explicar el motivo técnico y el impacto esperado;
- documentar la justificación normativa/arquitectónica aplicable antes de implementar el cambio;
- incluir una revisión del impacto sobre código, pruebas, documentos y automatizaciones;
- ejecutar el control completo de formato y los demás controles afectados;
- actualizar este documento en el mismo cambio;
- no cambiar requisitos ya validados o certificados sin autorización explícita y una razón documentada.

## 7. Referencias oficiales

- [Opciones de Prettier](https://prettier.io/docs/options.html): opciones, valores válidos y valores predeterminados.
- [Archivo de configuración](https://prettier.io/docs/configuration): precedencia y formatos de configuración.
- [CLI de Prettier](https://prettier.io/docs/cli.html): comandos `--write`, `--check`, exclusiones y opciones de ejecución.
- [Filosofía de opciones](https://prettier.io/docs/option-philosophy): por qué Prettier mantiene un conjunto limitado de opciones.

Estas referencias describen el comportamiento oficial de Prettier. Ante una diferencia entre la documentación general y el proyecto, prevalece la configuración comprobada de Prettier 3.9.9 instalada y fijada en este repositorio, junto con las reglas de gobernanza aprobadas.
