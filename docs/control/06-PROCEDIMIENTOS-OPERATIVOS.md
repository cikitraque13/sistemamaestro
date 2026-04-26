# 06-PROCEDIMIENTOS-OPERATIVOS

## Estado del documento

- Estado: activo
- Tipo: procedimientos operativos canónicos
- Alcance: proyecto completo `Sistema Maestro`
- Objetivo: definir cómo se opera el sistema de forma repetible, segura y no improvisada durante fases de auditoría, saneo, clasificación, desarrollo y validación.

---

## 1. Función de este documento

Este documento existe para responder con claridad a una sola pregunta:

**¿Cómo debe operarse Sistema Maestro para evitar errores, mezcla de frentes y regresiones innecesarias?**

No inventa el sistema.
No fija backlog.
No sustituye a decisiones cerradas.
No describe incidencias pasadas.
No define rutas canónicas.

Su función es transformar criterios ya aprobados en secuencias operativas repetibles.

---

## 2. Principios operativos generales

## 2.1 Principio de no improvisación

No se toca una capa sensible sin:

- alcance claro;
- objetivo claro;
- criterio de cierre;
- lectura previa de riesgo.

## 2.2 Principio de un frente por vez

No se abren varios frentes activos simultáneos si uno de ellos sigue sin cierre controlado.

## 2.3 Principio de lectura antes de acción

Antes de modificar:

- se inspecciona;
- se clasifica;
- se decide;
- y solo entonces se actúa.

## 2.4 Principio de no destrucción

No se borra, mueve o reclasifica una ruta sin entender:

- qué contiene;
- si es canónica;
- si es auxiliar;
- si es regenerable;
- si es residual.

## 2.5 Principio de cierre secuencial

Cada paso debe cerrarse antes de abrir el siguiente.

## 2.6 Principio de canonicidad antes de implementación

No se implementa una pieza estructural si antes no está claro:

- qué decisión la autoriza;
- qué ruta la contiene;
- qué contrato técnico respeta;
- qué incidencia evita repetir;
- qué prioridad ocupa;
- qué procedimiento guía su ejecución.

## 2.7 Principio de salida verificable

Toda acción relevante debe producir una salida verificable.

En Builder, una acción solo se considera válida si puede reflejarse, directa o indirectamente, en:

- estado vivo;
- preview;
- código;
- estructura;
- CTA;
- bloque;
- archivo;
- siguiente decisión contextual.

---

## 3. Procedimiento de apertura de frente técnico

### Cuándo usarlo

Cada vez que se va a intervenir en:

- frontend;
- backend;
- builder;
- auth;
- motor;
- IA;
- repo;
- documentación canónica.

### Secuencia

1. nombrar el frente exacto;
2. definir si es estructura, higiene, producto, migración o validación;
3. indicar qué no se toca;
4. fijar criterio de cierre;
5. actuar solo dentro de ese perímetro.

### Resultado esperado

El frente queda acotado y no contamina otras capas.

---

## 4. Procedimiento de auditoría

### Cuándo usarlo

Cuando una zona del sistema no está suficientemente entendida.

### Secuencia

1. identificar la ruta a auditar;
2. leer árbol, archivos o módulos reales;
3. separar fuente, auxiliar, residual y regenerable;
4. registrar la lectura útil en `docs/control/audit/` solo si aporta trazabilidad;
5. trasladar el resultado a documento canónico solo si el criterio queda estable.

### Regla

La auditoría no se confunde con decisión final.

Una auditoría puede acelerar una decisión, pero no sustituye a:

- decisiones cerradas;
- rutas canónicas;
- contratos técnicos;
- pendientes priorizados;
- procedimientos operativos.

---

## 5. Procedimiento de clasificación

### Cuándo usarlo

Cuando una ruta, módulo o capa aún no está correctamente tipificada.

### Secuencia

1. verificar si pertenece a producto real;
2. verificar si es regenerable;
3. verificar si es residual o temporal;
4. verificar si es auxiliar por revisar;
5. fijar la clase en documentación canónica.

### Resultado esperado

Ninguna ruta importante queda “en tierra de nadie”.

---

## 6. Procedimiento de canonicidad

### Cuándo usarlo

Cuando ya se sabe qué existe y hay que decidir qué manda.

