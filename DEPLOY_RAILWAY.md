# DEPLOY_RAILWAY

## Estado de este documento

- Estado: activo
- Tipo: guía operativa de despliegue
- Alcance: despliegue y mantenimiento de `Sistema Maestro` en Railway
- Objetivo: reflejar la vía real de despliegue actual sin arrastres heredados, rutas falsas ni variables críticas omitidas.

---

## 1. Verdad actual de despliegue

La vía canónica actual de despliegue en Railway es esta:

1. `railway.json`
2. `Dockerfile`
3. `backend.app.main:app`

La referencia real de runtime es:

```bash
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8080}
```

Railway no debe interpretarse ya como un despliegue basado en:

- `railway/server_railway.py`
- `backend/server.py`
- un dev server separado de frontend
- una orden manual paralela al `Dockerfile`

Una sola verdad. Dos verdades de deploy = una forma elegante de romper producción.

---

## 2. Archivos canónicos de despliegue

### `railway.json`

`railway.json` debe declarar explícitamente:

- builder Dockerfile;
- ruta del Dockerfile;
- comando de arranque;
- healthcheck;
- política de reinicio.

Configuración esperada:

```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "python -m uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8080}",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### `Dockerfile`

El `Dockerfile` actual debe:

- usar Node 22 para compilar frontend;
- ejecutar `npm ci`, no `npm install`;
- no hardcodear `REACT_APP_BACKEND_URL`;
- compilar `frontend/build`;
- usar Python 3.11 para runtime;
- instalar dependencias desde `backend/requirements.txt`;
- copiar `backend/`;
- copiar el build del frontend a `/app/frontend/build`;
- arrancar con `python -m uvicorn backend.app.main:app`.

Dockerfile esperado:

```dockerfile
# Frontend build
FROM node:22-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build


# Backend runtime
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONPATH=/app
ENV PORT=8080

COPY backend/requirements.txt /app/backend/requirements.txt

RUN python -m pip install --upgrade pip \
    && pip install --no-cache-dir -r /app/backend/requirements.txt

COPY backend/ /app/backend/
COPY --from=frontend-build /app/frontend/build /app/frontend/build

EXPOSE 8080

