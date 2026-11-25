import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SegmentedControl } from '../../components/common/SegmentedControl';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeToLabs,
  transferAsprakBetweenLabs,
  transferStudentBetweenLabs,
} from '../../services/labService';
import { radius, spacing } from '../../theme';

const TRANSFER_OPTIONS = [
  { value: 'students', label: 'Praktikan', iconName: 'school-outline' },
  { value: 'staff', label: 'Asprak / Aslab', iconName: 'people-outline' },
];

const getMemberIdentifier = (member) => member.uid || member.nomorInduk;

export default function LabTransferScreen() {
  const router = useRouter();
  const { tema } = useApp();
  const { user } = useAuth();
  const [transferType, setTransferType] = useState('students');
  const [labs, setLabs] = useState([]);
  const [fromLabId, setFromLabId] = useState('');
  const [toLabId, setToLabId] = useState('');
  const [memberIdentifier, setMemberIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => subscribeToLabs(
    (updatedLabs) => {
      setLabs(updatedLabs);
      setIsLoading(false);
      setError('');
      setFromLabId((current) => updatedLabs.some((lab) => lab.id === current) ? current : updatedLabs[0]?.id || '');
    },
    (subscriptionError) => {
      setError(subscriptionError.message || 'Daftar laboratorium tidak dapat dimuat.');
      setIsLoading(false);
    },
  ), []);

  const sourceLab = useMemo(
    () => labs.find((lab) => lab.id === fromLabId) || null,
    [fromLabId, labs],
  );
  const targetLabs = useMemo(
    () => labs.filter((lab) => lab.id !== fromLabId && lab.isActive !== false),
    [fromLabId, labs],
  );
  const members = useMemo(() => {
    if (!sourceLab) return [];
    if (transferType === 'students') return sourceLab.studentMembers || [];

    const asprakMembers = (sourceLab.asprakMembers || []).map((member) => ({
      ...member,
      memberType: 'asprak',
    }));
    const aslabMember = sourceLab.aslabId ? [{
      uid: sourceLab.aslabId,
      nomorInduk: sourceLab.aslabId,
      nama: `Aslab (${sourceLab.aslabId})`,
      memberType: 'aslab',
    }] : [];
    return [...aslabMember, ...asprakMembers];
  }, [sourceLab, transferType]);

  const selectTransferType = (nextType) => {
    setTransferType(nextType);
    setMemberIdentifier('');
    setToLabId('');
  };

  const selectSourceLab = (labId) => {
    setFromLabId(labId);
    setMemberIdentifier('');
    setToLabId('');
  };

  const selectedMember = members.find((member) => getMemberIdentifier(member) === memberIdentifier);
  const targetLab = labs.find((lab) => lab.id === toLabId);

  const runTransfer = async () => {
    if (!user?.uid) {
      setError('Sesi Aslab tidak tersedia. Silakan masuk kembali.');
      return;
    }
    if (!fromLabId || !toLabId || !memberIdentifier) {
      setError('Pilih lab asal, anggota, dan lab tujuan.');
      return;
    }

    setIsTransferring(true);
    setError('');
    try {
      if (transferType === 'students') {
        await transferStudentBetweenLabs({
          fromLabId,
          toLabId,
          studentIdentifier: memberIdentifier,
          userId: user.uid,
        });
      } else {
        await transferAsprakBetweenLabs({
          fromLabId,
          toLabId,
          asprakIdentifier: memberIdentifier,
          userId: user.uid,
        });
      }
      setMemberIdentifier('');
      setToLabId('');
      Alert.alert('Transfer Berhasil', 'Anggota dipindahkan tanpa mengubah jadwal praktikum.');
    } catch (transferError) {
      setError(transferError.message || 'Anggota tidak dapat dipindahkan.');
    } finally {
      setIsTransferring(false);
    }
  };

  const confirmTransfer = () => {
    if (!selectedMember || !targetLab) {
      setError('Pilih anggota dan laboratorium tujuan terlebih dahulu.');
      return;
    }
    Alert.alert(
      'Konfirmasi Transfer',
      `Pindahkan ${selectedMember.nama} dari ${sourceLab?.name} ke ${targetLab.name}? Jadwal praktikum tidak akan berubah.`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Pindahkan', onPress: () => void runTransfer() },
      ],
    );
  };

  const renderLabOptions = (items, selectedId, onSelect) => (
    <View style={styles.optionList}>
      {items.map((lab) => {
        const selected = lab.id === selectedId;
        return (
          <TouchableOpacity
            key={lab.id}
            style={[
              styles.optionCard,
              {
                backgroundColor: selected ? tema.accentSurface : tema.surface,
                borderColor: selected ? tema.accent : tema.border,
              },
            ]}
            onPress={() => onSelect(lab.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
          >
            <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={18} color={selected ? tema.accent : tema.textMuted} />
            <View style={styles.optionText}>
              <Text style={[styles.optionTitle, { color: tema.textPrimary }]}>{lab.name}</Text>
              <Text style={[styles.optionSubtitle, { color: tema.textSecondary }]}>{lab.code} · {lab.courseCode || 'Tanpa mata kuliah'}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <ScreenContainer showHeader={false}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}>
          <Ionicons name="arrow-back" size={23} color={tema.textPrimary} />
        </TouchableOpacity>
        <View style={styles.topBarText}>
          <Text style={[styles.pageTitle, { color: tema.textPrimary }]}>Transfer Anggota Lab</Text>
          <Text style={[styles.pageSubtitle, { color: tema.textSecondary }]}>Distribusi anggota tanpa mengubah jadwal</Text>
        </View>
      </View>

      <SegmentedControl
        options={TRANSFER_OPTIONS}
        selectedValue={transferType}
        onSelect={selectTransferType}
      />

      <View style={[styles.notice, { backgroundColor: tema.accentSurface, borderColor: tema.accent }]}>
        <Ionicons name="information-circle-outline" size={20} color={tema.accent} />
        <Text style={[styles.noticeText, { color: tema.accentText }]}>Transfer hanya mengubah distribusi anggota laboratorium. Jadwal dan sesi praktikum tidak dipindahkan.</Text>
      </View>

      {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
      {isLoading ? <ActivityIndicator color={tema.accent} /> : labs.length < 2 ? (
        <Text style={[styles.emptyText, { color: tema.textSecondary }]}>Minimal dua laboratorium diperlukan untuk melakukan transfer.</Text>
      ) : (
        <>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: tema.textPrimary }]}>1. Pilih laboratorium asal</Text>
            {renderLabOptions(labs, fromLabId, selectSourceLab)}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: tema.textPrimary }]}>2. Pilih anggota</Text>
            {members.length === 0 ? (
              <Text style={[styles.emptyText, { color: tema.textSecondary }]}>Tidak ada anggota pada kategori ini di laboratorium asal.</Text>
            ) : (
              <View style={styles.optionList}>
                {members.map((member) => {
                  const identifier = getMemberIdentifier(member);
                  const selected = identifier === memberIdentifier;
                  return (
                    <TouchableOpacity
                      key={`${member.memberType || 'student'}-${identifier}`}
                      style={[
                        styles.optionCard,
                        {
                          backgroundColor: selected ? tema.accentSurface : tema.surface,
                          borderColor: selected ? tema.accent : tema.border,
                        },
                      ]}
                      onPress={() => setMemberIdentifier(identifier)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                    >
                      <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={18} color={selected ? tema.accent : tema.textMuted} />
                      <View style={styles.optionText}>
                        <Text style={[styles.optionTitle, { color: tema.textPrimary }]}>{member.nama}</Text>
                        <Text style={[styles.optionSubtitle, { color: tema.textSecondary }]}>
                          {member.memberType === 'aslab' ? 'ASLAB' : member.nomorInduk}{member.kelas ? ` · ${member.kelas}` : ''}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: tema.textPrimary }]}>3. Pilih laboratorium tujuan</Text>
            {renderLabOptions(targetLabs, toLabId, setToLabId)}
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: tema.accent }, isTransferring && styles.disabledButton]}
            onPress={confirmTransfer}
            disabled={isTransferring}
          >
            {isTransferring ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="swap-horizontal" size={19} color="#FFFFFF" />}
            <Text style={styles.primaryButtonText}>{isTransferring ? 'Memindahkan...' : 'Konfirmasi Transfer'}</Text>
          </TouchableOpacity>
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  topBarText: { flex: 1 },
  pageTitle: { fontSize: 18, fontWeight: '800' },
  pageSubtitle: { fontSize: 11, marginTop: 2 },
  notice: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  noticeText: { flex: 1, fontSize: 11, lineHeight: 17 },
  errorBanner: { color: '#991B1B', backgroundColor: '#FEE2E2', borderRadius: radius.md, padding: spacing.md, fontSize: 12 },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: 14, fontWeight: '800' },
  optionList: { gap: spacing.sm },
  optionCard: { minHeight: 52, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  optionText: { flex: 1 },
  optionTitle: { fontSize: 12, fontWeight: '800' },
  optionSubtitle: { fontSize: 10, marginTop: 2 },
  emptyText: { textAlign: 'center', fontSize: 12, lineHeight: 18, paddingVertical: spacing.lg },
  primaryButton: { minHeight: 48, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  disabledButton: { opacity: 0.6 },
});
