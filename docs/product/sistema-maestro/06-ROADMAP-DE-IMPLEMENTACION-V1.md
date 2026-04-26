# 06 — Roadmap de Implementación V1

## 1. Función de esta pieza

Este documento traduce la arquitectura de producto de Sistema Maestro V2 a una secuencia de implementación real.

No define solo deseos.

Define orden, dependencias, prioridad y criterio de ejecución.

Su objetivo es impedir:

- improvisación;
- mezcla de capas;
- inflación de tareas;
- cambios prematuros en pricing o UI;
- deuda estructural por querer implementar demasiado a la vez;
- simulación de construcción sin salida real;
- monetización de acciones que no entregan valor verificable.

---

## 2. Principio rector

Sistema Maestro debe implementarse en capas.

No se debe construir primero lo más vistoso.

Se debe construir primero lo que garantice:

- continuidad real;
- estructura estable;
- construcción visible verificable;
- preview, código y estructura sincronizados;
- monetización coherente;
- ejecución sin fricción;
- capacidad de crecer sin rehacer el sistema.

### Regla principal

Antes de activar créditos, exportación, deploy o nuevas promesas comerciales, el Builder debe poder demostrar construcción real.

El núcleo de esa construcción es:

```text
input usuario
→ interpretación IA
→ mutación normalizada
→ BuilderBuildState
→ preview
→ código
→ estructura
→ siguientes decisiones
```

---

## 3. Secuencia maestra de implementación

La secuencia correcta, desde el estado actual, queda así:

1. Cierre documental y canónico del Builder vivo.
2. Creación de `frontend/src/features/builder/state/`.
3. Creación de BuilderBuildKernel y BuilderBuildState.
4. Conexión del runtime del Builder al estado vivo.
5. Conexión de preview, código y estructura al estado vivo.
6. Reordenación visual del Builder y del agente.
7. Revisión de pricing y billing según nueva lógica.
8. Conexión progresiva de créditos sobre acciones reales.
9. Activación funcional reutilizable.
10. Exportación / transferencia.
11. Deployment / GitHub / salida operativa.
12. Modo operador.
13. SEO fundacional y expansión.

---

## 4. Fase 0 — Cierre doctrinal y DOC-LOCK

### Estado

En curso avanzado.

### Objetivo

Dejar fijadas estas piezas:

- decisiones cerradas;
- rutas canónicas;
- incidencias y diagnósticos;
- pendientes priorizados;
- contratos técnicos;
- procedimientos operativos;
- roadmap de implementación.

### Documentos afectados

- `docs/control/01-DECISIONES-CERRADAS.md`
- `docs/control/02-PENDIENTES-PRIORIZADOS.md`
- `docs/control/04-RUTAS-CANONICAS.md`
- `docs/control/05-INCIDENCIAS-Y-DIAGNOSTICOS.md`
- `docs/control/06-PROCEDIMIENTOS-OPERATIVOS.md`
- `docs/product/sistema-maestro/05-CONTRATOS-TECNICOS-V1.md`
- `docs/product/sistema-maestro/06-ROADMAP-DE-IMPLEMENTACION-V1.md`

### Resultado esperado

Base canónica para decidir sin contradicciones.

### Regla

No abrir implementación superior sin esta fase cerrada y sincronizada.

---

## 5. Fase 1 — Crear la piedra angular del Builder visible

### Estado

Siguiente fase técnica autorizable después del cierre documental.

### Objetivo

Crear la subcapa canónica interna del Builder:

```text
frontend/src/features/builder/state/
```

### Archivos previstos

- `builderBuildKernel.js`
- `builderBuildState.js`
- `builderMutationRegistry.js`
- `builderOutputMap.js`
- `builderQuestionFlowRegistry.js`
- `builderStructureRegistry.js`
- `builderKnowledgeIndex.js`

### Función

Esta capa debe permitir que el Builder deje de depender de:

- copy suelto;
- mensajes del agente;
- `hubSummary`;
- `lastDelta`;
- `lastOperation`;
- fases de progreso;
- plantillas aisladas.

Y pase a gobernarse por:

- estado vivo;
- mutaciones;
- preview;
- código;
- estructura;
- siguientes decisiones.

### Criterio de cierre

Una petición como:

```text
Añade acceso con Google
```

debe poder traducirse a:

- mutación normalizada;
- estado vivo actualizado;
- preview con bloque real;
- código con componente real;
- estructura con archivo real;
- siguiente mejora distinta.

### Regla

No crear megaarchivo.

El kernel coordina.

El conocimiento vive en registros, playbooks, presets, mapas de output, mutaciones, estructura y flujos de preguntas.

---

## 6. Fase 2 — Conectar runtime del Builder al estado vivo

### Objetivo

Conectar el runtime actual del Builder con `BuilderBuildKernel` y `BuilderBuildState`.

### Ruta principal

```text
frontend/src/features/builder/workspace/hooks/useBuilderWorkspaceRuntime.js
```

### Debe conseguir

