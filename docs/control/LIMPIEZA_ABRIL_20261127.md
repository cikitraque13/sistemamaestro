# Limpieza Abril 2026 — 2026-11-27

Registro de la pasada que solo borra código claramente muerto (vacío, 0 bytes, sin imports, o panel que nadie monta). Nada se mueve ni se adapta. Los candidatos esperan el mapa de la auditoría de ingeniería.

Base: `d2d56f3` (main después de #168 y #169). Criterio de fecha: `git log --diff-filter=A` sobre la ruta actual. J06 sigue OPEN / PARTIAL. J07 y J08 siguen NOT_DEMONSTRATED: no se activa runtime multiagente. P1 de Miriam Lau: la UI solo dice lo que el sistema hace. Se releyeron los mismos archivos sobre ese main: siguen sin callers.

## Borrados

| Path | Commit y fecha | Por qué está muerto | Acción |
|---|---|---|---|
| `backend/app/services/consumption_executor.py` | `0c21de3460` 2026-04-17 | 0 bytes. Ningún import. El consumo real está en `consumption_engine.execute_consumption_for_user` | DELETE |
| `frontend/src/features/app-shell/data/appShellMeta.js` | `15a32a5c9b` 2026-04-26 | Metadato de 256 bytes. Ningún import | DELETE |
| `frontend/src/features/dashboard/components/DashboardShell.js` | `15a32a5c9b` 2026-04-26 | Passthrough de 82 bytes. `DashboardPage` no lo monta | DELETE |
| `frontend/src/features/dashboard/utils/dashboardConfig.js` | `15a32a5c9b` 2026-04-26 | Constante de 83 bytes. Ningún import | DELETE |
| `frontend/src/features/projects/detail/components/SignalList.js` | `57ea9bf5ed` 2026-04-17 | Panel de detalle. `ProjectDetailPage` no lo monta | DELETE |
| `frontend/src/features/home/components/CookieBanner.js` | `2f3cde17a0` 2026-04-20 | Banner. `HomePage` no lo monta y nadie lo importa | DELETE |
| `frontend/src/features/home/data/audienceItems.js` | `2f3cde17a0` 2026-04-20 | Datos solo de una sección que no está montada. `AudienceSection` lleva su propia lista | DELETE |
| `frontend/src/features/home/data/businessExamples.js` | `2f3cde17a0` 2026-04-20 | Solo lo importaba `BusinessExamplesSection`, también borrada | DELETE |
| `frontend/src/features/home/data/capabilityItems.js` | `2f3cde17a0` 2026-04-20 | Solo lo importaba `CapabilitiesSection`, también borrada | DELETE |
| `frontend/src/features/home/data/faqItems.js` | `2f3cde17a0` 2026-04-20 | Solo lo importaba `FaqSection`, también borrada | DELETE |
| `frontend/src/features/home/data/problemItems.js` | `2f3cde17a0` 2026-04-20 | Solo lo importaba `ProblemSection`, también borrada | DELETE |
| `frontend/src/features/home/sections/BusinessExamplesSection.js` | `2f3cde17a0` 2026-04-20 | Sección de portada. `HomePage` no la monta | DELETE |
| `frontend/src/features/home/sections/CapabilitiesSection.js` | `2f3cde17a0` 2026-04-20 | Sección de portada. `HomePage` no la monta | DELETE |
| `frontend/src/features/home/sections/FaqSection.js` | `2f3cde17a0` 2026-04-20 | Sección de portada. `HomePage` no la monta | DELETE |
| `frontend/src/features/home/sections/OutcomesSection.js` | `2f3cde17a0` 2026-04-20 | Sección de portada. `HomePage` no la monta | DELETE |
| `frontend/src/features/home/sections/ProblemSection.js` | `2f3cde17a0` 2026-04-20 | Sección de portada. `HomePage` no la monta | DELETE |
| `frontend/src/features/home/sections/TrustSection.js` | `2f3cde17a0` 2026-04-20 | Sección de portada. `HomePage` no la monta. Las cadenas `TrustSection` del builder son código generado, no este archivo | DELETE |

No hizo falta cambiar imports: ninguno de estos archivos tenía callers.

Los ocho módulos de 0 bytes siguen ausentes (`01-system-layers.md` prohíbe archivos vacíos). Corrección del 2026-11-28, autorizada por Lucas: se restauran los contratos, no los archivos. `02-ai-orchestration.md` y `03-agent-contracts.md` vuelven enteros, con el orden de activación por olas. `agent_envelope.py` recupera la spec `cro_agent` (`spec_only`). `AGENT_REGISTRY`, `DEFAULT_POLICY` y las evals `audit_eval` / `rescue_eval` recuperan las entradas, con `phase=NOT_DEMONSTRATED`, sin import y sin ejecución. J06 sigue OPEN. J07 sigue NOT_OPENED. J07 y J08 siguen NOT_DEMONSTRATED.

## Diferidos (los borra el PR del pipeline del builder)

La auditoría (§8.2) los marca como DELETE. Lucas los asigna al otro agente. Este PR no los toca.

| Path | Commit y fecha | Decisión | Por qué |
|---|---|---|---|
| `frontend/src/features/builder/components/BuilderChatDock.js` | `15a32a5c9b` 2026-04-26 | DEFERRED | Sin imports. Ninguna jornada lo reclama. No se borra en esta corrección |
| `frontend/src/features/builder/workspace/state/builderWorkspaceState.js` | `15a32a5c9b` 2026-04-26 | DEFERRED | Sin imports. Ninguna jornada lo reclama. No se borra en esta corrección |
| `frontend/src/features/builder/intelligence/builderVisualIntelligence.js` | `15a32a5c9b` 2026-04-26 | KEEP | J10 (dirección visual). No es un borrado diferido |
| `frontend/src/features/builder/intelligence/index.js` | `15a32a5c9b` 2026-04-26 | KEEP | J10. Barril de la capa visual. No es un borrado diferido |
| `frontend/src/features/builder/playbooks/index.js` | `15a32a5c9b` 2026-04-26 | KEEP | J10. Barril de playbooks. No es un borrado diferido |

## Candidatos, sin ejecutar

Destino según `AUDITORIA_INGENIERIA_BUILDER_20261127` §8.1 y §8.2. Nada de esto se mueve ni se adapta aquí.

| Path | Decisión | Destino propuesto |
|---|---|---|
| `backend/app/ai/orchestrators/master_orchestrator.py` y el contrato de `builder_agent` en `agent_envelope.py` | CANDIDATE MOVE, pending the target architecture | Manifiesto de solo lectura en `docs/architecture/`. El runtime no los consulta. `ai/orchestrators/` sigue siendo contrato documental hasta que Lucas abra J07 |
| `backend/app/services/ai_analysis_common.py` (`LEAD_AGENT_PROFILES`, claves `discovery_agent` / `audit_agent`) | CANDIDATE MOVE, pending the target architecture | Claves de modo de análisis `problem_discovery` y `visible_audit` en el mismo módulo. El análisis lo hace Grok |
| `frontend/src/features/builder/utils/builderCodeTemplates.js` y el workbench de `BuilderCanvasPane` | CANDIDATE MOVE, pending the target architecture | Fuera de la UI de producto. `BuilderCanvasPane` es UI excluida: el recorte lo hace el PR del pipeline |
| `frontend/src/features/builder/workspace/hooks/useLandingTransaction.js` | CANDIDATE MOVE, pending the target architecture | La auditoría dice no moverlo: eliminarlo cuando `useDurableLandingTransaction` cubra los tests |
| Paneles `IntentClarification.js` y `ProjectPlan.js`, más los servicios J06 | CANDIDATE REPURPOSE, pending the target architecture | Entrada de `services/builder_pipeline.py`: aclarar y planificar antes de generar, con texto de producto |
| `backend/app/services/blueprint.py` y `handleGenerateBlueprint` | CANDIDATE REPURPOSE, pending the target architecture | Paso opcional de diagnóstico dentro del pipeline, o un control «Generar diagnóstico» |
| `frontend/src/features/builder/intelligence/*`, `playbooks/*`, `presets/*` que el runtime sí usa | CANDIDATE REPURPOSE, pending the target architecture | Reglas del kernel y de la preview. Recortar lo duplicado con Claude en el PR del pipeline, no ahora |
| `AgentRail` / `AGENT_ACTIONS` en `BuilderAgentPane.js` | CANDIDATE REPURPOSE, pending the target architecture | Acciones de producto («Mejorar el texto», «Revisar el borrador») sin `agentSpecId`. Archivo excluido |
| Historial de #169 | CANDIDATE REPURPOSE, pending the target architecture | Historial de instrucciones y versiones de la landing en el registro de Mongo |
| `backend/app/ai/guards/cost_guard.py` | CANDIDATE REPURPOSE, pending the target architecture | Medir tokens con `model_pricing`, sin cambiar importes, en un PR de endurecimiento |
| `backend/app/services/url_analysis.py` y `analysis_requests` | CANDIDATE REPURPOSE, pending the target architecture | Superficie de demo por URL (Miriam P4) dentro del Builder |
| `action_catalog.json` claves `project_export` y `project_deploy` | CANDIDATE REPURPOSE, pending the target architecture | Cablearlas solo cuando existan export y publicación. No mostrarlas antes. No se tocan importes |
| `backend/app/ai/guards/abuse_guard.py`, `backend/app/ai/tools/tool_registry.py` | CANDIDATE REPURPOSE, pending the target architecture | Sin caller de runtime (P2-3). No hay módulo de producto en §8.1. No se encienden: J07 no está abierta |

## Se quedan donde están

| Path | Commit y fecha | Decisión | Destino propuesto |
|---|---|---|---|
| `backend/app/ai/agents/red_team_agent.py` | `c1d9247628` 2026-04-18 | CANDIDATE REPURPOSE, pending the target architecture | Sigue en `backend/app/ai/agents/` hasta el mapa. Manifest sin caller de runtime. J08 NOT_DEMONSTRATED: no activar |
| `backend/app/ai/agents/report_agent.py` | `c1d9247628` 2026-04-18 | CANDIDATE REPURPOSE, pending the target architecture | Igual. Solo lo llama `run_builder_phase_2_review`, y ese método no tiene caller de runtime |
| `backend/app/ai/agents/system_architect_agent.py` | `c1d9247628` 2026-04-18 | CANDIDATE REPURPOSE, pending the target architecture | Igual. Función pura de puente, no el pipeline de landing |
| `backend/app/ai/agents/security_architect_agent.py` | `c1d9247628` 2026-04-18 | CANDIDATE REPURPOSE, pending the target architecture | Igual |
| `backend/app/ai/orchestrators/master_orchestrator.py` | `c1d9247628` 2026-04-18 | CANDIDATE REPURPOSE, pending the target architecture | Sigue en `orchestrators/`. Decisión 63: runtime multiagente bloqueado. J07 NOT_DEMONSTRATED |
| `backend/app/ai/evals/agent_eval_registry.py` | `c1d9247628` 2026-04-18 | CANDIDATE REPURPOSE, pending the target architecture | Sigue en `evals/`. Registro sin scoring vivo |
| `backend/app/ai/guards/abuse_guard.py` | `c1d9247628` 2026-04-18 | CANDIDATE REPURPOSE, pending the target architecture | Sigue en `guards/`. No está cableado; enchufarlo exige `builder_ai.py`, que está excluido |
| `backend/app/ai/tools/tool_registry.py` | `c1d9247628` 2026-04-18 | CANDIDATE REPURPOSE, pending the target architecture | Sigue en `tools/`. Manifiesto, no herramientas ejecutables |
| `frontend/src/features/builder/intelligence/builderVisualIntelligence.js` | `15a32a5c9b` 2026-04-26 | KEEP | J10. Dirección visual (CTA, cards, color, tipografía, spacing, trust). No borrar |
| `frontend/src/features/builder/workspace/state/builderWorkspaceState.js` | `15a32a5c9b` 2026-04-26 | CANDIDATE MOVE, pending the target architecture | Estado de workspace del runtime vivo del builder, si el mapa lo conserva. Hoy nadie lo importa |
| `frontend/src/features/builder/components/BuilderChatDock.js` | `15a32a5c9b` 2026-04-26 | DEFERRED | UI de builder excluida. Nadie lo monta. No se edita en esta pasada |

## Se quedan donde están

Vivos y en su sitio (KEEP), creados en abril salvo nota: `builder_agent.py`, `schemas/builder_ai_output.py`, `schemas/agent_envelope.py` (lo usa el análisis y el contrato del builder), guards `cost`, `output`, `policy` y `security` (los usa el router de Builder AI), `telemetry/agent_trace.py`, `memory/project_memory.py`. Los `__init__.py` de 0 bytes de `backend/app` son marcadores de paquete y se conservan. `intent_clarification` (agente y schema) es de octubre de 2026, no de esta pasada. Los providers Grok/Claude son del 2026-11-27.

Los componentes de portada restaurados el 2026-11-23 por `f917e76a` (revert del PR #115) no se tratan como sobras intactas de abril y no se borran aquí: `HomeEntryPanel`, `HomeFlowPreview`, `HomeIntentTabs`, `HomeOutputsPreview`, `HomeTypeTabs`, `HomeCapabilityChips`, datos `homeEntry*` y `FinalCtaSection`.
