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
- Dashboard ya prioriza continuidad hacia Builder;
- Facturación queda alineada como Centro de Capacidad Gold;
- Gema Maestra / Gemas quedan consolidadas como lenguaje visible de capacidad operativa en Billing;
- Informe Maestro Gold queda conectado con Builder y 10 gemas iniciales;
- Pro, Growth y AI Master 199 quedan como niveles de continuidad operativa;
- `backend/app/` queda reconocido como arquitectura modular interna del backend;
- `backend/app/main.py` y `backend.app.main:app` quedan fijados como entrada canónica del backend;
- el legacy runtime ya fue retirado del repo activo;
- la higiene del root de `frontend/` ya quedó cerrada;
- el safety externo ya quedó archivado fuera del escritorio;
- `backend/config/credits/` actúa como capa viva del sistema;
- `backend/app/ai/` está clasificada como capa puente/preparada, no como runtime IA vivo de extremo a extremo;
- `tests/` sigue como auxiliar válida;
- deploy final sigue bloqueado;
- deploys iterativos por microfase quedan permitidos.

### Lectura operativa

El frente estructural principal sigue siendo conectar las acciones lifecycle con construcción real acumulativa:

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

Sin embargo, antes de volver al Builder estructural, queda aprobado cerrar algunos saneamientos visibles de app interna que afectan coherencia, monetización y continuidad.

---

## CERRADO — Facturación alineada con Gema Maestra

Prioridad anterior: alta  
Estado actual: cerrado como microfase de producto.  
Fecha de cierre: 2026-04-28.

### Qué quedó cerrado

Facturación deja de estar pendiente como alineación general.

Queda cerrado que:

- Billing funciona como Centro de Capacidad Gold.
- Informe Maestro Gold comunica entrada puntual de 6,99 €.
- Informe Maestro Gold incluye 10 gemas iniciales para empezar en Builder.
- Los planes Pro, Growth y AI Master 199 quedan como niveles de continuidad operativa.
- Gema Maestra / Gemas sustituyen el lenguaje visible principal de créditos dentro de Billing.
- CreditSummaryCard queda elevado como bloque premium de Gema Maestra.
- CurrentPlanCard queda elevado como bloque premium del plan actual.
- PlansGrid queda saneado sin card Free dentro de la app.
- SuggestedPlanBanner queda alineado con Gemas incluidas.
- billing.constants.js y billing.utils.js dejan de arrastrar notas visibles antiguas de créditos.

### Archivos intervenidos

```text
frontend/src/features/billing/BillingPage.js
frontend/src/features/billing/components/EntryOfferCard.js
frontend/src/features/billing/components/CreditSummaryCard.js
frontend/src/features/billing/components/CurrentPlanCard.js
frontend/src/features/billing/components/PlansGrid.js
frontend/src/features/billing/components/PlanCard.js
frontend/src/features/billing/components/SuggestedPlanBanner.js
frontend/src/features/billing/billing.constants.js
frontend/src/features/billing/billing.utils.js
```

### Criterio de cierre alcanzado

Facturación queda alineada si:

- no domina el lenguaje visible de créditos;
- aparece Gema Maestra / Gemas;
- Informe Maestro Gold conecta con Builder;
- las cards de planes no se desalinean;
- checkout sigue funcionando;
- build pasa;
- Railway despliega correctamente por microfase.

Estado: cumplido.

### No reabrir sin incidencia

No reabrir ahora:

```text
PlanCard
CreditSummaryCard
CurrentPlanCard
PlansGrid
EntryOfferCard
BillingPage
SuggestedPlanBanner
billing.constants.js
billing.utils.js
```

Salvo:

- bug funcional;
- checkout roto;
- solape visible;
- lenguaje antiguo reaparecido;
- build roto.

---

## ALTA — Resumen premium con Gema Maestra

Prioridad: alta  
Tipo: optimización estratégica visible.  
Estado: siguiente frente recomendado.

### Problema detectado

En `Resumen premium` todavía aparecen bloques con lenguaje anterior:

```text
Capacidad operativa — créditos
Tus créditos te dan capacidad para construir y seguir
Ver billing y créditos
```

Además, las cards visibles son demasiado grandes para la información que muestran y tienen exceso de aire vertical.

