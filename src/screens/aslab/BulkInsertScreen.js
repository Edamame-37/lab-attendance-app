import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import BulkStagingList from '../../components/aslab/BulkStagingList';
import { SegmentedControl } from '../../components/common/SegmentedControl';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  BULK_FIELD_CONFIG,
  downloadBulkTemplate,
  getBulkExampleContent,
  parseBulkCsvText,
  validateBulkRowData,
} from '../../services/bulkTemplateService';
import {
  bulkAssignAspraksToLab,
  bulkAssignStudentsToLab,
  bulkCreateLabsByCourse,
  subscribeToLabs,
} from '../../services/labService';
import { radius, spacing } from '../../theme';

const TYPE_OPTIONS = [
  { value: 'labs', label: 'Lab / Matkul', iconName: 'business-outline' },
  { value: 'students', label: 'Praktikan', iconName: 'school-outline' },
  { value: 'asprak', label: 'Asprak', iconName: 'clipboard-outline' },
];

const INSERT_OPTIONS = [
  { value: 'single', label: 'Single Insert' },
  { value: 'bulk', label: 'Bulk Insert' },
];

const createEmptyData = (type) => Object.fromEntries(
  BULK_FIELD_CONFIG[type].map((field) => [field.key, '']),
);

const createInitialTypeState = (type) => ({
  insertMode: 'single',
  singleData: createEmptyData(type),
  rawCsv: '',
  rows: [],
});

const INITIAL_STATES = {
  labs: createInitialTypeState('labs'),
  students: createInitialTypeState('students'),
  asprak: createInitialTypeState('asprak'),
};

