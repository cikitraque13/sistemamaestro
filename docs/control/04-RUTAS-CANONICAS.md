# 04-RUTAS-CANONICAS

## Estado del documento

- Estado: activo
- Tipo: rutas canónicas
- Alcance: proyecto completo `Sistema Maestro`
- Objetivo: fijar qué rutas mandan de verdad, cuáles son residuales, cuáles son auxiliares y cuáles quedan fuera del repo activo.

---

## 1. Función de este documento

Este documento existe para responder con claridad a una sola pregunta:

**¿Qué rutas mandan dentro de Sistema Maestro y cuáles no?**

No fija prioridades.
No define Git o deploy en detalle.
No sustituye al inventario técnico.

Su función es cerrar la autoridad estructural del proyecto.

---

## 2. Regla maestra de canonicidad

Toda ruta del proyecto debe quedar clasificada en una de estas categorías:

1. ruta canónica de sistema
2. ruta canónica de producto
3. ruta residual temporal
4. ruta auxiliar válida
5. ruta regenerable / no canónica
6. ruta retirada del repo activo

Ninguna ruta debe quedar interpretada por intuición.

---

## 3. Rutas canónicas de sistema

Estas rutas se consideran canónicas a nivel de sistema completo:

- `frontend/`
- `backend/`
- `docs/control/`

### Lectura

Estas tres rutas forman hoy el esqueleto principal del proyecto:

- `frontend/` contiene la capa visible y buena parte del producto cliente;
- `backend/` contiene la capa servidora real del sistema;
- `docs/control/` es la capa canónica de gobierno documental.

---

## 4. Rutas canónicas de frontend

Dentro de `frontend/`, estas rutas quedan aprobadas como canónicas:

- `frontend/src/`
- `frontend/public/`

### Función

- `frontend/src/` → fuente principal del frontend
- `frontend/public/` → activos públicos del frontend

### Regla

Toda evolución estructural real del frontend debe apoyarse en estas rutas y no en artefactos generados del entorno.

---

## 5. Ruta canónica de producto enrutable

La ruta canónica del producto enrutable dentro del frontend es:

- `frontend/src/features/`

### Lectura

Esta ruta pasa a considerarse la capa principal de producto visible y modular.

---

## 6. Módulos canónicos reconocidos en `frontend/src/features`

Se reconocen como módulos canónicos del producto los siguientes:

- `frontend/src/features/activation-flow/`
- `frontend/src/features/app-shell/`
- `frontend/src/features/auth/`
- `frontend/src/features/billing/`
- `frontend/src/features/builder/`
- `frontend/src/features/dashboard/`
- `frontend/src/features/flow/`
- `frontend/src/features/home/`
- `frontend/src/features/opportunities/`
- `frontend/src/features/projects/`
- `frontend/src/features/reports/`
- `frontend/src/features/settings/`

---

## 7. Ruta residual temporal aprobada

La ruta `frontend/src/pages/` deja de ser ruta canónica de producto.

Pasa a ser:

**ruta residual temporal aprobada**

### Alcance actual aprobado

Solo se admite como residual para páginas legales o contenido residual expresamente validado.

---

## 8. Ruta auxiliar válida

Queda clasificada como ruta auxiliar válida:

- `tests/`

### Lectura

No es núcleo canónico, pero sigue siendo soporte técnico interno legítimo.

---

## 9. Rutas regenerables / no canónicas

Quedan clasificadas como no canónicas y regenerables todas las rutas del entorno que no definen el producto.

### Incluye

- `frontend/node_modules/`
- cualquier `node_modules/` interno
- cualquier `.cache/`
- cualquier `build/`
- cualquier `dist/`
- cualquier salida auxiliar generada por el toolchain

### Regla

Estas rutas:

- no mandan
- no definen arquitectura
- no se usan como referencia de producto
- no deben confundirse con complejidad real del sistema

---

## 10. Ruta canónica de gobierno documental

La única ruta canónica aprobada para gobierno técnico documental es:

- `docs/control/`

---

## 11. Ruta de auditoría y soporte documental

Dentro de la capa documental:

- `docs/control/` → documentación canónica
- `docs/control/audit/` → soporte de auditoría y lecturas de trabajo

### Regla

`docs/control/audit/` puede contener material de verificación, pero no sustituye a los documentos canónicos principales.

---

## 12. Canonicidad del backend a nivel raíz

La ruta canónica del backend a nivel de sistema queda fijada como:

- `backend/`

### Lectura

Backend se reconoce como capa real y canónica del sistema.

