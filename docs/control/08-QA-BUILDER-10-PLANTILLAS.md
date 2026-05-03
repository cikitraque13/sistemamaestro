# 08-QA-BUILDER-10-PLANTILLAS

## Estado del documento

- Estado: activo
- Tipo: QA operativo canónico
- Alcance: flujo de oportunidades, plantillas y Builder
- Objetivo: validar que cada plantilla de oportunidad puede convertirse en un proyecto real mediante Builder, con iteraciones útiles, persistencia y control de créditos.

---

## 1. Función de este documento

Este documento valida el núcleo comercial de Sistema Maestro:

```text
plantilla
→ Builder
→ primera generación
→ output de mejora
→ mejora del usuario
→ mutación en vivo
→ nuevo output
→ iteraciones sucesivas
→ proyecto terminado o listo para presentar
```

No sustituye al inventario técnico.  
No sustituye al roadmap.  
No define pricing.  
No define arquitectura backend.

Su función es probar si el producto realmente construye valor.

---

## 2. Cuenta de QA

Cuenta interna usada para QA:

```text
lucasdiazarias85@gmail.com
```

Estado esperado:

```text
role: admin
plan: premium
```

Esta cuenta se usa para evitar bloqueos comerciales durante QA interna.

---

## 3. Criterio de éxito

Builder se considera validado cuando:

```text
10/10 plantillas abren Builder
10/10 plantillas pasan contexto correcto
10/10 plantillas generan primera versión
10/10 plantillas permiten al menos 3 iteraciones útiles
10/10 plantillas mantienen estado al refrescar o retomar
10/10 plantillas no rompen auth, créditos ni persistencia
```

Si una plantilla falla, el frente no está cerrado.

---

## 4. Matriz de prueba

| # | Plantilla | Abre Builder | Contexto correcto | Primera generación | Output 1 | Mejora 1 | Output 2 | Mejora 2 | Output 3 | Mejora 3 | Refresh persiste | Créditos OK | Estado final | Observaciones |
|---|-----------|--------------|-------------------|--------------------|----------|----------|----------|----------|----------|----------|------------------|-------------|--------------|---------------|
| 1 | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | |
| 2 | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | |
| 3 | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | |
| 4 | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | |
| 5 | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | |
| 6 | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | |
| 7 | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | |
| 8 | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | |
| 9 | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | |
| 10 | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | |

---

## 5. Checklist por plantilla

### 5.1 Entrada

- [ ] La plantilla se ve desbloqueada.
- [ ] El CTA abre Builder.
- [ ] Builder recibe contexto de plantilla.
- [ ] El input inicial no llega vacío.
- [ ] El usuario entiende qué va a construir.

### 5.2 Primera generación

- [ ] Builder ejecuta IA sin error.
- [ ] Se descuenta crédito si aplica.
- [ ] Se genera preview.
- [ ] Se genera estructura.
- [ ] Se genera output de siguiente mejora.

### 5.3 Iteraciones

- [ ] Mejora 1 aplicada.
- [ ] Mejora 2 aplicada.
- [ ] Mejora 3 aplicada.
- [ ] Builder mantiene contexto.
- [ ] Builder no reinicia accidentalmente el proyecto.
- [ ] Preview, estructura y salida no se contradicen.

### 5.4 Persistencia

- [ ] Refrescar página no destruye estado crítico.
- [ ] Proyecto se puede retomar.
- [ ] La ruta de proyecto sigue viva.
- [ ] La salida sigue asociada al usuario correcto.

---

## 6. Errores a registrar

Por cada fallo:

```text
Plantilla:
Paso:
Acción:
Resultado esperado:
Resultado real:
Captura:
Console error:
Network error:
Railway log:
Decisión:
```

---

## 7. Archivos candidatos a revisar si falla

```text
frontend/src/features/opportunities/data/opportunityTemplates.js
frontend/src/features/opportunities/OpportunitiesPage.js
frontend/src/features/opportunities/components/OpportunityTemplateCard.js
frontend/src/features/opportunities/components/OpportunityTemplateGrid.js
frontend/src/features/builder/workspace/BuilderWorkspacePage.js
frontend/src/features/builder/workspace/hooks/useBuilderWorkspaceRuntime.js
frontend/src/features/builder/api/builderAiClient.js
frontend/src/features/builder/api/builderAiAdapter.js
frontend/src/features/builder/state/builderBuildKernel.js
frontend/src/features/builder/state/builderMutationRegistry.js
frontend/src/features/builder/state/builderBuildState.js
backend/app/routers/builder_ai.py
backend/app/ai/agents/builder_agent.py
```

---

## 8. Procedimiento de prueba por plantilla

Para cada plantilla se debe ejecutar el mismo recorrido.

### 8.1 Abrir plantilla

- Ir a `Dashboard → Oportunidades`.
- Confirmar que la plantilla está desbloqueada para la cuenta QA.
- Pulsar el CTA de uso en Builder.
- Confirmar que se abre el Builder.

### 8.2 Confirmar contexto

Registrar:

```text
Plantilla:
URL:
Proyecto creado:
Contexto recibido por Builder:
Input inicial:
```

El Builder no debe abrir vacío si se viene desde una plantilla.

### 8.3 Primera construcción

- Ejecutar la primera generación.
- Confirmar que aparece respuesta del asistente.
- Confirmar que hay preview o modelo visual.
- Confirmar que se genera salida estructural.
- Confirmar que se descuenta crédito o se registra consumo.

### 8.4 Ciclo de mejora

Ejecutar al menos tres ciclos:

```text
output del Builder
→ mejora del usuario
→ mutación aplicada
→ nuevo output
```

Cada ciclo debe mejorar el proyecto, no reiniciarlo.

### 8.5 Persistencia

- Refrescar la página.
- Confirmar que el proyecto sigue accesible.
- Confirmar que no se pierde el contexto crítico.
- Confirmar que el proyecto puede retomarse.

---

## 9. Estados permitidos en la matriz

Usar solo estos estados:

```text
Pendiente
OK
Fallo
Bloqueado
No aplica
```

No usar estados ambiguos como:

```text
más o menos
parece que sí
revisar luego
```

La ambigüedad es deuda con maquillaje.

---

## 10. Criterios de fallo

Una plantilla falla si ocurre cualquiera de estos casos:

- No abre Builder.
- Abre Builder sin contexto.
- Genera una primera salida vacía.
- Rompe autenticación.
- Devuelve error 401, 402, 404 o 500 no esperado.
- No descuenta o registra consumo cuando debería.
- El Builder reinicia el proyecto en vez de iterarlo.
- La preview contradice la estructura.
- La estructura contradice el código.
- El estado se pierde al refrescar.
- El usuario no entiende cuál es el siguiente paso.
- El output no genera una mejora accionable.

---

## 11. Criterios de aprobación

Una plantilla se aprueba si:

- abre correctamente;
- conserva contexto;
- genera primera versión;
- permite al menos tres mejoras;
- mantiene continuidad;
- no rompe créditos;
- no rompe auth;
- no rompe persistencia;
- entrega un proyecto con valor real.

---

## 12. Próxima acción

Antes de iniciar QA, identificar los nombres reales de las 10 plantillas desde:

```text
frontend/src/features/opportunities/data/opportunityTemplates.js
```

Después, sustituir los valores `Pendiente` de la columna `Plantilla` por los nombres reales.

---

## 13. Veredicto operativo

Este documento no se cierra por intención.

Se cierra solo cuando las 10 plantillas hayan pasado de oportunidad a Builder con construcción, iteraciones reales y persistencia comprobada.

El Builder no se valida porque “abre”.  
El Builder se valida porque **construye**.
