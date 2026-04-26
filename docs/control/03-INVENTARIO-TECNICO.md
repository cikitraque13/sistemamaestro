# 03-INVENTARIO-TECNICO

## Estado del documento

- Estado: activo
- Tipo: inventario técnico canónico
- Alcance: proyecto completo `Sistema Maestro`
- Objetivo: describir qué existe realmente hoy en el sistema, separando producto real, entorno regenerable, capas auxiliares, documentación canónica y piezas pendientes de implementación o clasificación exacta.

---

## 1. Función de este documento

Este documento existe para responder con claridad a una sola pregunta:

**¿Qué existe realmente hoy en Sistema Maestro?**

No fija qué ruta manda.
No define políticas de Git o deploy.
No prioriza tareas.
No cierra procedimientos.
No sustituye contratos técnicos.
No decide el roadmap.

Su función es inventariar el sistema real para que después puedan cerrarse sin solape:

- `04-RUTAS-CANONICAS.md`;
- `07-GIT-DEPLOY-HIGIENE.md`;
- `02-PENDIENTES-PRIORIZADOS.md`;
- contratos técnicos;
- procedimientos operativos;
- roadmap de implementación.

---

## 2. Lectura general actual

Sistema Maestro ya no debe interpretarse como una carpeta local inflada por el entorno.

La auditoría realizada obliga a separar estos niveles:

1. producto real;
2. documentación canónica;
3. entorno regenerable;
4. temporales y cachés;
5. salida / build / deploy;
6. auxiliares por revisar;
7. piezas aprobadas pero pendientes de implementación.

La mayor distorsión visual del proyecto viene del ecosistema frontend instalado con Node, no del volumen real del producto.

### Lectura ejecutiva

Sistema Maestro ya contiene producto real.

No es una maqueta vacía.

El problema principal no es ausencia de sistema, sino necesidad de alinear lo existente con gobierno canónico, Builder vivo, contratos técnicos y salida verificable.

---

## 3. Capas del sistema

## 3.1 Producto real

Se considera producto real todo lo que define comportamiento, estructura, experiencia visible y evolución del sistema.

Incluye:

- frontend fuente;
- backend fuente;
- documentación canónica;
- activos públicos;
- módulos funcionales del producto;
- Builder;
- Auth;
- Dashboard;
- App Shell;
- Billing;
- proyectos;
- informes;
- oportunidades;
- settings;
- flujo de activación;
- capa de créditos;
- capa IA puente/preparada;
- contratos y doctrina de producto.

---

## 3.2 Documentación canónica

Se considera documentación canónica todo documento que gobierna una parte estable del sistema.

Incluye:

- `docs/control/`;
- `docs/product/sistema-maestro/`;
- documentación de arquitectura si está alineada;
- documentación técnica de créditos si está alineada;
- documentos que hayan sido cerrados por decisión estructural.

### Regla

La documentación canónica no es un almacén de trabajo temporal.

No debe contener backups, dumps, validaciones efímeras ni copias duplicadas.

---

## 3.3 Entorno regenerable

Se considera entorno regenerable todo lo que no define el producto y puede reinstalarse o volver a generarse.

Incluye:

- dependencias del frontend;
- `node_modules`;
- subdependencias internas;
- paquetes del toolchain.

---

## 3.4 Temporales y cachés

Se consideran temporales o cachés las salidas auxiliares que no deben confundirse con fuente real.

Incluyen:

- `.cache`;
- artefactos intermedios;
- salidas temporales de loaders y bundlers;
- logs;
- dumps de lectura;
- validaciones puntuales;
- archivos generados para auditoría temporal.

---

## 3.5 Salida / build / deploy

Se considera salida todo artefacto generado para ejecución, empaquetado, build, entrega o despliegue.

Incluye:

- `build`;
- `dist`;
- empaquetados;
- resultados generados;
- ZIPs de entrega;
- salidas de deploy.

### Regla

La salida no define por sí misma la arquitectura del producto.

---

## 3.6 Piezas aprobadas pero pendientes de implementación

Una pieza puede estar aprobada documentalmente y todavía no existir físicamente en el árbol.

Debe distinguirse de:

- pieza existente;
- pieza canónica activa;
- pieza pendiente;
- pieza legacy;
- pieza regenerable.

### Pieza crítica aprobada pendiente de implementación

```text
frontend/src/features/builder/state/
```

