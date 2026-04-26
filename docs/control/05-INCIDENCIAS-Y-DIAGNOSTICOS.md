# 05-INCIDENCIAS-Y-DIAGNOSTICOS

## Estado del documento

- Estado: activo
- Tipo: incidencias y diagnósticos canónicos
- Alcance: proyecto completo `Sistema Maestro`
- Objetivo: registrar incidencias reales del sistema, su causa, su impacto, su estado y su resolución, sin mezclar este documento con backlog, decisiones cerradas o procedimientos permanentes.

---

## 1. Función de este documento

Este documento existe para responder con claridad a una sola pregunta:

**¿Qué incidencia real ocurrió, qué la causó, cómo afectó al sistema y cómo quedó resuelta o reconducida?**

No define prioridades globales.
No inventa el sistema.
No fija rutas canónicas.
No contiene procedimientos operativos generales.
No sustituye al documento de decisiones cerradas.

Su función es dejar trazabilidad técnica de los problemas reales y de su reconducción.

---

## 2. Regla de uso

Solo entra en este documento aquello que cumpla estas condiciones:

1. ha existido una incidencia real o una desviación estructural real;
2. la incidencia ha requerido diagnóstico;
3. su causa o alcance merece quedar registrados;
4. la información es útil para evitar repetición futura.

No entra:

- ruido informal de chat;
- hipótesis no verificadas;
- ideas abiertas;
- tareas pendientes que aún no han causado incidencia;
- discusiones largas sin cierre técnico.

---

## 3. Estructura obligatoria de cada incidencia

Toda incidencia registrada debe incluir, como mínimo:

- identificador o nombre corto;
- fecha o fase;
- capa afectada;
- síntoma observado;
- diagnóstico;
- causa raíz o causa más probable validada;
- impacto;
- estado;
- resolución aplicada o criterio de bloqueo;
- aprendizaje operativo.

---

## 4. Incidencias registradas

---

## INCIDENCIA 001 — CRECIMIENTO SIN GOBIERNO TÉCNICO PREVIO

### Fase

Reconducción estructural inicial de `Sistema Maestro`.

### Capa afectada

Proyecto completo:

- frontend
- backend
- documentación
- entorno local
- criterio de Git/deploy

### Síntoma observado

El proyecto había crecido en múltiples frentes sin disponer todavía de una capa canónica de gobierno técnico suficientemente cerrada.

Esto provocó:

- mezcla entre producto real y entorno local;
- desorden en la lectura del árbol del proyecto;
- dificultad para decidir qué era fuente real y qué era regenerable;
- tendencia a tratar incidencias puntuales como si fueran el centro del sistema.

### Diagnóstico

La causa principal no era un error aislado de código.

La causa principal era una falta de marco técnico-documental previo al crecimiento.

### Causa raíz

Ausencia histórica de:

- inventario técnico canónico;
- rutas canónicas cerradas;
- política de Git/deploy/higiene clara;
- reglas documentales con reparto de funciones no solapado.

### Impacto

- riesgo de tocar capas equivocadas;
- riesgo de interpretar mal el tamaño real del sistema;
- riesgo de avanzar por acumulación de arreglos;
- riesgo de mezclar frontend, backend, entorno y documentación sin orden.

### Estado

Reconducida parcialmente.

### Resolución aplicada

Se decidió congelar la improvisación y abrir una reconducción por fases:

1. control estructural
2. clasificación
3. canonicidad
4. higiene técnica
5. reanudación del producto

### Aprendizaje operativo

Sistema Maestro no debe crecer de nuevo sin gobierno técnico previo.

---

## INCIDENCIA 002 — FALSA PERCEPCIÓN DEL PROYECTO POR VOLUMEN BRUTO

### Fase

Auditoría del árbol del proyecto y revisión del volumen local.

### Capa afectada

Lectura estructural global del sistema.

### Síntoma observado

El proyecto se percibía como una masa descontrolada de decenas de miles de archivos, generando alarma y dificultad para distinguir el producto real del entorno técnico.

### Diagnóstico

La mayor parte del volumen no pertenecía al producto real, sino al entorno frontend instalado, dependencias y artefactos regenerables.

