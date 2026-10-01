# 02-PENDIENTES-PRIORIZADOS

## Estado operativo vigente — 2026-10-01

Propietario del backlog actual. Este reemplazo del orden de trabajo anterior se apoya
en el checkpoint autorizado SM_PRE_S14_DOCUMENT_RECONCILIATION_EXECUTION.
El [estado de Journey 03](../product/sistema-maestro/07-JOURNEY-03-ESTADO-PRE-S14.md)
es propietario de sus cierres y evidencias. [Runtime and Deploy Truth](../architecture/04-runtime-and-deploy-truth.md)
separa producción del delta de ingeniería local.

## Único frente abierto de Journey 03

CURRENT_PENDING_FRONT=S14_LOCAL_STORAGE_CAPACITY_AND_RETENTION
S14=NOT_STARTED

Clasificación: crítica estructural.

Objetivo pendiente: delimitar capacidad y retención del almacenamiento local del Builder.
El cierre PRE-S14 no acredita una política de crecimiento/retención a largo plazo.

La siguiente decisión requiere concretar alcance y criterios de aceptación para S14.
No se fijan cuotas, TTL, tamaños máximos, compactación, migraciones, eliminación automática,
interfaz ni un mecanismo de implementación. Este documento no inicia S14.

## Cierres que se retiran del backlog activo

S1–S13 y C1 están COMPLETED como ingeniería local validada. No se reabren sin
evidencia de regresión material:

- creación de Builder state/kernel y conexión del circuito local validado;
- transacción propuesta/validación/preview/apply/revert e identidad de artefacto;
- workspace durable con owner/project, revisión condicional y aislamiento de sesión;
- review, cambios estructurales y propuesta compuesta;
- validación funcional, reparación y revalidación;
- destino CTA explícito, coherencia semántica y decisión humana;
- recuperación durable de trabajo pendiente y frontera explícita de autorización.

Los cierres son acotados a la capacidad descrita en Journey 03. No declaran cerrados
todos los recorridos legacy, la cadena IA general, QA10 ni el producto comercial completo.
S1–S13/C1 no están desplegados.

## Reconciliación de Preservation

Fuente histórica consultada:
[02-PENDIENTES-PRIORIZADOS de Preservation](../../../SM-PRESERVACION-e083f112-01/documentos/docs/control/02-PENDIENTES-PRIORIZADOS.md).
Sus actualizaciones de 2026-05-20, 2026-05-22 y 2026-05-24 ordenaban trabajo
anterior al checkpoint Journey 03. La versión original permanece intacta.

| Tema preservado | Disposición PRE-S14 |
|---|---|
| Cimientos Builder vivo; validación de mutación local | Cerrados dentro del alcance S1–S13/C1; no son pendientes activos |
| Command Contract V2.2 scoped de un proyecto concreto | Antecedente validado parcial; no sustituye la transacción local actual ni se activa globalmente |
| Plantilla 1, QA10, Oportunidades V2 y plantillas desbloqueables | Cierre integral no acreditado por S1–S13; fuera del frente actual, requieren revisión y autorización propias |
| Auditoría de agentes Copy/Visual/Trust, tools, guards, CRO, telemetry, memory y runtime multiagente | Registro histórico de trabajo diferido; estado actual específico no reconfirmado aquí. No activado como backlog de S14 |
| Reserva/confirmación de Gemas y otras ampliaciones económicas | Diferidas y fuera de alcance; no se inventa cierre ni se modifica economía |
| Project ID, mojibake, PRs y estados de producción mencionados en mayo | Contexto histórico del registro de decisiones; no orden de repetir pruebas ni prueba de despliegue de Journey 03 |

## Reglas de prioridad

Solo se priorizan acciones críticas estructurales o de optimización estratégica.
No convertir deseos históricos sin estado reconfirmado en trabajo activo.
No repetir gates cerrados por mera antigüedad de su documentación.
Una promoción del delta local, una reorganización de carpetas o un nuevo freeze
requieren sus propias órdenes; este backlog no autoriza ninguna de ellas.