### Secuencia

1. partir del inventario técnico;
2. elegir la ruta fuente real;
3. limitar excepciones temporales;
4. documentar qué ruta es canónica y cuál no;
5. impedir nuevas piezas fuera de la ruta aprobada.

### Regla

No se declara canónica una ruta no auditada.

---

## 7. Procedimiento de higiene técnica

### Cuándo usarlo

Cuando se va a tocar:

- `.gitignore`;
- lockfiles;
- staging;
- exclusiones;
- borrables regenerables;
- ZIP;
- deploy;
- archivos temporales;
- auditorías generadas;
- dumps de trabajo.

### Secuencia

1. distinguir fuente de regenerable;
2. excluir regenerables y secretos;
3. validar lockfile activo;
4. revisar que Git no absorba basura local;
5. eliminar o sacar del repo activo los archivos temporales que ya cumplieron su función;
6. documentar la política si el criterio queda estable.

### Regla

No se mezcla higiene con cambios de producto.

No deben quedar backups, copias temporales o dumps operativos conviviendo con documentos canónicos principales.

---

## 8. Procedimiento de staging limpio

### Cuándo usarlo

Antes de cualquier commit.

### Secuencia

1. limpiar staging si está mezclado;
2. agrupar cambios por finalidad única;
3. revisar `git diff --cached`;
4. retirar intrusos;
5. validar que no entren regenerables, secretos o auxiliares incorrectos.

### Regla

Cada commit debe responder a una única intención principal.

---

## 9. Procedimiento de commit limpio

### Cuándo usarlo

Cuando un bloque de trabajo ya está cerrado y verificado.

### Secuencia

1. definir finalidad del commit;
2. confirmar que no mezcla higiene, migración, producto o documentación;
3. revisar archivos incluidos;
4. comprobar impacto estructural;
5. solo entonces hacer commit.

### Regla

No se hace commit “para ir guardando de todo un poco”.

---

## 10. Procedimiento de tratamiento de incidencias

### Cuándo usarlo

Cuando aparece un error, desviación o síntoma sensible.

### Secuencia

1. describir síntoma;
2. decidir si es local, de entorno o estructural;
3. no asumir causa sin lectura;
4. diagnosticar;
5. actuar solo en la capa correcta;
6. registrar la incidencia si el aprendizaje merece quedar fijado.

### Regla

No convertir un síntoma puntual en centro del sistema sin validar su naturaleza.

---

## 11. Procedimiento de tratamiento de documentación canónica

### Cuándo usarlo

Cuando se redacta o modifica un documento de `docs/control/` o un documento canónico de producto.

### Secuencia

1. confirmar que el documento correcto es el que corresponde;
2. evitar solape con otros documentos;
3. escribir solo aquello que pertenece a su función;
4. mantener el archivo como documento final, no como borrador con copias internas;
5. verificar integridad semántica;
6. solo entonces considerarlo consolidado.

### Regla

Crear un archivo no equivale a cerrar un documento.

Un documento canónico no debe convivir en su carpeta con:

- backups;
- duplicados;
- dumps;
- auditorías temporales;
- copias con sufijos operativos;
- versiones parciales.

---

## 12. Procedimiento de DOC-LOCK

### Cuándo usarlo

Cuando una decisión estructural debe quedar cerrada antes de implementar.

### Secuencia

1. registrar la decisión en `01-DECISIONES-CERRADAS.md`;
2. registrar la ruta afectada en `04-RUTAS-CANONICAS.md` si aplica;
3. registrar la incidencia o causa en `05-INCIDENCIAS-Y-DIAGNOSTICOS.md` si viene de un fallo real;
4. registrar el frente en `02-PENDIENTES-PRIORIZADOS.md`;
5. registrar el contrato técnico en el documento de producto o arquitectura correspondiente;
6. validar que no hay contradicción entre documentos;
7. solo entonces abrir implementación.

### Regla

No se toca código estructural antes de cerrar el DOC-LOCK cuando el cambio afecta a arquitectura, Builder, IA, runtime, créditos, exportación o deploy.

---

## 13. Procedimiento de validación canónica

### Cuándo usarlo

Después de modificar documentos canónicos vinculados entre sí.

### Secuencia

