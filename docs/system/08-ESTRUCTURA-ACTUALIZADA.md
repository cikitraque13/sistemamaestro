# 08 — ESTRUCTURA ACTUALIZADA

## Cierre estructural validado — Adaptador IA

### Estado

Queda cerrada y congelada la arquitectura operativa del adaptador IA.

---

### Cambio estructural confirmado

El adaptador ya no depende solo de:

- prompt;
- normalización.

Ahora queda gobernado por una arquitectura separada en capas:

1. lectura generativa;
2. normalización;
3. microfase algorítmica de decisión;
4. trazabilidad interna opcional por entorno;
5. validación final del contrato público.

---

### Piezas canónicas implicadas

- `backend/app/services/ai_analysis.py`
- `backend/app/services/ai_analysis_decision_rules.py`
- `backend/app/services/ai_analysis_decision_signals.py`
- `backend/app/services/ai_analysis_decision.py`
- `backend/app/services/ai_analysis_decision_trace.py`

---

## Lógica estructural resultante

### 1. Lectura generativa

La IA genera la primera lectura del caso y produce el payload inicial del análisis.

### 2. Normalización

`ai_analysis_normalization.py` sanea el payload y mantiene el contrato público estable.

### 3. Decisión algorítmica

La decisión final de `route` y `continuity` ya no queda delegada solo al lenguaje del prompt.

La microfase algorítmica queda separada así:

- `ai_analysis_decision_signals.py`: extrae señales del input y del análisis normalizado.
- `ai_analysis_decision_rules.py`: define pesos, precedencias y guardrails.
- `ai_analysis_decision.py`: calcula scores, resuelve desempates, aplica guardrails y devuelve la decisión final.

### 4. Trazabilidad interna opcional

`ai_analysis_decision_trace.py` añade observabilidad del motor de decisión sin alterar el contrato público.

Características de esta capa:

- desactivada por defecto;
- activable por entorno;
- segura ante fallo;
- no modifica `route`, `diagnosis` ni `refine_questions`.

Flags de entorno:

- `AI_ANALYSIS_TRACE_ENABLED`
- `AI_ANALYSIS_TRACE_VERBOSE`

### 5. Integración final

`ai_analysis.py` coordina:

- contexto;
- envelope/trace;
- ejecución del análisis;
- normalización;
- microfase de decisión;
- trazabilidad opcional;
- validación final;
- devolución del contrato público.

---

## Principio rector

La IA interpreta.

El sistema decide.

---

## Recalibración fina validada

Queda cerrada la recalibración de `premium` en `continuity`.

Cambios estructurales asociados:

- ajuste de pesos en `ai_analysis_decision_rules.py`;
- guardrail específico en `ai_analysis_decision.py` para casos de alta intensidad en oferta/reposicionamiento.

Resultado:

- `premium` deja de quedar absorbido por `blueprint` en casos de reposicionamiento fuerte;
- no se observan regresiones en el resto de casos de la suite ampliada.

---

## Validación estructural cerrada

Validaciones confirmadas:

- trazabilidad activable por entorno correcta;
- smoke test con trazabilidad activa correcto;
- suite ampliada final:
  - `route = 10/10`;
  - `continuity = 10/10`.

---

## Estado operativo

Esta microfase queda congelada.

No procede seguir tocando:

- `ai_analysis.py`;
- `ai_analysis_decision_rules.py`;
- `ai_analysis_decision_signals.py`;
- `ai_analysis_decision.py`;
- `ai_analysis_decision_trace.py`;

salvo reapertura explícita por nueva incidencia o nueva fase de sistema.

---

## Siguiente fase correcta

Cerrar documentación estructural y pasar después a una microfase separada de uso real o casos productivos del sistema.

---

## Relación con documentos actuales

Este documento pertenece a:

```text
docs/system/