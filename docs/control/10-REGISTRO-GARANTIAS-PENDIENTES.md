# Registro acumulativo de garantías pendientes — J03 y riesgos residuales J05

## Autoridad y regla de uso

Este registro conserva las garantías técnicas de S17 y S18 que permanecen sin acreditación integral y los riesgos residuales de J05 técnicamente completada. El [Master Maturity Roadmap](../product/sistema-maestro/08-MASTER-MATURITY-ROADMAP.md) sigue siendo propietario de los estados de etapa; este registro es propietario del detalle acumulativo de evidencia, limitación, riesgo, decisión humana, dependencia y revalidación.

La aceptación humana de un alcance no equivale a `TECHNICAL_PASS`. Una entrada no reabre una etapa ni bloquea otra automáticamente. Revalidar una garantía únicamente cuando sea dependencia indispensable del contrato de una etapa posterior o cuando una validación transversal autorizada la requiera.

## S17 — garantías no acreditadas

S17 permanece `CLOSED_BY_HUMAN_ACCEPTANCE`, limitado al recorrido visual revisado. `TECHNICAL_REVIEW=FAVORABLE_WITH_LIMITATIONS`; no existe `TECHNICAL_PASS` del harness. La decisión humana conserva el cierre y estas limitaciones.

### S17-G1 — Persistencia tras recarga

- Evidencia demostrada: revisión visual del recorrido y evidencia histórica de navegación/autenticación; ninguna de ellas mide recuperación del estado tras recarga.
- Limitación: persistencia tras recarga no acreditada técnicamente.
- Riesgo: no se puede asumir continuidad del estado del Builder después de recargar.
- Decisión humana: cierre S17 aceptado para el recorrido visual; esta garantía no se convierte en PASS.
- Dependencia: solo reabrir si un contrato posterior depende de continuidad tras recarga o una revisión transversal autorizada la exige.
- Condición de revalidación: evidencia del mismo estado y propietario recuperados tras recarga, bajo el contrato y entorno no productivo de la etapa que lo requiera.

### S17-G2 — Repetibilidad del recorrido

- Evidencia demostrada: recorrido visual revisado por HUMAN-LUCAS; no acredita ejecuciones repetibles del harness.
- Limitación: repetibilidad determinista no acreditada.
- Riesgo: el resultado observado no permite afirmar que el recorrido se repita consistentemente.
- Decisión humana: S17 permanece cerrado por aceptación humana, sin certificación del harness.
- Dependencia: solo reabrir si una etapa posterior requiere explícitamente reproducibilidad de ese recorrido o una validación transversal autorizada la exige.
- Condición de revalidación: resultados repetidos sobre identidad, alcance y condiciones equivalentes, con evidencia ligada a la versión evaluada.

### S17-G3 — Apply/revert efectivo

- Evidencia demostrada: se revisaron los controles de autorización visibles; no se acreditó una mutación efectiva seguida de reversión.
- Limitación: ejecución real de apply/revert no acreditada.
- Riesgo: no se puede asumir que el cambio aplicado se materializa ni que la reversión restaura el estado anterior.
- Decisión humana: la aceptación del flujo visual no acredita esta garantía.
- Dependencia: solo reabrir si una etapa posterior necesita esas transiciones o una validación transversal autorizada las exige.
- Condición de revalidación: observar autorización, estado anterior, efecto aplicado y reversión en datos sintéticos de un entorno no productivo.

### S17-G4 — Captura de fallos

- Evidencia demostrada: la revisión visual no provocó ni evaluó fallos controlados.
- Limitación: captura y clasificación de fallos no acreditadas.
- Riesgo: no se puede asumir que un fallo quede preservado y sea recuperable con información suficiente.
- Decisión humana: permanece como limitación explícita del cierre S17.
- Dependencia: solo reabrir cuando un contrato posterior dependa de esa captura o una validación transversal autorizada la requiera.
- Condición de revalidación: provocar un fallo seguro en entorno sintético y verificar su clasificación y evidencia saneada, sin exponer datos sensibles.

