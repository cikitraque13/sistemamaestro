# DEPLOY_RAILWAY

## Estado de este documento

- Estado: activo
- Tipo: guía operativa de despliegue
- Alcance: despliegue y mantenimiento de `Sistema Maestro` en Railway
- Objetivo: reflejar la vía real de despliegue actual sin arrastres heredados ni rutas falsas

---

## 1. Verdad actual de despliegue

La vía canónica actual de despliegue en Railway es esta:

1. `railway.json`
2. `Dockerfile`
3. `backend.app.main:app`

### Lectura correcta

Railway no debe interpretarse ya como un despliegue basado en:

- `railway/server_railway.py`
- ni `backend/server.py`

La referencia real de runtime actual es:

```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8080}
```

---

## 2. Qué usa realmente Railway hoy

### `railway.json`

Railway está configurado para construir con:

- `builder: DOCKERFILE`
- `dockerfilePath: Dockerfile`

Y para verificar salud con:

- `healthcheckPath: /health`

### `Dockerfile`

El `Dockerfile` actual:

- compila el frontend;
- instala dependencias del backend;
- copia el backend;
- copia el build del frontend;
- y arranca el sistema con `backend.app.main:app`.

### Backend real de runtime

La entrada real del backend es:

- `backend/app/main.py`

La referencia canónica de runtime es:

- `backend.app.main:app`

---

## 3. Legacy de deploy ya retirado del repo activo

Las siguientes piezas ya no forman parte del perímetro activo de runtime/deploy dentro del repo:

- `backend/server.py`
- `railway/server_railway.py`
- `railway/requirements.txt`

### Estado real

Estas piezas fueron retiradas del repo activo y movidas a un área de safety externa para cierre controlado del legado.

### Regla

- no reintroducirlas en el runtime;
- no documentarlas como vía activa;
- no volver a abrir una segunda verdad de despliegue.

---

## 4. Requisitos previos reales

Antes de dar por válido el despliegue, deben existir y estar alineados:

- `Dockerfile`
- `railway.json`
- `backend/app/main.py`
- `backend/requirements.txt`
- `frontend/package.json`

Además, el proyecto debe estar en un estado estructural suficientemente estable.

### Regla

No abrir deploy final si el sistema sigue mezclando:

- higiene pendiente;
- documentación desalineada;
- frentes estructurales abiertos;
- y decisiones no cerradas.

---

## 5. Variables de entorno mínimas

En Railway, la base mínima de variables del backend debe cubrir al menos:

```env
MONGO_URL=mongodb+srv://usuario:password@cluster.mongodb.net/?retryWrites=true&w=majority
DB_NAME=sistemamaestro
JWT_SECRET=una_cadena_larga_segura
OPENAI_API_KEY=sk-xxx
STRIPE_SECRET_KEY=sk_xxx
ADMIN_EMAIL=tu-email-real@dominio.com
ADMIN_PASSWORD=una_password_segura
ALLOWED_ORIGINS=https://sistemamaestro.com,https://www.sistemamaestro.com
```

### Notas

- no subir secretos al repositorio;
- no usar placeholders en producción;
- `ALLOWED_ORIGINS` debe reflejar el dominio real activo;
- `PORT` lo gestiona Railway junto al runtime del contenedor.

---

## 6. Flujo real de build

El build actual hace esto:

### Etapa frontend

- usa imagen Node;
- copia `frontend/package*.json`;
- ejecuta `npm install`;
- copia `frontend/`;
- ejecuta `npm run build`.

### Etapa backend

- usa imagen Python;
- copia `backend/requirements.txt`;
- instala dependencias del backend;
- copia `backend/`;
- copia el build del frontend al contenedor final;
- expone el puerto `8080`;
- arranca con `uvicorn backend.app.main:app`.

### Consecuencia

El frontend en Railway se sirve como build estático dentro del backend FastAPI, no como dev server separado.

---

## 7. Ruta de despliegue en Railway

### Paso 1 — Proyecto conectado

Railway debe estar conectado al repositorio correcto y detectar:

- `railway.json`
- `Dockerfile`

### Paso 2 — Builder correcto

Railway debe usar:

- `Dockerfile` como fuente de build

No debe configurarse una orden paralela que arranque:

- `server.py`
- ni `server_railway.py`

### Paso 3 — Variables cargadas

El servicio debe tener cargadas las variables mínimas del bloque anterior.

### Paso 4 — Build y arranque

Railway construye la imagen, arranca el backend y sirve el frontend compilado desde el mismo contenedor.

### Paso 5 — Verificación de salud

El healthcheck esperado es:

```text
/health
```

---

## 8. Qué comprobar después del deploy

La verificación mínima debe cubrir esto:

### Backend

- `/health` responde correctamente;
- el proceso levanta sin error de imports;
- Mongo conecta;
- el arranque depende de `backend.app.main:app`;
- no hay error de variables de entorno faltantes.

### Frontend

- la home carga;
- el `index.html` del build se sirve correctamente;
- las rutas del frontend no rompen;
- los estáticos se sirven desde `/static`.

### Integración general

- auth no rompe el arranque;
- billing no rompe imports;
- OpenAI no rompe startup por configuración ausente si no se invoca todavía;
- Stripe no rompe startup por configuración ausente si no se invoca todavía.

---

## 9. Estado del dominio

El dominio no debe tratarse aquí como hipótesis abstracta. Puede haber dos estados válidos.

### Caso A — Dominio ya conectado

Si el dominio ya está conectado y el sistema ya ha respondido correctamente al refresco y carga de páginas, la validación correcta es esta:

- el dominio principal resuelve;
- el certificado SSL responde correctamente;
- `/health` responde por la vía desplegada;
- la home carga sin depender de entorno local;
- `ALLOWED_ORIGINS` coincide con el dominio real activo.

### Caso B — Dominio aún no conectado o no validado

Si todavía no está confirmado del todo:

- conectar dominio personalizado en Railway;
- apuntar DNS correctamente;
- esperar propagación;
- actualizar `ALLOWED_ORIGINS`;
- volver a validar `/health`, home y rutas.

### Regla

La documentación debe reflejar el estado real del despliegue y no una narrativa antigua.

---

## 10. Errores típicos a evitar

### Error 1
Tomar `railway/server_railway.py` como vía activa de deploy actual.

### Error 2
Tomar `backend/server.py` como entrada principal del sistema desplegado.

### Error 3
Mezclar una orden manual de arranque con la referencia canónica del `Dockerfile`.

### Error 4
Olvidar variables críticas como:

- `MONGO_URL`
- `JWT_SECRET`
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`

### Error 5
Dar por hecho que Railway despliega un dev server de frontend.

No. El frontend actual se sirve como build estático integrado en el contenedor final.

### Error 6
Seguir documentando el deploy como si el legacy siguiera vivo dentro del repo activo.

---

## 11. Veredicto operativo

La verdad actual del despliegue en Railway queda fijada así:

- `railway.json` configura Railway;
- `Dockerfile` construye y arranca;
- `backend/app/main.py` es la entrada backend real;
- `backend.app.main:app` es la referencia canónica de runtime;
- `/health` es la ruta de healthcheck;
- el frontend se sirve como build estático desde FastAPI;
- el legacy de deploy ya fue retirado del repo activo.

---

## 12. Conclusión operativa

A partir de este documento:

- Railway queda alineado con la arquitectura real actual;
- se elimina la confusión entre deploy heredado y deploy canónico;
- `server.py` y `server_railway.py` dejan de presentarse como eje actual del despliegue;
- y cualquier ajuste futuro de deploy debe partir de `Dockerfile` + `railway.json` + `backend.app.main:app`.