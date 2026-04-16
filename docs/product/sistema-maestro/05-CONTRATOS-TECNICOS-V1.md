\# 05 — Contratos Técnicos V1



\## 1. Función de esta pieza



Este documento traduce la doctrina de producto a contratos técnicos iniciales.



No define aún toda la implementación final.

Define la base estructural que backend y frontend deberán respetar cuando se construyan:



\- activación

\- constructor visible

\- créditos

\- recargas

\- exportación

\- despliegue

\- continuidad del proyecto



Su objetivo es evitar improvisación técnica futura.



\---



\## 2. Principio rector



La implementación no debe crecer por pantallas sueltas ni por endpoints aislados.



Debe crecer desde estas entidades centrales:



\- usuario

\- plan

\- créditos

\- proyecto

\- build

\- acción premium

\- exportación

\- despliegue



\---



\## 3. Entidades mínimas del sistema



\## 3.1 User



Representa al usuario autenticado del sistema.



\### Campos base

\- `user\_id`

\- `email`

\- `name`

\- `role`

\- `plan`

\- `created\_at`

\- `updated\_at`



\### Campos futuros recomendados

\- `credit\_balance`

\- `credit\_lifetime\_used`

\- `default\_workspace\_id`

\- `export\_profile`

\- `billing\_profile\_status`



\### Regla

El plan y los créditos no deben quedar desacoplados semánticamente.



\---



\## 3.2 Plan



Representa el nivel de acceso del usuario.



\### Campos base doctrinales

\- `plan\_id`

\- `name`

\- `price`

\- `features`

\- `activation\_level`

\- `included\_credits`

\- `builder\_access`

\- `export\_access\_rule`



\### Regla

El plan no debe definirse solo por precio y textos de marketing.

Debe tener una traducción técnica clara.



\---



\## 3.3 CreditLedger



Representa el movimiento de créditos.



\### Función

Registrar:

\- saldo

\- consumo

\- recargas

\- ajustes

\- bonificaciones

\- acciones premium que consumen crédito



\### Campos recomendados

\- `entry\_id`

\- `user\_id`

\- `project\_id` opcional

\- `type`

\- `credits\_delta`

\- `credits\_balance\_after`

\- `reason\_code`

\- `meta`

\- `created\_at`



\### Tipos posibles

\- `plan\_grant`

\- `topup\_purchase`

\- `build\_consumption`

\- `iteration\_consumption`

\- `deployment\_consumption`

\- `adjustment`

\- `refund`

\- `bonus`



\### Regla

No modificar saldo sin ledger.

Todo movimiento debe quedar trazado.



\---



\## 3.4 Project



Representa el activo central de trabajo del usuario.



\### Campos base actuales

\- `project\_id`

\- `user\_id`

\- `input\_type`

\- `input\_content`

\- `route`

\- `diagnosis`

\- `refine\_questions`

\- `refine\_answers`

\- `plan\_recommendation`

\- `blueprint`

\- `status`

\- `created\_at`

\- `updated\_at`



\### Campos futuros recomendados

\- `activation`

\- `builder\_state`

\- `current\_preview`

\- `stack\_recommendation`

\- `template\_recommendation`

\- `export\_status`

\- `deployment\_status`

\- `credit\_state`

\- `workspace\_mode`

\- `source\_type` (`idea`, `url`, `operator\_url`, etc.)



\### Regla

El proyecto debe convertirse en la unidad principal de continuidad.



\---



\## 3.5 Activation



Representa la capa de activación ya traducida técnicamente.



\### Campos recomendados

\- `activation\_id`

\- `project\_id`

\- `user\_id`

\- `level`

\- `stack`

\- `template`

\- `sequence`

\- `prompts`

\- `checklist`

\- `technical\_path`

\- `non\_technical\_path`

\- `created\_at`

\- `updated\_at`



\### Regla

La activación no debe quedar como texto disperso dentro del blueprint si va a operar de verdad.



\---



\## 3.6 BuildJob



Representa una acción real de construcción visible.



\### Función

Registrar cuándo el sistema está construyendo algo.



\### Campos recomendados

\- `build\_id`

\- `project\_id`

\- `user\_id`

\- `build\_type`

\- `status`

\- `requested\_action`

\- `credits\_cost`

\- `started\_at`

\- `finished\_at`

\- `logs`

\- `result\_summary`

\- `preview\_ref`



\### Estados mínimos

\- `queued`

\- `running`

\- `completed`

\- `failed`

\- `cancelled`



