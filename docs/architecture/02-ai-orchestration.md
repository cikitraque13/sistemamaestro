# 02 — AI Orchestration

## Estado del documento

- Estado: activo
- Tipo: arquitectura canónica de IA
- Alcance: orquestación, agentes, guards, herramientas, trazabilidad y límites
- Objetivo: definir cómo debe pensar y actuar la capa de IA de Sistema Maestro.

---

## 1. Propósito

Este documento define la jerarquía de inteligencias de Sistema Maestro.

La IA no debe actuar como un generador genérico de texto.

Debe operar como sistema:

```text
entrada
→ interpretación
→ decisión
→ agente especializado
→ guardrails
→ salida estructurada
→ trazabilidad
```

---

## 2. Inteligencia madre

### `master_orchestrator`

Función:

- gobernar la entrada;
- decidir qué agente interviene;
- preparar contexto;
- aplicar guards;
- seleccionar formato de salida;
- evitar respuestas genéricas;
- coordinar continuidad.

No debe:

- hacer todo;
- invadir especialistas;
- inventar pricing;
- ignorar créditos;
- saltarse seguridad.

---

## 3. Agentes especialistas núcleo

### `discovery_agent`

Función:

- entender idea, URL, oportunidad o problema;
- detectar intención;
- clasificar madurez;
- preparar diagnóstico inicial.

### `audit_agent`

Función:

- auditar fricciones;
- revisar claridad, conversión, estructura y monetización;
- identificar debilidades y quick wins.

### `report_agent`

Función:

- estructurar informes;
- transformar diagnóstico en salida entendible;
- preparar continuidad y recomendación.

### `system_architect_agent`

Función:

- transformar intención en arquitectura de sistema;
- ordenar módulos, rutas, entidades y contratos.

### `builder_agent`

Función:

- construir o modificar salida Builder;
- generar mutaciones;
- actualizar modelos de preview, código y estructura.

### `rescue_sre_agent`

Función:

- diagnosticar errores de runtime;
- interpretar logs;
- proponer corrección mínima segura.

---

## 4. Agentes de crecimiento y control

### `security_architect_agent`

Función:

- detectar brechas;
- endurecer auth, cookies, permisos, pagos y entorno.

### `red_team_agent`

Función:

- detectar vectores de abuso desde una perspectiva defensiva;
- revisar superficies sensibles;
- proponer mitigaciones.

No debe ejecutar ataques reales.

### `growth_agent`

Función:

- detectar palancas de crecimiento;
- proponer activaciones y oportunidades comerciales.

### `cro_agent`

Función:

- mejorar conversión;
- revisar CTA, oferta, objeciones y estructura persuasiva.

### `seo_architect_agent`

Función:

- analizar oportunidad orgánica;
- estructurar SEO, clusters, intención y arquitectura de contenido.

### `deploy_agent`

Función:

- razonar sobre despliegue;
- validar rutas, entornos, healthchecks y runtime.

### `algorithmic_auditor_agent`

Función:

- revisar consistencia de scoring, reglas, decisiones y trazas.

---

## 5. Guards transversales

### `policy_guard`

Evita salidas fuera de política.

### `security_guard`

Protege secretos, auth, tokens, pagos y datos sensibles.

### `abuse_guard`

Reduce abuso, spam, automatización maliciosa y consumo no autorizado.

### `output_guard`

Valida formato, coherencia y completitud de salida.

### `cost_guard`

Evita consumo excesivo, uso sin crédito o acciones caras sin control.

---

## 6. Principios de orquestación

1. Una sola inteligencia enruta.
2. Cada agente tiene una misión principal.
3. Ningún agente invade otra capa sin permiso explícito.
4. Toda salida sensible debe ser estructurada.
5. Todo agente debe poder ser auditado.
6. Toda acción cara debe respetar créditos.
7. Toda salida de Builder debe poder convertirse en estado o mutación.
8. La IA debe producir continuidad, no solo texto.

---

## 7. Orden de activación recomendado

### Ola 1 — Núcleo operativo

- `master_orchestrator`
- `discovery_agent`
- `audit_agent`
- `report_agent`
- `rescue_sre_agent`

### Ola 2 — Construcción y seguridad

- `system_architect_agent`
- `builder_agent`
- `deploy_agent`
- `security_architect_agent`
- `red_team_agent`

### Ola 3 — Crecimiento y auditoría

- `growth_agent`
- `cro_agent`
- `seo_architect_agent`
- `algorithmic_auditor_agent`

---

## 8. Relación con créditos

La IA no decide si se puede consumir.

La IA puede proponer una acción.

El backend debe validar:

```text
usuario
plan
saldo
acción
coste
```

antes de ejecutar acciones intensivas.

---

## 9. Relación con Builder

El `builder_agent` debe producir salidas compatibles con:

- mutaciones;
- preview;
- code model;
- structure model;
- assistant message;
- next action.

No debe devolver solo texto narrativo si la acción espera construcción.

---

## 10. Contrato de salida mínimo

Toda respuesta IA crítica debe poder auditarse con:

```text
intent
context
decision
payload
warnings
next_action
trace
```

Cuando se trate de Builder, debe incluir estructura compatible con el contrato del Builder.

---

## 11. Veredicto operativo

La IA de Sistema Maestro debe actuar como orquestador operativo de transformación.

Si una respuesta no cambia comprensión, decisión, estructura o estado, probablemente no merece consumir coste.
