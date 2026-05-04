# 01 — System Layers

## Estado del documento

- Estado: activo
- Tipo: arquitectura canónica
- Alcance: capas principales de Sistema Maestro
- Objetivo: evitar mezclas entre producto, runtime, IA, créditos, despliegue, documentación y operación.

---

## 1. Propósito

Este documento define las capas canónicas de Sistema Maestro.

Su función es responder:

```text
qué vive en cada capa
qué no debe mezclarse
qué rutas tienen autoridad estructural
qué piezas no deben duplicarse
```

---

## 2. Regla madre

Sistema Maestro no debe crecer como suma de pantallas.

Debe crecer como sistema:

```text
entrada
→ diagnóstico
→ activación
→ proyecto
→ Builder
→ créditos
→ salida
→ continuidad
```

Cada capa debe tener una responsabilidad clara.

---

## 3. Capas canónicas

## 3.1 Entrada y activación

Responsable de:

- Home;
- flujo inicial;
- captación;
- clasificación de necesidad;
- activación del usuario;
- entrada por idea, URL, oportunidad o prompt.

Ubicación principal:

```text
frontend/src/features/home/
frontend/src/features/flow/
frontend/src/pages/
```

Regla:

La capa de entrada prepara contexto.
No debe contener lógica sensible de negocio, créditos o permisos.

---

## 3.2 Motor de negocio

Responsable de:

- autenticación;
- usuarios;
- proyectos;
- oportunidades;
- billing;
- pagos;
- planes;
- créditos;
- informes;
- permisos.

Ubicación principal:

```text
backend/app/routers/
backend/app/services/
backend/app/domain/
backend/app/schemas/
backend/app/core/
```

Regla:

El backend es autoridad sobre identidad, plan, saldo, permisos, pagos y consumo.

El frontend no decide:

- saldo;
- plan;
- ownership;
- consumo;
- pagos;
- privilegios.

---

## 3.3 Sistema de créditos

Responsable de:

- proteger coste IA;
- decidir consumo;
- bloquear por plan;
- bloquear por saldo;
- registrar ledger;
- diferenciar crédito estándar y crédito especial.

Ubicación principal:

```text
backend/config/credits/
backend/app/services/consumption_engine.py
backend/app/services/credits.py
backend/app/schemas/consumption.py
docs/system/credits/
```

Regla:

```text
No IA cara sin consumo previo.
No créditos sin acción real.
No saldo enviado por frontend.
```

---

## 3.4 Infraestructura IA

Responsable de:

- orquestación;
- agentes;
- guards;
- prompts;
- tools;
- memory;
- telemetry;
- evaluación;
- trazabilidad.

Ubicación principal:

```text
backend/app/ai/
backend/app/services/ai_analysis*.py
backend/app/ai/agents/
backend/app/ai/guards/
backend/app/ai/orchestrators/
```

Regla:

La IA no debe ser texto decorativo.
Debe producir decisiones, mutaciones, diagnósticos, estructuras o salidas verificables.

---

## 3.5 Builder

Responsable de:

- transformar input en estado vivo;
- aplicar mutaciones;
- producir preview;
- producir estructura;
- producir código o modelos de salida;
- guiar iteraciones;
- sostener continuidad del proyecto.

Ubicación principal:

```text
frontend/src/features/builder/
frontend/src/features/builder/state/
frontend/src/features/builder/workspace/
frontend/src/features/builder/api/
backend/app/routers/builder_ai.py
backend/app/ai/agents/builder_agent.py
```

Regla:

El Builder no se valida porque abre.
El Builder se valida porque construye.

---

## 3.6 Frontend App Shell

Responsable de:

- navegación interna;
- dashboard;
- layout;
- rutas visuales;
- estado de UI;
- acceso a módulos.

Ubicación principal:

```text
frontend/src/components/
frontend/src/features/app-shell/
frontend/src/features/dashboard/
frontend/src/features/projects/
frontend/src/features/opportunities/
frontend/src/features/billing/
```

Regla:

La UI debe consumir API centralizada mediante:

```text
frontend/src/lib/apiClient.js
```

No debe crear clientes HTTP paralelos ni usar `127.0.0.1` en producción.

---

## 3.7 Runtime y despliegue

Responsable de:

- arranque;
- Docker;
- Railway;
- healthcheck;
- variables de entorno;
- build frontend;
- runtime backend;
- frontend estático servido por FastAPI.

Ubicación principal:

```text
Dockerfile
railway.json
backend/app/main.py
DEPLOY_RAILWAY.md
```

Regla:

`Dockerfile` manda el arranque.

`railway.json` configura build y healthcheck.

No debe existir `deploy.startCommand` duplicando el `CMD` del Dockerfile.

---

## 3.8 Documentación y control

Responsable de:

- decisiones cerradas;
- pendientes priorizados;
- rutas canónicas;
- procedimientos;
- incidencias;
- deploy e higiene;
- QA operativo;
- memoria institucional.

Ubicación principal:

```text
docs/control/
docs/product/
docs/system/
docs/architecture/
docs/qa/
```

Regla:

El chat no es memoria institucional.
Las decisiones importantes deben quedar en documentos canónicos.

---

## 4. Fronteras prohibidas

No se permite:

- lógica de créditos en componentes visuales;
- pagos sin firma Stripe;
- usuarios admin por defecto;
- URLs locales hardcodeadas en frontend;
- Builder simulado como si fuera construcción real;
- deploy con dos comandos de arranque;
- documentación duplicada con funciones iguales;
- snapshots como documentación canónica;
- archivos vacíos fingiendo ser documentación.

---

## 5. Relación entre capas

```text
Home / Flow / Oportunidades
→ Projects
→ Builder
→ AI
→ Consumption Engine
→ Credit Ledger
→ Billing / Stripe
→ Export / Deploy futuro
```

La secuencia correcta no se salta capas.

---

## 6. Criterio de cierre

Una capa se considera sana cuando:

- tiene responsabilidad clara;
- no duplica otra capa;
- tiene rutas canónicas;
- está documentada;
- tiene validación mínima;
- no depende de memoria de chat.

---

## 7. Veredicto operativo

Sistema Maestro debe operar con una sola verdad por capa.

Si una pieza no sabe en qué capa vive, todavía no está lista.
