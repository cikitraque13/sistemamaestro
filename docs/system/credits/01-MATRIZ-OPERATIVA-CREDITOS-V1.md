# 01-MATRIZ-OPERATIVA-CREDITOS-V1

## Estado del documento

- Estado: activo
- Tipo: matriz operativa canónica
- Alcance: acciones, planes, consumo estándar, consumo especial y bloqueo
- Fuente de verdad relacionada:
  - `backend/config/credits/action_catalog.json`
  - `backend/config/credits/tier_amounts.json`
  - `backend/config/credits/plan_levels.json`

---

## 1. Función de la matriz

Esta matriz traduce la política de créditos a acciones operativas.

Cada acción debe tener:

- `action_key`;
- capa funcional;
- plan requerido;
- tipo de consumo;
- tier base;
- escalado;
- criterio de bloqueo.

---

## 2. Campos canónicos de acción

Cada acción del catálogo debe poder resolverse a estas claves:

```text
action_key
visible_name
family
layer
base_tier
required_plan
consumption_type
can_scale_with_complexity
can_scale_with_depth
can_scale_with_repetition
```

Se permite compatibilidad legacy:

```text
plan_requirement → required_plan
consumption_type_allowed → consumption_type
```

---

## 3. Acciones principales

| Acción | Capa | Plan requerido | Tipo de consumo | Uso |
|---|---|---:|---|---|
| `idea_analysis` | analysis | free | standard | Analizar idea inicial |
| `url_analysis` | analysis | free | standard | Analizar URL existente |
| `refine_round` | analysis | free | standard | Afinar respuestas |
| `premium_preview_view` | conversion | free | none | Vista previa premium sin consumo |
| `single_report_purchase` | single_report | free | none | Compra puntual |
| `builder_first_run` | builder | free | standard | Primera construcción guiada |
| `builder_light_iteration` | builder | blueprint | standard | Iteración ligera |
| `builder_structural_iteration` | builder | blueprint | standard | Iteración estructural |
| `builder_partial_rebuild` | builder | sistema | standard | Reconstrucción parcial |
| `builder_full_regeneration` | builder | sistema | standard | Regeneración completa |
| `blueprint_generation` | structure | sistema | standard | Generar blueprint |
| `technical_output_generation` | output | sistema | standard | Generar salida técnica |
| `project_export` | final_output | sistema | special | Exportar proyecto |
| `project_deploy` | final_output | premium | special | Desplegar proyecto |

---

## 4. Planes canónicos

| Plan | Nivel | Función |
|---|---:|---|
| `free` | 0 | Entrada, análisis inicial y primera prueba |
| `blueprint` | 1 | Base de trabajo estructurada |
| `sistema` | 2 | Continuidad operativa |
| `premium` | 3 | Builder avanzado, export/deploy y máxima continuidad |

Compatibilidad legacy pendiente:

```text
gratis → free
administrador → admin
usuario → user
```

Esta normalización puede vivir en código o migración controlada.

---

## 5. Consumo estándar

Se usa para:

- análisis;
- generación;
- Builder;
- iteraciones;
- blueprint;
- salidas técnicas.

No se usa para:

- export final;
- deploy final;
- acciones especiales protegidas.

---

## 6. Consumo especial

Se usa para:

- `project_export`;
- `project_deploy`;
- futuras salidas profesionales de alto valor.

El crédito especial no debe mezclarse con crédito estándar.

---

## 7. Escalado

El consumo puede escalar según:

- complejidad del proyecto;
- profundidad requerida;
- valor de salida;
- coste operativo;
- repetición en sesión;
- repetición sobre el mismo proyecto.

La decisión de escalado pertenece al backend.

---

## 8. Bloqueos

Una acción debe bloquearse si:

- `action_key` no existe;
- el plan del usuario no alcanza el requerido;
- el saldo estándar no alcanza;
- el saldo especial no alcanza;
- la request no está autenticada;
- el proyecto no pertenece al usuario;
- la acción intenta simular consumo sin salida real.

---

## 9. Regla Builder

El Builder puede abrirse visualmente, pero no puede ejecutar IA ni mutaciones caras sin pasar por consumo.

Primera construcción:

```text
builder_first_run
```

Iteración ligera:

```text
builder_light_iteration
```

Iteración estructural:

```text
builder_structural_iteration
```

Reconstrucción parcial:

```text
builder_partial_rebuild
```

Regeneración completa:

```text
builder_full_regeneration
```

---

## 10. Regla proyectos

Crear proyecto con IA debe consumir:

```text
idea_analysis
```

o:

```text
url_analysis
```

Generar blueprint debe consumir:

```text
blueprint_generation
```

---

## 11. Regla de no consumo

No consumen:

- vista de dashboard;
- lectura de proyectos;
- lectura de oportunidades;
- filtros;
- navegación;
- previews estáticas;
- compra ya gestionada por Stripe;
- webhooks de Stripe.

---

## 12. Veredicto operativo

La matriz operativa queda fijada como puente entre:

```text
catálogo JSON
→ motor de consumo
→ routers backend
→ UX de bloqueo/desbloqueo
```

Toda nueva acción debe añadirse primero a esta matriz antes de conectarse a IA real.
