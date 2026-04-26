# 04 — Runtime and Deploy Truth

## Propósito

Fijar la única verdad de arranque y despliegue del sistema.

---

## Runtime canónico actual

- servidor canónico: `backend/app/main.py`
- app canónica: `backend.app.main:app`

---

## Deploy canónico actual

- `Dockerfile`
- `railway.json`

---

## Healthcheck canónico

- ruta: `/health`

---

## Legacy runtime retirado del repo activo

Las siguientes piezas ya no forman parte del repo activo:

- `backend/server.py`
- `railway/server_railway.py`
- `railway/requirements.txt`

### Estado

Estas piezas fueron retiradas del repo activo y movidas a safety para cierre controlado del legado.

---

## Principios

1. Un solo servidor vivo
2. Un solo camino de deploy
3. Una sola verdad de runtime
4. Todo el legacy fuera del flujo operativo
5. Ningún archivo paralelo decide el arranque

---

## Regla operativa

Antes de tocar despliegue:

- validar entorno;
- validar variables;
- validar healthcheck;
- validar que el servidor activo sigue siendo el canónico;
- validar que el legacy retirado no reaparece en el repo activo.