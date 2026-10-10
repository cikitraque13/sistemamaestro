# Sistema Maestro

## Estado actual de Journey 03 — 2026-10-11

S14, S15 y S16 están COMPLETED; S17 está CLOSED_BY_HUMAN_ACCEPTANCE y S18 está OPEN, con estado técnico NOT_DEMONSTRATED y ejecución ON_HOLD. La aceptación S17 cubre el recorrido visual revisado, no certifica el harness E2E ni sus cuatro garantías pendientes. El [roadmap](docs/product/sistema-maestro/08-MASTER-MATURITY-ROADMAP.md) es la fuente de verdad de madurez y el [índice maestro](docs/control/00-INDICE-MAESTRO.md) distribuye la autoridad documental.

La identidad de GitHub main, la observación de Railway y sus diferencias están en [Runtime and Deploy Truth](docs/architecture/04-runtime-and-deploy-truth.md). El documento [Journey 03 PRE-S14](docs/product/sistema-maestro/07-JOURNEY-03-ESTADO-PRE-S14.md) conserva el registro histórico de esa etapa; no es el estado vigente de S14–S18.

Sistema Maestro es una plataforma guiada de transformación digital diseñada para convertir una necesidad, una idea o un activo existente en una solución digital estructurada, monetizable y operable.

El sistema no se limita a dar una respuesta superficial. Analiza, ordena, propone una ruta y prepara continuidad para que el proyecto pueda avanzar con más claridad, menos fricción y mejor base de crecimiento.

---

## Qué representa este repositorio

Este repositorio contiene la base operativa real de Sistema Maestro.

Su función actual no es servir como escaparate estático, sino como sistema en evolución con:

- capa pública de entrada y captación;
- flujo de activación;
- autenticación;
- dashboard;
- builder;
- oportunidades;
- billing;
- backend modular;
- motor de consumo y créditos;
- y una capa de IA en consolidación estructural.

Este `README.md` no sustituye la documentación canónica de `docs/control/`, pero sí debe reflejar el estado real del sistema sin arrastres antiguos ni referencias obsoletas.

---

## Qué hace Sistema Maestro

Sistema Maestro está pensado para ayudar a usuarios, operadores, agencias y equipos a:

1. **Mejorar algo existente**  
   Analiza una URL o activo digital y propone una ruta de mejora estructurada.

2. **Vender y cobrar**  
   Ayuda a ordenar una propuesta, una lógica de valor y una estructura de cobro.

3. **Automatizar operación**  
   Detecta fricción operativa y ayuda a plantear una secuencia más escalable.

4. **Convertir una idea en proyecto**  
   Transforma una idea en una estructura digital con continuidad real.

---

## Estado real del producto

La lectura correcta del sistema hoy es esta:

- el proyecto ya no es una simple landing;
- el frontend ya está modularizado por features;
- el backend ya está modularizado en `backend/app/`;
- el builder ya existe como pieza real del producto;
- el sistema ya contiene auth, dashboard, billing, opportunities, projects y flow;
- existe una capa de créditos y consumo con contratos, catálogos y reglas;
- existe una capa de IA y orquestación en consolidación;

---

## Arquitectura general del sistema

### Raíz real del proyecto

Las rutas base reales del sistema son:

- `frontend/`
- `backend/`
- `docs/`

La memoria canónica de gobierno técnico vive en:

- `docs/control/`

### Referencias de legado

El inventario siguiente conserva referencias históricas a piezas identificadas como legacy/no canónicas; no acredita su ausencia del repositorio ni su exclusión del runtime actual:

- `backend/server.py`
- `railway/server_railway.py`
- `railway/requirements.txt`
- `memory/`
- `test_reports/`

El registro histórico describe decisiones de retirada y, cuando aplicó, movimientos a un área externa de safety; ese registro no acredita el estado físico actual de cada ruta.

### Ruta auxiliar vigente

La ruta auxiliar que sigue viva como soporte interno es:

- `tests/`

---

## Frontend

### Fuente real

La fuente real del frontend vive en:

- `frontend/src/`
- `frontend/public/`

