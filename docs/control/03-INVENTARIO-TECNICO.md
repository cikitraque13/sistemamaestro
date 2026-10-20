# 03-INVENTARIO-TECNICO

## Estado vigente — 2026-10-20

Inventario de fuente y evidencia; no autoriza movimientos, borrados ni despliegues.
[Runtime](../architecture/04-runtime-and-deploy-truth.md) es propietario de la identidad de producción.
[Journey 03](../product/sistema-maestro/07-JOURNEY-03-ESTADO-PRE-S14.md) es propietario del cierre y validaciones de Journey 03; el [Master Maturity Roadmap](../product/sistema-maestro/08-MASTER-MATURITY-ROADMAP.md) posee los estados S14–S18 y J04–J16.

S14, S15 y S16 están COMPLETED; S17 y S18 conservan sus cierres humanos con limitaciones; J03 queda cerrado con limitaciones. J04 sigue CLOSED_BY_HUMAN_ACCEPTANCE, TECHNICAL_STATUS=PARTIAL y TECHNICAL_PASS=NO. J05 está COMPLETED con TECHNICAL_PASS=YES para su contrato, con riesgos residuales registrados. El [roadmap](../product/sistema-maestro/08-MASTER-MATURITY-ROADMAP.md) posee los estados y límites; este inventario no los sustituye.

## Inventario observado de checkpoints — 2026-10-17

La inspección local observó cinco directorios bajo `Backups/GOLD` y dos paquetes bajo `Backups/EVIDENCE`. La presencia en disco se distingue de la acreditación de integridad, restauración o exclusión de secretos.

| Gold observado | Evidencia registrada | Estado en este inventario |
|---|---|---|
| `GOLD_FREEZE_POST_J03_2026-10-16` | 414 / 414; digest y restauración PASS constan en registros previos | Acreditación previa conservada; no repetida aquí |
| `GOLD_FREEZE_POST_S17_PRE_J04_2026-10-16` | Manifiesto y registro de restauración consignan 414 / 414 archivos; origen `16a6daf6fbce3886df728131f7ee5b4fa373bec9`, tree `0884bbcb0fe93112363418df4f8b9a978ef16685`, digest `d0a409f84c8ce7f13895f45df9a381d876c1941c138218c36acbd97616e90966`; la restauración registra 414 archivos restaurados y `all_sha256_match=True` | Integridad/restauración registradas como verificadas; evidencia de registros existentes, no una revalidación independiente en esta revisión. La exclusión de secretos conserva su propia limitación |
| `GOLD_FREEZE_POST_S17_PRE_S18_PUBLISHED_2026-10-11` | 413 / 413 y restauración PASS constan en registros previos | Acreditación previa conservada; no repetida aquí |
| `GOLD_FREEZE_POST_SANITATION_PRE_S18_2026-10-10` | 415 / 415; digest, restauración y QA/SEC con reservas constan en registros previos | Acreditación previa conservada con sus reservas; no repetida aquí |
| `GOLD_FREEZE_POST_J04_2026-10-17` | Origen `decc927145cae257b89140cf098b902d206ab206`, tree `55c9ead39e98019cc3de73492e7aaa31cfdb850a`, 416 / 416, SHA-256 coincidente, digest `f28d606ec5ac23eab0c3e9b2c60347f4beaeaef741365bb6729d555f36dd7e55`; restauración aislada PASS | Integridad y restauración registradas PASS; revisión de exclusión de valores secretos pendiente/inconclusa: filtro de rutas PASS, escaneo de valores UNVERIFIED |

En `Backups/EVIDENCE` se observaron exactamente dos paquetes: `GOLD_FREEZE_POST_S17_PRE_S18_PUBLISHED_2026-10-11` y `HISTORICAL_CONSOLIDATED_PRE_J04_2026-10-16`. El paquete consolidado conserva el archivo histórico y el paquete de preservación local: 5.595 / 5.595 archivos verificados; digest global `4f8aa07bcd71a631009a30a9b0f7e9b89a410f869d27d225120bc0fb4740a021`; SHA-256 del manifiesto `19057fdc6cd6c01bf84cad315ab399086a28e3c991caf868199ef8f95a59ef38`.

