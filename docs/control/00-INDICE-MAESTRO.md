# 00-INDICE-MAESTRO

## Estado del documento

- Estado: activo
- Tipo: índice maestro canónico
- Alcance: sistema completo `Sistema Maestro`
- Objetivo: gobernar el reparto documental del proyecto y evitar solapes entre documentos canónicos, decisiones, rutas, producto, Builder, IA, créditos, exportación y deploy.

---

## 1. Función de este documento

Este documento es el mapa maestro de la documentación canónica de Sistema Maestro.

Su función no es describir el sistema en detalle.
Su función no es inventariar archivos.
Su función no es fijar Git, deploy o pendientes.
Su función no es sustituir los documentos de producto.

Su función es responder con claridad a esta pregunta:

**¿Qué documento manda para cada tema del proyecto?**

---

## 2. Regla maestra de gobierno

La documentación canónica de Sistema Maestro se gobierna con esta secuencia:

1. control estructural;
2. clasificación;
3. canonicidad;
4. higiene técnica;
5. producto;
6. contratos;
7. procedimientos;
8. implementación;
9. validación;
10. cierre.

Ningún documento debe romper este orden.

### Regla operativa

No se implementa una pieza estructural si antes no queda claro:

- qué decisión la autoriza;
- qué ruta la contiene;
- qué incidencia evita repetir;
- qué prioridad ocupa;
- qué contrato técnico respeta;
- qué procedimiento guía su ejecución.

---

## 3. Regla madre actual del sistema

Sistema Maestro no debe avanzar como suma de pantallas, informes o respuestas aisladas.

Debe avanzar como sistema completo:

```text
entrada
→ diagnóstico
→ activación
→ BuilderBuildKernel
→ BuilderBuildState
→ preview/código/estructura
→ continuidad
→ créditos si hay acción intensiva
→ exportación o deploy si procede
```

### Regla crítica

No se toca Builder como pantalla aislada.

No se conectan créditos a simulaciones.

No se exporta una preview sin estructura coherente.

No se despliega sin código y estructura verificables.

---

## 4. Documentos canónicos de control

La carpeta canónica de gobierno estructural es:

```text
docs/control/
```

Debe contener documentos finales, no dumps, backups ni copias temporales.

---

## 4.1 Índice maestro

### Documento

```text
docs/control/00-INDICE-MAESTRO.md
```

### Función

Indicar qué documento manda para cada tema.

### Debe contener

- mapa documental;
- reparto de autoridad;
- orden de lectura;
- reglas antisolape;
- relación entre control, producto, arquitectura y sistema.

### No debe contener

- inventario técnico detallado;
- rutas canónicas extensas;
- reglas completas de Git o deploy;
- pendientes operativos desarrollados;
- incidencias completas;
- contratos técnicos completos.

---

## 4.2 Decisiones cerradas

### Documento

```text
docs/control/01-DECISIONES-CERRADAS.md
```

### Función

Registrar solo decisiones ya aprobadas y cerradas.

### Debe contener

- decisiones estructurales validadas;
- reglas aprobadas;
- cierres oficiales de criterio;
- decisiones que bloquean improvisación futura.

### Decisión crítica actual

`BuilderBuildKernel` queda aprobado como piedra angular operativa del Builder visible.

### No debe contener

- ideas abiertas;
- hipótesis;
- tareas pendientes;
- borradores;
- procedimientos.

---

## 4.3 Pendientes priorizados

### Documento

```text
docs/control/02-PENDIENTES-PRIORIZADOS.md
```

### Función

Ordenar el trabajo pendiente por prioridad real, dependencia y criterio de cierre.

### Debe contener

- pendiente;
- prioridad;
- dependencia;
- criterio de cierre;
- bloqueos explícitos.

### Prioridad crítica actual

Crear:

```text
frontend/src/features/builder/state/
```

con:

