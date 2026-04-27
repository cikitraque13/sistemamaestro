# 02-PENDIENTES-PRIORIZADOS

## Estado del documento

- Estado: activo
- Tipo: backlog priorizado canónico
- Alcance: proyecto completo `Sistema Maestro`
- Objetivo: ordenar el trabajo pendiente por prioridad real, dependencia y criterio de cierre, sin mezclar estructura, higiene, producto y despliegue.

---

## 1. Función de este documento

Este documento existe para responder con claridad a una sola pregunta:

**¿Qué hay que hacer ahora, en qué orden y con qué dependencia?**

No fija rutas canónicas.
No sustituye decisiones cerradas.
No actúa como inventario técnico.
No reemplaza procedimientos operativos.
No registra incidencias.

Su función es ordenar la ejecución a partir del estado real ya cerrado del proyecto.

---

## 2. Regla de priorización

Toda acción pendiente debe clasificarse como una de estas tres:

1. **crítica estructural**
2. **optimización estratégica**
3. **ajuste cosmético**

### Regla operativa

Solo procede actuar si la acción es:

- crítica estructural;
- u optimización estratégica.

Los ajustes cosméticos no deben abrir frente mientras el sistema siga en afinado técnico.

---

## 3. Estado operativo actual

La situación actual del proyecto queda resumida así:

- la base documental canónica ya está operativa;
- `docs/control/` funciona como memoria estructural real;
- `frontend/src/features/` queda reconocido como capa principal del frontend;
- `builder`, `home` y `app-shell` forman parte del núcleo real del producto;
- `frontend/src/features/builder/` queda reconocido como ruta funcional canónica del Builder;
- `frontend/src/features/builder/lifecycle/` queda creado como subcapa canónica de maduración de proyectos;
- `builderAgentResponseComposer.js`, `BuilderAgentPane.js` y `builderAiAdapter.js` ya quedan conectados al lifecycle;
- Builder Runtime queda conectado a Builder AI/OpenAI como capa de interpretación y generación estructurada;
- `BuilderBuildKernel` queda redefinido como capa de ejecución, normalización y consolidación, no como sustituto de OpenAI;
- `backend/app/` queda reconocido como arquitectura modular interna del backend;
- `backend/app/main.py` y `backend.app.main:app` quedan fijados como entrada canónica del backend;
- el legacy runtime ya fue retirado del repo activo;
- la higiene del root de `frontend/` ya quedó cerrada;
- el safety externo ya quedó archivado fuera del escritorio;
- `backend/config/credits/` actúa como capa viva del sistema;
- `backend/app/ai/` está clasificada como capa puente/preparada, no como runtime IA vivo de extremo a extremo;
- `tests/` sigue como auxiliar válida;
- deploy final sigue bloqueado.

### Lectura operativa

El frente principal ya no es retocar Builder visualmente ni volver a diseñar las propuestas del chat desde cero.

El frente principal es conectar las acciones lifecycle con construcción real acumulativa:

```text
Builder AI / OpenAI
→ interpretación y salida estructurada
→ builderAiAdapter
→ builderLifecycleAction
→ builderMutationRegistry
→ BuilderBuildKernel
→ BuilderBuildState
→ BuilderOutputMap
→ preview / código / estructura
→ siguiente decisión lifecycle
```

---

## CRÍTICO — Ejecutar acciones lifecycle como mutaciones reales

Prioridad: crítica estructural.

### Estado actual

El Builder ya tiene una capa `builder/lifecycle` creada, saneada y conectada al chat.

Builder Runtime ya puede recibir salida de Builder AI/OpenAI y adaptarla al flujo interno.

El chat ya debe proponer mejoras por fase del proyecto, no acciones técnicas genéricas.

### Problema pendiente

Las acciones lifecycle todavía deben conectarse completamente con la construcción real.

No basta con que el chat proponga:

- configurar presupuesto;
- configurar WhatsApp;
- añadir FAQ;
- profundizar oferta;
- personalizar marca;
- preparar seguimiento.

Cada acción aceptada debe producir una mutación acumulativa verificable.

### Objetivo

Cuando el usuario acepte una mejora, el sistema debe:

1. registrar la acción lifecycle aplicada;
2. actualizar `readinessScore`;
3. actualizar `BuilderBuildState`;
4. cambiar la preview;
5. cambiar el código;
6. cambiar la estructura si procede;
7. ocultar la acción ya aplicada;
8. mostrar la siguiente mejora correspondiente a la fase siguiente o a la fase actual pendiente;
9. evitar repetir eternamente las mismas opciones.

### Flujo esperado

