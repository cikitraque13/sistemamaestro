# 02-PENDIENTES-PRIORIZADOS

## Estado del documento

- Estado: activo
- Tipo: backlog priorizado canónico
- Alcance: proyecto completo `Sistema Maestro`
- Fecha de actualización: 2026-05-02
- Objetivo: ordenar el trabajo pendiente por prioridad real, dependencia y criterio de cierre, sin mezclar estructura, higiene, producto, monetización y despliegue.

---

## 1. Función de este documento

Este documento existe para responder con claridad a una sola pregunta:

**¿Qué hay que hacer ahora, en qué orden y con qué dependencia?**

No fija rutas canónicas.
No sustituye decisiones cerradas.
No actúa como inventario técnico.
No reemplaza procedimientos operativos.
No registra incidencias aisladas.

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

Los ajustes cosméticos no deben abrir frente mientras el sistema siga en fase de afinado funcional, monetizable y estructural.

---

## 3. Estado operativo actualizado

A fecha 2026-05-02, el proyecto ya tiene cerradas las siguientes microfases:

- Facturación / Gema Maestra / Centro de Capacidad Gold.
- Resumen premium con Gema Maestra.
- Proyectos como capa de continuidad.
- Oportunidades V1 saneadas como biblioteca de rutas construibles.
- Gratis con 10 gemas iniciales reales.
- Home Gold.
- Home Mobile Gold.
- Scroll-to-top para páginas legales.

### Estado consolidado

Queda registrado que:

- la base documental canónica ya está operativa;
- `docs/control/` funciona como memoria estructural real;
- `frontend/src/features/` queda reconocido como capa principal del frontend;
- Builder, Home, App Shell, Dashboard, Billing, Projects, Opportunities y Reports forman parte del núcleo funcional real;
- `frontend/src/features/builder/` queda reconocido como ruta funcional canónica del Builder;
- `frontend/src/features/builder/lifecycle/` queda creado como subcapa canónica de maduración de proyectos;
- `builderAgentResponseComposer.js`, `BuilderAgentPane.js` y `builderAiAdapter.js` ya quedan conectados al lifecycle;
- Builder Runtime queda conectado a Builder AI/OpenAI como capa de interpretación y generación estructurada;
- `BuilderBuildKernel` queda redefinido como capa de ejecución, normalización y consolidación, no como sustituto de OpenAI;
- Dashboard ya prioriza continuidad hacia Builder;
- Proyectos ya queda saneado como capa de continuidad;
- Facturación queda alineada como Centro de Capacidad Gold;
- Gema Maestra / Gemas quedan consolidadas como lenguaje visible de capacidad operativa;
- Informe Maestro Gold queda conectado con Builder y 10 gemas iniciales;
- Gratis queda aprobado con 10 gemas iniciales reales;
- Pro, Growth y AI Master 199 quedan como niveles de continuidad operativa;
- Home queda alineada con Sistema Maestro Gold;
- Home móvil queda compacta, validada y separada funcionalmente de Desktop;
- Oportunidades V1 permite 2 oportunidades completas para Free y 10 para Admin/Premium;
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

---

## 4. Lectura operativa actual

El sistema ya tiene coherencia suficiente en:

```text
Home
→ registro gratis con 10 gemas
→ Dashboard
→ Oportunidades
→ Proyectos
→ Builder
→ Facturación / Gema Maestra
```

El siguiente frente visible aprobado no es abrir una nueva capa grande.

El siguiente frente visible aprobado es mejorar cómo se muestran las oportunidades bloqueadas al usuario gratuito.

### Regla de foco

No abrir más de un frente visible a la vez.

El orden actual debe proteger:

```text
primer valor
→ continuidad
→ percepción premium
→ monetización
→ Builder como centro real
```

---

## 5. Cerrado — Microfases que no deben reabrirse sin incidencia

Estas piezas ya están cerradas y no deben volver a abrirse salvo bug funcional, regresión visible, build roto, checkout roto o inconsistencia real detectada en producción.

### Facturación / Gema Maestra / Centro de Capacidad Gold

Estado: cerrado.

Archivos principales:

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

Resultado cerrado:

- Billing funciona como Centro de Capacidad Gold.
- Gema Maestra / Gemas sustituyen el lenguaje visible principal de créditos.
- Informe Maestro Gold comunica entrada puntual de 6,99 €.
- Informe Maestro Gold conecta con Builder y 10 gemas iniciales.
- Pro, Growth y AI Master 199 quedan como niveles de continuidad operativa.
- La card Free no aparece como card principal dentro de la app.
- Checkout y despliegue por microfase quedan validados.

---

### Resumen premium con Gema Maestra

Estado: cerrado.

Archivos principales:

```text
frontend/src/features/dashboard/components/DashboardCreditsPanel.js
frontend/src/features/dashboard/components/DashboardStatusPanel.js
```

Resultado cerrado:

- No domina el lenguaje visible de créditos.
- Capacidad operativa aparece como Gema Maestra / Gemas.
- CTA hacia facturación queda como facturación y gemas.
- Cards de capacidad y continuidad quedan compactadas.
- Cards superiores Proyectos / Blueprints / Plan actual quedan compactadas.

---

### Proyectos como capa de continuidad

Estado: cerrado.

Archivo principal:

```text
frontend/src/features/projects/ProjectsPage.js
```

Resultado cerrado:

- Barra de búsqueda elevada visualmente.
- Lupa con acción/foco real.
- Filtro de rutas corregido con alias reales.
- Ruta técnica `sell` se muestra como `Vender y cobrar`.
- Dropdown nativo sustituido por dropdown premium.
- Empty state diferencia no tener proyectos de no tener resultados.

---

### Oportunidades V1

Estado: cerrado como V1.

Archivos principales:

```text
frontend/src/features/opportunities/OpportunitiesPage.js
backend/app/domain/opportunities.py
```

Resultado cerrado:

- Lenguaje de monetización saneado.
- No promete consultoría operativa ni ejecución manual externa.
- Backend amplía a 10 oportunidades iniciales.
- Free ve 2 oportunidades completas.
- Admin/premium ve las 10 oportunidades.
- Desbloquear desde Oportunidades recomienda Pro, no AI Master por defecto.

---

### Gratis con 10 gemas iniciales reales

Estado: cerrado.

Archivos principales:

```text
backend/app/core/config.py
backend/app/services/credits.py
frontend/src/content/pricingContent.js
frontend/src/features/billing/billing.constants.js
frontend/src/features/billing/billing.utils.js
```

Resultado cerrado:

- Railway tiene `CREDITS_FREE=10`.
- Backend concede 10 gemas iniciales reales una sola vez al usuario sin historial previo.
- Gratis deja de comunicar `Sin builder` / `Sin gemas`.
- Gratis pasa a comunicar `Builder limitado + 10 gemas iniciales`.
- Frontend diferencia 10 gemas iniciales de gemas incluidas recurrentes.

Escalera aprobada:

```text
Gratis → 10 gemas iniciales
Informe Maestro Gold → +10 gemas y lectura guiada
Pro → 60 gemas incluidas
Growth → 220 gemas incluidas
AI Master 199 → 600 gemas incluidas
```

---

### Home Gold y Home Mobile Gold

Estado: cerrado y validado en web.

Archivos principales:

```text
frontend/public/index.html
frontend/src/App.js
frontend/src/components/Logo.js
frontend/src/features/home/HomePage.js
frontend/src/features/home/components/HomeNav.js
frontend/src/features/home/components/HomeFooter.js
frontend/src/features/home/sections/PricingSection.js
frontend/src/features/home/sections/HomeEntrySection.js
frontend/src/features/home/sections/LeadCaptureSection.js
```

Resultado cerrado:

- Home pricing alineado con Gemas / Gema Maestra.
- Logo Gold en header, footer, legales y favicon.
- Favicon usa `sistema_maestro_gold_logo.png`.
- Páginas legales cargan desde arriba con `ScrollToTop`.
- Radar IA usa dropdowns premium.
- Home móvil queda compacta y validada.

Regla móvil aprobada:

```text
Móvil = descubrir, entender, confiar, registrarse y preparar entrada.
Desktop = explicar más, permitir entrada guiada y trabajar con más profundidad.
```

---

## 6. Orden operativo actualizado

A fecha 2026-05-02, el orden recomendado queda así:

```text
1. Oportunidades bloqueadas con preview premium
2. Barrido restante de lenguaje visible fuera de Billing
3. Historial de pagos con papelera admin
4. Oportunidades / plantillas desbloqueables V2
5. RegisterPage warning
6. Detalle de proyecto como continuidad hacia Builder
7. Builder lifecycle → mutaciones reales
```

### Nota de prioridad

El punto 7 sigue siendo el frente más importante a nivel estructural.

Pero el siguiente frente visible aprobado es el punto 1:

```text
Oportunidades bloqueadas con preview premium
```

Motivo:

- viene directamente después de Home Gold + Gratis con 10 gemas + Oportunidades V1;
- afecta percepción de valor en usuario Free;
- conecta con monetización hacia Pro;
- no requiere abrir Builder ni backend complejo;
- mejora conversión sin inflar el sistema.

---

# 1. ALTA — Oportunidades bloqueadas con preview premium

Prioridad: alta.
Tipo: optimización estratégica visible.
Estado: siguiente frente operativo aprobado.

---

## Problema

Las oportunidades bloqueadas en usuario gratuito pueden parecer demasiado vacías, pobres o decorativas.

Si las 8 oportunidades bloqueadas se perciben como skeletons vacíos, el módulo pierde fuerza como palanca de conversión.

---

## Objetivo

Que las oportunidades bloqueadas insinúen valor real sin revelar todo.

El usuario Free debe entender:

```text
hay más rutas útiles
→ están bloqueadas
→ tienen valor construible
→ Pro desbloquea el catálogo completo
```

---

## Regla aprobada

Usuario Free:

```text
2 oportunidades desbloqueadas completas
8 oportunidades bloqueadas con valor insinuado
```

Usuario Admin/Premium:

```text
10 oportunidades completas
```

---

## Intervención viable

No rediseñar todo Oportunidades.

No crear marketplace.

No abrir backend salvo necesidad justificada.

Tocar únicamente la presentación de cards bloqueadas para que muestren:

- pista de título o tipo;
- ruta asociada;
- dificultad;
- potencial o beneficio insinuado;
- niebla premium;
- CTA hacia desbloqueo.

---

## Salida visible esperada

La oportunidad bloqueada debe sentirse como una ruta real, no como un hueco vacío.

Ejemplo de lectura deseada:

```text
Ruta: Vender y cobrar
Tipo: Landing monetizable
Dificultad: Media
Potencial: Alto

Preview bloqueada:
Una ruta para convertir una oferta concreta en una página preparada para captar interés y avanzar hacia venta.

CTA:
Desbloquear oportunidades con Pro
```

---

## No debe revelar

Las oportunidades bloqueadas no deben mostrar:

- contenido completo;
- pasos internos accionables;
- blueprint completo;
- prompts completos;
- estructura completa;
- propuesta lista para copiar;
- suficiente valor como para usar la oportunidad sin desbloquear.

---

## Dependencias

Frontend:

```text
frontend/src/features/opportunities/OpportunitiesPage.js
```

Backend:

```text
backend/app/domain/opportunities.py
```

Regla:

- No tocar backend salvo que falten campos mínimos para pintar preview bloqueada.
- Mantener la lógica actual de acceso.
- Mantener Free con 2 completas.
- Mantener Admin/Premium con 10 completas.

---

## Monetización

Sí aplica.

Este frente conecta directamente con:

- upgrade a Pro;
- percepción de catálogo;
- continuidad hacia plantillas V2;
- relación futura oportunidad → plantilla → Builder → plan.

No debe empujar AI Master por defecto.

La recomendación de desbloqueo desde Oportunidades sigue siendo:

```text
Pro
```

---

## Criterio de cierre

El frente queda cerrado si:

- Free sigue viendo solo 2 oportunidades completas;
- Free ve 8 oportunidades bloqueadas con valor insinuado;
- Admin/Premium sigue viendo 10 oportunidades completas;
- las bloqueadas no parecen skeletons vacíos;
- las bloqueadas muestran ruta, tipo, dificultad y niebla premium;
- el CTA de desbloqueo sigue funcionando;
- no se revela contenido completo;
- no se introduce backend nuevo innecesario;
- build pasa;
- no se rompe Oportunidades V1.

---

## Fuera de alcance

No hacer en esta fase:

- marketplace de plantillas;
- compra individual por oportunidad;
- generación dinámica de oportunidades con IA;
- filtros avanzados;
- categorías nuevas;
- backend complejo de desbloqueos;
- Builder automático desde oportunidad bloqueada;
- rediseño completo de Oportunidades.

---

# 2. MEDIA-ALTA — Barrido restante de lenguaje visible fuera de Billing

Prioridad: media-alta.
Tipo: optimización estratégica.
Estado: pendiente.

---

## Contexto

Ya se cerraron varias zonas:

- Dashboard QuickActions.
- Dashboard Builder Launcher.
- Home pricing.
- Home mobile.
- Billing.
- Resumen premium.

Aun así, pueden quedar zonas visibles con lenguaje antiguo de créditos.

---

## Objetivo

Auditar zonas visibles donde pueda seguir apareciendo lenguaje antiguo de créditos y decidir si corresponde sustituirlo por Gemas / Gema Maestra.

---

## Regla aprobada

```text
Usuario visible → Gemas / Gema Maestra
Técnico interno → créditos si el contrato lo requiere
```

No tocar playbooks, clasificadores ni categorías técnicas si `credits` funciona como contrato interno.

---

## Archivos o zonas probables

```text
frontend/src/features/app-shell/components/BuilderCreditBar.js
frontend/src/features/home/components/BuilderCreditBar.js
frontend/src/features/dashboard/
frontend/src/features/reports/
frontend/src/features/settings/
```

La lista no implica intervención automática.

Primero se audita el contexto visible.

---

## Intervención viable

Actuar solo donde el usuario final lea lenguaje antiguo como eje de producto.

No cambiar nombres técnicos si:

- están ligados a backend;
- son contratos internos;
- afectan persistencia;
- son categorías de consumo;
- no aparecen como copy visible.

---

## Criterio de cierre

El barrido queda cerrado si:

- no aparece “créditos” como lenguaje comercial principal en zonas visibles de usuario;
- Gemas / Gema Maestra domina donde se habla de capacidad operativa;
- créditos queda solo como término técnico interno cuando sea necesario;
- no se rompen contratos técnicos;
- build pasa.

---

## Fuera de alcance

No hacer en esta fase:

- renombrado masivo de archivos;
- migración de base de datos;
- cambios en contratos backend;
- cambios en playbooks/clasificadores;
- rediseño visual global.

---

# 3. MEDIA — Historial de pagos con papelera admin

Prioridad: media.
Tipo: mejora funcional controlada.
Estado: pendiente.

---

## Problema

Durante validaciones y pagos de prueba, el historial de pagos puede quedar contaminado con registros pendientes, fallidos o de test.

Esto dificulta revisar pagos reales desde administrador.

---

## Objetivo

Permitir limpieza protegida de registros de prueba o pendientes desde administrador.

---

## Intervención viable

Añadir una acción admin controlada para limpiar registros no reales.

Opciones posibles:

1. Papelera por fila.
2. Borrado solo de pagos pendientes.
3. Borrado solo de pagos de prueba.
4. Confirmación antes de eliminar.
5. Limpieza admin protegida.

---

## Dependencias

Puede requerir:

- rol admin;
- confirmación explícita;
- posible endpoint backend;
- actualización de estado local;
- protección contra borrado accidental;
- criterio claro para no afectar pagos reales.

---

## Regla

No mezclar con mejoras visuales de Facturación.

No reabrir Billing Gold para introducir esta pieza.

Debe ser un microfrente funcional separado.

---

## Criterio de cierre

El frente queda cerrado si:

- solo admin puede limpiar registros;
- existe confirmación antes de eliminar;
- no se afectan pagos reales;
- no se rompe historial operativo;
- la UI refleja el cambio;
- build pasa;
- backend, si se toca, queda acotado a esta función.

---

## Fuera de alcance

No hacer en esta fase:

- rediseño de Billing;
- nuevas métricas financieras;
- exportación contable;
- panel avanzado de administración;
- modificación de checkout.

---

# 4. ALTA — Oportunidades / plantillas desbloqueables V2

Prioridad: alta.
Tipo: optimización estratégica.
Estado: pendiente posterior a preview premium de bloqueadas.

---

## Contexto

