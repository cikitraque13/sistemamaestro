# 07-GIT-DEPLOY-HIGIENE

## Estado del documento

- Estado: activo
- Tipo: política de Git, ZIP, deploy e higiene técnica
- Alcance: proyecto completo `Sistema Maestro`
- Objetivo: fijar qué entra en Git, qué no entra, qué puede borrarse, qué no debe entrar en ZIP y qué condiciones deben cumplirse antes de pensar en deploy.

---

## 1. Función de este documento

Este documento existe para responder con claridad a estas preguntas:

- qué entra en Git;
- qué no entra en Git;
- qué puede borrarse sin dañar el producto;
- qué no debe entrar en ZIP;
- qué no debe entrar en deploy;
- qué condiciones mínimas de seguridad e higiene exige el proyecto antes de entregar o desplegar.

No inventa el sistema.
No fija qué ruta manda.
No prioriza tareas de producto.
No sustituye al inventario ni a las rutas canónicas.
No decide el roadmap.
No sustituye los contratos técnicos.

Su función es fijar la manipulación segura del proyecto.

---

## 2. Principio rector

Sistema Maestro no debe tratarse como una carpeta local bruta.

Toda acción sobre el repo, los archivos, los paquetes, el ZIP o el deploy debe distinguir entre:

1. fuente real;
2. entorno regenerable;
3. temporales y cachés;
4. salida de build;
5. auxiliares por revisar;
6. documentos canónicos;
7. dumps o auditorías temporales;
8. backups operativos.

### Regla principal

El repo debe reflejar producto real, documentación canónica y configuración segura.

No debe reflejar ruido operativo.

---

## 3. Base estructural de esta política

Esta política se apoya en estas decisiones previas:

- `frontend/`, `backend/` y `docs/control/` son rutas canónicas del sistema;
- `frontend/src/` y `frontend/public/` son rutas canónicas del frontend;
- `frontend/src/features/` es la capa principal del producto frontend;
- `frontend/src/features/builder/` es la ruta funcional canónica del Builder;
- `frontend/src/features/builder/state/` queda aprobada como subcapa canónica interna del Builder;
- `frontend/src/pages/` queda solo como residual legal temporal;
- `frontend/node_modules/`, `.cache/`, `build/` y `dist/` no son canónicos;
- npm queda como gestor único del frontend;
- `docs/control/` y `docs/product/sistema-maestro/` deben permanecer limpios;
- deploy final no procede mientras Builder no produzca salida verificable.

---

## 4. Qué entra en Git

## 4.1 Sí entra en Git

Debe entrar en Git todo lo que defina el producto real o su gobierno técnico.

### Incluye

- `frontend/src/`;
- `frontend/public/`;
- `backend/`;
- `docs/control/`;
- `docs/product/sistema-maestro/`;
- `docs/architecture/` si está alineada con la canonicidad actual;
- `docs/system/credits/` si está alineada con la doctrina de créditos vigente;
- archivos de configuración canónicos;
- manifiestos reales del proyecto;
- `frontend/package.json`;
- `frontend/package-lock.json`;
- `.gitignore`;
- documentación canónica aprobada;
- código fuente de módulos reales del producto;
- rutas residuales legales aún aprobadas.

### Cuando se cree

También debe entrar en Git:

```text
frontend/src/features/builder/state/
```

con sus archivos modulares:

- `builderBuildKernel.js`;
- `builderBuildState.js`;
- `builderMutationRegistry.js`;
- `builderOutputMap.js`;
- `builderQuestionFlowRegistry.js`;
- `builderStructureRegistry.js`;
- `builderKnowledgeIndex.js`.

---

## 4.2 Entra en Git con revisión

Puede entrar en Git, pero requiere validación consciente, todo lo que sea:

- documentación técnica auxiliar estabilizada;
- material de auditoría que haya sido convertido en criterio canónico;
- scripts operativos reales;
- configuraciones nuevas aún no consolidadas;
- rutas auxiliares que todavía no han sido elevadas a canónicas;
- documentación de arquitectura que no contradiga `docs/control/`;
- documentación de sistema que no contradiga `docs/product/sistema-maestro/`.

