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

---

## 45. Resumen premium alineado con Gema Maestra

### Decisión cerrada 41

Fecha: 2026-05-02

### Estado

Cerrado.

### Decisión

El Resumen del Dashboard queda alineado con el lenguaje visible de Gema Maestra / Gemas.

La capacidad operativa deja de estar dominada por lenguaje visible de créditos y pasa a presentarse como capacidad premium del sistema.

### Archivos principales

```text
frontend/src/features/dashboard/components/DashboardCreditsPanel.js
frontend/src/features/dashboard/components/DashboardStatusPanel.js
```

### Resultado cerrado

- No domina el lenguaje visible de créditos.
- Capacidad operativa aparece como Gema Maestra / Gemas.
- CTA hacia facturación queda como facturación y gemas.
- Cards de capacidad y continuidad quedan compactadas.
- Cards superiores Proyectos / Blueprints / Plan actual quedan compactadas.

### Efecto operativo

Dashboard queda alineado con Facturación Gold y con el lenguaje visible aprobado para capacidad operativa.

El Resumen deja de arrastrar lectura técnica antigua y refuerza continuidad premium dentro de la app.

---

## 46. Proyectos saneado como capa de continuidad

### Decisión cerrada 42

Fecha: 2026-05-02

### Estado

Cerrado.

### Decisión

La pantalla de Proyectos queda saneada como capa de continuidad del sistema.

Proyectos debe ayudar al usuario a encontrar, filtrar y retomar trabajo sin convertirse en una lista técnica plana ni desplazar al Builder como centro de continuidad.

### Archivo principal

```text
frontend/src/features/projects/ProjectsPage.js
```

### Resultado cerrado

- Barra de búsqueda elevada visualmente.
- Lupa con acción/foco real.
- Filtro de rutas corregido con alias reales.
- Ruta técnica `sell` se muestra como `Vender y cobrar`.
- Dropdown nativo sustituido por dropdown premium.
- Empty state diferencia no tener proyectos de no tener resultados.

### Efecto operativo

Proyectos queda alineado con la lógica de continuidad:

```text
proyecto
→ búsqueda / filtro / lectura clara
→ continuidad
→ Builder
```

La pantalla deja de ser una zona secundaria sin dirección y pasa a reforzar el retorno operativo del usuario.

---

## 47. Oportunidades V1 saneadas como biblioteca de rutas construibles

### Decisión cerrada 43

Fecha: 2026-05-02

### Estado

Cerrado como V1.

### Decisión

Oportunidades queda saneada como biblioteca inicial de rutas construibles.

No debe comunicar consultoría operativa, ejecución manual externa ni prometer acompañamiento fuera del sistema.

Debe funcionar como catálogo inicial de oportunidades que orientan al usuario hacia rutas accionables dentro de Sistema Maestro.

### Archivos principales

```text
frontend/src/features/opportunities/OpportunitiesPage.js
backend/app/domain/opportunities.py
```

### Resultado cerrado

- Lenguaje de monetización saneado.
- No promete consultoría operativa ni ejecución manual externa.
- Backend amplía a 10 oportunidades iniciales.
- Free ve 2 oportunidades completas.
- Admin/premium ve las 10 oportunidades.
- Desbloquear desde Oportunidades recomienda Pro, no AI Master por defecto.

### Regla aprobada

```text
Free → 2 oportunidades completas
Admin / premium → 10 oportunidades completas
```

### Efecto operativo

Oportunidades queda cerrada como V1 funcional.

Su rol actual es:

```text
descubrir oportunidad
→ entender ruta construible
→ activar deseo de construcción
→ conectar con plan
```

No queda aprobado convertirla todavía en marketplace, sistema complejo de plantillas o generación dinámica avanzada.

---

## 48. Gratis con 10 gemas iniciales reales

### Decisión cerrada 44

Fecha: 2026-05-02

### Estado

Cerrado.

### Decisión

El plan gratuito queda aprobado con 10 gemas iniciales reales.

Gratis deja de comunicar ausencia total de Builder o ausencia total de Gemas y pasa a comunicar entrada limitada pero real al sistema.

### Archivos principales

```text
backend/app/core/config.py
backend/app/services/credits.py
frontend/src/content/pricingContent.js
frontend/src/features/billing/billing.constants.js
frontend/src/features/billing/billing.utils.js
```

