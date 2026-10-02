# 04 — Runtime and Deploy Truth

## Estado del release PRE-S14 — 2026-10-02

| Plano | Identidad y estado |
|---|---|
| Candidato validado | `codex/vite-migration` @ `a370f219fbcc569a0cee853a609ef4fa311063b0` |
| GitHub main | `36eb6c112478685e417ce8c054e61d77f539212e` |
| Tree de main / contenido desplegado | `447cea61b0e41a0711cd3d2d132fddfcda045d03` |
| Railway production deployment | `61140c2c-e5be-4e86-9b2d-fb2b6d7a8ca0` — `SUCCESS` |
| Correspondencia main ↔ Railway | `MATCH` |
| Release PRE-S14 | `CLOSED / DEPLOYED / VERIFIED` |
| S14 | `NOT_STARTED` |

El merge de release une el candidato validado con la base previa; Railway desplegó el merge commit exacto de `main`. La verificación productiva incluyó health, home, assets y OAuth E2E con Dashboard, Builder y ruta profunda renderizados.

La limitación de evidencia restante se registra literalmente: `/api/auth/me` no se observó directamente porque el navegador devolvió `ERR_BLOCKED_BY_CLIENT`. La sesión OAuth y el acceso autenticado a las superficies privadas quedaron funcionalmente verificados; QA y Security aprobaron con riesgos. La respuesta del endpoint no se declara observada.

[Journey 03](../product/sistema-maestro/07-JOURNEY-03-ESTADO-PRE-S14.md) conserva el estado, la cadena de validación y los límites del release. [Inventario](../control/03-INVENTARIO-TECNICO.md) registra el Gold Freeze previo; no lo confunde con el freeze final post-release.

Este documento y los archivos Dockerfile/railway.json prevalecen sobre ejemplos
incompatibles del procedimiento DEPLOY_RAILWAY.md: su ejemplo startCommand
no representa la configuración actual. La regla vigente es usar CMD del Dockerfile,
sin deploy.startCommand. La guía queda sin modificar por estar fuera del alcance.


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
- compilar `frontend/dist`;
- usar Python 3.11 para runtime;
- instalar dependencias desde `backend/requirements.txt`;
- copiar backend;
- copiar frontend build, sin node_modules en la etapa final;
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
/app/frontend/dist
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