### Regla

No entra nada ambiguo “por si acaso”.

Si no está claro si una pieza es fuente, auxiliar, temporal o regenerable, no se commitea hasta clasificarla.

---

## 5. Qué no entra en Git

## 5.1 No entra nunca

No deben entrar en Git las rutas regenerables, temporales o sensibles.

### Incluye

- `frontend/node_modules/`;
- cualquier `node_modules/` interno;
- cualquier `.cache/`;
- cualquier `build/`;
- cualquier `dist/`;
- temporales del toolchain;
- logs;
- salidas efímeras de entorno;
- variables locales de máquina;
- credenciales;
- tokens;
- llaves;
- secretos;
- dumps temporales de auditoría;
- archivos de validación puntual;
- backups operativos;
- copias con sufijos `.backup-*`;
- copias con sufijos `.bak`;
- archivos generados para inspección puntual que ya cumplieron su función.

---

## 5.2 Variables y secretos

No entran en Git:

- `.env`;
- `.env.local`;
- `.env.*.local`;
- credenciales reales;
- tokens reales;
- llaves privadas;
- ficheros sensibles de autenticación;
- dumps que puedan contener rutas, trazas, tokens o estado local sensible.

### Excepción

Sí puede entrar una plantilla segura tipo:

- `.env.example`

si no expone datos reales.

---

## 6. Política de lockfiles y gestor de paquetes

## 6.1 Gestor de paquetes aprobado

Para el frontend se aprueba:

**npm**

### Regla

npm es el gestor único operativo del frontend.

---

## 6.2 Lockfile aprobado

Se aprueba como lockfile canónico:

```text
frontend/package-lock.json
```

---

## 6.3 Lockfile no aprobado

No se aprueba como lockfile activo:

```text
frontend/yarn.lock
```

### Regla

No deben convivir dos verdades de dependencias en paralelo.

Si aparece un lockfile alternativo, debe clasificarse antes de tocar dependencias.

---

## 7. Qué puede borrarse

## 7.1 Borrable regenerable

Puede borrarse, si hace falta regenerar o limpiar, todo lo que sea claramente regenerable.

### Incluye

- `frontend/node_modules/`;
- `.cache/`;
- `build/`;
- `dist/`;
- artefactos temporales del entorno;
- logs;
- salidas de compilación no canónicas.

### Condición

Solo se borra si se entiende que puede reinstalarse o regenerarse.

---

## 7.2 Borrable operativo

Puede borrarse o sacarse del repo activo cuando ya haya cumplido su función:

- dumps de auditoría generados en raíz;
- archivos `*-audit.txt`;
- archivos `*-dump.txt`;
- archivos `*-validation-result.txt`;
- archivos `builder-*-files.txt`;
- backups `*.backup-*`;
- backups `*.backup-doclock-*`;
- copias parciales de documentos canónicos;
- salidas temporales creadas para inspección.

### Regla

Estos archivos no forman parte de la memoria canónica.

Si ya se extrajo el criterio útil y se actualizó el documento correcto, el temporal se elimina o se saca del repo activo.

---

## 7.3 No borrable sin auditoría previa

No debe borrarse sin validación explícita:

- `frontend/src/`;
- `frontend/public/`;
- `backend/`;
- `docs/control/`;
- `docs/product/sistema-maestro/`;
- módulos de `frontend/src/features/`;
- rutas residuales legales actualmente aprobadas;
- configuración real del proyecto;
- manifiestos canónicos;
- contratos técnicos;
- documentos de decisiones, rutas, incidencias, pendientes o procedimientos.

---

## 7.4 Auxiliares por revisar

Estas rutas no deben borrarse a ciegas si existen:

- `memory/`;
- `test_reports/`;
- `railway/`;
- `tests/`.

### Regla

