import { sortLeaveRequestsByCreatedAt } from '../src/services/permissionService';

describe('permissionService leave request sorting', () => {
  test('mengurutkan pengajuan terbaru lebih dahulu', () => {
    const requests = [
      { id: 'older', createdAt: { toMillis: () => 1_000 } },
      { id: 'newest', createdAt: { toMillis: () => 3_000 } },
      { id: 'middle', createdAt: { seconds: 2 } },
    ];

    expect(sortLeaveRequestsByCreatedAt(requests).map((item) => item.id)).toEqual([
      'newest',
      'middle',
      'older',
    ]);
  });

  test('menempatkan pengajuan tanpa timestamp di urutan terakhir', () => {
    const requests = [
      { id: 'missing' },
      { id: 'dated', createdAt: '2026-11-24T08:00:00.000Z' },
    ];

    expect(sortLeaveRequestsByCreatedAt(requests).map((item) => item.id)).toEqual([
      'dated',
      'missing',
    ]);
  });

  test('tidak memutasi urutan array sumber', () => {
    const requests = [
      { id: 'older', createdAt: { seconds: 1 } },
      { id: 'newer', createdAt: { seconds: 2 } },
    ];

    sortLeaveRequestsByCreatedAt(requests);

    expect(requests.map((item) => item.id)).toEqual(['older', 'newer']);
  });
});
