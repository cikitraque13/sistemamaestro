# 05 — Contratos Técnicos V1

## 1. Función de esta pieza

Este documento traduce la doctrina de producto a contratos técnicos iniciales.

No define toda la implementación final.

Define la base estructural que backend y frontend deberán respetar cuando se construyan o conecten:

- activación;
- constructor visible;
- BuilderBuildKernel;
- BuilderBuildState;
- créditos;
- recargas;
- exportación;
- despliegue;
- continuidad del proyecto.

Su objetivo es evitar improvisación técnica futura.

---

## 2. Principio rector

La implementación no debe crecer por pantallas sueltas, estados locales aislados, endpoints inconexos ni respuestas decorativas del agente.

Debe crecer desde estas entidades centrales:

- usuario;
- plan;
- créditos;
- proyecto;
- build;
- estado vivo del Builder;
- acción/mutación;
- preview;
- código;
- estructura;
- acción premium;
- exportación;
- despliegue.

### Regla principal

Toda capacidad nueva debe poder responder:

```text
qué entidad la soporta
qué estado modifica
qué salida produce
qué trazabilidad deja
qué coste puede tener
qué capa la renderiza
qué capa la valida
```

Si una capacidad no responde a esto, no está madura para implementarse.

---

## 3. Entidades mínimas del sistema

## 3.1 User

Representa al usuario autenticado del sistema.

### Campos base

- `user_id`
- `email`
- `name`
- `role`
- `plan`
- `created_at`
- `updated_at`

### Campos futuros recomendados

- `credit_balance`
- `credit_lifetime_used`
- `default_workspace_id`
- `export_profile`
- `billing_profile_status`

### Regla

El plan y los créditos no deben quedar desacoplados semánticamente.

---

## 3.2 Plan

Representa el nivel de acceso del usuario.

### Campos base doctrinales

- `plan_id`
- `name`
- `price`
- `features`
- `activation_level`
- `included_credits`
- `builder_access`
- `export_access_rule`

### Regla

El plan no debe definirse solo por precio y textos de marketing.

Debe tener una traducción técnica clara.

---

## 3.3 CreditLedger

Representa el movimiento de créditos.

### Función

Registrar:

- saldo;
- consumo;
- recargas;
- ajustes;
- bonificaciones;
- acciones premium que consumen crédito.

### Campos recomendados

- `entry_id`
- `user_id`
- `project_id` opcional
- `type`
- `credits_delta`
- `credits_balance_after`
- `reason_code`
- `meta`
- `created_at`

### Tipos posibles

- `plan_grant`
- `topup_purchase`
- `build_consumption`
- `iteration_consumption`
- `deployment_consumption`
- `export_consumption`
- `adjustment`
- `refund`
- `bonus`

### Regla

No modificar saldo sin ledger.

Todo movimiento debe quedar trazado.

---

## 3.4 Project

Representa el activo central de trabajo del usuario.

### Campos base actuales

- `project_id`
- `user_id`
- `input_type`
- `input_content`
- `route`
- `diagnosis`
- `refine_questions`
- `refine_answers`
- `plan_recommendation`
- `blueprint`
- `status`
- `created_at`
- `updated_at`

### Campos futuros recomendados

- `activation`
- `builder_state`
- `current_preview`
- `current_code_snapshot`
- `current_structure_snapshot`
- `stack_recommendation`
- `template_recommendation`
- `export_status`
- `deployment_status`
- `credit_state`
- `workspace_mode`
- `source_type` (`idea`, `url`, `operator_url`, `prompt`, `expert_prompt`)

### Regla

El proyecto debe convertirse en la unidad principal de continuidad.

Toda construcción, iteración, preview, código, estructura, exportación o despliegue debe poder asociarse a un `project_id`.

---

## 3.5 Activation

Representa la capa de activación ya traducida técnicamente.

### Campos recomendados

- `activation_id`
- `project_id`
- `user_id`
- `level`
- `stack`
- `template`
- `sequence`
- `prompts`
- `checklist`
- `technical_path`
- `non_technical_path`
- `created_at`
- `updated_at`

### Regla

La activación no debe quedar como texto disperso dentro del blueprint si va a operar de verdad.

La activación prepara el proyecto.

El Builder construye y muestra.

---

