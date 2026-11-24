# Nova: agente de voz de la demo de la portada

Nova es la agente de voz (voz de mujer) del bloque «Demo con Nova» de la sección Agencia de IA de la portada (`frontend/src/features/home/sections/AgencySection.js`). Saluda, presenta Sistema Maestro y responde a las preguntas del visitante.

**Estado (24/11/2026): sin activar.** No hay proveedor de voz ni integración en el código. El botón «Habla con Nova» solo aparece si el build recibe `VITE_VOICE_AGENT_URL` (https), así que hoy no se muestra ningún botón.

## Base del agente

El documento de configuración de Nova es el *system prompt* y la base de conocimiento que hay que cargar en el proveedor de voz al activarla: técnicas de venta, psicología, manejo de objeciones, espejo y etiqueta, micro-compromisos, lectura de silencios, capa emocional, flujo de captura de mail y llamadas cortas.

- El documento de configuración (`NOVA_CONFIGURACION_20261124.md`) es privado y vive solo en `SM_guias\notas` del PC de Lucas. Este repositorio es público y no contiene contenido de ventas.
- Al activar la voz, se carga directamente desde `SM_guias\notas` en el proveedor. Sus marcadores `[...]` necesitan datos reales de Lucas antes.

Saludo publicado en la portada:

> «Hola, soy Nova, de Sistema Maestro. Montamos tu web con inteligencia artificial y le conectamos un agente que atiende a tus clientes, para que tú te centres en tu negocio. ¿Qué te gustaría saber?»

## Lista de activación

1. **Proveedor**: elegir la plataforma de agente conversacional de voz (por ejemplo ElevenLabs Conversational AI, Vapi o Retell) y crear la cuenta. Lo hace Lucas.
2. **Voz**: elegir o crear en el proveedor una voz femenina para Nova.
3. **Base de conocimiento**: cargar `NOVA_CONFIGURACION_20261124.md` (desde `SM_guias\notas`) como *system prompt* y base de conocimiento, con el saludo de arriba como primer mensaje. Configurar la captura de mail según el documento.
4. **URL pública**: obtener del proveedor el enlace https de la conversación con Nova.
5. **Railway**: añadir `VITE_VOICE_AGENT_URL` con ese enlace en el servicio de producción. La clave del proveedor la añade Lucas directamente en el proveedor o en Railway; nunca va al repo.
6. **Dockerfile**: añadir `ARG VITE_VOICE_AGENT_URL` (y `ENV VITE_VOICE_AGENT_URL=$VITE_VOICE_AGENT_URL`) en la etapa `frontend-build`, antes de `RUN npm run build`. Sin esto la variable de Railway no llega al build de Vite.
7. **Verificar**: desplegar y comprobar que aparece «Habla con Nova», que abre la conversación en otra pestaña y que pide permiso de micrófono.