- inicializar estado vivo;
- interpretar input del usuario;
- enviar acciones al kernel;
- aplicar mutaciones;
- conservar acciones ya aplicadas;
- exponer `appliedBuildState`;
- generar siguientes decisiones desde el estado real.

### No debe hacer todavía

- rediseñar UI;
- tocar créditos reales;
- activar deploy;
- mezclar backend;
- convertir IA puente en runtime vivo completo.

### Criterio de cierre

El runtime deja de ser:

```text
mensaje → progreso → señales
```

y pasa a ser:

```text
input → mutación → estado vivo → salida coordinada
```

---

## 7. Fase 3 — Conectar preview, código y estructura

### Objetivo

Hacer que preview, código y estructura salgan de la misma fuente viva.

### Rutas principales

```text
frontend/src/features/builder/components/BuilderCanvasPane.js
frontend/src/features/builder/utils/builderCodeTemplates.js
```

### Debe conseguir

- preview renderizada desde `BuilderBuildState`;
- código generado desde `BuilderBuildState`;
- estructura derivada desde `BuilderBuildState`;
- coherencia entre pestañas;
- eliminación de preview decorativa;
- eliminación de código que no representa lo que se ve.

### Criterio de cierre

Si una mutación activa un bloque, ese bloque debe aparecer en:

- preview;
- código;
- estructura;
- siguientes decisiones.

### Regla

No hay Builder Gold mientras preview, código y estructura no compartan la misma verdad.

---

## 8. Fase 4 — Reordenar BuilderAgentPane y experiencia visual

### Objetivo

Ajustar la capa visual del Builder después de tener estado vivo.

### Ruta principal

```text
frontend/src/features/builder/components/BuilderAgentPane.js
```

### Incluye

- evitar solapes de agentes;
- ordenar la cápsula del agente;
- reforzar el dock inferior;
- hacer que sugerencias salgan del estado vivo;
- evitar preguntas genéricas repetidas;
- mantener chat como control del usuario;
- hacer que el lado izquierdo sea código/proceso y no bloque decorativo.

### Dependencia

No se ejecuta antes de que exista `BuilderBuildState`.

### Criterio de cierre

El Builder debe transmitir:

- construcción real;
- proceso visible;
- preview viva;
- código coherente;
- agente útil;
- siguientes decisiones contextuales.

---

## 9. Fase 5 — Revisión estructural de pricing y billing

### Objetivo

Adaptar el sistema comercial actual a la nueva doctrina.

### Debe cerrar

- papel de Gratis;
- papel del informe 6,99;
- papel real de Pro 29;
- papel real de Growth 79;
- papel real de Master 199;
- posición de créditos;
- posición de exportación;
- narrativa correcta de continuidad interna vs salida;
- diferencia entre construir dentro del sistema y sacar el proyecto fuera.

### Entregables

- revisión de `pricingContent`;
- revisión de `Billing`;
- revisión de mensajes de recomendación;
- contratos semánticos de planes.

### Regla

No meter créditos operativos en UI sin revisar primero la arquitectura comercial.

No prometer exportación, deploy o construcción premium sin salida técnica verificable.

---

## 10. Fase 6 — Modelo técnico de créditos

### Objetivo

Introducir la economía de créditos como pieza real del sistema, conectada solo a acciones con salida verificable.

### Debe incluir

- saldo por usuario;
- ledger de movimientos;
- créditos incluidos por plan;
- recargas;
- validación de saldo;
- bloqueo suave por falta de saldo;
- visibilidad de saldo en frontend;
- coste estimado por acción del Builder.

### Entidades mínimas

- `credit_balance`;
- `credit_ledger`;
- tipos de movimiento;
- lógica de otorgamiento por plan;
- lógica de compra de recarga;
- coste de acción;
- vínculo con mutaciones reales del Builder.

### Endpoints mínimos futuros

- saldo;
- ledger;
- checkout de recarga;
- validación de coste de acción.

### Regla

No gastar créditos en simulaciones.

Créditos solo deben conectarse a acciones que produzcan:

- preview;
- código;
- estructura;
- archivo;
- bloque;
- exportación;
- deploy;
- salida real verificable.

---

## 11. Fase 7 — Activación real

### Objetivo

Convertir la doctrina de Activación en objeto funcional del sistema.

### Debe incluir

- generación de activación por proyecto;
- stack sugerido;
- plantilla sugerida;
- checklist;
- secuencia;
- prompts estructurales;
- ruta técnico / no técnico.

### Regla

La activación no debe quedar enterrada en texto largo.

Debe pasar a ser una capa usable y reutilizable.

### Resultado esperado

El sistema deja de orientar solo con blueprint y empieza a entregar una base de ejecución más concreta.

### Dependencia

La activación puede preparar el proyecto, pero no sustituye al Builder.

El Builder ejecuta y muestra.

---

## 12. Fase 8 — Exportación / transferencia

### Objetivo

Convertir la salida del proyecto en capacidad real y monetizable.

### Debe incluir

