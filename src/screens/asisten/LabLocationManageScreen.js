import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  createLab,
  setLabActiveState,
  subscribeToLabs,
  updateLab,
} from '../../services/labService';
import { formatLocationError, getCurrentDeviceLocation } from '../../services/locationService';

const EMPTY_FORM = {
  name: '',
  code: '',
  address: '',
  latitude: '',
  longitude: '',
  radiusMeters: '50',
};

export default function LabLocationManageScreen() {
  const router = useRouter();
  const { tema } = useApp();
  const { user } = useAuth();
  const [labs, setLabs] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingLabId, setEditingLabId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToLabs(
      (updatedLabs) => {
        setLabs(updatedLabs);
        setIsLoading(false);
        setError('');
      },
      (subscriptionError) => {
        setError(subscriptionError.message || 'Data laboratorium tidak dapat dimuat.');
        setIsLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const resetForm = () => {
    setEditingLabId('');
    setForm(EMPTY_FORM);
    setError('');
  };

  const startEditing = (lab) => {
    setEditingLabId(lab.id);
    setForm({
      name: lab.name || '',
      code: lab.code || '',
      address: lab.address || '',
      latitude: String(lab.latitude ?? ''),
      longitude: String(lab.longitude ?? ''),
      radiusMeters: String(lab.radiusMeters ?? 50),
    });
  };

  const fillCurrentLocation = async () => {
    setIsLocating(true);
    setError('');
    try {
      const location = await getCurrentDeviceLocation();
      setForm((current) => ({
        ...current,
        latitude: Number.isFinite(location?.latitude) ? location.latitude.toFixed(7) : '',
        longitude: Number.isFinite(location?.longitude) ? location.longitude.toFixed(7) : '',
      }));
    } catch (locationError) {
      setError(formatLocationError(locationError));
    } finally {
      setIsLocating(false);
    }
  };

  const saveLab = async () => {
    setIsSaving(true);
    setError('');
    try {
      const name = form.name?.trim();
      const code = form.code?.trim().toUpperCase();
      if (!name || !code) {
        throw new Error('Nama dan kode laboratorium wajib diisi.');
      }

      const cleanLat = String(form.latitude ?? '').trim().replace(',', '.');
      const cleanLng = String(form.longitude ?? '').trim().replace(',', '.');
      if (!cleanLat || !cleanLng) {
        throw new Error('Koordinat latitude dan longitude wajib diisi.');
      }

      const latNum = Number(cleanLat);
      const lngNum = Number(cleanLng);
      if (!Number.isFinite(latNum) || latNum < -90 || latNum > 90) {
        throw new Error('Latitude harus berupa angka valid antara -90 dan 90.');
      }
      if (!Number.isFinite(lngNum) || lngNum < -180 || lngNum > 180) {
        throw new Error('Longitude harus berupa angka valid antara -180 dan 180.');
      }

      const cleanRadius = String(form.radiusMeters ?? '').trim().replace(',', '.');
      const radiusNum = Number(cleanRadius);
      if (!cleanRadius || !Number.isFinite(radiusNum) || radiusNum <= 0) {
        throw new Error('Radius harus berupa angka positif lebih dari 0 meter.');
      }

      const sanitizedForm = {
        ...form,
        name,
        code,
        latitude: latNum,
        longitude: lngNum,
        radiusMeters: radiusNum,
      };

      if (editingLabId) {
        await updateLab(editingLabId, sanitizedForm, user?.uid);
      } else {
        await createLab(sanitizedForm, user?.uid);
      }
      resetForm();
      Alert.alert('Berhasil', editingLabId ? 'Lokasi laboratorium diperbarui.' : 'Laboratorium baru ditambahkan.');
    } catch (saveError) {
      setError(saveError.message || 'Data laboratorium tidak dapat disimpan.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleLabState = (lab) => {
    const nextActiveState = lab.isActive === false;
    Alert.alert(
      nextActiveState ? 'Aktifkan Laboratorium' : 'Nonaktifkan Laboratorium',
      `${nextActiveState ? 'Aktifkan' : 'Nonaktifkan'} ${lab.name}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: nextActiveState ? 'Aktifkan' : 'Nonaktifkan',
          style: nextActiveState ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await setLabActiveState(lab.id, nextActiveState, user?.uid);
            } catch (stateError) {
              setError(stateError.message || 'Status laboratorium tidak dapat diubah.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer showHeader={false}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}>
          <Ionicons name="arrow-back" size={23} color={tema.textPrimary} />
        </TouchableOpacity>
        <View style={styles.topBarText}>
          <Text style={[styles.pageTitle, { color: tema.textPrimary }]}>Lokasi Laboratorium</Text>
          <Text style={[styles.pageSubtitle, { color: tema.textSecondary }]}>SRS-FT-11 · Koordinat dan radius</Text>
        </View>
      </View>

      {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

      <View style={[styles.formCard, { backgroundColor: tema.surface, borderColor: tema.border }]}>
        <View style={styles.formHeader}>
          <Text style={[styles.formTitle, { color: tema.textPrimary }]}>
            {editingLabId ? 'Ubah Laboratorium' : 'Tambah Laboratorium'}
          </Text>
          {editingLabId ? (
            <TouchableOpacity onPress={resetForm}>
              <Text style={[styles.cancelEdit, { color: tema.accent }]}>Batal edit</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <TextInput
          style={[styles.input, { color: tema.textPrimary, borderColor: tema.border }]}
          placeholder="Nama laboratorium"
          placeholderTextColor={tema.textMuted}
          value={form.name}
          onChangeText={(value) => updateForm('name', value)}
        />
        <TextInput
          style={[styles.input, { color: tema.textPrimary, borderColor: tema.border }]}
          placeholder="Kode lab, contoh: RPL-1"
          autoCapitalize="characters"
          placeholderTextColor={tema.textMuted}
          value={form.code}
          onChangeText={(value) => updateForm('code', value)}
        />
        <TextInput
          style={[styles.input, { color: tema.textPrimary, borderColor: tema.border }]}
          placeholder="Alamat atau keterangan lokasi"
          placeholderTextColor={tema.textMuted}
          value={form.address}
          onChangeText={(value) => updateForm('address', value)}
        />
        <View style={styles.coordinateRow}>
          <TextInput
            style={[styles.input, styles.flexInput, { color: tema.textPrimary, borderColor: tema.border }]}
            placeholder="Latitude"
            keyboardType="numbers-and-punctuation"
            placeholderTextColor={tema.textMuted}
            value={form.latitude}
            onChangeText={(value) => updateForm('latitude', value)}
          />
          <TextInput
            style={[styles.input, styles.flexInput, { color: tema.textPrimary, borderColor: tema.border }]}
            placeholder="Longitude"
            keyboardType="numbers-and-punctuation"
            placeholderTextColor={tema.textMuted}
            value={form.longitude}
            onChangeText={(value) => updateForm('longitude', value)}
          />
        </View>
        <TextInput
          style={[styles.input, { color: tema.textPrimary, borderColor: tema.border }]}
          placeholder="Radius dalam meter"
          keyboardType="decimal-pad"
          placeholderTextColor={tema.textMuted}
          value={form.radiusMeters}
          onChangeText={(value) => updateForm('radiusMeters', value)}
        />
        <TouchableOpacity style={[styles.outlineButton, { borderColor: tema.accent }]} onPress={fillCurrentLocation} disabled={isLocating}>
          {isLocating ? <ActivityIndicator color={tema.accent} /> : <Ionicons name="locate-outline" size={18} color={tema.accent} />}
          <Text style={[styles.outlineButtonText, { color: tema.accent }]}>Gunakan Lokasi Perangkat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: tema.accent }]} onPress={saveLab} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="save-outline" size={18} color="#FFFFFF" />}
          <Text style={styles.primaryButtonText}>{isSaving ? 'Menyimpan...' : 'Simpan Laboratorium'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { color: tema.textPrimary }]}>Daftar laboratorium</Text>
      {isLoading ? (
        <ActivityIndicator color={tema.accent} />
      ) : labs.length === 0 ? (
        <Text style={[styles.emptyText, { color: tema.textSecondary }]}>Belum ada laboratorium.</Text>
      ) : (
        labs.map((lab) => (
          <View key={lab.id} style={[styles.labCard, { backgroundColor: tema.surface, borderColor: tema.border }]}>
            <View style={styles.labHeader}>
              <View style={styles.labTitleBox}>
                <Text style={[styles.labName, { color: tema.textPrimary }]}>{lab.name}</Text>
                <Text style={[styles.labCode, { color: tema.textSecondary }]}>{lab.code} · radius {lab.radiusMeters} m</Text>
              </View>
              <Text style={[styles.stateBadge, { color: lab.isActive === false ? '#DC2626' : '#059669' }]}>
                {lab.isActive === false ? 'NONAKTIF' : 'AKTIF'}
              </Text>
            </View>
            <Text style={[styles.coordinates, { color: tema.textSecondary }]}>
              {Number.isFinite(Number(lab.latitude)) ? Number(lab.latitude).toFixed(6) : '-'}, {Number.isFinite(Number(lab.longitude)) ? Number(lab.longitude).toFixed(6) : '-'}
            </Text>
            {lab.address ? <Text style={[styles.address, { color: tema.textSecondary }]}>{lab.address}</Text> : null}
            <View style={styles.labActions}>
              <TouchableOpacity style={[styles.smallButton, { borderColor: tema.accent }]} onPress={() => startEditing(lab)}>
                <Ionicons name="create-outline" size={16} color={tema.accent} />
                <Text style={[styles.smallButtonText, { color: tema.accent }]}>Ubah</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.smallButton, { borderColor: lab.isActive === false ? '#059669' : '#DC2626' }]} onPress={() => toggleLabState(lab)}>
                <Text style={[styles.smallButtonText, { color: lab.isActive === false ? '#059669' : '#DC2626' }]}>
                  {lab.isActive === false ? 'Aktifkan' : 'Nonaktifkan'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  topBarText: { flex: 1 },
  pageTitle: { fontSize: 18, fontWeight: '800' },
  pageSubtitle: { fontSize: 11, marginTop: 2 },
  errorBanner: { color: '#991B1B', backgroundColor: '#FEE2E2', borderRadius: 10, padding: 12, fontSize: 12 },
  formCard: { borderWidth: 1, borderRadius: 14, padding: 15, gap: 10 },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  formTitle: { fontSize: 15, fontWeight: '800' },
  cancelEdit: { fontSize: 12, fontWeight: '700' },
  input: { minHeight: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 13 },
  coordinateRow: { flexDirection: 'row', gap: 8 },
  flexInput: { flex: 1 },
  outlineButton: { minHeight: 44, borderWidth: 1, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7 },
  outlineButtonText: { fontSize: 13, fontWeight: '700' },
  primaryButton: { minHeight: 46, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  sectionTitle: { fontSize: 15, fontWeight: '800' },
  emptyText: { textAlign: 'center', paddingVertical: 20, fontSize: 12 },
  labCard: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 6 },
  labHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  labTitleBox: { flex: 1 },
  labName: { fontSize: 14, fontWeight: '800' },
  labCode: { fontSize: 11, marginTop: 2 },
  stateBadge: { fontSize: 10, fontWeight: '800' },
  coordinates: { fontSize: 12, fontVariant: ['tabular-nums'] },
  address: { fontSize: 11 },
  labActions: { flexDirection: 'row', gap: 8, marginTop: 7 },
  smallButton: { minHeight: 38, flex: 1, borderWidth: 1, borderRadius: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  smallButtonText: { fontSize: 12, fontWeight: '700' },
});
