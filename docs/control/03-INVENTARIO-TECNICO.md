# 03-INVENTARIO-TECNICO

## Estado vigente — S16 cerrado, 2026-10-07

Inventario de fuente y evidencia; no autoriza movimientos, borrados ni despliegues.
[Runtime](../architecture/04-runtime-and-deploy-truth.md) es propietario de la identidad de producción.
[Journey 03](../product/sistema-maestro/07-JOURNEY-03-ESTADO-PRE-S14.md) es propietario del cierre y validaciones de Journey 03; el [Master Maturity Roadmap](../product/sistema-maestro/08-MASTER-MATURITY-ROADMAP.md) posee los estados S14–S18 y J04–J16.

El checkpoint canónico de entrada a S14 y el baseline post-S15 se conservan como evidencia histórica; el estado vigente de S16 y su cierre se registran a continuación.

Como antecedente histórico, el checkout usado para el Gold post-S15 estaba en la rama del candidato S15 y limpio; su tree coincide con el commit de GitHub main e0f93c22bf9ac9fd1f4f005ad9dc1fb7b9ae2279. La identidad productiva vigente y el deployment pertenecen exclusivamente a Runtime and Deploy Truth.

## Cierre y publicación S16 — 2026-10-07

- S16_STATUS=CLOSED; READY_FOR_S17=YES; BLOCKERS=NONE.
- FINAL_GOLD_PREPUBLICATION=`GOLD_FREEZE_S16_POST_SANEO_FINAL_2026-10-05`; PASS; congelado antes de publicar. Su ruta y digest se conservan en el registro del checkpoint.
- CANDIDATE: branch `s16/runtime-identity`; commit de publicación `4322f7936a93c12eec288e44efcd3eb43d2a3639`; PR #83 MERGED. El candidato tenía 16 tracked modificados y 2 nuevos (`.nvmrc`, `.python-version`), 18 rutas en total; los dos archivos nuevos eran esperados, no contaminación.
- GITHUB_MAIN_SHA=`2b3f8c0345829273a3c92d08633e789334424a23`; PR_DIFF_SCOPE=PASS, exactamente las 18 rutas del candidato.
- RAILWAY_DEPLOYMENT_ID=`824b2d5b-12ad-4364-8464-9462679ffc9b`; RAILWAY_BUILD=SUCCESS; R2_RAILWAY_BUILD=PASS; RAILWAY_DEPLOYMENT=SUCCESS. La imagen Node `22.22.2-alpine` usó el digest fijado `sha256:8ea2348b068a9544dae7317b4f3aafcdc032df1647bb7d768a05a5cad1a7683f`.
- PRODUCTION_HEALTH=PASS (`/health` HTTP 200); PRODUCTION_HOME=PASS (HTTP 200); PRODUCTION_REGRESSION=NO; TRACEABILITY=PASS desde GitHub main al deployment Railway y producción.
- Evidencia prepublicación reutilizada: Node 22.22.2, Python 3.11, instalación y tests reproducibles PASS, backend 73 passed y 27 subtests, frontend build PASS, PRODUCT_CODE_CHANGED=NO. El Docker build local quedó NOT_RUN por indisponibilidad del engine; es distinto del Railway build PASS que cerró R2.
- R1 Review Target transport: diseño, shared transport y preflight PASS; target compartido, igualdad de hashes origen/destino y resolución del mismo target acreditados.
- R1 SM-ED: autoridad de la Skill personal canónica y materialización local soportada en este Work PASS; ENGINEERING_DIRECTOR=ACTIVE; SKILL_LOADED=YES; CONTRACT_APPLIED=YES. No se afirma sincronización automática entre runtimes.
- R1 wiring changeset: 7 archivos, hash `260f2972d98eb464175e1e461df6c68684f9918d6b8cabba2c1f9ebb54b84235`; es distinto de las 18 rutas del candidato S16.
- PRE-S17_SANITATION=PASS contra `S16-PRE-S17-7ab084f38d8de39b-20261005T1305Z`, target SHA-256 `2bebd818e4d205043a6209a201cadfac5cc2be55eecc10204e59dbbcb7cf85b8`; SM-FS=PASS, SM-QA=PASS_WITH_EVIDENCE_LIMITATION, SM-SEC=PASS; critical findings=0; FIX_BEFORE_S17=0; candidate contamination=NO; documentation divergence=NO; secret exposure=NO.
- REVIEW_TARGET_TRANSPORT_ROOT_FIX=PASS: bundle e integridad del target verificados después de la materialización compartida; hashes origen/destino coinciden y FS/QA/SEC resolvieron la misma referencia. No cambió código de producto.
- OBS-01: adjuntar/referenciar evidencia cruda e inmutable en futuros Review Targets cuando se requiera reverificación independiente. CLASSIFICATION=STRATEGIC_OPTIMIZATION; DISPOSITION=DEFER.
- CHECKPOINT_POST_S16=CREATED/PASS; BASELINE_FOR_S17=READY; S17=NOT_OPENED. La identidad e integridad del Gold constan a continuación.

