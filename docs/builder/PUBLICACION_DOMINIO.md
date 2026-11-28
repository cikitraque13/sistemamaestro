# Publicación de una landing

La preview guardada se ve dentro del Builder. Publicarla en un dominio propio está apagada: `BUILDER_PUBLISH_ENABLED` no está definido y el botón Publicar no se muestra. `POST /api/builder/publish/{project_id}` responde que la publicación no está disponible y no escribe en Railway ni en DNS.

## Propuesta

1. Servir la landing ya guardada en una ruta pública del mismo servicio, por ejemplo `https://sistemamaestro.com/p/{project_id}`, leyendo `builder_landing_states` y devolviendo el HTML de la última versión. Sin dominio nuevo.
2. Después, un subdominio del producto (`{proyecto}.sistemamaestro.com`) con un dominio comodín.
3. Al final, el dominio del cliente, con un registro DNS que apunte al servicio.

## Lo que necesitaría el OK de Lucas

Ninguna de estas escrituras se hace en este cambio:

- Crear o editar un dominio personalizado en Railway sobre el servicio `sistemamaestro` del proyecto `965acd6d-6eb2-4c02-9f6b-70ddc29f342e`.
- Añadir en el DNS del dominio (CNAME o ALIAS hacia Railway, y el registro que Railway pida para el certificado).
- Poner `BUILDER_PUBLISH_ENABLED=true` en las variables de Railway.
- Emitir o renovar el certificado del dominio nuevo desde Railway.

Hasta ese OK, la landing solo existe como preview del dueño.