Oportunidades V1 ya existe como biblioteca inicial de rutas construibles.

La siguiente evolución natural es convertirla progresivamente en un sistema de plantillas o rutas desbloqueables.

---

## Objetivo

Evolucionar Oportunidades hacia un sistema de plantillas/rutas desbloqueables sin convertirlo en marketplace genérico.

Debe reforzar:

```text
oportunidad
→ plantilla
→ Builder
→ continuidad
→ plan
```

---

## Regla de producto

No convertir Oportunidades en marketplace genérico.

No vender “catálogo por catálogo”.

Cada oportunidad o plantilla debe tener conexión clara con construcción real en Builder.

---

## Líneas futuras posibles

```text
plantillas de oportunidad
plantillas de landing
plantillas de web
plantillas de app
chatbot / asistente web
rutas sectoriales
plantillas por plan
```

---

## Intervención viable V2

Definir una primera arquitectura funcional de desbloqueo:

- qué se desbloquea;
- por qué plan;
- cómo se muestra;
- cómo se conecta con Builder;
- qué ocurre si el usuario no tiene acceso;
- qué valor se insinúa antes del desbloqueo.

---

## Dependencias

Puede requerir:

- revisión de `backend/app/domain/opportunities.py`;
- campos de plan o nivel;
- lógica frontend de acceso;
- CTA hacia Pro/Growth/AI Master según caso;
- conexión futura con Builder;
- copy visible claro.

---

## Criterio de cierre

El frente queda cerrado si:

- el usuario entiende qué plantilla puede usar;
- entiende por qué está bloqueada o desbloqueada;
- entiende qué plan la desbloquea;
- puede continuar hacia Builder cuando tiene acceso;
- no se abre marketplace genérico;
- no se prometen plantillas que no construyen nada;
- build pasa.

---

## Fuera de alcance

No hacer todavía:

- tienda pública de plantillas;
- pagos individuales por plantilla;
- sistema de afiliados;
- plantillas generadas infinitamente por IA;
- navegación compleja por categorías;
- editor visual de plantillas independiente del Builder.

---

# 5. MEDIA — RegisterPage warning

Prioridad: media.
Tipo: higiene técnica no bloqueante.
Estado: pendiente.

---

## Estado

Existe un warning de React en `RegisterPage.js` relacionado con dependencias de `useMemo`.

---

## Impacto

No bloquea:

- build;
- deploy;
- Facturación;
- Billing;
- checkout;
- Gema Maestra;
- Home Gold;
- Oportunidades.

---

## Regla

No tocar hasta abrir fase de registro/onboarding.

No abrir este warning como frente aislado si no hay intervención sobre entrada al sistema.

---

## Objetivo futuro

Resolverlo durante una fase de:

```text
registro
onboarding
entrada al sistema
```

---

## Criterio de cierre

El warning desaparece sin alterar:

- flujo de registro;
- estado de entrada;
- concesión de 10 gemas iniciales;
- login;
- navegación posterior al registro;
- build.

---

## Fuera de alcance

No hacer en esta fase:

- rediseño de RegisterPage;
- nuevo onboarding;
- cambios de auth;
- cambios de concesión de gemas;
- modificación de pricing.

---

# 6. ALTA — Detalle de proyecto como continuidad hacia Builder

Prioridad: alta.
Tipo: optimización estratégica de continuidad.
Estado: pendiente.

---

## Problema

Dashboard y Proyectos ya priorizan continuar en Builder.

Sin embargo, el detalle de proyecto todavía puede conservar lógica antigua de informe, blueprint o PDF como centro visual.

Eso puede romper la dirección actual del sistema:

```text
Proyecto
→ continuar construcción
→ Builder
```

---

## Objetivo

Reposicionar el detalle de proyecto como capa de continuidad hacia Builder.

El informe debe quedar como salida premium, no como centro principal de navegación.

---

## Archivos candidatos

```text
frontend/src/features/projects/detail/ProjectDetailPage.js
frontend/src/features/projects/detail/sections/ProjectHeaderSection.js
frontend/src/features/projects/detail/sections/PremiumReportSection.js
frontend/src/features/projects/detail/sections/BlueprintSection.js
```

---

## Intervención viable

No rediseñar todo el detalle.

