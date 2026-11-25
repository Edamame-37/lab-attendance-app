import {
  parseBulkCsvText,
  validateBulkRowData,
} from '../src/services/bulkTemplateService';
import {
  mergeLabMembers,
  validateLabInput,
} from '../src/services/labService';

describe('bulk CSV staging', () => {
  test.each([
    [
      'labs',
      'code,name,address,latitude,longitude,radiusMeters,gracePeriodMinutes,lateFineAmount\nRPL-01,"Lab RPL, Utama",Gedung E,-7.05,110.44,50,15,10000',
    ],
    [
      'students',
      'nomorInduk,nama,kelas,email,uid\n24060124120001,Ahmad Fauzi,TI-3A,,',
    ],
    [
      'asprak',
      'nomorInduk,nama,email,uid\n19950312,Rian Pratama,,',
    ],
  ])('parses a valid %s template', (type, csv) => {
    const rows = parseBulkCsvText(type, csv);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ status: 'accepted', isValid: true });
  });

  test('supports BOM, CRLF, quoted commas, and empty optional columns', () => {
    const csv = '\uFEFFnomorInduk,nama,kelas,email,uid\r\n2401,"Putri, Ananda",TI-3A,,\r\n';
    const [row] = parseBulkCsvText('students', csv);

    expect(row.data.nama).toBe('Putri, Ananda');
    expect(row.data.email).toBe('');
    expect(row.isValid).toBe(true);
  });

  test('retains incomplete rows and reports missing required fields', () => {
    const csv = 'nomorInduk,nama,kelas,email,uid\n2401,,TI-3A,student@example.com,';
    const [row] = parseBulkCsvText('students', csv);

    expect(row.isValid).toBe(false);
    expect(row.missingFields).toEqual(['nama']);
  });

  test('marks invalid numeric policies without treating them as empty', () => {
    const result = validateBulkRowData('labs', {
      code: 'RPL-01',
      name: 'Lab RPL',
      address: '',
      latitude: '-7.05',
      longitude: '110.44',
      radiusMeters: '0',
      gracePeriodMinutes: '-1',
      lateFineAmount: '-1000',
    });

    expect(result.missingFields).toEqual([]);
    expect(result.invalidFields).toEqual([
      'radiusMeters',
      'gracePeriodMinutes',
      'lateFineAmount',
    ]);
    expect(result.isValid).toBe(false);
  });
});

describe('lab configuration and member assignment', () => {
  test('applies backward-compatible policy defaults', () => {
    const result = validateLabInput({
      name: 'Lab RPL',
      code: 'rpl-01',
      latitude: -7.05,
      longitude: 110.44,
      radiusMeters: 50,
    });

    expect(result).toMatchObject({
      code: 'RPL-01',
      courseCode: '',
      courseName: '',
      radiusMeters: 50,
      gracePeriodMinutes: 15,
      lateFineAmount: 10000,
    });
  });

  test.each([
    ['radiusMeters', 0, 'Radius laboratorium'],
    ['gracePeriodMinutes', -1, 'Grace period'],
    ['lateFineAmount', -1, 'Nominal denda'],
  ])('rejects invalid %s values', (field, value, message) => {
    expect(() => validateLabInput({
      name: 'Lab RPL',
      code: 'RPL-01',
      latitude: -7.05,
      longitude: 110.44,
      radiusMeters: 50,
      gracePeriodMinutes: 15,
      lateFineAmount: 10000,
      [field]: value,
    })).toThrow(message);
  });

  test('deduplicates members by UID or nomor induk and keeps new details', () => {
    const merged = mergeLabMembers(
      [{ uid: 'user-1', nomorInduk: '2401', nama: 'Nama Lama', kelas: 'TI-3A' }],
      [{ uid: 'user-1', nomorInduk: '2401', nama: 'Nama Baru', kelas: 'TI-3A', email: 'baru@example.com' }],
      { requireClass: true },
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ nama: 'Nama Baru', email: 'baru@example.com' });
  });
});