## 3.6 BuilderBuildState

Representa el estado vivo de lo que el Builder está construyendo.

### Función

Mantener una representación única y acumulativa de lo construido por el Builder.

Debe poder responder:

- qué tipo de proyecto se está construyendo;
- qué bloques existen;
- qué componentes existen;
- qué CTAs están activos;
- qué archivos se han generado;
- qué estructura se ha derivado;
- qué acciones se han aplicado;
- qué acciones quedan disponibles;
- qué salida debe ver el usuario.

### Campos recomendados

- `project_id`
- `build_state_id`
- `project_kind`
- `mode`
- `blocks`
- `components`
- `pages`
- `routes`
- `api_routes`
- `folders`
- `files`
- `ctas`
- `theme`
- `applied_actions`
- `available_actions`
- `preview_model`
- `code_model`
- `structure_model`
- `credit_estimate`
- `updated_at`

### Regla

El Builder no debe gobernarse por copy suelto, mensajes del agente, `hubSummary`, `lastDelta`, `lastOperation`, fases de progreso ni plantillas aisladas.

El Builder debe gobernarse por un estado vivo.

---

## 3.7 BuilderBuildKernel

Representa la piedra angular operativa del Builder visible.

### Función

Coordinar el contrato entre input de usuario, IA, mutaciones, estado vivo, preview, código, estructura y siguientes decisiones.

### Contrato mínimo

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

### Salida esperada

El kernel debe devolver, como mínimo:

- `nextState`
- `previewModel`
- `codeModel`
- `structureModel`
- `nextQuestions`
- `creditEstimate`
- `trace`

### Regla

El kernel no debe ser un megaarchivo.

El kernel debe coordinar.

El conocimiento debe vivir en registros, playbooks, presets, mapas de output, mutaciones, estructura y flujos de preguntas.

---

## 3.8 BuilderMutation

Representa una acción normalizada que modifica el estado vivo del Builder.

### Ejemplos

- `add_google_access`
- `add_subscription_box`
- `add_gema_maestra_section`
- `add_how_it_works`
- `add_live_builder_section`
- `add_trust_section`
- `add_dashboard`
- `add_auth_flow`
- `add_api_layer`
- `generate_folder_structure`
- `prepare_export_plan`

### Campos recomendados

- `mutation_id`
- `label`
- `source`
- `matched_input`
- `affected_blocks`
- `affected_components`
- `affected_files`
- `affected_routes`
- `affected_ctas`
- `credit_tier`
- `next_actions`
- `created_at`

### Regla

Ninguna sugerencia del agente es válida por sí misma si no puede traducirse a una mutación aplicable.

Una acción que solo produce texto no se considera construcción válida.

---

## 3.9 BuildJob

Representa una acción real de construcción visible.

### Función

Registrar cuándo el sistema está construyendo algo.

### Campos recomendados

- `build_id`
- `project_id`
- `user_id`
- `build_type`
- `status`
- `requested_action`
- `mutation_id`
- `credits_cost`
- `started_at`
- `finished_at`
- `logs`
- `result_summary`
- `preview_ref`
- `state_ref`

### Estados mínimos

- `queued`
- `running`
- `completed`
- `failed`
- `cancelled`

### Regla

La construcción visible debe tener entidad propia, no solo estado local en frontend.

---

## 3.10 Preview

Representa una vista generada o estado visible del proyecto.

### Campos recomendados

- `preview_id`
- `project_id`
- `build_id`
- `version`
- `preview_type`
- `url_or_ref`
- `status`
- `preview_model`
- `created_at`

### Regla

La preview debe poder versionarse o al menos quedar referenciada.

La preview no debe ser una plantilla decorativa si el Builder promete construcción real.

---

## 3.11 CodeSnapshot

Representa el código derivado del estado vivo del Builder.

### Campos recomendados

- `code_snapshot_id`
- `project_id`
- `build_id`
- `version`
- `language`
- `files`
- `entry_file`
- `generated_at`
- `meta`

### Regla

El código debe generarse desde el mismo estado vivo que alimenta preview y estructura.

No debe existir una preview que muestre algo que el código no pueda representar.

---

## 3.12 StructureSnapshot

Representa la estructura de carpetas, archivos, rutas y componentes generada o prevista para el proyecto.

