import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { parseAtomicBuilderCommand, BUILDER_COMMAND_V2_ENABLED } from '../src/features/builder/command/parseAtomicBuilderCommand.mjs';
import {
  applyAtomicBuilderCommandToState,
  isAtomicBuilderCommandAllowed,
  verifyAtomicBuilderCommandDelta,
  BUILDER_COMMAND_V2_ALLOWED_PROJECT_ID,
} from '../src/features/builder/command/applyAtomicBuilderCommand.mjs';

const input = 'Cambiar CTA principal a "Reservar consulta" y acento naranja';
const command = parseAtomicBuilderCommand(input, { now: 1 });
assert.equal(command.type, 'builder.command.v2.atomic_mutation');
assert.equal(command.mutation.type, 'update_cta');
assert.equal(command.mutation.target, 'hero.primaryCTA');
assert.equal(command.mutation.label, 'Reservar consulta');
assert.equal(command.visual.accent, 'orange');
assert.equal(BUILDER_COMMAND_V2_ENABLED, false);
assert.equal(BUILDER_COMMAND_V2_ALLOWED_PROJECT_ID, 'proj_b55e1dff05a7');

assert.equal(isAtomicBuilderCommandAllowed({ command, projectId: BUILDER_COMMAND_V2_ALLOWED_PROJECT_ID, input, enabled: false }), false);
assert.equal(isAtomicBuilderCommandAllowed({ command, projectId: 'wrong_project', input, enabled: true }), false);
assert.equal(isAtomicBuilderCommandAllowed({ command, projectId: BUILDER_COMMAND_V2_ALLOWED_PROJECT_ID, input: 'Cambiar cualquier cosa', enabled: true }), false);
assert.equal(isAtomicBuilderCommandAllowed({ command, projectId: BUILDER_COMMAND_V2_ALLOWED_PROJECT_ID, input, enabled: true }), true);

const state = applyAtomicBuilderCommandToState(command, { projectId: BUILDER_COMMAND_V2_ALLOWED_PROJECT_ID });
assert.equal(state.primaryCTA, 'Reservar consulta');
assert.equal(state.visualAccent, 'orange');
assert.equal(state.templateId, 'opp_001');
assert.equal(state.revision, 1);
assert.equal(state.lastCommandId, 'cmd_1');
assert.equal(state.traceId, 'trace_1');
assert.equal(state.creditPolicy.mode, 'local_no_charge_until_delta_verified');

const tmp = await mkdtemp(path.join(tmpdir(), 'builder-v2-smoke-'));
try {
  const templatesSource = await readFile('src/features/builder/utils/builderCodeTemplates.js', 'utf8');
  const templatesPath = path.join(tmp, 'builderCodeTemplates.mjs');
  await writeFile(templatesPath, templatesSource);
  const templates = await import(pathToFileURL(templatesPath));
  const codeLines = templates.getBuilderCodeLines({
    tab: 'json',
    copy: { primaryCTA: state.primaryCTA, primaryCta: state.primaryCTA, visualAccent: state.visualAccent },
    project: { id: 'opp_001' },
    visualState: { visualAccent: state.visualAccent, ctaState: { visualAccent: state.visualAccent, primaryCta: state.primaryCTA } },
  });
  const codeText = codeLines.join('\n');
  assert.match(codeText, /Reservar consulta/);
  assert.match(codeText, /orange/);

  const outputMapSource = (await readFile('src/features/builder/state/builderOutputMap.js', 'utf8'))
    .replace("from './builderBuildState';", "from './builderBuildState.mjs';")
    .replace("from \"./builderBuildState\";", "from './builderBuildState.mjs';");
  const buildStateSource = await readFile('src/features/builder/state/builderBuildState.js', 'utf8');
  await writeFile(path.join(tmp, 'builderBuildState.mjs'), buildStateSource);
  const outputMapPath = path.join(tmp, 'builderOutputMap.mjs');
  await writeFile(outputMapPath, outputMapSource);
  const outputMapModule = await import(pathToFileURL(outputMapPath));
  const output = outputMapModule.createBuilderOutputMap(state);
  assert.equal(output.preview.primaryCTA, 'Reservar consulta');
  assert.equal(output.preview.visualAccent, 'orange');
  assert.equal(output.structure.primaryCTA, 'Reservar consulta');
  assert.equal(output.structure.visualAccent, 'orange');
  assert.equal(output.structure.templateId, 'opp_001');
  assert.equal(output.structure.revision, 1);
  assert.equal(verifyAtomicBuilderCommandDelta({ command, output, codeLines }), true);
  assert.equal(verifyAtomicBuilderCommandDelta({ command, output: { preview: {} }, codeLines }), false);

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
      builderKernelOutput: output,
    },
  });
  assert.equal(model.primaryCTA, 'Reservar consulta');
  assert.equal(model.visualAccent, 'orange');

  const parserSource = await readFile('src/features/builder/command/parseAtomicBuilderCommand.mjs', 'utf8');
  const applySource = await readFile('src/features/builder/command/applyAtomicBuilderCommand.mjs', 'utf8');
  assert.doesNotMatch(parserSource, /fetch\s*\(/);
  assert.doesNotMatch(parserSource, /buildWithBuilderAI/);
  assert.doesNotMatch(applySource, /fetch\s*\(/);
  assert.doesNotMatch(applySource, /buildWithBuilderAI/);

  const runtimeSource = await readFile('src/features/builder/workspace/hooks/useBuilderWorkspaceRuntime.js', 'utf8');
  assert.match(runtimeSource, /BUILDER_COMMAND_V2_ENABLED\s*\?\s*parseAtomicBuilderCommand/);
  const flagOffIndex = runtimeSource.indexOf('const candidateAtomicCommand = BUILDER_COMMAND_V2_ENABLED');
  const builderAiIndex = runtimeSource.indexOf('builderAiResult = await buildWithBuilderAI');
  assert.ok(flagOffIndex > -1);
  assert.ok(builderAiIndex > flagOffIndex);
  const flagOffBlock = runtimeSource.slice(flagOffIndex, builderAiIndex);
  assert.match(flagOffBlock, /:\s*null/);
  assert.doesNotMatch(flagOffBlock, /applyKernelResult/);
  assert.doesNotMatch(flagOffBlock, /setManualMessages/);
  assert.match(runtimeSource, /if \(!atomicCommand\)/);
  assert.match(runtimeSource, /buildAtomicCommandKernelResult/);

  const changedSources = [templatesSource, resolverSource, parserSource, applySource].join('\n');
  assert.doesNotMatch(changedSources, /\bvisualState\b(?!\s*[=,}:.)?])/);
} finally {
  await rm(tmp, { recursive: true, force: true });
}

console.log('command-contract-v2-smoke=ok');
