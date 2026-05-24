import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { parseAtomicBuilderCommand, BUILDER_COMMAND_V2_ENABLED } from '../src/features/builder/command/parseAtomicBuilderCommand.mjs';

const input = 'Cambiar CTA principal a "Reservar consulta" y acento naranja';
const command = parseAtomicBuilderCommand(input, { now: 1 });
assert.equal(command.type, 'builder.command.v2.atomic_mutation');
assert.equal(command.mutation.type, 'update_cta');
assert.equal(command.mutation.target, 'hero.primaryCTA');
assert.equal(command.mutation.label, 'Reservar consulta');
assert.equal(command.visual.accent, 'orange');
assert.equal(BUILDER_COMMAND_V2_ENABLED, false);

const tmp = await mkdtemp(path.join(tmpdir(), 'builder-v2-smoke-'));
try {
  const templatesSource = await readFile('src/features/builder/utils/builderCodeTemplates.js', 'utf8');
  const templatesPath = path.join(tmp, 'builderCodeTemplates.mjs');
  await writeFile(templatesPath, templatesSource);
  const templates = await import(pathToFileURL(templatesPath));
  const codeLines = templates.getBuilderCodeLines({
    tab: 'json',
    copy: { primaryCTA: 'Reservar consulta', primaryCta: 'Reservar consulta' },
    project: { id: 'opp_001' },
    visualState: { visualAccent: 'orange', ctaState: { visualAccent: 'orange', primaryCta: 'Reservar consulta' } },
  });
  const codeText = codeLines.join('\n');
  assert.match(codeText, /Reservar consulta/);
  assert.match(codeText, /orange/);

  const profilesSource = await readFile('src/features/builder/preview/builderSectorProfiles.js', 'utf8');
  await writeFile(path.join(tmp, 'builderSectorProfiles.mjs'), profilesSource);
  const resolverSource = (await readFile('src/features/builder/preview/builderSectorProfileResolver.js', 'utf8'))
    .replace("from './builderSectorProfiles';", "from './builderSectorProfiles.mjs';");
  const resolverPath = path.join(tmp, 'builderSectorProfileResolver.mjs');
  await writeFile(resolverPath, resolverSource);
  const resolver = await import(pathToFileURL(resolverPath));
  const model = resolver.buildSectorLandingModel({
    project: { input_content: 'servicios profesionales consultoría' },
    builderIntelligence: {
      builderKernelOutput: {
        preview: {
          primaryCTA: 'Reservar consulta',
          visualAccent: 'orange',
        },
      },
    },
  });
  assert.equal(model.primaryCTA, 'Reservar consulta');
  assert.equal(model.visualAccent, 'orange');

  const parserSource = await readFile('src/features/builder/command/parseAtomicBuilderCommand.mjs', 'utf8');
  assert.doesNotMatch(parserSource, /fetch\s*\(/);
  assert.doesNotMatch(parserSource, /buildWithBuilderAI/);

  const runtimeSource = await readFile('src/features/builder/workspace/hooks/useBuilderWorkspaceRuntime.js', 'utf8');
  assert.match(runtimeSource, /BUILDER_COMMAND_V2_ENABLED\s*\?\s*parseAtomicBuilderCommand/);
  assert.match(runtimeSource, /:\s*null/);

  const flagOffIndex = runtimeSource.indexOf('const atomicCommand = BUILDER_COMMAND_V2_ENABLED');
  const builderAiIndex = runtimeSource.indexOf('builderAiResult = await buildWithBuilderAI');
  assert.ok(flagOffIndex > -1);
  assert.ok(builderAiIndex > flagOffIndex);

  const flagOffBlock = runtimeSource.slice(flagOffIndex, builderAiIndex);
  assert.match(flagOffBlock, /BUILDER_COMMAND_V2_ENABLED/);
  assert.match(flagOffBlock, /parseAtomicBuilderCommand/);
  assert.match(flagOffBlock, /:\s*null/);
  assert.doesNotMatch(flagOffBlock, /applyKernelResult/);
  assert.doesNotMatch(flagOffBlock, /setManualMessages/);

  const simulatedFlagOnBlock = runtimeSource.slice(flagOffIndex, builderAiIndex + 80);
  assert.match(simulatedFlagOnBlock, /if \(atomicCommand\)/);
  assert.match(simulatedFlagOnBlock, /throw new Error\('Command Contract V2 no activo para aplicación real\.'\)/);


  const changedSources = [templatesSource, resolverSource, parserSource].join('\n');
  assert.doesNotMatch(changedSources, /\bvisualState\b(?!\s*[=,}:.)?])/);
} finally {
  await rm(tmp, { recursive: true, force: true });
}

console.log('command-contract-v2-smoke=ok');