Esta subcapa está aprobada como ruta canónica interna del Builder, pero su creación técnica pertenece a la siguiente fase de implementación.

---

## 4. Inventario técnico por áreas

## 4.1 Raíz del proyecto

La raíz del proyecto contiene varias zonas diferenciadas.

### Zonas identificadas como sistema real

- `frontend/`;
- `backend/`;
- `docs/`.

### Zonas auxiliares o pendientes de clasificación final

- `tests/`.

### Zonas retiradas o no activas si existieran

- `memory/`;
- `test_reports/`;
- `railway/`.

### Infraestructura de repositorio

- `.git`.

La raíz debe leerse como punto de entrada del sistema, no como representación directa del producto final.

---

## 4.2 Frontend

`frontend/` es la capa visible principal del producto.

### Función

Contener:

- interfaz visible;
- navegación;
- experiencia de usuario;
- Builder;
- Home;
- Dashboard;
- App Shell;
- Auth;
- Billing;
- proyectos;
- reports;
- settings;
- oportunidades;
- parte de la lógica de producto del lado cliente.

### Subcapas reconocidas

- `frontend/src/` → fuente real de frontend;
- `frontend/public/` → activos públicos del frontend;
- `frontend/src/features/` → capa principal de producto modular;
- `frontend/src/components/` → componentes compartidos válidos;
- `frontend/node_modules/` → dependencia regenerable.

### Observación clave

El gran volumen de archivos del proyecto local no implica un frontend mal concebido.

Implica un entorno Node instalado con sus dependencias y artefactos.

---

## 4.3 Frontend funcional por módulos

Dentro de `frontend/src/features/`, se han identificado módulos reales del producto.

### Módulos reconocidos

- `activation-flow`;
- `app-shell`;
- `auth`;
- `billing`;
- `builder`;
- `dashboard`;
- `flow`;
- `home`;
- `opportunities`;
- `projects`;
- `reports`;
- `settings`.

### Lectura

Esto confirma que el frontend no está estructurado como una masa plana.

Existe una arquitectura modular ya encaminada.

---

## 4.4 Pages residuales

La carpeta `frontend/src/pages/` ya no actúa como capa principal del producto.

### Estado aprobado

Queda reducida a páginas legales residuales, como:

- `Privacy.js`;
- `Cookies.js`;
- `Terms.js`.

### Interpretación correcta

No se considera capa principal de producto.

Se considera excepción residual temporal para contenido legal estático.

### Regla derivada

No se aprueban nuevas páginas de producto dentro de `frontend/src/pages/`.

---

## 4.5 Enrutado principal del producto

El enrutado principal del frontend ya se apoya en módulos dentro de `frontend/src/features/`.

### Lectura

La migración principal `pages -> features` está funcionalmente muy avanzada.

El sistema principal ya se enruta desde la nueva capa modular.

Esto no significa que no puedan quedar restos residuales, pero sí fija que `features` es la capa real de producto visible.

---

## 4.6 Auth

`auth` existe como módulo reconocido del producto.

### Alcance observado

Incluye al menos piezas equivalentes de:

- login;
- register;
- callback;
- flujo de autenticación.

### Lectura

Auth no debe tratarse como pieza suelta.

Debe leerse como subsistema propio dentro del producto.

---

## 4.7 Dashboard y operación interna

Existen módulos reales de operación del usuario dentro del sistema.

### Áreas observadas

- `dashboard`;
- `projects`;
- `opportunities`;
- `billing`;
- `reports`;
- `settings`;
- `flow`.

### Lectura

Sistema Maestro ya contiene una base operativa interna real, más allá de Home, landing o acceso.

---

## 4.8 Home

`home` existe como módulo de entrada, orientación y conversión.

### Función

Debe actuar como entrada comercial y narrativa del sistema.

### Lectura

Home no debe absorber lógica interna del Builder.

Debe orientar, generar confianza y conducir al usuario hacia activación, Dashboard o Builder.

---

## 4.9 App Shell

`app-shell` existe como módulo operativo interno.

### Función

Debe ordenar:

- navegación;
- módulos;
- estados;
- sensación premium interna;
- acceso a proyectos;
- acceso a créditos;
- continuidad.

### Lectura

App Shell es carcasa operativa, no bloque visual aislado.

---

## 4.10 Builder

`builder` existe como módulo reconocido y núcleo del producto visible.