Mientras no se cierre su papel exacto, se consideran zonas auxiliares pendientes de evaluación, no basura automática.

---

## 8. Política de carpetas canónicas limpias

## 8.1 Carpetas protegidas

Estas carpetas deben permanecer limpias:

```text
docs/control/
docs/product/sistema-maestro/
```

### Solo deben contener

- documentos canónicos reales;
- subcarpetas aprobadas;
- archivos finales con función clara.

---

## 8.2 Qué no debe vivir en carpetas canónicas

No deben quedarse ahí:

- backups;
- duplicados;
- dumps;
- validaciones temporales;
- copias con fecha;
- archivos `.backup-*`;
- archivos `.bak`;
- versiones parciales;
- salidas de PowerShell;
- pruebas de auditoría;
- documentos sin función canónica.

### Regla

La carpeta canónica no es almacén de trabajo.

Es autoridad documental.

---

## 9. Política de ZIP

## 9.1 Qué no debe entrar en ZIP

No debe entrar en ningún ZIP de entrega o transferencia:

- `node_modules/`;
- `.cache/`;
- `build/` o `dist/` internos del entorno salvo caso específico de salida final aprobada;
- logs;
- temporales;
- credenciales;
- secretos;
- backups informales;
- dumps de auditoría;
- validaciones puntuales;
- material inflado del entorno local.

---

## 9.2 Qué sí puede entrar en ZIP

Solo debe entrar en ZIP aquello que pertenezca a una de estas categorías:

- fuente real del sistema;
- configuración segura y necesaria;
- documentación canónica;
- salida final aprobada para un objetivo concreto;
- estructura exportable generada de forma coherente.

### Regla

Nunca se crea un ZIP “de toda la carpeta del proyecto”.

Un ZIP debe tener objetivo, alcance y criterio.

---

## 10. Política de deploy

## 10.1 Regla principal

No se despliega el proyecto bruto.

### Nunca debe desplegarse

- el escritorio completo;
- la carpeta local completa;
- el proyecto con regenerables dentro;
- el repo en estado mezclado;
- una build sin clasificación previa;
- una preview simulada;
- una estructura generada sin coherencia;
- código que no represente la preview;
- una versión donde Builder prometa más de lo que entrega.

---

## 10.2 Qué puede alimentar un deploy

Un deploy solo puede salir de:

- fuente canónica validada;
- configuración válida de entorno;
- build controlado y reproducible;
- estado técnico sin frentes mezclados;
- código coherente;
- estructura coherente;
- backend validado si aplica;
- entorno revisado;
- permisos y secretos correctamente gestionados.

---

## 10.3 Estado actual del proyecto respecto a deploy

En el momento actual:

**deploy final no procede todavía.**

### Motivos

- el sistema está en reconducción estructural;
- la capa documental canónica está siendo alineada;
- Builder necesita `BuilderBuildKernel` y `BuilderBuildState`;
- preview, código y estructura aún deben sincronizarse;
- créditos, exportación y deploy deben apoyarse sobre salida real;
- backend, IA y persistencia avanzada deben activarse por fases;
- el proyecto no debe pasar a producción mientras siga en fase de afinado quirúrgico.

---

## 10.4 Regla específica para Builder y deploy

No se autoriza deploy final mientras no se cumpla:

```text
BuilderBuildState
→ preview coherente
→ código coherente
→ estructura coherente
→ validación técnica
```

### Regla

No deploy sin coherencia técnica.

---

## 11. Política de staging y commits

## 11.1 Regla de commits

No se mezclan en un mismo commit:

- higiene técnica;
- migración estructural;
- cambios de producto;
- cambios visuales;
- cambios de autenticación;
- documentación canónica;
- refactor paralelo;
- runtime;
- créditos;
- exportación;
- deploy.

### Regla

Cada commit debe tener una sola finalidad principal.

---

## 11.2 Regla de staging

Antes de hacer un commit:

1. se limpia staging;
2. se agrupan cambios por finalidad;
3. se revisa el diff;
4. se comprueba que no haya intrusos regenerables;
5. se valida que no se cuelen secretos o auxiliares erróneos;
6. se valida que no entren backups o dumps temporales;
7. se valida que no haya documentos canónicos duplicados.

---

## 11.3 Regla de commits canónicos

No se hace commit de una estructura documental vacía como si fuera ya documentación cerrada.

No se hace commit de auditorías temporales como si fueran canónicas.

No se hace commit de cambios mezclados “para avanzar más rápido”.

### Orden recomendado de commits próximos

1. documentación canónica;
2. creación de `frontend/src/features/builder/state/`;
3. conexión runtime;
4. conexión preview/código/estructura;
5. ajuste visual del Builder;
6. créditos/export/deploy cuando proceda.

---

## 12. Política de backups y seguridad operativa

## 12.1 Backups de trabajo

Los backups o snapshots de apoyo pueden existir solo como soporte temporal fuera de carpetas canónicas.

### Regla

No se elevan automáticamente a documentación canónica ni a commit estable.

---

## 12.2 Backups en carpetas canónicas

No deben quedarse backups en:

```text
docs/control/
docs/product/sistema-maestro/
```

### Regla

Si aparece un backup en carpeta canónica, debe eliminarse o sacarse del repo activo.

La carpeta canónica debe quedar limpia.

---

## 12.3 Backups sensibles

Si un backup contiene:

- estado de Git;
- lockfiles antiguos;
- `.gitignore` previo;
- referencias de transición;
- rutas locales;
- información de entorno;
- datos sensibles;

debe tratarse como material auxiliar externo, no como parte del producto.

---

## 13. Relación con `docs/control/`

## 13.1 Qué sí puede vivir en `docs/control/`

- documentos canónicos aprobados;
- subcarpeta `audit/` si se mantiene como soporte de auditoría;
- memoria operativa estabilizada del sistema.

## 13.2 Qué no debe quedarse ahí como canónico

- snapshots efímeros con fecha sin criterio;
- backups de prueba;
- restos de staging;
- duplicados con la misma función;
- ruido temporal de validaciones;
- documentos parciales;
- dumps pegados como verdad.

### Regla

`docs/control/` es gobierno.

No es contenedor de basura operativa.

---

## 14. Relación con `docs/product/sistema-maestro/`

## 14.1 Qué sí puede vivir ahí

- `00-INDICE.md`;
- `01-PRODUCTO-MAESTRO-V2.md`;
- `02-ACTIVACION-DOCTRINA.md`;
- `03-CREDITOS-Y-ECONOMIA.md`;
- `04-EXPERIENCIA-CONSTRUCTOR-VISIBLE.md`;
- `05-CONTRATOS-TECNICOS-V1.md`;
- `06-ROADMAP-DE-IMPLEMENTACION-V1.md`;
- documentos expresamente aprobados en el futuro.

## 14.2 Qué no debe vivir ahí

- backups;
- copias con sufijos;
- validaciones temporales;
- dumps de auditoría;
- archivos sin función doctrinal;
- documentos duplicados.

---

## 15. Reglas derivadas

## 15.1 Regla de fuente

Solo se considera fuente de producto:

- lo que viva en rutas canónicas ya aprobadas;
- lo que haya sido documentado como parte real del sistema.

## 15.2 Regla de entorno

Todo regenerable:

- no define el producto;
- no se usa como referencia de complejidad real;
- no debe contaminar Git, ZIP o deploy.

## 15.3 Regla de entrega

Toda entrega debe salir de:

- una selección controlada;
- un criterio claro;
- una estructura gobernada;
- una fuente coherente.

## 15.4 Regla de prudencia

Si una ruta no está clasificada todavía, no se despliega, no se borra a ciegas y no se convierte en regla estructural sin validación.

## 15.5 Regla de Builder

No se hace entrega, ZIP, exportación o deploy de una salida del Builder si:

- no tiene estado vivo;
- no tiene preview coherente;
- no tiene código coherente;
- no tiene estructura coherente.

