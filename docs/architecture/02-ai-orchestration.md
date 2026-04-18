# 02 - AI Orchestration

## Proposito
Definir la jerarquia de inteligencias de Sistema Maestro.

## Inteligencia madre
### `master_orchestrator`
Es la capa de gobierno.
No actua como especialista.
Decide:
- que agente entra
- que contexto recibe
- que guards aplican
- que formato de salida se espera

## Especialistas nucleo
- `discovery_agent`
- `audit_agent`
- `report_agent`
- `system_architect_agent`
- `builder_agent`
- `rescue_sre_agent`

## Especialistas de crecimiento y control
- `security_architect_agent`
- `red_team_agent`
- `growth_agent`
- `cro_agent`
- `seo_architect_agent`
- `deploy_agent`
- `algorithmic_auditor_agent`

## Guards transversales
- `policy_guard`
- `security_guard`
- `abuse_guard`
- `output_guard`
- `cost_guard`

## Principios de orquestacion
1. Una sola inteligencia enruta
2. Cada agente tiene una mision principal
3. Ningun agente invade otra capa sin permiso explicito
4. Toda salida sensible debe ser estructurada
5. Todo agente debe poder ser auditado

## Orden inicial de activacion
### Ola 1
- `master_orchestrator`
- `discovery_agent`
- `audit_agent`
- `report_agent`
- `rescue_sre_agent`

### Ola 2
- `system_architect_agent`
- `builder_agent`
- `deploy_agent`
- `security_architect_agent`
- `red_team_agent`

### Ola 3
- `growth_agent`
- `cro_agent`
- `seo_architect_agent`
- `algorithmic_auditor_agent`