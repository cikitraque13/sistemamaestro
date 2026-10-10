# DEPLOY_RAILWAY

## Estado de este documento

- Estado: activo
- Tipo: guía operativa de despliegue
- Alcance: despliegue y mantenimiento de `Sistema Maestro` en Railway
- Objetivo: referencia de verificación previa a despliegues; no acredita por sí sola la configuración efectiva de Railway.

> **Estado operativo observado — 2026-10-10:** GitHub main y el SHA del deployment observado son `ead9f4e796f9e2be89a8d0b7948364edbf67066b`; el deployment terminó SUCCESS y `/health` respondió HTTP 200. Los metadatos live reportan builder `RAILPACK` y target port `8080`; no muestran `startCommand` ni healthcheck. El `railway.json` versionado declara `DOCKERFILE`, `Dockerfile` y healthcheck `/health`. La procedencia efectiva del build permanece UNVERIFIED. Esta discrepancia debe verificarse antes de cualquier despliegue futuro. Este documento no prescribe cambiar builder, start command ni configuración live.

---

## 1. Declaración versionada y observación live

El repositorio contiene estas declaraciones:

1. `railway.json`
2. `Dockerfile`
3. `backend.app.main:app`

El Dockerfile versionado define este comando de arranque:

```bash
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8080}
```

El repositorio identifica estas rutas como código legacy o no canónico para su configuración declarada:

- `railway/server_railway.py`
- `backend/server.py`
- un dev server separado de frontend
- una orden manual paralela al `Dockerfile`

La observación live disponible no permite confirmar si el deployment usa alguna de esas rutas ni qué proceso sirve el frontend. La declaración versionada no demuestra qué builder, dependencias o comando produjo el deployment observado. La procedencia efectiva del build permanece UNVERIFIED; debe verificarse con la configuración live y evidencia del artefacto desplegado antes de atribuirle un flujo concreto.

---

## 2. Archivos de configuración versionados

### `railway.json`

El `railway.json` versionado declara actualmente:

- builder `DOCKERFILE`;
- ruta `Dockerfile`;
- healthcheck `/health` y timeout 300;
- política de reinicio `ON_FAILURE` con máximo 10 reintentos.

No declara `deploy.startCommand`. Esta configuración de repositorio difiere del builder live observado (`RAILPACK`); no se conoce la procedencia efectiva de build.

### `Dockerfile`

El `Dockerfile` versionado declara:

- usar Node 22 para compilar frontend;
- ejecutar `npm ci`, no `npm install`;
- no hardcodear `VITE_BACKEND_URL`;
- compilar `frontend/dist` con Vite (`npm run build`);
- usar Python 3.11 para runtime;
- instalar dependencias desde `backend/requirements.txt`;
- copiar `backend/`;
- copiar el build del frontend a `/app/frontend/dist`;
- arrancar con `python -m uvicorn backend.app.main:app`.

Extracto de la configuración declarada por el Dockerfile versionado (no acredita el artefacto live):

```dockerfile
# Frontend build
FROM node:22.22.2-alpine AS frontend-build

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

RUN python -m pip install --no-cache-dir -r /app/backend/requirements.txt

COPY backend/ /app/backend/
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

EXPOSE 8080

CMD ["sh", "-c", "python -m uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
```

### Entrada backend declarada por el repositorio

La entrada declarada por el código versionado es:

```text
backend/app/main.py
```

La referencia canónica de runtime es:

```text
backend.app.main:app
```

---

## 3. Qué declara el código sobre el servicio backend

`backend/app/main.py` contiene las rutas y montaje de aplicación declarados en el repositorio, incluidos:

- `/health`;
- routers `/api/...`;
- `/static`;
- `/`;
- fallback SPA para rutas frontend.

El código versionado define la ruta `/health`. En la observación del 2026-10-10, una solicitud GET a `/health` respondió HTTP 200. Esto acredita disponibilidad de esa ruta en esa observación, pero no demuestra que Railway la tenga configurada como healthcheck ni establece qué proceso atendió la petición.

El Dockerfile versionado declara copiar `frontend/dist` a `/app/frontend/dist`; el código declara servir el frontend estático desde esa ubicación. La evidencia live disponible no permite concluir cómo se construyó ni cómo se sirvió el frontend en el deployment observado. No se ha verificado si se ejecuta un dev server de React ni un `startCommand` live.

---

## 4. Código legacy identificado en el repositorio

El historial documental y la configuración versionada identifican estas piezas como legacy/no canónicas:

- `backend/server.py`
- `railway/server_railway.py`
- `railway/requirements.txt`