## Gold Freeze post-S16 cerrado — PASS

- GOLD_NAME: `GOLD_FREEZE_POST_S16_CLOSED_2026-10-07`
- PATH: `Backups/GOLD/GOLD_FREEZE_POST_S16_CLOSED_2026-10-07`
- SOURCE_BRANCH: `main`; SOURCE_HEAD: `467199979544ca548191813d7325377de1e636ea`
- SOURCE_TREE: `36116b9f65754e59ea1fa22ff09685c4651dce42`
- LOCAL_HEAD = ORIGIN_MAIN = GITHUB_MAIN: YES; WORKTREE: CLEAN
- FILES_EXPECTED / FILES_COPIED: `413 / 413`
- SHA256_MATCH: YES; GLOBAL_DIGEST: `aa9d62264223ed4ea654ef4ce7d65b556ce53206e2ec3c0b8b06981c053a08db`
- SECRETS_INCLUDED: NO; PREVIOUS_GOLDS_PRESERVED: YES; RESTORE_CHECK: PASS; SOURCE_MODIFIED: NO
- BASELINE_FOR_S17=READY; S17=NOT_OPENED.

El Gold post-S16 congela el baseline cerrado inmediatamente anterior a S17. El Gold S16 prepublicación que aparece abajo se conserva como checkpoint histórico distinto.

## Gold Freeze post-S17 canónico — integridad verificada, revisión de seguridad pendiente

- GOLD_NAME: `GOLD_FREEZE_POST_S17_CANONICAL_2026-10-10`
- PATH: `Backups/GOLD/GOLD_FREEZE_POST_S17_CANONICAL_2026-10-10`
- SOURCE_COMMIT: `0eb89345f77c2bfda3ea9582fe1aac94346a974b`
- SOURCE_TREE: `2b76c4b57a1ae34379c87f71c44c8303e31a2070`
- FILES_EXPECTED / FILES_COPIED: `417 / 417`; QA verificó independientemente 417 hashes coincidentes y cero ausentes o divergentes.
- GLOBAL_DIGEST: `8cccacf8a6e68aa8710dc5083495bd0a45ae727810eceed2dbd56b6e65210968`; registrado en el manifiesto, no reproducido independientemente en la revisión QA.
- MANIFEST_SHA256: `d0eb0952ce18d8738c8e55062e325c0b4cc94d9ae54f590e344dee001aa0ead0`
- EVIDENCE_SUMMARY_SHA256: `73a090645c89b803ec2c60585b5d863c35e3d15438d93d3642fd076c22ac8861`
- RESTORE_CHECK: PASS registrado; QA no pudo reejecutar la restauración porque los registros originales no están en el paquete.
- SM_QA=APPROVED_WITH_RISKS; limitaciones: logs de pruebas ausentes, digest global no reproducido y restauración solo registrada.
- SM_SEC=BLOCKED_PENDING_SIGNAL_CLASSIFICATION. Revisión no intrusiva informó una señal agregada de patrón de asignación sensible sin clasificación; no se registra ni reproduce su valor o ruta. No se considera secreto confirmado.
- SECRET_SCREEN=LIMITED; sin escáner dedicado, 39 archivos no fueron examinados como texto y la señal SEC sigue sin clasificar. No es certificación absoluta de ausencia de secretos.
- El estado de integridad del Gold y la revisión SEC son independientes; este registro no altera el cierre humano S17 ni declara TECHNICAL_PASS.

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

## Gold Freeze S16 final prepublicación — PASS

- PATH: §Backups/GOLD/GOLD_FREEZE_S16_POST_SANEO_FINAL_2026-10-05§
- SOURCE_COMMIT: §7ab084f38d8de39baa6a79b566a74a168b91a8cb§
- SOURCE_TREE: §36e7c83cf16e6e95a610625f197f6e093f4a0b73§
- S16_PATHS: 16 tracked modified + 2 new (§.nvmrc§, §.python-version§) = 18
- FILES_EXPECTED / FILES_COPIED: 413 / 413
- SHA256_MATCH: YES; GLOBAL_DIGEST: §50e79cf8d98bee5c7f2beff1b321914948e59cc5c8ae2aa1aaf7bff394c3241c§
- MANIFEST_SHA256: §d4b3833629bd8b1745e1c903a065617bfd975c938dfebf6d5e2f344cafe1c44d§
- RESTORE_CHECK: PASS; el conjunto de archivos y los SHA-256 por archivo coinciden.
- STATUS: FROZEN_PREPUBLICATION; no es el checkpoint post-S16.

El checkpoint preserva el candidato S16 antes de su publicación. El cierre y los identificadores de producción publicados se registran en Runtime and Deploy Truth y en la sección de cierre S16 anterior.

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