### Resultado cerrado

- Railway tiene `CREDITS_FREE=10`.
- Backend concede 10 gemas iniciales reales una sola vez al usuario sin historial previo.
- Gratis deja de comunicar `Sin builder` / `Sin gemas`.
- Gratis pasa a comunicar `Builder limitado + 10 gemas iniciales`.
- Frontend diferencia 10 gemas iniciales de gemas incluidas recurrentes.

### Escalera aprobada

```text
Gratis → 10 gemas iniciales
Informe Maestro Gold → +10 gemas y lectura guiada
Pro → 60 gemas incluidas
Growth → 220 gemas incluidas
AI Master 199 → 600 gemas incluidas
```

### Efecto operativo

La entrada gratuita deja de ser una experiencia bloqueada.

El usuario puede registrarse, recibir capacidad inicial real y probar el Builder limitado antes de una conversión mayor.

---

## 49. Home alineada con Sistema Maestro Gold

### Decisión cerrada 45

Fecha: 2026-05-02

### Estado

Cerrado y validado en web.

### Decisión

Home queda alineada con Sistema Maestro Gold, Gema Maestra / Gemas y la nueva escalera de entrada gratuita + oferta Gold.

Home deja de ser una landing aislada y queda conectada con el sistema real de activación.

### Archivos principales

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

### Resultado cerrado

- Home pricing alineado con Gemas / Gema Maestra.
- Logo Gold en header, footer, legales y favicon.
- Favicon usa `sistema_maestro_gold_logo.png`.
- Páginas legales cargan desde arriba con `ScrollToTop`.
- Radar IA usa dropdowns premium.
- Home móvil queda compacta y validada.

### Efecto operativo

Home comunica una promesa coherente con la experiencia interna:

```text
registro gratis
→ 10 gemas iniciales
→ Informe Maestro Gold
→ Builder
→ continuidad operativa
```

La entrada pública deja de contradecir Billing, Gratis y Gema Maestra.

---

## 50. Regla de Home móvil

### Decisión cerrada 46

Fecha: 2026-05-02

### Estado

Cerrada.

### Decisión

Home móvil no debe intentar replicar la experiencia completa de escritorio.

Queda aprobada esta separación funcional:

```text
Móvil = descubrir, entender, confiar, registrarse y preparar entrada.
Desktop = explicar más, permitir entrada guiada y trabajar con más profundidad.
```

### Reglas aprobadas

En móvil NO debe aparecer:

- input largo
- textarea
- tabs Idea / URL / Escalar
- selector Web / Herramienta / Automatización
- bloques largos de output
- footer con login o registro duplicado

En móvil SÍ debe aparecer:

- qué es Sistema Maestro
- para quién es
- registro gratis + 10 gemas
- Informe Maestro Gold + 10 gemas
- mensaje de trabajo serio desde ordenador
- footer limpio de marca + legal

### Efecto operativo

Home móvil queda protegida como capa de descubrimiento, confianza y conversión inicial.

No debe convertirse en Builder comprimido, dashboard reducido ni formulario complejo antes del registro.

---

## 51. Scroll-to-top para páginas legales

### Decisión cerrada 47

Fecha: 2026-05-02

### Estado

Cerrado.

### Decisión

Las páginas legales deben cargar siempre desde arriba y no conservar la posición previa de scroll.

### Archivo principal

```text
frontend/src/App.js
```

### Rutas afectadas

```text
/privacy
/cookies
/terms
```

### Resultado cerrado

Las rutas legales cargan arriba y no conservan posición previa de scroll.

### Efecto operativo

La navegación legal queda saneada y evita una experiencia rota al entrar desde Home, footer o navegación interna.

---

## 52. Oportunidades bloqueadas como siguiente frente visible

### Decisión cerrada 48

Fecha: 2026-05-02

### Estado

Decisión de siguiente frente.

### Decisión

Tras cerrar Home Mobile Gold, el siguiente frente visible aprobado es mejorar la presentación de oportunidades bloqueadas para usuarios gratuitos.

### Regla aprobada

Usuario free:

```text
2 oportunidades desbloqueadas completas
8 oportunidades bloqueadas con valor insinuado
```

Las oportunidades bloqueadas no deben parecer skeletons vacíos.

### Criterio de producto

Las oportunidades bloqueadas deben insinuar valor real sin revelar todo.

