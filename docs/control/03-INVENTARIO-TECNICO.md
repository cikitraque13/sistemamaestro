# 03-INVENTARIO-TECNICO

## Estado vigente — release PRE-S14, 2026-10-02

Inventario de fuente y evidencia; no autoriza movimientos, borrados ni despliegues.
[Runtime](../architecture/04-runtime-and-deploy-truth.md) es propietario de la identidad de producción.
[Journey 03](../product/sistema-maestro/07-JOURNEY-03-ESTADO-PRE-S14.md) es propietario del release, sus validaciones y S14.
`main=0574e0c01f2a4abdf2dcf3ddc6fd03d17d3774d7`; tree `f8d53f0636a474eb7928dbd860649a48a37eab3`.
Railway production deployment `7630d6f0-b3bd-4451-9050-af287b4a3b34=SUCCESS`; main y Railway coinciden.
El candidato de producto `a370f219fbcc569a0cee853a609ef4fa311063b0` se integró y desplegó. El SHA actual corresponde a la publicación documental post-release previa; esta actualización de higiene y preparación de entrada a S14 aún está pendiente de publicar.

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
remota ni a autorización de servidor. Capacidad/retención siguen pendientes de S14;
no hay aquí TTL, cuotas o borrado aprobados. Los flujos legacy y generación IA
general no quedan certificados por el cierre del circuito local.

## Gold Freeze PRE-S14 vigente

- PATH: `Backups/GOLD/GOLD_FREEZE_FINAL_PRE_S14_2026-10-02`
- SOURCE_COMMIT: `0574e0c01f2a4abdf2dcf3ddc6fd03d17d3774d7`
- SOURCE_TREE: `f8d53f0636a474eb7928dbd860649a48a37eab3`
- RESTORE_TEST: PASS
- MANIFEST_SHA256: `a1d35091f85f2e8248cbea33d0caea2129f6d2018fc9c966861488df5a869bbe`
- GLOBAL_DIGEST: `53700a34f371786cb679006ac1612c4ed9ef42c184afcac1c5a57feb8dff46eb`

Este checkpoint representa el release PRE-S14 y conserva su restauración verificada. Se creó antes del cierre de higiene final del workspace y de esta reconciliación documental; por ello no se trata como checkpoint definitivo de entrada a S14. Tras publicar y verificar estos documentos se creará, en un gate separado, `GOLD_FREEZE_S14_ENTRY_2026-10-02`.

## Material regenerable y límites

En el saneamiento previo se retiraron `frontend/node_modules` y `frontend/build`; con Vite, el output regenerable actual es `frontend/dist`.
Dependencias instaladas, builds, cachés y temporales no son fuente del producto.
El manifiesto y lockfile se conservan. No se leen ni copian secretos.

En el preflight previo a esta reconciliación documental, el workspace local canónico estaba en `main`, alineado con `origin/main` y limpio. La raíz `S.Maestro` contiene solo `sistemamaestro/` y `Backups/GOLD/GOLD_FREEZE_FINAL_PRE_S14_2026-10-02/`; `EVIDENCE`, `EXPERIMENTS`, `HISTORICAL` y el ZIP histórico se retiraron durante la higiene final. S1–S13/C1 están desplegados como parte del release PRE-S14; S14 sigue NOT_STARTED y requiere el checkpoint independiente de entrada descrito en Journey 03.
