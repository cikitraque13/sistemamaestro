# Master Maturity Roadmap

## Propósito y autoridad

Este documento es la fuente canónica de propósito, estado, dependencias y evidencia para S14–S18 y J04–J16. Conserva la intención histórica del Informe Maestro de Vida y del Roadmap S14→J16; el estado presente se limita a evidencia acreditada. No inicia ni autoriza un gate.

La hoja histórica [Roadmap de Implementación V1](06-ROADMAP-DE-IMPLEMENTACION-V1.md) se preserva sin cambios como referencia de intención anterior. No es la secuencia operativa actual de Journey 03.

## Checkpoint de referencia

La identidad e integridad del Gold de entrada a S14 constan en el [Inventario técnico](../../control/03-INVENTARIO-TECNICO.md#gold-s14-entry-vigente). Este roadmap conserva la autoridad de los estados y dependencias S14–S18/J04–J16.

## Cómo leer los estados

- `COMPLETED`: gate cerrado con evidencia dentro del alcance indicado.
- `NOT_STARTED`: estado explícitamente acreditado.
- `NOT_DEMONSTRATED`: las fuentes reconciliadas no acreditan cierre ni un estado más preciso.
- Evidencia adelantada informa un gate futuro, pero no lo cierra por semejanza.

La reutilización exige identidad y condiciones coincidentes. Aplicar la regla de delta en [Journey Gate Operating Rules](../../control/09-JOURNEY-GATE-OPERATING-RULES.md).

## Journey 03 — cierre del Builder local gobernado

### S14 — Local Storage Capacity and Retention

- ORIGINAL_PURPOSE: definir capacidad, retención, compactación y respuesta segura ante presión de cuota para el estado durable local, preservando trabajo pendiente, trazabilidad, decisiones, anti-replay y revert.
- CURRENT_STATUS: NOT_STARTED.
- ACCREDITED_EVIDENCE: baseline PRE-S14 describe localStorage, Web Locks, crecimiento append de history/decisions, fail-closed y dependencia del snapshot del último apply. Es contexto previo sujeto a revalidación contra el Gold.
- WHAT_REMAINS: decidir alcance y criterios; no hay política de retención/eviction acreditada como diseñada o implementada.
- EVIDENCE_REUSABLE_IF: los blobs de persistencia y pruebas del Gold coinciden con la evidencia baseline.
- REVALIDATE_IF: cambia esquema, clave, locking, revisionado, recuperación, decisiones, pending work, snapshot/revert o criterio de capacidad.
- DEPENDENCIES: baseline de almacenamiento S1–S13; decisión explícita de alcance antes de diseño/implementación.

### S15 — Canonical Project Identity

- ORIGINAL_PURPOSE: establecer identidad canónica de proyecto/workspace y vincularla a owner, revisión y artefactos en todas las operaciones.
- CURRENT_STATUS: NOT_DEMONSTRATED; no está cerrado.
- ACCREDITED_EVIDENCE: Journey 03 acredita aislamiento owner/project y protecciones de revisión dentro del circuito local delimitado.
- WHAT_REMAINS: probar identidad canónica transversal, selección/cambio de proyecto, recuperación y propagación por todas las superficies pertinentes.
- EVIDENCE_REUSABLE_IF: los contratos y bytes de identidad/ownership permanecen iguales y el nuevo gate mantiene el mismo alcance.
- REVALIDATE_IF: cambian identidad, owner binding, workspace, selección, APIs, recuperación o límites entre cliente y servidor.
- DEPENDENCIES: Journey 03 y contratos de autorización; definir alcance canónico del proyecto.

### S16 — Runtime Reproducibility

- ORIGINAL_PURPOSE: hacer reproducibles instalación, pruebas y build en un runtime soportado y documentado.
- CURRENT_STATUS: NOT_DEMONSTRATED; evidencia adelantada, no cierre.
- ACCREDITED_EVIDENCE: PRE-S14 registró Node 22, lockfile reparado, npm ls limpio, cero advisories critical/high en el audit reportado, MJS 69/69, Vitest 36/36, build y Docker PASS.
- WHAT_REMAINS: enlazar resultados y comandos al artefacto congelado y demostrar que cubren los criterios propios de S16.
- EVIDENCE_REUSABLE_IF: commit/tree, manifests, lockfile, Node/npm, Dockerfile, imagen/método, plataforma y comandos coinciden.
- REVALIDATE_IF: cambia cualquiera de esas entradas, el entorno o los criterios de reproducibilidad.
- DEPENDENCIES: runtime y manifests canónicos; evidencia con identidad exacta.

### S17 — Native Browser Accreditation Harness

- ORIGINAL_PURPOSE: acreditar con un harness nativo repetible navegación, render, identidad de preview, persistencia, autorización, apply/revert y captura de fallos.
- CURRENT_STATUS: NOT_DEMONSTRATED; evidencia adelantada, no cierre.
- ACCREDITED_EVIDENCE: OAuth E2E y smoke autenticado reportaron login/sesión, Dashboard, Builder, deep route y ausencia de errores materiales observados.
- WHAT_REMAINS: demostrar harness canónico repetible, cobertura de criterios y captura de resultados vinculada a un build exacto.
- EVIDENCE_REUSABLE_IF: navegador, harness, build, entorno, sesión autorizada y casos son los requeridos por el gate.
- REVALIDATE_IF: cambia harness, navegador, auth/session, rutas, build, persistencia o criterios.
- DEPENDENCIES: runtime/build reproducible S16 y límites de autorización; el smoke de producción no sustituye el harness.

### S18 — Canonical State Machine

- ORIGINAL_PURPOSE: expresar y verificar estados/transiciones canónicos, incluidos fallos, stale state, recuperación y autorización.
- CURRENT_STATUS: NOT_DEMONSTRATED; no está cerrado.
- ACCREDITED_EVIDENCE: S1–S13 prueban transacciones locales acotadas, autorización explícita y recuperación; son insumos, no el modelo completo.
- WHAT_REMAINS: definir y validar la máquina de estados completa frente a implementación y casos límite.
- EVIDENCE_REUSABLE_IF: contratos, identidad, runtime y harness relevantes siguen coincidiendo.
- REVALIDATE_IF: cambian transiciones, persistencia, recuperación, permisos, retries o estado de artefactos.
- DEPENDENCIES: S15 identidad, S16 reproducibilidad y S17 flujo/harness acreditado, además de revisión de todas las escrituras activas.

## Journey 04–16 — madurez del producto

Los propósitos y dependencias conservan la intención del roadmap maestro. Salvo la evidencia citada, el estado de cada gate queda `NOT_DEMONSTRATED`; no se infieren cierres por capacidades parecidas en otro journey.

### J04 — Project Context

- ORIGINAL_PURPOSE: construir contexto estructural y factual del proyecto, seleccionar lo relevante y mantenerlo ligado a su revisión.
- CURRENT_STATUS: NOT_DEMONSTRATED.
- ACCREDITED_EVIDENCE: hay contratos y superficies de proyecto; no se acredita el sistema integral de contexto de J04.
- WHAT_REMAINS: inventario, grafo/contexto, selección y actualización de realidad del proyecto.
- EVIDENCE_REUSABLE_IF: identidad S15 y fuentes del contexto coinciden con el gate.
- REVALIDATE_IF: cambia identidad, estructura, indexación o selección de contexto.
- DEPENDENCIES: S15 y acceso gobernado al proyecto.

### J05 — Project Memory

- ORIGINAL_PURPOSE: memoria durable por owner/proyecto con procedencia, recuperación, vigencia y resolución de supersession/contradicciones.
- CURRENT_STATUS: NOT_DEMONSTRATED.
- ACCREDITED_EVIDENCE: recuperación durable de pending work en Journey 03 no acredita Project Memory.
- WHAT_REMAINS: taxonomía, persistencia, retrieval y reglas de actualidad/contradicción.
- EVIDENCE_REUSABLE_IF: identidad y revisión del proyecto están demostradas y la evidencia cubre memoria.
- REVALIDATE_IF: cambia identidad, persistencia, retrieval o política de vigencia.
- DEPENDENCIES: S15 y J04.

### J06 — Intent + Planning

- ORIGINAL_PURPOSE: convertir intención en contrato de trabajo, aclarar incertidumbre y mantener plan/replan trazables.
- CURRENT_STATUS: NOT_DEMONSTRATED.
- ACCREDITED_EVIDENCE: decisiones/rationale de Builder son acotados; no acreditan planificación general.
- WHAT_REMAINS: contrato de intención, clarificación, plan, progreso y replanning.
- EVIDENCE_REUSABLE_IF: casos y decisiones cubren el scope de J06.
- REVALIDATE_IF: cambian contratos, criterios o tratamiento de incertidumbre.
- DEPENDENCIES: J04; identidad S15.

### J07 — Orchestration Core

- ORIGINAL_PURPOSE: formalizar Work Items, registro y selección de capacidades, handoffs y estado/parada de orquestación.
- CURRENT_STATUS: NOT_DEMONSTRATED.
- ACCREDITED_EVIDENCE: no se acredita runtime general multiagente por presencia de archivos o roles.
- WHAT_REMAINS: contratos, routing de capacidades, handoff, estado, stop y gates humanos.
- EVIDENCE_REUSABLE_IF: ejecución observada coincide con el diseño y scope del gate.
- REVALIDATE_IF: cambian capacidades, routing, handoffs, autorización o políticas de parada.
- DEPENDENCIES: J04 y J06; separación entre capability routing y model routing J13.

### J08 — Specialized Engineering Intelligence

- ORIGINAL_PURPOSE: coordinar capacidades especializadas de producto/arquitectura, frontend, backend, datos, seguridad y QA con contexto compartido y revisión trazable.
- CURRENT_STATUS: NOT_DEMONSTRATED.
- ACCREDITED_EVIDENCE: revisiones especializadas de esta trayectoria son evidencia de proceso, no prueba de runtime de producto.
- WHAT_REMAINS: contratos operativos, contexto, handoff, ownership y validación independiente sin duplicar verdad.
- EVIDENCE_REUSABLE_IF: instancias y contratos quedan vinculados a Work Items y resultados verificables.
- REVALIDATE_IF: cambian roles, herramientas, handoffs o separación de implementación/revisión.
- DEPENDENCIES: J04, J06 y J07.

### J09 — Full-Stack Execution

- ORIGINAL_PURPOSE: realizar cambios coordinados de frontend/backend/datos con transacción, integración y entorno gobernados.
- CURRENT_STATUS: NOT_DEMONSTRATED.
- ACCREDITED_EVIDENCE: el producto es full-stack; Journey 03 valida un circuito local Builder acotado, no ejecución full-stack autónoma.
- WHAT_REMAINS: ejecución multiarchivo, runtime backend, integración, migraciones seguras y contrato de secretos/env.
- EVIDENCE_REUSABLE_IF: pruebas cubren el cambio full-stack y los límites de persistencia/integración afectados.
- REVALIDATE_IF: cambian APIs, datos, runtime, transacción, integración o secretos/config.
- DEPENDENCIES: J07, S16 y validación/transacción acreditadas.

### J10 — Design/UX Intelligence

- ORIGINAL_PURPOSE: convertir brief y dirección visual en diseño consistente con validación visual real.
- CURRENT_STATUS: NOT_DEMONSTRATED.
- ACCREDITED_EVIDENCE: la UI existente y smoke de render no prueban inteligencia de diseño J10.
- WHAT_REMAINS: brief, dirección, sistema de diseño y gate anti-genérico validado en navegador.
- EVIDENCE_REUSABLE_IF: casos visuales/harness y sistema de diseño son los del gate.
- REVALIDATE_IF: cambian sistema visual, viewport, renderer o criterio.
- DEPENDENCIES: J04, J06, J07 y S17.

### J11 — QA/Security/Reliability

- ORIGINAL_PURPOSE: integrar validación basada en riesgo, QA independiente, security gates, recuperación y observabilidad.
- CURRENT_STATUS: NOT_DEMONSTRATED.
- ACCREDITED_EVIDENCE: gates QA/SEC específicos de releases previos no acreditan un sistema integral J11.
- WHAT_REMAINS: estrategia derivada de riesgo, observabilidad, seguridad y fallo/recuperación con evidence ownership.
- EVIDENCE_REUSABLE_IF: revisión cubre la misma identidad, entorno, threat surface y acceptance criteria.
- REVALIDATE_IF: cambia código, dependencia, superficie, entorno, riesgo o criterio material.
- DEPENDENCIES: J07–J10 y S16–S18 según superficie.

### J12 — Delivery/Portability

- ORIGINAL_PURPOSE: entrega/exportación reproducible, Git/GitHub, deploy y hosting bajo autoridad explícita.
- CURRENT_STATUS: NOT_DEMONSTRATED.
- ACCREDITED_EVIDENCE: el release desplegado de Sistema Maestro no acredita exportación/portabilidad de proyectos de usuario.
- WHAT_REMAINS: flujos de export, integración Git, contrato de deploy, hosting y entrega autorizada.
- EVIDENCE_REUSABLE_IF: el artefacto y el destino coinciden con el contrato J12.
- REVALIDATE_IF: cambian proveedor, destino, permisos, pipeline, runtime o formato de exportación.
- DEPENDENCIES: J09 y J11; identidad y autorización.

### J13 — Model Routing + Gems

- ORIGINAL_PURPOSE: abstraer proveedores/perfiles y seleccionar modelos por capacidad/coste/riesgo con elección y presupuesto gobernados.
- CURRENT_STATUS: NOT_DEMONSTRATED.
- ACCREDITED_EVIDENCE: la existencia de economía/Gems no demuestra routing de modelos ni controles de coste.
- WHAT_REMAINS: perfiles de modelos, selección, proveedores, presupuesto, transparencia y límites económicos.
- EVIDENCE_REUSABLE_IF: modelo, costes, ledger y casos de routing están medidos para el gate.
- REVALIDATE_IF: cambian proveedor, modelo, precio, política de presupuesto o ledger.
- DEPENDENCIES: capability routing J07 y controles económicos; J12 precede J13 en el roadmap.

### J14 — Autonomous Multi-Step Builder

- ORIGINAL_PURPOSE: ejecutar/testear/reparar/continuar con replanning, checkpoints humanos, límites y parada segura.
- CURRENT_STATUS: NOT_DEMONSTRATED.
- ACCREDITED_EVIDENCE: S1–S13 aportan transacción y autorización local; no prueban autonomía multi-step ni runtime multiagente.
- WHAT_REMAINS: ciclos autónomos gobernados, recuperación, replanning, límites de coste/acción y supervisión.
- EVIDENCE_REUSABLE_IF: se demuestra el ciclo completo y cada transición autorizada en el scope.
- REVALIDATE_IF: cambian permisos, herramientas, modelos, estado, reintentos o stop conditions.
- DEPENDENCIES: J06–J08, J11, S18 y gobierno humano explícito.

### J15 — Platform Core

- ORIGINAL_PURPOSE: persistencia de servidor, autorización, multi-device, resolución de conflictos, multi-proyecto y bases de colaboración.
- CURRENT_STATUS: NOT_DEMONSTRATED.
- ACCREDITED_EVIDENCE: workspace local owner/project no acredita sync ni aislamiento server-side multi-proyecto.
- WHAT_REMAINS: almacenamiento servidor, authz por recurso, sync, conflictos y colaboración con invariantes demostradas.
- EVIDENCE_REUSABLE_IF: la evidencia incluye backend, persistencia y amenazas multi-tenant del gate.
- REVALIDATE_IF: cambian APIs, DB, ownership, sync, tenant boundary o controles.
- DEPENDENCIES: S15, J04–J09 y seguridad de servidor.

### J16 — Production Hardening / Elite Release

- ORIGINAL_PURPOSE: rendimiento, seguridad, fiabilidad, integridad de billing/Gems, observabilidad, restore/DR y Golden Journey end-to-end.
- CURRENT_STATUS: NOT_DEMONSTRATED.
- ACCREDITED_EVIDENCE: el release PRE-S14 de la plataforma acredita un release acotado; no el hardening integral ni Golden Journey.
- WHAT_REMAINS: pruebas de carga/fallo, controles de economía, observabilidad, recuperación y journey completo.
- EVIDENCE_REUSABLE_IF: targets, release identity, incident scope y criterios coinciden.
- REVALIDATE_IF: cambia arquitectura, riesgo, dependencias, datos, runtime, targets o criterios.
- DEPENDENCIES: J09–J15 y gates de seguridad/QA; Golden Journey completo.

## Golden Journey

La intención original es que una persona nueva describa una aplicación compleja de reservas y que el sistema comprenda, planifique, diseñe, construya frontend/backend/datos, pruebe seguridad y navegador, repare, obtenga review y decisión humana, aplique, despliegue, verifique y permita exportar sin ingeniería manual interna. Este journey es criterio de validación del producto, no capacidad acreditada por el release de la plataforma.

## Criterio de V1 candidata a mercado

V1 candidata a mercado requiere evidencia integral de contexto, memoria, intención/planning, orquestación, capacidades especializadas, routing de modelos, autonomía gobernada, validación estructural/funcional/semántica/visual/seguridad, trazabilidad y reversibilidad, autorización server-side, multi-proyecto/multi-device, exportación/deploy/portabilidad, gobierno de Gems/costes, observabilidad, recuperación y Golden Journey. Ningún elemento se da por cerrado por presencia de módulos o por releases parciales.

## Regla de cierre

Cada gate conserva su propio owner de ejecución y evidencia. El estado canónico se actualiza aquí tras la revisión correspondiente. Para reglas de operación, evidencia y checkpoints, consultar [Journey Gate Operating Rules](../../control/09-JOURNEY-GATE-OPERATING-RULES.md).