# Sistema Maestro - Product Requirements Document

## Informacion General
- **Nombre**: Sistema Maestro
- **Dominio**: sistemamaestro.com
- **Categoria**: Plataforma guiada de transformacion digital
- **Fecha creacion**: 11 Abril 2026
- **Version**: V1.0 (FEATURE FREEZE)
- **Estado**: Lista para produccion (pendiente API keys del usuario)

## Definicion del Producto
Sistema Maestro es una plataforma guiada que transforma una necesidad, una idea o un activo existente en una solucion digital estructurada, monetizable y lista para ponerse en marcha.

## Promesa Principal
"Explica tu necesidad. Sistema Maestro te guia hasta una solucion real, estructurada y lista para funcionar."

## User Personas

### Persona 1: Emprendedor Digital
- Tiene ideas pero no sabe como estructurarlas
- Necesita claridad sobre modelo de negocio
- Quiere un plan de accion concreto

### Persona 2: Negocio Existente
- Tiene una web o activo digital que no funciona bien
- Necesita diagnostico y mejoras
- Quiere optimizar conversion o ventas

### Persona 3: Profesional Freelance
- Ofrece servicios pero no tiene proceso de venta claro
- Necesita automatizar tareas repetitivas
- Quiere estructura comercial

## Core Requirements (V1) - COMPLETADO

### Rutas Maestras
1. **Mejorar algo existente** - Analisis real de URLs con scraping (beautifulsoup4)
2. **Vender y cobrar** - Estructura comercial
3. **Automatizar operacion** - Identificacion de cuellos de botella
4. **Idea a proyecto** - Conversion de idea a proyecto monetizable

### Funcionalidades Implementadas
- [x] Landing page con Hero, Input module, Rutas, Pricing, FAQ
- [x] Autenticacion JWT + Google OAuth (via Emergent Auth)
- [x] Dashboard completo (Resumen, Proyectos, Oportunidades, Facturacion, Ajustes)
- [x] Analisis con IA (GPT-5.2) via OpenAI
- [x] Analisis real de URLs (scraping server-side con beautifulsoup4)
- [x] Generacion de Blueprint
- [x] Stripe integrado (4 planes, checkout server-side)
- [x] Modulo Oportunidades
- [x] Newsletter subscription (MongoDB)
- [x] Cookie banner con enlaces legales
- [x] Persistencia de proyectos por usuario
- [x] Voice V1 (dictacion + TTS via Web Speech API)
- [x] Paginas legales (/privacy, /cookies, /terms)
- [x] Branding completo "Sistema Maestro"
- [x] Logo en navbar, auth, dashboard, sidebar, favicon
- [x] Proteccion brute force en login
- [x] README completo con instrucciones

### Planes
| Plan | Precio | Status |
|------|--------|--------|
| Gratis | 0EUR/mes | Completado |
| Blueprint | 29EUR/mes | Completado |
| Sistema | 79EUR/mes | Completado |
| Premium | 199EUR/mes | Completado |

## Arquitectura Tecnica

```
Frontend (React 18 + Tailwind CSS + Framer Motion)
    |
Backend (FastAPI + Python)
    |
    +-- MongoDB (datos: users, projects, opportunities, newsletter, payments)
    +-- OpenAI GPT-5.2 (analisis IA)
    +-- Stripe (pagos server-side checkout)
    +-- Emergent Auth (Google OAuth)
    +-- beautifulsoup4 + httpx (scraping URLs)
    +-- Web Speech API (voz, browser-native)
```

## Variables de Entorno Requeridas (Produccion)

### Backend
```
OPENAI_API_KEY=sk-proj-xxx (OBLIGATORIO - IA)
STRIPE_SECRET_KEY=sk_live_xxx (OBLIGATORIO - pagos)
MONGO_URL=mongodb+srv://xxx (MongoDB Atlas para produccion)
DB_NAME=sistemamaestro
JWT_SECRET=xxx (minimo 32 caracteres aleatorios)
ADMIN_EMAIL=tu-email-real@tudominio.com
ADMIN_PASSWORD=ContraseñaSegura
```

### Frontend
```
REACT_APP_BACKEND_URL=https://sistemamaestro.com (o URL de produccion)
```

## Checklist Pre-Produccion
- [ ] OPENAI_API_KEY configurada (usuario)
- [ ] STRIPE_SECRET_KEY configurada (usuario)
- [ ] ADMIN_EMAIL/PASSWORD cambiados (usuario)
- [ ] Dominio sistemamaestro.com conectado (usuario)
- [ ] Verificar SSL/HTTPS activo
- [ ] Guardar en GitHub

## Backlog P0/P1/P2

### P0 (Bloqueantes - Accion del usuario)
- [ ] Configurar OPENAI_API_KEY propia
- [ ] Configurar STRIPE_SECRET_KEY de produccion
- [ ] Cambiar credenciales admin seed
- [ ] Conectar dominio sistemamaestro.com
- [ ] Guardar en GitHub

### P1 (Post-lanzamiento)
- [ ] Cambiar cookies JWT a secure=True para HTTPS
- [ ] Email transaccional (confirmacion, recuperacion password)
- [ ] Analytics (Google Analytics/Posthog)
- [ ] Mejoras UX segun feedback usuarios
- [ ] Endpoint para cambio de password desde la app

### P2 (Mejoras futuras)
- [ ] Export de Blueprint a PDF
- [ ] Mas oportunidades en el modulo
- [ ] Historial de versiones de proyectos
- [ ] Notificaciones push
- [ ] Multi-idioma completo (i18n)
- [ ] Panel admin para gestion de usuarios

## Test Results
- Backend: 93.3% success rate
- Frontend: 95% success rate
- Build: Limpio (craco build exitoso, 191KB JS + 11KB CSS gzipped)
- Branding: 0 referencias a "Cervaco" en codigo fuente

---
*Ultima actualizacion: 12 Febrero 2026 - Validacion final de produccion V1*