La observación live disponible no demuestra si alguna interviene en el deployment actual. No se presentan como entradas efectivas ni se atribuye al deployment una ruta distinta sin evidencia.

Al mantener la configuración declarada del repositorio:

- no reintroducirlas como entradas versionadas;
- no crear una segunda vía de arranque;
- no mezclar comandos heredados con el Dockerfile versionado.

---

## 5. Requirements: producción vs entorno local

Hay dos archivos de dependencias Python:

```text
backend/requirements.txt
requirements.txt
```

### `backend/requirements.txt`

El Dockerfile versionado declara copiar este archivo e instalar sus dependencias en el build Docker. Como el builder live observado es `RAILPACK` y la procedencia efectiva está UNVERIFIED, no está acreditado que el deployment observado haya consumido este archivo.

Uso:

```dockerfile
COPY backend/requirements.txt /app/backend/requirements.txt
RUN python -m pip install --no-cache-dir -r /app/backend/requirements.txt
```

Este archivo debe contener dependencias fijadas/pineadas para producción.

### `requirements.txt` en raíz

Es una extensión local de desarrollo/pruebas del backend canónico: incluye `backend/requirements.txt` y conserva `pytest`, que ya figuraba en este archivo. No duplica ni reemplaza las versiones de dependencias de la aplicación.

Para instalar el perfil local de desarrollo/pruebas desde la raíz:

```bash
python -m pip install -r requirements.txt
```

El Dockerfile versionado declara instalar directamente `backend/requirements.txt`. El README documenta la instalación local del mismo archivo desde `backend/`; esto identifica las declaraciones del repositorio, no acredita qué dependencias consumió el deployment live. `pytest` sigue sin versión fijada, por lo que la herramienta de pruebas queda fuera de esta alineación de instalación de aplicación.

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

- si existe `VITE_API_BASE_URL`, se usa;
- si existe `VITE_BACKEND_URL`, se usa como alternativa;
- si no, se usa `window.location.origin`.

El Dockerfile versionado declara una imagen que contiene frontend y backend. No se ha verificado que esa configuración produjera el deployment live observado. Si ambos se sirven desde el mismo origen, normalmente no hace falta hardcodear:

```env
VITE_BACKEND_URL=https://sistemamaestro.com
```

El Dockerfile no debe quemar un dominio fijo dentro del build.

Hardcodear dominio en build rompe previews, dominios alternativos y despliegues temporales. Es meter coordenadas absolutas en un sistema que puede moverse.

---

## 9. Flujo de build declarado en el repositorio

### Etapa frontend

El Dockerfile versionado declara:

```text
FROM node:22.22.2-alpine
COPY frontend/package*.json
npm ci
COPY frontend/
npm run build
```

Resultado:

```text
/app/frontend/dist
```

### Etapa backend

El Dockerfile versionado declara:

```text
FROM python:3.11-slim
COPY backend/requirements.txt
python -m pip install --no-cache-dir -r backend/requirements.txt
COPY backend/
COPY frontend build
CMD python -m uvicorn backend.app.main:app
```

Resultado declarado por esta configuración del repositorio:

- una imagen Docker con las etapas frontend y backend descritas arriba;
- FastAPI configurado para servir API y frontend estático;
- el endpoint `/health` definido en el código.

Esto no acredita que Railway haya usado el Dockerfile, que no iniciara un servidor React, ni que `/health` estuviera configurado como healthcheck. La procedencia efectiva del build continúa UNVERIFIED.

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

## 11. Verificación obligatoria antes de un futuro despliegue

Esta guía no autoriza ni prescribe por sí sola un despliegue. Antes de cualquier futura operación, verificar la configuración efectiva del servicio y reconciliarla con los archivos versionados. Registrar, como mínimo, builder, fuente/ruta de build, comando de arranque, healthcheck y commit desplegado. La discrepancia observada entre `RAILPACK` live y `DOCKERFILE` versionado debe resolverse con evidencia de la configuración efectiva; mientras siga sin resolver, no asumir que el Dockerfile o este procedimiento describen el build live.

### Paso 1 — Identidad y configuración efectiva

Confirmar el repositorio/commit y registrar la configuración live del servicio. Compararla con `railway.json` y `Dockerfile`; este documento no decide cuál builder debe prevalecer ni prescribe `startCommand`.

### Paso 2 — Variables requeridas por la aplicación

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

### Paso 3 — Build y verificación

Usar la configuración efectiva verificada para identificar el proceso real de build; no inferir que Railway construye una imagen Docker a partir del `railway.json` versionado cuando el builder live reporta otro valor.

Debe verse, conceptualmente:

```text
frontend npm ci
frontend npm run build
backend pip install
uvicorn backend.app.main:app
```

