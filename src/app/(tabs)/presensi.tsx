/**
 * @file src/app/(tabs)/presensi.tsx
 * @description Layar Pencatatan Presensi Praktikan dan Riwayat Kehadiran Pribadi (Pemrogram 2).
 *
 * Menerapkan prinsip non-AI-slop & breathing room:
 * - SegmentedControl native kontinu (Hadir, Izin, Sakit) menggantikan tombol terpencar.
 * - Formulir dinamis dan mikro-tipografi humanis (label, petunjuk syarat, placeholder kontekstual).
 * - Tombol aksi kontekstual sesuai status kehadiran yang dipilih.
 * - Riwayat Presensi Saya menggunakan Grouped Inset List yang teratur dan lapang.
 * - Menggunakan tema dinamis (Light Mode Warm Stone vs Dark Mode Obsidian).
 */

import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import type { StatusKehadiran } from '@/types';
import { ScreenContainer } from '@/components/ScreenContainer';
import {
  SectionHeader,
  GroupedInsetList,
  GroupedInsetItem,
} from '@/components/common/GroupedInsetList';
import { EmptyState } from '@/components/common/EmptyState';
import {
  SegmentedControl,
  SegmentOption,
} from '@/components/common/SegmentedControl';
import { radius, spacing } from '@/theme';

