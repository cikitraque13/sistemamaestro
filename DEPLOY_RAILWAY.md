# Guía de Despliegue en Railway — Sistema Maestro

## Requisitos Previos

Necesitas 3 cuentas (todas tienen plan gratuito):
1. **Railway** → [railway.app](https://railway.app)
2. **MongoDB Atlas** → [cloud.mongodb.com](https://cloud.mongodb.com)
3. **GitHub** → Tu repositorio ya guardado

---

## PASO 1: Crear Base de Datos en MongoDB Atlas (5 min)

1. Ve a [cloud.mongodb.com](https://cloud.mongodb.com) y crea cuenta (o inicia sesión)
2. Haz clic en **"Build a Database"**
3. Elige **M0 FREE** (512MB, suficiente para empezar)
4. Región: **Europe (Ireland)** o la más cercana a ti
5. Nombre del cluster: `sistemamaestro`
6. Haz clic en **"Create"**

### Configurar acceso:
7. En **Database Access** → **Add New Database User**:
   - Username: `sistemamaestro`
   - Password: genera una segura y **cópiala**
   - Role: `Read and write to any database`
8. En **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (0.0.0.0/0)
9. En **Databases** → haz clic en **"Connect"** → **"Drivers"**
10. Copia la connection string. Se ve así:
    ```
    mongodb+srv://sistemamaestro:TU_PASSWORD@sistemamaestro.xxxxx.mongodb.net/?retryWrites=true&w=majority
    ```

---

## PASO 2: Configurar Railway (10 min)

1. Ve a [railway.app](https://railway.app) y crea cuenta con GitHub
2. Haz clic en **"New Project"** → **"Deploy from GitHub Repo"**
3. Selecciona tu repositorio de Sistema Maestro
4. Railway detectará el `Dockerfile` automáticamente

### Añadir Variables de Entorno:
5. Ve a tu servicio → pestaña **"Variables"**
6. Añade estas variables (una por una):

```
MONGO_URL=mongodb+srv://sistemamaestro:TU_PASSWORD@sistemamaestro.xxxxx.mongodb.net/?retryWrites=true&w=majority
DB_NAME=sistemamaestro
JWT_SECRET=genera-una-cadena-aleatoria-larga-de-32-caracteres-minimo
OPENAI_API_KEY=sk-proj-tu-key-de-openai
STRIPE_SECRET_KEY=sk_test_tu-key-de-stripe
ADMIN_EMAIL=tu-email-real@tudominio.com
ADMIN_PASSWORD=UnaContraseñaMuySegura2026!
ALLOWED_ORIGINS=https://sistemamaestro.com,https://www.sistemamaestro.com
```

7. Railway hace redeploy automáticamente al añadir variables

---

## PASO 3: Verificar Despliegue (2 min)

1. Espera a que el build termine (2-3 minutos)
2. Railway te asignará una URL tipo `sistemamaestro-production.up.railway.app`
3. Abre esa URL y verifica:
   - La home carga correctamente
   - Puedes iniciar sesión con tus credenciales admin
   - El análisis de URL funciona

---

## PASO 4: Conectar Dominio sistemamaestro.com (10 min)

### En Railway:
1. Ve a tu servicio → pestaña **"Settings"**
2. Busca **"Custom Domain"**
3. Añade `sistemamaestro.com`
4. Railway te mostrará un **CNAME record** que necesitas configurar

### En Hostinger:
1. Ve a **Panel de Hostinger** → **Dominios** → `sistemamaestro.com`
2. Ve a **DNS / Zona DNS**
3. **Elimina** cualquier registro A existente para `@` (el dominio raíz)
4. Añade un registro **CNAME**:
   - Tipo: `CNAME`
   - Nombre: `@` (o déjalo vacío)
   - Valor: el que Railway te indicó (ej: `sistemamaestro-production.up.railway.app`)
   - TTL: 3600

5. Para www, añade otro CNAME:
   - Tipo: `CNAME`
   - Nombre: `www`
   - Valor: `sistemamaestro.com`

**Nota:** Algunos registradores no permiten CNAME en el dominio raíz (@). Si Hostinger no lo permite, Railway también te da opciones con registros A. Consulta lo que Railway te indique.

6. Espera propagación DNS (5-30 minutos, máximo 24 horas)

### SSL/HTTPS:
- Railway configura certificado SSL automáticamente una vez el dominio esté conectado

---

## PASO 5: Actualizar ALLOWED_ORIGINS (1 min)

Una vez el dominio esté activo, actualiza la variable en Railway:
```
ALLOWED_ORIGINS=https://sistemamaestro.com,https://www.sistemamaestro.com
```

---

## PASO 6: Configurar Google OAuth (Opcional)

Si quieres mantener Google Login:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto o usa uno existente
3. Ve a **APIs & Services** → **Credentials**
4. Crea **OAuth 2.0 Client ID**:
   - Tipo: Web application
   - Authorized JavaScript origins: `https://sistemamaestro.com`
   - Authorized redirect URIs: `https://sistemamaestro.com/auth/callback`
5. Copia el **Client ID** y **Client Secret**

**Nota:** Por ahora, el login con email/password funciona perfectamente. Google OAuth se puede configurar después del lanzamiento.

---

## Estructura de Archivos para Railway

```
tu-repo/
├── Dockerfile              ← Build monolítico
├── railway.json            ← Configuración Railway
├── railway/
│   ├── server_railway.py   ← Backend sin emergentintegrations
│   └── requirements.txt    ← Dependencias limpias
├── frontend/               ← React app (se compila en el build)
│   ├── src/
│   ├── public/
│   └── package.json
└── backend/                ← Backend original (Emergent)
    ├── server.py
    └── requirements.txt
```

---

## Costes Estimados

| Servicio | Plan | Coste |
|----------|------|-------|
| Railway | Hobby | ~$5/mes |
| MongoDB Atlas | M0 Free | $0/mes |
| OpenAI | Pay-per-use | ~$1-5/mes (según uso) |
| Stripe | Comisión | 1.4% + 0.25€ por transacción |
| **Total** | | **~$6-10/mes** |

---

## Comandos Útiles

```bash
# Ver logs en Railway
railway logs

# Ejecutar shell remoto
railway shell

# Variables de entorno
railway variables
```

---

## Diferencias con la versión de Emergent

| Aspecto | Emergent | Railway |
|---------|----------|---------|
| LLM | emergentintegrations (LlmChat) | openai SDK directo |
| Stripe | emergentintegrations (StripeCheckout) | stripe SDK directo |
| Modelo IA | gpt-5.2 | gpt-4o (cambiar a gpt-5.2 si tu API key lo permite) |
| Cookies | secure=False | secure=True |
| Frontend | Servido por dev server separado | Servido por FastAPI como estáticos |
| Google OAuth | Emergent Auth | Google directo (configurar aparte) |

---

## Soporte

Si algo falla:
1. Revisa los **logs** en Railway (pestaña "Deployments" → "View Logs")
2. Verifica que todas las variables de entorno estén correctas
3. Comprueba que MongoDB Atlas permite conexiones desde cualquier IP (0.0.0.0/0)