### Objetivo

Alinear el Resumen premium con el nuevo lenguaje de Facturación:

```text
Gema Maestra
Gemas
capacidad operativa
facturación y gemas
```

### Intervención viable

No rediseñar todo el Resumen.

Tocar únicamente los bloques visibles de:

```text
capacidad operativa
continuidad del sistema
CTA hacia facturación
```

### Resultado esperado

- Sustituir créditos visibles por Gemas.
- Reducir altura excesiva de las cards.
- Compactar información.
- Dar más sensación premium.
- Mantener continuidad con Facturación.
- No abrir cambios de navegación global.

### Criterio de cierre

El bloque queda cerrado si:

- no aparece “créditos” en esa zona visible;
- el CTA apunta semánticamente a “facturación y gemas”;
- la card de capacidad operativa se percibe como Gema Maestra;
- la card de continuidad queda más compacta;
- build pasa;
- no se toca Billing.

---

## MEDIA-ALTA — Barrido de lenguaje fuera de Billing

Prioridad: media-alta  
Tipo: optimización estratégica.

### Contexto

Billing ya fue alineado con Gema Maestra.

Quedan otros módulos que pueden seguir usando lenguaje anterior de créditos.

### Archivos detectados o probables

```text
frontend/src/features/app-shell/components/BuilderCreditBar.js
frontend/src/features/dashboard/components/DashboardCreditsPanel.js
frontend/src/features/home/components/BuilderCreditBar.js
```

### Objetivo

Determinar si esos componentes deben:

- seguir usando créditos por estar en capa técnica o histórica;
- o pasar a Gemas por ser visibles para usuario.

### Regla

No cambiar todos a ciegas.

Primero auditar contexto visible y dependencia.

### Criterio de cierre

El lenguaje queda alineado según capa:

```text
Usuario visible → Gema Maestra / Gemas
técnico interno → créditos si es necesario
```

---

## MEDIA — Historial de pagos con papelera admin

Prioridad: media  
Tipo: mejora funcional controlada.

### Contexto

Durante validaciones y pagos de prueba, el historial de pagos puede quedar contaminado con registros pendientes o pruebas.

### Objetivo

Añadir capacidad de limpieza para administrador.

### Opciones posibles

1. Papelera por fila.
2. Borrado masivo de pruebas.
3. Limpieza solo de pagos pendientes.
4. Limpieza admin protegida.

### Dependencias

Puede requerir:

- control de rol admin;
- endpoint backend;
- confirmación;
- actualización de estado local;
- protección contra borrado accidental.

### Regla

No mezclar con mejoras visuales de Facturación.

### Criterio de cierre

El administrador puede limpiar registros de prueba sin afectar pagos reales ni romper historial operativo.

---

## ALTA — Oportunidades como sistema de plantillas desbloqueables

Prioridad: alta  
Tipo: optimización estratégica.

### Estado actual

Oportunidades ya existe como módulo dentro de la app interna.

Se ha planteado que funcione como sistema de plantillas/rutas desbloqueables por plan.

### Decisión de producto pendiente

Definir si Oportunidades debe contener:

- plantillas de oportunidades;
- plantillas de landing;
- plantillas de webs;
- plantillas de apps;
- rutas de activación por sector;
- combinaciones desbloqueables por plan.

### Estructura inicial propuesta

El sistema puede evolucionar a unas 10 plantillas iniciales:

```text
2 desbloqueadas por Pro
2 desbloqueadas por Growth
1 desbloqueada por AI Master
resto como expansión posterior
```

### Regla

No convertir Oportunidades en marketplace genérico todavía.

Debe reforzar:

```text
entrada → oportunidad → Builder → continuidad → plan
```

### Criterio de cierre

El usuario entiende qué plantilla puede usar, por qué está bloqueada o desbloqueada, y cómo continuar en Builder.

---

## MEDIA — RegisterPage warning de React

Prioridad: media  
Tipo: higiene técnica no bloqueante.

### Estado

Existe un warning de React en `RegisterPage.js` relacionado con dependencias de `useMemo`.

### Impacto

No bloquea:

- build;
- deploy;
- Facturación;
- Billing;
- checkout;
- Gema Maestra.

