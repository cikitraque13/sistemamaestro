# Sistema Maestro

Plataforma guiada de transformación digital que transforma una necesidad, idea o activo existente en una solución digital estructurada, monetizable y lista para ponerse en marcha.

## Promesa Principal

> "Explica tu necesidad. Sistema Maestro te guía hasta una solución real, estructurada y lista para funcionar."

## Rutas V1

1. **Mejorar algo existente** - Analiza URLs/activos digitales y propone mejoras
2. **Vender y cobrar** - Estructura propuestas comerciales con modelo de cobro
3. **Automatizar operación** - Identifica cuellos de botella y propone automatización
4. **Idea a proyecto** - Convierte ideas en proyectos digitales monetizables

## Tecnología

- **Frontend**: React 18 + Tailwind CSS + Framer Motion
- **Backend**: FastAPI (Python)
- **Base de datos**: MongoDB
- **Pagos**: Stripe
- **IA**: OpenAI GPT-5.2 (vía Emergent Integrations)
- **Auth**: JWT + Google OAuth

## Configuración de Variables de Entorno

### Backend (`/backend/.env`)

```env
# Base de datos
MONGO_URL=mongodb://localhost:27017
DB_NAME=sistemamaestro

# Seguridad
JWT_SECRET=tu_jwt_secret_aqui_minimo_32_caracteres
ADMIN_EMAIL=admin@sistemamaestro.com
ADMIN_PASSWORD=tu_password_seguro

# IA - IMPORTANTE: Configura una de estas dos opciones
# Opción 1: OpenAI directamente (recomendado para producción)
OPENAI_API_KEY=sk-xxx

# Opción 2: Emergent LLM Key (solo para desarrollo en Emergent)
EMERGENT_LLM_KEY=sk-emergent-xxx

# Pagos - IMPORTANTE: Configura con tus claves de Stripe
STRIPE_SECRET_KEY=sk_live_xxx
# O para testing:
# STRIPE_API_KEY=sk_test_xxx
```

### Frontend (`/frontend/.env`)

```env
REACT_APP_BACKEND_URL=https://api.sistemamaestro.com
# O para desarrollo local:
# REACT_APP_BACKEND_URL=http://localhost:8001
```

## Instrucciones Post-Deploy

### 1. Configurar OpenAI API Key

1. Ve a [platform.openai.com](https://platform.openai.com/api-keys)
2. Crea una nueva API key
3. Añade la variable de entorno:
   - **En Railway/Render**: Panel → Environment Variables → `OPENAI_API_KEY`
   - **En Vercel**: Project Settings → Environment Variables → `OPENAI_API_KEY`
   - **Manual**: `export OPENAI_API_KEY=sk-xxx`

### 2. Configurar Stripe

1. Ve a [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
2. Copia tu **Secret key** (empieza con `sk_live_` o `sk_test_`)
3. Añade la variable:
   - `STRIPE_SECRET_KEY=sk_live_xxx` (producción)
   - `STRIPE_API_KEY=sk_test_xxx` (testing)

### 3. Configurar MongoDB

Para producción, usa MongoDB Atlas:
1. Crea cluster en [mongodb.com/atlas](https://mongodb.com/atlas)
2. Obtén connection string
3. Configura `MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/sistemamaestro`

### 4. Configurar dominio (sistemamaestro.com)

1. Configura DNS A record apuntando a tu servidor
2. Configura SSL (Let's Encrypt recomendado)
3. Actualiza `REACT_APP_BACKEND_URL` con la URL de producción

## Estructura del Proyecto

```
/app
├── backend/
│   ├── server.py          # API FastAPI principal
│   ├── requirements.txt   # Dependencias Python
│   └── .env               # Variables de entorno
├── frontend/
│   ├── src/
│   │   ├── pages/         # Páginas React
│   │   ├── components/    # Componentes reutilizables
│   │   └── context/       # Context providers (Auth)
│   ├── public/
│   └── .env               # Variables frontend
└── README.md
```

## Endpoints API Principales

### Auth
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Usuario actual
- `POST /api/auth/google/session` - Google OAuth callback

### Proyectos
- `POST /api/projects` - Crear proyecto (analiza texto o URL)
- `GET /api/projects` - Listar proyectos del usuario
- `GET /api/projects/{id}` - Detalle de proyecto
- `POST /api/projects/{id}/refine` - Guardar respuestas de afinado
- `POST /api/projects/{id}/blueprint` - Generar blueprint (requiere plan)
- `DELETE /api/projects/{id}` - Eliminar proyecto

### Pagos
- `POST /api/payments/checkout` - Crear sesión de Stripe
- `GET /api/payments/status/{session_id}` - Estado del pago
- `POST /api/webhook/stripe` - Webhook de Stripe

### Newsletter
- `POST /api/newsletter/subscribe` - Suscribir email

## Planes

| Plan | Precio | Características |
|------|--------|-----------------|
| Gratis | €0 | Diagnóstico inicial, ruta recomendada |
| Blueprint | €29/mes | + Estructura completa, prioridades, arquitectura |
| Sistema | €79/mes | + Continuidad guiada, activación, despliegue |
| Premium | €199/mes | + Soporte prioritario, personalización, oportunidades ilimitadas |

## Desarrollo Local

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8001

# Frontend
cd frontend
yarn install
yarn start
```

## Despliegue

El proyecto está preparado para desplegar en:
- **Railway** (recomendado)
- **Render**
- **Vercel** (frontend) + Railway (backend)
- **VPS** con Docker

## Credenciales de Test

- **Email**: admin@sistemamaestro.com
- **Password**: admin123
- **Plan**: Premium

## Licencia

Todos los derechos reservados © 2026 Sistema Maestro
