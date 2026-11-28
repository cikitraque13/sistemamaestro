import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';

import { CUSTOM_DOMAIN_ENABLED, PUBLISH_LANDING_ENABLED } from '../api/builderPreviewClient';
import BuilderPublishSteps from './BuilderPublishSteps';
import { publishStepsVisible, targetOrPending, validateSlug } from './builderPublish';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function render(props) {
  const node = document.createElement('div');
  const root = createRoot(node);
  act(() => root.render(<BuilderPublishSteps hasPreview publishLanding customDomain {...props} />));
  return { node, root };
}

test('publish flags stay dark in the client bundle', () => {
  expect(PUBLISH_LANDING_ENABLED).toBe(false);
  expect(CUSTOM_DOMAIN_ENABLED).toBe(false);
  expect(publishStepsVisible()).toBe(false);
  expect(publishStepsVisible({ publishLanding: true, hasPreview: false })).toBe(false);
});

test('slug validation rejects reserved names and short or broken labels', () => {
  expect(validateSlug('mi-landing')).toEqual({ ok: true, slug: 'mi-landing', code: '', message: '' });
  expect(validateSlug(' Clara ').slug).toBe('clara');
  for (const name of ['www', 'api', 'app', 'admin', 'dashboard', 'mail']) {
    expect(validateSlug(name).code).toBe('reserved');
  }
  expect(validateSlug('ab').ok).toBe(false);
  expect(validateSlug('-abc').ok).toBe(false);
  expect(validateSlug('a--b').ok).toBe(false);
});

test('an empty target is shown as pending instead of a guessed host', () => {
  expect(targetOrPending('').pending).toBe(true);
  expect(targetOrPending('').value).toContain('No mostramos un destino inventado');
  expect(targetOrPending('edge.example.net').value).toBe('edge.example.net');
});

test('publish comes after the preview gate and dominio propio comes after publish', () => {
  const onPublish = vi.fn();
  const { node, root } = render({
    slug: 'www',
    publication: {
      status: 'none',
      baseDomain: 'sistemamaestro.com',
      cnameTarget: '',
      apexTarget: '',
      ssl: 'El certificado lo emite el borde de hosting (dominios personalizados de Railway). Esta pantalla no da de alta el dominio.',
    },
    onPublish,
  });
  const text = node.textContent;
  expect(text.indexOf('Publicar')).toBeGreaterThan(-1);
  expect(text.indexOf('Dominio propio')).toBeGreaterThan(text.indexOf('Publicar'));
  expect(text).toContain('Ese nombre está reservado.');
  expect(text).toContain('Pendiente de activación por Sistema Maestro');
  expect(text).toContain('no descuenta gemas');
  expect(text).toContain('No mostramos un destino inventado');
  expect(text).not.toContain('up.railway.app');
  const publish = [...node.querySelectorAll('button')].find((button) => button.textContent === 'Publicar');
  expect(publish.disabled).toBe(true);
  act(() => publish.click());
  expect(onPublish).not.toHaveBeenCalled();
  act(() => root.unmount());
});

test('a valid slug publishes in one click and DNS values come from the payload', () => {
  const onPublish = vi.fn();
  const onVerify = vi.fn();
  const { node, root } = render({
    slug: 'Clara',
    domain: 'cliente.com',
    onPublish,
    onVerifyDomain: onVerify,
    publication: {
      status: 'published',
      slug: 'clara',
      url: 'https://clara.sistemamaestro.com',
      baseDomain: 'sistemamaestro.com',
      cnameTarget: 'edge.example.net',
      apexTarget: '203.0.113.10',
      message: 'Publicada la versión 1. Es una copia fija.',
      customDomain: {
        host: 'cliente.com',
        status: 'pending',
        activationLabel: 'Pendiente de activación por Sistema Maestro',
        instructions: {
          txt: { host: '_sistemamaestro-verify.cliente.com', value: 'sm-verify=abc' },
          cname: { type: 'CNAME', host: 'www.cliente.com', value: 'edge.example.net', configured: true },
          apex: { type: 'ALIAS', host: 'cliente.com', value: '203.0.113.10', configured: true, applies: true },
          ssl: 'El certificado lo emite el borde de hosting (dominios personalizados de Railway). Esta acción no lo solicita.',
          activation: 'Pendiente de activación por Sistema Maestro',
        },
      },
    },
  });
  const publishSection = node.querySelector('[aria-label="Publicar"]');
  const domainSection = node.querySelector('[aria-label="Dominio propio"]');
  expect(publishSection.compareDocumentPosition(domainSection) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(node.textContent).toContain('https://clara.sistemamaestro.com');
  expect(node.textContent).toContain('_sistemamaestro-verify.cliente.com');
  expect(node.textContent).toContain('edge.example.net');
  expect(node.textContent).toContain('203.0.113.10');
  expect(node.textContent).toContain('sm-verify=abc');
  expect(node.textContent).not.toContain('up.railway.app');
  act(() => {
    [...node.querySelectorAll('button')].find((button) => button.textContent === 'Publicar').click();
  });
  expect(onPublish).toHaveBeenCalledWith('clara');
  act(() => {
    [...node.querySelectorAll('button')].find((button) => button.textContent === 'Verificar').click();
  });
  expect(onVerify).toHaveBeenCalled();
  act(() => root.unmount());
});

test('dominio propio stays hidden when that step is closed', () => {
  const { node, root } = render({ customDomain: false, slug: 'clara' });
  expect(node.querySelector('[aria-label="Publicar"]')).not.toBeNull();
  expect(node.querySelector('[aria-label="Dominio propio"]')).toBeNull();
  act(() => root.unmount());
});

test('the steps are absent until there is a preview and the session opens publish', () => {
  const node = document.createElement('div');
  const root = createRoot(node);
  act(() => root.render(<BuilderPublishSteps />));
  expect(node.textContent).toBe('');
  act(() => root.render(<BuilderPublishSteps publishLanding hasPreview={false} />));
  expect(node.textContent).toBe('');
  act(() => root.unmount());
});
