import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { BULK_FIELD_CONFIG } from '../../services/bulkTemplateService';
import { radius, spacing } from '../../theme';

export default function BulkStagingList({
  type,
  rows,
  onToggleStatus,
  onUpdateRowField,
  onRemoveRow,
  onAddEmptyRow,
}) {
  const { tema } = useApp();
  const fields = BULK_FIELD_CONFIG[type] || [];
  const summary = useMemo(() => ({
    accepted: rows.filter((row) => row.status === 'accepted').length,
    denied: rows.filter((row) => row.status === 'denied').length,
    incomplete: rows.filter((row) => row.status === 'accepted' && !row.isValid).length,
  }), [rows]);

  return (
    <View style={styles.container}>
      <View style={[styles.summary, { backgroundColor: tema.surfaceRaised, borderColor: tema.border }]}>
        <Text style={[styles.summaryText, { color: tema.textPrimary }]}>Diterima: {summary.accepted}</Text>
        <Text style={[styles.summaryText, { color: tema.textPrimary }]}>Ditolak: {summary.denied}</Text>
        <Text style={[styles.summaryText, { color: summary.incomplete > 0 ? '#D97706' : tema.textSecondary }]}>Perlu dilengkapi: {summary.incomplete}</Text>
      </View>

      {rows.length === 0 ? (
        <View style={[styles.emptyCard, { borderColor: tema.border, backgroundColor: tema.surface }]}>
          <Ionicons name="document-text-outline" size={24} color={tema.textMuted} />
          <Text style={[styles.emptyText, { color: tema.textSecondary }]}>Belum ada baris untuk ditinjau.</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
        >
          {rows.map((row, index) => {
            const accepted = row.status === 'accepted';
            return (
              <View
                key={row.rowId}
                style={[
                  styles.rowCard,
                  {
                    backgroundColor: tema.surface,
                    borderColor: accepted
                      ? row.isValid ? '#16A34A' : '#D97706'
                      : tema.border,
                    opacity: accepted ? 1 : 0.62,
                  },
                ]}
              >
                <View style={styles.rowHeader}>
                  <View style={styles.rowTitleBlock}>
                    <Text style={[styles.rowTitle, { color: tema.textPrimary }]}>Baris {index + 1}</Text>
                    <Text style={[styles.rowStatus, { color: accepted ? row.isValid ? '#15803D' : '#B45309' : tema.textMuted }]}>
                      {accepted ? row.isValid ? 'VALID' : 'PERLU DILENGKAPI' : 'DITOLAK'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.statusButton, { backgroundColor: accepted ? '#DCFCE7' : '#FEE2E2' }]}
                    onPress={() => onToggleStatus(row.rowId)}
                    accessibilityRole="switch"
                    accessibilityState={{ checked: accepted }}
                    accessibilityLabel={`Status baris ${index + 1}`}
                  >
                    <Ionicons name={accepted ? 'checkmark-circle' : 'close-circle'} size={17} color={accepted ? '#15803D' : '#B91C1C'} />
                    <Text style={[styles.statusButtonText, { color: accepted ? '#15803D' : '#B91C1C' }]}>
                      {accepted ? 'Accept' : 'Deny'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {fields.map((field) => {
                  const missing = row.missingFields?.includes(field.key);
                  const invalid = row.invalidFields?.includes(field.key);
                  const hasError = accepted && (missing || invalid);
                  return (
                    <View key={field.key} style={styles.fieldGroup}>
                      <Text style={[styles.fieldLabel, { color: tema.textSecondary }]}>
                        {field.label}{field.required ? ' *' : ''}
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            color: tema.textPrimary,
                            borderColor: hasError ? '#D97706' : tema.border,
                            backgroundColor: tema.surfaceRaised,
                          },
                        ]}
                        value={String(row.data?.[field.key] ?? '')}
                        onChangeText={(value) => onUpdateRowField(row.rowId, field.key, value)}
                        editable={accepted}
                        keyboardType={field.numeric ? 'numbers-and-punctuation' : field.key === 'email' ? 'email-address' : 'default'}
                        autoCapitalize={field.key === 'email' ? 'none' : 'sentences'}
                        placeholder={missing ? 'Wajib diisi' : field.label}
                        placeholderTextColor={hasError ? '#D97706' : tema.textMuted}
                      />
                      {hasError ? (
                        <Text style={styles.validationText}>{missing ? 'Field wajib belum diisi.' : 'Nilai tidak valid.'}</Text>
                      ) : null}
                    </View>
                  );
                })}

                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => onRemoveRow(row.rowId)}
                  accessibilityRole="button"
                  accessibilityLabel={`Hapus baris ${index + 1}`}
                >
                  <Ionicons name="trash-outline" size={16} color="#DC2626" />
                  <Text style={styles.removeText}>Hapus baris</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}

      <TouchableOpacity
        style={[styles.addButton, { borderColor: tema.accent }]}
        onPress={onAddEmptyRow}
        accessibilityRole="button"
      >
        <Ionicons name="add-circle-outline" size={18} color={tema.accent} />
        <Text style={[styles.addButtonText, { color: tema.accent }]}>Tambah baris kosong</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  summary: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, gap: 4 },
  summaryText: { fontSize: 12, fontWeight: '700' },
  list: { maxHeight: 520 },
  listContent: { gap: spacing.md, paddingVertical: 2 },
  rowCard: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.sm },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowTitleBlock: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '800' },
  rowStatus: { fontSize: 10, fontWeight: '800', marginTop: 2 },
  statusButton: { minHeight: 36, borderRadius: radius.md, paddingHorizontal: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusButtonText: { fontSize: 11, fontWeight: '800' },
  fieldGroup: { gap: 4 },
  fieldLabel: { fontSize: 11, fontWeight: '700' },
  input: { minHeight: 42, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, fontSize: 12 },
  validationText: { color: '#B45309', fontSize: 10 },
  removeButton: { minHeight: 36, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5 },
  removeText: { color: '#DC2626', fontSize: 11, fontWeight: '700' },
  addButton: { minHeight: 44, borderWidth: 1, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  addButtonText: { fontSize: 12, fontWeight: '800' },
  emptyCard: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', gap: spacing.sm },
  emptyText: { fontSize: 12, textAlign: 'center' },
});
