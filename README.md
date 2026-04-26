# Sistema Maestro

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
- y el proyecto sigue en saneo estructural controlado.

---

## Arquitectura general del sistema

### Raíz real del proyecto

Las rutas base reales del sistema son:

- `frontend/`
- `backend/`
- `docs/`

La memoria canónica de gobierno técnico vive en:

- `docs/control/`

### Estado del legado retirado

Las siguientes piezas ya no forman parte del repo activo:

- `backend/server.py`
- `railway/server_railway.py`
- `railway/requirements.txt`
- `memory/`
- `test_reports/`

Su retirada se hizo de forma controlada durante el saneo y, cuando aplicó, quedaron movidas a un área externa de safety.

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

- `activation-flow`
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

### Legacy retirado del repo activo

La pieza plana heredada:

- `backend/server.py`

ya no forma parte del repo activo. Fue retirada a safety para cierre controlado del legado.

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
- CRACO
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

El frontend usa scripts activos con:

```bash
npm install
npm start
npm run build
```

---

## Desarrollo local

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn backend.app.main:app --reload --port 8001
```

### Frontend

```bash
cd frontend
npm install
npm start
```

---

## Runtime y despliegue

### Runtime canónico actual

- servidor canónico: `backend/app/main.py`
- app canónica: `backend.app.main:app`

### Deploy canónico actual

- `Dockerfile`
- `railway.json`

### Healthcheck canónico

- `/health`

### Regla

- mantener una sola verdad de arranque;
- no reactivar legacy runtime;
- no ampliar legado;
- no abrir despliegue final mientras siga el saneo estructural.

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
REACT_APP_BACKEND_URL=http://localhost:8001
```

No deben subirse secretos reales al repositorio.

---

## Estado del saneo

Este proyecto está en fase de saneo estructural controlado.

### Objetivos del saneo

1. separar fuente real de entorno regenerable;
2. reducir ruido técnico y arrastres heredados;
3. cerrar referencias canónicas de runtime;
4. limpiar legado ya retirado;
5. preparar una base seria para evolución y despliegue futuro.

### Regla crítica

No borrar, mover o reclasificar rutas a ciegas.

---

## Qué no debe interpretarse mal

- el runtime legacy ya no está en el repo activo;
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