Deben poder mostrar:

- pista de título o tipo;
- ruta;
- dificultad;
- niebla premium;
- CTA de desbloqueo.

No deben revelar:

- contenido completo;
- pasos internos accionables;
- blueprint completo;
- prompts completos;
- estructura completa;
- valor suficiente para copiar la oportunidad sin desbloquear.

### Efecto operativo

El siguiente frente visible queda definido y acotado.

No se abre todavía:

- marketplace de plantillas;
- generación dinámica de oportunidades;
- backend complejo de desbloqueos;
- sistema de compra individual por oportunidad;
- Builder automático desde oportunidad bloqueada.

La prioridad inmediata es mejorar percepción, deseo y conversión dentro de Oportunidades sin romper la regla V1.

---

## 53. Veredicto operativo actualizado tras Home Mobile Gold

A fecha 2026-05-02 queda oficialmente cerrado que:

- Facturación / Gema Maestra / Centro de Capacidad Gold queda cerrada como microfase premium interna;
- Resumen premium queda alineado con Gema Maestra / Gemas;
- Proyectos queda saneado como capa de continuidad;
- Oportunidades V1 queda saneada como biblioteca de rutas construibles;
- Gratis queda aprobado con 10 gemas iniciales reales;
- Home queda alineada con Sistema Maestro Gold;
- Home Mobile Gold queda compacta, validada y separada funcionalmente de Desktop;
- las páginas legales cargan desde arriba con ScrollToTop;
- el siguiente frente visible aprobado es Oportunidades bloqueadas con preview premium;
- Free debe mantener 2 oportunidades completas y 8 bloqueadas con valor insinuado;
- Admin / premium debe mantener acceso a las 10 oportunidades completas;
- el lenguaje visible debe seguir usando Gemas / Gema Maestra cuando hable al usuario;
- créditos puede seguir existiendo como término técnico interno cuando el contrato lo requiera;
- deploy final sigue bloqueado;
- deploys iterativos por microfase siguen permitidos;
- Builder lifecycle con mutaciones reales sigue siendo el frente estructural crítico de fondo, pero no desplaza el siguiente frente visible aprobado.

---

# Actualización canónica — 2026-05-03

## Estado

Decisiones cerradas tras el saneamiento mayor de seguridad, créditos, deploy, administración, Stripe, frontend API y carga de proyectos.

Esta sección consolida las decisiones tomadas durante la intervención de hardening y puesta en producción validada.

---

## 1. Seguridad backend cerrada

### Decisión

El backend no debe confiar en payloads del frontend para identidad, saldo, plan, permisos o pagos.

### Cerrado

- `JWT_SECRET` debe ser explícito y obligatorio.
- El refresh token verifica firma.
- Se elimina cualquier uso de `verify_signature=False`.
- Los webhooks de Stripe exigen firma válida.
- El webhook de Stripe ya no acepta `json.loads(body)` sin verificación.
- `/api/builder/build` exige usuario autenticado.
- Builder valida que `projectId` pertenezca al usuario autenticado.
- `/consumption/execute` usa usuario autenticado real.
- Las acciones IA caras pasan por el motor de consumo antes de ejecutar IA.

### Motivo

La identidad, el saldo, el plan y los pagos son autoridad del servidor.  
El frontend solo expresa intención.

---

## 2. Créditos antes de IA

### Decisión

Toda acción que pueda generar coste IA debe cobrar/verificar créditos antes de ejecutar modelos o agentes.

### Cerrado

- Builder AI cobra antes de `run_builder_agent`.
- Creación de proyecto cobra `idea_analysis` o `url_analysis` antes de `analyze_with_ai`.
- Blueprint cobra `blueprint_generation` antes de `generate_blueprint`.
- El catálogo de créditos normaliza:
  - `plan_requirement` → `required_plan`
  - `consumption_type_allowed` → `consumption_type`
- `/consumption/execute` ya no ejecuta solo `evaluate_consumption(payload)` confiando en datos del cliente.

### Motivo

Primero se valida acceso, plan y créditos.  
Después se ejecuta IA.

---

## 3. Stripe firmado

### Decisión

Stripe solo puede finalizar pagos mediante eventos firmados.

### Cerrado

- Webhook creado en Stripe para:

```text
https://sistemamaestro.com/api/payments/webhook/stripe