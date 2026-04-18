\# 01 — System Layers



\## Propósito

Definir las capas canónicas de Sistema Maestro y evitar mezclas entre producto, runtime, IA, despliegue y documentación.



\## Capas canónicas



\### 1. Entrada y activación

Responsable de:

\- Home

\- flujo inicial

\- captación

\- clasificación de necesidad

\- activación del usuario



Ubicación principal:

\- `frontend/src/features/home/`

\- `frontend/src/pages/`

\- `frontend/src/features/flow/`



\### 2. Motor de negocio

Responsable de:

\- autenticación

\- proyectos

\- billing

\- créditos

\- oportunidades

\- informes

\- planes



Ubicación principal:

\- `backend/app/routers/`

\- `backend/app/services/`

\- `backend/app/domain/`

\- `backend/app/schemas/`



\### 3. Infraestructura IA

Responsable de:

\- orquestación

\- agentes

\- guards

\- tools

\- memory

\- evals

\- telemetry



Ubicación principal:

\- `backend/app/ai/`



\### 4. Runtime y despliegue

Responsable de:

\- arranque

\- entorno

\- Docker

\- Railway

\- healthchecks

\- build



Ubicación principal:

\- `backend/app/main.py`

\- `Dockerfile`

\- `railway.json`



\### 5. Documentación y control

Responsable de:

\- arquitectura

\- decisiones

\- contratos

\- prompts

\- operaciones



Ubicación principal:

\- `docs/`



\## Regla madre

\- Todo lo vivo en su capa

\- Todo lo legacy en cuarentena

\- Todo lo estratégico documentado

\- Todo lo desplegable bajo una sola verdad



\## Prohibiciones

\- no duplicar servidores vivos

\- no mezclar IA con runtime sin contratos

\- no mezclar documentación con scratch local

\- no meter lógica de negocio sensible en componentes visuales