### Campos recomendados

- `structure_snapshot_id`
- `project_id`
- `build_id`
- `version`
- `folders`
- `files`
- `components`
- `routes`
- `api_routes`
- `generated_at`
- `meta`

### Regla

La estructura no debe depender solo de un blueprint inicial.

Debe poder evolucionar con las mutaciones aplicadas en el Builder.

---

## 3.13 DeploymentRequest

Representa una solicitud de despliegue.

### Campos recomendados

- `deployment_id`
- `project_id`
- `user_id`
- `status`
- `deployment_target`
- `credits_cost` opcional
- `price_amount` opcional
- `requested_at`
- `completed_at`
- `meta`

### Estados mínimos

- `ready`
- `requested`
- `processing`
- `completed`
- `failed`

### Regla

Despliegue no debe mezclarse semánticamente con exportación.

---

## 3.14 ExportRequest

Representa una solicitud de salida del proyecto fuera del sistema.

### Campos recomendados

- `export_id`
- `project_id`
- `user_id`
- `complexity_band`
- `price_quote`
- `status`
- `requested_at`
- `paid_at`
- `delivered_at`
- `delivery_type`
- `meta`

### Estados mínimos

- `draft`
- `quoted`
- `awaiting_payment`
- `paid`
- `preparing`
- `delivered`
- `cancelled`

### Regla

La exportación debe tener flujo propio y valoración propia.

---

## 3.15 PremiumAction

Representa acciones especiales fuera del uso ordinario.

### Ejemplos

- despliegue premium;
- exportación especial;
- regeneración intensiva;
- auditoría avanzada futura;
- migraciones o transferencias concretas;
- construcción técnica profunda;
- integración con GitHub;
- creación de backend complejo.

### Regla

No mezclar todas las acciones premium en una sola lógica ambigua.

Debe haber tipología.

---

## 4. Estados del proyecto

La entidad `Project` debe admitir una evolución clara.

### Estados mínimos recomendados

- `created`
- `analyzed`
- `refined`
- `activation_ready`
- `build_ready`
- `building`
- `build_available`
- `blueprint_generated`
- `deployment_ready`
- `export_ready`
- `archived`

### Regla

El estado no debe ser decorativo.

Debe gobernar qué puede hacer el usuario después.

---

## 5. Estados del Builder

El Builder debe admitir una evolución propia, separada pero vinculada al proyecto.

### Estados mínimos recomendados

- `idle`
- `interpreting`
- `planning`
- `mutating`
- `building`
- `preview_ready`
- `code_ready`
- `structure_ready`
- `awaiting_user_decision`
- `failed`

### Regla

El estado del Builder debe explicar al usuario qué está pasando sin convertir el panel en un chat redundante.

---

## 6. Contratos funcionales mínimos por capa

## 6.1 Diagnóstico

Entrada:

- idea o URL.

Salida:

- `route`
- `diagnosis`
- `refine_questions`
- `plan_recommendation`

---

## 6.2 Afinado

Entrada:

- respuestas del usuario.

Salida:

- proyecto actualizado;
- recomendación revisada;
- mejor contexto para activación.

---

## 6.3 Blueprint

Entrada:

- proyecto refinado o analizado.

Salida:

- `blueprint`;
- prioridades;
- pasos de despliegue;
- lógica base de avance.

---

## 6.4 Activación

Entrada:

- proyecto;
- plan;
- perfil de usuario.

Salida:

- stack recomendado;
- template recomendado;
- secuencia;
- prompts;
- checklist;
- ruta técnica / no técnica.

---

## 6.5 Constructor visible / Builder

Entrada:

- proyecto activado o input directo;
- acción solicitada;
- contexto IA;
- créditos disponibles cuando proceda.

Salida mínima:

- `BuilderBuildState`;
- `BuildJob`;
- `Preview`;
- `CodeSnapshot`;
- `StructureSnapshot`;
- siguientes decisiones;
- logs o trace interno.

### Regla

El constructor visible ejecuta y muestra.

No basta con que el agente responda.

---

## 6.6 Despliegue futuro

Entrada:

- proyecto construible;
- permisos de plan;
- créditos o pago según modelo.

Salida:

- `DeploymentRequest`;
- estado;
- resultado de despliegue.

---

## 6.7 Exportación futura

