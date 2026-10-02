# 00-INDICE-MAESTRO

## Estado del documento

- Estado: activo, reconciliado tras el release PRE-S14 el 2026-10-02.
- Función: repartir autoridad documental; no sustituye contratos, evidencia ni backlog.
- Release PRE-S14 desplegado: GitHub main `0574e0c01f2a4abdf2dcf3ddc6fd03d17d3774d7`; Railway SUCCESS y alineado.
- Regla de autoridad: consultar los propietarios canónicos para identidad de producción,
  release Journey 03, S14 y registros históricos.

## Mapa canónico y propietarios

| Tema | Propietario | Papel |
|---|---|---|
| Producción y runtime del release PRE-S14 | [Runtime and Deploy Truth](../architecture/04-runtime-and-deploy-truth.md) | SOURCE_OF_TRUTH para SHA/tree/deployment y riesgos de observabilidad |
| Journey 03, S1–S13/C1, validación y S14 | [Estado PRE-S14](../product/sistema-maestro/07-JOURNEY-03-ESTADO-PRE-S14.md) | SOURCE_OF_TRUTH del cierre, release, evidencia y frente S14 |
| Decisiones aprobadas | [Decisiones cerradas](01-DECISIONES-CERRADAS.md) | SOURCE_OF_TRUTH; conserva procedencia y alcance temporal |
| Pendientes vigentes | [Pendientes priorizados](02-PENDIENTES-PRIORIZADOS.md) | SOURCE_OF_TRUTH del único frente abierto de Journey 03 |
| Existencia de piezas y Gold Freeze | [Inventario técnico](03-INVENTARIO-TECNICO.md) | Inventario y evidencia de restauración |
| Rutas de producto y sistema | [Rutas canónicas](04-RUTAS-CANONICAS.md) | SUPPORTING_CANONICAL; inventario vigente completa las incorporaciones PRE-S14 |
| Procedimientos operativos | [Procedimientos](06-PROCEDIMIENTOS-OPERATIVOS.md) | SUPPORTING_CANONICAL; no autoriza acciones por sí mismo |
| Git, backups y entrega | [Git, deploy e higiene](07-GIT-DEPLOY-HIGIENE.md) | Reglas duraderas de operación |
| QA comercial de plantillas | [QA Builder 10 plantillas](08-QA-BUILDER-10-PLANTILLAS.md) | QA específica; no duplica el cierre de Journey 03 |
| Contrato actual de la transacción local | [Contratos Técnicos V1](../product/sistema-maestro/05-CONTRATOS-TECNICOS-V1.md) | Extensión PRE-S14 validada y límites de aplicación |
| Visión de producto | [Producto Maestro V2](../product/sistema-maestro/01-PRODUCTO-MAESTRO-V2.md) | Doctrina de producto |
| Activación | [Activación Doctrina](../product/sistema-maestro/02-ACTIVACION-DOCTRINA.md) | SUPPORTING_CANONICAL |
| Experiencia del Builder | [Constructor Visible](../product/sistema-maestro/04-EXPERIENCIA-CONSTRUCTOR-VISIBLE.md) | Dirección de experiencia; no prueba de implementación |
| Arquitectura | [System Layers](../architecture/01-system-layers.md) | SUPPORTING_CANONICAL; estado local en Journey 03 |
| IA | [Orchestration](../architecture/02-ai-orchestration.md), [Agent Contracts](../architecture/03-agent-contracts.md) | Contratos/dirección; no declara runtime multiagente nuevo |
| Economía | [Créditos y Economía](../product/sistema-maestro/03-CREDITOS-Y-ECONOMIA.md) | Doctrina comercial |
| Créditos técnicos | [Política](../system/credits/00-POLITICA-CANONICA-CREDITOS-V1.md), [Matriz](../system/credits/01-MATRIZ-OPERATIVA-CREDITOS-V1.md), [Motor](../system/credits/02-MOTOR-CONSUMO-V1.md), [Contrato](../system/credits/03-CONTRATO-TECNICO-V1.md) | SUPPORTING_CANONICAL, sin cambios en esta reconciliación |
| Operación del despliegue | [DEPLOY_RAILWAY](../../DEPLOY_RAILWAY.md) | Procedimiento auxiliar: el ejemplo startCommand no es vigente; prevalecen Runtime and Deploy Truth y la configuración real |
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
de S14 deberá actualizar su propietario canónico; no se presume realizada.

## Orden de lectura y ejecución vigente

1. Runtime and Deploy Truth: identificar `main`, deployment de Railway y riesgos residuales.
2. Estado Journey 03 PRE-S14: consultar el cierre desplegado, su evidencia y S14.
3. Decisiones, pendientes y contratos: respetar lo cerrado y el frente abierto.
4. Inventario, rutas y procedimientos: localizar las piezas necesarias.

Los fundamentos Builder state/kernel y el circuito local S1–S13/C1 están implementados
y validados en ingeniería local; su creación no es una prioridad pendiente.
S14_LOCAL_STORAGE_CAPACITY_AND_RETENTION es el único frente abierto de Journey 03,
NOT_STARTED y sin diseño de implementación aprobado aquí. Su apertura formal espera la creación y verificación del Gold independiente de entrada a S14 descrito en Journey 03.

## Reglas duraderas de gobierno

- Extender con criterio, evitar solapes y separar doctrina de implementación comprobada.
- Mantener propuesta, validación, preview, autorización, apply y revert trazables.
- No afirmar ejecución de exportación/deploy a partir de una validación de readiness.
- No monetizar una simulación ni confundir estado local con producción.
- Los documentos no amplían por sí mismos el alcance autorizado.
- Preservar registros históricos con contexto; no tratar sus prioridades como actuales.
- Los backups permanecen fuera del proyecto activo y no se modifican por esta tarea.
