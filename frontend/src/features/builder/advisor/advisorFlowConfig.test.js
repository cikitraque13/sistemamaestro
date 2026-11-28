import { ADVISOR_TESTIMONIALS } from './advisorTestimonials';
import {
  applyPublicAdvisorConfig,
  focusBuilderNovaChat,
  isEnabledFlag,
  loadPublicAdvisorConfig,
  readBuildAdvisorConfig,
  safeHttpUrl,
  shouldLoadPublicAdvisorConfig,
  visibleTestimonials,
} from './advisorFlowConfig';

test('the shipped testimonial list is empty', () => {
  expect(ADVISOR_TESTIMONIALS).toEqual([]);
});

test('the build flag and booking url default off', () => {
  const config = readBuildAdvisorConfig({});
  expect(config.enabled).toBe(false);
  expect(config.bookingUrl).toBe('');
  expect(config.photoUrl).toBe('');
  expect(config.testimonials).toEqual([]);
  expect(isEnabledFlag(undefined)).toBe(false);
  expect(isEnabledFlag('false')).toBe(false);
  expect(isEnabledFlag('TRUE')).toBe(true);
});

test('vite env turns the flow on and keeps only http urls', () => {
  const config = readBuildAdvisorConfig({
    VITE_ADVISOR_FLOW_ENABLED: 'true',
    VITE_ADVISOR_BOOKING_URL: 'https://booking.example.test/30',
    VITE_ADVISOR_PHOTO_URL: 'javascript:alert(1)',
  });
  expect(config.enabled).toBe(true);
  expect(config.bookingUrl).toBe('https://booking.example.test/30');
  expect(config.photoUrl).toBe('');
  expect(safeHttpUrl('https://')).toBe('');
  expect(safeHttpUrl('data:image/png;base64,aaaa')).toBe('');
});

test('public config overrides the build flag and drops a bad booking url', async () => {
  const base = readBuildAdvisorConfig({ VITE_ADVISOR_FLOW_ENABLED: 'true' });
  const enabled = applyPublicAdvisorConfig(base, {
    advisor_flow_enabled: true,
    advisor_booking_url: 'javascript:alert(1)',
    advisor_photo_url: 'https://cdn.example.test/nova.png',
  });
  expect(enabled.enabled).toBe(true);
  expect(enabled.bookingUrl).toBe('');
  expect(enabled.photoUrl).toBe('https://cdn.example.test/nova.png');

  const closed = applyPublicAdvisorConfig(enabled, { advisor_flow_enabled: false });
  expect(closed.enabled).toBe(false);
  expect(applyPublicAdvisorConfig(base, { advisor_flow_enabled: 'true' }).enabled).toBe(false);

  const failed = await loadPublicAdvisorConfig(base, async () => {
    throw new Error('offline');
  });
  expect(failed.enabled).toBe(true);
  expect(failed.bookingUrl).toBe('');
});

test('incomplete testimonials are dropped', () => {
  expect(visibleTestimonials([
    { quote: 'Sin nombre' },
    { name: 'Sin cita' },
    null,
    { quote: '  ', name: 'Nadie' },
  ])).toEqual([]);

  expect(visibleTestimonials([
    { id: 'real', quote: 'El siguiente paso quedó claro.', name: 'Marta Ruiz', detail: 'Valencia' },
  ])).toEqual([
    { id: 'real', quote: 'El siguiente paso quedó claro.', name: 'Marta Ruiz', detail: 'Valencia' },
  ]);
});

test('public config is not fetched while tests run', () => {
  expect(shouldLoadPublicAdvisorConfig(import.meta.env)).toBe(false);
  expect(shouldLoadPublicAdvisorConfig({ MODE: 'production' })).toBe(true);
  expect(shouldLoadPublicAdvisorConfig({ MODE: 'production', VITEST: true })).toBe(false);
});

test('chat focus uses the existing builder input', () => {
  document.body.innerHTML = '<input data-testid="builder-executor-input" />';
  const input = document.querySelector('[data-testid="builder-executor-input"]');
  input.focus = () => { document.body.setAttribute('data-focused', 'yes'); };
  expect(focusBuilderNovaChat()).toBe(true);
  expect(document.body.getAttribute('data-focused')).toBe('yes');
  document.body.innerHTML = '';
  expect(focusBuilderNovaChat()).toBe(false);
});