### Causa raíz

Confusión entre:

- fuente real;
- dependencias de Node;
- cachés;
- builds;
- salidas de toolchain.

### Impacto

- riesgo de pánico estructural;
- riesgo de sobrecorrección;
- riesgo de tomar decisiones destructivas por una lectura falsa del árbol local.

### Estado

Reconducida.

### Resolución aplicada

Se clasificó el sistema por capas y se distinguió entre:

- producto real;
- entorno regenerable;
- temporales/cachés;
- salida/build.

### Aprendizaje operativo

Nunca debe volver a leerse el proyecto como si el volumen bruto local equivaliera al producto real.

---

## INCIDENCIA 003 — DESVIACIÓN DE FOCO HACIA SÍNTOMAS LOCALES

### Fase

Incidencias alrededor de auth, Google Sign-In y flujo de acceso.

### Capa afectada

Frontend y criterio metodológico del proyecto.

### Síntoma observado

Una incidencia concreta relacionada con acceso, configuración o presentación del flujo de Google tendía a arrastrar el foco del proyecto entero.

### Diagnóstico

El problema puntual actuó como disparador, pero no era el centro del sistema.

El verdadero problema era estructural y de gobierno técnico.

### Causa raíz

Falta de marco previo para distinguir entre:

- síntoma local;
- problema de entorno;
- problema estructural.

### Impacto

- pérdida de foco;
- riesgo de tocar capas sensibles sin mapa;
- riesgo de invertir tiempo en una pieza secundaria mientras la base seguía sin ordenar.

### Estado

Reconducida.

### Resolución aplicada

Se bloqueó el tratamiento de incidencias locales como eje central y se reorientó el trabajo hacia:

- inventario;
- rutas canónicas;
- higiene técnica;
- documentación de control.

### Aprendizaje operativo

Antes de corregir una incidencia puntual, debe clasificarse si el síntoma es local, estructural o de entorno.

---

## INCIDENCIA 004 — CONVIVENCIA DE DOS GESTORES DE PAQUETES EN FRONTEND

### Fase

Higiene técnica y cierre de lockfiles.

### Capa afectada

Frontend / repo / gestión de dependencias.

### Síntoma observado

Convivían señales de npm y Yarn en el frontend:

- `package-lock.json` presente;
- `yarn.lock` todavía activo o modificado;
- riesgo de dos verdades de dependencias.

### Diagnóstico

La convivencia de dos lockfiles aumentaba el riesgo de inconsistencia técnica y de commits ambiguos.

### Causa raíz

Migración y uso operativo del frontend sin cierre previo de gestor único.

### Impacto

- riesgo de instalaciones inconsistentes;
- riesgo de comportamiento distinto entre entornos;
- riesgo de ensuciar Git con dos políticas de dependencias.

### Estado

Resuelta.

### Resolución aplicada

Se aprobó npm como gestor único del frontend y `package-lock.json` como lockfile canónico. `yarn.lock` quedó fuera del flujo activo.

### Aprendizaje operativo

No deben convivir dos gestores de paquetes activos para la misma capa del sistema.

---

## INCIDENCIA 005 — MIGRACIÓN ESTRUCTURAL DEL FRONTEND SIN CIERRE FORMAL

### Fase

Migración `pages -> features`.

### Capa afectada

Frontend / arquitectura modular.

### Síntoma observado

Coexistían:

- páginas antiguas marcadas para borrado;
- módulos nuevos en `features`;
- dudas sobre si la migración estaba realmente cerrada.

### Diagnóstico

La migración principal estaba funcionalmente muy avanzada, pero no había sido declarada todavía con criterio documental.

### Causa raíz

Ausencia de formalización canónica del estado de migración.

### Impacto

- riesgo de reabrir rutas antiguas;
- riesgo de seguir creando producto en una capa residual;
- riesgo de mezclar migración con evolución de Home/Auth.

### Estado

Reconducida y declarada casi cerrada.

### Resolución aplicada

Se fijó que:

- `frontend/src/features/` es la capa principal del producto enrutable;
- `frontend/src/pages/` queda solo como residual legal temporal para `Privacy`, `Cookies` y `Terms`;
- no se aprueban nuevas páginas de producto en `pages`.

### Aprendizaje operativo

Toda migración estructural debe quedar cerrada documentalmente, no solo operativamente.

---

## INCIDENCIA 006 — DOCUMENTACIÓN CANÓNICA NACIDA INCOMPLETA

### Fase

Construcción de `docs/control/`.

### Capa afectada

Gobierno documental del sistema.

### Síntoma observado

La estructura documental fue creada antes de que todos los documentos canónicos tuvieran contenido real y antes de validar el reparto exacto entre ellos.

### Diagnóstico

La carpeta existía, pero parte del bloque canónico estaba aún vacío o insuficientemente consolidado.

### Causa raíz

Secuencia de trabajo acelerada antes de cerrar:

- reparto de funciones;
- orden documental;
- diferencia entre documento canónico y snapshot auxiliar.

### Impacto

- riesgo de considerar “cerrada” una capa documental que aún no lo estaba;
- riesgo de subir estructura vacía como si fuera sistema estable.

### Estado

En reconducción.

### Resolución aplicada

Se fijó:

- lista canónica exacta de 8 documentos;
- jerarquía documental;
- verificación de integridad;
- necesidad de redactar `05` y `06` con cuerpo real antes de dar el bloque por cerrado.

### Aprendizaje operativo

Crear archivos no equivale a cerrar documentación.

---

## INCIDENCIA 007 — BUILDER SIMULANDO CONSTRUCCIÓN SIN ESTADO VIVO

### Fase

Reapertura del núcleo visible del producto y auditoría Builder/IA.

### Capa afectada

Builder como sistema completo:

- runtime;
- preview;
- código;
- estructura;
- agente;
- inteligencia frontend;
- contrato de construcción visible;
- futura conexión con créditos, exportación y deploy.

### Síntoma observado

El usuario podía pedir cambios como añadir acceso con Google, modificar un CTA, mejorar una sección, generar una landing o preparar una estructura de proyecto, y el sistema mostraba señales de actividad:

- progreso visual;
- agente pensando o esperando respuesta;
- código animado;
- sugerencias;
- cambios de copy;
- preview semidinámica.

Sin embargo, la preview, el código y la estructura no cambiaban de forma real, acumulativa y verificable.

El sistema parecía construir, pero no mantenía una representación viva de lo construido.

También aparecían preguntas repetidas o genéricas porque el Builder no tenía memoria estructural de las acciones ya aplicadas ni de los bloques ya construidos.

### Diagnóstico

El Builder estaba funcionando con señales parciales:

- mensajes del agente;
- progreso;
- copy;
- `hubSummary`;
- `lastDelta`;
- `lastOperation`;
- plantillas de código;
- preview fija o semidinámica;
- fases de generación.

Estas señales podían producir sensación de actividad, pero no constituían una construcción real.

La causa operativa no era un problema visual aislado del panel izquierdo, del chat, del preview o de los botones.

La causa estaba en la ausencia de una fuente única de verdad que representara lo construido y coordinara la salida entre:

- intención del usuario;
- interpretación IA;
- mutación aplicada;
- estado vivo;
- preview;
- código;
- estructura;
- siguientes decisiones.

### Causa raíz

Ausencia de una capa viva tipo `BuilderBuildState` y de un kernel coordinador que convirtiera cada intención del usuario en una mutación real aplicable a preview, código y estructura.

El Builder trataba señales de IA y fases de progreso como si fueran construcción, pero no existía todavía un contrato central:

```text
input usuario
→ interpretación IA
→ mutación normalizada
→ BuilderBuildState
→ preview
→ código
→ estructura
→ siguientes decisiones
```

### Impacto

- pérdida de valor percibido en el núcleo del producto;
- riesgo reputacional;
- sensación de herramienta decorativa;
- desconexión entre IA, código y preview;
- bucles de corrección visual sin resolver la causa estructural;
- riesgo de monetizar créditos sobre acciones sin salida real;
- riesgo de que el usuario perciba que el Builder promete más de lo que entrega;
- dificultad para conectar exportación y deploy sobre una base no persistente;
- repetición de preguntas o sugerencias sin rama contextual real.

