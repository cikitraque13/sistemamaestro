# Nova: agente de voz de la demo de la portada

Nova es la agente de voz (voz de mujer) del bloque «Demo con Nova» de la sección Agencia de IA de la portada (`frontend/src/features/home/sections/AgencySection.js`). Saluda, presenta Sistema Maestro y responde a las preguntas del visitante.

**Estado (24/11/2026): sin activar.** El código ya está preparado para ElevenLabs Agents (`frontend/src/features/home/voice/`): el botón «Habla con Nova» solo aparece si el build recibe `VITE_ELEVENLABS_AGENT_ID` (id público `agent_…`) o, como alternativa, `VITE_VOICE_AGENT_URL` (enlace https). Sin ninguna de las dos no se muestra ningún botón. El SDK de voz (`@elevenlabs/client`) solo se descarga cuando el visitante pulsa el botón.

## Base del agente

El documento de configuración de Nova es el *system prompt* y la base de conocimiento que hay que cargar en el proveedor de voz al activarla: técnicas de venta, psicología, manejo de objeciones, espejo y etiqueta, micro-compromisos, lectura de silencios, capa emocional, flujo de captura de mail y llamadas cortas.

- Origen: `SM_guias` en el PC de Lucas (`Desktop\Ecosistema\Proyectos\SM_guias\notas\NOVA_CONFIGURACION_20261124.md`). Esa es la versión maestra; si cambia, se vuelve a copiar aquí.
- Copia en este repo: [`NOVA_CONFIGURACION_20261124.md`](./NOVA_CONFIGURACION_20261124.md). Sus marcadores `[...]` necesitan datos reales de Lucas antes de activar la voz.

Saludo publicado en la portada:

> «Hola, soy Nova, de Sistema Maestro. Montamos tu web con inteligencia artificial y le conectamos un agente que atiende a tus clientes, para que tú te centres en tu negocio. ¿Qué te gustaría saber?»

## Lista de activación (ElevenLabs Agents)

1. **Cuenta**: Lucas crea la cuenta en elevenlabs.io (plan Starter o superior para uso comercial).
2. **Agente**: en *Agents*, crear el agente «Nova» con idioma principal español.
3. **Voz**: elegir en la Voice Library una voz femenina de español de España (no clonar la voz de Lucas: es de hombre).
4. **Base de conocimiento**: pegar `NOVA_CONFIGURACION_20261124.md` como *system prompt* (y/o subirlo a *Knowledge base*) y poner como primer mensaje el saludo de arriba.
5. **Captura de mail**: en *Analysis → Data collection*, campo `email` (string). El webhook al backend queda para la versión completa.
6. **Seguridad**: en *Advanced*, autenticación desactivada (agente público); en *Security*, allowlist solo con `sistemamaestro.com` y `www.sistemamaestro.com`. Poner límite de llamadas/minutos si el plan lo permite.
7. **Id público**: copiar el *agent id* (`agent_…`). No es una clave; la clave de API de ElevenLabs no se usa en este flujo y nunca va al repo ni al frontend.
8. **Railway**: añadir `VITE_ELEVENLABS_AGENT_ID` con ese id en el servicio de producción y redesplegar. El `Dockerfile` ya declara `ARG`/`ENV` para que llegue al build de Vite.
9. **Verificar**: en la portada aparece «Habla con Nova»; al pulsarlo pide micrófono, conecta y Nova saluda con voz de mujer; «Colgar» termina la llamada.
