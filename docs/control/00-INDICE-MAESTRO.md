# 00-INDICE-MAESTRO

## Estado del documento

- Estado: activo; reconciliación documental S17/S18 al 2026-10-11.
- Función: repartir autoridad documental; no sustituye contratos, evidencia ni backlog.
- S14–S18: consultar los propietarios de madurez, producción/runtime e inventario técnico; este índice no duplica hashes de manifiestos.
- Regla de autoridad: consultar los propietarios canónicos para identidad de producción,
  release Journey 03, S14 y registros históricos.

## Mapa canónico y propietarios

| Tema | Propietario | Papel |
|---|---|---|
| Producción y publicación S16 | [Runtime and Deploy Truth](../architecture/04-runtime-and-deploy-truth.md) | SOURCE_OF_TRUTH para identidad productiva y verificación S16; distingue candidato prepublicación de release vigente |
| Journey 03, cierres S1–S15 y validaciones | [Estado PRE-S14](../product/sistema-maestro/07-JOURNEY-03-ESTADO-PRE-S14.md) | SOURCE_OF_TRUTH del cierre, releases y evidencia de Journey 03 |
| Decisiones aprobadas | [Decisiones cerradas](01-DECISIONES-CERRADAS.md) | SOURCE_OF_TRUTH; conserva procedencia y alcance temporal |
| Pendientes vigentes | [Pendientes priorizados](02-PENDIENTES-PRIORIZADOS.md) | SOURCE_OF_TRUTH del siguiente frente previsto; no lo autoriza |
| Existencia de piezas y Gold Freeze | [Inventario técnico](03-INVENTARIO-TECNICO.md) | Inventario y evidencia de restauración; registra los Gold prepublicación y post-S16 |
| Rutas de producto y sistema | [Rutas canónicas](04-RUTAS-CANONICAS.md) | SUPPORTING_CANONICAL; inventario vigente completa las incorporaciones PRE-S14 |
| Procedimientos operativos | [Procedimientos](06-PROCEDIMIENTOS-OPERATIVOS.md) | SUPPORTING_CANONICAL; no autoriza acciones por sí mismo |
| Git, backups y entrega | [Git, deploy e higiene](07-GIT-DEPLOY-HIGIENE.md) | Higiene Git/deploy; enlaza las reglas transversales |
| Roadmap y estado de madurez | [Master Maturity Roadmap](../product/sistema-maestro/08-MASTER-MATURITY-ROADMAP.md) | SOURCE_OF_TRUTH de S14–S18 y J04–J16 |
| Reglas de gates | [Journey Gate Operating Rules](09-JOURNEY-GATE-OPERATING-RULES.md) | SOURCE_OF_TRUTH de proceso, evidencia y checkpoints; no duplica estados de gates |
| QA comercial de plantillas | [QA Builder 10 plantillas](08-QA-BUILDER-10-PLANTILLAS.md) | QA específica; no duplica el cierre de Journey 03 |
| Contrato actual de la transacción local | [Contratos Técnicos V1](../product/sistema-maestro/05-CONTRATOS-TECNICOS-V1.md) | Extensión PRE-S14 validada y límites de aplicación |
| Visión de producto | [Producto Maestro V2](../product/sistema-maestro/01-PRODUCTO-MAESTRO-V2.md) | Doctrina de producto |
| Activación | [Activación Doctrina](../product/sistema-maestro/02-ACTIVACION-DOCTRINA.md) | SUPPORTING_CANONICAL |
| Experiencia del Builder | [Constructor Visible](../product/sistema-maestro/04-EXPERIENCIA-CONSTRUCTOR-VISIBLE.md) | Dirección de experiencia; no prueba de implementación |
| Arquitectura | [System Layers](../architecture/01-system-layers.md) | SUPPORTING_CANONICAL; estado local en Journey 03 |
| IA | [Orchestration](../architecture/02-ai-orchestration.md), [Agent Contracts](../architecture/03-agent-contracts.md) | Contratos/dirección; no declara runtime multiagente nuevo |
| Economía | [Créditos y Economía](../product/sistema-maestro/03-CREDITOS-Y-ECONOMIA.md) | Doctrina comercial |
| Créditos técnicos | [Política](../system/credits/00-POLITICA-CANONICA-CREDITOS-V1.md), [Matriz](../system/credits/01-MATRIZ-OPERATIVA-CREDITOS-V1.md), [Motor](../system/credits/02-MOTOR-CONSUMO-V1.md), [Contrato](../system/credits/03-CONTRATO-TECNICO-V1.md) | SUPPORTING_CANONICAL, sin cambios en esta reconciliación |
| Operación del despliegue | [DEPLOY_RAILWAY](../../DEPLOY_RAILWAY.md) | Guía de verificación previa; distinguir la observación live de la configuración declarada y verificar procedencia antes de futuros despliegues; consultar [Runtime and Deploy Truth](../architecture/04-runtime-and-deploy-truth.md) |
| Informe puntual | [Contrato](../product/01-INFORME-PUNTUAL-CANONICO.md), [Salida PDF](../product/02-PDF-INFORME-PUNTUAL-SALIDA-VISUAL.md) | Contratos de producto existentes |
| Diseño | [README de diseño](../design/README.md), [Guías](../design/design_guidelines.json) | SUPPORTING_CANONICAL; no impone una dirección visual genérica a todo proyecto |
| Seguridad | [Decisiones cerradas](01-DECISIONES-CERRADAS.md), [código](../../backend/app/core/security.py), [pruebas](../../backend/tests/test_security_jwt.py) | Reglas y evidencia de implementación; no certificación nueva de seguridad |

