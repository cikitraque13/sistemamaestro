# 03-CONTRATO-TECNICO-V1

## Estado del documento

- Estado: activo
- Tipo: contrato técnico canónico
- Alcance: schemas, routers, servicios, catálogo y reglas de integración de créditos
- Fuente de verdad relacionada:
  - `backend/app/schemas/consumption.py`
  - `backend/app/core/credits_config_loader.py`
  - `backend/app/services/consumption_engine.py`
  - `backend/app/services/credits.py`
  - `backend/config/credits/*`

---

## 1. Objetivo del contrato

Este contrato define cómo se conectan las acciones del sistema con el motor de créditos.

Toda integración futura debe respetarlo.

---

## 2. Contrato mínimo de acción

Cada acción debe tener:

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

Compatibilidad aceptada:

```text
plan_requirement
consumption_type_allowed
```

pero solo si se normalizan antes de evaluar.

---

## 3. Contrato de request de consumo

Toda request debe contener:

```text
mode
action_key
user_context
project_context
usage_context
meta
```

### 3.1 mode

Valores permitidos:

```text
simulate
execute
```

### 3.2 action_key

Debe existir en catálogo.

### 3.3 user_context

Puede venir del cliente en simulación.

En ejecución debe ser sobrescrito por backend con datos reales.

Campos:

```text
user_id
user_plan
credit_balance
special_credit_balance
```

### 3.4 project_context

Campos mínimos:

```text
project_id
project_complexity_score
journey_depth_score
output_value_score
operational_cost_score
```

### 3.5 usage_context

Campos:

```text
action_count_in_session
action_count_on_project
```

### 3.6 meta

Campos recomendados:

```text
surface
entry_point
trace_id
```

---

## 4. Contrato de respuesta

Toda respuesta debe contener:

```text
status
decision
gates
ux
trace
```

### 4.1 status

Estados esperados:

```text
allowed
blocked_invalid_action
blocked_plan
blocked_balance
blocked_special_credit
```

### 4.2 decision

Debe incluir:

```text
consumption_type
consumption_amount
```

### 4.3 gates

Debe indicar qué puerta bloqueó:

```text
plan_gate_triggered
balance_gate_triggered
special_credit_gate_triggered
```

### 4.4 ux

Debe incluir:

```text
message
next_step_hint
```

### 4.5 trace

Debe permitir auditoría de consumo.

---

## 5. Contrato de routers

### 5.1 `/consumption/simulate`

Puede usar:

```text
evaluate_consumption(payload)
```

No descuenta.

### 5.2 `/consumption/execute`

Debe usar:

```text
get_current_user(request)
execute_consumption_for_user(runtime_user, payload)
```

Descuenta si procede.

### 5.3 `/api/builder/build`

Debe:

1. autenticar usuario;
2. validar `projectId`;
3. construir request de consumo;
4. ejecutar consumo;
5. bloquear si no allowed;
6. ejecutar `run_builder_agent`.

### 5.4 `/api/projects`

`create_project` debe:

1. autenticar usuario;
2. decidir `idea_analysis` o `url_analysis`;
3. ejecutar consumo;
4. ejecutar IA;
5. guardar proyecto con metadata de consumo.

### 5.5 `/api/projects/{project_id}/blueprint`

Debe:

1. autenticar usuario;
2. validar propiedad del proyecto;
3. ejecutar `blueprint_generation`;
4. bloquear si no allowed;
5. generar blueprint.

---

## 6. Contrato de créditos iniciales

El crédito inicial gratuito debe registrarse una sola vez.

Campos esperados o equivalentes:

```text
credit_balance
credit_lifetime_granted
credit_lifetime_used
credit_initial_free_grant_at
credit_last_grant_at
```

Política actual:

```text
10 créditos/gemas iniciales de bienvenida.
No mensual recurrente por defecto.
```

---

## 7. Contrato de planes

Valores canónicos:

```text
free
blueprint
sistema
premium
```

Valores legacy a normalizar si aparecen:

```text
gratis → free
de primera calidad → premium
```

---

## 8. Contrato de roles

Valores canónicos:

```text
admin
user
```

Valores legacy a normalizar si aparecen:

```text
administrador → admin
usuario → user
```

---

## 9. Contrato de seguridad

Nunca confiar en:

- `user_id` enviado por cliente;
- `user_plan` enviado por cliente;
- saldo enviado por cliente;
- crédito especial enviado por cliente;
- ownership de proyecto enviado por cliente.

Siempre confiar en:

- usuario autenticado por backend;
- MongoDB como fuente de usuario;
- servicios de créditos;
- ledger;
- Stripe firmado.

---

## 10. Contrato de auditoría

Cada nueva acción de consumo debe documentarse en:

```text
docs/system/credits/01-MATRIZ-OPERATIVA-CREDITOS-V1.md
backend/config/credits/action_catalog.json
```

Y debe tener:

- acción;
- plan requerido;
- tipo de consumo;
- tier;
- superficie;
- router o servicio que la ejecuta.

---

## 11. Contrato de no regresión

No se aprueba una nueva acción IA si:

- no tiene `action_key`;
- no pasa por consumo;
- no tiene plan requerido;
- no tiene tipo de consumo;
- no tiene UX de bloqueo;
- no tiene trazabilidad;
- no tiene prueba manual o automatizada.

---

## 12. Veredicto operativo

Este contrato convierte los créditos en una capa de control económico real.

Toda acción de valor debe pasar por:

```text
catálogo
→ normalización
→ gates
→ ledger
→ ejecución
```

Si una acción no cabe en este contrato, no está lista para producción.
