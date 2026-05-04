# 03 — Agent Contracts

## Estado del documento

- Estado: activo
- Tipo: contrato canónico de agentes
- Alcance: definición, límites, entradas, salidas, herramientas y guardrails
- Objetivo: evitar agentes genéricos, solapados o imposibles de auditar.

---

## 1. Propósito

Este documento define el contrato mínimo que debe cumplir cada agente del sistema.

Un agente no es un prompt suelto.

Un agente es una unidad operativa con:

- misión;
- entradas;
- límites;
- herramientas;
- salida esperada;
- guardrails;
- trazabilidad.

---

## 2. Contrato base obligatorio

Cada agente debe definir:

### 2.1 Nombre canónico

Identificador único y estable.

Ejemplo:

```text
builder_agent
```

### 2.2 Rol

Qué tipo de especialista es.

### 2.3 Misión

Qué problema resuelve.

### 2.4 Entradas

Qué recibe exactamente.

### 2.5 Herramientas permitidas

Qué puede usar.

### 2.6 Límites

Qué no puede hacer.

### 2.7 Salida esperada

Qué devuelve y en qué formato.

### 2.8 Guards aplicables

Qué validaciones limitan su salida.

### 2.9 Telemetría

Qué trazas mínimas debe emitir.

---

## 3. Regla crítica

Si un agente responde a más de una misión principal, está mal definido.

Debe dividirse o limitarse.

---

## 4. Contrato `builder_agent`

### Misión

Construir, modificar o mejorar salidas del Builder.

### Entradas

- intención del usuario;
- contexto de plantilla o proyecto;
- estado actual del Builder;
- modo de operación;
- restricciones de producto;
- señales de continuidad.

### Herramientas permitidas

- playbooks Builder;
- mutation registry;
- code templates;
- structure registry;
- output map;
- sector profiles;
- policy guards.

### Límites

No debe:

- desplegar por su cuenta;
- decidir pricing;
- saltarse créditos;
- modificar pagos;
- inventar ownership;
- ignorar estado actual;
- reemplazar todo si se pidió una mejora puntual.

### Salida esperada

Debe devolver estructura compatible con Builder:

```text
intent
projectKind
sector
objective
tone
mutations
previewModelPatch
codeModelPatch
structureModelPatch
assistantMessage
nextAction
warnings
```

---

## 5. Contrato `rescue_sre_agent`

### Misión

Diagnosticar y corregir fallos de arranque, runtime o estabilidad.

### Entradas

- logs;
- errores;
- healthchecks;
- estado de runtime;
- configuración;
- diferencias de deploy.

### Herramientas permitidas

- log analysis;
- env validation;
- runtime checks;
- dependency checks.

### Límites

No debe:

- rediseñar producto;
- tocar UX comercial;
- decidir pricing;
- modificar datos de usuario;
- hacer cambios destructivos sin confirmación.

### Salida esperada

- causa raíz probable;
- evidencia;
- corrección mínima segura;
- validación esperada;
- rollback si aplica.

---

## 6. Contrato `security_architect_agent`

### Misión

Detectar brechas y endurecer sistema.

### Entradas

- auth;
- cookies;
- JWT;
- permisos;
- pagos;
- webhooks;
- roles;
- secretos;
- entorno.

### Herramientas permitidas

- security rules;
- policy checks;
- audit patterns;
- auth flow review.

### Límites

No debe:

- crear features comerciales;
- redefinir producto;
- modificar producción sin control;
- exponer secretos.

### Salida esperada

- hallazgo;
- severidad;
- impacto;
- mitigación;
- prioridad;
- prueba de cierre.

---

## 7. Contrato `red_team_agent`

### Misión

Detectar vectores hostiles y superficies de abuso desde una perspectiva defensiva.

### Entradas

- auth;
- sesiones;
- pagos;
- créditos;
- admin;
- outputs sensibles;
- eventos de guards.

### Herramientas permitidas

- policy validator;
- session audit;
- abuse patterns;
- output sampler;
- consistency checker.

### Límites

No debe:

- ejecutar ataques reales;
- tocar producción;
- modificar pagos;
- desplegar;
- usar herramientas de escritura sin aprobación.

### Salida esperada

- vector detectado;
- severidad;
- superficie afectada;
- mitigación;
- necesidad de revisión humana.

---

## 8. Contrato `audit_agent`

### Misión

Detectar fricciones de negocio, claridad, estructura, conversión y monetización.

### Entradas

- idea;
- URL;
- proyecto;
- contenido;
- señales de usuario.

### Salida esperada

- diagnóstico;
- fortalezas;
- debilidades;
- quick wins;
- acciones prioritarias;
- recomendación de continuidad.

---

## 9. Contrato `report_agent`

### Misión

Convertir diagnóstico en informe estructurado y accionable.

### Salida esperada

- resumen ejecutivo;
- diagnóstico principal;
- lectura por dimensiones;
- prioridades;
- acción inmediata;
- continuidad recomendada.

---

## 10. Contrato `system_architect_agent`

### Misión

Convertir una intención en arquitectura de proyecto.

### Salida esperada

- módulos;
- entidades;
- rutas;
- servicios;
- estructura;
- dependencias;
- riesgos;
- siguiente paso técnico.

---

## 11. Contrato `deploy_agent`

### Misión

Validar despliegue y runtime.

### Salida esperada

- ruta canónica de deploy;
- variables requeridas;
- healthcheck;
- build;
- runtime;
- fallos probables;
- corrección mínima.

---

## 12. Contrato `algorithmic_auditor_agent`

### Misión

Auditar decisiones algorítmicas, scoring y consistencia.

### Salida esperada

- inconsistencia detectada;
- regla afectada;
- impacto;
- recomendación;
- test o caso de validación.

---

## 13. Relación con guards

Todo agente sensible debe pasar por guards.

Especialmente:

- pagos;
- auth;
- créditos;
- Builder;
- exportación;
- deploy;
- outputs técnicos.

---

## 14. Relación con créditos

Un agente puede recomendar una acción.

No puede autorizar coste por sí mismo.

Toda acción intensiva debe pasar por:

```text
Consumption Engine
```

---

## 15. Veredicto operativo

Un agente válido tiene una misión estrecha, una salida verificable y límites claros.

Si no se puede auditar, no está listo para producción.
