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

Debe actuar como base para navegación, proyectos, créditos y módulos internos.

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

## 21. Capa de créditos y consumo como sistema vivo

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

Créditos/consumo deja de tratarse como estructura semivaga o futura.

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
- producción
- push con intención de entrega final

hasta que el sistema esté afinado, validado y sin frentes mezclados.

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

## 28. Veredicto operativo actual

A fecha de este documento, queda oficialmente cerrado que:

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
- `readinessScore` representa madurez del proyecto, no créditos consumidos.
- Los créditos quedan separados del score de madurez y se aplican como coste de acciones intensivas.
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

## DECISIÓN CERRADA — Navegación interna de Nuevo Proyecto hacia Dashboard Launcher

Fecha: 2026-04-27

### Decisión

Dentro de la aplicación interna, los CTAs principales de “Nuevo proyecto”, “Crear o abrir proyecto” y accesos rápidos de creación dejan de apuntar a `/flow`.

La entrada principal para crear proyectos dentro de la app pasa a ser:

```text
/dashboard

---

## DECISIÓN CERRADA — Dashboard como continuidad hacia Builder

Fecha: 2026-04-27

### Decisión

El bloque de proyectos recientes del Dashboard deja de usar el detalle/informe como destino principal.

La continuidad principal del usuario pasa a ser:

```text
Dashboard / Resumen
→ Proyectos recientes
→ Continuar en Builder
→ /dashboard/builder?project_id=...