export default function PresensiScreen(): React.JSX.Element {
  const {
    peranAktif,
    penggunaAktif,
    daftarSesi,
    catatPresensi,
    cekSudahPresensi,
    ambilRiwayatPraktikan,
    gantiPeran,
    tema,
    modeTema,
  } = useApp();

  // Sesi praktikum yang saat ini berstatus 'DIBUKA'
  const sesiDibukaList = daftarSesi.filter((s) => s.status === 'DIBUKA');

  // State form presensi
  const [selectedSesiId, setSelectedSesiId] = useState<string>(
    sesiDibukaList.length > 0 ? sesiDibukaList[0].id : ''
  );
  const [statusKehadiran, setStatusKehadiran] =
    useState<StatusKehadiran>('HADIR');
  const [catatan, setCatatan] = useState<string>('');

  // Sinkronisasi sesi terpilih jika status sesi berubah
  useEffect(() => {
    const sesiMasihDibuka = sesiDibukaList.some(
      (sesi) => sesi.id === selectedSesiId
    );

    if (!sesiMasihDibuka && sesiDibukaList.length > 0) {
      setSelectedSesiId(sesiDibukaList[0].id);
    }
  }, [daftarSesi, selectedSesiId]);

  // State dialog modal hasil presensi
  const [modalSuksesVisible, setModalSuksesVisible] = useState<boolean>(false);
  const [pesanSukses, setPesanSukses] = useState<string>('');
  const [errorPesan, setErrorPesan] = useState<string>('');

  // Data sesi yang dipilih
  const sesiDipilih = daftarSesi.find((s) => s.id === selectedSesiId);

  // Periksa apakah mahasiswa aktif sudah pernah presensi di sesi yang dipilih
  const sudahPresensi = selectedSesiId
    ? cekSudahPresensi(selectedSesiId, penggunaAktif.id)
    : false;

  // Riwayat presensi khusus untuk mahasiswa aktif
  const riwayatSaya = ambilRiwayatPraktikan(penggunaAktif.id);

  // Opsi status kehadiran untuk SegmentedControl
  const statusOptions: SegmentOption<StatusKehadiran>[] = [
    { value: 'HADIR', label: 'Hadir', iconName: 'checkmark-circle-outline' },
    { value: 'IZIN', label: 'Izin', iconName: 'mail-outline' },
    { value: 'SAKIT', label: 'Sakit', iconName: 'medkit-outline' },
  ];

  /**
   * Konfigurasi dinamis formulir berdasarkan status kehadiran yang dipilih
   */
  let noteLabel = 'Catatan Kehadiran';
  let noteHint = '(Opsional)';
  let notePlaceholder = 'Misal: Meja PC-04 / Hadir tepat waktu di lab';
  let ctaText = 'Konfirmasi Hadir di Lab';
  let ctaBgColor = tema.statusHadir;
  let ctaIcon: keyof typeof Ionicons.glyphMap = 'checkmark-circle-outline';

  if (statusKehadiran === 'IZIN') {
    noteLabel = 'Alasan & Keterangan Izin';
    noteHint = '(Disyaratkan)';
    notePlaceholder = 'Misal: Mengikuti kompetisi / surat dispensasi terlampir';
    ctaText = 'Kirim Permohonan Izin';
    ctaBgColor = modeTema === 'dark' ? '#6366F1' : '#4F46E5';
    ctaIcon = 'mail-outline';
  } else if (statusKehadiran === 'SAKIT') {
    noteLabel = 'Keterangan Kondisi Sakit';
    noteHint = '(Disyaratkan)';
    notePlaceholder = 'Misal: Istirahat rawat jalan / surat dokter menyusul';
    ctaText = 'Laporkan Keterangan Sakit';
    ctaBgColor = '#D97706';
    ctaIcon = 'medkit-outline';
  }

  /**
   * Handler pengiriman presensi
   */
  const handleKirimPresensi = (): void => {
    setErrorPesan('');
    if (!selectedSesiId) {
      setErrorPesan('Tidak ada sesi praktikum yang sedang dibuka saat ini.');
      return;
    }

    if (
      (statusKehadiran === 'IZIN' || statusKehadiran === 'SAKIT') &&
      !catatan.trim()
    ) {
      setErrorPesan(
        `Silakan cantumkan keterangan atau alasan ${statusKehadiran.toLowerCase()}.`
      );
      return;
    }

    const hasil = catatPresensi(selectedSesiId, statusKehadiran, catatan);
    if (hasil.sukses) {
      setPesanSukses(hasil.pesan);
      setModalSuksesVisible(true);
      setCatatan('');
    } else {
      setErrorPesan(hasil.pesan);
    }
  };

  return (
    <ScreenContainer>
      {/* SECTION 1: FORMULIR PRESENSI */}
      <SectionHeader title="Formulir Kehadiran" isFirst />

      {peranAktif === 'asisten' ? (
        /* Tampilan Khusus Asisten */
        <View
          style={[
            styles.card,
            styles.asistenNoticeCard,
            {
              backgroundColor: tema.surface,
              borderColor: tema.border,
            },
          ]}
        >
          <View
            style={[
              styles.asistenIconCircle,
              { backgroundColor: tema.accentSurface },
            ]}
          >
            <Ionicons name="eye-outline" size={22} color={tema.accentText} />
          </View>
          <Text style={[styles.asistenTitle, { color: tema.textPrimary }]}>
            Mode Asisten Praktikum
          </Text>
          <Text style={[styles.asistenDesc, { color: tema.textSecondary }]}>
            Asisten memantau kehadiran mahasiswa melalui tab{' '}
            <Text style={{ fontWeight: '700', color: tema.textPrimary }}>
              Rekap
            </Text>
            . Beralih ke peran Praktikan untuk menguji pengisian formulir.
          </Text>
          <TouchableOpacity
            style={[
              styles.btnSwitchRole,
              {
                backgroundColor: tema.surfaceRaised,
                borderColor: tema.border,
              },
            ]}
            onPress={() => gantiPeran('praktikan')}
            activeOpacity={0.7}
          >
            <Ionicons name="swap-horizontal" size={16} color={tema.textPrimary} />
            <Text style={[styles.btnSwitchRoleText, { color: tema.textPrimary }]}>
              Beralih ke Peran Praktikan
            </Text>
          </TouchableOpacity>
        </View>
      ) : sesiDibukaList.length === 0 ? (
        /* Jika Tidak Ada Sesi Dibuka */
        <View
          style={[
            styles.card,
            {
              backgroundColor: tema.surface,
              borderColor: tema.border,
              alignItems: 'center',
              paddingVertical: 24,
            },
          ]}
        >
          <Ionicons
            name="alert-circle-outline"
            size={36}
            color={tema.textMuted}
            style={{ marginBottom: 8 }}
          />
          <Text style={[styles.cardTitle, { color: tema.textPrimary }]}>
            Tidak Ada Sesi Dibuka
          </Text>
          <Text
            style={[
              styles.asistenDesc,
              { color: tema.textSecondary, textAlign: 'center', maxWidth: 300 },
            ]}
          >
            Formulir presensi hanya aktif saat asisten laboratorium telah membuka
            sesi praktikum.
          </Text>
        </View>
      ) : sudahPresensi ? (
        /* Tampilan Setelah Presensi Berhasil Dicatat */
        <View
          style={[
            styles.card,
            {
              backgroundColor: tema.surface,
              borderColor: tema.border,
            },
          ]}
        >
          <View
            style={[
              styles.receiptBox,
              {
                backgroundColor: tema.statusHadirBg,
                borderColor: tema.statusHadirBorder,
              },
            ]}
          >
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={tema.statusHadir}
            />
            <Text
              style={[
                styles.receiptText,
                { color: tema.statusHadir },
              ]}
            >
              Presensi Berhasil Diverifikasi
            </Text>
          </View>

          <View style={styles.verifiedMetaList}>
            <View style={styles.verifiedMetaRow}>
              <Text style={[styles.verifiedMetaKey, { color: tema.textSecondary }]}>
                Praktikum:
              </Text>
              <Text
                style={[styles.verifiedMetaVal, { color: tema.textPrimary }]}
              >
                {sesiDipilih?.namaPraktikum}
              </Text>
            </View>

            <View style={styles.verifiedMetaRow}>
              <Text style={[styles.verifiedMetaKey, { color: tema.textSecondary }]}>
                Kelas & Lab:
              </Text>
              <Text
                style={[styles.verifiedMetaVal, { color: tema.textPrimary }]}
              >
                Kelas {sesiDipilih?.kelas} · {sesiDipilih?.ruangLab}
              </Text>
            </View>

            <View style={styles.verifiedMetaRow}>
              <Text style={[styles.verifiedMetaKey, { color: tema.textSecondary }]}>
                Status:
              </Text>
              <Text
                style={[
                  styles.verifiedMetaVal,
                  { color: tema.statusHadir, fontWeight: '700' },
                ]}
              >
                Tercatat ({statusKehadiran})
              </Text>
            </View>
          </View>
        </View>
      ) : (
        /* Formulir Pengisian Presensi Praktikan */
        <View
          style={[
            styles.card,
            {
              backgroundColor: tema.surface,
              borderColor: tema.border,
            },
          ]}
        >
          {/* Header Formulir */}
          <View style={styles.formHeader}>
            <Text style={[styles.cardTitle, { color: tema.textPrimary }]}>
              {sesiDipilih?.namaPraktikum}
            </Text>
            <Text style={[styles.formSub, { color: tema.textSecondary }]}>
              {sesiDipilih?.topikMateri} · Kelas {sesiDipilih?.kelas}
            </Text>
          </View>

          {/* Pemilih Status Kehadiran (Segmented Control) */}
          <View style={styles.fieldBlock}>
            <View style={styles.labelRow}>
              <Text style={[styles.fieldLabel, { color: tema.textPrimary }]}>
                Status Kehadiran
              </Text>
              <Text style={[styles.fieldSubHint, { color: tema.textMuted }]}>
                Pilih salah satu
              </Text>
            </View>
            <SegmentedControl
              options={statusOptions}
              selectedValue={statusKehadiran}
              onSelect={(val) => {
                setStatusKehadiran(val);
                setErrorPesan('');
              }}
            />
          </View>

          {/* Input Catatan Kehadiran */}
          <View style={styles.fieldBlock}>
            <View style={styles.labelRow}>
              <Text style={[styles.fieldLabel, { color: tema.textPrimary }]}>
                {noteLabel}
              </Text>
              <Text style={[styles.fieldSubHint, { color: tema.textMuted }]}>
                {noteHint}
              </Text>
            </View>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: tema.surfaceRaised,
                  borderColor: errorPesan ? '#EF4444' : tema.border,
                  color: tema.textPrimary,
                },
              ]}
              placeholder={notePlaceholder}
              placeholderTextColor={tema.textMuted}
              value={catatan}
              onChangeText={(text) => {
                setCatatan(text);
                if (errorPesan) setErrorPesan('');
              }}
            />
            {errorPesan ? (
              <Text style={styles.errorText}>{errorPesan}</Text>
            ) : null}
          </View>

          {/* Tombol Aksi Kontekstual */}
          <TouchableOpacity
            style={[styles.btnSubmit, { backgroundColor: ctaBgColor }]}
            onPress={handleKirimPresensi}
            activeOpacity={0.8}
          >
            <Ionicons name={ctaIcon} size={17} color="#FFFFFF" />
            <Text style={styles.btnSubmitText}>{ctaText}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* SECTION 2: RIWAYAT PRESENSI SAYA */}
      <SectionHeader title="Riwayat Presensi Saya" />
      {riwayatSaya.length === 0 ? (
        <EmptyState
          title="Belum Ada Riwayat Presensi"
          description="Catatan kehadiran Anda akan otomatis terarsip setelah melakukan presensi."
        />
      ) : (
        <GroupedInsetList>
          {riwayatSaya.map((riwayat, index) => {
            const sesi = daftarSesi.find((s) => s.id === riwayat.sesiId);
            const isHadir = riwayat.statusKehadiran === 'HADIR';
            const isIzin = riwayat.statusKehadiran === 'IZIN';
            const badgeColor = isHadir
              ? tema.statusHadir
              : isIzin
              ? '#6366F1'
              : '#D97706';

            return (
              <GroupedInsetItem
                key={riwayat.id}
                title={sesi?.topikMateri || 'Sesi Praktikum'}
                subtitle={`${riwayat.waktuPresensi} WIB · ${
                  sesi?.ruangLab || 'Lab RPL'
                }${riwayat.catatan ? ` · ${riwayat.catatan}` : ''}`}
                isLast={index === riwayatSaya.length - 1}
                rightElement={
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: tema.surfaceRaised },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: badgeColor },
                      ]}
                    >
                      {riwayat.statusKehadiran}
                    </Text>
                  </View>
                }
              />
            );
          })}
        </GroupedInsetList>
      )}

      {/* Modal Dialog Umpan Balik Sukses */}
      <Modal
        visible={modalSuksesVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalSuksesVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: tema.surface,
                borderColor: tema.border,
              },
            ]}
          >
            <View
              style={[
                styles.modalIconCircle,
                { backgroundColor: tema.statusHadirBg },
              ]}
            >
              <Ionicons
                name="checkmark"
                size={28}
                color={tema.statusHadir}
              />
            </View>

            <Text style={[styles.modalTitle, { color: tema.textPrimary }]}>
              Presensi Berhasil Dicatat
            </Text>
            <Text style={[styles.modalDesc, { color: tema.textSecondary }]}>
              {pesanSukses}
            </Text>

            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: tema.accent }]}
              onPress={() => setModalSuksesVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalBtnText}>Selesai</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    gap: 14,
  },
  formHeader: {
    gap: 3,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  formSub: {
    fontSize: 12,
    fontWeight: '500',
  },
  fieldBlock: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  fieldSubHint: {
    fontSize: 11,
    fontWeight: '500',
  },
  textInput: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  btnSubmit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: radius.md,
    gap: 8,
    minHeight: 44,
    marginTop: 2,
  },
  btnSubmitText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  asistenNoticeCard: {
    alignItems: 'center',
    textAlign: 'center',
    paddingVertical: 24,
  },
  asistenIconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  asistenTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  asistenDesc: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  btnSwitchRole: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 8,
    marginTop: 4,
  },
  btnSwitchRoleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  receiptBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 8,
  },
  receiptText: {
    fontSize: 13,
    fontWeight: '700',
  },
  verifiedMetaList: {
    gap: 8,
    paddingTop: 2,
  },
  verifiedMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verifiedMetaKey: {
    fontSize: 12,
    fontWeight: '500',
  },
  verifiedMetaVal: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.gutter,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalIconCircle: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  modalBtn: {
    width: '100%',
    paddingVertical: 11,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