La capa principal del producto frontend vive en:

- `frontend/src/features/`

La carpeta `frontend/src/pages/` queda como capa residual temporal y no debe tratarse como la vía principal de crecimiento del producto.

### Features reconocidas

Actualmente el frontend contiene, al menos, estas features reales:

- `app-shell`
- `auth`
- `billing`
- `builder`
- `dashboard`
- `flow`
- `home`
- `opportunities`
- `projects`
- `reports`
- `settings`

### Estado del root de frontend

La fuente canónica del producto visible sigue viviendo dentro de `src/` y `public/`.

Los archivos técnicos de raíz de `frontend/` como `package.json`, `package-lock.json`, configs del toolchain y documentación local deben tratarse como soporte de capa, no como producto enrutable.

---

## Home actual

La Home ya no es una portada simple. Está planteada como capa de entrada, activación y demostración del sistema.

### Lectura funcional de Home

La Home actual ya refleja una dirección clara:

- entrada basada en intención del usuario;
- lógica de tipos de proyecto;
- previews de flujo, outputs y estructura;
- bloque visible del constructor;
- pricing;
- captación;
- continuidad comercial;
- y CTA final.

Además, la Home ya incorpora componentes ligados al constructor, lo que confirma continuidad con Builder y App Shell.

---

## Builder

El Builder ya no debe tratarse como idea futura difusa. Existe como módulo real y debe leerse como pieza central del producto.

### Estructura del Builder

La feature `frontend/src/features/builder/` contiene estructura real de:

- componentes;
- datos;
- panels;
- tabs;
- utils;
- workspace.

### Lectura correcta del Builder

Builder no debe tratarse como demo cosmética.

La evidencia actual lo sitúa como:

- entorno de trabajo real;
- pieza central del sistema;
- capa donde confluyen estructura, preview, deploy, créditos y continuidad del proyecto.

---

## App Shell

La feature `app-shell` ya actúa como carcasa operativa del producto.

### Función

Sirve como base para:

- navegación;
- proyectos;
- créditos;
- tabs;
- y módulos internos.

---

## Dashboard y auth

El sistema ya contiene operación interna real más allá de la Home y del acceso.

### Capas reales

- `frontend/src/features/dashboard/`
- `frontend/src/features/auth/`

### Lectura correcta

No deben tratarse como promesa futura, sino como partes ya integradas del sistema vivo.

---

## Backend

### Estructura real

La capa modular real del backend vive en:

- `backend/app/`

Dentro de ella existen estas subcapas:

- `ai`
- `core`
- `db`
- `domain`
- `routers`
- `schemas`
- `services`

### Entrada canónica del backend

La referencia canónica de runtime del backend es:

```bash
uvicorn backend.app.main:app --reload --port 8001
```

La app canónica de runtime queda fijada como:

- `backend.app.main:app`

### Referencia histórica: backend/server.py

La pieza plana heredada:

- `backend/server.py`

El historial documental registra su retirada a safety. Ese registro histórico no acredita su ausencia del repositorio actual ni su exclusión del runtime live.

### Routers backend detectados

La capa de routers contiene, al menos:

- `auth`
- `billing`
- `consumption`
- `opportunities`
- `payments`
- `projects`
- `public`

### Lectura correcta

El backend ya no debe tratarse como archivo único o API improvisada. La arquitectura real es modular.

---

## Capa de IA

Existe una capa real de IA y orquestación en:

- `backend/app/ai/`

### Lectura correcta

La arquitectura de IA ya está plantada y forma parte del backend real, aunque no toda su lógica esté viva al mismo nivel funcional.

---

## Créditos y consumo

Existe una capa real de créditos en:

- `backend/config/credits/`

### Qué confirma esto

La economía del sistema ya no es solo una idea comercial. Existe una base técnica para:

- acciones con consumo;
- tiers;
- reglas de umbral;
- contratos;
- y relación con billing y ejecución.

---

## Stack técnico actual

### Frontend

- React 18
- Tailwind CSS
- Framer Motion
- React Router
- Vite
- Radix UI
- Recharts
- Sonner
- Axios

