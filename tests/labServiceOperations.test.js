const mockBatch = {
  set: jest.fn(),
  commit: jest.fn(async () => undefined),
};
const mockTransaction = {
  get: jest.fn(),
  update: jest.fn(),
};
const mockWriteBatch = jest.fn(() => mockBatch);
const mockRunTransaction = jest.fn(async (_db, callback) => callback(mockTransaction));

jest.mock('../src/config/firebase', () => ({ db: { name: 'mock-db' } }));

jest.mock('firebase/firestore', () => ({
  GeoPoint: class MockGeoPoint {
    constructor(latitude, longitude) {
      this.latitude = latitude;
      this.longitude = longitude;
    }
  },
  addDoc: jest.fn(),
  collection: jest.fn((_db, name) => ({ id: name, path: name })),
  doc: jest.fn((first, collectionName, documentId) => {
    if (collectionName === undefined) {
      return { id: 'auto-lab-1', path: `${first.path}/auto-lab-1` };
    }
    return { id: documentId, path: `${collectionName}/${documentId}` };
  }),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  onSnapshot: jest.fn(),
  query: jest.fn(),
  runTransaction: (...args) => mockRunTransaction(...args),
  serverTimestamp: jest.fn(() => ({ __serverTimestamp: true })),
  updateDoc: jest.fn(),
  where: jest.fn(),
  writeBatch: (...args) => mockWriteBatch(...args),
}));

import {
  bulkAssignStudentsToLab,
  bulkCreateLabsByCourse,
  transferAsprakBetweenLabs,
  transferStudentBetweenLabs,
} from '../src/services/labService';

const snapshot = (data) => ({ exists: () => true, data: () => data });

describe('labService Firestore operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBatch.commit.mockResolvedValue(undefined);
  });

  test('creates all course labs in one committed batch with Sprint 4 defaults', async () => {
    const result = await bulkCreateLabsByCourse({
      courseCode: 'ppk-2026',
      courseName: 'Pengembangan Perangkat Bergerak',
      userId: 'aslab-1',
      labs: [{
        code: 'RPL-01',
        name: 'Lab RPL 1',
        address: 'Gedung E',
        latitude: -7.05,
        longitude: 110.44,
        radiusMeters: 50,
        gracePeriodMinutes: 15,
        lateFineAmount: 10000,
      }],
    });

    expect(mockWriteBatch).toHaveBeenCalledTimes(1);
    expect(mockBatch.set).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'auto-lab-1' }),
      expect.objectContaining({
        courseCode: 'PPK-2026',
        aslabId: 'aslab-1',
        asprakIds: [],
        studentIds: [],
      }),
    );
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ success: true, count: 1 });
  });

  test('assigns and deduplicates students inside a transaction', async () => {
    mockTransaction.get.mockResolvedValue(snapshot({
      studentMembers: [{ uid: 'student-1', nomorInduk: '2401', nama: 'Nama Lama', kelas: 'TI-3A' }],
    }));

    const result = await bulkAssignStudentsToLab({
      labId: 'lab-a',
      userId: 'aslab-1',
      students: [{ uid: 'student-1', nomorInduk: '2401', nama: 'Nama Baru', kelas: 'TI-3A' }],
    });

    expect(mockRunTransaction).toHaveBeenCalledTimes(1);
    expect(mockTransaction.update).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'labs/lab-a' }),
      expect.objectContaining({
        studentIds: ['student-1'],
        studentMembers: [expect.objectContaining({ nama: 'Nama Baru' })],
        updatedBy: 'aslab-1',
      }),
    );
    expect(result).toMatchObject({ success: true, count: 1 });
  });

  test('moves a student atomically without writing session data', async () => {
    mockTransaction.get.mockImplementation(async (reference) => {
      if (reference.path === 'labs/source') {
        return snapshot({
          studentMembers: [{ uid: 'student-1', nomorInduk: '2401', nama: 'Praktikan', kelas: 'TI-3A' }],
        });
      }
      return snapshot({ studentMembers: [] });
    });

    await transferStudentBetweenLabs({
      fromLabId: 'source',
      toLabId: 'target',
      studentIdentifier: 'student-1',
      userId: 'aslab-1',
    });

    expect(mockTransaction.update).toHaveBeenCalledTimes(2);
    expect(mockTransaction.update.mock.calls.map(([reference]) => reference.path))
      .toEqual(['labs/source', 'labs/target']);
    expect(mockTransaction.update.mock.calls[0][1]).toMatchObject({ studentIds: [], studentMembers: [] });
    expect(mockTransaction.update.mock.calls[1][1]).toMatchObject({
      studentIds: ['student-1'],
      studentMembers: [expect.objectContaining({ nomorInduk: '2401' })],
    });
  });

  test('moves an Aslab only when the destination has no different owner', async () => {
    mockTransaction.get.mockImplementation(async (reference) => (
      reference.path === 'labs/source'
        ? snapshot({ aslabId: 'aslab-1', asprakMembers: [] })
        : snapshot({ aslabId: '', asprakMembers: [] })
    ));

    const result = await transferAsprakBetweenLabs({
      fromLabId: 'source',
      toLabId: 'target',
      asprakIdentifier: 'aslab-1',
      userId: 'aslab-1',
    });

    expect(result).toMatchObject({ success: true, memberType: 'aslab' });
    expect(mockTransaction.update.mock.calls[0][1]).toMatchObject({ aslabId: '' });
    expect(mockTransaction.update.mock.calls[1][1]).toMatchObject({ aslabId: 'aslab-1' });
  });

  test('rejects an Aslab transfer that would overwrite the destination owner', async () => {
    mockTransaction.get.mockImplementation(async (reference) => (
      reference.path === 'labs/source'
        ? snapshot({ aslabId: 'aslab-1', asprakMembers: [] })
        : snapshot({ aslabId: 'aslab-2', asprakMembers: [] })
    ));

    await expect(transferAsprakBetweenLabs({
      fromLabId: 'source',
      toLabId: 'target',
      asprakIdentifier: 'aslab-1',
      userId: 'aslab-1',
    })).rejects.toThrow('sudah memiliki Aslab');
    expect(mockTransaction.update).not.toHaveBeenCalled();
  });
});
