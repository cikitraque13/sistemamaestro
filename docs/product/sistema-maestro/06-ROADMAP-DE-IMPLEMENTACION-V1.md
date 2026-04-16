\# 06 — Roadmap de Implementación V1



\## 1. Función de esta pieza



Este documento traduce la arquitectura de producto de Sistema Maestro V2 a una secuencia de implementación real.



No define solo deseos.

Define orden, dependencias, prioridad y criterio de ejecución.



Su objetivo es impedir:



\- improvisación

\- mezcla de capas

\- inflación de tareas

\- cambios prematuros en pricing o UI

\- deuda estructural por querer implementar demasiado a la vez



\---



\## 2. Principio rector



Sistema Maestro debe implementarse en capas.



No se debe construir primero lo más vistoso.

Se debe construir primero lo que garantice:



\- continuidad real

\- estructura estable

\- monetización coherente

\- ejecución sin fricción

\- capacidad de crecer sin rehacer el sistema



\---



\## 3. Secuencia maestra de implementación



La secuencia correcta es esta:



1\. Consolidación documental y doctrinal

2\. Contratos técnicos y datos base

3\. Revisión de pricing y billing según nueva lógica

4\. Capa de créditos

5\. Capa de activación real

6\. Constructor visible V1

7\. Exportación / transferencia

8\. Deployment / GitHub / salida operativa

9\. SEO fundacional y expansión



\---



\## 4. Fase 0 — Cierre doctrinal



\### Estado

En curso / prácticamente cerrada.



\### Objetivo

Dejar fijadas estas piezas:

\- Producto Maestro V2

\- Activación

\- Créditos y economía

\- Constructor visible

\- Contratos técnicos

\- Roadmap de implementación



\### Resultado esperado

Base canónica para decidir sin contradicciones.



\### Regla

No abrir implementación superior sin esta fase cerrada y sincronizada.



\---



\## 5. Fase 1 — Consolidación técnica base



\### Objetivo

Asegurar que la base actual del sistema está estable antes de abrir nuevas capas mayores.



\### Incluye

\- backend canónico consolidado

\- frontend de flow estable

\- continuidad de proyecto por `project\_id`

\- blueprint estable

\- billing actual funcionando sin roturas

\- rutas principales operativas

\- deploy Railway estable

\- observabilidad mínima y logs suficientes



\### Estado actual

Muy avanzado.



\### Criterio de cierre

\- análisis funciona

\- refine funciona

\- blueprint funciona

\- billing carga

\- flow no pierde continuidad básica

\- backend canónico es la ruta viva real



\---



\## 6. Fase 2 — Revisión estructural de pricing y billing



\### Objetivo

Adaptar el sistema comercial actual a la nueva doctrina.



\### Debe cerrar

\- papel de Gratis

\- papel del informe 6,99

\- papel real de Pro 29

\- papel real de Growth 79

\- papel real de Master 199

\- posición de créditos

\- posición de exportación

\- narrativa correcta de continuidad interna vs salida



\### Entregables

\- revisión de `pricingContent`

\- revisión de `Billing`

\- revisión de mensajes de recomendación

\- contratos semánticos de planes



\### Regla

No meter créditos operativos en UI sin revisar primero la arquitectura comercial.



\---



\## 7. Fase 3 — Modelo técnico de créditos



\### Objetivo

Introducir la economía de créditos como pieza real del sistema.



\### Debe incluir

\- saldo por usuario

\- ledger de movimientos

\- créditos incluidos por plan

\- recargas

\- validación de saldo

\- bloqueo suave por falta de saldo

\- visibilidad de saldo en frontend



\### Entidades mínimas

\- `credit\_balance`

\- `credit\_ledger`

\- tipos de movimiento

\- lógica de otorgamiento por plan

\- lógica de compra de recarga



\### Endpoints mínimos futuros

\- saldo

\- ledger

\- checkout de recarga

\- validación de coste de acción



\### Regla

No gastar créditos aún en demasiadas acciones.

Empezar con pocos casos claros.



\---



\## 8. Fase 4 — Activación real



\### Objetivo

Convertir la doctrina de Activación en objeto funcional del sistema.



\### Debe incluir

\- generación de activación por proyecto

\- stack sugerido

\- plantilla sugerida

\- checklist

\- secuencia

\- prompts estructurales

\- ruta técnico / no técnico



\### Regla

