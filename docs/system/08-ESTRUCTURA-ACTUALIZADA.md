\## Cierre estructural validado — Adaptador IA



\### Estado

Queda cerrada y congelada la arquitectura operativa del adaptador IA.



\### Cambio estructural confirmado

El adaptador ya no depende solo de:



\- prompt

\- normalización



Ahora queda gobernado por una arquitectura separada en capas:



1\. lectura generativa

2\. normalización

3\. microfase algorítmica de decisión

4\. trazabilidad interna opcional por entorno

5\. validación final del contrato público



\### Piezas canónicas implicadas



\- `backend/app/services/ai\_analysis.py`

\- `backend/app/services/ai\_analysis\_decision\_rules.py`

\- `backend/app/services/ai\_analysis\_decision\_signals.py`

\- `backend/app/services/ai\_analysis\_decision.py`

\- `backend/app/services/ai\_analysis\_decision\_trace.py`



\### Lógica estructural resultante



\#### 1. Lectura generativa

La IA genera la primera lectura del caso y produce el payload inicial del análisis.



\#### 2. Normalización

`ai\_analysis\_normalization.py` sanea el payload y mantiene el contrato público estable.



\#### 3. Decisión algorítmica

La decisión final de `route` y `continuity` ya no queda delegada solo al lenguaje del prompt.



La microfase algorítmica queda separada así:



\- `ai\_analysis\_decision\_signals.py`: extrae señales del input y del análisis normalizado

\- `ai\_analysis\_decision\_rules.py`: define pesos, precedencias y guardrails

\- `ai\_analysis\_decision.py`: calcula scores, resuelve desempates, aplica guardrails y devuelve la decisión final



\#### 4. Trazabilidad interna opcional

`ai\_analysis\_decision\_trace.py` añade observabilidad del motor de decisión sin alterar el contrato público.



Características de esta capa:



\- desactivada por defecto

\- activable por entorno

\- segura ante fallo

\- no modifica `route`, `diagnosis` ni `refine\_questions`



Flags de entorno:



\- `AI\_ANALYSIS\_TRACE\_ENABLED`

\- `AI\_ANALYSIS\_TRACE\_VERBOSE`



\#### 5. Integración final

`ai\_analysis.py` coordina:



\- contexto

\- envelope/trace

\- ejecución del análisis

\- normalización

\- microfase de decisión

\- trazabilidad opcional

\- validación final

\- devolución del contrato público



\### Principio rector

La IA interpreta.  

El sistema decide.



\### Recalibración fina validada

Queda cerrada la recalibración de `premium` en `continuity`.



Cambios estructurales asociados:



\- ajuste de pesos en `ai\_analysis\_decision\_rules.py`

\- guardrail específico en `ai\_analysis\_decision.py` para casos de alta intensidad en oferta/reposicionamiento



Resultado:



\- `premium` deja de quedar absorbido por `blueprint` en casos de reposicionamiento fuerte

\- no se observan regresiones en el resto de casos de la suite ampliada



\### Validación estructural cerrada

Validaciones confirmadas:



\- trazabilidad activable por entorno correcta

\- smoke test con trazabilidad activa correcto

\- suite ampliada final:

&#x20; - `route = 10/10`

&#x20; - `continuity = 10/10`



\### Estado operativo

Esta microfase queda congelada.



No procede seguir tocando:



\- `ai\_analysis.py`

\- `ai\_analysis\_decision\_rules.py`

\- `ai\_analysis\_decision\_signals.py`

\- `ai\_analysis\_decision.py`

\- `ai\_analysis\_decision\_trace.py`



salvo reapertura explícita por nueva incidencia o nueva fase de sistema.



\### Siguiente fase correcta

Cerrar documentación estructural y pasar después a una microfase separada de uso real o casos productivos del sistema.