---

## 16. Qué no decide este documento

Este documento no decide:

- qué existe exactamente en el sistema;
- qué ruta manda de forma estructural;
- qué prioridad tiene cada pendiente;
- qué arquitectura final tendrá el motor;
- qué ubicación exacta tendrán IA e integraciones;
- cómo se implementa `BuilderBuildKernel`;
- cómo se implementa `BuilderBuildState`;
- qué coste exacto tendrá cada acción;
- qué planes comerciales finales se publicarán.

Esas decisiones pertenecen a otros documentos.

---

## 17. Dependencias de este documento

### Depende de

- `03-INVENTARIO-TECNICO.md`;
- `04-RUTAS-CANONICAS.md`;
- `01-DECISIONES-CERRADAS.md`;
- `02-PENDIENTES-PRIORIZADOS.md`;
- `05-INCIDENCIAS-Y-DIAGNOSTICOS.md`;
- `06-PROCEDIMIENTOS-OPERATIVOS.md`;
- `docs/product/sistema-maestro/05-CONTRATOS-TECNICOS-V1.md`;
- `docs/product/sistema-maestro/06-ROADMAP-DE-IMPLEMENTACION-V1.md`.

### Alimenta

- criterio de commit limpio;
- criterio de ZIP;
- criterio de limpieza segura;
- criterio de deploy;
- procedimientos operativos;
- futura preparación seria de release.

---

## 18. Criterio de cierre antes de commit

Antes de cerrar un commit documental o técnico, debe confirmarse que:

- no hay backups en carpetas canónicas;
- no hay dumps temporales en raíz;
- no hay archivos regenerables añadidos;
- no hay secretos;
- no hay commits mezclados;
- el cambio responde a una finalidad principal;
- los documentos modificados no se contradicen;
- si se toca Builder, el cambio respeta la cadena aprobada.

### Cadena aprobada de Builder

```text
decisión cerrada
→ ruta canónica
→ incidencia si aplica
→ pendiente priorizado
→ contrato técnico
→ procedimiento
→ roadmap
→ implementación
```

---

## 19. Veredicto operativo actual

La política de higiene de Sistema Maestro queda fijada así:

### Sí entra en Git

- fuente real;
- documentación canónica;
- configuración segura;
- manifiestos canónicos;
- lockfile único aprobado;
- subcapa `builder/state/` cuando se cree.

### No entra en Git

- regenerables;
- temporales;
- secretos;
- credenciales;
- ruido del entorno;
- dumps de trabajo;
- backups operativos.

### Sí puede borrarse

- regenerable claramente regenerable;
- auditoría temporal ya usada;
- backup operativo fuera de función;
- dump sin valor canónico.

### No puede borrarse a ciegas

- fuente real;
- backend;
- frontend fuente;
- documentación canónica;
- auxiliares aún no clasificados del todo.

### No entra en ZIP

- basura local;
- regenerables;
- secretos;
- entorno inflado;
- backups;
- dumps temporales.

### No procede deploy final todavía

Hasta que el sistema complete:

- BuilderBuildKernel;
- BuilderBuildState;
- runtime conectado;
- preview/código/estructura sincronizados;
- validación técnica;
- economía y exportación conectadas sobre salida real.

---

## 20. Conclusión operativa

A partir de este documento:

- Git debe reflejar solo producto real y gobierno técnico válido;
- npm queda como vía única del frontend;
- los regenerables dejan de confundirse con sistema;
- ZIP y deploy quedan sometidos a criterio estructural;
- las carpetas canónicas deben mantenerse limpias;
- no se aprueba producción mientras el proyecto siga en fase de reconducción y afinado;
- no se despliega Builder si no construye de forma verificable;
- no se monetiza una simulación;
- no se exporta sin estructura;
- no se despliega sin coherencia técnica.

La regla final queda cerrada:

```text
repo limpio
docs limpios
commits limpios
Builder vivo antes de monetización intensiva
deploy solo con coherencia técnica
```