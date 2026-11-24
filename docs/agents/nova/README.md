# Nova: agente de voz de la demo de la portada

Nova es la agente de voz (voz de mujer) de la demo en vivo de la sección Agencia de IA de la portada (`frontend/src/features/home/sections/AgencySection.js`). Saluda, presenta Sistema Maestro y responde a las preguntas del visitante.

## Estado (24/11/2026)

- **Activa en producción desde #139** (merge `918a017`, 2026-11-24 01:44 Europe/Madrid). Railway tiene `VITE_ELEVENLABS_AGENT_ID` y el build de Vite la recibe por el `ARG`/`ENV` del `Dockerfile`.
- **Agente en ElevenLabs:** `agent_4201m85fg3z3eb281fjjx0vhhg0h` (id público, no es una clave), «Nova · Sistema Maestro (demo portada)», español. Se presenta siempre como Nova.
- **Voz provisional: Sarah** (`EXAVITQu4vr4xnSDxMaL`, modelo `eleven_flash_v2_5`). Cristina (andaluza, `2VUqK4PEdMj16L6xTN4J`) sigue pendiente por dos bloqueos: la clave de la API no tiene permiso de voces y la cuenta está en plan gratuito, que no permite voces de la Voice Library por API (hace falta Starter o superior).
- **Prueba en navegador (fake mic, sin pantalla):** la llamada conecta (token de ElevenLabs, sala WebRTC, «Nova te escucha») y se cierra a los pocos segundos con motivo `agent` (lo cierra el lado del agente). Falta la prueba de Lucas con micrófono real y, si se repite el corte, revisar el registro de la conversación en ElevenLabs.
- Sin `VITE_ELEVENLABS_AGENT_ID` ni `VITE_VOICE_AGENT_URL` la demo muestra el avatar y el saludo, pero ningún botón. El SDK de voz (`@elevenlabs/client`) solo se descarga cuando el visitante pulsa el botón.

## Diseño de la demo (24/11/2026)

Código en `frontend/src/features/home/voice/`: `NovaVoiceDemo.js` (componente), `novaDemo.css` (animaciones) y `novaVoiceConfig.mjs` (configuración y lógica pura, con tests en `novaVoiceConfig.test.mjs`).

- **Avatar animado:** cara de Nova dentro de un anillo con los cuatro colores de la portada (naranja `#F97316`, lima `#C6F432`, morado `#A78BFA`, azul cielo `#38BDF8`). En reposo flota, se inclina un poco, parpadea y mira a los lados. En llamada, el halo, la boca y el tamaño siguen el volumen real.
- **Onda de voz real:** 28 barras. En llamada, cada frame lee el espectro del SDK: el de salida cuando habla Nova y el del micrófono cuando escucha (`getOutputByteFrequencyData` / `getInputByteFrequencyData` y los volúmenes). En reposo, onda suave que respira; al conectar, barrido.
- **Estado pulsante:** pastilla con punto que late: «Disponible ahora», «Conectando», «Te escucha», «Hablando», «Sin conexión».
- **Botón grande:** «Habla con Nova» con icono de micrófono y degradado naranja → morado → azul cielo; en llamada pasa a «Colgar».
- **Saludo integrado:** bocadillo de Nova junto al avatar (el texto de abajo).
- **Fondo:** halos de luz que se desplazan despacio y seis motas de luz.
- **Corte temprano:** si la llamada se cierra antes de 3 s desde que conectó (o antes de conectar), aparece el aviso «La llamada se ha cortado nada más empezar. Revisa el micrófono y vuelve a intentarlo.» en vez de volver al inicio en silencio. El motivo se deja en la consola como `[Nova] la llamada se cortó al empezar`.
- **Responsive:** en móvil el avatar va arriba y el bocadillo debajo; desde 640 px, avatar a la izquierda y bocadillo a la derecha.
- **Movimiento reducido:** con `prefers-reduced-motion: reduce` se paran todas las animaciones y la onda queda fija.

## Base del agente

El documento de configuración de Nova es el *system prompt* y la base de conocimiento que hay que cargar en el proveedor de voz al activarla.

- El documento de configuración (`NOVA_CONFIGURACION_20261124.md`) es privado y vive solo en `SM_guias\notas` del PC de Lucas. Este repositorio es público y no contiene contenido de ventas.
- Al activar la voz, se carga directamente desde `SM_guias\notas` en el proveedor. Sus marcadores `[...]` necesitan datos reales de Lucas antes.

Saludo publicado en la portada (bocadillo de la demo):

> «Hola, soy Nova, de Sistema Maestro. Montamos tu web con inteligencia artificial y le conectamos un agente que atiende a tus clientes, para que tú te centres en tu negocio. ¿Qué te gustaría saber?»

## Lista de activación (ElevenLabs Agents)

Hecha el 24/11/2026 salvo la voz definitiva (punto 3) y la prueba con micrófono real (punto 9). Se conserva como referencia para rehacer el agente.

1. **Cuenta**: Lucas crea la cuenta en elevenlabs.io (plan Starter o superior para uso comercial).
2. **Agente**: en *Agents*, crear el agente «Nova» con idioma principal español.
3. **Voz**: elegir en la Voice Library una voz femenina de español de España (no clonar la voz de Lucas: es de hombre).
4. **Base de conocimiento**: cargar `NOVA_CONFIGURACION_20261124.md` desde `SM_guias\notas` (no desde este repo) como *system prompt* y/o *Knowledge base*, con el saludo de arriba como primer mensaje.
5. **Captura de mail**: en *Analysis → Data collection*, campo `email` (string). El webhook al backend queda para la versión completa.
6. **Seguridad**: en *Advanced*, autenticación desactivada (agente público); en *Security*, allowlist solo con `sistemamaestro.com` y `www.sistemamaestro.com`. Poner límite de llamadas/minutos si el plan lo permite.
7. **Id público**: copiar el *agent id* (`agent_…`). No es una clave; la clave de API de ElevenLabs no se usa en este flujo y nunca va al repo ni al frontend.
8. **Railway**: añadir `VITE_ELEVENLABS_AGENT_ID` con ese id en el servicio de producción y redesplegar. El `Dockerfile` ya declara `ARG`/`ENV` para que llegue al build de Vite.
9. **Verificar**: en la portada aparece «Habla con Nova»; al pulsarlo pide micrófono, conecta y Nova saluda con voz de mujer; «Colgar» termina la llamada.
