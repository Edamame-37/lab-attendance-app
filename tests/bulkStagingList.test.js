import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import BulkStagingList from '../src/components/aslab/BulkStagingList';

jest.mock('../src/context/AppContext', () => ({
  useApp: () => ({
    tema: {
      surface: '#FFFFFF',
      surfaceRaised: '#F5F5F5',
      border: '#DDDDDD',
      textPrimary: '#111111',
      textSecondary: '#555555',
      textMuted: '#888888',
      accent: '#047857',
    },
  }),
}));

const validStudentRow = {
  rowId: 'students-1',
  status: 'accepted',
  data: {
    nomorInduk: '2401',
    nama: 'Praktikan Satu',
    kelas: 'TI-3A',
    email: '',
    uid: '',
  },
  missingFields: [],
  invalidFields: [],
  isValid: true,
};

describe('BulkStagingList', () => {
  test('renders summary and forwards row interactions', async () => {
    const onToggleStatus = jest.fn();
    const onUpdateRowField = jest.fn();
    const onRemoveRow = jest.fn();
    const onAddEmptyRow = jest.fn();
    const screen = await render(
      <BulkStagingList
        type="students"
        rows={[validStudentRow]}
        onToggleStatus={onToggleStatus}
        onUpdateRowField={onUpdateRowField}
        onRemoveRow={onRemoveRow}
        onAddEmptyRow={onAddEmptyRow}
      />,
    );

    expect(screen.getByText('Diterima: 1')).toBeTruthy();
    expect(screen.getByText('Ditolak: 0')).toBeTruthy();
    expect(screen.getByText('Perlu dilengkapi: 0')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Status baris 1'));
    expect(onToggleStatus).toHaveBeenCalledWith('students-1');

    await fireEvent.changeText(screen.getByDisplayValue('Praktikan Satu'), 'Nama Baru');
    expect(onUpdateRowField).toHaveBeenCalledWith('students-1', 'nama', 'Nama Baru');

    await fireEvent.press(screen.getByLabelText('Hapus baris 1'));
    expect(onRemoveRow).toHaveBeenCalledWith('students-1');

    await fireEvent.press(screen.getByText('Tambah baris kosong'));
    expect(onAddEmptyRow).toHaveBeenCalledTimes(1);
  });

  test('shows incomplete accepted rows and disables denied row inputs', async () => {
    const incompleteRow = {
      ...validStudentRow,
      data: { ...validStudentRow.data, nama: '' },
      missingFields: ['nama'],
      isValid: false,
    };
    const deniedRow = {
      ...validStudentRow,
      rowId: 'students-2',
      status: 'denied',
    };
    const screen = await render(
      <BulkStagingList
        type="students"
        rows={[incompleteRow, deniedRow]}
        onToggleStatus={jest.fn()}
        onUpdateRowField={jest.fn()}
        onRemoveRow={jest.fn()}
        onAddEmptyRow={jest.fn()}
      />,
    );

    expect(screen.getByText('Perlu dilengkapi: 1')).toBeTruthy();
    expect(screen.getByText('Field wajib belum diisi.')).toBeTruthy();
    expect(screen.getAllByDisplayValue('Praktikan Satu')[0].props.editable).toBe(false);
  });
});
