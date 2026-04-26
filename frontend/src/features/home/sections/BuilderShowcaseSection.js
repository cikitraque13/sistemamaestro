import React, { useMemo, useState } from 'react';
import BuilderIntentTabs from '../components/BuilderIntentTabs';
import BuilderTypeTabs from '../components/BuilderTypeTabs';
import HomeEntryPanel from '../components/HomeEntryPanel';
import HomeFlowPreview from '../components/HomeFlowPreview';
import HomeOutputsPreview from '../components/HomeOutputsPreview';
import HomeCapabilityChips from '../components/HomeCapabilityChips';
import builderIntents from '../data/builderIntents';
import builderTypes from '../data/builderTypes';
import builderStages from '../data/builderStages';
import builderOutputs from '../data/builderOutputs';

const BuilderShowcaseSection = () => {
  const [activeIntent, setActiveIntent] = useState('create');
  const [activeType, setActiveType] = useState('website');

  const activeIntentData = useMemo(
    () => builderIntents.find((item) => item.id === activeIntent) || builderIntents[0],
    [activeIntent]
  );

  return (
    <section id="constructor-maestro" className="px-6 py-16 md:px-10 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-4xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-400">
            Entrada guiada
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
            Empieza por una lectura clara del proyecto.
          </h2>
          <p className="mt-5 text-base leading-7 text-zinc-300 md:text-lg">
            Desde una idea o una web existente, Sistema Maestro interpreta la necesidad, detecta prioridades y te orienta hacia la mejor ruta para construir, mejorar o escalar.
          </p>
          <p className="mt-4 text-sm leading-6 text-zinc-400">
            La Home activa la entrada. El trabajo profundo continúa dentro del sistema.
          </p>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <HomeEntryPanel
            activeIntent={activeIntent}
            activeType={activeType}
            onIntentChange={setActiveIntent}
            onTypeChange={setActiveType}
            intentItems={builderIntents}
            typeItems={builderTypes}
            IntentTabs={BuilderIntentTabs}
            TypeTabs={BuilderTypeTabs}
          />

          <div className="space-y-6">
            <HomeFlowPreview items={builderStages} />
            <HomeOutputsPreview items={builderOutputs} />
          </div>
        </div>

        <div className="mt-8">
          <HomeCapabilityChips />
        </div>

        <div className="mt-6 max-w-3xl">
          <p className="text-sm leading-6 text-zinc-400">
            Entrada activa:{' '}
            <span className="font-semibold text-zinc-200">{activeIntentData.label}</span>
            {activeIntent === 'create' && (
              <>
                {' '}·{' '}
                <span className="font-semibold text-zinc-200">
                  {builderTypes.find((item) => item.id === activeType)?.label}
                </span>
              </>
            )}
          </p>
        </div>
      </div>
    </section>
  );
};

export default BuilderShowcaseSection;