### Backend

- FastAPI
- Uvicorn
- Motor / MongoDB
- Stripe
- OpenAI
- JWT
- bcrypt
- httpx

Desde la raíz del repositorio, el frontend usa scripts activos con:

```bash
cd frontend
npm ci
npm start
npm run build
```

---

## Desarrollo local

### Backend

```bash
cd backend
python -m pip install -r requirements.txt
uvicorn backend.app.main:app --reload --port 8001
```

### Frontend

```bash
cd frontend
npm ci
npm start
```

---

## Runtime y despliegue

### Runtime de aplicación declarado en archivos versionados

- servidor canónico: `backend/app/main.py`
- app canónica: `backend.app.main:app`

### Archivos de deploy versionados en el repositorio

- `Dockerfile`
- `railway.json`

### Endpoint `/health` de la aplicación

- `/health`

Estos datos describen el runtime y los archivos versionados del repositorio, no el runtime ni la configuración efectiva verificada de Railway. Los metadatos live reportan `RAILPACK`, con procedencia `UNVERIFIED`; `/health` respondió HTTP 200, pero el healthcheck efectivo de Railway no está verificado. Véase [Runtime and Deploy Truth](docs/architecture/04-runtime-and-deploy-truth.md).

### Regla

- mantener una sola verdad de arranque;
- no reactivar legacy runtime;
- no ampliar legado;
- consultar [Runtime and Deploy Truth](docs/architecture/04-runtime-and-deploy-truth.md) para la relación vigente entre estado local y producción.

---

## Variables de entorno mínimas

La configuración exacta puede evolucionar, pero a nivel mínimo el backend requiere una base como esta:

```env
OPENAI_API_KEY=sk-xxx
STRIPE_SECRET_KEY=sk_xxx
MONGO_URL=mongodb+srv://usuario:password@cluster.mongodb.net/sistemamaestro
DB_NAME=sistemamaestro
JWT_SECRET=clave_segura_larga
ALLOWED_ORIGINS=http://localhost:3000,https://tu-dominio.com
```

Y el frontend:

```env
VITE_BACKEND_URL=http://localhost:8001
VITE_GOOGLE_CLIENT_ID=
```

No deben subirse secretos reales al repositorio.

---

## Estado de Journey 03

Consultar el [Master Maturity Roadmap](docs/product/sistema-maestro/08-MASTER-MATURITY-ROADMAP.md) para el estado vigente de S14–S18. El documento [Journey 03 PRE-S14](docs/product/sistema-maestro/07-JOURNEY-03-ESTADO-PRE-S14.md) es histórico.

---

## Qué no debe interpretarse mal

- las rutas descritas como legacy no se consideran canónicas; su ausencia del repositorio y su exclusión del runtime actual no están verificadas;
- `node_modules`, builds y cachés no forman parte del producto real;
- `tests/` es soporte técnico, no núcleo canónico;
- la Home actual ya no es una landing plana;
- el Builder ya no es una demo cosmética;
- la capa de IA y créditos ya existe a nivel estructural, aunque no toda esté cerrada al mismo nivel funcional.

---

## Checklist técnico mínimo

- [ ] backend arrancando con `backend.app.main:app`
- [ ] sin referencias activas de runtime legacy en el repo activo
- [ ] frontend trabajando desde `frontend/src/features/`
- [ ] builder tratado como núcleo del producto
- [ ] app-shell operativo como carcasa interna
- [ ] créditos y consumo alineados con backend y billing
- [ ] auth, dashboard y projects conectados con continuidad real
- [ ] sin secretos reales en repositorio
- [ ] sin confundir entorno regenerable con producto
- [ ] documentación canónica mantenida en `docs/control/`

---

## Criterio de trabajo del sistema

Sistema Maestro no debe seguir creciendo por acumulación de parches, rutas heredadas y referencias contradictorias.

La secuencia correcta sigue siendo:

1. control estructural;
2. clasificación;
3. canonicidad;
4. higiene técnica;
5. reanudación del producto.

Este repositorio debe evolucionar con esa lógica.
