// Provider settlement alone is not proof that internal provision completed.
export const isPaymentProvisionComplete = (payment) =>
  payment?.payment_status === 'paid' && payment?.status === 'complete';