La activación no debe quedar enterrada en texto largo.

Debe pasar a ser una capa usable y reutilizable.



\### Resultado esperado

El sistema deja de orientarte solo con blueprint y empieza a entregarte una base de ejecución más concreta.



\---



\## 9. Fase 5 — Constructor Visible V1



\### Objetivo

Abrir la primera versión real del constructor visible.



\### Debe incluir

\- pantalla dividida

\- estado del sistema

\- fase de build

\- señal visible de ejecución

\- preview base

\- acciones limitadas y claras

\- integración con créditos en acciones seleccionadas



\### V1 debe ser contenida

No hace falta abrir la versión máxima desde el día uno.



\### La V1 debe resolver

\- percepción de ejecución real

\- continuidad visible

\- valor claro del sistema

\- puente entre activación y construcción



\### Regla

Primero una versión simple, estable y seria.

No una versión inflada.



\---



\## 10. Fase 6 — Exportación / transferencia



\### Objetivo

Convertir la salida del proyecto en capacidad real y monetizable.



\### Debe incluir

\- solicitud de exportación

\- valoración

\- precio cerrado o por banda

\- checkout

\- estado de preparación

\- entrega



\### Principio

La exportación no forma parte del uso ordinario del sistema.

Es una acción premium separada.



\### Resultado esperado

El usuario puede seguir dentro del sistema o sacar el proyecto con proceso claro y profesional.



\---



\## 11. Fase 7 — Deployment y conexión operativa



\### Objetivo

Preparar la salida viva del proyecto cuando proceda.



\### Posibles piezas

\- botón de despliegue

\- GitHub connect

\- destino de deployment

\- estados de deploy

\- preparación de salida técnica



\### Regla

No abrir esta fase antes de:

\- créditos

\- activación

\- builder visible V1

\- exportación básica



\### Motivo

Deployment sin estructura previa generaría más ruido que valor.



\---



\## 12. Fase 8 — Modo operador



\### Objetivo

Convertir el sistema en herramienta fuerte para trabajar sobre activos de terceros.



\### Casos

\- analizar URL de negocio local

\- proponer mejora

\- construir nueva base

\- vender propuesta

\- entregar o exportar el resultado



\### Relevancia

Alta.

Pero debe apoyarse en fases anteriores ya resueltas.



\---



\## 13. Fase 9 — SEO fundacional



\### Objetivo

Asegurar una base SEO limpia una vez que la arquitectura principal de producto esté estable.



\### Debe incluir

\- naming consistente “Sistema Maestro”

\- titles

\- meta descriptions

\- H1 correctos

\- indexación básica

\- canonical

\- sitemap

\- robots

\- home bien definida



\### Regla

No abrir una fase SEO grande antes de que el núcleo del producto esté coherente.



\---



\## 14. Priorización ejecutiva



\## Prioridad crítica estructural

1\. consolidación técnica base

2\. pricing y billing según nueva doctrina

3\. créditos

4\. activación real



\## Prioridad estratégica

5\. constructor visible V1

6\. exportación / transferencia

7\. deployment / GitHub

8\. modo operador



\## Prioridad de expansión

9\. SEO fundacional y crecimiento



\---



\## 15. Orden operativo recomendado inmediato



\### Paso 1

Sincronizar esta capa documental completa con GitHub.



\### Paso 2

Hacer auditoría quirúrgica de:

\- `pricingContent`

\- `Billing.js`

\- rutas y narrativa comercial



\### Paso 3

Diseñar la versión V2 de pricing y billing en base a:

\- activación

\- créditos

\- exportación



\### Paso 4

Cerrar contratos mínimos de créditos para backend y frontend.



\### Paso 5

Empezar implementación controlada de créditos.



\---



\## 16. Regla de ejecución



Cada fase debe cerrarse con:

\- diagnóstico

\- objetivo

\- archivos implicados

\- criterios de validación

\- cierre técnico limpio



No se debe abrir una fase nueva si la anterior sigue ambigua.



\---



\## 17. Cierre doctrinal



Sistema Maestro ya no debe avanzar como experimento.



Debe avanzar como producto serio con secuencia clara de implementación.



Este roadmap fija esa secuencia.



A partir de aquí, toda implementación debe justificarse por:

\- prioridad real

\- coherencia con la arquitectura

\- reducción de fricción

\- aumento de potencia del sistema

