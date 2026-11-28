import { DASHBOARD_HEADLINE, DASHBOARD_SUBTITLE } from './dashboardCopy';
import {
  DASHBOARD_TABS,
  LAUNCHER_MODES,
  SECTOR_QUICK_STARTS,
  buildLaunchPrompt,
  dashboardSendLabel,
  gemBalanceFromBilling,
  resolveLauncherMode,
} from './dashboardModel';

test('headline and subtitle stay in one place', () => {
  expect(DASHBOARD_HEADLINE).toBe('¿Qué negocio vamos a lanzar hoy?');
  expect(DASHBOARD_SUBTITLE).toBe(
    'Describe tu negocio: creamos tu web, la publicamos y tu agente de IA atiende.'
  );
});

test('the box only offers the three existing launcher modes', () => {
  expect(DASHBOARD_TABS.map((tab) => tab.modeId)).toEqual(['landing', 'webapp', 'url']);
  expect(DASHBOARD_TABS.map((tab) => tab.label)).toEqual(['Sitio web', 'App web', 'Mejorar mi web']);
  expect(LAUNCHER_MODES.map((mode) => mode.id)).toContain('automation');
  expect(DASHBOARD_TABS.map((tab) => tab.modeId)).not.toContain('automation');
  expect(DASHBOARD_TABS.find((tab) => tab.modeId === 'landing').placeholder).toBe(
    'Describe tu negocio, a quién vendes y qué quieres que hagan tus clientes…'
  );
});

test('sector quick starts are the existing sector records', () => {
  expect(SECTOR_QUICK_STARTS.map((item) => item.label)).toEqual([
    'Restaurante',
    'Clínica',
    'Inmobiliaria',
    'Ecommerce',
    'Servicio local',
    'Educación',
  ]);
  expect(SECTOR_QUICK_STARTS.find((item) => item.id === 'restaurant').context).toContain('hostelería');
});

test('incoming routes still resolve to existing modes', () => {
  expect(resolveLauncherMode({ launchContext: { route: 'sell_and_charge' } })).toBe('landing');
  expect(resolveLauncherMode({ initialMode: 'webapp' })).toBe('webapp');
  expect(resolveLauncherMode({ initialMode: 'improve_existing' })).toBe('url');
  expect(resolveLauncherMode({ initialMode: 'automation' })).toBe('automation');
  expect(resolveLauncherMode(null)).toBe('landing');
});

test('a prefilled sector is not repeated in the launch prompt', () => {
  const sector = SECTOR_QUICK_STARTS[0];
  const prompt = buildLaunchPrompt({
    prompt: sector.context,
    selectedMode: LAUNCHER_MODES[0],
    selectedContext: sector,
    selectedGoal: null,
  });
  expect(prompt).toContain('Tipo de proyecto: Landing.');
  expect(prompt.match(/hostelería/g)).toHaveLength(1);
});

test('send label uses the rapid pace cost', () => {
  expect(dashboardSendLabel()).toBe('Crear · ◆ 1 gema →');
});

test('gem balance reads billing balance and ignores the old field names', () => {
  expect(gemBalanceFromBilling({
    credit_summary: {
      balance: 42,
      lifetime_used: 9,
      included_credits_for_current_plan: 100,
      available_credits: 0,
      used_credits: 3,
      included_credits: 1,
    },
  })).toBe(42);

  expect(gemBalanceFromBilling({
    balance: 7,
    lifetime_used: 3,
    included_credits_for_current_plan: 20,
  })).toBe(7);

  expect(gemBalanceFromBilling({
    credit_summary: {
      lifetime_used: 3,
      included_credits_for_current_plan: 20,
    },
  })).toBeNull();

  expect(gemBalanceFromBilling({ available_credits: 5 })).toBe(5);
  expect(gemBalanceFromBilling({ balance: 0 })).toBe(0);
});