\### Regla

La construcción visible debe tener entidad propia, no solo estado local en frontend.



\---



\## 3.7 Preview



Representa una vista generada o estado visible del proyecto.



\### Campos recomendados

\- `preview\_id`

\- `project\_id`

\- `build\_id`

\- `version`

\- `preview\_type`

\- `url\_or\_ref`

\- `status`

\- `created\_at`



\### Regla

La preview debe poder versionarse o al menos quedar referenciada.



\---



\## 3.8 DeploymentRequest



Representa una solicitud de despliegue.



\### Campos recomendados

\- `deployment\_id`

\- `project\_id`

\- `user\_id`

\- `status`

\- `deployment\_target`

\- `credits\_cost` opcional

\- `price\_amount` opcional

\- `requested\_at`

\- `completed\_at`

\- `meta`



\### Estados mínimos

\- `ready`

\- `requested`

\- `processing`

\- `completed`

\- `failed`



\### Regla

Despliegue no debe mezclarse semánticamente con exportación.



\---



\## 3.9 ExportRequest



Representa una solicitud de salida del proyecto fuera del sistema.



\### Campos recomendados

\- `export\_id`

\- `project\_id`

\- `user\_id`

\- `complexity\_band`

\- `price\_quote`

\- `status`

\- `requested\_at`

\- `paid\_at`

\- `delivered\_at`

\- `delivery\_type`

\- `meta`



\### Estados mínimos

\- `draft`

\- `quoted`

\- `awaiting\_payment`

\- `paid`

\- `preparing`

\- `delivered`

\- `cancelled`



\### Regla

La exportación debe tener flujo propio y valoración propia.



\---



\## 3.10 PremiumAction



Representa acciones especiales fuera del uso ordinario.



\### Ejemplos

\- despliegue premium

\- exportación especial

\- regeneración intensiva

\- auditoría avanzada futura

\- migraciones o transferencias concretas



\### Regla

No mezclar todas las acciones premium en una sola lógica ambigua.

Debe haber tipología.



\---



\## 4. Estados del proyecto



La entidad `Project` debe admitir una evolución clara.



\### Estados mínimos recomendados

\- `created`

\- `analyzed`

\- `refined`

\- `activation\_ready`

\- `build\_ready`

\- `building`

\- `build\_available`

\- `blueprint\_generated`

\- `deployment\_ready`

\- `export\_ready`

\- `archived`



\### Regla

El estado no debe ser decorativo.

Debe gobernar qué puede hacer el usuario después.



\---



\## 5. Contratos funcionales mínimos por capa



\## 5.1 Diagnóstico

Entrada:

\- idea o URL



Salida:

\- `route`

\- `diagnosis`

\- `refine\_questions`

\- `plan\_recommendation`



\---



\## 5.2 Afinado

Entrada:

\- respuestas del usuario



Salida:

\- proyecto actualizado

\- recomendación revisada

\- mejor contexto para activación



\---



\## 5.3 Blueprint

Entrada:

\- proyecto refinado o analizado



Salida:

\- `blueprint`

\- prioridades

\- pasos de despliegue

\- lógica base de avance



\---



\## 5.4 Activación futura

Entrada:

\- proyecto + plan + perfil de usuario



Salida:

\- stack recomendado

\- template recomendado

\- secuencia

\- prompts

\- checklist

\- ruta técnico / no técnico



\---



\## 5.5 Constructor visible futuro

Entrada:

\- proyecto activado

\- acción solicitada

\- créditos disponibles



Salida:

\- `build\_job`

\- `preview`

\- logs

\- estado de construcción



\---



\## 5.6 Despliegue futuro

Entrada:

\- proyecto construible

\- permisos de plan

\- créditos o pago según modelo



Salida:

\- `deployment\_request`

\- estado

\- resultado de despliegue



\---



\## 5.7 Exportación futura

Entrada:

\- proyecto exportable

\- valoración

\- pago si aplica



Salida:

\- `export\_request`

\- cotización

\- estado de preparación

\- entrega



\---



\## 6. Contratos de créditos



\## 6.1 Regla de consumo

Toda acción intensiva debe poder responder a estas preguntas:



\- qué consume

\- cuánto consume

\- por qué consume

\- dónde queda registrado



\---



\## 6.2 Política técnica

Antes de ejecutar una acción con coste de créditos, el sistema debe validar:



\- usuario autenticado

\- saldo suficiente

\- permiso de plan si aplica

\- acción disponible para ese proyecto

\- trazabilidad en ledger