### Lectura estructural

Builder no debe tratarse como:

- accesorio;
- demo visual;
- chat decorado;
- pantalla cosmética.

Debe tratarse como pieza central del producto.

### Estado actual

Su existencia modular está confirmada.

Su siguiente evolución crítica no es visual.

Su siguiente evolución crítica es estructural:

```text
BuilderBuildKernel
+
BuilderBuildState
+
mutaciones
+
preview/código/estructura sincronizados
```

---

## 4.11 Subcapa Builder state

La subcapa siguiente queda aprobada pero pendiente de implementación física:

```text
frontend/src/features/builder/state/
```

### Estado

- Aprobada documentalmente.
- Pendiente de creación técnica.
- No debe tratarse como ya implementada hasta que exista en el árbol.

### Archivos previstos

- `builderBuildKernel.js`;
- `builderBuildState.js`;
- `builderMutationRegistry.js`;
- `builderOutputMap.js`;
- `builderQuestionFlowRegistry.js`;
- `builderStructureRegistry.js`;
- `builderKnowledgeIndex.js`.

### Función prevista

Coordinar:

- input de usuario;
- interpretación IA;
- mutaciones;
- estado vivo;
- preview;
- código;
- estructura;
- siguientes decisiones.

### Regla

No debe convertirse en megaarchivo.

Debe ser subcapa modular.

---

## 4.12 Builder: piezas relacionadas que no deben tocarse antes de tiempo

Quedan identificadas como piezas sensibles para fases posteriores:

- `BuilderAgentPane.js`;
- `BuilderCanvasPane.js`;
- `useBuilderWorkspaceRuntime.js`;
- `builderCodeTemplates.js`.

### Estado

No se deben tratar como causa raíz aislada del fallo vivido.

Antes de tocarlas debe existir o estar preparada la subcapa `builder/state/`.

### Lectura

Si se tocan antes de tener estado vivo, se corre el riesgo de volver a corregir síntomas visuales sin resolver la construcción real.

---

## 4.13 Backend

`backend/` existe como capa real del sistema.

### Función

Alojar:

- lógica servidora;
- endpoints;
- auth;
- proyectos;
- pagos;
- créditos;
- persistencia;
- informes;
- consumo;
- IA puente;
- servicios;
- soporte futuro de exportación y despliegue.

### Estructura reconocida

La arquitectura interna reconocida se apoya en:

- `backend/app/`;
- `backend/app/core/`;
- `backend/app/db/`;
- `backend/app/routers/`;
- `backend/app/services/`;
- `backend/config/`;
- `backend/requirements.txt`.

### Entrada canónica reconocida

```text
backend/app/main.py
```

### Referencia de runtime

```text
backend.app.main:app
```

### Lectura

Backend es capa real, no caja negra.

Debe evolucionar de forma modular, no reactivando legacy runtime.

---

## 4.14 Backend IA

Existe una ruta reconocida como estructura puente/preparada:

```text
backend/app/ai/
```

### Estado

- Estructura real reconocida.
- Puente/preparada.
- No debe tratarse todavía como runtime IA vivo de extremo a extremo.

### Lectura

Puede contener orquestador, guards, memoria, telemetry, schemas, tools registry, eval registry o agentes en distintos estados.

### Regla

No se vende internamente como IA viva completa hasta fase formal de activación.

---

## 4.15 Créditos backend

Existe una capa real reconocida de créditos:

```text
backend/config/credits/
```

### Estado

Capa activa real del sistema.

### Función

Puede sostener:

- catálogo de acciones;
- tiers;
- thresholds;
- contratos request/response;
- consumo;
- evaluación;
- integración con balance;
- billing;
- payments.

### Lectura

Créditos no son idea futura difusa.

Ya forman parte estructural del sistema.

### Regla

No deben conectarse a acciones simuladas.

---

## 4.16 Billing y payments

`billing` existe como módulo frontend y el backend reconoce capas de pagos/consumo asociables.

### Función

Sostener:

- planes;
- recomendaciones;
- consumo;
- créditos;
- recargas futuras;
- integración con pagos;
- continuidad.

### Lectura

Billing no debe evolucionar antes de cerrar la relación real entre:

```text
suscripción
créditos
exportación
acciones intensivas
salida verificable
```

---

## 4.17 Documentación

`docs/` existe como parte real del sistema.

### Función

Centralizar documentación útil y consolidar memoria operativa canónica.

