# Journey 03 — Estado canónico PRE-S14

## Estado y autoridad — 2026-10-01

Este documento es el propietario canónico del estado de Journey 03, sus cierres locales,
la validación PRE-S14 y su siguiente frente. La autorización
SM_PRE_S14_DOCUMENT_RECONCILIATION_EXECUTION de HUMAN-LUCAS acredita este checkpoint.

| Estado | Valor |
|---|---|
| S1, S2, S3A, S3B, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13 | COMPLETED |
| C1 | COMPLETED |
| S14 | NOT_STARTED |
| Único frente abierto de Journey 03 | S14_LOCAL_STORAGE_CAPACITY_AND_RETENTION |
| Alcance de los cierres | Ingeniería local validada; S1–S13/C1 no están desplegados |

C1 se registra como cierre acreditado por el checkpoint; no se inventa una denominación,
un commit propio ni una funcionalidad adicional para ese identificador.

## Producción y estado local

La autoridad para separar producción de ingeniería local es
[Runtime and Deploy Truth](../../architecture/04-runtime-and-deploy-truth.md).

La base de producción es GitHub main/Railway
ee65c324bf6780aeb6a25f6e97851cd3b2d7b0a3, tree
4447f531d62157fc3e469e1b9fb56d87087e9916, estado SUCCESS según el checkpoint autorizado.
El workspace PRE-S14 integra sobre esa base el delta local validado de S1–S13/C1.
El SHA de la base no identifica el contenido completo de ese árbol de trabajo.
No hay aquí un SHA de commit acreditado para el delta reconciliado.

## Capacidad local acreditada y referencias verificables

Las capacidades siguientes se limitan al circuito local acotado de landings compatibles.
No certifican generación libre, todos los flujos legacy del Builder ni un runtime multiagente.

| Capacidad | Implementación / prueba local |
|---|---|
| Propuesta separada de estado activo; delta validable; apply/revert con identidad before/after | [builderChangeTransaction.mjs](../../../frontend/src/features/builder/state/builderChangeTransaction.mjs), [pruebas](../../../frontend/src/features/builder/state/builderChangeTransaction.test.mjs) |
| Artefacto común entre candidate, preview y entrega; rechazo de manipulación | [landingArtifact.mjs](../../../frontend/src/features/builder/preview/landingArtifact.mjs), [pruebas](../../../frontend/src/features/builder/preview/landingArtifact.test.js) |
| Workspace durable local, owner/project, revisión condicional, aislamiento de sesión y concurrencia entre pestañas participantes | [durableLandingWorkspace.mjs](../../../frontend/src/features/builder/state/durableLandingWorkspace.mjs), [integración](../../../frontend/src/features/builder/workspace/hooks/useDurableLandingTransaction.js), [pruebas](../../../frontend/src/features/builder/workspace/hooks/durableRuntime.test.js) |
| Review verificable y mutaciones estructurales acotadas | [builderChangeReview.mjs](../../../frontend/src/features/builder/state/builderChangeReview.mjs), [staticSectionMutation.mjs](../../../frontend/src/features/builder/state/staticSectionMutation.mjs) |
| Propuesta compuesta ordenada, candidate final único y apply/revert atómicos | [compositeChange.test.mjs](../../../frontend/src/features/builder/state/compositeChange.test.mjs) |
| Validación funcional de artefacto y navegación; repair/revalidation con lineage | [functionalLandingValidation.mjs](../../../frontend/src/features/builder/preview/functionalLandingValidation.mjs), [boundedLandingRepair.mjs](../../../frontend/src/features/builder/state/boundedLandingRepair.mjs) |
| Destino CTA explícito derivado de estructura; coherencia semántica acotada | [ctaDestinationIntent.mjs](../../../frontend/src/features/builder/state/ctaDestinationIntent.mjs), [ctaSemanticCoherence.mjs](../../../frontend/src/features/builder/state/ctaSemanticCoherence.mjs) |
| Decisión humana y rationale asociados a la review | [humanSemanticDecision.mjs](../../../frontend/src/features/builder/state/humanSemanticDecision.mjs), [interfaz](../../../frontend/src/features/builder/panels/HumanSemanticDecision.js) |
| Recuperación durable de trabajo pendiente sin recuperar permiso para aplicar | [pendingWorkRecovery.test.mjs](../../../frontend/src/features/builder/state/pendingWorkRecovery.test.mjs) |
| Frontera explícita de autorización para transformar el estado | [authorizationBoundary.test.mjs](../../../frontend/src/features/builder/state/authorizationBoundary.test.mjs) |

El contrato vigente de estas capacidades se delimita en
[Contratos Técnicos V1, extensión PRE-S14](05-CONTRATOS-TECNICOS-V1.md#19-contrato-local-validado-pre-s14).
Navegación correcta y coherencia semántica son evaluaciones distintas. Una decisión
humana sobre un warning no sustituye la autorización explícita de apply.

## Validación PRE-S14 acreditada

| Comprobación | Resultado del checkpoint |
|---|---|
| Node | 69/69 PASS |
| Jest | 35/35 PASS |
| Build | PASS bajo Node 22 |
| Smoke | PASS |
| Falsification | PASS |

Los resultados proceden del checkpoint autorizado y de la reconciliación ya cerrada.
Esta intervención documental no vuelve a ejecutar Node, Jest, build ni smoke.
Los archivos enlazados permiten localizar los contratos y pruebas; su presencia por sí sola
no constituye un nuevo resultado de ejecución. No se inventan logs ni IDs de deployment.

El [inventario técnico](../../control/03-INVENTARIO-TECNICO.md) registra la identidad
del Gold Freeze de 409 archivos y RESTORE_PROOF=PASS. Ese freeze precede a esta
reconciliación documental y permanece intacto; no contiene estas modificaciones documentales.

## Límites conservados

- Proponer, revisar, reparar, guardar o recuperar no aplica automáticamente.
- Apply requiere identidad y revisión vigentes, validación funcional y autorización explícita.
- Revert restaura contenido y artefacto anteriores; registra una nueva revisión.
- Ownership local y Web Locks protegen a clientes participantes del mismo origen;
  no sustituyen autorización de servidor ni protegen frente a código hostil del mismo origen.
- La persistencia es local al navegador; no acredita sincronización remota ni conservación
  frente a borrado de datos del navegador.
- La ruta local acotada evita IA externa; esto no describe todas las rutas del Builder.
- Los cierres no autorizan producción, agentes nuevos, economía ni generación libre.

## Frente abierto único: S14

S14_LOCAL_STORAGE_CAPACITY_AND_RETENTION está abierto y NOT_STARTED.
Su objetivo pendiente es tratar capacidad y retención del almacenamiento local.
No están aprobados aquí límites numéricos, cuotas, TTL, eviction, compactación,
migraciones ni una política automática de eliminación.
No se implementa S14 mediante este documento.

El [backlog canónico](../../control/02-PENDIENTES-PRIORIZADOS.md) conserva el frente
abierto y separa los temas históricos sin cierre confirmado. La [política de Git y deploy](../../control/07-GIT-DEPLOY-HIGIENE.md)
rige cualquier promoción futura, que exige su propia autorización.