El Gold POST-J04 contiene 416 archivos de payload verificados y sus metadatos registran tres rutas de entorno excluidas, cero rutas incluidas nombradas como credencial/secreto, y una restauración aislada con 416 hashes coincidentes. `value_level_scan=UNVERIFIED`: GitHub secret scanning está deshabilitado y no hay escáner local dedicado; no se inspeccionaron valores. Por tanto, el estado del Gold no certifica ausencia absoluta de secretos. No se modificaron ni revalidaron los Gold o Evidence anteriores durante esta actualización.

Los registros de restauración disponibles consignan: para `GOLD_FREEZE_POST_J03_2026-10-16`, `files_restored=414` y `all_sha256_match=True`; para el paquete Evidence `GOLD_FREEZE_POST_S17_PRE_S18_PUBLISHED_2026-10-11`, `result=PASS`, `file_count=413` y comparación exacta de archivos, rutas, SHA-256 y Git blob; para `HISTORICAL_CONSOLIDATED_PRE_J04_2026-10-16`, `result=PASS` con tres `restoredPaths`. Estos resultados son registros existentes; no se reejecutaron ni verificaron de forma independiente durante esta revisión final.

Límites restantes: no se usó un escáner dedicado de secretos ni se certifica ausencia absoluta; las revisiones QA/SEC previas no quedaron vinculadas a un target identificable y no se presentan aquí como acreditación independiente de este inventario. Los registros Gold posteriores en este documento conservan sus nombres y datos de origen; sus rutas son referencias históricas de creación. Los snapshots que ya no figuran entre los tres Gold directos se preservan en el archivo consolidado, no se reclasifican como actuales ni se eliminan por esta actualización.

El checkpoint canónico de entrada a S14 y los Gold posteriores se conservan como evidencia histórica; el estado vigente de producción/runtime se registra en [Runtime and Deploy Truth](../architecture/04-runtime-and-deploy-truth.md).

## Atlas Testing — evidencia J05-V2/V3

El entorno de integración informado y utilizado para J05 es el proyecto Atlas independiente `Sistema Maestro - Testing`, clúster `SM-Testing` (FREE/M0), base `sistemamaestro_test` y usuario técnico con rol `readWrite` limitado a esa base. La URI se introdujo localmente en forma oculta y no se incorpora al repositorio ni a este inventario. Atlas MCP se utilizó para metadatos administrativos de solo lectura; las pruebas funcionales se ejecutaron con el runner local contra el entorno de testing.

Para J05-V3 se registró `TESTS_COLLECTED=8`, `TESTS_PASSED=8`, `TESTS_FAILED=0`, clasificador mock y `CLEANUP=PASS_DELETED_AND_VERIFIED`. Esto acredita las operaciones de memoria probadas contra MongoDB de testing y la limpieza sintética; no acredita precisión del proveedor real, ejecución funcional en producción ni exclusión absoluta de secretos del Gold. No se consultó Project 0 / Cluster0 como parte de la validación.

El inventario local observado el 2026-10-17 conservaba cinco directorios Gold y dos paquetes Evidence; la misma carpeta `GOLD_FREEZE_POST_S17_PRE_S18_PUBLISHED_2026-10-11` aparecía bajo Gold y Evidence. Esa observación precede al checkpoint POST-J05 descrito a continuación y no representa el conteo vigente.

## Conteo local observado — 2026-10-20, después de PR #103

Una enumeración local de directorios confirmó seis carpetas bajo `Backups/GOLD` y dos bajo `Backups/EVIDENCE`. Esta comprobación acredita nombres y presencia, no integridad, equivalencia entre copias ni restaurabilidad; no se leyeron ni modificaron los contenidos.

Gold observados: `GOLD_FREEZE_POST_J03_2026-10-16`, `GOLD_FREEZE_POST_J04_2026-10-17`, `GOLD_FREEZE_POST_J05_2026-10-20`, `GOLD_FREEZE_POST_S17_PRE_J04_2026-10-16`, `GOLD_FREEZE_POST_S17_PRE_S18_PUBLISHED_2026-10-11` y `GOLD_FREEZE_POST_SANITATION_PRE_S18_2026-10-10`.

Evidence observados: `GOLD_FREEZE_POST_S17_PRE_S18_PUBLISHED_2026-10-11` y `HISTORICAL_CONSOLIDATED_PRE_J04_2026-10-16`. El primer nombre también aparece en GOLD; esta enumeración no determina si ambas copias son idénticas o redundantes. No se retiró ni sobrescribió ningún backup.

## Gold Freeze POST-J05 — 2026-10-20