Actuar en jerarquía funcional:

1. Continuar en Builder arriba.
2. Estado del proyecto claro.
3. Informe como salida premium secundaria.
4. Blueprint como apoyo, no como destino principal.
5. CTA principal hacia Builder.

---

## Resultado esperado

El detalle debe mostrar arriba:

```text
Continuar en Builder
```

Y debe dejar claro:

```text
el proyecto se continúa construyendo en Builder
el informe es una salida premium
el blueprint es una referencia de apoyo
```

---

## Criterio de cierre

El frente queda cerrado si:

- el CTA principal del detalle es continuar en Builder;
- informe/PDF no domina el primer bloque;
- blueprint no actúa como centro del producto;
- la navegación no contradice Dashboard ni Proyectos;
- el usuario entiende cómo retomar construcción;
- build pasa.

---

## Fuera de alcance

No hacer en esta fase:

- nuevo sistema de informes;
- rediseño completo del detalle;
- generación nueva de PDF;
- cambios de backend;
- cambios en Builder;
- nueva navegación global.

---

# 7. CRÍTICO — Builder lifecycle → mutaciones reales

Prioridad: crítica estructural.
Tipo: frente estructural de fondo.
Estado: pendiente crítico.

---

## Estado actual

El Builder ya tiene una capa `builder/lifecycle` creada, saneada y conectada al chat.

Builder Runtime ya puede recibir salida de Builder AI/OpenAI y adaptarla al flujo interno.

El chat ya debe proponer mejoras por fase del proyecto, no acciones técnicas genéricas.

---

## Problema pendiente

Las acciones lifecycle todavía deben conectarse completamente con construcción real acumulativa.

No basta con que el chat proponga:

- configurar presupuesto;
- configurar WhatsApp;
- añadir FAQ;
- profundizar oferta;
- personalizar marca;
- preparar seguimiento.

Cada acción aceptada debe producir mutación real en:

- `BuilderBuildState`;
- preview;
- código;
- estructura;
- readinessScore;
- siguientes decisiones.

---

## Objetivo

Cuando el usuario acepte una mejora, el sistema debe:

1. registrar la acción lifecycle aplicada;
2. actualizar `readinessScore`;
3. actualizar `BuilderBuildState`;
4. cambiar la preview;
5. cambiar el código;
6. cambiar la estructura si procede;
7. ocultar la acción ya aplicada;
8. mostrar la siguiente mejora correspondiente;
9. evitar repetir eternamente las mismas opciones.

---

## Flujo esperado

```text
primera versión visible
→ configurar conversión
→ reforzar confianza
→ profundizar oferta
→ personalizar marca
→ preparar seguimiento
→ estabilizar código y estructura
→ preparar salida técnica solo cuando el proyecto esté maduro
```

---

## Cadena funcional esperada

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

## Archivos prioritarios

```text
frontend/src/features/builder/state/builderMutationRegistry.js
frontend/src/features/builder/state/builderBuildKernel.js
frontend/src/features/builder/state/builderOutputMap.js
frontend/src/features/builder/utils/builderCodeTemplates.js
```

---

## Archivos ya conectados que no deben reabrirse salvo incidencia

```text
frontend/src/features/builder/intelligence/builderAgentResponseComposer.js
frontend/src/features/builder/components/BuilderAgentPane.js
frontend/src/features/builder/api/builderAiAdapter.js
frontend/src/features/builder/lifecycle/
```

---

## Criterio de cierre

Para una landing de taller, el recorrido debe avanzar así:

1. Primera versión visible.
2. Configurar solicitud de presupuesto.
3. Configurar WhatsApp o formulario sectorial.
4. Añadir FAQ, garantías y confianza.
5. Profundizar oferta de servicios.
6. Personalizar marca.
7. Preparar seguimiento de presupuestos.
8. Preparar salida técnica solo cuando el proyecto esté maduro.

La acción aceptada debe modificar:

- preview;
- código;
- estructura;
- estado acumulado;
- score de madurez;
- siguiente decisión.

---

## Prohibición

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

---

## Relación con Gemas

No mezclar:

```text
readinessScore → madurez del proyecto
Gemas → capacidad operativa / coste visible
créditos técnicos → contrato interno si procede
```