- `builderBuildKernel.js`;
- `builderBuildState.js`;
- `builderMutationRegistry.js`;
- `builderOutputMap.js`;
- `builderQuestionFlowRegistry.js`;
- `builderStructureRegistry.js`;
- `builderKnowledgeIndex.js`.

### No debe contener

- decisiones cerradas extensas;
- inventario técnico;
- rutas canónicas completas;
- reglas de Git;
- doctrina de producto.

---

## 4.4 Inventario técnico

### Documento

```text
docs/control/03-INVENTARIO-TECNICO.md
```

### Función

Describir qué existe realmente hoy en el proyecto.

### Debe contener

- frontend;
- backend;
- Builder;
- Home;
- Dashboard;
- App Shell;
- Auth;
- Billing;
- IA / motor / integraciones;
- config;
- docs;
- public;
- capas auxiliares;
- regenerables;
- estado real de carpetas.

### Actualización pendiente

Debe reflejar, cuando se implemente, la nueva subcapa:

```text
frontend/src/features/builder/state/
```

### No debe contener

- qué ruta manda;
- qué entra o no en Git;
- prioridades de ejecución;
- decisiones históricas;
- doctrina comercial.

---

## 4.5 Rutas canónicas

### Documento

```text
docs/control/04-RUTAS-CANONICAS.md
```

### Función

Fijar qué rutas mandan y cuáles son residuales, auxiliares o regenerables.

### Debe contener

- rutas canónicas;
- rutas residuales;
- rutas auxiliares;
- rutas regenerables;
- excepciones temporales aprobadas;
- subcapas canónicas internas.

### Ruta crítica actual

```text
frontend/src/features/builder/state/
```

queda aprobada como subcapa canónica interna del Builder.

### No debe contener

- inventario completo;
- política Git/deploy desarrollada;
- pendientes;
- procedimientos;
- contratos técnicos completos.

---

## 4.6 Incidencias y diagnósticos

### Documento

```text
docs/control/05-INCIDENCIAS-Y-DIAGNOSTICOS.md
```

### Función

Registrar problemas reales, su causa, impacto, estado, resolución y aprendizaje operativo.

### Incidencia crítica actual

```text
INCIDENCIA 007 — BUILDER SIMULANDO CONSTRUCCIÓN SIN ESTADO VIVO
```

### Debe contener

- incidencia;
- diagnóstico;
- causa raíz;
- impacto;
- estado;
- resolución;
- criterio de bloqueo;
- criterio de cierre;
- aprendizaje operativo.

### No debe contener

- backlog general;
- decisiones maestras completas;
- inventario del sistema;
- procedimientos permanentes.

---

## 4.7 Procedimientos operativos

### Documento

```text
docs/control/06-PROCEDIMIENTOS-OPERATIVOS.md
```

### Función

Definir cómo se opera el proyecto sin improvisación.

### Debe contener

- apertura de frente técnico;
- auditoría;
- clasificación;
- canonicidad;
- higiene;
- staging limpio;
- commit limpio;
- DOC-LOCK;
- validación canónica;
- limpieza documental;
- procedimiento específico de Builder vivo;
- procedimiento de créditos, exportación y deploy.

### Regla crítica actual

```text
no frontend sin DOC-LOCK
no Builder visual sin estado vivo
no créditos sin salida real
no exportación sin estructura
no deploy sin coherencia
```

### No debe contener

- arquitectura completa;
- inventario;
- rutas canónicas extensas;
- backlog;
- contratos técnicos de entidades.

---

## 4.8 Git, deploy e higiene

### Documento

```text
docs/control/07-GIT-DEPLOY-HIGIENE.md
```

### Función

Definir qué entra en Git, qué no entra, qué puede borrarse, qué entra en ZIP y qué se despliega.

### Debe contener

- política de `.gitignore`;
- lockfiles aprobados;
- exclusiones;
- borrables regenerables;
- criterio de ZIP;
- criterio de deploy;
- limpieza de backups y dumps;
- seguridad operativa;
- reglas de commit y release.

