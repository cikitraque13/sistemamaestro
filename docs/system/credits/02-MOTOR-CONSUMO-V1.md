# 02-MOTOR-CONSUMO-V1

## Estado del documento

- Estado: activo
- Tipo: documentación técnica del motor de consumo
- Alcance: evaluación, ejecución, normalización, gates y ledger
- Fuente de verdad relacionada:
  - `backend/app/services/consumption_engine.py`
  - `backend/app/services/credits.py`
  - `backend/app/routers/consumption.py`
  - `backend/app/schemas/consumption.py`

---

## 1. Función del motor

El motor de consumo decide si una acción puede ejecutarse y, si procede, registra consumo.

No es un componente visual.

No es una sugerencia del frontend.

Es una pieza de autoridad backend.

---

## 2. Dos modos

### 2.1 Simulación

Endpoint:

```text
/consumption/simulate
```

Función:

- calcular coste;
- explicar gates;
- preparar UX;
- no descontar créditos.

### 2.2 Ejecución

Endpoint:

```text
/consumption/execute
```

Función:

- autenticar usuario;
- cargar saldo real;
- evaluar acción;
- descontar créditos si procede;
- devolver resultado ejecutado.

---

## 3. Regla crítica de ejecución

`/consumption/execute` debe usar:

```text
get_current_user(request)
execute_consumption_for_user(runtime_user, payload)
```

No debe usar directamente:

```text
evaluate_consumption(payload)
```

porque eso confiaría en datos enviados por el cliente.

---

## 4. Flujo interno

```text
payload entrante
→ usuario autenticado
→ resumen de créditos real
→ payload runtime corregido
→ action_config normalizada
→ gates de plan
→ gates de saldo
→ decisión
→ ajuste de ledger si allowed
→ respuesta final
```

---

## 5. Normalización de action config

El motor debe recibir siempre:

```text
required_plan
consumption_type
```

Aunque el catálogo use legacy:

```text
plan_requirement
consumption_type_allowed
```

Normalización obligatoria:

```text
plan_requirement → required_plan
consumption_type_allowed → consumption_type
```

---

## 6. Gates

### 6.1 Gate de acción

Bloquea si `action_key` no existe.

Estado esperado:

```text
blocked_invalid_action
```

### 6.2 Gate de plan

Bloquea si el usuario no tiene plan suficiente.

Estado esperado:

```text
blocked_plan
```

### 6.3 Gate de saldo estándar

Bloquea si el usuario no tiene créditos estándar suficientes.

Estado esperado:

```text
blocked_balance
```

### 6.4 Gate de saldo especial

Bloquea si el usuario no tiene créditos especiales suficientes.

Estado esperado:

```text
blocked_special_credit
```

---

## 7. Decisión permitida

Solo cuando todos los gates pasan:

```text
status = allowed
```

Entonces se puede ejecutar la acción real:

- IA;
- Builder;
- blueprint;
- export;
- deploy.

---

## 8. Ledger

Toda ejecución real debe dejar rastro.

El ledger debe permitir responder:

- quién consumió;
- qué acción consumió;
- cuánto consumió;
- sobre qué proyecto;
- cuándo;
- por qué superficie;
- con qué trace.

---

## 9. Superficies actuales

Superficies conectadas:

```text
projects
builder
consumption
```

Entrypoints actuales:

```text
create_project
create_blueprint
builder_ai_build
consumption_execute
```

---

## 10. Integraciones cerradas

### 10.1 Projects

`create_project` debe ejecutar consumo antes de análisis IA.

Acciones:

```text
idea_analysis
url_analysis
```

### 10.2 Blueprint

`create_blueprint` debe ejecutar consumo antes de generar blueprint.

Acción:

```text
blueprint_generation
```

### 10.3 Builder

`/api/builder/build` debe ejecutar consumo antes de `run_builder_agent`.

Acciones:

```text
builder_first_run
builder_light_iteration
builder_structural_iteration
```

---

## 11. Respuesta del motor

La respuesta debe incluir:

- `status`;
- `decision`;
- `gates`;
- `ux`;
- `trace`.

La UX debe ser útil para bloqueo o continuación.

---

## 12. Errores prohibidos

No se permite:

- consumir sin usuario autenticado;
- consumir con saldo enviado por frontend;
- consumir sin action config;
- descontar después de ejecutar IA;
- ejecutar IA y luego comprobar créditos;
- mezclar crédito estándar y especial;
- permitir export/deploy con saldo estándar si requiere especial.

---

## 13. Tests mínimos pendientes

Añadir tests para:

- `/consumption/execute` sin auth;
- acción inválida;
- plan insuficiente;
- saldo insuficiente;
- consumo permitido;
- ledger creado;
- consumo especial bloqueado;
- normalización de action config.

---

## 14. Veredicto operativo

El motor de consumo es una puerta de seguridad económica.

Si una acción cuesta dinero, tokens o valor operativo, pasa primero por este motor.

Sin motor no hay IA cara.