```text
primera versión visible
→ configurar conversión
→ reforzar confianza
→ profundizar oferta
→ personalizar marca
→ preparar seguimiento
→ estabilizar código y estructura
→ preparar exportación/deploy si procede
```

### Archivos prioritarios

- `frontend/src/features/builder/state/builderMutationRegistry.js`
- `frontend/src/features/builder/state/builderBuildKernel.js`
- `frontend/src/features/builder/state/builderOutputMap.js`
- `frontend/src/features/builder/utils/builderCodeTemplates.js`

### Archivos ya conectados que no deben reabrirse salvo incidencia

- `frontend/src/features/builder/intelligence/builderAgentResponseComposer.js`
- `frontend/src/features/builder/components/BuilderAgentPane.js`
- `frontend/src/features/builder/api/builderAiAdapter.js`
- `frontend/src/features/builder/lifecycle/`

### Criterio de cierre

Para una landing de taller, el recorrido debe avanzar así:

1. Primera versión visible.
2. Configurar solicitud de presupuesto.
3. Configurar WhatsApp o formulario sectorial.
4. Añadir FAQ, garantías y confianza.
5. Profundizar oferta de servicios.
6. Personalizar marca.
7. Preparar seguimiento de presupuestos.
8. Preparar salida técnica solo cuando el proyecto esté maduro.

### Prohibición

No debe aparecer por defecto:

- Google login;
- backend;
- auth;
- dashboard;
- GitHub;
- deploy;
- dominio;
- Gema Maestra.

Estas acciones solo pueden aparecer cuando:

- el usuario lo pide explícitamente;
- el proyecto es una app, SaaS, dashboard o herramienta interna;
- o el proyecto entra en fase de salida técnica.

### Siguiente acción

Auditar y conectar:

```text
builderLifecycleAction
→ builderMutationRegistry
→ BuilderBuildKernel
→ BuilderBuildState
→ builderOutputMap
→ preview/código/estructura
→ siguiente decisión lifecycle
```

---

## ALTA — Código y estructura deben reflejar la preview

Prioridad: optimización estratégica.

### Problema

La preview ya puede ser rica y sectorial, pero el código generado puede no representar todavía con suficiente fidelidad lo que el usuario ve.

### Objetivo

El panel de código debe acompañar la construcción real:

- secciones visibles;
- formularios;
- CTA;
- datos sectoriales;
- estructura de componentes;
- rutas o archivos cuando proceda.

### Archivos candidatos

- `frontend/src/features/builder/utils/builderCodeTemplates.js`
- `frontend/src/features/builder/state/builderOutputMap.js`
- `frontend/src/features/builder/api/builderAiAdapter.js`

### Criterio de cierre

Cuando la preview muestre una landing de taller, el código debe reflejar al menos:

- hero;
- servicios;
- formulario de presupuesto;
- CTA;
- confianza;
- seguimiento;
- estructura de componentes coherente.

---

## ALTA — Preview ampliada para revisión real

Prioridad: optimización estratégica.

### Problema

La preview interna del Builder puede cortar campos o textos por limitación de espacio, aunque la landing esté bien construida.

### Objetivo

Añadir una opción de vista ampliada para revisar el proyecto como cliente real.

### Criterio de cierre

El usuario puede abrir la preview en modo ampliado y comprobar:

- textos completos;
- campos del formulario;
- CTA;
- secciones;
- estructura visual;
- sensación real de landing/web.

### Límite

No debe convertirse en rediseño visual paralelo ni abrir una capa nueva de navegación innecesaria.

---

## MEDIA — Créditos conectados a acciones intensivas

Prioridad: optimización estratégica.

### Estado

`readinessScore` representa madurez del proyecto.

Los créditos representan coste de acciones intensivas.

No deben mezclarse.

### Objetivo

Conectar cada acción lifecycle con un nivel de coste:

- none;
- low;
- medium;
- high;
- premium.

### Criterio de cierre

El usuario debe entender cuándo una mejora consume créditos y por qué.

La primera experiencia debe demostrar valor antes de pedir pago.

---

## MEDIA — Salida técnica, exportación y deploy

Prioridad: optimización estratégica.

### Estado

La salida técnica queda reservada para fases maduras del proyecto.

No debe aparecer al principio en proyectos simples.

### Objetivo

Preparar exportación, GitHub, deploy y dominio solo cuando:

- el proyecto esté suficientemente maduro;
- el usuario lo pida explícitamente;
- o el tipo de proyecto lo requiera.

### Criterio de cierre

Exportación/deploy no aparecen como propuesta temprana para una landing sencilla.

Sí pueden aparecer cuando el recorrido llega a salida técnica.