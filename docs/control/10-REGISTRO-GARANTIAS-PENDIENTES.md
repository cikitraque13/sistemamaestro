# Registro acumulativo de garantías pendientes — J03

## Autoridad y regla de uso

Este registro conserva las garantías técnicas de S17 y S18 que permanecen sin acreditación integral. El [Master Maturity Roadmap](../product/sistema-maestro/08-MASTER-MATURITY-ROADMAP.md) sigue siendo propietario de los estados de etapa; este registro es propietario del detalle acumulativo de evidencia, limitación, riesgo, decisión humana, dependencia y revalidación.

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

## Transición J03 → J04

J03 queda documentado como cerrado con limitaciones: S17 por aceptación humana del recorrido visual y S18 por aceptación humana con limitaciones; ningún estado transfiere `TECHNICAL_PASS` no demostrado. J04 se cerró por aceptación humana limitada al alcance V1–V3, sin `TECHNICAL_PASS` integral; su evidencia y limitaciones constan en el [Master Maturity Roadmap](../product/sistema-maestro/08-MASTER-MATURITY-ROADMAP.md#j04--project-context). J05 es elegible para una evaluación de entrada, pero permanece `NOT_OPENED` y requiere autorización propia. Las garantías S17/S18 solo se revalidan si son dependencia indispensable de un contrato posterior o de una validación transversal autorizada.