Entrada:

- proyecto exportable;
- valoración;
- pago si aplica.

Salida:

- `ExportRequest`;
- cotización;
- estado de preparación;
- entrega.

---

## 7. Contrato técnico del BuilderBuildKernel

## 7.1 Contrato aprobado

Toda evolución del Builder visible debe respetar este contrato:

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

## 7.2 Regla técnica

Ningún playbook, agente, preset o sugerencia es válido por sí mismo si no puede traducirse a una mutación aplicable sobre el estado vivo del Builder.

## 7.3 Salida mínima obligatoria

Cada mutación debe declarar, cuando aplique:

- bloques visuales afectados;
- componentes afectados;
- archivos generados;
- rutas o carpetas generadas;
- CTAs afectados;
- coste estimado futuro;
- siguientes preguntas.

## 7.4 Criterio de cierre

El Builder se considerará correctamente alineado cuando una petición como:

```text
Añade acceso con Google
```

produzca simultáneamente:

```text
preview con bloque real
código con componente real
estructura con archivo real
siguiente mejora distinta
```

Y cuando una petición como:

```text
Crea una app con dashboard y backend
```

produzca simultáneamente:

```text
estructura frontend/backend
páginas, rutas y componentes
preview coherente con la app
código alineado con la estructura
siguientes decisiones técnicas no repetidas
```

---

## 8. Contratos de créditos

## 8.1 Regla de consumo

Toda acción intensiva debe poder responder a estas preguntas:

- qué consume;
- cuánto consume;
- por qué consume;
- dónde queda registrado;
- qué salida obtiene el usuario.

## 8.2 Política técnica

Antes de ejecutar una acción con coste de créditos, el sistema debe validar:

- usuario autenticado;
- saldo suficiente;
- permiso de plan si aplica;
- acción disponible para ese proyecto;
- trazabilidad en ledger.

## 8.3 Resultado esperado

Si hay saldo:

- la acción se ejecuta;
- se registra el movimiento;
- se devuelve una salida verificable.

Si no hay saldo:

- la acción no rompe el sistema;
- se devuelve estado claro;
- se ofrece recarga o alternativa.

## 8.4 Regla de protección comercial

No se debe consumir crédito sobre una acción que no produzca salida real, visible o técnicamente verificable.

---

## 9. Contratos de planes

La lógica técnica de planes debe poder responder:

- qué puede hacer este usuario;
- qué activación le corresponde;
- cuántos créditos iniciales recibe;
- qué build puede ejecutar;
- si puede desplegar;
- si puede solicitar exportación;
- qué profundidad tiene su continuidad.

### Regla

Los permisos no deben depender solo de frontend.

Backend debe ser fuente de verdad.

---

## 10. Contratos de recarga

Las recargas futuras deben quedar preparadas como tipo propio de operación.

### Deben definir

- paquete comprado;
- créditos otorgados;
- fecha;
- usuario;
- transacción asociada.

### Regla

Recarga comprada = crédito trazado en ledger.

---

## 11. Contratos de exportación

La exportación futura debe pasar por estas capas:

1. solicitud;
2. valoración;
3. cotización;
4. pago;
5. preparación;
6. entrega.

### Regla

No debe resolverse como un botón simple sin estructura.

La exportación debe leer de una estructura, código y estado de proyecto coherentes.

---

## 12. Contratos de integración GitHub y despliegue

Cuando el sistema conecte con GitHub y deployment, debe poder registrar:

- repositorio conectado;
- estado de conexión;
- proyecto asociado;
- despliegues ejecutados;
- errores;
- exportación del código si aplica.

### Entidad futura recomendada

`ProjectIntegration`

### Campos posibles

- `integration_id`
- `project_id`
- `provider`
- `status`
- `repo_name`
- `repo_url`
- `deployment_target`
- `meta`

### Regla

GitHub y despliegue no deben conectarse sobre una estructura simulada.

Deben conectarse sobre código y estructura derivados del estado vivo del Builder.

---

## 13. Endpoints mínimos futuros

## 13.1 Proyectos

- `POST /api/projects`
- `GET /api/projects`
- `GET /api/projects/{project_id}`
- `POST /api/projects/{project_id}/refine`
- `POST /api/projects/{project_id}/blueprint`

