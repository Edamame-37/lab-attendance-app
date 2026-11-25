import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import BulkInsertScreen from '../src/screens/aslab/BulkInsertScreen';
import LabTransferScreen from '../src/screens/aslab/LabTransferScreen';
import LabLocationManageScreen from '../src/screens/asisten/LabLocationManageScreen';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  canGoBack: jest.fn(() => false),
};
const mockBulkCreateLabsByCourse = jest.fn(async () => ({ success: true }));
const mockBulkAssignStudentsToLab = jest.fn(async () => ({ success: true }));
const mockBulkAssignAspraksToLab = jest.fn(async () => ({ success: true }));
const mockTransferStudentBetweenLabs = jest.fn(async () => ({ success: true }));
const mockTransferAsprakBetweenLabs = jest.fn(async () => ({ success: true }));
const mockCreateLab = jest.fn(async () => 'lab-new');
const mockUpdateLab = jest.fn(async () => undefined);
const mockSetLabActiveState = jest.fn(async () => undefined);

const mockLabs = [
  {
    id: 'lab-a',
    name: 'Lab A',
    code: 'A-01',
    courseCode: 'PPK-2026',
    courseName: 'PPK',
    address: 'Gedung A',
    latitude: -7.05,
    longitude: 110.44,
    radiusMeters: 50,
    gracePeriodMinutes: 15,
    lateFineAmount: 10000,
    aslabId: 'aslab-1',
    studentMembers: [{ uid: 'student-1', nomorInduk: '2401', nama: 'Praktikan Satu', kelas: 'TI-3A' }],
    asprakMembers: [{ uid: 'asprak-1', nomorInduk: '1995', nama: 'Asprak Satu' }],
    isActive: true,
  },
  {
    id: 'lab-b',
    name: 'Lab B',
    code: 'B-01',
    courseCode: 'PPK-2026',
    courseName: 'PPK',
    address: 'Gedung B',
    latitude: -7.06,
    longitude: 110.45,
    radiusMeters: 60,
    gracePeriodMinutes: 10,
    lateFineAmount: 15000,
    aslabId: '',
    studentMembers: [],
    asprakMembers: [],
    isActive: true,
  },
];

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('../src/context/AppContext', () => ({
  useApp: () => ({
    modeTema: 'light',
    tema: {
      canvas: '#FAFAFA',
      surface: '#FFFFFF',
      surfaceRaised: '#F5F5F5',
      border: '#DDDDDD',
      textPrimary: '#111111',
      textSecondary: '#555555',
      textMuted: '#888888',
      accent: '#047857',
      accentSurface: '#D1FAE5',
      accentText: '#065F46',
    },
  }),
}));

jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'aslab-1' },
    role: 'aslab',
  }),
}));

jest.mock('../src/components/ScreenContainer', () => {
  const ReactModule = require('react');
  const { View: NativeView } = require('react-native');
  return {
    ScreenContainer: ({ children }) => ReactModule.createElement(NativeView, null, children),
  };
});

jest.mock('../src/services/locationService', () => ({
  formatLocationError: (error) => error.message,
  getCurrentDeviceLocation: jest.fn(async () => ({ latitude: -7.05, longitude: 110.44 })),
}));

jest.mock('../src/services/labService', () => ({
  subscribeToLabs: jest.fn((onUpdate) => {
    onUpdate(mockLabs);
    return jest.fn();
  }),
  bulkCreateLabsByCourse: (...args) => mockBulkCreateLabsByCourse(...args),
  bulkAssignStudentsToLab: (...args) => mockBulkAssignStudentsToLab(...args),
  bulkAssignAspraksToLab: (...args) => mockBulkAssignAspraksToLab(...args),
  transferStudentBetweenLabs: (...args) => mockTransferStudentBetweenLabs(...args),
  transferAsprakBetweenLabs: (...args) => mockTransferAsprakBetweenLabs(...args),
  createLab: (...args) => mockCreateLab(...args),
  updateLab: (...args) => mockUpdateLab(...args),
  setLabActiveState: (...args) => mockSetLabActiveState(...args),
}));

describe('Aslab screens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('BulkInsertScreen exposes three isolated insert modes and review controls', async () => {
    const screen = await render(<BulkInsertScreen />);

    expect(screen.getByText('Lab / Matkul')).toBeTruthy();
    expect(screen.getByText('Praktikan')).toBeTruthy();
    expect(screen.getByText('Asprak')).toBeTruthy();
    expect(screen.getByPlaceholderText('Kode mata kuliah')).toBeTruthy();

    await fireEvent.press(screen.getByText('Praktikan'));
    expect(screen.getByText('Laboratorium tujuan')).toBeTruthy();
    expect(screen.getByText('Tambah satu data')).toBeTruthy();

    await fireEvent.press(screen.getByText('Bulk Insert'));
    expect(screen.getByText('Template CSV')).toBeTruthy();
    expect(screen.getByText('Isi contoh')).toBeTruthy();
    expect(screen.getByText('Proses ke daftar review')).toBeTruthy();

    await fireEvent.press(screen.getByText('Asprak'));
    expect(screen.getByText('Tambah satu data')).toBeTruthy();
    expect(screen.getByPlaceholderText('Nama Asprak')).toBeTruthy();
  });

  test('LabTransferScreen confirms and executes an atomic student transfer request', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((title, _message, buttons) => {
      if (title === 'Konfirmasi Transfer') buttons[1].onPress();
    });
    const screen = await render(<LabTransferScreen />);

    await fireEvent.press(screen.getByText('Praktikan Satu'));
    const labBLabels = screen.getAllByText('Lab B');
    await fireEvent.press(labBLabels[labBLabels.length - 1]);
    await fireEvent.press(screen.getByText('Konfirmasi Transfer'));

    await waitFor(() => expect(mockTransferStudentBetweenLabs).toHaveBeenCalledWith({
      fromLabId: 'lab-a',
      toLabId: 'lab-b',
      studentIdentifier: 'student-1',
      userId: 'aslab-1',
    }));
    alertSpy.mockRestore();
  });

  test('LabLocationManageScreen shows Sprint 4 policy fields, counts, and shortcuts', async () => {
    const screen = await render(<LabLocationManageScreen />);

    expect(screen.getByPlaceholderText('Kode mata kuliah')).toBeTruthy();
    expect(screen.getByPlaceholderText('Nama mata kuliah')).toBeTruthy();
    expect(screen.getByPlaceholderText('Grace period (menit)')).toBeTruthy();
    expect(screen.getByPlaceholderText('Denda tetap (Rp)')).toBeTruthy();
    expect(screen.getByText('1 Praktikan')).toBeTruthy();
    expect(screen.getByText('1 Asprak')).toBeTruthy();

    await fireEvent.press(screen.getByText('Bulk / Single Insert'));
    expect(mockRouter.push).toHaveBeenCalledWith('/bulk-insert');
    await fireEvent.press(screen.getByText('Transfer Anggota'));
    expect(mockRouter.push).toHaveBeenCalledWith('/transfer-lab');
  });
});
