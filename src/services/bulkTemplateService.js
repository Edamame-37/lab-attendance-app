import { Platform, Share } from 'react-native';

export const BULK_FIELD_CONFIG = {
  labs: [
    { key: 'code', label: 'Kode Lab', required: true },
    { key: 'name', label: 'Nama Lab', required: true },
    { key: 'address', label: 'Alamat', required: false },
    { key: 'latitude', label: 'Latitude', required: true, numeric: true, min: -90, max: 90 },
    { key: 'longitude', label: 'Longitude', required: true, numeric: true, min: -180, max: 180 },
    { key: 'radiusMeters', label: 'Radius (meter)', required: true, numeric: true, minExclusive: 0 },
    { key: 'gracePeriodMinutes', label: 'Grace Period (menit)', required: true, numeric: true, min: 0 },
    { key: 'lateFineAmount', label: 'Denda Tetap (Rupiah)', required: true, numeric: true, min: 0 },
  ],
  students: [
    { key: 'nomorInduk', label: 'NIM', required: true },
    { key: 'nama', label: 'Nama Praktikan', required: true },
    { key: 'kelas', label: 'Kelas', required: true },
    { key: 'email', label: 'Email', required: false },
    { key: 'uid', label: 'Firebase UID', required: false },
  ],
  asprak: [
    { key: 'nomorInduk', label: 'Nomor Induk', required: true },
    { key: 'nama', label: 'Nama Asprak', required: true },
    { key: 'email', label: 'Email', required: false },
    { key: 'uid', label: 'Firebase UID', required: false },
  ],
};

const TEMPLATE_EXAMPLES = {
  labs: [
    ['RPL-01', 'Lab RPL 1', 'Gedung E Lantai 2', '-7.0519000', '110.4408000', '50', '15', '10000'],
  ],
  students: [
    ['24060124120001', 'Ahmad Fauzi', 'TI-3A', 'ahmad@example.com', ''],
  ],
  asprak: [
    ['19950312', 'Rian Pratama', 'rian@example.com', ''],
  ],
};

const assertBulkType = (type) => {
  if (!Object.hasOwn(BULK_FIELD_CONFIG, type)) {
    throw new Error('Tipe bulk insert tidak dikenali.');
  }
};

const escapeCsvCell = (value) => {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const getBulkTemplateContent = (type) => {
  assertBulkType(type);
  const headers = BULK_FIELD_CONFIG[type].map((field) => field.key);
  return [headers, ...TEMPLATE_EXAMPLES[type]]
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\n');
};

export const getBulkExampleContent = (type) => getBulkTemplateContent(type);

export const downloadBulkTemplate = async (type) => {
  assertBulkType(type);
  const csvContent = getBulkTemplateContent(type);
  const fileName = `template-bulk-${type}.csv`;

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = fileName;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
    return { success: true, fileName };
  }

  await Share.share(
    {
      title: fileName,
      message: `${fileName}\n\n${csvContent}`,
    },
    { dialogTitle: `Bagikan ${fileName}` },
  );
  return { success: true, fileName };
};

const parseCsvRows = (rawText) => {
  const rows = [];
  let row = [];
  let cell = '';
  let insideQuotes = false;

  for (let index = 0; index < rawText.length; index += 1) {
    const character = rawText[index];
    const nextCharacter = rawText[index + 1];

    if (character === '"') {
      if (insideQuotes && nextCharacter === '"') {
        cell += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (!insideQuotes && character === ',') {
      row.push(cell.trim());
      cell = '';
      continue;
    }

    if (!insideQuotes && (character === '\n' || character === '\r')) {
      if (character === '\r' && nextCharacter === '\n') index += 1;
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += character;
  }

  if (insideQuotes) throw new Error('Format CSV tidak valid: tanda kutip belum ditutup.');
  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    rows.push(row);
  }

  return rows.filter((currentRow) => currentRow.some((value) => value !== ''));
};

const getInvalidFields = (fields, data) => fields
  .filter((field) => {
    if (!field.numeric || data[field.key] === '') return false;
    const numericValue = Number(String(data[field.key]).replace(',', '.'));
    if (!Number.isFinite(numericValue)) return true;
    if (field.min !== undefined && numericValue < field.min) return true;
    if (field.max !== undefined && numericValue > field.max) return true;
    if (field.minExclusive !== undefined && numericValue <= field.minExclusive) return true;
    return false;
  })
  .map((field) => field.key);

export const validateBulkRowData = (type, data) => {
  assertBulkType(type);
  const fields = BULK_FIELD_CONFIG[type];
  const missingFields = fields
    .filter((field) => field.required && !String(data?.[field.key] ?? '').trim())
    .map((field) => field.key);
  const invalidFields = getInvalidFields(fields, data || {});

  return {
    missingFields,
    invalidFields,
    isValid: missingFields.length === 0 && invalidFields.length === 0,
  };
};

export const parseBulkCsvText = (type, rawText) => {
  assertBulkType(type);
  const cleanText = String(rawText ?? '').replace(/^\uFEFF/, '').trim();
  if (!cleanText) return [];

  const parsedRows = parseCsvRows(cleanText);
  if (parsedRows.length === 0) return [];

  const expectedHeaders = BULK_FIELD_CONFIG[type].map((field) => field.key);
  const receivedHeaders = parsedRows[0].map((header, index) => (
    index === 0 ? header.replace(/^\uFEFF/, '').trim() : header.trim()
  ));
  const missingHeaders = expectedHeaders.filter((header) => !receivedHeaders.includes(header));
  if (missingHeaders.length > 0) {
    throw new Error(`Header CSV belum lengkap: ${missingHeaders.join(', ')}.`);
  }

  return parsedRows.slice(1).map((values, rowIndex) => {
    const data = expectedHeaders.reduce((result, header) => {
      const sourceIndex = receivedHeaders.indexOf(header);
      result[header] = sourceIndex >= 0 ? String(values[sourceIndex] ?? '').trim() : '';
      return result;
    }, {});
    const validation = validateBulkRowData(type, data);

    return {
      rowId: `${type}-${rowIndex + 1}`,
      status: 'accepted',
      data,
      ...validation,
    };
  });
};