## S18 — integración durable del runtime

S18 permanece `CLOSED_BY_HUMAN_ACCEPTANCE_WITH_LIMITATIONS`; `S18_TECHNICAL_STATUS=PARTIAL` y `TECHNICAL_PASS=NO`.

### S18-G1 — Conexión React, estado durable, recuperación y apply/revert

- Evidencia demostrada: 41 pruebas sintéticas PASS y 0 fallos de prueba en `S18-MIN-CONTRACTUAL-VALIDATION-20261016-v1` (SHA-256 `F6781F5F27BB0A3441D207360AF1AD0C6176550A01904AB54B772470EAA1D4FA`); SM-QA=`PASS_WITH_LIMITATIONS` y SM-SEC=`PASS_WITH_LIMITATION` sobre ese candidato.
- Limitación: `durableRuntime.test.js` no se ejecutó porque Vitest no estaba disponible sin instalación. Las 41 pruebas y revisiones no cubren la integración del hook React con recuperación durable y estado del Builder tras remontaje.
- Riesgo: esa integración no puede considerarse técnicamente verificada; no se debe inferir `TECHNICAL_PASS`.
- Decisión humana: HUMAN-LUCAS cerró S18 con limitaciones y mantuvo explícitamente `TECHNICAL_PASS=NO`.
- Dependencia: el contrato de entrada de J04 identifica S15 y acceso gobernado al proyecto; esta garantía S18 no es por sí sola un bloqueo de J04. Reconsiderar solo si el trabajo concreto de J04 depende de esta integración o un contrato transversal lo exige.
- Condición de revalidación: si resulta indispensable, ejecutar la suite existente en un entorno aislado que ya disponga de Vitest, sin instalar herramientas, y revisar el resultado sobre su identidad exacta.

## Transición histórica J03 → J04 (checkpoint 2026-10-17)

