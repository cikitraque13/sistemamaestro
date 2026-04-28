# 01-DECISIONES-CERRADAS

## Estado del documento

- Estado: activo
- Tipo: decisiones cerradas canónicas
- Alcance: proyecto completo `Sistema Maestro`
- Objetivo: congelar las decisiones estructurales ya aprobadas para evitar solapes, regresiones y reaperturas innecesarias.

---

## 1. Función de este documento

Este documento existe para registrar únicamente decisiones ya cerradas.

No contiene:

- hipótesis
- ideas abiertas
- tareas pendientes
- pruebas
- borradores
- discusiones

Toda entrada aquí debe cumplir esta regla:

**decisión ya tomada + criterio claro + efecto operativo real**

---

## 2. Regla de gobierno del sistema

### Decisión cerrada 01

Sistema Maestro no debe crecer por acumulación de arreglos.

### Regla aprobada

El proyecto se gobierna con esta secuencia:

1. control estructural
2. clasificación
3. canonicidad
4. higiene técnica
5. reanudación del producto

### Efecto operativo

No se aprueban cambios que rompan este orden.

---

## 3. Carpeta canónica de gobierno documental

### Decisión cerrada 02

La carpeta canónica de gobierno del proyecto es:

`docs/control/`

### Efecto operativo

No se aprueban:

- carpetas paralelas de control
- memorias estructurales repartidas
- usar el chat como memoria canónica del sistema

---

## 4. Fuente real del sistema

### Decisión cerrada 03

A nivel de sistema, las rutas reconocidas como base real actual son:

- `frontend/`
- `backend/`
- `docs/`

### Efecto operativo

El proyecto deja de interpretarse como el volumen bruto del árbol local.

---

## 5. Fuente real del frontend

### Decisión cerrada 04

Dentro del frontend, las rutas fuente reales aprobadas son:

- `frontend/src/`
- `frontend/public/`

### Efecto operativo

Las decisiones de producto visible y evolución cliente deben referirse a esas rutas y no a artefactos regenerables.

---

## 6. Capa principal del producto frontend

### Decisión cerrada 05

La capa principal de producto enrutable del frontend es:

`frontend/src/features/`

### Efecto operativo

Todo lo nuevo enrutable del producto debe nacer en `features` o en una ruta canónica equivalente aprobada.

---

## 7. Estado de `frontend/src/pages`

### Decisión cerrada 06

`frontend/src/pages/` deja de ser capa principal de producto.

Queda aprobada solo como residual temporal para contenido no principal ya validado.

### Efecto operativo

No se aprueban nuevas páginas de producto dentro de `frontend/src/pages/`.

---

## 8. Módulos funcionales reconocidos

### Decisión cerrada 07

Se reconocen como módulos reales del producto dentro de `frontend/src/features/`:

- `activation-flow`
- `app-shell`
- `auth`
- `billing`
- `builder`
- `dashboard`
- `flow`
- `home`
- `opportunities`
- `projects`
- `reports`
- `settings`

### Efecto operativo

Estos módulos forman parte del sistema real.

---

## 9. Builder como núcleo de producto

### Decisión cerrada 08

`builder` queda reconocido como pieza central del producto.

### Efecto operativo

Builder no debe tratarse como adorno ni demo secundaria.

---

## 10. App Shell como carcasa operativa

### Decisión cerrada 09

`app-shell` queda reconocido como carcasa operativa del sistema.

### Efecto operativo

Debe actuar como base para navegación, proyectos, créditos técnicos, Gemas visibles y módulos internos.

---

## 11. Home como entrada canónica del sistema

### Decisión cerrada 10

`home` queda reconocido como módulo canónico de entrada, activación y presentación del sistema.

### Efecto operativo

La Home deja de tratarse como landing aislada.

---

## 12. Backend como capa real

### Decisión cerrada 11

`backend/` queda reconocido como capa real y canónica del sistema a nivel raíz.

### Efecto operativo

Backend deja de tratarse como caja negra irrelevante.

---

## 13. Arquitectura modular interna del backend

### Decisión cerrada 12

La arquitectura canónica interna del backend se apoya en:

- `backend/app/`
- `backend/app/core/`
- `backend/app/db/`
- `backend/app/routers/`
- `backend/app/services/`

### Efecto operativo

La lógica servidora nueva debe crecer desde esta arquitectura modular.

---

## 14. Entrada canónica del backend

### Decisión cerrada 13

La entrada canónica del backend es:

- `backend/app/main.py`

### Referencia canónica de runtime

- `backend.app.main:app`

### Efecto operativo

Toda referencia principal de arranque, runtime o despliegue debe alinearse con esta verdad canónica.

---

## 15. Legacy runtime retirado del repo activo

### Decisión cerrada 14

Las siguientes piezas legacy ya fueron retiradas del repo activo:

- `backend/server.py`
- `railway/server_railway.py`
- `railway/requirements.txt`

### Estado real

Quedaron fuera del repo activo y pasaron a archivo de safety externo para cierre controlado del legado.

### Efecto operativo

- no forman parte del perímetro activo de runtime;
- no deben reintroducir una segunda verdad de arranque;
- no deben documentarse como vía activa del sistema.

---

## 16. Rutas retiradas del repo activo por saneo

### Decisión cerrada 15

Las siguientes rutas ya no forman parte del repo activo:

- `memory/`
- `test_reports/`

### Efecto operativo

No deben seguir tratándose como capas vivas del sistema.

---

## 17. Ruta auxiliar válida restante

### Decisión cerrada 16

La ruta `tests/` queda reconocida como auxiliar válida de soporte técnico.

### Efecto operativo

No es núcleo canónico, pero puede seguir utilizándose como soporte interno.

---

## 18. Higiene del root de frontend resuelta

### Decisión cerrada 17

La auditoría del root de `frontend/` queda cerrada con este resultado:

- `frontend/src/components/` se mantiene como capa válida de componentes compartidos;
- `frontend/plugins/health-check/` se mantiene como soporte técnico válido del toolchain;
- `frontend/README.md` queda eliminado por ser ruido genérico ajeno al proyecto real;
- `frontend/components/` no existe y no requiere acción.

### Efecto operativo

No debe reabrirse este frente salvo nueva incidencia real.

---

## 19. Safety externo archivado fuera del escritorio

### Decisión cerrada 18

La carpeta de safety externo deja de permanecer en el escritorio y queda archivada en una ruta estable fuera del repo activo.

### Efecto operativo

- el safety no contamina el repo;
- el safety no queda flotando en el escritorio;
- se conserva como red de seguridad temporal de esta fase.

---

## 20. Capa de IA como estructura puente/preparada

### Decisión cerrada 19

La ruta `backend/app/ai/` queda reconocida como parte estructural real del sistema, pero su estado actual es:

**puente / preparada, no runtime vivo de extremo a extremo**

### Incluye

- orquestador puente
- guards puente
- memoria puente
- telemetry puente
- schemas puente
- tools registry
- eval registry
- agentes mixtos entre vacíos y manifiesto/contrato

### Efecto operativo

- la IA no debe venderse internamente como capa viva equivalente al motor de consumo;
- no debe mezclarse con deploy ni runtime activo como si ya estuviera integrada;
- su activación futura requerirá fase propia.

---

## 21. Capa de créditos técnicos y consumo como sistema vivo

### Decisión cerrada 20

La ruta `backend/config/credits/` y su conexión con consumo, billing y payments quedan reconocidas como:

**capa activa real del sistema**

### Incluye

- catálogo de acciones
- tiers
- thresholds
- contratos request/response
- router de consumo
- motor de evaluación
- integración con balance de usuario
- integración con billing
- integración con payments y Stripe

### Efecto operativo

La capa técnica de créditos/consumo deja de tratarse como estructura semivaga o futura.

### Aclaración posterior

En capa visible de producto, especialmente en Billing, el lenguaje comercial y operativo pasa a ser **Gema Maestra / Gemas**.

La palabra créditos puede seguir existiendo como contrato técnico interno si el backend, la configuración o la persistencia lo requieren.

---

## 22. Gestor de paquetes aprobado en frontend

### Decisión cerrada 21

El gestor de paquetes aprobado para el frontend es:

**npm**

### Lockfile canónico

- `frontend/package-lock.json`

### Efecto operativo

No deben convivir dos verdades activas de dependencias.

---

## 23. Higiene mínima ya aprobada

### Decisión cerrada 22

Quedan fuera de Git las rutas sensibles y regenerables críticas ya identificadas.

### Incluye

- `frontend/.env.local`
- `frontend/node_modules/`

### Efecto operativo

El repo no debe absorber entorno local ni secretos.

---

## 24. Regla de commits

### Decisión cerrada 23

No se mezclan en un mismo commit:

- higiene técnica
- migración estructural
- cambios de producto
- cambios visuales
- documentación
- refactor paralelo

### Efecto operativo

Cada commit debe tener una finalidad principal única.

---

## 25. Regla de deploy

### Decisión cerrada 24

**No procede deploy final todavía.**

### Efecto operativo

Quedan bloqueados:

- deploy final
- release
- producción entendida como entrega comercial final
- push con intención de cierre final del producto

hasta que el sistema esté afinado, validado y sin frentes mezclados.

### Aclaración aprobada

Esta regla no impide deploys iterativos de validación por microfase cuando:

- el build pasa;
- el cambio está acotado;
- el commit tiene una finalidad única;
- Railway se usa para validar producción sin declarar release final.

---

## 26. Regla de prudencia estructural

### Decisión cerrada 25

No se borra, mueve o reclasifica una ruta no auditada a ciegas.

### Efecto operativo

Toda salida del repo activo debe basarse en clasificación y validación previa.

---

## 27. Regla documental

### Decisión cerrada 26

`docs/control/audit/` puede contener soporte de auditoría, pero no sustituye a los documentos canónicos principales.

### Efecto operativo

La autoridad doctrinal sigue viviendo en los documentos canónicos, no en dumps de trabajo.

---

## 28. Veredicto operativo base

Queda oficialmente cerrado que:

- la fuente real ya está separada del entorno regenerable;
- `frontend/src/features/` es la capa principal del frontend;
- `builder`, `home` y `app-shell` forman parte del núcleo real del producto;
- `backend/` es una capa canónica del sistema;
- `backend/app/` es la arquitectura modular interna del backend;
- `backend/app/main.py` es la entrada canónica del backend;
- `backend.app.main:app` es la referencia canónica de runtime;
- el legacy runtime ya fue retirado del repo activo;
- la higiene del root de frontend ya quedó resuelta;
- el safety externo ya quedó archivado fuera del escritorio;
- `backend/config/credits/` ya es capa activa real del sistema;
- `backend/app/ai/` ya está clasificada como capa puente/preparada;
- deploy final sigue bloqueado;
- el trabajo debe continuar de forma quirúrgica y por prioridades.

---

## 29. Regla de mantenimiento

Toda nueva decisión estructural aprobada debe añadirse aquí.

No entra en este documento nada provisional.
No entra nada pendiente.
No entra nada no validado.

---

## 30. BuilderBuildKernel como capa de ejecución y consolidación del Builder visible

### Decisión cerrada 27

`BuilderBuildKernel` queda aprobado como capa operativa de ejecución, normalización y consolidación del Builder visible.

### Regla aprobada

El Builder no debe gobernarse por copy suelto, mensajes del agente, `hubSummary`, `lastDelta`, `lastOperation`, fases de progreso ni plantillas aisladas.

Tampoco debe permitir que OpenAI gobierne directamente la experiencia visible sin pasar por la arquitectura de producto.

La arquitectura aprobada es:

```text
Builder AI / OpenAI
→ interpretación de intención
→ generación estructurada
→ Builder Project Lifecycle
→ selección de siguiente mejora
→ BuilderBuildKernel
→ mutación normalizada
→ BuilderBuildState
→ BuilderOutputMap
→ preview
→ código
→ estructura
→ siguientes decisiones
```

### Efecto operativo

Builder AI/OpenAI interpreta, razona y genera intención, copy, estructura o propuesta.

Builder Project Lifecycle ordena el recorrido de maduración del proyecto, bloquea acciones fuera de fase y decide qué mejora corresponde.