Las Gemas podrán conectarse a acciones intensivas después de que las mutaciones reales funcionen de forma estable.

---

## Salida técnica

Exportación, GitHub, deploy y dominio no deben aparecer como propuesta temprana para una landing sencilla.

Solo deben aparecer cuando:

- el proyecto esté suficientemente maduro;
- el usuario lo pida explícitamente;
- o el tipo de proyecto lo requiera.

---

## Fuera de alcance

No hacer dentro de esta fase inicial:

- deploy real;
- exportación comercial final;
- integración GitHub completa;
- dominio;
- backend genérico para todos los proyectos;
- marketplace de componentes;
- reescritura total del Builder.

---

# 8. Regla de lenguaje visible

La regla global de lenguaje queda así:

```text
Usuario visible → Gemas / Gema Maestra
Técnico interno → créditos si el contrato lo requiere
```

### Aplicación

Debe usarse Gemas / Gema Maestra en:

- Billing visible;
- Dashboard visible;
- Home visible;
- Pricing visible;
- CTAs de capacidad;
- comunicaciones de plan;
- mensajes de entrada gratuita;
- Informe Maestro Gold.

Puede mantenerse créditos en:

- contratos backend;
- variables de entorno;
- persistencia;
- configuración técnica;
- catálogos internos de consumo;
- playbooks o clasificadores si `credits` funciona como categoría técnica.

---

# 9. Regla de monetización

No convertir todo en premium.

La primera experiencia debe demostrar valor antes de pedir pago.

La secuencia monetizable aprobada es:

```text
Gratis con 10 gemas iniciales
→ primera construcción limitada
→ Informe Maestro Gold como entrada puntual
→ Pro como desbloqueo serio
→ Growth como continuidad
→ AI Master 199 como capa superior
```

### Aplicación inmediata

Oportunidades bloqueadas debe empujar hacia:

```text
Pro
```

No hacia AI Master por defecto.

---

# 10. Regla de Builder como centro

Toda mejora pendiente debe respetar esta dirección:

```text
entrada del usuario
→ interpretación
→ diagnóstico mínimo
→ activación
→ BuilderBuildKernel
→ BuilderBuildState
→ preview / código / estructura
→ siguiente mejora
→ créditos técnicos o Gemas si hay acción intensiva
→ exportación o deploy solo si procede
```

El Builder sigue siendo el centro de construcción.

No debe ser desplazado por:

- informes;
- PDFs;
- blueprints;
- oportunidades;
- plantillas;
- dashboard;
- billing;
- home.

Esas capas deben alimentar continuidad hacia Builder, no sustituirlo.

---

# 11. No reabrir sin incidencia

No reabrir ahora:

```text
BillingPage
EntryOfferCard
CreditSummaryCard
CurrentPlanCard
PlansGrid
PlanCard
SuggestedPlanBanner
billing.constants.js
billing.utils.js
DashboardCreditsPanel
DashboardStatusPanel
ProjectsPage
OpportunitiesPage V1
HomePage
HomeNav
HomeFooter
PricingSection
HomeEntrySection
LeadCaptureSection
Logo
ScrollToTop
```

Salvo:

- bug funcional;
- checkout roto;
- solape visible real;
- lenguaje antiguo reaparecido;
- build roto;
- regresión en producción;
- contradicción con documento de decisiones cerradas.

---

# 12. Resumen ejecutivo del backlog actual

El backlog queda limpio y ordenado así:

```text
1. Mejorar percepción de valor en oportunidades bloqueadas.
2. Barrer lenguaje visible restante fuera de Billing.
3. Añadir limpieza admin protegida en historial de pagos.
4. Evolucionar Oportunidades hacia plantillas/rutas desbloqueables V2.
5. Resolver RegisterPage warning cuando toque registro/onboarding.
6. Reposicionar detalle de proyecto hacia continuidad en Builder.
7. Ejecutar lifecycle del Builder como mutaciones reales acumulativas.
```

La decisión inmediata es abrir únicamente:

```text
Oportunidades bloqueadas con preview premium
```

No abrir todavía:

```text
Plantillas V2
Detalle de proyecto
Builder lifecycle
Historial de pagos
RegisterPage
```

hasta cerrar la presentación premium de oportunidades bloqueadas para Free.

---