J03 queda documentado como cerrado con limitaciones: S17 por aceptación humana del recorrido visual y S18 por aceptación humana con limitaciones; ningún estado transfiere `TECHNICAL_PASS` no demostrado. J04 se cerró por aceptación humana limitada al alcance V1–V3, sin `TECHNICAL_PASS` integral; su evidencia y limitaciones constan en el [Master Maturity Roadmap](../product/sistema-maestro/08-MASTER-MATURITY-ROADMAP.md#j04--project-context). En el checkpoint de entrada a J04 (2026-10-17), J05 aún no estaba abierta; posteriormente se abrió por decisión humana y su cierre técnico actual consta abajo y en el roadmap. Las garantías S17/S18 solo se revalidan si son dependencia indispensable del contrato de una etapa posterior o de una validación transversal autorizada.

## J05 — riesgos residuales tras TECHNICAL_PASS

J05 está `COMPLETED` con `TECHNICAL_PASS=YES` para el contrato original de Project Memory, según la evidencia V1–V3 detallada en el [Master Maturity Roadmap](../product/sistema-maestro/08-MASTER-MATURITY-ROADMAP.md#j05--project-memory). Las entradas siguientes son límites de confianza y condiciones de revalidación; no reabren J05 ni convierten riesgos conocidos en garantías.

### J05-R1 — Precisión de clasificación semántica

- Evidencia demostrada: V3 clasifica grupos de respuestas de IDs distintos con salida acotada; conflicto, incertidumbre y error bloquean mutación; las pruebas de falsos positivos/negativos son sintéticas.
- Limitación: la precisión empírica del clasificador no se midió con un corpus representativo y no se promete detección perfecta.
- Riesgo: un cambio semántico puede no detectarse o una respuesta compatible puede bloquearse.
- Decisión: cierre técnico aceptado al nivel contractual implementado; se conserva `SM_QA=APPROVED_WITH_RISKS` y `SM_SEC=APPROVED_WITH_RISKS`.
- Dependencia: no bloquea J06 por sí misma; revalidar si J06 consume o automatiza decisiones de memoria.
- Condición de revalidación: evaluación autorizada con casos representativos y métricas de error; revisar de nuevo ante cambios de modelo, prompt, esquema o política.

### J05-R2 — Cobertura de UI, suite amplia y runtime de producción

- Evidencia demostrada: Atlas Testing V3 ejecutó 8/8 pruebas con limpieza verificada; el merge PR #101 se desplegó en Railway como SUCCESS sobre main `c14a36959d59a06f30d572cce7d27da0efe7e3a1`; GET `/health` respondió HTTP 200.
- Limitación: la revisión QA señaló cobertura UI basada principalmente en helpers y build frontend no disponible; el test basal `test_project_bound_output_has_server_identity` y la suite amplia no quedaron acreditados como verdes. En producción solo se verificó despliegue y `/health`, no se ejecutó el recorrido funcional de memoria ni una llamada real al clasificador.
- Riesgo: cobertura de integración visual amplia y comportamiento del proveedor real no quedan certificados por las pruebas Atlas.
- Decisión: se conservan los veredictos `APPROVED_WITH_RISKS`; no se infiere una verificación funcional de producción.
- Dependencia: no reabre J05; revisar si una futura etapa necesita específicamente estas garantías.
- Condición de revalidación: ejecutar solo el delta de cobertura requerido por un contrato futuro, en un entorno aislado y sobre identidad exacta.

### J05-R3 — Modelo/configuración del proveedor

- Evidencia demostrada: la ruta V3 se probó con clasificador mock; no se hicieron llamadas reales al proveedor durante Atlas V3.
- Limitación: la disponibilidad/estado del modelo configurado puede cambiar y build provenance permanece `UNVERIFIED` según Runtime and Deploy Truth.
- Riesgo: futura operación real del clasificador puede verse afectada por disponibilidad, retiro o comportamiento del modelo.
- Condición de revalidación: cualquier cambio de modelo/configuración o gate que dependa de ejecución real debe verificar compatibilidad y límites antes de actualizar esta entrada.

## J06 Phase 3B — riesgos residuales de revisión y evidencia

### J06-P3B-R1 — Evidencia Atlas reutilizada por revisiones independientes

- Evidencia demostrada: el paquete final de assurance R2 (`J06-PHASE3B-FINAL-ASSURANCE-20261025-R2`, SHA-256 `efba15d74822454c043ca619b39fb97d4d96a9ea6e8ae6893d9af3e7b9216f1b`) fue revisado por SM-QA y SM-SEC, ambos `APPROVED_WITH_RISKS`. La evidencia asociada reportó 75 pruebas backend, 10 frontend y Atlas 19/19 con limpieza; posteriormente se publicó PR #109 y Railway verificó el deployment y `/health`.
- Riesgo QA preservado literalmente: “La evidencia de ejecución se revisó como artefactos sellados, no se reprodujo. El resultado Atlas está sanitizado y se reutiliza por coincidencia de hashes del servicio, esquema y suite Atlas; no se volvió a ejecutar.”
- Riesgo SEC preservado literalmente: “El resultado Atlas es evidencia local sanitizada reutilizada, no una repetición para este gate. La integridad del paquete queda verificada, pero esta revisión no certifica de forma independiente la ejecución histórica representada en ese artefacto.”
- Limitación de historial: el truncamiento conserva continuidad verificable mediante el ancla/hash, pero no recupera los cuerpos de eventos ya eliminados.
- Decisión: conservar ambos veredictos `APPROVED_WITH_RISKS`; no reinterpretarlos como una certificación independiente de la ejecución Atlas ni como recuperación de eventos truncados.
- Condición de revalidación: repetir solo la evidencia que un gate futuro necesite verificar de manera independiente o cuando cambien el contrato, los bytes funcionales o el mecanismo de persistencia.
