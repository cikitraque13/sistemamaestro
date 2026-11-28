# Publicación de una landing

La preview guardada se ve dentro del Builder. Publicarla sigue apagada por defecto.

`PUBLISH_LANDING_ENABLED` y `CUSTOM_DOMAIN_ENABLED` no están definidas, así que cuentan como apagadas. `BUILDER_PUBLISH_ENABLED` es el nombre anterior del mismo interruptor de publicación: si no está definido, tampoco enciende nada. Un administrador puede usar los pasos igual que entra al Builder con la puerta cerrada. El resto recibe 503 y no ve los pasos.

## Qué hace el código, sin tocar DNS ni Railway

1. El dueño elige un nombre (`nombre`) y publica la última versión guardada en `builder_landing_states`. Se guarda una copia inmutable en `builder_publications`. Volver a publicar añade otra copia y no modifica la anterior. Despublicar deja de servirla y el nombre sigue reservado para ese proyecto.
2. Si llega una petición cuyo `Host` es `{nombre}.{PUBLISH_BASE_DOMAIN}`, el backend responde con ese HTML y una CSP estricta, la misma base que la preview y sin scripts. Un subdominio desconocido o despublicado responde 404 en español. El dominio base sale de la configuración. Si no está, no se inventa `sistemamaestro.com`.
3. `www`, `api`, `app`, `admin`, `dashboard`, `mail` y el resto de nombres reservados siguen sirviendo la aplicación. Un host que no es del dominio base solo se busca como dominio de cliente si `CUSTOM_DOMAIN_ENABLED` o `PUBLISH_RESOLVE_CUSTOM_HOSTS` está encendido. Así el hostname actual de Railway no cambia de comportamiento.
4. El dominio propio es un paso opcional, después de publicar. El cliente escribe su dominio, ve el TXT de verificación y los destinos CNAME (www o el subdominio) y ALIAS o A (raíz) que haya en `PUBLISH_CNAME_TARGET` y `PUBLISH_APEX_TARGET`. Si esos valores no están, la pantalla lo dice y no rellena un hostname. Verificar consulta el DNS con dnspython y, si el TXT coincide, marca el dominio como verificado. El certificado lo emite el borde (dominios personalizados de Railway). Este código no llama a la API de Railway: el adaptador responde «Pendiente de activación por Sistema Maestro».

No se descuentan gemas. El cargo queda pendiente de una decisión aparte.

## Lo que este cambio no hace

No escribe en Railway ni en el DNS. No crea el dominio comodín. No emite certificados.

Ninguna de estas acciones se hace en este cambio:

- Crear o editar un dominio personalizado en Railway sobre el servicio `sistemamaestro` del proyecto `965acd6d-6eb2-4c02-9f6b-70ddc29f342e`.
- Añadir en el DNS del dominio (CNAME o ALIAS hacia Railway, y el registro que Railway pida para el certificado), incluido el comodín `*.sistemamaestro.com`.
- Poner `PUBLISH_LANDING_ENABLED=true`, `CUSTOM_DOMAIN_ENABLED=true` o `BUILDER_PUBLISH_ENABLED=true` en las variables de Railway.
- Emitir o renovar el certificado del dominio nuevo desde Railway.

Hasta ese OK, la landing publicada solo se sirve si el `Host` ya llega a este proceso. El alta en el borde sigue pendiente.

## Variables

| Variable | Por defecto | Uso |
| --- | --- | --- |
| `PUBLISH_LANDING_ENABLED` | apagada | Abre publicar, volver a publicar y despublicar. |
| `BUILDER_PUBLISH_ENABLED` | apagada | Mismo interruptor, nombre anterior. |
| `CUSTOM_DOMAIN_ENABLED` | apagada | Abre el dominio propio y la búsqueda de ese `Host`. |
| `PUBLISH_RESOLVE_CUSTOM_HOSTS` | apagada | Busca dominios de cliente aunque el paso siga cerrado. |
| `PUBLISH_BASE_DOMAIN` | vacío | Zona de los subdominios. Sin valor no hay URL pública. |
| `PUBLISH_CNAME_TARGET` | vacío | Destino que se muestra para el CNAME. |
| `PUBLISH_APEX_TARGET` | vacío | Destino que se muestra para el ALIAS o el A. |
| `PUBLISH_APP_HOSTS` | vacío | Hosts extra que siempre sirven la aplicación, además de localhost. |
