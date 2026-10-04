# 03-INVENTARIO-TECNICO

## Estado vigente — S15 cerrado, 2026-10-05

Inventario de fuente y evidencia; no autoriza movimientos, borrados ni despliegues.
[Runtime](../architecture/04-runtime-and-deploy-truth.md) es propietario de la identidad de producción.
[Journey 03](../product/sistema-maestro/07-JOURNEY-03-ESTADO-PRE-S14.md) es propietario del cierre y validaciones de Journey 03; el [Master Maturity Roadmap](../product/sistema-maestro/08-MASTER-MATURITY-ROADMAP.md) posee los estados S14–S18 y J04–J16.

El checkpoint canónico de entrada a S14 se conserva como evidencia histórica en la sección Gold S14 Entry histórico; el baseline vigente post-S15 se registra a continuación.

El checkout local observado para el Gold post-S15 está en la rama del candidato S15 y limpio; su tree coincide con el commit de GitHub main e0f93c22bf9ac9fd1f4f005ad9dc1fb7b9ae2279. La identidad productiva y el deployment pertenecen exclusivamente a Runtime and Deploy Truth.

## Fuente y estructura material

| Área | Rutas y responsabilidad |
|---|---|
| Frontend | [src](../../frontend/src/), [public](../../frontend/public/): producto modular, assets y UI |
| Módulos | [features](../../frontend/src/features/): Home, auth, app-shell, dashboard, Builder, oportunidades, proyectos, billing, informes y settings |
| Backend | [app](../../backend/app/), [entrada](../../backend/app/main.py): FastAPI, routers, servicios, auth y persistencia |
| IA | [backend/app/ai](../../backend/app/ai/): contratos, generador conectado y componentes preparados; no certifica orquestación multiagente completa |
| Economía | [config/credits](../../backend/config/credits/): capa existente, no modificada por Journey 03 local |
| Manifiestos | [package.json](../../frontend/package.json), [package-lock.json](../../frontend/package-lock.json), [requirements](../../backend/requirements.txt) |
| Runtime | [Dockerfile](../../Dockerfile), [railway.json](../../railway.json): Vite genera `frontend/dist`; Python sirve el build estático |
| Pruebas | [tests](../../tests/), [backend/tests](../../backend/tests/), pruebas junto al código frontend; material de validación que debe conservarse |
| Gobierno | [Índice maestro](00-INDICE-MAESTRO.md), [contratos](../product/sistema-maestro/05-CONTRATOS-TECNICOS-V1.md), [pendientes](02-PENDIENTES-PRIORIZADOS.md) |

## Builder materializado

[builder/state](../../frontend/src/features/builder/state/) existe; no es una creación pendiente.
Incluye kernel, estado, registry, output y contratos de transacción.
[builder/workspace](../../frontend/src/features/builder/workspace/) integra el circuito visible.

El release PRE-S14 incluye el circuito S1–S13/C1: propuesta/validación/review, candidate y artefacto
comunes a preview/apply/entrega, revert exacto, mutaciones estructurales y compuestas,
validación funcional y reparación, intención CTA, coherencia semántica acotada,
decisión humana, workspace durable owner/project, concurrencia, recuperación pendiente
y autorización explícita. La validación técnica y los límites de cobertura están enlazados en Journey 03.

La persistencia de este circuito es local al navegador; no equivale a persistencia
remota ni a autorización de servidor. S14 implementa capacidad, retención/compactación,
history/revert y fallo cerrado ante cuota únicamente en `sistemamaestro:durable:v1`;
la evidencia del cierre y los límites están en Journey 03. Los flujos legacy y generación IA
general no quedan certificados por el cierre del circuito local.

## Gold Freeze post-S15 cerrado

- PATH: Backups/GOLD/GOLD_FREEZE_POST_S15_CLOSED_BASELINE_2026-10-05
- SOURCE_COMMIT: e0f93c22bf9ac9fd1f4f005ad9dc1fb7b9ae2279
- SOURCE_TREE: 523e0f1bee92c59e7d5058426952862beb7da5ab
- FILES_EXPECTED / FILES_COPIED: 411 / 411
- SHA256_MATCH: YES; GLOBAL_DIGEST: 270ae0c7d137217d72a98aacd57b4c4db3f6a2551c7b76007f11f1af95a9bf9c
- MANIFEST_SHA256: cf26de2ad77255bc18679d6349e2139de6836e39c6653724b0d2d4914bec6572
- SECRETS_INCLUDED: NO; secret scan matches: 0; RESTORE_CHECK: PASS
- PREVIOUS_GOLDS_PRESERVED: YES; WORKTREE_CLEAN: YES en el checkout local usado para crear el freeze.