### Actualización pendiente

Debe alinearse con la regla actual:

- no backups en carpetas canónicas;
- no dumps temporales en raíz;
- no deploy final mientras Builder no tenga salida coherente;
- no commits mezclados de docs, runtime, UI, créditos y deploy.

### No debe contener

- inventario completo del sistema;
- rutas canónicas completas;
- prioridades de trabajo;
- incidencias funcionales desarrolladas;
- doctrina de producto.

---

## 5. Documentos canónicos de producto

La carpeta canónica de producto de Sistema Maestro es:

```text
docs/product/sistema-maestro/
```

Su función es definir doctrina funcional, comercial y técnica de producto.

No sustituye a `docs/control/`.

---

## 5.1 Índice de producto

### Documento

```text
docs/product/sistema-maestro/00-INDICE.md
```

### Función

Ordenar la capa documental de producto.

### Debe contener

- documentos activos de producto;
- orden de lectura;
- regla madre de producto;
- relación con Builder, créditos, exportación y deploy.

---

## 5.2 Producto Maestro V2

### Documento

```text
docs/product/sistema-maestro/01-PRODUCTO-MAESTRO-V2.md
```

### Función

Definir la arquitectura maestra del producto.

### Debe contener

- qué es Sistema Maestro;
- entradas principales;
- transformación real del sistema;
- Home, Dashboard, App Shell y Builder;
- BuilderBuildKernel;
- BuilderBuildState;
- monetización estructural;
- modo operador;
- salida profesional.

---

## 5.3 Activación Doctrina

### Documento

```text
docs/product/sistema-maestro/02-ACTIVACION-DOCTRINA.md
```

### Función

Definir la activación como puente entre diagnóstico y construcción.

### Regla principal

Activación prepara.

Builder ejecuta y muestra.

---

## 5.4 Créditos y Economía

### Documento

```text
docs/product/sistema-maestro/03-CREDITOS-Y-ECONOMIA.md
```

### Función

Definir la economía operativa del sistema.

### Regla principal

```text
suscripción = acceso y continuidad
créditos = ejecución intensiva real
exportación = salida profesional
```

### Protección

No se consumen créditos sin salida real.

---

## 5.5 Experiencia Constructor Visible

### Documento

```text
docs/product/sistema-maestro/04-EXPERIENCIA-CONSTRUCTOR-VISIBLE.md
```

### Función

Definir la experiencia visible del Builder.

### Regla principal

El constructor visible no es decoración.

Debe demostrar construcción mediante:

- estado vivo;
- preview;
- código;
- estructura;
- cambios verificables.

---

## 5.6 Contratos Técnicos V1

### Documento

```text
docs/product/sistema-maestro/05-CONTRATOS-TECNICOS-V1.md
```

### Función

Traducir doctrina de producto a contratos técnicos.

### Contrato crítico

```text
input usuario
→ IA interpreta intención
→ mutationRegistry normaliza acción
→ builderBuildState aplica mutación
→ preview renderiza estado vivo
→ codeTemplates genera desde estado vivo
→ structureRegistry deriva carpetas y archivos
→ questionFlowRegistry propone siguientes decisiones
```

---

## 5.7 Roadmap de Implementación V1

### Documento

```text
docs/product/sistema-maestro/06-ROADMAP-DE-IMPLEMENTACION-V1.md
```

### Función

Definir el orden real de ejecución.

### Orden crítico actual

1. cierre documental;
2. `frontend/src/features/builder/state/`;
3. BuilderBuildKernel;
4. BuilderBuildState;
5. runtime;
6. preview/código/estructura;
7. BuilderAgentPane;
8. pricing, créditos, exportación y deploy después.

---

## 6. Documentos de arquitectura

La documentación de arquitectura debe vivir en:

```text
docs/architecture/
```

### Función

