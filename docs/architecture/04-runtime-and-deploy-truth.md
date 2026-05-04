# 04 — Runtime and Deploy Truth

## Estado del documento

- Estado: activo
- Tipo: arquitectura canónica de runtime y deploy
- Alcance: backend, Dockerfile, Railway, healthcheck, frontend build y legacy retirado
- Objetivo: fijar la única verdad de arranque y despliegue del sistema.

---

## 1. Runtime canónico actual

Servidor canónico:

```text
backend/app/main.py
```

App canónica:

```text
backend.app.main:app
```

Runtime:

```text
FastAPI + Uvicorn
```

---

## 2. Deploy canónico actual

Archivos canónicos:

```text
Dockerfile
railway.json
```

Documento operativo relacionado:

```text
DEPLOY_RAILWAY.md
```

---

## 3. Healthcheck canónico

Ruta:

```text
/health
```

Respuesta esperada:

```json
{"status":"ok"}
```

---

## 4. Regla actual de arranque

El `Dockerfile` debe arrancar el servicio mediante su `CMD`.

`railway.json` no debe contener `deploy.startCommand`.

Motivo:

Railway puede ejecutar `startCommand` sin expansión shell.
Eso ya causó un fallo donde Uvicorn recibió literalmente:

```text
${PORT:-8080}
```

como puerto.

El `CMD` del Dockerfile usa `sh -c` y sí expande correctamente `PORT`.

---

## 5. Dockerfile esperado

El Dockerfile debe:

- construir frontend con Node 22;
- usar `npm ci`;
- compilar `frontend/build`;
- usar Python 3.11 para runtime;
- instalar dependencias desde `backend/requirements.txt`;
- copiar backend;
- copiar frontend build;
- arrancar `backend.app.main:app`.

---

## 6. railway.json esperado

`railway.json` debe definir:

- builder Dockerfile;
- ruta del Dockerfile;
- healthcheck;
- timeout;
- restart policy.

No debe definir:

```text
deploy.startCommand
```

---

## 7. Frontend en producción

El frontend se sirve como build estático desde FastAPI.

No existe un dev server de React en producción.

Ruta esperada:

```text
/app/frontend/build
```

FastAPI debe servir:

- `/static`;
- `/`;
- fallback SPA;
- `/api/*` como backend.

---

## 8. Variables de entorno críticas

Railway debe contener:

```text
MONGO_URL
DB_NAME
JWT_SECRET
OPENAI_API_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
GOOGLE_CLIENT_ID
ALLOWED_ORIGINS
COOKIE_SECURE=true
```

`PORT` lo gestiona Railway.

---

## 9. Legacy runtime retirado

Las siguientes piezas no forman parte del runtime activo:

```text
backend/server.py
railway/server_railway.py
railway/requirements.txt
```

No deben reintroducirse.

---

## 10. Principios

1. Un solo servidor vivo.
2. Un solo camino de deploy.
3. Una sola verdad de runtime.
4. Todo el legacy fuera del flujo operativo.
5. Ningún archivo paralelo decide el arranque.
6. No hay deploy sin healthcheck.
7. No hay secretos en Git.
8. No hay frontend dev server en producción.

---

## 11. Validación mínima

Antes de cerrar un cambio de deploy:

```powershell
python -m pytest backend\tests
cd backend
python -m compileall app
cd ..
cd frontend
npm.cmd run build
cd ..
```

Y en producción:

```text
https://sistemamaestro.com/health
```

debe responder:

```json
{"status":"ok"}
```

---

## 12. Veredicto operativo

La verdad actual de runtime y deploy es:

```text
Dockerfile
→ backend.app.main:app
→ /health
→ Railway
```

Cualquier segunda vía de arranque debe considerarse legacy o error.
