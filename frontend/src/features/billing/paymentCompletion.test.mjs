import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isPaymentProvisionComplete } from './paymentCompletion.mjs';

test('settlement alone never announces provision success', () => {
  for (const status of ['pending', 'processing', 'reconciliation_required', undefined]) {
    assert.equal(isPaymentProvisionComplete({ payment_status: 'paid', status }), false);
  }
  assert.equal(isPaymentProvisionComplete({ payment_status: 'paid', status: 'complete' }), true);
  assert.equal(isPaymentProvisionComplete({ payment_status: 'unpaid', status: 'complete' }), false);
  assert.equal(isPaymentProvisionComplete(null), false);
});

test('actual polling consumer preserves retry context until completion', async () => {
  // Execute the actual function body without React/render/network dependencies.
  const source = readFileSync(new URL('./BillingPage.js', import.meta.url), 'utf8');
  const start = source.indexOf('  const pollPaymentStatus = async');
  const end = source.indexOf('  const redirectToCheckout', start);
  const body = source.slice(start, end);
  for (const status of ['pending', 'complete']) {
    const effects = [];
    const factory = new Function('axios', 'API_BASE', 'toast', 'setCheckingPayment',
      'readCheckoutContext', 'checkAuth', 'fetchBillingData', 'window', 'clearCheckoutContext',
      'navigate', 'setTimeout', 'isPaymentProvisionComplete', `${body}; return pollPaymentStatus;`);
    const poll = factory({get: async () => ({data: {status, payment_status:'paid', item_type:'plan'}})},
      'synthetic', {success: () => effects.push('success'), info: () => {}, error: () => {}},
      () => {}, () => ({}), async () => {}, async () => {},
      {history: {replaceState: () => effects.push('clear_url')}, location: {pathname:'/billing'}},
      () => effects.push('clear_context'), () => {}, () => effects.push('retry'), isPaymentProvisionComplete);
    await poll('cs_test');
    assert.deepEqual(effects, status === 'pending' ? ['retry'] : ['success', 'clear_url', 'clear_context']);
  }
});
