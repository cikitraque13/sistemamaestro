# Sistema Maestro - Product Requirements Document

## Informacion General
- **Nombre**: Sistema Maestro
- **Dominio**: sistemamaestro.com
- **Categoria**: Plataforma guiada de transformacion digital
- **Version**: V1.0 (FEATURE FREEZE)
- **Estado**: Lista para produccion (pendiente API keys del usuario)

## Core Requirements (V1) - COMPLETADO
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
- [x] Proteccion brute force en login
- [x] README completo
- [x] Endurecimiento codigo: 17 console.error eliminados, 6 array keys mejorados
- [x] Cierre produccion: features billing en espanol, errores traducidos, enlaces afiliado
- [x] Badge Emergent oculto (CSS override)
- [x] Route cards funcionales (navegan a /flow o /register)
- [x] Auto-submit URL desde Home (flujo directo sin formulario intermedio)
- [x] Example cards convertidas en bloques informativos (sin hover interactivo)

## Enlaces de Afiliado
- SystemeIO: https://systeme.io/es?sa=sa021243679877282e02190853937f18793f713170
- SistemaMaestroIA: https://sistemamaestroia.com/

## Arquitectura
```
Frontend (React 18 + Tailwind CSS + Framer Motion)
    |
Backend (FastAPI + Python)
    +-- MongoDB
    +-- OpenAI GPT-5.2
    +-- Stripe (server-side checkout)
    +-- Emergent Auth (Google OAuth)
    +-- beautifulsoup4 + httpx (scraping)
    +-- Web Speech API (voz, browser-native)
```

## Variables de Entorno Requeridas (Produccion)
### Backend
```
OPENAI_API_KEY=sk-proj-xxx
STRIPE_SECRET_KEY=sk_live_xxx
MONGO_URL=mongodb+srv://xxx
DB_NAME=sistemamaestro
JWT_SECRET=xxx
ADMIN_EMAIL=tu-email-real
ADMIN_PASSWORD=ContraseñaSegura
```

## Checklist Pre-Produccion
- [ ] OPENAI_API_KEY configurada (usuario)
- [ ] STRIPE_SECRET_KEY configurada (usuario)
- [ ] ADMIN_EMAIL/PASSWORD cambiados (usuario)
- [ ] Dominio sistemamaestro.com conectado (usuario)
- [ ] Guardar en GitHub

## Backlog

### P1 (Post-lanzamiento)
- [ ] Cookies JWT secure=True para HTTPS
- [ ] Hook dependencies con useCallback refactoring
- [ ] Email transaccional
- [ ] Analytics
- [ ] Endpoint cambio password

### P2 (Futuro)
- [ ] Descomposicion componentes grandes
- [ ] Split useVoice.js
- [ ] Export Blueprint a PDF
- [ ] Multi-idioma (i18n)
- [ ] Panel admin

## Ultima actualizacion
12 Febrero 2026 - 3 fixes criticos de produccion aplicados
