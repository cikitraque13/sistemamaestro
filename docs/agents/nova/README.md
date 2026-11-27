# Nova: demo de la portada

Nova es la asistente de la sección Agencia de IA (`frontend/src/features/home/sections/AgencySection.js`). Saluda, presenta Sistema Maestro y responde dudas. Se presenta siempre como Nova. Habla español de España (es-ES), con acento neutro: no usa acento andaluz ni malagueño. La voz integrada sigue siendo `ara` (`NOVA_GROK_VOICE`). El texto de comportamiento está en `NOVA_CONFIGURACION_20261124.md` y en las instrucciones del servidor.

## Voz (27/11/2026)

1. **Grok Voice** (xAI, tiempo real) si `GROK_API_KEY` está en el servidor y `NOVA_VOICE_PROVIDER` no la apaga. El navegador no ve la clave: `POST /api/public/nova-voice/session` pide un token efímero a `POST https://api.x.ai/v1/realtime/client_secrets` (`expires_after.seconds` = 60, sin campo `session`) y el cliente abre `wss://api.x.ai/v1/realtime?model=grok-voice-latest`. Voz integrada `ara`. El saludo y las instrucciones van en `session.update`.
2. **Voz del navegador** (`frontend/src/hooks/useVoice.js`, Web Speech API, `es-ES`) si Grok no está, falla, o `NOVA_VOICE_PROVIDER` es `browser` u `off`. Lee el saludo y escucha una frase.
3. **Texto.** Si tampoco hay voz en el navegador, o `NOVA_VOICE_PROVIDER=text`, se queda el avatar y el saludo escrito. La página no debe romperse.

`GET /api/public/nova-voice` dice el modo (`grok`, `browser` o `text`) sin secretos.

## Saludo

> Hola, soy Nova, asistente de inteligencia artificial de Sistema Maestro. Estoy aquí para explicarte el producto con claridad y resolver tus dudas. ¿Me cuentas en una frase qué negocio tienes y qué te trae por aquí?

## Código

- `frontend/src/features/home/voice/NovaVoiceDemo.js`
- `frontend/src/features/home/voice/novaVoiceConfig.mjs`
- `backend/app/services/nova_voice.py`
- `backend/app/routers/nova_voice.py`
