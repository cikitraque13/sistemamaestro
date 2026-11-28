# Sistema Maestro

Estado leído en `main` a partir de `e9fe97f` (28 de noviembre de 2026). Este archivo describe el producto y el despliegue; no sustituye `docs/control/`.

Repositorio: [cikitraque13/sistemamaestro](https://github.com/cikitraque13/sistemamaestro). Producción: [sistemamaestro.com](https://sistemamaestro.com). Salud: [sistemamaestro.com/health](https://sistemamaestro.com/health).

## Qué es

La portada, en `frontend/src/features/home`, lo dice así:

> Describe tu negocio: creamos tu web, la lanzamos y tu agente de IA atiende.

> Sistema Maestro interpreta tu idea o tu web y ordena prioridades.

> Si atiendes clientes por chat, web o WhatsApp, Sistema Maestro construye tu web y pone un agente de IA a atenderlos por ti.

La marca en la cabecera es «Dirección, IA y continuidad».

## Flujo

1. **Home.** Ruta `/`. Vive en `frontend/src/features/home`. Se restauró el 2026-11-23 al revertir el PR #115 (`f917e76a`) y el copy de cierre el 2026-11-28 (`02c2076`, revierte #163 solo en esa carpeta). La carpeta queda congelada: el trabajo posterior no la modifica. «Iniciar sesión» va a `/login` y, tras entrar, a `/dashboard`.
2. **Resumen.** El lanzador (`DashboardBuilderLauncher`) crea el proyecto con `POST /projects`. El backend llama a `analyze_with_ai` y guarda el `diagnosis` en el proyecto.
3. **Builder.** El lanzador abre `/dashboard/builder?project_id=`.
4. **Ejecutor.** Bucle acotado en `backend/app/services/builder_executor.py`. Cada vuelta recorre cinco pasos. Por defecto hay 3 vueltas (`BUILDER_EXECUTOR_MAX_ITERATIONS`; el código no pasa de 3) y un tope de 110 s (`BUILDER_EXECUTOR_TIMEOUT_SECONDS`).

   | Paso | Qué hace |
   | --- | --- |
   | Entendiendo tu negocio | Clasifica la intención (`classify_intent`). |
   | Estructura de secciones | Escribe el blueprint (`generate_blueprint`). La preview usa como máximo 4 prioridades. |
   | Textos | El writer redacta la cabecera y cada sección. |
   | Diseño | Plantilla HTML fija (`render_preview_html`). No hay un generador aparte de componentes de aplicación. |
   | Revisión final | Una rúbrica acotada y, si encaja, el juez. Si no llega, se reintenta dentro del tope de vueltas. |

   El vivo llega por SSE en `POST /api/builder/preview/stream`. Eventos: `state`, `step`, `section`, `done`, `error`. Un paso en silencio también emite comentarios `: heartbeat` cada 10 s. El evento interno `result` no se envía al navegador.

   Cada versión aceptada se guarda en `builder_landing_states`. Se conservan como máximo 8 (`MAX_PREVIEW_VERSIONS`).

   El cobro de gemas pasa por `run_economic_operation` y el libro `credit_ledger` (nombre por defecto de `CREDIT_LEDGER_COLLECTION`). Si `BUILDER_FREE_TEST_MODE` está encendido, un administrador no reserva gemas. El modo está apagado cuando la variable no existe.

`BUILDER_ENABLED` no está en los `.env.example`. Si no está definida, o no vale `true`, `1`, `yes` u `on`, los endpoints del builder responden 503 («El Builder está en construcción. No se ha generado nada y no se han usado créditos.») y no reservan créditos. Un administrador entra igual. En el servicio de producción el nombre sí está; este archivo no copia el valor.

## Estado actual (28/11/2026)

`main` está en `e9fe97f`. La portada no entra en estos cambios.

| Pieza | Dónde | Qué hay en `main` |
| --- | --- | --- |
| Builder | Estudio, [#189](https://github.com/cikitraque13/sistemamaestro/pull/189) | Modo prueba conservado. La barra de herramientas de la preview no está. El botón Publicar queda en la columna del chat, bajo el paso En vivo. |
| Resumen v5 | [#191](https://github.com/cikitraque13/sistemamaestro/pull/191) | Lanzador con «Crear mi web», «Mejorar mi web» e «Instalar agente». App web y Automatización no se muestran. |
| Panel v5 | [#192](https://github.com/cikitraque13/sistemamaestro/pull/192) | Barra lateral: Proyectos (desplegable), Agencia de IA, Agente de voz, Agente de chat. Facturación abajo, sobre la cuenta. |
| Activación al publicar | [#193](https://github.com/cikitraque13/sistemamaestro/pull/193) | Publicar enciende chat y citas de ese proyecto, salvo baja del dueño. Voz y WhatsApp solo si ya hay credenciales. |
| Demo de Nova | `frontend/src/features/home` | Sección `agencia-ia`. El botón dice «Habla con Nova». |
| Tope de coste | [#195](https://github.com/cikitraque13/sistemamaestro/pull/195) | Topes de tokens, cortacircuitos por coste estimado y topes por usuario (día y mes). No mueve el libro de gemas. |

Reservas vive en Agente de chat (lista y horario). El menú no tiene Reservas, Vídeo ni App móvil. Agente de voz no lista reservas. `/dashboard/reservas` sigue en el router como «Próximamente» y no sale en la barra.

Al publicar, la landing gana un enlace sin script, «Habla con nosotros · Reserva cita», hacia `/atencion/{proyecto}`. La página pública solo responde si el proyecto está publicado. Con los flags de módulo apagados, el chat y las citas públicos siguen cerrados.

### Pendiente

| Tema | Marca | Qué falta |
| --- | --- | --- |
| Facturación | pendiente | [#194](https://github.com/cikitraque13/sistemamaestro/pull/194), abierta. En `main` la página sigue con saldo, plan actual, sugerencia, tarjetas e historial. La PR deja solo las tarjetas de plan. |
| Precios de tres planes | pendiente | Propuesta, no cerrada: Prueba gratis, Agencia mensual ~149 €/mes (referencia de borrador) y Red por negocio con precio por volumen. No está en el código. Stripe sigue con Gratis 0 €, Blueprint 29 €, Sistema 79 € y Premium 199 € (`backend/app/domain/plans.py`). |
| Correo de bienvenida | pendiente | No hay envío con Mailjet en el repo. |
| Chat y citas públicos | pendiente | `AGENT_MODULE_CHAT_ENABLED` y `AGENT_MODULE_CITAS_ENABLED` salen en `false` en los ejemplos y no están en las variables de producción. Ausente cuenta como apagado. |
| WhatsApp y teléfono | pendiente | El panel lo dice: WhatsApp no está conectado y las llamadas no se contratan ahí. El recordatorio de 24 h no sale si nadie llama a la ruta y falta `BOOKINGS_REMINDER_SECRET`. |

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
| `AGENT_MODULE_VOZ_ENABLED` | `false` | Voz. Sin número entrante guardado, publicar no lo enciende. |
| `AGENT_MODULE_WHATSAPP_ENABLED` | `false` | WhatsApp. Sin identificador de número guardado, publicar no lo enciende. |
| `AGENT_MODULE_CITAS_ENABLED` | `false` | Citas. |

Un administrador puede usar publicación, dominio, embed y el runtime de módulos con el flag global apagado. El interruptor del proyecto, en los módulos de agente, sigue haciendo falta. Los ejemplos comentan también topes y nombres de credencial (`EMBED_AGENT_DAILY_CAP`, `BOOKINGS_REMINDER_SECRET` y el resto). Esos nombres están vacíos en los ejemplos.

`PUBLISH_BASE_DOMAIN`, `PUBLISH_CNAME_TARGET`, `PUBLISH_APEX_TARGET` y `PUBLISH_APP_HOSTS` salen vacíos en los ejemplos. Sin dominio base no hay URL `https://{slug}.{base}`. El enlace de atención, si el dominio base no vale, usa `sistemamaestro.com`.

Consulta Railway del 2026-11-28, solo nombres. El servicio de producción incluye `BUILDER_ENABLED`, `BUILDER_FREE_TEST_MODE`, `PUBLISH_LANDING_ENABLED`, `PUBLISH_BASE_DOMAIN` y `ADVISOR_FLOW_ENABLED`. No incluye `AGENT_MODULE_CHAT_ENABLED`, `AGENT_MODULE_CITAS_ENABLED`, `AGENT_MODULE_VOZ_ENABLED`, `AGENT_MODULE_WHATSAPP_ENABLED`, `EMBED_AGENT_ENABLED`, `CUSTOM_DOMAIN_ENABLED`, `BOOKINGS_REMINDER_SECRET` ni ningún nombre `AI_*`. Este archivo no copia valores.

## Stack

Un contenedor. El frontend se construye y el backend lo sirve.

| Capa | Qué usa el repo |
| --- | --- |
| Backend | FastAPI (`fastapi==0.110.1`) y Uvicorn. Entrada `backend.app.main:app`. Python 3.11 (`.python-version` y la imagen del `Dockerfile`). |
| Frontend | React 18.2 y Vite 8 (`frontend/package.json`). Node 22.22.2. |
| Datos | MongoDB, con Motor y PyMongo. Base por defecto `sistemamaestro` (`DB_NAME`). |

Los proveedores de texto y de voz se configuran por variables de entorno. Los nombres están en los `.env.example`.

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

El servicio Railway `sistemamaestro` (proyecto `sistemamaestro-project`) construye el repo `cikitraque13/sistemamaestro`, rama `main`, con el `Dockerfile`. `railway.json` fija el builder `DOCKERFILE`, `healthcheckPath` `/health`, timeout 300 s y reinicio `ON_FAILURE`. No hay `nixpacks.toml`. Un push a `main` despliega. El despliegue vigente es `SUCCESS` sobre `e9fe97f` (28 de noviembre de 2026).

El contenedor escucha `${PORT:-8080}`:

```bash
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8080}
```

`GET /health` responde `{"status":"ok"}`.

Dominios del servicio, ambos en el puerto 8080, verificados y con certificado válido (consulta Railway del 2026-11-28):

- `sistemamaestro.com`
- `*.sistemamaestro.com`, para las landings publicadas

El código no llama a la API de Railway ni escribe DNS. El adaptador de dominio propio, con su flag apagado, responde «Pendiente de activación por Sistema Maestro».

## Tests

Backend, desde la raíz, un proceso por archivo. Varios tests fijan el entorno e importan `backend.app.core.config` al cargar el módulo; un solo proceso de pytest arrastra ese estado de un archivo a otro.

```bash
python -m pip install -r requirements.txt
for f in backend/tests/test_*.py; do
  python -m pytest "$f" || exit 1
done
```

Hay 40 archivos `backend/tests/test_*.py`. Los de Atlas se saltan si no hay base.

Frontend, dentro de `frontend/`:

```bash
npx vitest run
npm run test:mjs
npm run build
```

`npm test` es `vitest run`. `npm run build` construye la app y los bundles de embed.