GOLD=PASS. `GOLD_FREEZE_POST_J05_2026-10-20` está creado en `Backups/GOLD/GOLD_FREEZE_POST_J05_2026-10-20`, desde GitHub main commit `e7370c323267f5c2f105a3c3b7265ea9723719a7` (tree `55e676ebe60ac26ffa7a779a32ad897e56e02c47`). El checkpoint registró 422 / 422 archivos copiados y verificados, SHA-256 coincidentes, digest global `1186BD5225FBBC7537E0BB0C5D143E35FFFBFF38259FF1F1B9BED85750E4154F`, SHA-256 del manifiesto `85F936A0BBF22950206A62E0C2B68ED4DA3F658BACE2494AE6D9377988482585` y restauración aislada PASS. El filtro de exclusión retiró `.env*`, dependencias, cachés, temporales y backups anteriores del conjunto; el escaneo de patrones no encontró coincidencias, pero no constituye certificación absoluta de ausencia de secretos. Los Gold y Evidence anteriores se conservaron.

Como antecedente histórico, el checkout usado para el Gold post-S15 estaba en la rama del candidato S15 y limpio; su tree coincide con el commit de GitHub main e0f93c22bf9ac9fd1f4f005ad9dc1fb7b9ae2279. La identidad productiva vigente y el deployment pertenecen exclusivamente a Runtime and Deploy Truth.

## Registro histórico: cierre y publicación S16 — 2026-10-07

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

## Gold pre-S18 — checkpoints preservados

Los dos checkpoints siguientes corresponden a fuentes distintas y se conservan sin sobrescribirlos. Sus recuentos y revisiones no deben compararse como si fueran el mismo paquete.

### Entrada pre-ejecución S18

- GOLD_NAME: `GOLD_FREEZE_PRE_S18_EXECUTION_2026-10-10`
- PATH: `Backups/GOLD/GOLD_FREEZE_PRE_S18_EXECUTION_2026-10-10`
- SOURCE_COMMIT: `77b540f0fb423b2e56d97dd78fd12ad299530124`
- SOURCE_TREE: `2b76c4b57a1ae34379c87f71c44c8303e31a2070`
- FILES_VERIFIED: `417 / 417`; RESTORE_CHECK=PASS registrado.
- LIMITATION: checkpoint de integridad/recuperación, no certificación funcional.

### Posterior al saneamiento y previo a ejecución S18

- GOLD_NAME: `GOLD_FREEZE_POST_SANITATION_PRE_S18_2026-10-10`
- PATH: `Backups/GOLD/GOLD_FREEZE_POST_SANITATION_PRE_S18_2026-10-10`
- SOURCE_COMMIT: `ead9f4e796f9e2be89a8d0b7948364edbf67066b`
- SOURCE_TREE: `bfa0db0b43dc29167ff87be277312f9f2813e502`
- FILES_VERIFIED: `415 / 415`; RESTORE_CHECK=PASS registrado por el owner.
- GLOBAL_DIGEST: `5c1fd8840700b00618a6b6de8a6f7ef2117324c7473b7bfd738b353cb79fa5257`
- MANIFEST_SHA256: `bac5a775ca06f09958a02af19617efd2789bc377afa29ba9bfe8d86a0c8f7d4a`
- SM_QA / SM_SEC: `APPROVED_WITH_RISKS`.
- SECRET_SCREEN: INCONCLUSIVE; una señal de patrón quedó sin clasificación y dos coincidencias de ejemplo se verificaron solo por nombre de archivo. No se afirma ausencia absoluta de secretos.
- LIMITATION: Gold de checkpoint, no PASS funcional de S18; los Gold anteriores no tienen baseline byte a byte para una comparación retrospectiva.

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

Las declaraciones `SECRETS_INCLUDED: NO` y `secret scan matches: 0` de este registro describen exclusivamente el resultado histórico consignado para ese Gold; no certifican el inventario vigente ni el contenido actual de otros paquetes.

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

En el preflight de entrada, el checkout canónico estaba en `main`, alineado con `origin/main` y limpio; la identidad del checkpoint se conserva en la sección Gold S14 Entry histórica. La raíz `S.Maestro` quedó limitada a `sistemamaestro/` y `Backups/`; los andamios EVIDENCE, EXPERIMENTS, HISTORICAL y el ZIP histórico se retiraron. S1–S13/C1 forman parte del release PRE-S14 desplegado. El estado de S14 pertenece al [Master Maturity Roadmap](../product/sistema-maestro/08-MASTER-MATURITY-ROADMAP.md).