El Gold congela el commit de GitHub main. El checkout local estaba en el candidato S15 y limpio; su tree coincide con el source tree congelado.

## Gold PRE-S14 anterior

- PATH: `Backups/GOLD/GOLD_FREEZE_FINAL_PRE_S14_2026-10-02`
- SOURCE_COMMIT: `0574e0c01f2a4abdf2dcf3ddc6fd03d17d3774d7`
- SOURCE_TREE: `f8d53f0636a474eb7928dbd860649a48a37eab3`
- RESTORE_TEST: PASS
- MANIFEST_SHA256: `a1d35091f85f2e8248cbea33d0caea2129f6d2018fc9c966861488df5a869bbe`
- GLOBAL_DIGEST: `53700a34f371786cb679006ac1612c4ed9ef42c184afcac1c5a57feb8dff46eb`

Se conserva como checkpoint válido del release PRE-S14 y antecedente del checkpoint de entrada; no se sobrescribe ni se reclasifica como el Gold S14 Entry.

## Gold S14 Entry histórico

- PATH: `Backups/GOLD/GOLD_FREEZE_S14_ENTRY_2026-10-02`
- SOURCE_COMMIT: `3b0a23a96711a7be9d2fa42ccce101882c328295`
- SOURCE_TREE: `3c1d8e2b2b2b3de88bcc994bdd5482340e0cc57c`
- FILES_EXPECTED / FILES_COPIED: `407 / 407`
- GLOBAL_DIGEST: `f9d4c9be1eca11cb84eca66e32b59f047a1c274b8bedb70b77a488a800b90f47`
- MANIFEST_SHA256: `b7759af339715907e073c0d3cb8ba0b2385fd7af47c56f7237bf4002130daff1`
- RESTORE_TEST: PASS como evidencia externa previa; el manifiesto no prueba la restauración.

Este checkpoint conserva la evidencia primaria de identidad/integridad de entrada a S14; no es el Gold del estado implementado. El estado de S14 consta en el [Master Maturity Roadmap](../product/sistema-maestro/08-MASTER-MATURITY-ROADMAP.md).

## Implementación S14 cerrada

- NAMESPACE_MUTABLE: `sistemamaestro:durable:v1`
- POLICY: límite 384 KiB; umbral soft 288 KiB; margen 96 KiB; horizonte 90 días; historial máximo 64; profundidad mínima de revert 24; compactación oldest-history-first.
- FAILURE_SAFETY: construir y validar el reemplazo antes de persistir; ante fallo de cuota/setItem, rechazo fail-closed y bytes durable anteriores preservados.
- PRESERVATION: current state, pending work, provenance/decisions, anti-replay y aislamiento owner/project.
- IMPLEMENTATION_FILES: [durableLandingWorkspace.mjs](../../frontend/src/features/builder/state/durableLandingWorkspace.mjs), [durableLandingWorkspace.test.mjs](../../frontend/src/features/builder/state/durableLandingWorkspace.test.mjs), [pendingWorkRecovery.test.mjs](../../frontend/src/features/builder/state/pendingWorkRecovery.test.mjs).
- VALIDATION: 79/79 tests PASS; SM-SEC PASS; QA independiente PASS; diff limitado a los tres archivos autorizados.
- RELEASE_IDENTITY: commit y verificación de producción en [Runtime and Deploy Truth](../architecture/04-runtime-and-deploy-truth.md); cierre Journey 03 en [Journey 03](../product/sistema-maestro/07-JOURNEY-03-ESTADO-PRE-S14.md).

Alcance cerrado: no se modificaron otros namespaces, UI, MongoDB ni Railway como superficie de cambio. La persistencia permanece local al navegador.

## Material regenerable y límites

En el saneamiento previo se retiraron `frontend/node_modules` y `frontend/build`; con Vite, el output regenerable actual es `frontend/dist`.
Dependencias instaladas, builds, cachés y temporales no son fuente del producto.
El manifiesto y lockfile se conservan. No se leen ni copian secretos.

En el preflight de entrada, el checkout canónico estaba en `main`, alineado con `origin/main` y limpio; la identidad del checkpoint se conserva en la sección Gold S14 Entry vigente. La raíz `S.Maestro` quedó limitada a `sistemamaestro/` y `Backups/`; los andamios EVIDENCE, EXPERIMENTS, HISTORICAL y el ZIP histórico se retiraron. S1–S13/C1 forman parte del release PRE-S14 desplegado. El estado de S14 pertenece al [Master Maturity Roadmap](../product/sistema-maestro/08-MASTER-MATURITY-ROADMAP.md).