---

## 13. Canonicidad interna del backend

Dentro de `backend/`, estas rutas quedan aprobadas como canonicidad interna principal del backend:

- `backend/app/`
- `backend/app/core/`
- `backend/app/db/`
- `backend/app/routers/`
- `backend/app/services/`
- `backend/config/`
- `backend/requirements.txt`

### Lectura

La dirección canónica del backend es modular y vive dentro de `backend/app/`.

---

## 14. Entrada canónica del backend

La entrada canónica del backend queda asociada a:

- `backend/app/main.py`

### Referencia de runtime canónica

- `backend.app.main:app`

### Regla

No debe existir una segunda verdad de arranque dentro del repo activo.

---

## 15. Rutas de IA y créditos con canonicidad estructural activa

Quedan reconocidas como rutas estructuralmente activas dentro del backend:

- `backend/app/ai/`
- `backend/config/credits/`

### Lectura

Estas rutas ya forman parte de la estructura real del backend.

### Regla

`backend/app/ai/` queda reconocida como estructura puente/preparada.

No debe tratarse todavía como runtime IA vivo de extremo a extremo hasta que exista una fase de activación formal y una conexión técnica validada con Builder, motor, créditos, guards, telemetría y backend activo.

`backend/config/credits/` sí queda reconocida como capa activa real de consumo y economía del sistema.

---

## 16. Legacy runtime retirado del repo activo

Las siguientes piezas quedan clasificadas como:

**rutas retiradas del repo activo**

- `backend/server.py`
- `railway/server_railway.py`
- `railway/requirements.txt`

### Estado

Fueron retiradas del repo activo y movidas a safety para cierre controlado del legado.

### Regla

- no forman parte de la canonicidad activa;
- no deben reintroducirse en runtime;
- no deben documentarse como vía principal del sistema.

---

## 17. Rutas retiradas del repo activo por saneo

También quedan clasificadas como retiradas del repo activo:

- `memory/`
- `test_reports/`

### Lectura

Ya no deben interpretarse como parte viva del proyecto.

---

## 18. Canonicidad estructural de Builder

La ruta canónica funcional de Builder queda asociada a:

- `frontend/src/features/builder/`

### Lectura

Builder queda reconocido como núcleo operativo del producto visible.

No debe tratarse como una pantalla decorativa, una demo secundaria ni un chat aislado.

Builder debe entenderse como el módulo donde convergen:

- entrada del usuario;
- interpretación IA;
- construcción visible;
- preview;
- código;
- estructura;
- futuras operaciones de exportación y despliegue;
- consumo de créditos cuando proceda.

### Subcapa canónica interna del Builder

Dentro de Builder queda aprobada como subcapa canónica interna:

- `frontend/src/features/builder/state/`

### Función de `state/`

Esta ruta aloja la capa de construcción viva del Builder.

Su responsabilidad es coordinar el contrato entre:

- IA;
- runtime;
- mutaciones;
- estado vivo;
- preview;
- código;
- estructura;
- siguientes decisiones;
- futura exportación;
- futuro deploy;
- consumo de créditos cuando se conecte formalmente.

### Archivos previstos

La subcapa `state/` podrá contener, como mínimo:

- `builderBuildKernel.js`
- `builderBuildState.js`
- `builderMutationRegistry.js`
- `builderOutputMap.js`
- `builderQuestionFlowRegistry.js`
- `builderStructureRegistry.js`
- `builderKnowledgeIndex.js`

### Regla de canonicidad

`frontend/src/features/builder/state/` no sustituye a:

- `frontend/src/features/builder/intelligence/`
- `frontend/src/features/builder/playbooks/`
- `frontend/src/features/builder/presets/`
- `frontend/src/features/builder/utils/`
- `frontend/src/features/builder/workspace/`
- `frontend/src/features/builder/components/`

Su función no es almacenar todo el conocimiento en un megaarchivo.

Su función es actuar como contrato modular entre conocimiento, decisión y salida visible.

### Regla de implementación

Ninguna nueva evolución estructural del Builder debe saltarse esta subcapa cuando afecte a:

- estado vivo;
- mutaciones;
- preview;
- código generado;
- estructura de carpetas;
- siguientes preguntas;
- coste estimado;
- exportación futura;
- deploy futuro.

---

## 19. Canonicidad estructural de App Shell

La ruta canónica funcional de App Shell queda asociada a:

- `frontend/src/features/app-shell/`

---

## 20. Canonicidad estructural de Home

La ruta canónica funcional de Home queda asociada a:

- `frontend/src/features/home/`

---

## 21. Canonicidad estructural de Auth y operación interna

Quedan asociadas como rutas canónicas de operación interna:

- `frontend/src/features/auth/`
- `frontend/src/features/dashboard/`
- `frontend/src/features/projects/`
- `frontend/src/features/opportunities/`
- `frontend/src/features/billing/`
- `frontend/src/features/reports/`
- `frontend/src/features/settings/`
- `frontend/src/features/flow/`

---

## 22. Reglas derivadas de canonicidad

### 22.1 Regla de creación

Toda pieza nueva de producto enrutable debe nacer en `frontend/src/features/` o en una ruta canónica equivalente ya aprobada.

### 22.2 Regla de excepción

Las únicas excepciones actuales en `frontend/src/pages/` deben seguir tratándose como residuales y no como base de crecimiento.

### 22.3 Regla de backend

Toda evolución estructural nueva del backend debe apoyarse en `backend/app/` y no en una reactivación del backend plano heredado.

### 22.4 Regla de entrada

La referencia canónica de arranque del backend es `backend.app.main:app`.

### 22.5 Regla documental

Toda decisión estructural nueva debe registrarse en `docs/control/` y no en rutas paralelas.

### 22.6 Regla de Builder vivo

Toda evolución del Builder que pretenda modificar lo que el usuario ve, construye, itera o exporta debe respetar la subcapa:

- `frontend/src/features/builder/state/`

Si una acción del Builder solo modifica texto, copy, mensajes del agente o progreso visual, pero no puede reflejarse en estado vivo, preview, código o estructura, no se considera construcción válida.

### 22.7 Regla de no duplicación de inteligencia

No se aprueba duplicar playbooks, prompts, presets o reglas IA dentro de un único archivo monolítico.

La inteligencia debe permanecer modular y conectarse mediante el kernel y registros especializados.

### 22.8 Regla de salida visible

Toda ruta relacionada con Builder debe evaluarse por su capacidad de producir salida verificable:

- preview;
- código;
- estructura;
- archivo;
- componente;
- ruta;
- CTA;
- siguiente decisión.

---

## 23. Qué no decide este documento

Este documento no decide todavía:

- qué entra o no entra en Git;
- qué se despliega finalmente;
- qué prioridad tiene cada frente;
- qué procedimiento operativo debe seguirse;
- cómo se implementa internamente cada archivo de `builder/state/`;
- qué coste exacto tendrá cada mutación en créditos;
- cuándo se activará deploy real;
- cuándo se conectará exportación real.

Esas decisiones pertenecen a otros documentos.

---

## 24. Veredicto de canonicidad actual

### Canónico

- `frontend/`
- `frontend/src/`
- `frontend/public/`
- `frontend/src/features/`
- módulos de `features/*`
- `frontend/src/features/builder/`
- `frontend/src/features/builder/state/`
- `backend/`
- `backend/app/`
- `backend/app/core/`
- `backend/app/db/`
- `backend/app/routers/`
- `backend/app/services/`
- `backend/app/main.py`
- `backend/app/ai/`
- `backend/config/`
- `backend/config/credits/`
- `backend/requirements.txt`
- `docs/control/`

### Residual temporal

- `frontend/src/pages/`

### Auxiliar válida

- `tests/`

### No canónico / regenerable

- `frontend/node_modules/`
- `.cache/`
- `build/`
- `dist/`
- artefactos del entorno

### Retirado del repo activo

- `backend/server.py`
- `railway/server_railway.py`
- `railway/requirements.txt`
- `memory/`
- `test_reports/`

---

## 25. Conclusión operativa

A partir de este documento:

- `features` es la capa principal del producto frontend;
- `frontend/src/features/builder/` es la ruta canónica funcional del Builder;
- `frontend/src/features/builder/state/` es la subcapa canónica interna para construcción viva del Builder;
- `backend/app/` es la capa modular canónica del backend;
- `backend/app/main.py` es la entrada canónica del backend;
- `backend.app.main:app` es la referencia canónica de runtime;
- `backend/app/ai/` es estructura puente/preparada y no debe venderse internamente como IA viva completa;
- `backend/config/credits/` es capa activa real de créditos y consumo;
- el legacy runtime ya no forma parte del repo activo;
- `docs/control` gobierna la memoria estructural;
- lo regenerable deja oficialmente de confundirse con producto;
- y Builder deja de poder evolucionar como pantalla aislada: toda construcción real debe acabar alineada con estado vivo, preview, código y estructura.