1. comprobar que la decisión aparece donde corresponde;
2. comprobar que la ruta aparece donde corresponde;
3. comprobar que la incidencia queda registrada si existió fallo real;
4. comprobar que el pendiente tiene prioridad y criterio de cierre;
5. comprobar que el contrato técnico contiene el flujo obligatorio;
6. comprobar que no quedan backups o duplicados en carpetas canónicas.

### Resultado esperado

La documentación queda alineada y no depende de memoria informal.

### Regla

Si falta una pieza documental, no se abre implementación.

---

## 14. Procedimiento de limpieza documental

### Cuándo usarlo

Después de usar comandos de auditoría, dumps, validaciones o lecturas operativas.

### Secuencia

1. identificar archivos generados para uso temporal;
2. confirmar que no son documentos canónicos;
3. eliminarlos o sacarlos del repo activo;
4. dejar las carpetas canónicas con documentos finales solamente;
5. continuar el trabajo desde los documentos limpios.

### Regla

Las carpetas canónicas no son un almacén de trabajo temporal.

`docs/control/` y `docs/product/sistema-maestro/` deben mantenerse limpias.

---

## 15. Procedimiento de rutas auxiliares por revisar

### Cuándo usarlo

Cuando exista una ruta como:

- `memory/`;
- `test_reports/`;
- `railway/`;
- `tests/`.

sin clasificación final cerrada.

### Secuencia

1. auditar contenido;
2. identificar función real;
3. decidir si es:
   - canónica;
   - auxiliar;
   - archivable;
   - excluible;
4. reflejar la decisión en documentos canónicos;
5. no borrarla a ciegas antes de esa clasificación.

---

## 16. Procedimiento de frontend en migración estructural

### Cuándo usarlo

Mientras el frontend siga cerrando el tránsito `pages -> features`.

### Secuencia

1. tratar `features` como capa principal del producto;
2. impedir nuevas páginas de producto en `pages`;
3. permitir `pages` solo como excepción residual legal aprobada;
4. validar router principal;
5. documentar cualquier resto vivo de la estructura antigua.

### Regla

No reabrir el sistema antiguo por comodidad puntual.

---

## 17. Procedimiento de backend por auditar

### Cuándo usarlo

Antes de tocar backend con intención de refactor, integración o despliegue.

### Secuencia

1. localizar estructura interna;
2. clasificar subrutas;
3. identificar contratos, endpoints y piezas reales;
4. distinguir backend canónico de auxiliares;
5. solo después tomar decisiones de integración o saneo.

### Regla

Backend no se trata como caja negra ni se toca a ciegas.

---

## 18. Procedimiento de motor, IA e integraciones

### Cuándo usarlo

Antes de conectar o mover piezas de:

- motor;
- IA;
- integraciones;
- orquestación.

### Secuencia

1. localizar la pieza exacta;
2. decidir si ya es activa o sigue en preparación;
3. clasificar su capa;
4. validar dependencia con frontend/backend;
5. registrar ubicación y criterio antes de integrarla.

### Regla

No se conectan piezas de IA o motor por intuición ni sin topología clara.

La IA puente no debe tratarse como runtime vivo completo hasta que exista fase propia de activación.

---

## 19. Procedimiento específico de Builder vivo

### Cuándo usarlo

Antes de tocar cualquier archivo del Builder que afecte a:

- runtime;
- preview;
- código;
- estructura;
- agente;
- sugerencias;
- créditos;
- exportación;
- deploy futuro.

### Secuencia

1. confirmar que el cambio está autorizado por decisiones, rutas, pendientes y contratos;
2. identificar si afecta a estado vivo, UI, runtime, código o estructura;
3. si afecta a construcción real, pasar por `frontend/src/features/builder/state/`;
4. no tocar `BuilderAgentPane.js` antes de tener estado vivo si el problema es estructural;
5. no tocar preview si no existe modelo de estado que la alimente;
6. no tocar código generado si no comparte fuente con preview y estructura;
7. no conectar créditos si la acción no produce salida real;
8. validar que el cambio produce efecto visible o técnico.

### Regla

El Builder no se corrige como una pantalla aislada.

Builder se corrige como sistema:

```text
input
→ intención
→ mutación
→ estado vivo
→ preview
→ código
→ estructura
→ siguiente decisión