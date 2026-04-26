const builderVisualStates = {
  create: {
    website: {
      badge: 'Preview en vivo',
      title: 'Homepage estructurada y orientada a conversión',
      description:
        'El sistema ordena la promesa, los bloques clave y la continuidad comercial antes de entrar en ajustes finos.',
      cards: [
        { id: 'hero', label: 'Hero alineado', value: 'Promesa + CTA claro' },
        { id: 'structure', label: 'Estructura', value: 'Bloques priorizados' },
        { id: 'seo', label: 'SEO base', value: 'Semántica útil' },
      ],
    },
    tool: {
      badge: 'Vista operativa',
      title: 'Herramienta más clara y preparada para avanzar',
      description:
        'La construcción no se queda en una idea. Se convierte en flujo, módulos y continuidad funcional.',
      cards: [
        { id: 'panel', label: 'Panel principal', value: 'Estado y acciones' },
        { id: 'logic', label: 'Flujo', value: 'Análisis → decisión' },
        { id: 'system', label: 'Sistema', value: 'Base escalable' },
      ],
    },
    app: {
      badge: 'Producto en montaje',
      title: 'Aplicación con rutas, panel y lógica de continuidad',
      description:
        'La vista representa una app que ya piensa en acceso, dashboard, proyecto y despliegue.',
      cards: [
        { id: 'auth', label: 'Acceso', value: 'Entrada preparada' },
        { id: 'dashboard', label: 'Dashboard', value: 'Base operativa' },
        { id: 'release', label: 'Deploy', value: 'Listo para siguiente paso' },
      ],
    },
  },
  improve: {
    default: {
      badge: 'Ruta de mejora',
      title: 'Lectura visual de fricciones y prioridades',
      description:
        'El sistema detecta qué ajustar primero para mejorar estructura, posicionamiento y continuidad.',
      cards: [
        { id: 'clarity', label: 'Claridad', value: 'Mensaje reforzado' },
        { id: 'cta', label: 'Conversión', value: 'CTA reordenado' },
        { id: 'flow', label: 'Continuidad', value: 'Ruta más limpia' },
      ],
    },
  },
  scale: {
    default: {
      badge: 'Sistema escalable',
      title: 'Automatización y orden operativo',
      description:
        'La vista representa procesos más claros, menos fricción manual y una base mejor preparada para crecer.',
      cards: [
        { id: 'ops', label: 'Operativa', value: 'Menos trabajo repetido' },
        { id: 'route', label: 'Ruta', value: 'Más foco y prioridad' },
        { id: 'growth', label: 'Escala', value: 'Sistema más fuerte' },
      ],
    },
  },
};

export const getBuilderVisualState = (intent, type) => {
  if (intent === 'create') {
    return builderVisualStates.create[type] || builderVisualStates.create.website;
  }

  if (intent === 'improve') {
    return builderVisualStates.improve.default;
  }

  return builderVisualStates.scale.default;
};

export default builderVisualStates;