import React from 'react';

import {
  getDiagnosis,
  getCoreDiagnosis,
} from '../utils/builderLandingCopy';

const buildExtractionItems = ({ copy, project }) => {
  const diagnosis = getDiagnosis(project);
  const core = getCoreDiagnosis(project);
  const isTransform = copy.mode === 'transform';

  if (isTransform) {
    return [
      {
        label: 'Entrada',
        value: copy.originalLabel || 'web actual',
      },
      {
        label: 'Objetivo probable',
        value:
          diagnosis?.summary ||
          'Mejorar claridad, confianza y conversión de la web existente.',
      },
      {
        label: 'Fricción detectada',
        value:
          core?.main_finding ||
          'La página necesita reforzar promesa, jerarquía visual y CTA principal.',
      },
      {
        label: 'Palanca principal',
        value:
          core?.main_leverage ||
          'Rediseñar hero, CTA y bloques de confianza antes de preparar salida.',
      },
    ];
  }

  return [
    {
      label: 'Entrada',
      value: project?.input_content || 'Idea recibida',
    },
    {
      label: 'Tipo de proyecto',
      value: copy.eyebrow || 'Proyecto digital',
    },
    {
      label: 'Objetivo de conversión',
      value:
        core?.main_finding ||
        'Convertir intención en una primera estructura clara y accionable.',
    },
    {
      label: 'Palanca principal',
      value:
        core?.main_leverage ||
        'Ordenar promesa, CTA, bloques de valor y siguiente paso.',
    },
  ];
};

export default function BuilderExtractionPanel({
  copy,
  project,
  progress = 100,
}) {
  const extractedItems = buildExtractionItems({
    copy,
    project,
  });

  return (
    <div className="h-full overflow-y-auto p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
        Extracción
      </p>

      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-white">
        Lo que el sistema ha entendido
      </h2>

      <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400">
        Esta capa no es informe. Es la lectura operativa que alimenta el Builder, el código y el preview.
      </p>

      <div className="mt-5 grid gap-4">
        {extractedItems.map((item, index) => (
          <div
            key={item.label}
            className={`rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 transition-all duration-700 ${
              progress >= 12 + index * 14
                ? 'translate-y-0 opacity-100'
                : 'translate-y-3 opacity-25'
            }`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              {item.label}
            </p>

            <p className="mt-3 text-sm leading-7 text-zinc-200">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}