\---



\## 6.3 Resultado esperado

Si hay saldo:

\- la acción se ejecuta

\- se registra el movimiento



Si no hay saldo:

\- la acción no rompe el sistema

\- se devuelve estado claro

\- se ofrece recarga o alternativa



\---



\## 7. Contratos de planes



La lógica técnica de planes debe poder responder:



\- qué puede hacer este usuario

\- qué activación le corresponde

\- cuántos créditos iniciales recibe

\- qué build puede ejecutar

\- si puede desplegar

\- si puede solicitar exportación

\- qué profundidad tiene su continuidad



\### Regla

Los permisos no deben depender solo de frontend.

Backend debe ser fuente de verdad.



\---



\## 8. Contratos de recarga



Las recargas futuras deben quedar preparadas como tipo propio de operación.



\### Deben definir

\- paquete comprado

\- créditos otorgados

\- fecha

\- usuario

\- transacción asociada



\### Regla

Recarga comprada = crédito trazado en ledger.



\---



\## 9. Contratos de exportación



La exportación futura debe pasar por estas capas:



1\. solicitud

2\. valoración

3\. cotización

4\. pago

5\. preparación

6\. entrega



\### Regla

No debe resolverse como un botón simple sin estructura.



\---



\## 10. Contratos de integración GitHub y despliegue



Cuando el sistema conecte con GitHub y deployment, debe poder registrar:



\- repositorio conectado

\- estado de conexión

\- proyecto asociado

\- despliegues ejecutados

\- errores

\- exportación del código si aplica



\### Entidad futura recomendada

`ProjectIntegration`



\### Campos posibles

\- `integration\_id`

\- `project\_id`

\- `provider`

\- `status`

\- `repo\_name`

\- `repo\_url`

\- `deployment\_target`

\- `meta`



\---



\## 11. Endpoints mínimos futuros



\## 11.1 Proyectos

\- `POST /api/projects`

\- `GET /api/projects`

\- `GET /api/projects/{project\_id}`

\- `POST /api/projects/{project\_id}/refine`

\- `POST /api/projects/{project\_id}/blueprint`



\## 11.2 Activación futura

\- `POST /api/projects/{project\_id}/activation`

\- `GET /api/projects/{project\_id}/activation`



\## 11.3 Builder futuro

\- `POST /api/projects/{project\_id}/build`

\- `GET /api/projects/{project\_id}/builds`

\- `GET /api/builds/{build\_id}`

\- `POST /api/builds/{build\_id}/retry`



\## 11.4 Créditos futuros

\- `GET /api/user/credits`

\- `GET /api/user/credits/ledger`

\- `POST /api/payments/credits/checkout`



\## 11.5 Exportación futura

\- `POST /api/projects/{project\_id}/export/quote`

\- `POST /api/projects/{project\_id}/export/checkout`

\- `GET /api/projects/{project\_id}/export/status`



\## 11.6 Despliegue futuro

\- `POST /api/projects/{project\_id}/deploy`

\- `GET /api/projects/{project\_id}/deployments`



\---



\## 12. Reglas de frontend derivadas



El frontend debe asumir estas reglas:



\- no depender solo de estado local para continuidad

\- usar `project\_id` como referencia fuerte

\- reconstruir estado desde backend cuando haga falta

\- mostrar estados del proyecto y del build con claridad

\- no asumir permisos solo por UI

\- reflejar saldo y consumo de créditos de forma legible



\---



\## 13. Reglas de backend derivadas



El backend debe asumir estas reglas:



\- validar plan y permisos en servidor

\- validar saldo de créditos en servidor

\- registrar movimientos en ledger

\- registrar jobs de construcción

\- separar exportación de despliegue

\- usar el proyecto como unidad central de continuidad



\---



\## 14. Regla de implementación



No se debe implementar ninguna nueva capacidad de builder, créditos, exportación o despliegue sin responder antes:



\- qué entidad la soporta

\- qué estado introduce

\- qué endpoint la expone

\- qué acción consume

\- qué validación requiere

\- qué trazabilidad deja



Si una nueva capacidad no responde a eso, no está madura para implementarse.



\---



\## 15. Cierre doctrinal



Sistema Maestro ya no puede crecer como conjunto de respuestas y pantallas aisladas.



Debe crecer como sistema con contratos claros entre:



\- producto

\- backend

\- frontend

\- economía

\- continuidad

\- salida



Este documento fija la base técnica V1 que permitirá implementar la siguiente fase sin improvisación estructural.

