# Sistema Maestro

Estado leído en `main` a partir de `08c8734` (28 de noviembre de 2026). Este archivo describe el producto y el despliegue; no sustituye `docs/control/`.

Repositorio: [cikitraque13/sistemamaestro](https://github.com/cikitraque13/sistemamaestro). Producción: [sistemamaestro.com](https://sistemamaestro.com). Salud: [sistemamaestro.com/health](https://sistemamaestro.com/health).

## Qué es

La portada, en `frontend/src/features/home`, lo dice así:

> Describe tu negocio: creamos tu web, la lanzamos y tu agente de IA atiende.

> Sistema Maestro interpreta tu idea o tu web y ordena prioridades.

> Si atiendes clientes por chat, web o WhatsApp, Sistema Maestro construye tu web y pone un agente de IA a atenderlos por ti.

La marca en la cabecera es «Dirección, IA y continuidad».

## Flujo

1. **Home.** Ruta `/`. Vive en `frontend/src/features/home`. Se restauró el 2026-11-23 al revertir el PR #115 (`f917e76a`) y el copy de cierre el 2026-11-28 (`02c2076`, revierte #163 solo en esa carpeta). La carpeta queda congelada: el trabajo del builder no la modifica. «Iniciar sesión» va a `/login` y, tras entrar, a `/dashboard`.
2. **Dashboard.** El lanzador (`DashboardBuilderLauncher`) crea el proyecto con `POST /projects`. El backend llama a `analyze_with_ai`, que usa Grok, y guarda el `diagnosis` en el proyecto.
3. **Builder.** El lanzador abre `/dashboard/builder?project_id=`.
4. **Ejecutor.** Pipeline lineal de cinco pasos, en `backend/app/services/builder_executor.py`:

   | Paso | Qué hace |
   | --- | --- |
   | Entendiendo tu negocio | Grok clasifica la intención (`classify_intent`). |
   | Estructura de secciones | Grok escribe el blueprint (`generate_blueprint`). La preview usa como máximo 4 prioridades. |
   | Textos | El writer redacta la cabecera y cada sección. Por defecto es Claude. |
   | Diseño | Plantilla HTML fija (`render_preview_html`). No hay un generador aparte de componentes de aplicación. |
   | Revisión final | El juez puntúa con una rúbrica acotada. Si no encaja, se reintenta una vez: máximo 2 intentos (`MAX_DRAFT_ATTEMPTS`). |

   Clasificar y el blueprint llaman siempre a Grok. Los selectores cambian el juez y el writer:

   | Variable | Por defecto | Valores |
   | --- | --- | --- |
   | `BUILDER_EXECUTOR_ORCHESTRATOR` | `grok` | `grok` o `anthropic`. El juez usa este nombre. Un valor desconocido falla cerrado. |
   | `BUILDER_EXECUTOR_WRITER` | `anthropic` | `anthropic` (Claude) o `grok`. |

   El vivo llega por SSE en `POST /api/builder/preview/stream`. Eventos: `state`, `step`, `section`, `done`, `error`. Un paso en silencio también emite comentarios `: heartbeat` cada 10 s. El evento interno `result` no se envía al navegador.

   Cada versión aceptada se guarda en `builder_landing_states`. Se conservan como máximo 8 (`MAX_PREVIEW_VERSIONS`).

   El cobro de gemas pasa por `run_economic_operation` y el libro `credit_ledger` (nombre por defecto de `CREDIT_LEDGER_COLLECTION`). Si `BUILDER_FREE_TEST_MODE` está encendido, un administrador no reserva gemas. El modo está apagado cuando la variable no existe.

`BUILDER_ENABLED` no está en los `.env.example`. Si no está definida, los endpoints del builder responden 503 («El Builder está en construcción») y no reservan créditos. Un administrador entra igual. La lista de variables del servicio de producción en Railway no incluye ese nombre.

## Estado por PR

Comprobado en GitHub el 2026-11-28. `main` está en el merge de #180.

| PR | Estado | Qué aporta |
| --- | --- | --- |
| [#176](https://github.com/cikitraque13/sistemamaestro/pull/176) | Merged (`9393bce`, 2026-11-28) | Pasos reales del ejecutor y streaming SSE. |
| [#177](https://github.com/cikitraque13/sistemamaestro/pull/177) | Merged (`1825bab`, 2026-11-28) | Publicar la landing y dominio propio. Los flags siguen apagados. |
| [#178](https://github.com/cikitraque13/sistemamaestro/pull/178) | Merged (`2e50951`, 2026-11-28) | Snippet del agente de voz embebible. `EMBED_AGENT_ENABLED` sigue apagado. |
| [#179](https://github.com/cikitraque13/sistemamaestro/pull/179) | Merged (`adee2e2`, 2026-11-28) | Menú de cuenta arriba a la derecha del builder. El despliegue vigente de `main` lo incluye. La fila «Conoce a tu asesor» está visible y deshabilitada, con la marca Próximamente. |
| [#180](https://github.com/cikitraque13/sistemamaestro/pull/180) | Merged (`08c8734`, 2026-11-28) | Backend de los módulos de agente: chat, voz, WhatsApp y citas. `AGENT_MODULE_*` siguen apagados. |
| [#181](https://github.com/cikitraque13/sistemamaestro/pull/181) | Abierta, en curso. Base `08c8734`, mergeable. | Cierra el stream de preview cuando el cobro de gemas falla antes de empezar el trabajo. En `main` ese fallo deja el SSE en heartbeats. |
| [#182](https://github.com/cikitraque13/sistemamaestro/pull/182) | Abierta. Base `08c8734`, mergeable. | Flujo «Conoce a tu asesor». El flag `ADVISOR_FLOW_ENABLED` no está en `main` ni en los `.env.example`; en la PR queda apagado. |

## Feature flags

Nombres tomados de [`.env.example`](.env.example) y [`backend/.env.example`](backend/.env.example). En el código, ausente cuenta como apagado (`true`, `1`, `yes` u `on` encienden). No hay valores de secreto en este archivo.

| Variable | Por defecto | Qué hace |
| --- | --- | --- |
| `PUBLISH_LANDING_ENABLED` | apagada | Abre publicar, volver a publicar y despublicar la landing. |
| `BUILDER_PUBLISH_ENABLED` | apagada | Mismo interruptor de publicación, con el nombre anterior. |
| `CUSTOM_DOMAIN_ENABLED` | apagada | Abre el dominio propio y la búsqueda de ese `Host`. |
| `PUBLISH_RESOLVE_CUSTOM_HOSTS` | apagada | Busca dominios de cliente aunque el paso de dominio siga cerrado. |
| `EMBED_AGENT_ENABLED` | apagada | Agente de voz embebible. Un administrador puede ver el paso de instalación con el flag apagado; la sesión pública sigue cerrada salvo la clave de un administrador. |
| `AGENT_MODULE_CHAT_ENABLED` | `false` | Chat del agente del cliente. Sin flag, el tráfico anónimo recibe 404 y una sesión normal recibe 503. |
| `AGENT_MODULE_VOZ_ENABLED` | `false` | Voz. El adaptador concreto es una propuesta de Twilio Programmable Voice. |
| `AGENT_MODULE_WHATSAPP_ENABLED` | `false` | WhatsApp Cloud API. |
| `AGENT_MODULE_CITAS_ENABLED` | `false` | Citas. |

Un administrador puede usar publicación, dominio, embed y el runtime de módulos con el flag global apagado. El interruptor del proyecto, en los módulos de agente, sigue haciendo falta. Los ejemplos comentan también topes y nombres de credencial (`EMBED_AGENT_DAILY_CAP`, `TWILIO_AUTH_TOKEN`, `WHATSAPP_ACCESS_TOKEN`, `BOOKINGS_REMINDER_SECRET` y el resto). Esos nombres están vacíos en los ejemplos.

`PUBLISH_BASE_DOMAIN`, `PUBLISH_CNAME_TARGET`, `PUBLISH_APEX_TARGET` y `PUBLISH_APP_HOSTS` salen vacíos: sin dominio base el servidor no inventa `sistemamaestro.com`.

## Stack

Un contenedor. El frontend se construye y el backend lo sirve.

| Capa | Qué usa el repo |
| --- | --- |
| Backend | FastAPI (`fastapi==0.110.1`) y Uvicorn. Entrada `backend.app.main:app`. Python 3.11 (`.python-version` y la imagen del `Dockerfile`). |
| Frontend | React 18.2 y Vite 8 (`frontend/package.json`). Node 22.22.2. |
| Datos | MongoDB, con Motor y PyMongo. Base por defecto `sistemamaestro` (`DB_NAME`). |
| Modelos | Grok, vía xAI (`GROK_API_KEY`, `GROK_MODEL`). Claude, vía Anthropic (`ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`). Los ejemplos dejan `grok-4.3` y `claude-haiku-5-5`. |

## Desarrollo local

Desde la raíz del repositorio. Las variables van en `backend/.env` (el proceso las carga desde ahí). Hacen falta al menos `MONGO_URL` y `JWT_SECRET` de 32 caracteres o más. Los nombres están en los `.env.example`.

```bash
python -m pip install -r requirements.txt
uvicorn backend.app.main:app --reload --port 8000
```

`requirements.txt` incluye `backend/requirements.txt` y pytest.

```bash
cd frontend
npm ci
npm start
```

`npm start` y `npm run dev` ejecutan `vite --host 0.0.0.0`. El ejemplo del frontend usa `VITE_API_BASE_URL=http://127.0.0.1:8000`.

## Despliegue

El servicio Railway `sistemamaestro` (proyecto `sistemamaestro-project`) construye el repo `cikitraque13/sistemamaestro`, rama `main`, con el `Dockerfile`. `railway.json` fija el builder `DOCKERFILE`, `healthcheckPath` `/health`, timeout 300 s y reinicio `ON_FAILURE`. No hay `nixpacks.toml`. Un push a `main` despliega: el merge de #180 creó el despliegue `SUCCESS` del commit `08c8734`.

El contenedor escucha `${PORT:-8080}`:

```bash
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8080}
```

`GET /health` responde `{"status":"ok"}`.

Dominios del servicio, ambos en el puerto 8080, verificados, con certificado válido (consulta Railway del 2026-11-28):

- `sistemamaestro.com`
- `*.sistemamaestro.com`, para las landings publicadas

Publicar sigue apagado: sin `PUBLISH_LANDING_ENABLED` el producto no sirve esas landings, y el adaptador de dominio responde «Pendiente de activación por Sistema Maestro». El código no llama a la API de Railway ni escribe DNS.

## Tests

Backend, desde la raíz, un proceso por archivo. Varios tests fijan el entorno e importan `backend.app.core.config` al cargar el módulo; un solo proceso de pytest arrastra ese estado de un archivo a otro.

```bash
python -m pip install -r requirements.txt
for f in backend/tests/test_*.py; do
  python -m pytest "$f" || exit 1
done
```

Hay 30 archivos `backend/tests/test_*.py`. Los de Atlas se saltan si no hay base.

Frontend, dentro de `frontend/`:

```bash
npx vitest run
npm run test:mjs
npm run build
```

`npm test` es `vitest run`. `npm run build` construye la app y los bundles de embed.
