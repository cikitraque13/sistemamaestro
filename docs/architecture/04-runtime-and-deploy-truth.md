# 04 — Runtime and Deploy Truth

## Estado actual del release S16 — 2026-10-07

| Plano | Identidad y estado |
|---|---|
| Final Gold prepublicación | `GOLD_FREEZE_S16_POST_SANEO_FINAL_2026-10-05`; PASS |
| Commit de publicación | `4322f7936a93c12eec288e44efcd3eb43d2a3639` |
| PR | [#83](https://github.com/cikitraque13/sistemamaestro/pull/83) MERGED |
| GitHub main | `2b3f8c0345829273a3c92d08633e789334424a23` |
| Railway deployment | `824b2d5b-12ad-4364-8464-9462679ffc9b` |
| Railway production SHA | `2b3f8c0345829273a3c92d08633e789334424a23` |
| Railway Docker build | SUCCESS; Node `22.22.2-alpine` con digest `sha256:8ea2348b068a9544dae7317b4f3aafcdc032df1647bb7d768a05a5cad1a7683f` |
| `/health` / home | `200 / 200` |
| Regresión operacional | NO |
| Trazabilidad GitHub main → Railway → producción | PASS |
| S16 | CLOSED; READY_FOR_S17=YES |
| S17 | Aún no abierto; checkpoint post-S16 pendiente |

El PR #83 contiene exactamente las 18 rutas del candidato congelado (16 tracked modificadas y `.nvmrc`/`.python-version` nuevas). Railway reporta el mismo SHA de `main`, y la verificación pública de health y home respondió HTTP 200.

## Registro histórico del release S15 — 2026-10-05

| Plano | Identidad y estado |
|---|---|
| Candidato S15 | e6e73e67b97273db54b41adad6c59232a7cd7f2f |
| PR | #81 MERGED |
| GitHub main | e0f93c22bf9ac9fd1f4f005ad9dc1fb7b9ae2279 |
| Tree de main | 523e0f1bee92c59e7d5058426952862beb7da5ab |
| Railway deployment | a83bab19-a551-4b2f-bb7a-ad066abc0666 |
| Railway production SHA | e0f93c22bf9ac9fd1f4f005ad9dc1fb7b9ae2279 |
| Trazabilidad candidato → PR/merge → main → Railway | PASS |
| Railway | SUCCESS |
| Flujo autenticado y ruta legacy | PASS; evidencia manual HUMAN-LUCAS |
| SERVER_REVISION_MISMATCH | RESOLVED |
| Regresión | NO |
| Cierre operacional S15 | CLOSED |

El candidato S15 es el segundo padre del merge de PR #81; el merge conserva el tree aceptado. HUMAN-LUCAS aportó la evidencia manual de producción autenticada. Este registro histórico no representa el release productivo vigente, que consta arriba, ni añade resultados de healthcheck o pruebas fuera de aquella evidencia.

## Evidencia prepublicación del candidato S16 — 2026-10-05 (histórica)

Los estados OPEN/PENDING, el worktree candidato y el R2 pendiente que siguen describen exclusivamente el corte anterior a la publicación. Fueron superados por el cierre vigente documentado al inicio de este archivo.

- STATUS: OPEN; S16_TECHNICAL_WORK=COMPLETE; no aceptación/cierre.
- CANDIDATE: branch `s16/runtime-identity`; HEAD `7ab084f38d8de39baa6a79b566a74a168b91a8cb`; tree `36e7c83cf16e6e95a610625f197f6e093f4a0b73`.
- WORKTREE: TRACKED_MODIFIED=16; NEW_UNTRACKED=2 (`.nvmrc`, `.python-version`); TOTAL_S16_PATHS=18. Both new paths are expected candidate files, not recovery contamination.
- RUNTIME: Node 22.22.2; Python 3.11; RUNTIME_IDENTITY=PASS.
- INSTALL_REPRODUCIBILITY=PASS; TEST_REPRODUCIBILITY=PASS; backend tests 73 passed, 27 subtests passed; FRONTEND_BUILD=PASS; PRODUCT_CODE_CHANGED=NO.
- R1 Review Target transport: WIRING_DESIGN=PASS; SHARED_TRANSPORT=PASS; PREFLIGHT=PASS; exact shared target, source/destination hash match and FS/QA/SEC resolution accredited. This transport fix is distinct from SM-ED materialization.
- R1 SM-ED: canonical personal Skill authority verified; supported local materialization in this Work=PASS; ENGINEERING_DIRECTOR=ACTIVE; SKILL_LOADED=YES; CONTRACT_APPLIED=YES. No automatic synchronization across runtimes is asserted.
- R1 wiring changeset: 7 files; hash `260f2972d98eb464175e1e461df6c68684f9918d6b8cabba2c1f9ebb54b84235`. It is distinct from the 18-path S16 worktree.
- R2: Node image `node:22.22.2-alpine`, digest `sha256:8ea2348b068a9544dae7317b4f3aafcdc032df1647bb7d768a05a5cad1a7683f`; digest fix=PASS; SM-FS=PASS; SM-SEC=PASS; Docker build=NOT_RUN because the authorized Docker engine was unavailable. Railway publication build remains mandatory for subsequent S16 closure; R2 does not block the prepublication Final Gold.
- FINAL_GOLD: `GOLD_FREEZE_S16_POST_SANEO_FINAL_2026-10-05`; STATUS=PENDING; prepublication freeze.
- PRE-S17_SANITATION: PASS against the sealed target `S16-PRE-S17-7ab084f38d8de39b-20261005T1305Z` (SHA-256 `2bebd818e4d205043a6209a201cadfac5cc2be55eecc10204e59dbbcb7cf85b8`); SM-FS=PASS, SM-QA=PASS_WITH_EVIDENCE_LIMITATION, SM-SEC=PASS; zero critical structural findings; zero FIX_BEFORE_S17 findings; candidate contamination=NO; documentation divergence=NO; secret exposure=NO.
- REVIEW_TARGET_TRANSPORT_ROOT_FIX: PASS; exact target materialized in the collaboration-shared workspace, source/destination hashes matched, and SM-FS/SM-QA/SM-SEC each resolved the same reference/hash before audit. No product code changed.
- OBS-01: future Review Targets should attach or reference immutable raw execution evidence when independent re-verification is required. CLASSIFICATION=STRATEGIC_OPTIMIZATION; DISPOSITION=DEFER.
- S16 remains OPEN; sanitation does not close S16 or open S17. SM-ED local materialization is resolved for this Work; automatic cross-runtime synchronization is not asserted. Review Target transport is a separate PASS.
- NEXT_CONTROL_STEP: create the pending prepublication Final Gold; after publication, complete the mandatory R2 Railway publication build and subsequent production verification for S16 closure. S17 remains unopened.

## Registro histórico del release S14 — 2026-10-03

| Plano | Identidad y estado |
|---|---|
| GitHub main | `180fdfc887ce9f83b0c269f1daeea8fdfc11abe7` |
| Tree de main observado en checkout canónico | `10c77fdeca90f7c52cc8ca1b02c33c6560517968` |
| Railway deployment | `9f7ce141-ed03-49d7-880c-ea961766aec4` |
| Railway production SHA | `180fdfc887ce9f83b0c269f1daeea8fdfc11abe7` |
| Correspondencia GitHub main ↔ Railway | `YES` |
| Railway | `SUCCESS` |
| `/health` / home | `200 / 200` |
| Production smoke | `PASS` |
| Alcance de publicación | Exacto: tres archivos S14 autorizados; archivos extra: ninguno |
| Estado del release S14 | `CLOSED / DEPLOYED / VERIFIED` |
| Gold S14 Entry | `GOLD_FREEZE_S14_ENTRY_2026-10-02` (checkpoint de entrada) |
| Estado S14 | `COMPLETED` (estado canónico en [Master Maturity Roadmap](../product/sistema-maestro/08-MASTER-MATURITY-ROADMAP.md)) |

El gate de publicación acredita el commit de GitHub main y el mismo SHA en Railway production; el deployment indicado terminó SUCCESS. La verificación acredita health/home HTTP 200 y production smoke PASS. El tree indicado corresponde al checkout canónico observado en ese commit.

### Antecedente histórico PRE-S14

El release PRE-S14 usó el checkpoint de main `3b0a23a96711a7be9d2fa42ccce101882c328295`, tree `3c1d8e2b2b2b3de88bcc994bdd5482340e0cc57c` y deployment reportado `7e4e39d8-a1ea-495e-866c-c0d09efb7ec6`. La limitación de observabilidad de `/api/auth/me` (`ERR_BLOCKED_BY_CLIENT`) y la aprobación con riesgos corresponden a ese release histórico; no describen la verificación del release S14.

[Journey 03](../product/sistema-maestro/07-JOURNEY-03-ESTADO-PRE-S14.md) conserva el cierre y la cadena de validación S14. [Inventario](../control/03-INVENTARIO-TECNICO.md) registra el Gold PRE-S14 anterior, el Gold S14 Entry y el alcance técnico implementado. El [Master Maturity Roadmap](../product/sistema-maestro/08-MASTER-MATURITY-ROADMAP.md) es owner de los estados S14–S18/J04–J16; las reglas transversales están en [Journey Gate Operating Rules](../control/09-JOURNEY-GATE-OPERATING-RULES.md).

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

- construir frontend con Node 22.22.2, fijado por la referencia de imagen S16;
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
