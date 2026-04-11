# Sistema Maestro - Product Requirements Document

## Informacion General
- **Nombre**: Sistema Maestro
- **Dominio**: sistemamaestro.com
- **Categoria**: Plataforma guiada de transformacion digital
- **Version**: V1.0 (FEATURE FREEZE)
- **Estado**: V1 completa. Archivos de Railway listos para despliegue.

## Core Requirements (V1) - COMPLETADO
- [x] Landing page con Hero, Input module, Rutas, Pricing, FAQ
- [x] Autenticacion JWT + Google OAuth
- [x] Dashboard completo (Resumen, Proyectos, Oportunidades, Facturacion, Ajustes)
- [x] Analisis con IA via OpenAI
- [x] Analisis real de URLs (scraping server-side)
- [x] Generacion de Blueprint
- [x] Stripe integrado (4 planes, checkout)
- [x] Modulo Oportunidades (5 opciones, logica free vs premium/admin)
- [x] Newsletter, Cookie banner, Paginas legales
- [x] Voice V1, Branding completo, Proteccion brute force
- [x] Endurecimiento codigo (console.error, array keys, catch blocks)
- [x] Boton Google profesional con SVG, formularios limpios
- [x] Archivos Railway deployment (Dockerfile, server_railway.py, guia)

## Despliegue Railway
- Dockerfile: Build monolitico (frontend build + backend Python)
- server_railway.py: Backend sin emergentintegrations (usa openai + stripe SDK directos)
- Guia completa: DEPLOY_RAILWAY.md

## Variables de Entorno (Railway)
```
MONGO_URL=mongodb+srv://xxx
DB_NAME=sistemamaestro
JWT_SECRET=xxx
OPENAI_API_KEY=sk-proj-xxx
STRIPE_SECRET_KEY=sk_live_xxx
ADMIN_EMAIL=tu-email-real
ADMIN_PASSWORD=ContraseñaSegura
ALLOWED_ORIGINS=https://sistemamaestro.com,https://www.sistemamaestro.com
```

## Checklist Pre-Produccion
- [x] Codigo V1 finalizado y testeado
- [x] Archivos Railway creados
- [ ] MongoDB Atlas configurado (usuario)
- [ ] Railway deploy ejecutado (usuario)
- [ ] Variables de entorno configuradas (usuario)
- [ ] Dominio sistemamaestro.com conectado (usuario)

## Backlog P1/P2
### P1
- [ ] Google OAuth directo (sin Emergent Auth)
- [ ] Cookies JWT secure=True
- [ ] Email transaccional
- [ ] Analytics

### P2
- [ ] Descomposicion componentes
- [ ] Export Blueprint PDF
- [ ] Multi-idioma
- [ ] Panel admin

## Ultima actualizacion
12 Febrero 2026 - Archivos Railway deployment creados
