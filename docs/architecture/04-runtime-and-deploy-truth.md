\# 04 — Runtime and Deploy Truth



\## Propósito

Fijar la única verdad de arranque y despliegue del sistema.



\## Runtime canónico actual

\- servidor canónico: `backend/app/main.py`

\- app canónica: `backend.app.main:app`



\## Deploy canónico actual

\- `Dockerfile`

\- `railway.json`



\## Healthcheck canónico

\- ruta: `/health`



\## Backend legacy en cuarentena

\- `backend/server.py`

\- `railway/server\_railway.py`



\## Estado de legacy

\- no ampliar

\- no usar para cambios nuevos

\- no reconectarlos al runtime

\- pendientes de retirada cuando el sistema esté estable



\## Principios

1\. Un solo servidor vivo

2\. Un solo camino de deploy

3\. Una sola verdad de runtime

4\. Todo lo legacy fuera del flujo operativo

5\. Ningún archivo paralelo decide el arranque



\## Regla operativa

Antes de tocar despliegue:

\- validar entorno

\- validar variables

\- validar healthcheck

\- validar que el servidor activo sigue siendo el canónico