CMD ["sh", "-c", "python -m uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
```

### Backend real de runtime

La entrada real del backend es:

```text
backend/app/main.py
```

La referencia canónica de runtime es:

```text
backend.app.main:app
```

---

## 3. Qué sirve el backend en producción

`backend/app/main.py` debe cubrir:

- `/health`;
- routers `/api/...`;
- `/static`;
- `/`;
- fallback SPA para rutas frontend.

La ruta de salud esperada es:

```text
/health
```

Debe responder algo equivalente a:

```json
{"status": "ok"}
```

El frontend se sirve como build estático desde FastAPI:

```text
/app/frontend/build
```

No hay dev server de React en Railway. Si alguien intenta desplegar con `npm start` como runtime principal, está lanzando el cohete desde el aparcamiento.

---

## 4. Legacy de deploy retirado

Las siguientes piezas no son vía activa de runtime/deploy:

- `backend/server.py`
- `railway/server_railway.py`
- `railway/requirements.txt`

Reglas:

- no reintroducirlas;
- no documentarlas como entrada activa;
- no crear una segunda vía de arranque;
- no mezclar comandos heredados con el Dockerfile actual.

---

## 5. Requirements: producción vs entorno local

Hay dos archivos de dependencias Python:

```text
backend/requirements.txt
requirements.txt
```

### `backend/requirements.txt`

Es la fuente usada por Docker/Railway.

Uso:

```dockerfile
COPY backend/requirements.txt /app/backend/requirements.txt
RUN python -m pip install --upgrade pip \
    && pip install --no-cache-dir -r /app/backend/requirements.txt
```

Este archivo debe contener dependencias fijadas/pineadas para producción.

### `requirements.txt` en raíz

Es una lista mínima útil para entorno local, pruebas o desarrollo.

Puede incluir:

```text
pytest
```

No debe asumirse como fuente canónica del contenedor Railway mientras el Dockerfile use `backend/requirements.txt`.

---

## 6. Variables de entorno mínimas en Railway

En Railway deben existir, como mínimo:

```env
MONGO_URL=mongodb+srv://usuario:password@cluster.mongodb.net/?retryWrites=true&w=majority
DB_NAME=sistemamaestro

JWT_SECRET=una_cadena_larga_segura_de_minimo_32_caracteres

OPENAI_API_KEY=sk-xxx

STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com

ALLOWED_ORIGINS=https://sistemamaestro.com,https://www.sistemamaestro.com
COOKIE_SECURE=true
```

### Variables administradas por Railway

Railway gestiona:

```env
PORT
```

El contenedor usa:

```bash
${PORT:-8080}
```

### Variables opcionales o futuras

Si existen flujos administrativos internos, se pueden usar:

```env
ADMIN_EMAIL=tu-email-real@dominio.com
ADMIN_PASSWORD=una_password_segura
```

Solo deben configurarse si el código realmente las utiliza. Variable muerta = confusión con forma de configuración.

---

## 7. Reglas de seguridad de entorno

### `JWT_SECRET`

Debe ser largo y estable.

No debe regenerarse en cada deploy.

Si cambia, los tokens existentes dejan de servir. Eso puede ser deseado en una rotación, pero no como accidente.

### `STRIPE_WEBHOOK_SECRET`

Es obligatorio para procesar webhooks Stripe.

No es lo mismo que:

```env
STRIPE_SECRET_KEY
```

- `STRIPE_SECRET_KEY`: permite crear/consultar sesiones Stripe.
- `STRIPE_WEBHOOK_SECRET`: verifica que el webhook recibido realmente viene de Stripe.

Sin `STRIPE_WEBHOOK_SECRET`, el webhook debe fallar. Eso es correcto. Aceptar webhooks sin firma es fan fiction financiera.

### `COOKIE_SECURE`

En producción debe ser:

```env
COOKIE_SECURE=true
```

En local puede ser:

```env
COOKIE_SECURE=false
```

Producción debe usar HTTPS. Cookies sensibles sin `secure=true` en producción es pedirle al universo que te enseñe criptografía a golpes.

### `ALLOWED_ORIGINS`

Debe reflejar los dominios reales activos.

Ejemplo:

```env
ALLOWED_ORIGINS=https://sistemamaestro.com,https://www.sistemamaestro.com
```

No usar `*` en producción.

---

## 8. Frontend y API base

El frontend usa un cliente centralizado:

```text
frontend/src/lib/apiClient.js
```

La regla actual:

- si existe `REACT_APP_API_BASE_URL`, se usa;
- si existe `REACT_APP_BACKEND_URL`, se usa;
- si no, se usa `window.location.origin`.

En Railway, como frontend y backend viven en el mismo contenedor/origen, normalmente no hace falta hardcodear:

```env
REACT_APP_BACKEND_URL=https://sistemamaestro.com
```

El Dockerfile no debe quemar un dominio fijo dentro del build.

Hardcodear dominio en build rompe previews, dominios alternativos y despliegues temporales. Es meter coordenadas absolutas en un sistema que puede moverse.

---

## 9. Flujo real de build

### Etapa frontend

El Dockerfile hace:

```text
FROM node:22-alpine
COPY frontend/package*.json
npm ci
COPY frontend/
npm run build
```

Resultado:

```text
/app/frontend/build
```

### Etapa backend

El Dockerfile hace:

```text
FROM python:3.11-slim
COPY backend/requirements.txt
pip install -r backend/requirements.txt
COPY backend/
COPY frontend build
CMD python -m uvicorn backend.app.main:app
```

Resultado:

- un solo contenedor;
- FastAPI sirve API + frontend;
- Railway no arranca React dev server;
- `/health` valida el despliegue.

---

## 10. Validación local antes de deploy

Antes de hacer deploy o merge:

```powershell
python -m pytest backend\tests
```

Debe pasar:

```text
4 passed
```

Luego:

```powershell
cd backend
python -m compileall app
cd ..
```

Debe compilar sin errores.

Luego:

```powershell
cd frontend
npm.cmd run build
cd ..
```

Debe terminar con:

```text
Compiled successfully.
```

Finalmente:

```powershell
git status
```

Debe decir:

```text
nothing to commit, working tree clean
```

Deploy con árbol sucio = despegar con la caja de herramientas dentro del motor.

---

## 11. Ruta de despliegue en Railway

### Paso 1 — Repositorio conectado

Railway debe estar conectado al repo correcto y detectar:

- `railway.json`
- `Dockerfile`

### Paso 2 — Builder correcto

Railway debe usar:

```text
DOCKERFILE
```

con:

```text
Dockerfile
```

No debe existir una orden paralela que arranque:

- `server.py`
- `server_railway.py`
- `npm start`
- frontend dev server

### Paso 3 — Variables cargadas

Cargar las variables mínimas del bloque de entorno:

- `MONGO_URL`
- `DB_NAME`
- `JWT_SECRET`
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `GOOGLE_CLIENT_ID`
- `ALLOWED_ORIGINS`
- `COOKIE_SECURE`

### Paso 4 — Build

Railway construye imagen Docker.

Debe verse, conceptualmente:

```text
frontend npm ci
frontend npm run build
backend pip install
uvicorn backend.app.main:app
```

### Paso 5 — Healthcheck

Railway debe validar:

```text
/health
```

Respuesta esperada:

```json
{"status": "ok"}
```

---

## 12. Qué comprobar después del deploy

### Backend

Comprobar:

- `/health` responde 200;
- el proceso arranca sin error de imports;
- Mongo conecta;
- `backend.app.main:app` es el runtime;
- no faltan variables críticas;
- Stripe no procesa webhooks sin firma;
- refresh token sigue validando firma;
- `/api/builder/build` exige auth.

### Frontend

Comprobar:

- home carga;
- `index.html` se sirve correctamente;
- rutas SPA no rompen al refrescar;
- estáticos cargan desde `/static`;
- login carga;
- registro carga;
- Google Sign-In puede pedir `/api/public/config`.

### Integración

Comprobar:

- login normal;
- registro normal;
- Google login si está configurado;
- crear proyecto;
- generar análisis;
- Builder AI;
- consumo de créditos;
- billing;
- Stripe checkout;
- Stripe webhook firmado.

---

## 13. Estado del dominio

Hay dos estados válidos.

### Caso A — Dominio conectado

Validar:

- dominio principal resuelve;
- certificado SSL responde;
- `/health` responde por HTTPS;
- home carga;
- rutas internas cargan;
- `ALLOWED_ORIGINS` coincide con dominio real;
- cookies funcionan con `COOKIE_SECURE=true`.

### Caso B — Dominio no conectado o no validado

Pasos:

- conectar dominio personalizado en Railway;
- configurar DNS;
- esperar propagación;
- actualizar `ALLOWED_ORIGINS`;
- validar `/health`;
- validar home;
- validar login;
- validar rutas.

No asumir dominio operativo hasta probarlo. DNS no cree en la fe.

---

## 14. Errores típicos a evitar

### Error 1 — Reintroducir deploy legacy

No usar:

```text
railway/server_railway.py
backend/server.py
```

### Error 2 — Ejecutar frontend dev server en producción

No usar:

```bash
npm start
```

Railway debe servir el build estático vía FastAPI.

### Error 3 — Olvidar `STRIPE_WEBHOOK_SECRET`

Después del hardening, el webhook exige firma.

Sin `STRIPE_WEBHOOK_SECRET`, el webhook debe rechazar. Correcto.

### Error 4 — Usar `COOKIE_SECURE=false` en producción

En Railway con HTTPS:

```env
COOKIE_SECURE=true
```

### Error 5 — Hardcodear `REACT_APP_BACKEND_URL` en Dockerfile

No quemar dominio fijo dentro del build.

El frontend debe funcionar en mismo origen usando `window.location.origin`, salvo necesidad explícita.

### Error 6 — Confundir requirements

Railway usa:

```text
backend/requirements.txt
```

No asumir que usa:

```text
requirements.txt
```

mientras el Dockerfile no lo indique.

### Error 7 — Deploy sin build local

Antes de deploy:

```powershell
python -m pytest backend\tests
cd backend
python -m compileall app
cd ..
cd frontend
npm.cmd run build
cd ..
```

Si no pasa local, no lo mandes a producción esperando que Railway tenga magia. Railway no es Hogwarts con logs.

---

## 15. Checklist operativo predeploy

```text
[ ] git status limpio
[ ] python -m pytest backend\tests pasa
[ ] python -m compileall app pasa en backend
[ ] npm.cmd run build pasa en frontend
[ ] railway.json apunta a Dockerfile
[ ] Dockerfile usa npm ci
[ ] Dockerfile no hardcodea REACT_APP_BACKEND_URL
[ ] Dockerfile usa backend/requirements.txt
[ ] Dockerfile arranca python -m uvicorn backend.app.main:app
[ ] /health existe
[ ] FRONTEND_BUILD_DIR apunta a frontend/build
[ ] ALLOWED_ORIGINS configurado
[ ] COOKIE_SECURE=true en producción
[ ] JWT_SECRET configurado
[ ] STRIPE_SECRET_KEY configurado
[ ] STRIPE_WEBHOOK_SECRET configurado
[ ] GOOGLE_CLIENT_ID configurado si Google Sign-In está activo
[ ] OPENAI_API_KEY configurado
[ ] MONGO_URL configurado
```

---

## 16. Veredicto operativo

La verdad actual del despliegue queda fijada así:

- `railway.json` configura Railway;
- `Dockerfile` construye frontend y backend;
- `backend/requirements.txt` alimenta el runtime Python;
- `frontend/package-lock.json` alimenta `npm ci`;
- `backend/app/main.py` es la entrada real;
- `backend.app.main:app` es el runtime canónico;
- `/health` es el healthcheck;
- FastAPI sirve API + frontend estático;
- el deploy legacy queda fuera;
- los webhooks Stripe requieren firma;
- las cookies seguras se activan con `COOKIE_SECURE=true`.

---

## 17. Conclusión operativa

A partir de este documento:

- Railway queda alineado con la arquitectura real actual;
- se elimina la confusión entre deploy heredado y deploy canónico;
- se documentan variables críticas añadidas por el hardening;
- se evita hardcodear dominios en el build frontend;
- se fija `backend/requirements.txt` como fuente de producción;
- se establece una checklist mínima antes de desplegar;
- y cualquier ajuste futuro de deploy debe partir de:

```text
Dockerfile
railway.json
backend.app.main:app
/health
```

Menos narrativa. Más realidad ejecutable.