BuilderBuildKernel no sustituye a OpenAI. Su función es aplicar, normalizar, acumular y estabilizar los cambios para que la IA no produzca solo texto sin construcción real.

Toda acción del usuario o del agente debe producir al menos uno de estos efectos:

- cambio visible en preview;
- cambio coherente en código;
- cambio en estructura técnica;
- cambio de CTA;
- bloque nuevo;
- archivo nuevo;
- cambio de estado acumulado;
- siguiente decisión contextual distinta.

Si una acción solo produce texto del agente y no modifica preview, código, estructura o estado acumulado, no se considera construcción válida.

### Prohibición

Queda prohibido crear un megaarchivo con todo el conocimiento del Builder.

El kernel debe ser pequeño, modular y coordinador. El conocimiento debe vivir en lifecycle, registros, playbooks, presets, mapas de output, mutaciones, estructura y flujos de decisión.

### Criterio de cierre

Esta decisión queda cerrada a nivel arquitectónico.

Queda pendiente la implementación completa de mutaciones acumulativas para que cada acción lifecycle aceptada modifique:

- estado vivo;
- preview;
- código;
- estructura;
- readinessScore;
- siguientes decisiones.

Hasta entonces, no se aprueba tratar el Builder como cerrado comercialmente.

---

## 31. Builder Runtime conectado a Builder AI/OpenAI

### Decisión cerrada 28

Fecha: 2026-04-27

### Decisión

Builder Runtime queda conectado a Builder AI/OpenAI como capa de interpretación y generación estructurada.

La conexión no convierte a OpenAI en autoridad directa sobre la interfaz visible. OpenAI debe alimentar la arquitectura interna del Builder.

### Regla canónica

La relación aprobada es:

```text
input usuario
→ Builder AI / OpenAI
→ salida estructurada
→ adapter
→ lifecycle
→ kernel
→ estado acumulado
→ preview / código / estructura
```

### Efecto operativo

- OpenAI puede interpretar intención, sector, objetivo, tono, propuesta y siguiente acción.
- OpenAI no debe inyectar mejoras visibles sin pasar por lifecycle.
- OpenAI no debe saltarse guards, fases ni estado acumulado.
- El adapter debe convertir la salida IA en resultado compatible con el kernel.
- La preview no debe mostrar contenido interno del sistema.
- El chat guía, pregunta y propone.
- La preview construye.
- El código refleja.
- La estructura ordena.

### Límite de esta decisión

La conexión con Builder AI/OpenAI no cierra todavía la ejecución completa de mejoras acumulativas.

Queda pendiente que cada mejora aceptada genere mutación real en BuilderBuildState, preview, código y estructura.

---

## 32. Builder Project Lifecycle V1 conectado al chat

### Decisión cerrada 29

Fecha: 2026-04-27

### Decisión

Queda aprobado `Builder Project Lifecycle V1` como capa canónica de maduración de proyectos dentro del Builder.

El Builder no debe proponer mejoras sueltas ni repetir acciones genéricas. Debe guiar cada proyecto por un recorrido secuencial:

```text
entrada del usuario
→ clasificación del proyecto
→ primera versión visible
→ conversión
→ confianza
→ oferta
→ marca
→ salida técnica
```

### Archivos nuevos canónicos

Se crea la subcapa:

```text
frontend/src/features/builder/lifecycle/
```

Con estos archivos:

- `frontend/src/features/builder/lifecycle/builderProjectLifecycle.js`
- `frontend/src/features/builder/lifecycle/builderLifecycleActions.js`
- `frontend/src/features/builder/lifecycle/builderLifecycleGuards.js`
- `frontend/src/features/builder/lifecycle/builderLifecycleState.js`
- `frontend/src/features/builder/lifecycle/builderLifecycleResolver.js`

### Archivos conectados al lifecycle

Quedan alineados con esta capa:

- `frontend/src/features/builder/intelligence/builderAgentResponseComposer.js`
- `frontend/src/features/builder/components/BuilderAgentPane.js`
- `frontend/src/features/builder/api/builderAiAdapter.js`

### Reglas aprobadas

