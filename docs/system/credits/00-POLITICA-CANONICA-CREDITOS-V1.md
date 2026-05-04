# 00-POLITICA-CANONICA-CREDITOS-V1

## Estado del documento

- Estado: activo
- Tipo: política canónica de créditos
- Alcance: economía de uso, consumo IA, acciones intensivas y protección de coste
- Fuente de verdad relacionada:
  - `backend/config/credits/action_catalog.json`
  - `backend/config/credits/tier_amounts.json`
  - `backend/config/credits/plan_levels.json`
  - `backend/app/services/consumption_engine.py`
  - `backend/app/services/credits.py`
  - `backend/app/routers/builder_ai.py`
  - `backend/app/routers/projects.py`

---

## 1. Principio rector

Los créditos existen para proteger el coste real de ejecución del sistema.

No son decoración.

No son puntos gamificados sin efecto.

No son saldo enviado por el frontend.

Los créditos representan derecho de uso sobre acciones intensivas del sistema.

---

## 2. Regla madre

```text
No créditos sin acción real.
No IA cara sin consumo previo.
No consumo decidido por el frontend.
No saldo enviado por el cliente.
No plan enviado por el cliente.
```

El servidor es la única autoridad sobre:

- usuario;
- plan;
- saldo;
- crédito estándar;
- crédito especial;
- acción solicitada;
- coste;
- bloqueo;
- ejecución.

---

## 3. Tipos de crédito

### 3.1 Créditos estándar

Se usan para acciones ordinarias de análisis, construcción e iteración.

Ejemplos:

- análisis de idea;
- análisis de URL;
- primera construcción en Builder;
- iteraciones del Builder;
- generación de blueprint.

### 3.2 Créditos especiales

Se reservan para acciones de salida o valor final.

Ejemplos:

- exportar proyecto;
- desplegar proyecto;
- operaciones finales de alto valor.

### 3.3 Créditos iniciales

El usuario puede recibir una asignación inicial gratuita.

Política actual:

```text
10 gemas iniciales de bienvenida.
```

Decisión provisional:

```text
No son créditos mensuales recurrentes.
Son una asignación única de activación.
```

---

## 4. Qué consume créditos

Consume crédito toda acción que cumpla al menos una de estas condiciones:

- ejecuta IA real;
- genera o modifica proyecto;
- produce blueprint;
- produce una mutación de Builder;
- implica coste operativo relevante;
- produce salida con valor para el usuario;
- exporta, despliega o prepara entrega final.

---

## 5. Qué no consume créditos

No debe consumir créditos:

- navegar por la app;
- abrir dashboard;
- abrir oportunidades;
- leer contenido ya generado;
- cambiar filtros;
- ver billing;
- simular sin salida real;
- renderizar componentes visuales estáticos;
- abrir una pantalla sin mutación;
- mostrar preview sin acción nueva.

---

## 6. Autoridad de consumo

El frontend no decide consumo.

El frontend solo expresa intención:

```text
quiero analizar
quiero construir
quiero iterar
quiero generar blueprint
quiero exportar
```

El backend decide:

```text
usuario real
plan real
saldo real
acción real
coste real
permitido o bloqueado
```

---

## 7. Flujo canónico

```text
request autenticada
→ get_current_user
→ construir ConsumptionRequest
→ execute_consumption_for_user
→ cargar saldo real
→ normalizar action_config
→ validar plan
→ validar balance
→ registrar consumo
→ ejecutar acción IA
```

---

## 8. Regla de bloqueo

Si el usuario no tiene plan o saldo suficiente, la acción debe bloquearse antes de ejecutar IA.

Estados esperados:

- bloqueado por plan;
- bloqueado por saldo estándar;
- bloqueado por saldo especial;
- acción inválida;
- permitido.

---

## 9. Regla de UX

El bloqueo por créditos no debe sentirse como error técnico.

Debe comunicar:

- qué acción intentó ejecutar;
- por qué se bloqueó;
- qué necesita para continuar;
- qué plan o saldo desbloquea la acción.

---

## 10. Cuenta de QA

La cuenta interna de QA puede tener plan premium y saldo suficiente para validar flujos completos:

```text
lucasdiazarias85@gmail.com
role: admin
plan: premium
```

Esto no define política comercial para usuarios normales.

Sirve para validar Builder, créditos y salidas.

---

## 11. Decisiones cerradas relacionadas

- Builder AI cobra antes de ejecutar IA.
- Project analysis cobra antes de `analyze_with_ai`.
- Blueprint cobra antes de `generate_blueprint`.
- `/consumption/execute` usa usuario autenticado.
- `plan_requirement` se normaliza a `required_plan`.
- `consumption_type_allowed` se normaliza a `consumption_type`.

---

## 12. Veredicto operativo

La política de créditos queda definida así:

```text
suscripción = acceso y continuidad
créditos estándar = ejecución intensiva ordinaria
créditos especiales = salida profesional / export / deploy
créditos iniciales = activación única controlada
```

El sistema no debe volver a ejecutar IA cara sin pasar por consumo.