## 13.2 Activación

- `POST /api/projects/{project_id}/activation`
- `GET /api/projects/{project_id}/activation`

## 13.3 Builder

- `POST /api/projects/{project_id}/build`
- `GET /api/projects/{project_id}/builds`
- `GET /api/builds/{build_id}`
- `POST /api/builds/{build_id}/retry`
- `GET /api/projects/{project_id}/builder-state`
- `POST /api/projects/{project_id}/builder-state/mutations`

### Regla

Los endpoints de Builder no deben exponer solo texto.

Deben poder devolver estado, preview, código, estructura o referencias a esos recursos.

## 13.4 Créditos

- `GET /api/user/credits`
- `GET /api/user/credits/ledger`
- `POST /api/payments/credits/checkout`

## 13.5 Exportación

- `POST /api/projects/{project_id}/export/quote`
- `POST /api/projects/{project_id}/export/checkout`
- `GET /api/projects/{project_id}/export/status`

## 13.6 Despliegue

- `POST /api/projects/{project_id}/deploy`
- `GET /api/projects/{project_id}/deployments`

---

## 14. Reglas de frontend derivadas

El frontend debe asumir estas reglas:

- no depender solo de estado local para continuidad;
- usar `project_id` como referencia fuerte;
- reconstruir estado desde backend cuando haga falta;
- mostrar estados del proyecto y del build con claridad;
- no asumir permisos solo por UI;
- reflejar saldo y consumo de créditos de forma legible;
- representar preview, código y estructura desde una misma fuente viva;
- no tratar mensajes del agente como construcción real;
- no repetir sugerencias ya aplicadas;
- no prometer exportación o deploy si no existe estructura coherente.

### Regla específica de Builder

Toda evolución de Builder debe pasar por:

```text
BuilderBuildKernel
→ BuilderBuildState
→ preview/código/estructura
```

---

## 15. Reglas de backend derivadas

El backend debe asumir estas reglas:

- validar plan y permisos en servidor;
- validar saldo de créditos en servidor;
- registrar movimientos en ledger;
- registrar jobs de construcción;
- separar exportación de despliegue;
- usar el proyecto como unidad central de continuidad;
- preparar persistencia futura de estado de Builder;
- no tratar IA puente como runtime vivo completo hasta su fase formal.

### Regla específica de persistencia

La primera fase puede iniciar en frontend como estado vivo modular.

La fase backend debe persistir o reconstruir ese estado cuando el Builder pase a exportación, deploy, créditos reales o continuidad avanzada.

---

## 16. Regla de implementación

No se debe implementar ninguna nueva capacidad de Builder, créditos, exportación o despliegue sin responder antes:

- qué entidad la soporta;
- qué estado introduce;
- qué endpoint la expone;
- qué acción consume;
- qué validación requiere;
- qué trazabilidad deja;
- qué preview modifica;
- qué código modifica;
- qué estructura modifica;
- qué coste futuro puede tener.

Si una nueva capacidad no responde a eso, no está madura para implementarse.

---

## 17. Regla antisimulación del Builder

El Builder no puede limitarse a simular construcción.

Se considera simulación cuando una acción produce solo:

- texto del agente;
- animación de progreso;
- cambios de copy no persistentes;
- código decorativo no conectado;
- preview que no refleja mutación;
- estructura que no cambia;
- preguntas repetidas sin memoria.

Se considera construcción válida cuando una acción produce al menos uno de estos efectos:

- estado vivo actualizado;
- preview modificada;
- código modificado;
- estructura modificada;
- CTA modificado;
- bloque nuevo;
- archivo nuevo;
- siguiente decisión contextual distinta.

---

## 18. Cierre doctrinal

Sistema Maestro ya no puede crecer como conjunto de respuestas y pantallas aisladas.

Debe crecer como sistema con contratos claros entre:

- producto;
- Builder;
- IA;
- backend;
- frontend;
- economía;
- continuidad;
- salida.

Este documento fija la base técnica V1 para implementar la siguiente fase sin improvisación estructural.

La siguiente fase técnica queda condicionada a que Builder deje de operar como pantalla aislada y pase a operar como sistema vivo:

```text
input
→ intención
→ mutación
→ estado
→ preview
→ código
→ estructura
→ decisión siguiente
```