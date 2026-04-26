# 02-PENDIENTES-PRIORIZADOS

## Estado del documento

- Estado: activo
- Tipo: backlog priorizado canónico
- Alcance: proyecto completo `Sistema Maestro`
- Objetivo: ordenar el trabajo pendiente por prioridad real, dependencia y criterio de cierre, sin mezclar estructura, higiene, producto y despliegue.

---

## 1. Función de este documento

Este documento existe para responder con claridad a una sola pregunta:

**¿Qué hay que hacer ahora, en qué orden y con qué dependencia?**

No fija rutas canónicas.
No sustituye decisiones cerradas.
No actúa como inventario técnico.
No reemplaza procedimientos operativos.
No registra incidencias.

Su función es ordenar la ejecución a partir del estado real ya cerrado del proyecto.

---

## 2. Regla de priorización

Toda acción pendiente debe clasificarse como una de estas tres:

1. **crítica estructural**
2. **optimización estratégica**
3. **ajuste cosmético**

### Regla operativa

Solo procede actuar si la acción es:

- crítica estructural;
- u optimización estratégica.

Los ajustes cosméticos no deben abrir frente mientras el sistema siga en afinado técnico.

---

## 3. Estado operativo actual

La situación actual del proyecto queda resumida así:

- la base documental canónica ya está operativa;
- `docs/control/` funciona como memoria estructural real;
- `frontend/src/features/` queda reconocido como capa principal del frontend;
- `builder`, `home` y `app-shell` forman parte del núcleo real del producto;
- `frontend/src/features/builder/` queda reconocido como ruta funcional canónica del Builder;
- `frontend/src/features/builder/state/` queda definido como subcapa canónica interna prevista para la construcción viva del Builder;
- `backend/app/` queda reconocido como arquitectura modular interna del backend;
- `backend/app/main.py` y `backend.app.main:app` quedan fijados como entrada canónica del backend;
- el legacy runtime ya fue retirado del repo activo;
- la higiene del root de `frontend/` ya quedó cerrada;
- el safety externo ya quedó archivado fuera del escritorio;
- `backend/config/credits/` actúa como capa viva del sistema;
- `backend/app/ai/` está clasificada como capa puente/preparada, no como runtime IA vivo de extremo a extremo;
- `tests/` sigue como auxiliar válida;
- deploy final sigue bloqueado.

### Lectura operativa

El frente principal ya no es retocar Builder visualmente.

El frente principal es crear la piedra angular que permita que Builder deje de simular construcción y empiece a producir salida real alineada:

```text
input usuario
→ interpretación IA
→ mutación normalizada
→ BuilderBuildState
→ preview
→ código
→ estructura
→ siguientes decisiones