## Clasificación de documentos protegidos

Estos archivos se conservan byte a byte. Su clasificación se registra únicamente aquí:

| Documento | Clasificación y uso |
|---|---|
| [05-INCIDENCIAS-Y-DIAGNOSTICOS](05-INCIDENCIAS-Y-DIAGNOSTICOS.md) | HISTORICAL_REFERENCE: registro de incidencias; no sustituye el backlog vigente |
| [docs/qa/test_result](../qa/test_result.md) | HISTORICAL_REFERENCE / ARCHIVE_CANDIDATE: protocolo y registro legado; no prueba PRE-S14 ni instrucción operativa actual |
| [08-ESTRUCTURA-ACTUALIZADA](../system/08-ESTRUCTURA-ACTUALIZADA.md) | HISTORICAL_REFERENCE: cierre previo del adaptador IA; no inventario completo actual |
| [06-ROADMAP-DE-IMPLEMENTACION-V1](../product/sistema-maestro/06-ROADMAP-DE-IMPLEMENTACION-V1.md) | SUPERSEDED como secuencia de ejecución PRE-S14: no reabrir sus fases de creación de Builder state/kernel ya materializadas |

ARCHIVE_CANDIDATE es clasificación, no autorización para mover o eliminar.

## Fuentes de Preservation y reconciliación

Las fuentes de Preservation se consultaron durante la reconciliación documental. Sus aportaciones válidas quedaron integradas en este registro de decisiones y en el backlog vigente; los archivos de Preservation se retiraron durante la higiene final del workspace. Las series numéricas repetidas de mayo se distinguen por fecha/sección y no otorgan autoridad sobre el estado S1–S13/C1.

PRESERVATION_RECONCILIATION=COMPLETED: las aportaciones válidas se integraron en decisiones y pendientes, conservando sus límites temporales.
REQUIRES_UPDATE: cualquier futura variación de producción, del checkpoint local o
de S15 deberá actualizar su propietario canónico; no se presume realizada.

## Orden de lectura y ejecución vigente

1. Runtime and Deploy Truth: distinguir GitHub main, Railway observado, configuración declarada y procedencia de build.
2. Master Maturity Roadmap: consultar los estados vigentes S14–S18 y la evidencia/limitaciones de cada gate.
3. Journey 03 PRE-S14: consultar únicamente el historial de cierres S1–S15.
4. Decisiones, pendientes y contratos: respetar lo cerrado y el siguiente gate autorizado.
5. Inventario, rutas y procedimientos: localizar las piezas necesarias.

S14, S15 y S16 están COMPLETED; S17 está CLOSED_BY_HUMAN_ACCEPTANCE, limitado al recorrido visual revisado y sin TECHNICAL_PASS del harness E2E. S18 está OPEN, S18_TECHNICAL_STATUS=NOT_DEMONSTRATED y S18_EXECUTION=ON_HOLD; su primera actividad obligatoria es el inventario/revisión READ-ONLY de escrituras activas. Las cuatro garantías E2E pendientes y los dos Gold pre-S18, con sus reservas, constan en [Roadmap](../product/sistema-maestro/08-MASTER-MATURITY-ROADMAP.md) e [Inventario técnico](03-INVENTARIO-TECNICO.md). GitHub main es `ead9f4e796f9e2be89a8d0b7948364edbf67066b`; la observación de Railway y la discrepancia de builder/procedencia constan en [Runtime and Deploy Truth](../architecture/04-runtime-and-deploy-truth.md). El detalle histórico de S16 se conserva en el registro correspondiente del inventario y runtime.

## Reglas duraderas de gobierno

- Extender con criterio, evitar solapes y separar doctrina de implementación comprobada.
- Mantener propuesta, validación, preview, autorización, apply y revert trazables.
- No afirmar ejecución de exportación/deploy a partir de una validación de readiness.
- No monetizar una simulación ni confundir estado local con producción.
- Los documentos no amplían por sí mismos el alcance autorizado.
- Preservar registros históricos con contexto; no tratar sus prioridades como actuales.
- Los backups permanecen fuera del proyecto activo y no se modifican por esta tarea.
