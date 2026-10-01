# 03-INVENTARIO-TECNICO

## Estado vigente — PRE-S14, 2026-10-01

Inventario de fuente y evidencia; no autoriza movimientos, borrados ni despliegues.
[Runtime](../architecture/04-runtime-and-deploy-truth.md) separa producción de ingeniería.
[Journey 03](../product/sistema-maestro/07-JOURNEY-03-ESTADO-PRE-S14.md) es el propietario de cierres y validaciones S1–S13/C1.
El workspace completo se basa en main ee65c324bf6780aeb6a25f6e97851cd3b2d7b0a3
y conserva un delta local validado, no desplegado y sin SHA de commit propio acreditado.

## Fuente y estructura material

| Área | Rutas y responsabilidad |
|---|---|
| Frontend | [src](../../frontend/src/), [public](../../frontend/public/): producto modular, assets y UI |
| Módulos | [features](../../frontend/src/features/): Home, auth, app-shell, dashboard, Builder, oportunidades, proyectos, billing, informes y settings |
| Backend | [app](../../backend/app/), [entrada](../../backend/app/main.py): FastAPI, routers, servicios, auth y persistencia |
| IA | [backend/app/ai](../../backend/app/ai/): contratos, generador conectado y componentes preparados; no certifica orquestación multiagente completa |
| Economía | [config/credits](../../backend/config/credits/): capa existente, no modificada por Journey 03 local |
| Manifiestos | [package.json](../../frontend/package.json), [package-lock.json](../../frontend/package-lock.json), [requirements](../../backend/requirements.txt) |
| Runtime | [Dockerfile](../../Dockerfile), [railway.json](../../railway.json): Node 22 para build; Python sirve frontend/build |
| Pruebas | [tests](../../tests/), [backend/tests](../../backend/tests/), pruebas junto al código frontend; material de validación que debe conservarse |
| Gobierno | [Índice maestro](00-INDICE-MAESTRO.md), [contratos](../product/sistema-maestro/05-CONTRATOS-TECNICOS-V1.md), [pendientes](02-PENDIENTES-PRIORIZADOS.md) |

## Builder materializado

[builder/state](../../frontend/src/features/builder/state/) existe; no es una creación pendiente.
Incluye kernel, estado, registry, output y contratos de transacción.
[builder/workspace](../../frontend/src/features/builder/workspace/) integra el circuito visible.

La ingeniería local validada contiene propuesta/validación/review, candidate y artefacto
comunes a preview/apply/entrega, revert exacto, mutaciones estructurales y compuestas,
validación funcional y reparación, intención CTA, coherencia semántica acotada,
decisión humana, workspace durable owner/project, concurrencia, recuperación pendiente
y autorización explícita. Código y pruebas concretos están enlazados en Journey 03.

La persistencia de este circuito es local al navegador; no equivale a persistencia
remota ni a autorización de servidor. Capacidad/retención siguen pendientes de S14;
no hay aquí TTL, cuotas o borrado aprobados. Los flujos legacy y generación IA
general no quedan certificados por el cierre del circuito local.

## Gold Freeze PRE-S14

- PATH: C:/Users/lucas/Desktop/S.Maestro/Backups/SISTEMA_MAESTRO_GOLD_FREEZE_PRE_S14_2026-10-01
- FILES=409 (407 archivos fuente y 2 archivos de control de restauración/manifiesto).
- RESTORE_PROOF=PASS, acreditado por el checkpoint previo.
- MANIFEST_SHA256=d5866256db1b61baac210fdf1f929d1d5c274e8db631b7c470118a205f5099e4
- GLOBAL_DIGEST=646ba5d993ea8eb8e221086d74d7524466bde54adc1f5172a110e574b69f22b2

El manifiesto contiene 408 entradas y excluye su propio archivo. El digest global
se verificó con el orden y la serialización del manifiesto; la orden recibida
transcribía solo 63 caracteres, omitiendo el 2 final. Se registra el SHA-256 completo,
sin alterar el freeze ni su manifiesto.

El freeze conserva la fuente PRE-S14 anterior a esta reconciliación documental.
No incluye las modificaciones documentales de esta tarea y no se regenera.
No identifica un nuevo commit ni una publicación remota.

## Material regenerable y límites

frontend/node_modules y frontend/build fueron retirados en el saneamiento acreditado.
Dependencias instaladas, build, cachés y temporales no son fuente del producto.
El manifiesto y lockfile se conservan. No se leen ni copian secretos.

El checkout Desktop histórico y Preservation permanecen como referencias externas;
no sustituyen el workspace reconciliado ni acreditan S1–S13/C1.
Las clasificaciones documentales históricas se consultan en el índice maestro.
Este inventario no decide reorganización ni eliminación.
