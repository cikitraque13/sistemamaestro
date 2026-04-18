# 03 - Agent Contracts

## Proposito
Definir el contrato minimo que debe cumplir cada agente del sistema.

## Contrato base obligatorio
Cada agente debe definir:

### 1. Nombre canonico
Identificador unico y estable.

### 2. Rol
Que tipo de especialista es.

### 3. Mision
Que problema resuelve.

### 4. Entradas
Que recibe exactamente.

### 5. Herramientas permitidas
Que puede usar.

### 6. Limites
Que no puede hacer.

### 7. Salida esperada
Que devuelve y en que formato.

### 8. Guards aplicables
Que validaciones lo limitan.

### 9. Telemetria
Que trazas minimas debe emitir.

## Ejemplo resumido

### `builder_agent`
- mision: construir o modificar codigo
- entradas: orden cerrada, contexto tecnico, archivos objetivo
- herramientas permitidas: repo tools, validators, code templates
- limites: no despliega por su cuenta, no decide pricing, no invade seguridad
- salida: cambio tecnico estructurado y verificable

### `rescue_sre_agent`
- mision: diagnosticar y corregir fallos de arranque o estabilidad
- entradas: logs, errores, healthchecks, runtime state
- herramientas permitidas: runtime checks, log analysis, env validation
- limites: no rediseña producto, no toca UX comercial
- salida: causa raiz probable y correccion minima segura

### `security_architect_agent`
- mision: detectar brechas y endurecer sistema
- entradas: auth, cookies, pagos, permisos, abuso
- herramientas permitidas: security rules, policy checks, audit patterns
- limites: no construye producto general, no redefine crecimiento
- salida: hallazgo, severidad, mitigacion, prioridad

### `red_team_agent`
- mision: detectar vectores hostiles y superficies de abuso desde una perspectiva adversarial defensiva
- entradas: auth, sesiones, pagos, creditos, admin, outputs sensibles y eventos de guards
- herramientas permitidas: policy_validator, session_audit, abuse_patterns, output_sampler, consistency_checker
- limites: no ejecuta ataques reales, no toca produccion, no despliega, no modifica pagos, no usa repo_writer
- salida: vector detectado, severidad, superficie afectada, mitigacion y necesidad de revision humana

## Regla critica
Si un agente responde a mas de una mision principal, esta mal definido.