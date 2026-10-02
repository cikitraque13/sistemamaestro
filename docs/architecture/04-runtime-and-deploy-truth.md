# 04 — Runtime and Deploy Truth

## Estado del release PRE-S14 — 2026-10-02

| Plano | Identidad y estado |
|---|---|
| GitHub main (checkpoint S14 Entry) | `3b0a23a96711a7be9d2fa42ccce101882c328295` |
| Tree de main | `3c1d8e2b2b2b3de88bcc994bdd5482340e0cc57c` |
| Railway production deployment reportado | `7e4e39d8-a1ea-495e-866c-c0d09efb7ec6` — `SUCCESS` |
| Correspondencia main ↔ Railway | `MATCH` reportado; el SHA exacto del deployment no consta en esta evidencia |
| `/health` / home | `200` reportado |
| Release PRE-S14 | `CLOSED / DEPLOYED / VERIFIED` |
| Gold S14 Entry | `GOLD_FREEZE_S14_ENTRY_2026-10-02` |
| S14 | `NOT_STARTED` (estado canónico en [Master Maturity Roadmap](../product/sistema-maestro/08-MASTER-MATURITY-ROADMAP.md)) |

La identidad de `main` y tree corresponde al checkpoint canónico indicado. El deployment ID, estado, coincidencia main/Railway y verificaciones HTTP se registran según el gate productivo reportado; no se afirma aquí una observación directa del SHA de Railway.

La limitación de evidencia restante se registra literalmente: `/api/auth/me` no se observó directamente porque el navegador devolvió `ERR_BLOCKED_BY_CLIENT`. La sesión OAuth y el acceso autenticado a las superficies privadas quedaron funcionalmente verificados; QA y Security aprobaron con riesgos. La respuesta del endpoint no se declara observada.

[Journey 03](../product/sistema-maestro/07-JOURNEY-03-ESTADO-PRE-S14.md) conserva el estado, la cadena de validación y los límites del release. [Inventario](../control/03-INVENTARIO-TECNICO.md) registra el Gold PRE-S14 anterior y el Gold S14 Entry vigente. El [Master Maturity Roadmap](../product/sistema-maestro/08-MASTER-MATURITY-ROADMAP.md) es owner de los estados S14–S18/J04–J16; las reglas transversales están en [Journey Gate Operating Rules](../control/09-JOURNEY-GATE-OPERATING-RULES.md).

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
