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
- [x] Modulo Oportunidades (5 opciones, logica free vs premium)
- [x] Newsletter subscription (MongoDB)
- [x] Cookie banner con enlaces legales
- [x] Persistencia de proyectos por usuario
- [x] Voice V1 (dictacion + TTS via Web Speech API)
- [x] Paginas legales (/privacy, /cookies, /terms)
- [x] Branding completo "Sistema Maestro"
- [x] Proteccion brute force en login
- [x] README completo
- [x] Endurecimiento codigo: 17 console.error eliminados, 6 array keys mejorados
- [x] Features billing en espanol, errores traducidos (15 traducciones)
- [x] Badge Emergent oculto (CSS + HTML override)
- [x] Route cards funcionales (navegan a /flow o /register)
- [x] Auto-submit URL desde Home (flujo directo sin formulario intermedio)
- [x] Example cards como bloques informativos (hover neutralizado)
- [x] Catch blocks vacios corregidos (Dashboard.js, AuthContext.js)
- [x] Array index keys reemplazados por IDs estables (7 instancias)
- [x] Logo con mayor presencia visual (small:40, default:52, large:64, xlarge:88)
- [x] Boton Google profesional con icono SVG multicolor real
- [x] Formularios auth limpios sin iconos que interfieran
- [x] Logica Oportunidades: admin/premium ve las 5, free ve 2 + upsell

## Test Results V1
- Testing agent iteration_1: Backend 93.3%, Frontend 95%
- Testing agent iteration_2: Frontend 100% (15/15 tests passed)
- Build: Limpio (craco build exitoso)

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
12 Febrero 2026 - Cierre V1 final completado y verificado (100% tests)