### Paso 4 — Health endpoint y configuración efectiva

En la observación fechada del 2026-10-10, `/health` respondió HTTP 200. La consulta de metadatos live no mostró si Railway tiene configurado un healthcheck efectivo; verificar esa configuración antes de cualquier despliegue futuro. No se afirma que el endpoint esté configurado como healthcheck.

```text
/health
```

La respuesta observada no sustituye la verificación del healthcheck efectivo ni define por sí sola su respuesta esperada.

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

### Error 1 — No asumir una ruta live por el código legacy

El repositorio trata estas rutas como legacy/no canónicas; no se ha acreditado si intervienen en el deployment observado. No las elijas como ruta de despliegue ni las descartes como ruta live sin verificar primero la configuración efectiva:

```text
railway/server_railway.py
backend/server.py
```

### Error 2 — Confundir la configuración declarada con la live

El repositorio configura FastAPI para servir el build estático. La observación disponible no determina el proceso live que sirvió el deployment ni acredita que se ejecutara `npm start`. Antes de recomendar o descartar un proceso de arranque, verificar la configuración efectiva; esta guía no afirma cuál está activa.

### Error 3 — Olvidar `STRIPE_WEBHOOK_SECRET`

Después del hardening, el webhook exige firma.

Sin `STRIPE_WEBHOOK_SECRET`, el webhook debe rechazar. Correcto.

### Error 4 — Usar `COOKIE_SECURE=false` en producción

En Railway con HTTPS:

```env
COOKIE_SECURE=true
```

### Error 5 — Hardcodear `VITE_BACKEND_URL` en Dockerfile

No quemar dominio fijo dentro del build.

El frontend debe funcionar en mismo origen usando `window.location.origin`, salvo necesidad explícita.

### Error 6 — Confundir las declaraciones de dependencias

El Dockerfile versionado declara instalar:

```text
backend/requirements.txt
```

El `requirements.txt` de la raíz se describe como perfil local. La procedencia del build live sigue UNVERIFIED, así que no está acreditado qué archivo de dependencias consumió el deployment observado.

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
[ ] configuración live de builder/fuente/start command/healthcheck verificada y reconciliada con los archivos versionados
[ ] Dockerfile usa npm ci
[ ] Dockerfile no hardcodea VITE_BACKEND_URL
[ ] Dockerfile usa backend/requirements.txt
[ ] Dockerfile arranca python -m uvicorn backend.app.main:app
[ ] /health existe
[ ] FRONTEND_BUILD_DIR apunta a frontend/dist
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

La evidencia vigente queda separada así:

- GitHub main y el deployment observado apuntan a `ead9f4e796f9e2be89a8d0b7948364edbf67066b`;
- los metadatos live reportan `RAILPACK`, sin `startCommand` ni healthcheck visibles en la consulta;
- el `railway.json` versionado declara `DOCKERFILE`, `Dockerfile`, `/health` y política de reinicio;
- la procedencia efectiva del build es UNVERIFIED;
- por tanto, el contenido del Dockerfile describe el build declarado por el repositorio, no prueba el build live;
- el Dockerfile versionado declara instalar `backend/requirements.txt` y usar `frontend/package-lock.json` con `npm ci`; la procedencia del build live permanece UNVERIFIED;
- `backend/app/main.py` contiene la entrada de aplicación versionada, pero no se acredita como proceso del deployment observado;
- `backend.app.main:app` es el runtime declarado por el Dockerfile;
- `/health` respondió HTTP 200 en la observación del 2026-10-10; el healthcheck live no quedó verificado;
- el código versionado configura FastAPI para servir API + frontend estático, sin acreditación de que esa configuración atendiera el deployment observado;
- la configuración versionada declara `DOCKERFILE` como builder; no se ha verificado si el deploy legacy está excluido del runtime live;
- los webhooks Stripe requieren firma;
- las cookies seguras se activan con `COOKIE_SECURE=true`.

---

## 17. Conclusión operativa

A partir de la evidencia vigente:

- no se afirma que Railway esté alineado con la configuración versionada;
- la discrepancia builder/procedencia queda como verificación previa a futuros despliegues;
- se documentan variables críticas añadidas por el hardening;
- se evita hardcodear dominios en el build frontend;
- se documenta `backend/requirements.txt` como dependencia declarada por el Dockerfile versionado, sin atribuirla al build live;
- cualquier ajuste futuro de deploy debe partir de una comprobación de la configuración efectiva, además de los archivos versionados:

```text
Dockerfile
railway.json
backend.app.main:app
/health
```

Menos narrativa. Más realidad ejecutable.