### Carpetas canónicas reconocidas

- `docs/control/`;
- `docs/product/sistema-maestro/`.

### Carpetas esperadas o auxiliares

- `docs/architecture/`;
- `docs/system/credits/`;
- `docs/control/audit/`.

### Regla

La documentación canónica manda sobre memoria informal de chat.

---

## 4.18 Docs control

`docs/control/` es la carpeta canónica de gobierno estructural.

### Documentos reconocidos

- `00-INDICE-MAESTRO.md`;
- `01-DECISIONES-CERRADAS.md`;
- `02-PENDIENTES-PRIORIZADOS.md`;
- `03-INVENTARIO-TECNICO.md`;
- `04-RUTAS-CANONICAS.md`;
- `05-INCIDENCIAS-Y-DIAGNOSTICOS.md`;
- `06-PROCEDIMIENTOS-OPERATIVOS.md`;
- `07-GIT-DEPLOY-HIGIENE.md`.

### Estado

Debe permanecer limpia.

No debe contener backups, dumps ni duplicados.

---

## 4.19 Docs producto Sistema Maestro

`docs/product/sistema-maestro/` es la carpeta canónica de doctrina de producto.

### Documentos reconocidos

- `00-INDICE.md`;
- `01-PRODUCTO-MAESTRO-V2.md`;
- `02-ACTIVACION-DOCTRINA.md`;
- `03-CREDITOS-Y-ECONOMIA.md`;
- `04-EXPERIENCIA-CONSTRUCTOR-VISIBLE.md`;
- `05-CONTRATOS-TECNICOS-V1.md`;
- `06-ROADMAP-DE-IMPLEMENTACION-V1.md`.

### Estado

Debe permanecer limpia.

No debe contener backups, dumps ni versiones parciales.

---

## 4.20 Configuración y manifiestos

El sistema dispone de configuración y manifiestos suficientes para ser tratado como proyecto serio.

### Elementos reconocidos

- `.gitignore`;
- `frontend/package.json`;
- `frontend/package-lock.json`;
- variables locales del frontend;
- documentación de control;
- configuración backend;
- requirements backend.

### Lectura

La base de configuración existe.

El gestor aprobado para frontend es npm.

`frontend/package-lock.json` es el lockfile canónico.

---

## 4.21 Legacy runtime y rutas retiradas

Se reconoce que determinadas rutas o piezas legacy han sido retiradas o no forman parte del runtime activo.

### Piezas legacy retiradas del repo activo

- `backend/server.py`;
- `railway/server_railway.py`;
- `railway/requirements.txt`.

### Rutas retiradas del repo activo por saneo

- `memory/`;
- `test_reports/`.

### Regla

No deben reintroducirse como verdad activa sin decisión formal.

---

## 4.22 Tests

`tests/` se reconoce como ruta auxiliar válida si existe.

### Estado

Auxiliar, no núcleo canónico.

### Función

Puede servir de soporte técnico.

### Regla

No debe borrarse a ciegas.

---

## 5. Clasificación del sistema

## 5.1 Fuente real reconocida

Se reconoce como fuente real del sistema:

- `frontend/src/`;
- `frontend/public/`;
- `backend/`;
- `docs/control/`;
- `docs/product/sistema-maestro/`.

---

## 5.2 Fuente funcional principal del producto

Se reconoce como capa principal del producto visible y enrutable:

```text
frontend/src/features/
```

---

## 5.3 Fuente residual temporal aprobada

Se reconoce como residual temporal aprobada:

- `frontend/src/pages/Privacy.js`;
- `frontend/src/pages/Cookies.js`;
- `frontend/src/pages/Terms.js`.

---

## 5.4 Entorno regenerable reconocido

Se reconoce como entorno regenerable:

- `frontend/node_modules/`;
- cualquier `node_modules/` interno;
- `.cache/`;
- `build/`;
- `dist/`;
- salidas del toolchain.

---

## 5.5 Auxiliares válidos o por revisar

Se reconocen como auxiliares válidos o por revisar:

- `tests/`;
- `docs/control/audit/`.

Si reaparecen o existen:

- `memory/`;
- `test_reports/`;
- `railway/`.

deben mantenerse fuera del núcleo activo salvo decisión formal.

---

## 5.6 Piezas aprobadas pendientes de creación

Se reconoce como pieza aprobada pendiente de creación técnica:

```text
frontend/src/features/builder/state/
```

### Lectura

No es legacy.

No es regenerable.

No existe como verdad operativa completa hasta que se implemente.

---

## 6. Riesgos detectados por este inventario

## 6.1 Riesgo de falsa percepción

Mirar el proyecto completo sin separar capas produce una imagen inflada y engañosa del sistema.

## 6.2 Riesgo de mezclar producto con entorno

Sin este inventario, podían confundirse dependencias regenerables con arquitectura real.

## 6.3 Riesgo de tocar piezas equivocadas

Sin distinguir fuente, residual, auxiliar, canónica, pendiente y regenerable, cualquier saneo podía romper capas válidas.

## 6.4 Riesgo de crecer sin gobierno

Builder, auth, backend, motor e IA pueden quedar activos pero mal encajados si no se formaliza la estructura antes de seguir creciendo.

## 6.5 Riesgo de Builder simulado

Si Builder no se conecta a estado vivo, preview, código y estructura, puede parecer activo sin construir realmente.

## 6.6 Riesgo de monetización prematura

Créditos, exportación y deploy no deben apoyarse sobre salidas simuladas.

## 6.7 Riesgo de duplicación documental

Backups, dumps y duplicados dentro de carpetas canónicas degradan la autoridad de los documentos principales.

---

## 7. Qué no decide este documento

Este documento no decide:

- qué ruta manda de forma canónica;
- qué política de Git o higiene manda;
- qué se despliega;
- qué se borra;
- qué prioridad tiene cada pendiente;
- qué procedimiento operativo debe seguirse;
- cómo se implementa `BuilderBuildKernel`;
- cómo se implementa `BuilderBuildState`;
- qué coste exacto tendrán los créditos;
- qué pricing final se publicará;
- cuándo procede deploy final.

Esas decisiones pertenecen a otros documentos.

---

## 8. Qué documentos dependen de este inventario

Este documento alimenta directamente:

- `04-RUTAS-CANONICAS.md`;
- `07-GIT-DEPLOY-HIGIENE.md`;
- `02-PENDIENTES-PRIORIZADOS.md`;
- `06-PROCEDIMIENTOS-OPERATIVOS.md`;
- `docs/product/sistema-maestro/05-CONTRATOS-TECNICOS-V1.md`;
- `docs/product/sistema-maestro/06-ROADMAP-DE-IMPLEMENTACION-V1.md`.

Sin este inventario, esos documentos nacerían con mezcla o con huecos.

---

## 9. Veredicto técnico actual

Sistema Maestro ya dispone de base real de producto.

No estamos ante un proyecto vacío.
No estamos ante una simple maqueta.
No estamos ante una carpeta sin estructura.

Estamos ante un sistema que ya contiene:

- frontend modular;
- backend reconocido;
- backend modular;
- auth;
- dashboard y operación;
- Builder;
- Home;
- App Shell;
- Billing;
- proyectos;
- reports;
- settings;
- documentación canónica;
- capa de créditos real;
- capa IA puente/preparada;
- doctrina de producto;
- contratos técnicos;
- roadmap de implementación.

El problema principal detectado no es ausencia de sistema.

El problema principal detectado es que el Builder debe reconducirse desde señales visuales hacia construcción real basada en estado vivo.

---

## 10. Conclusión operativa

A partir de este inventario, la lectura oficial del sistema queda así:

- el producto real existe;
- la fuente real ya está suficientemente visible;
- el entorno regenerable ya no debe confundirse con producto;
- `features` es la capa principal del frontend;
- `pages` queda reducida a residual legal temporal;
- Builder es núcleo de producto;
- Builder necesita subcapa viva `state/`;
- backend es capa real del sistema;
- backend modular vive en `backend/app/`;
- `backend/app/main.py` es entrada backend reconocida;
- `backend/app/ai/` es IA puente/preparada;
- `backend/config/credits/` es capa real de créditos;
- docs de control y docs de producto son canónicos;
- créditos, exportación y deploy deben apoyarse sobre salida real;
- el siguiente salto técnico correcto es crear `frontend/src/features/builder/state/` después de cerrar la alineación documental.

La verdad técnica actual queda resumida así:

```text
producto real existe
Builder existe
estado vivo del Builder todavía debe implementarse
preview/código/estructura deben sincronizarse
monetización intensiva debe esperar salida verificable
```