### Estado

En reconducción.

### Resolución aplicada

Se aprueba reconducir el Builder mediante una subcapa canónica interna:

```text
frontend/src/features/builder/state/
```

Esta subcapa deberá alojar una arquitectura modular, no un megaarchivo, compuesta como mínimo por:

- `builderBuildKernel.js`
- `builderBuildState.js`
- `builderMutationRegistry.js`
- `builderOutputMap.js`
- `builderQuestionFlowRegistry.js`
- `builderStructureRegistry.js`
- `builderKnowledgeIndex.js`

La resolución no consiste en seguir ajustando UI.

La resolución consiste en conectar Builder, IA, preview, código y estructura a una fuente viva de construcción.

### Criterio de bloqueo

Hasta que exista esta capa, no se aprueba seguir corrigiendo el Builder como si fuera solo un problema de:

- color;
- layout;
- chat;
- botones;
- cards;
- copy;
- sugerencias;
- preview decorativa.

### Criterio de cierre

Esta incidencia quedará cerrada cuando una petición del usuario como:

```text
Añade acceso con Google
```

produzca simultáneamente:

- estado vivo actualizado;
- preview con bloque real;
- código con componente real;
- estructura con archivo real;
- siguiente mejora distinta.

Y cuando una petición experta como:

```text
Crea una app con dashboard y backend
```

produzca simultáneamente:

- estructura frontend/backend;
- páginas, rutas y componentes;
- preview coherente con la app;
- código alineado con la estructura;
- siguientes decisiones técnicas no repetidas.

### Aprendizaje operativo

No se toca UI del Builder sin contrato previo de preview, código y estructura.

Toda mejora del Builder debe tener efecto visible o técnico verificable.

Una acción del agente no se considera válida si solo produce texto.

Una acción válida debe terminar, como mínimo, en uno de estos efectos:

- preview modificada;
- código modificado;
- estructura modificada;
- CTA modificado;
- bloque nuevo;
- archivo nuevo;
- siguiente decisión contextual distinta.

---

## 5. Plantilla de registro futuro

Cada nueva incidencia debe registrarse así:

### INCIDENCIA XXX — NOMBRE CORTO

#### Fase

[etapa del proyecto]

#### Capa afectada

[frontend / backend / docs / repo / auth / builder / IA / etc.]

#### Síntoma observado

[qué se vio]

#### Diagnóstico

[qué reveló el análisis]

#### Causa raíz

[causa validada o más probable bien fundada]

#### Impacto

[qué riesgo o daño produce]

#### Estado

[abierta / en reconducción / resuelta / bloqueada]

#### Resolución aplicada

[qué se hizo o qué criterio se fijó]

#### Aprendizaje operativo

[qué regla deja para el futuro]

---

## 6. Qué no debe entrar en este documento

No deben entrar aquí:

- backlog general;
- decisiones maestras ya consolidadas;
- rutas canónicas completas;
- reglas generales de Git/deploy;
- procedimientos permanentes.

Si una entrada no describe una incidencia real con diagnóstico, no pertenece aquí.

---

## 7. Dependencias y relación con otros documentos

### Este documento depende de

- `00-INDICE-MAESTRO.md`
- `03-INVENTARIO-TECNICO.md`
- `04-RUTAS-CANONICAS.md`
- `07-GIT-DEPLOY-HIGIENE.md`

### Este documento alimenta

- `01-DECISIONES-CERRADAS.md` cuando una incidencia genera una regla estable
- `06-PROCEDIMIENTOS-OPERATIVOS.md` cuando una incidencia obliga a crear un procedimiento repetible
- `02-PENDIENTES-PRIORIZADOS.md` cuando una incidencia sigue abierta o bloqueada

---

## 8. Veredicto operativo

Este documento deja trazabilidad de las incidencias reales ya detectadas en la reconducción de Sistema Maestro.

Su función es evitar:

- repetición de errores;
- pérdida de memoria técnica;
- falsa sensación de avance sin diagnóstico;
- improvisación ante problemas ya vividos.