export default function BulkInsertScreen() {
  const router = useRouter();
  const { tema } = useApp();
  const { user } = useAuth();
  const [activeType, setActiveType] = useState('labs');
  const [typeStates, setTypeStates] = useState(INITIAL_STATES);
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [selectedLabId, setSelectedLabId] = useState('');
  const [labs, setLabs] = useState([]);
  const [isLoadingLabs, setIsLoadingLabs] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => subscribeToLabs(
    (updatedLabs) => {
      setLabs(updatedLabs);
      setSelectedLabId((current) => (
        updatedLabs.some((lab) => lab.id === current)
          ? current
          : updatedLabs.find((lab) => lab.isActive)?.id || ''
      ));
      setIsLoadingLabs(false);
      setError('');
    },
    (subscriptionError) => {
      setError(subscriptionError.message || 'Daftar laboratorium tidak dapat dimuat.');
      setIsLoadingLabs(false);
    },
    { activeOnly: true },
  ), []);

  const activeState = typeStates[activeType];
  const fields = BULK_FIELD_CONFIG[activeType];
  const acceptedRows = useMemo(
    () => activeState.rows.filter((row) => row.status === 'accepted'),
    [activeState.rows],
  );

  const updateTypeState = (type, updates) => {
    setTypeStates((current) => ({
      ...current,
      [type]: { ...current[type], ...updates },
    }));
  };

  const updateSingleField = (field, value) => {
    updateTypeState(activeType, {
      singleData: { ...activeState.singleData, [field]: value },
    });
  };

  const validateContext = () => {
    if (!user?.uid) throw new Error('Sesi Aslab tidak tersedia. Silakan masuk kembali.');
    if (activeType === 'labs' && (!courseCode.trim() || !courseName.trim())) {
      throw new Error('Kode dan nama mata kuliah wajib diisi.');
    }
    if (activeType !== 'labs' && !selectedLabId) {
      throw new Error('Laboratorium tujuan wajib dipilih.');
    }
  };

  const saveData = async (dataItems) => {
    validateContext();
    if (activeType === 'labs') {
      return bulkCreateLabsByCourse({
        courseCode,
        courseName,
        labs: dataItems,
        userId: user.uid,
      });
    }
    if (activeType === 'students') {
      return bulkAssignStudentsToLab({
        labId: selectedLabId,
        students: dataItems,
        userId: user.uid,
      });
    }
    return bulkAssignAspraksToLab({
      labId: selectedLabId,
      aspraks: dataItems,
      userId: user.uid,
    });
  };

  const handleSaveSingle = async () => {
    const validation = validateBulkRowData(activeType, activeState.singleData);
    if (!validation.isValid) {
      setError(`Data belum valid. Periksa: ${[...validation.missingFields, ...validation.invalidFields].join(', ')}.`);
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      await saveData([activeState.singleData]);
      updateTypeState(activeType, { singleData: createEmptyData(activeType) });
      Alert.alert('Berhasil', 'Satu data berhasil disimpan ke Firestore.');
    } catch (saveError) {
      setError(saveError.message || 'Data tidak dapat disimpan.');
    } finally {
      setIsSaving(false);
    }
  };

  const processCsv = () => {
    setError('');
    try {
      const rows = parseBulkCsvText(activeType, activeState.rawCsv);
      updateTypeState(activeType, { rows });
      if (rows.length === 0) setError('CSV belum memiliki baris data.');
    } catch (parseError) {
      setError(parseError.message || 'CSV tidak dapat diproses.');
    }
  };

  const updateRowField = (rowId, field, value) => {
    const rows = activeState.rows.map((row) => {
      if (row.rowId !== rowId) return row;
      const data = { ...row.data, [field]: value };
      return { ...row, data, ...validateBulkRowData(activeType, data) };
    });
    updateTypeState(activeType, { rows });
  };

  const addEmptyRow = () => {
    const data = createEmptyData(activeType);
    const row = {
      rowId: `${activeType}-${Date.now()}-${activeState.rows.length}`,
      status: 'accepted',
      data,
      ...validateBulkRowData(activeType, data),
    };
    updateTypeState(activeType, { rows: [...activeState.rows, row] });
  };

  const handleSaveBulk = async () => {
    if (acceptedRows.length === 0) {
      setError('Pilih minimal satu baris berstatus Accept.');
      return;
    }
    const invalidAcceptedRows = acceptedRows.filter((row) => !row.isValid);
    if (invalidAcceptedRows.length > 0) {
      setError(`${invalidAcceptedRows.length} baris yang diterima masih belum valid.`);
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      await saveData(acceptedRows.map((row) => row.data));
      updateTypeState(activeType, { rawCsv: '', rows: [] });
      Alert.alert('Berhasil', `${acceptedRows.length} baris berhasil disimpan ke Firestore.`);
    } catch (saveError) {
      setError(saveError.message || 'Data bulk tidak dapat disimpan.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderContext = () => activeType === 'labs' ? (
    <View style={styles.contextFields}>
      <TextInput
        style={[styles.input, { color: tema.textPrimary, borderColor: tema.border }]}
        placeholder="Kode mata kuliah"
        placeholderTextColor={tema.textMuted}
        autoCapitalize="characters"
        value={courseCode}
        onChangeText={setCourseCode}
      />
      <TextInput
        style={[styles.input, { color: tema.textPrimary, borderColor: tema.border }]}
        placeholder="Nama mata kuliah"
        placeholderTextColor={tema.textMuted}
        value={courseName}
        onChangeText={setCourseName}
      />
    </View>
  ) : (
    <View style={styles.contextFields}>
      <Text style={[styles.fieldLabel, { color: tema.textSecondary }]}>Laboratorium tujuan</Text>
      {isLoadingLabs ? <ActivityIndicator color={tema.accent} /> : labs.length === 0 ? (
        <Text style={[styles.helperText, { color: tema.textSecondary }]}>Belum ada laboratorium aktif.</Text>
      ) : (
        <View style={styles.labOptions}>
          {labs.map((lab) => {
            const selected = selectedLabId === lab.id;
            return (
              <TouchableOpacity
                key={lab.id}
                style={[
                  styles.labOption,
                  {
                    backgroundColor: selected ? tema.accentSurface : tema.surfaceRaised,
                    borderColor: selected ? tema.accent : tema.border,
                  },
                ]}
                onPress={() => setSelectedLabId(lab.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={18} color={selected ? tema.accent : tema.textMuted} />
                <View style={styles.labOptionText}>
                  <Text style={[styles.labOptionName, { color: tema.textPrimary }]}>{lab.name}</Text>
                  <Text style={[styles.helperText, { color: tema.textSecondary }]}>{lab.code} · {lab.courseCode || 'Tanpa mata kuliah'}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );

  return (
    <ScreenContainer showHeader={false}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}>
          <Ionicons name="arrow-back" size={23} color={tema.textPrimary} />
        </TouchableOpacity>
        <View style={styles.topBarText}>
          <Text style={[styles.pageTitle, { color: tema.textPrimary }]}>Bulk dan Single Insert</Text>
          <Text style={[styles.pageSubtitle, { color: tema.textSecondary }]}>Kelola data lab dan anggota secara terpisah</Text>
        </View>
      </View>

      <SegmentedControl options={TYPE_OPTIONS} selectedValue={activeType} onSelect={(type) => { setActiveType(type); setError(''); }} />
      {renderContext()}
      <SegmentedControl
        options={INSERT_OPTIONS}
        selectedValue={activeState.insertMode}
        onSelect={(insertMode) => updateTypeState(activeType, { insertMode })}
      />

      {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

      {activeState.insertMode === 'single' ? (
        <View style={[styles.card, { backgroundColor: tema.surface, borderColor: tema.border }]}>
          <Text style={[styles.cardTitle, { color: tema.textPrimary }]}>Tambah satu data</Text>
          {fields.map((field) => (
            <View key={field.key} style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: tema.textSecondary }]}>{field.label}{field.required ? ' *' : ''}</Text>
              <TextInput
                style={[styles.input, { color: tema.textPrimary, borderColor: tema.border }]}
                value={activeState.singleData[field.key]}
                onChangeText={(value) => updateSingleField(field.key, value)}
                keyboardType={field.numeric ? 'numbers-and-punctuation' : field.key === 'email' ? 'email-address' : 'default'}
                autoCapitalize={field.key === 'email' ? 'none' : 'sentences'}
                placeholder={field.label}
                placeholderTextColor={tema.textMuted}
              />
            </View>
          ))}
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: tema.accent }]} onPress={handleSaveSingle} disabled={isSaving}>
            {isSaving ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="save-outline" size={18} color="#FFFFFF" />}
            <Text style={styles.primaryButtonText}>{isSaving ? 'Menyimpan...' : 'Simpan data'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.card, { backgroundColor: tema.surface, borderColor: tema.border }]}>
          <Text style={[styles.cardTitle, { color: tema.textPrimary }]}>Proses CSV</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: tema.accent }]}
              onPress={async () => {
                try {
                  await downloadBulkTemplate(activeType);
                } catch (downloadError) {
                  setError(downloadError.message || 'Template tidak dapat dibagikan.');
                }
              }}
            >
              <Ionicons name="download-outline" size={17} color={tema.accent} />
              <Text style={[styles.secondaryButtonText, { color: tema.accent }]}>Template CSV</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: tema.border }]}
              onPress={() => updateTypeState(activeType, { rawCsv: getBulkExampleContent(activeType) })}
            >
              <Ionicons name="document-text-outline" size={17} color={tema.textSecondary} />
              <Text style={[styles.secondaryButtonText, { color: tema.textSecondary }]}>Isi contoh</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={[styles.csvInput, { color: tema.textPrimary, borderColor: tema.border, backgroundColor: tema.surfaceRaised }]}
            value={activeState.rawCsv}
            onChangeText={(rawCsv) => updateTypeState(activeType, { rawCsv })}
            placeholder="Tempel isi CSV di sini"
            placeholderTextColor={tema.textMuted}
            multiline
            textAlignVertical="top"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={[styles.secondaryButton, styles.fullButton, { borderColor: tema.accent }]} onPress={processCsv}>
            <Ionicons name="list-outline" size={17} color={tema.accent} />
            <Text style={[styles.secondaryButtonText, { color: tema.accent }]}>Proses ke daftar review</Text>
          </TouchableOpacity>

          <BulkStagingList
            type={activeType}
            rows={activeState.rows}
            onToggleStatus={(rowId) => updateTypeState(activeType, {
              rows: activeState.rows.map((row) => row.rowId === rowId
                ? { ...row, status: row.status === 'accepted' ? 'denied' : 'accepted' }
                : row),
            })}
            onUpdateRowField={updateRowField}
            onRemoveRow={(rowId) => updateTypeState(activeType, {
              rows: activeState.rows.filter((row) => row.rowId !== rowId),
            })}
            onAddEmptyRow={addEmptyRow}
          />

          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: tema.accent }]} onPress={handleSaveBulk} disabled={isSaving}>
            {isSaving ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="cloud-upload-outline" size={18} color="#FFFFFF" />}
            <Text style={styles.primaryButtonText}>{isSaving ? 'Menyimpan...' : `Simpan ${acceptedRows.length} baris diterima`}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  topBarText: { flex: 1 },
  pageTitle: { fontSize: 18, fontWeight: '800' },
  pageSubtitle: { fontSize: 11, marginTop: 2 },
  contextFields: { gap: spacing.sm },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.md },
  cardTitle: { fontSize: 15, fontWeight: '800' },
  fieldGroup: { gap: 4 },
  fieldLabel: { fontSize: 11, fontWeight: '700' },
  input: { minHeight: 44, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, fontSize: 13 },
  csvInput: { minHeight: 150, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, fontSize: 12, fontFamily: 'monospace' },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  primaryButton: { minHeight: 46, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  secondaryButton: { minHeight: 42, flex: 1, borderWidth: 1, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: spacing.sm },
  secondaryButtonText: { fontSize: 11, fontWeight: '800' },
  fullButton: { flex: 0 },
  errorBanner: { color: '#991B1B', backgroundColor: '#FEE2E2', borderRadius: radius.md, padding: spacing.md, fontSize: 12 },
  labOptions: { gap: spacing.sm },
  labOption: { minHeight: 50, borderWidth: 1, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  labOptionText: { flex: 1 },
  labOptionName: { fontSize: 12, fontWeight: '800' },
  helperText: { fontSize: 11, lineHeight: 16 },
});