- solicitud de exportación;
- valoración;
- precio cerrado o por banda;
- checkout;
- estado de preparación;
- entrega.

### Principio

La exportación no forma parte del uso ordinario del sistema.

Es una acción premium separada.

### Dependencia

No se activa exportación sobre una preview simulada.

Debe existir:

- estado vivo;
- estructura coherente;
- código representativo;
- valoración.

### Resultado esperado

El usuario puede seguir dentro del sistema o sacar el proyecto con proceso claro y profesional.

---

## 13. Fase 9 — Deployment y conexión operativa

### Objetivo

Preparar la salida viva del proyecto cuando proceda.

### Posibles piezas

- botón de despliegue;
- GitHub connect;
- destino de deployment;
- estados de deploy;
- preparación de salida técnica.

### Regla

No abrir esta fase antes de:

- BuilderBuildState;
- preview/código/estructura sincronizados;
- créditos claros;
- exportación básica;
- estructura técnica coherente.

### Motivo

Deployment sin estructura previa generaría más ruido que valor.

---

## 14. Fase 10 — Modo operador

### Objetivo

Convertir el sistema en herramienta fuerte para trabajar sobre activos de terceros.

### Casos

- analizar URL de negocio local;
- proponer mejora;
- construir nueva base;
- vender propuesta;
- entregar o exportar el resultado.

### Relevancia

Alta.

Pero debe apoyarse en fases anteriores ya resueltas.

### Regla

Modo operador no debe abrir otro frente de Builder paralelo.

Debe consumir el mismo BuilderBuildKernel y el mismo BuilderBuildState.

---

## 15. Fase 11 — SEO fundacional

### Objetivo

Asegurar una base SEO limpia una vez que la arquitectura principal de producto esté estable.

### Debe incluir

- naming consistente “Sistema Maestro”;
- titles;
- meta descriptions;
- H1 correctos;
- indexación básica;
- canonical;
- sitemap;
- robots;
- home bien definida.

### Regla

No abrir una fase SEO grande antes de que el núcleo del producto esté coherente.

---

## 16. Priorización ejecutiva

## Prioridad crítica estructural

1. cierre documental y DOC-LOCK;
2. `frontend/src/features/builder/state/`;
3. BuilderBuildKernel;
4. BuilderBuildState;
5. mutaciones;
6. runtime del Builder;
7. preview/código/estructura sincronizados.

## Prioridad estratégica

8. BuilderAgentPane y experiencia visual;
9. pricing y billing según nueva doctrina;
10. créditos sobre acciones reales;
11. activación real;
12. exportación / transferencia;
13. deployment / GitHub;
14. modo operador.

## Prioridad de expansión

15. SEO fundacional y crecimiento.

---

## 17. Orden operativo recomendado inmediato

### Paso 1

Cerrar y validar esta capa documental completa.

### Paso 2

Crear la subcapa:

```text
frontend/src/features/builder/state/
```

### Paso 3

Crear archivos pequeños del kernel modular:

- `builderBuildKernel.js`;
- `builderBuildState.js`;
- `builderMutationRegistry.js`;
- `builderOutputMap.js`;
- `builderQuestionFlowRegistry.js`;
- `builderStructureRegistry.js`;
- `builderKnowledgeIndex.js`.

### Paso 4

Conectar runtime del Builder al estado vivo.

### Paso 5

Conectar preview, código y estructura.

### Paso 6

Ajustar visualmente BuilderAgentPane.

### Paso 7

Reabrir pricing, créditos, exportación y deploy solo sobre una base real.

---

## 18. Regla de ejecución

Cada fase debe cerrarse con:

- diagnóstico;
- objetivo;
- archivos implicados;
- criterios de validación;
- cierre técnico limpio.

No se debe abrir una fase nueva si la anterior sigue ambigua.

### Regla específica del Builder

No se toca visualmente el Builder si el cambio no está conectado, directa o indirectamente, con:

- estado vivo;
- preview;
- código;
- estructura;
- siguiente decisión;
- futura monetización verificable.

---

## 19. Riesgos bloqueantes

Quedan bloqueados hasta nueva fase formal:

- deploy final;
- push orientado a release;
- producción;
- créditos UI conectados a acciones simuladas;
- exportación basada en preview no sincronizada;
- deploy basado en estructura no generada por estado vivo;
- cambios visuales amplios del Builder sin BuilderBuildState;
- activación de IA puente como si fuera runtime completo;
- commits mezclados de documentación, runtime, UI, créditos y deploy.

---

## 20. Cierre doctrinal

Sistema Maestro ya no debe avanzar como experimento.

Debe avanzar como producto serio con secuencia clara de implementación.

Este roadmap fija esa secuencia.

A partir de aquí, toda implementación debe justificarse por:

- prioridad real;
- coherencia con la arquitectura;
- reducción de fricción;
- aumento de potencia del sistema;
- salida verificable para el usuario;
- protección de reputación y monetización.

La siguiente fase autorizada después del cierre documental es:

```text
frontend/src/features/builder/state/
```

No se aprueba invertir este orden.