- Las siguientes mejoras visibles deben venir de `builder_lifecycle`.
- El chat del Builder debe proponer mejoras por fase del proyecto.
- Se muestran como máximo 3 mejoras visibles.
- No se debe proponer Google, backend, auth, dashboard, GitHub, deploy o dominio antes de la salida técnica, salvo intención explícita o proyecto técnico.
- `readinessScore` representa madurez del proyecto, no créditos técnicos consumidos.
- Los créditos técnicos / Gemas visibles quedan separados del score de madurez y se aplican como coste de acciones intensivas.
- OpenAI no debe inyectar un `decisionMessage` visible saltándose el lifecycle.
- El panel del agente no debe inventar fallback técnico si no hay decisión lifecycle válida.
- Se elimina mojibake de los conectores principales del chat.

### Criterio de cierre cumplido

- Los 5 archivos lifecycle existen.
- Los 5 archivos lifecycle quedan saneados y sin mojibake.
- `builderAgentResponseComposer.js` queda conectado a lifecycle.
- `BuilderAgentPane.js` pinta solo decisiones lifecycle.
- `builderAiAdapter.js` adapta la salida IA sin crear decisiones sueltas desde `nextAction`.
- El build frontend pasa correctamente.

### Límite de esta decisión

Esta decisión no cierra todavía la ejecución completa de mutaciones.

Queda pendiente que cada acción lifecycle aceptada por el usuario modifique de forma acumulativa:

- preview;
- código;
- estructura;
- estado de madurez;
- siguientes decisiones.

---

## 33. Navegación interna de Nuevo Proyecto hacia Dashboard Launcher

### Decisión cerrada 30

Fecha: 2026-04-27

### Decisión

Dentro de la aplicación interna, los CTAs principales de “Nuevo proyecto”, “Crear o abrir proyecto” y accesos rápidos de creación dejan de apuntar a `/flow`.

La entrada principal para crear proyectos dentro de la app pasa a ser:

```text
/dashboard
```

### Efecto operativo

Dashboard se consolida como lanzador interno de creación y continuidad.

`/flow` deja de ser la vía principal de creación dentro de la app.

---

## 34. Dashboard como continuidad hacia Builder

### Decisión cerrada 31

Fecha: 2026-04-27

### Decisión

El bloque de proyectos recientes del Dashboard deja de usar el detalle/informe como destino principal.

La continuidad principal del usuario pasa a ser:

```text
Dashboard / Resumen
→ Proyectos recientes
→ Continuar en Builder
→ /dashboard/builder?project_id=...
```

### Efecto operativo

El usuario debe volver al Builder como centro de continuidad, no quedar atrapado en informe/PDF como destino principal.

---

## 35. Facturación como Centro de Capacidad Gold

### Decisión cerrada 32

Fecha: 2026-04-28

### Decisión

`frontend/src/features/billing/` queda reconocido como módulo interno de monetización y capacidad operativa del sistema bajo el concepto visible:

```text
Centro de Capacidad Gold
```

Facturación deja de ser una pantalla genérica de planes y pasa a cumplir esta función dentro de la app:

```text
entrada puntual
→ Informe Maestro Gold
→ Gema Maestra / Gemas
→ plan activo
→ niveles de continuidad operativa
→ historial de pagos
```

### Efecto operativo

Facturación debe hablar el mismo idioma que:

- Dashboard premium;
- Informe Gold;
- Builder como continuidad principal;
- Sistema Maestro Gold;
- Gema Maestra como capacidad operativa.

No debe volver a presentarse como una tabla simple de precios, créditos visibles o pagos aislados.

---

## 36. Gema Maestra como lenguaje visible de capacidad operativa

### Decisión cerrada 33

Fecha: 2026-04-28

### Decisión

El lenguaje visible principal de capacidad operativa en Facturación pasa a ser:

```text
Gema Maestra
Gemas
gemas iniciales
gemas incluidas
gemas consumidas
gemas concedidas
```

El término “créditos” queda relegado a capa técnica, histórica o backend cuando sea necesario, pero no debe dominar la experiencia visible de Billing.

### Regla aprobada

En bloques visibles de Facturación, el usuario debe leer:

```text
Gema Maestra
Gemas
gemas incluidas
Sin gemas
capacidad operativa
```

No debe leer como lenguaje principal:

```text
Créditos
créditos incluidos
Créditos previstos
créditos iniciales
```

### Efecto operativo

La monetización interna gana coherencia premium y deja de parecer una pantalla financiera genérica.

---

## 37. Informe Maestro Gold como entrada puntual conectada a Builder

### Decisión cerrada 34

Fecha: 2026-04-28

### Decisión

`Informe Maestro Gold` queda aprobado como compra puntual de entrada al sistema.

Precio visible:

```text
6,99 € · pago único
```

Promesa aprobada:

```text
Compra puntual para convertir una idea, una URL o una oportunidad en una lectura premium con diagnóstico, dirección, prompt recomendado y 10 gemas iniciales para empezar en Builder.
```

### Regla aprobada

El Informe Maestro Gold no debe venderse como un PDF aislado ni como un resumen decorativo.

Debe funcionar como:

```text
diagnóstico premium
→ blueprint de activación
→ prompt recomendado
→ 10 gemas iniciales
→ continuidad natural hacia Builder
```

### Efecto operativo

La compra puntual queda conectada con la continuidad principal del sistema.

El usuario no compra solo un informe: compra una primera activación seria con entrada hacia construcción.

---

## 38. Planes como niveles de continuidad operativa

### Decisión cerrada 35

Fecha: 2026-04-28

### Decisión

Los planes de pago dentro de Facturación quedan presentados como niveles de continuidad operativa, no como simples cards de pricing.

Niveles visibles aprobados:

```text
Pro
Growth
AI Master 199
```

### Rol de cada nivel

```text
Pro → primera activación seria dentro del sistema
Growth → continuidad operativa y más recorrido
AI Master 199 → capa superior para casos complejos, criterio maestro y salida preparada
```

### Decisiones visuales cerradas

Queda cerrado que:

- el bloque `Gratis` no debe aparecer como card principal dentro de la app;
- Gratis queda como capacidad inicial del usuario registrado;
- las cards de pago deben mostrarse como niveles sólidos de continuidad;
- el precio no debe ir dentro de una caja pesada;
- no debe aparecer “Mejor encaje” si duplica información;
- el bloque “Marco operativo” no debe crear repetición visual innecesaria;
- las Gemas deben aparecer dentro de la lectura de valor del plan;
- Pro, Growth y AI Master deben quedar alineados visualmente y sin solapes.

### Componentes cerrados

Quedan intervenidos y alineados:

```text
frontend/src/features/billing/components/PlanCard.js
frontend/src/features/billing/components/PlansGrid.js
```

### Efecto operativo

La zona de planes deja de parecer heredada y queda alineada con Sistema Maestro Gold.

---

## 39. Bloques premium de Facturación cerrados

### Decisión cerrada 36

Fecha: 2026-04-28

### Decisión

Quedan alineadas las piezas principales de Facturación con el lenguaje Gema Maestra.

### Piezas cerradas

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

### Resultado aprobado

- `BillingPage.js` presenta Centro de Capacidad Gold.
- `EntryOfferCard.js` conecta Informe Maestro Gold con Builder y 10 gemas iniciales.
- `CreditSummaryCard.js` se convierte en bloque premium de Gema Maestra.
- `CurrentPlanCard.js` se eleva como bloque premium del plan actual.
- `PlansGrid.js` consolida niveles de continuidad operativa.
- `PlanCard.js` queda como card estable de Pro, Growth y AI Master.
- `SuggestedPlanBanner.js` elimina “Créditos previstos” y usa Gemas incluidas.
- `billing.constants.js` deja de arrastrar notas visibles antiguas de créditos.
- `billing.utils.js` mantiene compatibilidad técnica, pero expone lenguaje visible de Gemas.

### Efecto operativo

Facturación queda cerrada como microfase de monetización interna premium.

No debe reabrirse salvo:

- bug funcional;
- solape visual real;
- checkout roto;
- inconsistencia visible detectada en producción.

---

## 40. Deploys iterativos permitidos por microfase

### Decisión cerrada 37

Fecha: 2026-04-28

