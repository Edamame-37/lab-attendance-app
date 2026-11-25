const {
  verifyXenditCallbackToken,
  mapXenditStatusToPaymentStatus,
} = require('../backend/src/xenditClient');

describe('Xendit Payment Webhook', () => {
  test('should accept a valid callback token', () => {
    const result = verifyXenditCallbackToken(
      'valid-token',
      'valid-token'
    );

    expect(result).toBe(true);
  });

  test('should reject an invalid callback token', () => {
    const result = verifyXenditCallbackToken(
      'wrong-token',
      'valid-token'
    );

    expect(result).toBe(false);
  });

  test('should reject an empty callback token', () => {
    const result = verifyXenditCallbackToken(
      '',
      'valid-token'
    );

    expect(result).toBe(false);
  });

  test('should map PAID status to success', () => {
    expect(
      mapXenditStatusToPaymentStatus('PAID')
    ).toBe('success');
  });

  test('should map PENDING status to pending', () => {
    expect(
      mapXenditStatusToPaymentStatus('PENDING')
    ).toBe('pending');
  });

  test('should map EXPIRED status to failed', () => {
    expect(
      mapXenditStatusToPaymentStatus('EXPIRED')
    ).toBe('failed');
  });
});