Definir capas de sistema, orquestación IA, contratos de agentes, runtime y deploy desde una perspectiva arquitectónica.

### Regla

Si arquitectura contradice `docs/control/` o `docs/product/sistema-maestro/`, debe actualizarse antes de implementar.

### Documentos esperados

- `01-system-layers.md`
- `02-ai-orchestration.md`
- `03-agent-contracts.md`
- `04-runtime-and-deploy-truth.md`

---

## 7. Documentos de sistema y créditos

La documentación técnica específica de créditos puede vivir en:

```text
docs/system/credits/
```

### Función

Desarrollar política, matriz operativa, motor de consumo y contrato técnico de créditos.

### Regla

Debe obedecer la doctrina de:

```text
docs/product/sistema-maestro/03-CREDITOS-Y-ECONOMIA.md
```

y el contrato de:

```text
docs/product/sistema-maestro/05-CONTRATOS-TECNICOS-V1.md
```

### Protección

No se debe documentar consumo de créditos para acciones que no produzcan salida real.

---

## 8. Orden correcto de lectura

Para entender el sistema, leer en este orden:

1. `docs/control/00-INDICE-MAESTRO.md`
2. `docs/control/01-DECISIONES-CERRADAS.md`
3. `docs/control/04-RUTAS-CANONICAS.md`
4. `docs/control/05-INCIDENCIAS-Y-DIAGNOSTICOS.md`
5. `docs/control/02-PENDIENTES-PRIORIZADOS.md`
6. `docs/product/sistema-maestro/00-INDICE.md`
7. `docs/product/sistema-maestro/01-PRODUCTO-MAESTRO-V2.md`
8. `docs/product/sistema-maestro/02-ACTIVACION-DOCTRINA.md`
9. `docs/product/sistema-maestro/03-CREDITOS-Y-ECONOMIA.md`
10. `docs/product/sistema-maestro/04-EXPERIENCIA-CONSTRUCTOR-VISIBLE.md`
11. `docs/product/sistema-maestro/05-CONTRATOS-TECNICOS-V1.md`
12. `docs/product/sistema-maestro/06-ROADMAP-DE-IMPLEMENTACION-V1.md`
13. `docs/control/06-PROCEDIMIENTOS-OPERATIVOS.md`
14. `docs/control/07-GIT-DEPLOY-HIGIENE.md`
15. `docs/control/03-INVENTARIO-TECNICO.md`

---

## 9. Orden operativo actual

Desde el estado actual, el orden de trabajo es:

1. cerrar y alinear documentos canónicos;
2. limpiar duplicados, backups y dumps temporales;
3. validar que no hay contradicciones;
4. crear `frontend/src/features/builder/state/`;
5. crear archivos pequeños del kernel modular;
6. conectar runtime;
7. conectar preview, código y estructura;
8. ajustar visualmente BuilderAgentPane;
9. reabrir pricing, créditos, exportación y deploy sobre base real.

---

## 10. Regla antisolape

Cada documento debe responder solo a su pregunta principal:

- `00-INDICE-MAESTRO.md` → dónde mirar;
- `01-DECISIONES-CERRADAS.md` → qué ya está decidido;
- `02-PENDIENTES-PRIORIZADOS.md` → qué se hace después;
- `03-INVENTARIO-TECNICO.md` → qué existe;
- `04-RUTAS-CANONICAS.md` → qué manda;
- `05-INCIDENCIAS-Y-DIAGNOSTICOS.md` → qué problema ocurrió y cómo se reconduce;
- `06-PROCEDIMIENTOS-OPERATIVOS.md` → cómo se opera;
- `07-GIT-DEPLOY-HIGIENE.md` → qué se guarda, qué se excluye y qué se despliega;
- `00-INDICE.md` de producto → cómo leer producto;
- `01-PRODUCTO-MAESTRO-V2.md` → qué es el producto;
- `02-ACTIVACION-DOCTRINA.md` → cómo se prepara la construcción;
- `03-CREDITOS-Y-ECONOMIA.md` → cómo se monetiza operación real;
- `04-EXPERIENCIA-CONSTRUCTOR-VISIBLE.md` → cómo debe sentirse y verse el Builder;
- `05-CONTRATOS-TECNICOS-V1.md` → qué contrato técnico obliga;
- `06-ROADMAP-DE-IMPLEMENTACION-V1.md` → en qué orden se implementa.

