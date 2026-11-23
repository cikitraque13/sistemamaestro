# 11-REGISTRO-JORNADA-20261123-24

## Estado del documento

- Estado: registro fechado, solo documentación. Redactado el 2026-11-24 (Europe/Madrid).
- Función: dejar constancia del trabajo del 23 y 24 de noviembre de 2026 y de su estado real.
- Autoridad: no cambia estados de madurez, no abre ni cierra gates y no autoriza trabajo. Los estados siguen siendo propiedad del [Master Maturity Roadmap](../product/sistema-maestro/08-MASTER-MATURITY-ROADMAP.md); el backlog, de [Pendientes priorizados](02-PENDIENTES-PRIORIZADOS.md); la identidad productiva, de [Runtime and Deploy Truth](../architecture/04-runtime-and-deploy-truth.md).
- Método: cada afirmación se contrastó con el historial de `main` en GitHub, con la lista de deployments de Railway y, cuando aplica, con el PC de Lucas en modo solo lectura. Lo que no se pudo verificar se marca como tal.

## 1. PRs fusionados el 23-11-2026

Todos con merge commit normal en `main`. Horas en Europe/Madrid, tomadas del merge commit.

| PR | Hora | Merge | Título del merge commit | Deployment Railway |
|---|---|---|---|---|
| #111 | 21:25 | `fb2be4c` | docs: record PR #110 deploy and 2026-11-23 runtime verification | `a887f0f1` |
| #112 | 21:38 | `cff4344` | chore: align Railway docs, remove legacy admin test, unify local dev ports | `83d38c99` y `5d2c7046` (dos deployments sobre el mismo commit) |
| #113 | 22:14 | `d9a8c49` | fix: gate PDF report export on the server (admin role or paid single_report) | `ce372b82` |
| #114 | 22:30 | `c33d503` | chore: remove PDF report flow and visible blueprint hooks | `fe882fd9` |
| #115 | 22:42 | `b60cfc4` | Portada: quitar entrada guiada y dejar un solo cuadro de idea | `c89094dd` |
| #116 | 22:44 | `95f8116` | Portada: eliminar los cuatro bloques de la entrada guiada (revierte #115) | `44f6e7ff` |
| #117 | 22:51 | `ec1ab9b` | Portada: una sola versión para móvil y escritorio | `30ab8ee6` |
| #118 | 23:08 | `a79b61c` | Portada: corregir tildes y eñes en los textos visibles | `a39166ad`, SUCCESS 23:09 |
| #119 | 23:14 | `2c8f72a` | Portada: fusionar Cómo funciona en Lo que hace de verdad | `ebde76ad`, SUCCESS 23:14 |
| #120 | 23:20 | `05e352f` | Portada: eliminar Gema Maestra y Señales de confianza | `81eff35d`, SUCCESS 23:20 |
| #121 | 23:22 | `018a32c` | Portada: bloque Analiza, Construye, Despliega justo debajo del titular | `f27d7d95`, SUCCESS 23:23 |
| #122 | 23:42 | `df8f58c` | Portada: Planes en cápsula verde lima del menú y limpieza de textos residuales | `b0507a19`, SUCCESS 23:43 |
| #123 | 23:49 | `7b8b009` | Portada: quitar textos residuales del flujo viejo y pie en español | `49032564`, SUCCESS 23:50 |

Notas de verificación:

- El SUCCESS de #118 a #123 se comprobó en el momento de cada despliegue, con `GET /` y `GET /health` en HTTP 200. Los deployments de #111 a #121 figuran hoy como `REMOVED` porque cada uno fue sustituido por el siguiente; no es un fallo.
- La eliminación del flujo del informe PDF es #114. #113 es el cierre previo del permiso de PDF en el servidor, que #114 dejó sin uso al retirar el flujo.
- #115 se fusionó con un alcance que Lucas cambió después; #116 lo revierte y aplica solo la retirada de los cuatro bloques.
- #112 alinea la documentación de Railway y los puertos locales y retira un test de admin heredado. No toca el `Dockerfile`, cuyo último cambio en `main` es del 2026-10-07 (`4322f79`).
- El segundo deployment de #112 (`5d2c7046`) no corresponde a un commit nuevo. Es compatible con la retirada de las variables `ADMIN_EMAIL` y `ADMIN_PASSWORD` del servicio, pero ese vínculo no se verifica en este registro.

Trabajo del día que no fue un PR:

- Borrado de las ramas S14 y S17: hecho en GitHub, sin PR. Hoy el remoto solo tiene la rama `main`.
- Guía de Claude: `GUIA_ENTRADA_CLAUDE.md` se borró en el PC de Lucas por orden directa suya (registrado en `SM_guias\archive\MOVIMIENTOS_20261123.md`, pasada 2). Nunca estuvo en el repositorio.
- Reorganización de S.Maestro dentro de `Ecosistema\Proyectos`: movimiento de carpetas en el PC, sin PR, con `git worktree repair` posterior.
- Consolidación de documentos: en el repo corresponde a #111 (fichas de revisión en 31 documentos). La consolidación de carpetas de guías fuera del repo está en el mismo registro de movimientos del PC.

### PRs fusionados el 24-11-2026 (después de #124)

| PR | Hora | Merge | Título del merge commit | Deployment Railway |
|---|---|---|---|---|
| #124 | 00:23 | `689ec1d` | docs: registrar el estado real del 23 y 24 de noviembre de 2026 | `7fcdc561`, sustituido por el siguiente antes de verse terminar |
| #125 | 00:24 | `07d00a2` | Portada: quitar el bloque Entrada y subir las tarjetas numeradas | `74d73660`, SUCCESS 00:25 |
| #127 | 00:30 | `2446ba7` | Portada: quitar el hueco negro junto al titular y subir las tarjetas | `dc22969e` |
| #126 | 00:32 | `432c979` | Portada: botón Iniciar sesión en lavanda claro con brillo suave | `9943d660`, SUCCESS 00:33 |

- #125 quita de `HeroSection.js` el bloque Entrada completo: el rótulo `'Entrada'`, el cuadro "Empieza con una idea o una web" y el botón "Pon tu idea".
- #127 corrige el hueco negro que quedó junto al titular. La causa era el ancho estrecho heredado del hero (`max-w-3xl` en el contenedor y `max-w-[11ch]` en el titular), pensado para compartir fila con el bloque quitado. Desde 768 px pasan a `md:max-w-5xl` y `md:max-w-[24ch]`; en móvil no cambia nada.
- #126 cambia solo `frontend/src/features/home/components/HomeNav.js`: el botón Iniciar sesión pasa a lavanda claro con brillo suave. La rama se puso al día con "Update branch" de GitHub, que añadió el merge commit `416520e` firmado por cikitraque13, no por Lucas Díaz Arias.
- Desde la portada, el acceso al builder queda solo por Iniciar sesión y por Planes.
- Restos fuera de la home, sin tocar: `frontend/src/features/home/sections/FinalCtaSection.js` sigue en el repo sin montarse en la portada, y `DashboardPage.js` conserva sus textos; ninguno de los dos se ha tocado.

## 2. Estado del centro de mando

- `Centro de Mando\centro_mando_estado.json` está en `"revision": 52` (leído el 2026-11-24 en el PC, sin modificarlo; última escritura 2026-11-23 21:59).
- Existe la copia de la revisión 51 en `Centro de Mando\backups\Backups_estado_rev51_20261123`.
- Este repositorio no versiona ese JSON.

## 3. GrokBot Core

- Lucas declara que está eliminada.
- En el PC queda `Ecosistema\Archivo\20261123_restos\para_borrar\GrokBot_Backup_2026-10-23` y su `.zip`. Es una copia de respaldo apartada para borrar, no una instalación activa. No se ha borrado nada.
- No hay rastro de GrokBot en este repositorio.

## 4. Cuentas de prueba

- Las dos cuentas de prueba siguen pendientes de decisión de Lucas:
  - `shadowtest_…@example.com` (`user_230c250456c4`): sin proyectos ni datos relacionados en la última consulta. No está borrada.
  - `user@example.com` (`user_cf2201049e50`): tiene 3 proyectos de prueba. No está borrada.
- Hoy no se consultó la base de datos; el estado es el del último registro.

## 5. Cola de la portada y del builder

Hecho y publicado:

- Tildes de la portada (#118).
- Promesas de extraer, desplegar y ruta retiradas fuera del bloque de cuatro tarjetas (#122 y #123).
- Gema Maestra y Señales de confianza fuera de la portada (#120).
- Planes en cápsula verde lima en la cabecera, con desplegable (#122).
- Cuatro tarjetas 01 Analiza, 02 Construye, 03 Despliega, 04 Extrae justo debajo del titular (#119 y #121).
- Una sola portada para móvil y escritorio (#117).
- Bloque Entrada quitado (#125), hueco negro corregido (#127) y botón Iniciar sesión en lavanda (#126), el 24-11-2026.

Pendiente:

- Panel de intención y plan del builder (J06) que se ve sin estilo.
- Recorte de las pestañas del builder: hoy siguen las seis (`Preview`, `Código`, `Extracción`, `Estructura`, `Deploy`, `GitHub`) en `frontend/src/features/builder/data/builderWorkspaceTabs.js`. No está hecho.
- Coste o plan de Extracción: por definir.

## 6. Roadmap

Lectura literal del roadmap el 2026-11-24, sin cambiar estados:

- J06 sigue `OPEN` con `TECHNICAL_STATUS=PARTIAL`, pendiente del cierre global.
- J07 (orquestación y runtime multiagente), J08 (capacidades especializadas) y J14 (Builder autónomo multi-step) hablan del builder y de agentes y siguen `NOT_DEMONSTRATED`.
- J17 no existe: el roadmap cubre J04 a J16.
- Las propuestas que salieron de la lectura están registradas como propuestas, no como decisiones, en el [roadmap](../product/sistema-maestro/08-MASTER-MATURITY-ROADMAP.md#propuestas-registradas-el-2026-11-24).

## 7. Informes cerrados (fuera del repositorio)

No se copian a `docs/` porque son investigación externa con datos de terceros y precios de proveedores que cambian; no son contratos ni evidencia del producto. Se resumen aquí.

- Alcance del builder, leído sobre `main` en `95f8116`, solo lectura. Hechos que se comprueban hoy en `7b8b009`: las seis pestañas siguen; `backend/app/ai/agents/deploy_agent.py` está vacío (0 bytes). El archivo del informe no se localizó en disco al redactar este registro.
- Herramientas externas: para que el builder publique, Cloudflare for SaaS para dominios de cliente, Resend para correo, Cal.diy o Easy!Appointments para citas, n8n para automatizaciones, WhatsApp por la API oficial de Meta y voz con Vapi o Retell y un número +34. Hueco principal: el builder no publica nada. Orden de activación propuesto: dirección propia con candado, formulario con aviso por correo, dominio del cliente, citas, n8n, WhatsApp y voz.
- Vídeos de una formación externa sobre agencias de agentes de IA: 13 transcripciones y 3 grabaciones con imagen. Herramientas vistas: Lau Hackers (prompt hacia Base44), un constructor de agentes de WhatsApp en cinco pasos con conexión por QR, Vento IA (demo desde la web de un negocio), Base44, Lovable, HeyGen, Captions y Gamma. Lo que se adapta: un solo flujo con un solo nombre, prompts visibles y ningún canal prometido antes de que exista.

## 8. Decisión pendiente

- Cerrar J06 de verdad: el panel de intención y plan con estilo, funcionando de punta a punta y verificado en producción; después, el cierre en el roadmap por un PR normal. Lo decide Lucas.

## 9. Neo (n8n)

- Registrado como pieza del equipo en [Rutas canónicas](04-RUTAS-CANONICAS.md#26-piezas-del-equipo-registradas-fuera-del-código), con estado no activado. La [decisión cerrada 56](01-DECISIONES-CERRADAS.md) sigue vigente y no se abre n8n.

## 10. Estructura de carpetas en el PC

Declarada por Lucas el 24-11 y comprobada en solo lectura el mismo día en `Desktop\Ecosistema`:

- `Archivo`
- `Centro de Mando`, con `backups` (rev49, rev50, rev51 y hito de madurez), `Oficina 3D`, `centro_mando_estado.json`, `LEEME.md` y `MOVIMIENTOS_20261123.md`.
- `Proyectos`:
  - `S.Maestro`, con `Backups` y `sistemamaestro` (este repositorio).
  - `SM_guias`, con `archive`, `diagnosticos`, `notas`, `scripts`, `usuarios` y `LEEME.md`; el archivo de usuarios es `usuarios\USUARIOS_SM_20261123.md`.
  - `SM_assets`, `SM_copias_de_trabajo` y `SM_archivo`.
  - `LEEME.md`.

Diferencia con lo declarado: no existe una carpeta `Sistema Maestro` de soporte. Las guías, los assets, las copias y el archivo están directamente en `Proyectos` como `SM_guias`, `SM_assets`, `SM_copias_de_trabajo` y `SM_archivo`.