### Aclaración sobre la decisión cerrada 24

La regla “No procede deploy final todavía” sigue vigente para release comercial o entrega final.

Pero queda aprobado que sí pueden hacerse deploys iterativos en Railway para validar microfases cerradas.

### Regla aprobada

```text
Deploy final / release comercial → bloqueado
Deploy técnico de validación por microfase → permitido
```

### Efecto operativo

Se permite desplegar tras commits quirúrgicos cuando:

- el build pasa;
- el cambio está acotado;
- no mezcla frentes;
- permite validar producción sin declarar cierre comercial del sistema.

---

## 41. RegisterPage warning registrado como no bloqueante

### Decisión cerrada 38

Fecha: 2026-04-28

### Decisión

Queda registrado un warning de React en `RegisterPage.js` relacionado con dependencias de `useMemo`.

### Estado

No bloquea:

- build;
- deploy;
- Facturación;
- checkout;
- Billing;
- Gema Maestra.

### Efecto operativo

No se interviene durante la microfase de Facturación.

Queda reservado para una fase posterior de:

```text
registro
onboarding
entrada al sistema
```

---

## 42. Historial de pagos con papelera admin queda fuera de la microfase Billing Gold

### Decisión cerrada 39

Fecha: 2026-04-28

### Decisión

La idea de añadir una papelera al historial de pagos se considera válida, pero no queda incluida dentro de la microfase de alineación visual y semántica de Facturación.

### Regla aprobada

Debe tratarse como microfrente separado porque implica:

- acción de borrado;
- control de permisos;
- estado de UI;
- posible endpoint backend;
- confirmación;
- protección admin.

### Efecto operativo

No se mezcla con:

- PlanCard;
- Gema Maestra;
- BillingHero;
- EntryOfferCard;
- CurrentPlanCard;
- PlansGrid.

Queda pendiente como mejora funcional posterior.

---

## 43. Próximo frente visible tras Facturación: Resumen premium

### Decisión cerrada 40

Fecha: 2026-04-28

### Decisión

Tras cerrar Facturación, el siguiente frente visible detectado es:

```text
Resumen premium
```

### Motivo

En Resumen todavía aparecen bloques con lenguaje antiguo de créditos visibles y cards sobredimensionadas:

```text
Capacidad operativa — créditos
Tu plan te abre el sistema. Tus créditos...
Ver billing y créditos
```

### Efecto operativo

No se considera parte de la microfase de Facturación.

Debe abordarse como siguiente intervención quirúrgica independiente:

```text
Resumen premium
→ Gema Maestra / Gemas
→ cards más compactas
→ continuidad visual premium
```

---

## 44. Veredicto operativo actualizado

A fecha 2026-04-28 queda oficialmente cerrado que:

- la fuente real ya está separada del entorno regenerable;
- `frontend/src/features/` es la capa principal del frontend;
- Builder, Home, App Shell, Dashboard, Billing y Reports forman parte del núcleo funcional real;
- BuilderBuildKernel queda aprobado como capa de ejecución y consolidación visible;
- Builder Runtime queda conectado a Builder AI/OpenAI como capa de interpretación estructurada;
- Builder Project Lifecycle V1 queda conectado al chat;
- Dashboard ya prioriza continuidad hacia Builder;
- Facturación queda alineada como Centro de Capacidad Gold;
- Gema Maestra pasa a ser el lenguaje visible de capacidad operativa en Billing;
- Informe Maestro Gold queda conectado con Builder y 10 gemas iniciales;
- los planes Pro, Growth y AI Master quedan como niveles de continuidad operativa;
- PlanCard queda estabilizado;
- CreditSummaryCard queda elevado como bloque premium de Gema Maestra;
- CurrentPlanCard queda elevado como bloque premium del plan actual;
- PlansGrid queda saneado sin card Free dentro de la app;
- SuggestedPlanBanner, billing.constants.js y billing.utils.js quedan saneados del lenguaje visible antiguo;
- la papelera del historial de pagos queda pendiente como microfrente separado;
- Resumen premium pasa a ser el siguiente frente visible;
- deploy final sigue bloqueado;
- deploys iterativos por microfase quedan permitidos.