### Objetivo futuro

Revisar durante fase de:

```text
registro
onboarding
entrada al sistema
```

### Criterio de cierre

El warning desaparece sin alterar flujo de registro ni estado de entrada.

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

## MEDIA — Gemas conectadas a acciones intensivas

Prioridad: optimización estratégica.

### Estado

`readinessScore` representa madurez del proyecto.

Las Gemas representan capacidad operativa visible para el usuario.

La capa técnica puede seguir usando créditos internamente si el backend lo requiere.

No deben mezclarse:

```text
readinessScore → madurez del proyecto
Gemas → capacidad operativa / coste visible
créditos técnicos → contrato interno si procede
```

### Objetivo

Conectar cada acción lifecycle con un nivel de coste:

- none;
- low;
- medium;
- high;
- premium.

### Criterio de cierre

El usuario debe entender cuándo una mejora consume Gemas y por qué.

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

---

## ALTA — Saneamiento de app interna posterior a Nuevo Proyecto

Prioridad: alta.

### Estado actual

Los CTAs internos principales de “Nuevo proyecto” ya no apuntan a `/flow`.

La creación interna se redirige al Dashboard Launcher moderno.

Facturación ya fue alineada con Informe Maestro Gold, Gema Maestra, planes Pro/Growth/AI Master y continuidad hacia Builder.

### Pendiente

Queda pendiente completar el saneamiento de la app interna para que el usuario no vuelva al modelo antiguo de informe/blueprint como centro del producto.

### Siguientes piezas

1. Resumen premium con Gema Maestra.
2. Reordenar Dashboard como centro premium de creación y continuidad.
3. Saneamiento del detalle de proyecto.
4. Reposicionar informe/PDF como salida premium, no como centro de navegación.
5. Reclasificar `/flow` como legacy, diagnóstico puntual o retirarlo por fases.
6. Mantener Oportunidades como módulo de plantillas/rutas desbloqueables por plan.

### Criterio de cierre

La app interna debe cumplir:

```text
Dashboard → crear o inspirar proyecto
Builder → construir y mejorar
Proyectos → continuar en Builder
Informe/PDF → salida premium
Facturación → pagos, Gemas y planes
Flow → no visible como creación principal
```

---

## ALTA — Siguiente saneamiento de app interna: detalle de proyecto

Prioridad: alta.

### Estado actual

Dashboard y Proyectos ya priorizan continuar en Builder.

### Pendiente

El detalle de proyecto todavía conserva lógica antigua de informe, blueprint y PDF como centro visual.

### Siguiente pieza

Saneamiento de:

- `frontend/src/features/projects/detail/ProjectDetailPage.js`
- `frontend/src/features/projects/detail/sections/ProjectHeaderSection.js`
- `frontend/src/features/projects/detail/sections/PremiumReportSection.js`
- `frontend/src/features/projects/detail/sections/BlueprintSection.js`

### Criterio de cierre

El detalle debe mostrar arriba:

```text
Continuar en Builder
```

El informe debe quedar reposicionado como salida premium, no como centro principal de navegación.

---

## ORDEN OPERATIVO ACTUALIZADO

A fecha 2026-04-28, el orden recomendado queda así:

```text
1. Resumen premium con Gema Maestra
2. Barrido de lenguaje fuera de Billing
3. Historial de pagos con papelera admin
4. Oportunidades / plantillas desbloqueables
5. RegisterPage warning
6. Builder lifecycle → mutaciones reales
```

### Nota de prioridad

El punto 6 sigue siendo el más crítico estructuralmente.

Los puntos 1 a 5 son saneamientos y optimizaciones visibles que permiten llegar al Builder con una app interna más coherente, limpia y monetizable.

No deben convertirse en rediseños globales ni en frentes abiertos indefinidos.

---

## NO REABRIR SIN INCIDENCIA

No reabrir ahora:

```text
PlanCard
CreditSummaryCard
CurrentPlanCard
PlansGrid
EntryOfferCard
BillingPage
SuggestedPlanBanner
billing.constants.js
billing.utils.js
```

Salvo:

- bug funcional;
- checkout roto;
- solape visible;
- lenguaje antiguo reaparecido;
- build roto.