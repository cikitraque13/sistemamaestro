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
- **IA**: OpenAI GPT-5.2
- **Auth**: JWT + Google OAuth

---

## ⚠️ CONFIGURACIÓN OBLIGATORIA DE VARIABLES DE ENTORNO

### Paso 1: Variables del Backend

Añade estas variables en tu panel de hosting (Railway, Render, Vercel, etc.) en la sección **Environment Variables**:

```env
# === IA (OBLIGATORIO) ===
OPENAI_API_KEY=sk-xxx
# Obtener en: https://platform.openai.com/api-keys
# Sin esta variable, el análisis de IA NO funcionará

# === PAGOS (OBLIGATORIO) ===
STRIPE_SECRET_KEY=sk_live_xxx
# Obtener en: https://dashboard.stripe.com/apikeys
# Usa sk_test_xxx para pruebas, sk_live_xxx para producción
# Sin esta variable, los pagos NO funcionarán

# === BASE DE DATOS ===
MONGO_URL=mongodb+srv://usuario:password@cluster.mongodb.net/sistemamaestro
# Para producción: usar MongoDB Atlas (https://mongodb.com/atlas)
# Para desarrollo local: mongodb://localhost:27017

DB_NAME=sistemamaestro

# === SEGURIDAD ===
JWT_SECRET=tu_clave_secreta_minimo_32_caracteres_aleatorios
# Genera uno con: openssl rand -hex 32

# === ADMIN (OPCIONAL) ===
ADMIN_EMAIL=admin@sistemamaestro.com
ADMIN_PASSWORD=tu_password_seguro
```

### Paso 2: Variables del Frontend

```env
REACT_APP_BACKEND_URL=https://api.sistemamaestro.com
# O para desarrollo: http://localhost:8001
```

---

## Instrucciones Post-Deploy

### 1. Configurar OpenAI API Key

1. Ve a [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Crea una nueva API key (Project API Key)
3. En tu panel de hosting:
   - Railway: Dashboard → Variables → Add `OPENAI_API_KEY`
   - Render: Dashboard → Environment → Add `OPENAI_API_KEY`
   - Vercel: Project Settings → Environment Variables
4. Pega tu API key como valor
5. **Redeploy** la aplicación

### 2. Configurar Stripe

1. Ve a [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
2. Copia tu **Secret key**:
   - `sk_test_xxx` para modo pruebas
   - `sk_live_xxx` para producción (requiere activar cuenta)
3. Añade `STRIPE_SECRET_KEY` en tu hosting
4. **Redeploy** la aplicación

### 3. Configurar MongoDB (producción)

1. Crea cuenta en [MongoDB Atlas](https://mongodb.com/atlas)
2. Crea un cluster (hay tier gratuito)
3. Configura Network Access (permitir IP o 0.0.0.0/0 para todos)
4. Crea usuario de base de datos
5. Obtén connection string: `mongodb+srv://user:pass@cluster.mongodb.net/sistemamaestro`
6. Añade `MONGO_URL` en tu hosting
7. **Redeploy**

---

## Estructura del Proyecto

```
/app
├── backend/
│   ├── server.py          # API FastAPI principal
│   ├── requirements.txt   # Dependencias Python
│   └── .env               # Variables de entorno (NO commitear en producción)
├── frontend/
│   ├── src/
│   │   ├── pages/         # Páginas (Home, Login, Dashboard, etc.)
│   │   ├── components/    # Componentes (Logo, DashboardLayout)
│   │   └── context/       # AuthContext
│   ├── public/
│   │   ├── logo.png       # Logo oficial
│   │   └── index.html     # HTML con metadatos
│   └── .env               # URL del backend
└── README.md
```

---

## Endpoints API

### Auth
- `POST /api/auth/register` - Registro
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Usuario actual
- `POST /api/auth/google/session` - Google OAuth

### Proyectos
- `POST /api/projects` - Crear (analiza texto o URL)
- `GET /api/projects` - Listar
- `GET /api/projects/{id}` - Detalle
- `POST /api/projects/{id}/blueprint` - Generar blueprint
- `DELETE /api/projects/{id}` - Eliminar

### Pagos
- `POST /api/payments/checkout` - Crear sesión Stripe
- `GET /api/payments/status/{session_id}` - Estado del pago

---

## Planes

| Plan | Precio | Características |
|------|--------|-----------------|
| Gratis | €0 | Diagnóstico inicial, ruta recomendada |
| Blueprint | €29/mes | + Estructura completa, prioridades |
| Sistema | €79/mes | + Continuidad guiada, activación |
| Premium | €199/mes | + Soporte prioritario, oportunidades ilimitadas |

---

## Desarrollo Local

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8001

# Frontend (en otra terminal)
cd frontend
yarn install
yarn start
```

---

## Credenciales de Test

- **Email**: admin@sistemamaestro.com
- **Password**: admin123 (cambiar en producción)
- **Plan**: Premium

---

## Conectar Dominio (sistemamaestro.com)

### DNS Records necesarios

```
Tipo    Nombre    Valor
A       @         [IP de tu servidor]
A       www       [IP de tu servidor]
A       api       [IP de tu servidor]  # Si usas subdominio para API
CNAME   www       sistemamaestro.com   # Alternativa
```

### Pasos específicos por hosting

**Railway:**
1. Settings → Domains → Add Custom Domain
2. Añade `sistemamaestro.com`
3. Railway te dará el registro DNS a configurar
4. Configura en tu registrador de dominios

**Render:**
1. Dashboard → Settings → Custom Domains
2. Añade dominio
3. Sigue instrucciones de DNS

**Vercel:**
1. Project Settings → Domains
2. Add Domain
3. Vercel gestiona SSL automáticamente

---

## Checklist Pre-Producción

- [ ] `OPENAI_API_KEY` configurada
- [ ] `STRIPE_SECRET_KEY` configurada  
- [ ] `MONGO_URL` apuntando a MongoDB Atlas
- [ ] `JWT_SECRET` con valor seguro (32+ caracteres)
- [ ] `ADMIN_PASSWORD` cambiado del default
- [ ] SSL/HTTPS activado
- [ ] Dominio conectado

---

© 2026 Sistema Maestro. Todos los derechos reservados.
