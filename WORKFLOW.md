# Nuestro Workflow de Desarrollo Colaborativo

Este documento describe nuestro método de trabajo para el desarrollo del proyecto AquaClean Car Wash. El objetivo es mantener un ritmo eficiente, minimizar errores y asegurar que ambos estemos siempre sincronizados.

## Principios Fundamentales

1.  **Un Archivo a la Vez (One-File-Flow):** El núcleo de nuestro workflow. La IA proporcionará el código completo para **un único archivo** a la vez. Esto nos permite implementar, probar y depurar de forma aislada y controlada antes de pasar a la siguiente pieza del puzle.

2.  **Código Siempre Completo:** Nunca se proporcionarán fragmentos, "diffs" o instrucciones parciales. Cada bloque de código corresponderá al **contenido 100% actualizado y completo del archivo** en cuestión.

3.  **El Contexto es la Única Fuente de Verdad:** La sesión siempre comenzará con un prompt detallado que incluye el estado actual del proyecto y el código completo. La IA basará **todas sus respuestas y código únicamente en este contexto**, sin hacer suposiciones sobre el `schema.prisma` u otras partes del código que no estén explícitamente proporcionadas.

4.  **Pasos Claros y Definidos:** Cada acción estará precedida por un análisis y seguida de instrucciones claras:
    - **Análisis:** Se explicará qué vamos a hacer y por qué.
    - **Código:** Se proporcionará el bloque de código completo.
    - **Guía de Pruebas:** Cuando sea aplicable, se incluirá una guía detallada para verificar que la nueva funcionalidad se ha implementado correctamente.

5.  **Ciclo de Feedback Estricto:** El flujo de trabajo es un diálogo constante:
    - **IA:** Proporciona el código para el Archivo N.
    - **Desarrollador:** Implementa el código.
    - **Desarrollador:** Si hay un error de compilador o de ejecución, proporciona el **mensaje de error exacto y completo**.
    - **IA:** Analiza el error y proporciona una versión corregida del Archivo N.
    - **Desarrollador:** Confirma que el error se ha solucionado.
    - **IA:** Procede a proporcionar el código para el Archivo N+1.

6.  **Commits y Documentación como Hitos:** Al completar una funcionalidad significativa (ej: "Flujo de Reserva", "Planning Visual"), haremos una pausa para:
    - **Realizar un `git commit`** con un mensaje descriptivo.
    - **Actualizar la documentación** (`ROADMAP.md`, `README.md`, especificaciones en `docs/features/`) para que refleje el nuevo estado del proyecto.

---

### Ejemplo de Flujo de Trabajo Típico

1.  **Inicio:** El desarrollador inicia la conversación con un prompt que incluye el `WORKFLOW.md`, el resumen de la sesión anterior y el estado actual del código del proyecto.
2.  **IA:** Confirma la asimilación del contexto y propone el primer archivo a modificar (ej: `apps/server/api/example.routes.ts`). Proporciona el código completo.
3.  **Desarrollador:** Implementa y confirma que todo está OK.
4.  **IA:** Proporciona el siguiente archivo (ej: `apps/client/pages/ExamplePage.tsx`).
5.  **Desarrollador:** Implementa el código pero recibe un error de TypeScript en VS Code.
6.  **Desarrollador:** Copia y pega el error completo en el chat.
7.  **IA:** Analiza el error, se disculpa, explica la causa y proporciona una versión corregida y completa de `apps/client/pages/ExamplePage.tsx`.
8.  **Desarrollador:** Confirma que la corrección funciona y completa la guía de pruebas.
9.  **IA:** Reconoce la finalización de la funcionalidad y sugiere un mensaje de `git commit` y las actualizaciones de documentación pertinentes.
