# Sistema Maestro - Product Requirements Document

## Información General
- **Nombre**: Sistema Maestro
- **Dominio**: sistemamaestro.com
- **Categoría**: Plataforma guiada de transformación digital
- **Fecha creación**: 11 Abril 2026
- **Versión**: V1.0

## Definición del Producto
Sistema Maestro es una plataforma guiada que transforma una necesidad, una idea o un activo existente en una solución digital estructurada, monetizable y lista para ponerse en marcha.

## Promesa Principal
"Explica tu necesidad. Sistema Maestro te guía hasta una solución real, estructurada y lista para funcionar."

## User Personas

### Persona 1: Emprendedor Digital
- Tiene ideas pero no sabe cómo estructurarlas
- Necesita claridad sobre modelo de negocio
- Quiere un plan de acción concreto

### Persona 2: Negocio Existente
- Tiene una web o activo digital que no funciona bien
- Necesita diagnóstico y mejoras
- Quiere optimizar conversión o ventas

### Persona 3: Profesional Freelance
- Ofrece servicios pero no tiene proceso de venta claro
- Necesita automatizar tareas repetitivas
- Quiere estructura comercial

## Core Requirements (V1)

### ✅ Implementado

#### Rutas Maestras
1. **Mejorar algo existente** - Análisis real de URLs con scraping
2. **Vender y cobrar** - Estructura comercial
3. **Automatizar operación** - Identificación de cuellos de botella
4. **Idea a proyecto** - Conversión de idea a proyecto monetizable

#### Funcionalidades
- [x] Landing page con Hero, Input module, Rutas, Pricing, FAQ
- [x] Autenticación JWT + Google OAuth
- [x] Dashboard completo (Resumen, Proyectos, Oportunidades, Facturación, Ajustes)
- [x] Análisis con IA (GPT-5.2)
- [x] Análisis real de URLs (scraping server-side)
- [x] Generación de Blueprint
- [x] Stripe integrado (4 planes)
- [x] Módulo Oportunidades
- [x] Newsletter subscription
- [x] Cookie banner
- [x] Persistencia de proyectos por usuario

#### Planes
| Plan | Precio | Status |
|------|--------|--------|
| Gratis | €0/mes | ✅ |
| Blueprint | €29/mes | ✅ |
| Sistema | €79/mes | ✅ |
| Premium | €199/mes | ✅ |

## Variables de Entorno Requeridas

### Producción (sistemamaestro.com)
```
OPENAI_API_KEY=sk-xxx (REQUERIDO para IA)
STRIPE_SECRET_KEY=sk_live_xxx (REQUERIDO para pagos)
MONGO_URL=mongodb+srv://xxx (MongoDB Atlas)
JWT_SECRET=xxx (mínimo 32 caracteres)
```

## Backlog P0/P1/P2

### P0 (Crítico - Post-deploy)
- [ ] Configurar OPENAI_API_KEY propia
- [ ] Configurar STRIPE_SECRET_KEY de producción
- [ ] Conectar dominio sistemamaestro.com
- [ ] SSL certificado

### P1 (Alta prioridad)
- [ ] Páginas /privacy, /cookies, /terms
- [ ] Email transaccional (confirmación, recuperación)
- [ ] Analytics (Google Analytics/Posthog)
- [ ] Mejoras UX según feedback usuarios

### P2 (Mejoras)
- [ ] Export de Blueprint a PDF
- [ ] Más oportunidades en el módulo
- [ ] Historial de versiones de proyectos
- [ ] Notificaciones push
- [ ] Multi-idioma completo (i18n)

## Arquitectura Técnica

```
Frontend (React)
    ↓
Backend (FastAPI)
    ↓
├── MongoDB (datos)
├── OpenAI (análisis IA)
├── Stripe (pagos)
└── Emergent Auth (Google OAuth)
```

## Next Actions (Post V1)
1. Desplegar en producción
2. Configurar dominio sistemamaestro.com
3. Añadir OPENAI_API_KEY propia
4. Añadir STRIPE_SECRET_KEY de producción
5. Monitorizar primeros usuarios
6. Iterar según feedback

---
*Última actualización: 11 Abril 2026*
