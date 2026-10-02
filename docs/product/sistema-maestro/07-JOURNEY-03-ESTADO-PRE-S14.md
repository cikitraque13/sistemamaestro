# Journey 03 — Estado canónico PRE-S14

## Estado de release y autoridad — 2026-10-02

Este documento es el propietario canónico del estado de Journey 03, el cierre del release PRE-S14,
sus validaciones y el siguiente frente. La preparación técnica local se integró mediante el release
autorizado por HUMAN-LUCAS.

| Estado | Valor |
|---|---|
| S1, S2, S3A, S3B, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13 | COMPLETED |
| C1 | COMPLETED |
| PRE-S14 release | CLOSED / DEPLOYED / VERIFIED |
| HUMAN_GATE_2 | PASS |
| S14 | NOT_STARTED |
| Único frente abierto de Journey 03 | S14_LOCAL_STORAGE_CAPACITY_AND_RETENTION |
| Alcance | El release contiene el alcance acotado S1–S13/C1; no certifica todos los flujos legacy ni el producto completo |

C1 se registra como cierre acreditado por el checkpoint; no se inventa una denominación,
un commit propio ni una funcionalidad adicional para ese identificador.

## Identidad de producción y release

La autoridad para la identidad y runtime de producción es
[Runtime and Deploy Truth](../../architecture/04-runtime-and-deploy-truth.md).

| Elemento | Identidad / resultado |
|---|---|
| Rama candidata | `codex/vite-migration` |
| Candidato validado | `a370f219fbcc569a0cee853a609ef4fa311063b0` |
| GitHub main / merge documental final | `0574e0c01f2a4abdf2dcf3ddc6fd03d17d3774d7` |
| Tree desplegado | `f8d53f0636a474eb7928dbd860649a48a37eab3` |
| Railway production deployment | `7630d6f0-b3bd-4451-9050-af287b4a3b34` — `SUCCESS` |
| Main ↔ Railway | `MATCH` |

El candidato incorpora la migración CRA/CRACO a Vite/Vitest y el saneamiento de dependencias críticas/high. El merge commit exacto de `main` fue desplegado por el auto-deploy normal de Railway; no se ejecutó un deploy manual.

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

## Validación técnica local del checkpoint PRE-S14

Esta tabla conserva la validación técnica local acreditada antes de la promoción. La evidencia del release productivo se registra por separado debajo.

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

El [inventario técnico](../../control/03-INVENTARIO-TECNICO.md) registra el Gold Freeze PRE-S14 vigente y su identidad verificable.

## Validación del release en producción

| Comprobación | Resultado acreditado |
|---|---|
| `npm ls` | PASS |
| npm audit | 0 CRITICAL / 0 HIGH; `--omit=dev` HIGH=0 |
| MJS | 69/69 PASS |
| Vitest | 36/36 PASS |
| Build / Docker / runtime | PASS |
| Health / home / assets | PASS |
| Login con Google / OAuth E2E | PASS; sesión creada, callback correcto, sin redirect loop |
| Dashboard / Builder / deep route | Render PASS |
| Browser runtime errors / material visible errors | NONE_OBSERVED |
| Regresión detectada | NO |
| SM-QA / SM-SEC | APPROVED_WITH_RISKS / APPROVED_WITH_RISKS |

La limitación residual es de observabilidad: `/api/auth/me` no se observó directamente porque el navegador devolvió `ERR_BLOCKED_BY_CLIENT`. La autenticación quedó verificada funcionalmente mediante OAuth E2E, sesión autenticada y acceso a superficies privadas. No se afirma haber observado directamente la respuesta de ese endpoint.

## Cierre de higiene y checkpoint de entrada a S14

| Comprobación | Estado |
|---|---|
| Workspace hygiene | PASS; la raíz contiene solo `sistemamaestro/` y `Backups/`; dentro de Backups solo queda `GOLD/` |
| Eliminación de andamios | `EVIDENCE`, `EXPERIMENTS`, `HISTORICAL` y el ZIP histórico retirados |
| Preflight del checkout local | `main` = `origin/main` = `0574e0c01f2a4abdf2dcf3ddc6fd03d17d3774d7`; estado limpio antes de esta reconciliación documental |
| Gold Freeze PRE-S14 | `GOLD_FREEZE_FINAL_PRE_S14_2026-10-02`; válido, `RESTORE_TEST=PASS` |
| Digest global / manifiesto | `53700a34f371786cb679006ac1612c4ed9ef42c184afcac1c5a57feb8dff46eb` / `a1d35091f85f2e8248cbea33d0caea2129f6d2018fc9c966861488df5a869bbe` |
| Entrada formal a S14 | Pendiente de crear y verificar el Gold independiente `GOLD_FREEZE_S14_ENTRY_2026-10-02` tras publicar esta reconciliación documental |

El Gold existente es un checkpoint válido del release PRE-S14, pero precede a la higiene final del workspace y a esta reconciliación documental; no se declara checkpoint definitivo de entrada a S14. La preparación técnica para S14 está lista, pero su apertura formal queda pendiente del nuevo Gold de entrada.

## Límites conservados

- Proponer, revisar, reparar, guardar o recuperar no aplica automáticamente.
- Apply requiere identidad y revisión vigentes, validación funcional y autorización explícita.
- Revert restaura contenido y artefacto anteriores; registra una nueva revisión.
- Ownership local y Web Locks protegen a clientes participantes del mismo origen;
  no sustituyen autorización de servidor ni protegen frente a código hostil del mismo origen.
- La persistencia es local al navegador; no acredita sincronización remota ni conservación
  frente a borrado de datos del navegador.
- La ruta local acotada evita IA externa; esto no describe todas las rutas del Builder.
- El gate de release autorizó únicamente la promoción PRE-S14 descrita aquí; este documento no autoriza promociones futuras, agentes nuevos, cambios de economía ni generación libre.

## Frente abierto único: S14

S14_LOCAL_STORAGE_CAPACITY_AND_RETENTION está abierto y NOT_STARTED.
Su objetivo pendiente es tratar capacidad y retención del almacenamiento local.
No están aprobados aquí límites numéricos, cuotas, TTL, eviction, compactación,
migraciones ni una política automática de eliminación.
No se implementa S14 mediante este documento.

El [backlog canónico](../../control/02-PENDIENTES-PRIORIZADOS.md) conserva el frente
abierto y separa los temas históricos sin cierre confirmado. La [política de Git y deploy](../../control/07-GIT-DEPLOY-HIGIENE.md)
rige cualquier promoción futura, que exige su propia autorización.