Si un contenido puede vivir mejor en otro documento, no debe duplicarse aquí.

---

## 11. Regla de canonicidad documental

La carpeta canónica de gobierno del proyecto es:

```text
docs/control/
```

La carpeta canónica de doctrina de producto es:

```text
docs/product/sistema-maestro/
```

No se aprueban:

- carpetas paralelas de control;
- documentos duplicados con la misma función;
- backups dentro de carpetas canónicas;
- dumps temporales como documentos finales;
- usar el chat como memoria estructural permanente.

---

## 12. Regla específica para Builder

Todo lo relacionado con Builder debe obedecer esta cadena:

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

### Implementación autorizada después del cierre documental

```text
frontend/src/features/builder/state/
```

### Orden técnico

1. `builderBuildKernel.js`
2. `builderBuildState.js`
3. `builderMutationRegistry.js`
4. `builderOutputMap.js`
5. `builderQuestionFlowRegistry.js`
6. `builderStructureRegistry.js`
7. `builderKnowledgeIndex.js`
8. conexión runtime;
9. conexión preview/código/estructura;
10. ajuste visual.

---

## 13. Regla específica para créditos

Los créditos pertenecen a ejecución intensiva real.

No pertenecen a:

- navegación;
- lectura simple;
- mensajes decorativos;
- simulaciones;
- preview sin mutación;
- código sin conexión;
- estructura que no cambia.

### Regla

No créditos sin salida real.

---

## 14. Regla específica para exportación

La exportación es una salida profesional.

No es un botón simple.

No es una función gratuita por defecto.

No debe ejecutarse sobre:

- preview simulada;
- código incoherente;
- estructura inexistente;
- proyecto sin estado.

### Regla

No exportación sin estructura.

---

## 15. Regla específica para deploy

Deploy es fase posterior.

No se abre mientras:

- Builder no tenga estado vivo;
- preview, código y estructura no estén sincronizados;
- créditos/exportación no tengan contrato claro;
- backend y entorno no estén validados.

### Regla

No deploy sin coherencia técnica.

---

## 16. Estado operativo actual

Queda cerrada como dirección canónica:

```text
BuilderBuildKernel
+
BuilderBuildState
+
mutaciones
+
preview/código/estructura sincronizados
```

La siguiente implementación técnica real debe empezar por:

```text
frontend/src/features/builder/state/
```

pero solo después de cerrar la alineación documental pendiente.

---

## 17. Criterio de mantenimiento

Cada vez que cambie la arquitectura documental canónica, este índice debe actualizarse.

Este documento es el punto de entrada del gobierno técnico documental.

Si queda desalineado, todo el sistema documental pierde claridad.

---

## 18. Veredicto operativo

Este índice fija la distribución oficial de funciones entre documentos canónicos de Sistema Maestro.

A partir de aquí:

- no se redacta contenido fuera de su documento correcto;
- no se pisan funciones entre documentos;
- no se mezcla inventario con decisiones;
- no se mezcla Git/deploy con rutas canónicas;
- no se mezcla backlog con gobierno estructural;
- no se mezcla producto con procedimiento;
- no se mezcla Builder visual con Builder vivo;
- no se monetiza una simulación;
- no se exporta sin estructura;
- no se despliega sin coherencia técnica.

La memoria canónica manda sobre el impulso operativo.

El siguiente salto técnico solo se autoriza cuando la documentación queda alineada.