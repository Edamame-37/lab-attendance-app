/**
 * @file src/features/rekap/RekapPresensiView.tsx
 * @description Komponen modular Rekapitulasi Kehadiran untuk Pemrogram 3 (Sprint 1).
 *
 * Fitur Utama:
 * 1. Pemilih sesi praktikum horizontal dengan indikator status sesi (BadgeStatus).
 * 2. Statistik kehadiran & rasio ketercapaian kelas terhadap total praktikan terdaftar.
 * 3. Form pencarian nama/NIM mahasiswa dan filter status kehadiran (Semua, Hadir, Izin, Sakit, Belum Presensi).
 * 4. Tabel/daftar rekap kehadiran praktikan dilengkapi timestamp dan catatan kehadiran.
 * 5. Modal detail kehadiran praktikan saat baris diketuk untuk menampilkan informasi pendukung lengkap.
 * 6. Ringkasan catatan kehadiran pribadi saat berada pada sudut pandang Praktikan.
 */

import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { CatatanPresensi, StatusKehadiran, Pengguna } from '@/types';
import { SectionCard } from '@/components/SectionCard';
import { BadgeStatus } from '@/components/common/BadgeStatus';
import { EmptyState } from '@/components/common/EmptyState';

type FilterStatusRekap = 'SEMUA' | StatusKehadiran | 'BELUM_PRESENSI';

export const RekapPresensiView: React.FC = () => {
  const {
    peranAktif,
    penggunaAktif,
    daftarSesi,
    daftarPraktikan,
    ambilPresensiPerSesi,
    ambilRiwayatPraktikan,
  } = useApp();

  // State sesi yang sedang dipilih
  const [selectedSesiId, setSelectedSesiId] = useState<string>(
    daftarSesi.length > 0 ? daftarSesi[0].id : ''
  );

  // State form pencarian & filter status
  const [kataKunci, setKataKunci] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<FilterStatusRekap>('SEMUA');

  // State modal detail presensi praktikan
  const [detailPresensiAktif, setDetailPresensiAktif] =
    useState<CatatanPresensi | null>(null);
  const [detailBelumPresensiMhs, setDetailBelumPresensiMhs] =
    useState<Pengguna | null>(null);

  const sesiDipilih = useMemo(
    () => daftarSesi.find((s) => s.id === selectedSesiId),
    [daftarSesi, selectedSesiId]
  );

  // Daftar catatan presensi pada sesi terpilih
  const presensiSesiList = useMemo(
    () => (selectedSesiId ? ambilPresensiPerSesi(selectedSesiId) : []),
    [selectedSesiId, ambilPresensiPerSesi]
  );

  // Daftar praktikan terdaftar pada kelas sesi terpilih
  const praktikanKelasTerdaftar = useMemo(() => {
    if (!sesiDipilih) return daftarPraktikan;
    const sesuaiKelas = daftarPraktikan.filter(
      (mhs) => mhs.kelas === sesiDipilih.kelas
    );
    return sesuaiKelas.length > 0 ? sesuaiKelas : daftarPraktikan;
  }, [daftarPraktikan, sesiDipilih]);

  // Daftar praktikan kelas yang belum melakukan presensi pada sesi ini
  const praktikanBelumPresensi = useMemo(() => {
    const idSudahPresensi = new Set(
      presensiSesiList.map((item) => item.praktikanId)
    );
    return praktikanKelasTerdaftar.filter(
      (mhs) => !idSudahPresensi.has(mhs.id)
    );
  }, [praktikanKelasTerdaftar, presensiSesiList]);

  // Statistik per kategori status
  const totalTerdaftar = praktikanKelasTerdaftar.length;
  const totalSudahPresensi = presensiSesiList.length;
  const totalHadir = presensiSesiList.filter(
    (p) => p.statusKehadiran === 'HADIR'
  ).length;
  const totalIzin = presensiSesiList.filter(
    (p) => p.statusKehadiran === 'IZIN'
  ).length;
  const totalSakit = presensiSesiList.filter(
    (p) => p.statusKehadiran === 'SAKIT'
  ).length;
  const totalBelum = praktikanBelumPresensi.length;

  const persentaseKehadiran =
    totalTerdaftar > 0
      ? Math.min(100, Math.round((totalSudahPresensi / totalTerdaftar) * 100))
      : 0;

  // Hasil penyaringan daftar presensi berdasarkan kata kunci dan filter status
  const presensiTersaring = useMemo(() => {
    if (filterStatus === 'BELUM_PRESENSI') {
      return [];
    }
    const query = kataKunci.trim().toLowerCase();
    return presensiSesiList.filter((item) => {
      const cocokStatus =
        filterStatus === 'SEMUA' || item.statusKehadiran === filterStatus;
      const cocokKataKunci =
        query.length === 0 ||
        item.namaPraktikan.toLowerCase().includes(query) ||
        item.nimPraktikan.toLowerCase().includes(query) ||
        (item.catatan && item.catatan.toLowerCase().includes(query));
      return cocokStatus && cocokKataKunci;
    });
  }, [presensiSesiList, filterStatus, kataKunci]);

  // Hasil penyaringan praktikan yang belum presensi
  const belumPresensiTersaring = useMemo(() => {
    const query = kataKunci.trim().toLowerCase();
    return praktikanBelumPresensi.filter(
      (mhs) =>
        query.length === 0 ||
        mhs.nama.toLowerCase().includes(query) ||
        mhs.nomorInduk.toLowerCase().includes(query)
    );
  }, [praktikanBelumPresensi, kataKunci]);

  // Riwayat pribadi jika pengguna aktif adalah praktikan
  const riwayatPribadiPraktikan = useMemo(() => {
    if (peranAktif !== 'praktikan') return [];
    return ambilRiwayatPraktikan(penggunaAktif.id);
  }, [peranAktif, penggunaAktif.id, ambilRiwayatPraktikan]);

  const handleResetFilter = (): void => {
    setKataKunci('');
    setFilterStatus('SEMUA');
  };

  return (
    <View style={styles.rootContainer}>
      {/* Ringkasan Catatan Pribadi Khusus Saat Mode Praktikan Aktif */}
      {peranAktif === 'praktikan' && (
        <SectionCard
          title="Ringkasan Kehadiran Pribadi Saya"
          subtitle={`Catatan presensi untuk ${penggunaAktif.nama} (${penggunaAktif.nomorInduk} - ${penggunaAktif.kelas || 'TI-3A'}):`}
        >
          <View style={styles.personalSummaryRow}>
            <View style={styles.personalStatItem}>
              <Text style={styles.personalStatValue}>
                {riwayatPribadiPraktikan.length}
              </Text>
              <Text style={styles.personalStatLabel}>Sesi Tercatat</Text>
            </View>
            <View style={styles.personalStatDivider} />
            <View style={styles.personalStatItem}>
              <Text style={[styles.personalStatValue, styles.textGreen]}>
                {
                  riwayatPribadiPraktikan.filter(
                    (r) => r.statusKehadiran === 'HADIR'
                  ).length
                }
              </Text>
              <Text style={styles.personalStatLabel}>Status Hadir</Text>
            </View>
            <View style={styles.personalStatDivider} />
            <View style={styles.personalStatItem}>
              <Text style={[styles.personalStatValue, styles.textAmber]}>
                {
                  riwayatPribadiPraktikan.filter(
                    (r) => r.statusKehadiran !== 'HADIR'
                  ).length
                }
              </Text>
              <Text style={styles.personalStatLabel}>Izin / Sakit</Text>
            </View>
          </View>

          {riwayatPribadiPraktikan.length === 0 ? (
            <EmptyState
              iconName="document-text-outline"
              title="Belum Ada Catatan Pribadi"
              description="Anda belum melakukan presensi pada sesi praktikum mana pun."
            />
          ) : (
            <View style={styles.personalListBox}>
              {riwayatPribadiPraktikan.map((catatan) => {
                const infoSesi = daftarSesi.find(
                  (s) => s.id === catatan.sesiId
                );
                return (
                  <TouchableOpacity
                    key={catatan.id}
                    style={styles.personalItemCard}
                    onPress={() => setDetailPresensiAktif(catatan)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.personalItemLeft}>
                      <Text style={styles.personalItemTitle}>
                        {infoSesi?.namaPraktikum || 'Sesi Praktikum'}
                      </Text>
                      <Text style={styles.personalItemSub}>
                        {infoSesi?.kodeMataKuliah || '-'} | Waktu:{' '}
                        {catatan.waktuPresensi}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusPill,
                        catatan.statusKehadiran === 'HADIR' &&
                          styles.statusPillHadir,
                        catatan.statusKehadiran === 'IZIN' &&
                          styles.statusPillIzin,
                        catatan.statusKehadiran === 'SAKIT' &&
                          styles.statusPillSakit,
                      ]}
                    >
                      <Text style={styles.statusPillText}>
                        {catatan.statusKehadiran}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </SectionCard>
      )}

      {/* Pilihan Sesi Praktikum */}
      <SectionCard
        title="Pilih Sesi Praktikum"
        subtitle="Pilih jadwal sesi untuk memantau rekapitulasi kehadiran kelas:"
      >
        {daftarSesi.length === 0 ? (
          <EmptyState
            iconName="calendar-outline"
            title="Tidak Ada Jadwal Sesi"
            description="Belum ada jadwal praktikum yang tersedia untuk direkap."
          />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.sesiSelectorRow}>
              {daftarSesi.map((sesi) => {
                const isSelected = selectedSesiId === sesi.id;
                const jumlahHadirSesi = ambilPresensiPerSesi(sesi.id).length;
                return (
                  <TouchableOpacity
                    key={sesi.id}
                    style={[
                      styles.sesiChip,
                      isSelected && styles.sesiChipActive,
                    ]}
                    onPress={() => {
                      setSelectedSesiId(sesi.id);
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={styles.sesiChipHeader}>
                      <View style={styles.sesiKelasBadge}>
                        <Text
                          style={[
                            styles.sesiChipKelas,
                            isSelected && styles.sesiChipKelasActive,
                          ]}
                        >
                          {sesi.kodeMataKuliah} ({sesi.kelas})
                        </Text>
                      </View>
                      <BadgeStatus status={sesi.status} size="sm" />
                    </View>
                    <Text
                      style={[
                        styles.sesiChipTitle,
                        isSelected && styles.sesiChipTitleActive,
                      ]}
                      numberOfLines={1}
                    >
                      {sesi.namaPraktikum}
                    </Text>
                    <View style={styles.sesiChipFooter}>
                      <View style={styles.sesiMetaInline}>
                        <Ionicons
                          name="time-outline"
                          size={12}
                          color="#94a3b8"
                        />
                        <Text style={styles.sesiChipSub}>
                          {sesi.hari}, {sesi.jamMulai}-{sesi.jamSelesai}
                        </Text>
                      </View>
                      <Text style={styles.sesiCountTag}>
                        {jumlahHadirSesi} tercatat
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        )}
      </SectionCard>

      {/* Rincian Sesi & Ringkasan Statistik Ketercapaian */}
      {sesiDipilih && (
        <SectionCard
          title={`Statistik Kehadiran Kelas ${sesiDipilih.kelas}`}
          subtitle={`${sesiDipilih.namaPraktikum} — ${sesiDipilih.topikMateri}`}
        >
          {/* Informasi Konteks Sesi */}
          <View style={styles.sessionMetaBanner}>
            <View style={styles.sessionMetaRow}>
              <View style={styles.sessionMetaItem}>
                <Ionicons name="location-outline" size={14} color="#38bdf8" />
                <Text style={styles.sessionMetaText}>
                  {sesiDipilih.ruangLab}
                </Text>
              </View>
              <View style={styles.sessionMetaItem}>
                <Ionicons name="person-outline" size={14} color="#38bdf8" />
                <Text style={styles.sessionMetaText}>
                  Asisten: {sesiDipilih.namaAsisten}
                </Text>
              </View>
            </View>
          </View>

          {/* Bar Ketercapaian Kehadiran terhadap Total Mahasiswa Kelas */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>
                Ketercapaian Presensi Kelas ({sesiDipilih.kelas})
              </Text>
              <Text style={styles.progressRatioText}>
                {totalSudahPresensi} dari {totalTerdaftar} Mahasiswa (
                {persentaseKehadiran}%)
              </Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${persentaseKehadiran}%` },
                ]}
              />
            </View>
          </View>

          {/* Grid Angka Statistik */}
          <View style={styles.statGrid}>
            <View style={[styles.statBox, styles.statBoxTotal]}>
              <Text style={styles.statLabel}>Tercatat</Text>
              <Text style={styles.statValue}>{totalSudahPresensi}</Text>
            </View>
            <View style={[styles.statBox, styles.statBoxHadir]}>
              <Text style={styles.statLabel}>Hadir</Text>
              <Text style={[styles.statValue, styles.statValueHadir]}>
                {totalHadir}
              </Text>
            </View>
            <View style={[styles.statBox, styles.statBoxIzin]}>
              <Text style={styles.statLabel}>Izin</Text>
              <Text style={[styles.statValue, styles.statValueIzin]}>
                {totalIzin}
              </Text>
            </View>
            <View style={[styles.statBox, styles.statBoxSakit]}>
              <Text style={styles.statLabel}>Sakit</Text>
              <Text style={[styles.statValue, styles.statValueSakit]}>
                {totalSakit}
              </Text>
            </View>
            <View style={[styles.statBox, styles.statBoxBelum]}>
              <Text style={styles.statLabel}>Belum</Text>
              <Text style={[styles.statValue, styles.statValueBelum]}>
                {totalBelum}
              </Text>
            </View>
          </View>
        </SectionCard>
      )}

      {/* Form Pencarian, Filter Status, & Tabel Daftar Kehadiran */}
      <SectionCard
        title="Daftar Rekapitulasi Praktikan"
        subtitle="Gunakan kolom pencarian atau filter status, lalu ketuk baris praktikan untuk melihat rincian:"
      >
        {/* Form Input Pencarian */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama praktikan, NIM, atau catatan..."
            placeholderTextColor="#64748b"
            value={kataKunci}
            onChangeText={setKataKunci}
          />
          {kataKunci.length > 0 && (
            <TouchableOpacity onPress={() => setKataKunci('')}>
              <Ionicons name="close-circle" size={17} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>

        {/* Baris Chip Filter Status */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          <View style={styles.filterRow}>
            {(
              [
                { key: 'SEMUA', label: `Semua (${totalSudahPresensi})` },
                { key: 'HADIR', label: `Hadir (${totalHadir})` },
                { key: 'IZIN', label: `Izin (${totalIzin})` },
                { key: 'SAKIT', label: `Sakit (${totalSakit})` },
                {
                  key: 'BELUM_PRESENSI',
                  label: `Belum Presensi (${totalBelum})`,
                },
              ] as { key: FilterStatusRekap; label: string }[]
            ).map((opsi) => {
              const aktif = filterStatus === opsi.key;
              return (
                <TouchableOpacity
                  key={opsi.key}
                  style={[
                    styles.filterChip,
                    aktif && styles.filterChipActive,
                  ]}
                  onPress={() => setFilterStatus(opsi.key)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      aktif && styles.filterChipTextActive,
                    ]}
                  >
                    {opsi.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Daftar Praktikan Berdasarkan Mode Filter */}
        {filterStatus === 'BELUM_PRESENSI' ? (
          belumPresensiTersaring.length === 0 ? (
            <EmptyState
              iconName="checkmark-done-circle-outline"
              title="Seluruh Praktikan Sudah Tercatat"
              description={
                kataKunci.trim().length > 0
                  ? 'Tidak ditemukan praktikan yang cocok dengan kata kunci pencarian.'
                  : `Semua praktikan terdaftar di kelas ${sesiDipilih?.kelas || ''} telah melakukan presensi.`
              }
              actionText={
                kataKunci.trim().length > 0 ? 'Reset Pencarian' : undefined
              }
              onActionPress={
                kataKunci.trim().length > 0 ? handleResetFilter : undefined
              }
            />
          ) : (
            belumPresensiTersaring.map((mhs, idx) => (
              <TouchableOpacity
                key={mhs.id}
                style={styles.rekapRowCard}
                onPress={() => setDetailBelumPresensiMhs(mhs)}
                activeOpacity={0.75}
              >
                <View style={styles.rowNumberCol}>
                  <Text style={styles.rowNumberText}>{idx + 1}</Text>
                </View>
                <View style={styles.rowInfoCol}>
                  <Text style={styles.rowNama}>{mhs.nama}</Text>
                  <Text style={styles.rowNim}>
                    NIM: {mhs.nomorInduk} | Kelas {mhs.kelas || '-'}
                  </Text>
                  <Text style={styles.rowBelumHint}>
                    Ketuk untuk melihat status sesi praktikan
                  </Text>
                </View>
                <View style={styles.rowTimeCol}>
                  <View style={[styles.statusPill, styles.statusPillBelum]}>
                    <Text style={styles.statusPillTextBelum}>
                      BELUM PRESENSI
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )
        ) : presensiTersaring.length === 0 ? (
          <EmptyState
            iconName="people-outline"
            title={
              presensiSesiList.length === 0
                ? 'Belum Ada Presensi Masuk'
                : 'Data Presensi Tidak Ditemukan'
            }
            description={
              presensiSesiList.length === 0
                ? sesiDipilih?.status === 'DITUTUP'
                  ? 'Sesi praktikum ini masih berstatus DITUTUP. Asisten perlu membuka sesi terlebih dahulu.'
                  : 'Belum ada praktikan yang mengirimkan catatan kehadiran pada sesi praktikum ini.'
                : 'Tidak ada catatan presensi yang sesuai dengan kata kunci atau filter status yang dipilih.'
            }
            secondaryInfo={
              sesiDipilih
                ? `Status Sesi Saat Ini: ${sesiDipilih.status}`
                : undefined
            }
            actionText={
              kataKunci.trim().length > 0 || filterStatus !== 'SEMUA'
                ? 'Tampilkan Semua Data'
                : undefined
            }
            onActionPress={
              kataKunci.trim().length > 0 || filterStatus !== 'SEMUA'
                ? handleResetFilter
                : undefined
            }
          />
        ) : (
          presensiTersaring.map((mhs, idx) => (
            <TouchableOpacity
              key={mhs.id}
              style={styles.rekapRowCard}
              onPress={() => setDetailPresensiAktif(mhs)}
              activeOpacity={0.75}
            >
              <View style={styles.rowNumberCol}>
                <Text style={styles.rowNumberText}>{idx + 1}</Text>
              </View>

              <View style={styles.rowInfoCol}>
                <Text style={styles.rowNama}>{mhs.namaPraktikan}</Text>
                <Text style={styles.rowNim}>
                  NIM: {mhs.nimPraktikan} | Kelas {mhs.kelasPraktikan}
                </Text>
                {mhs.catatan && (
                  <Text style={styles.rowCatatan} numberOfLines={1}>
                    Catatan: {mhs.catatan}
                  </Text>
                )}
              </View>

              <View style={styles.rowTimeCol}>
                <View
                  style={[
                    styles.statusPill,
                    mhs.statusKehadiran === 'HADIR' && styles.statusPillHadir,
                    mhs.statusKehadiran === 'IZIN' && styles.statusPillIzin,
                    mhs.statusKehadiran === 'SAKIT' && styles.statusPillSakit,
                  ]}
                >
                  <Text style={styles.statusPillText}>
                    {mhs.statusKehadiran}
                  </Text>
                </View>
                <View style={styles.timestampBox}>
                  <Ionicons name="time-outline" size={11} color="#94a3b8" />
                  <Text style={styles.timestampText}>{mhs.waktuPresensi}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </SectionCard>

      {/* Modal Detail Catatan Kehadiran Praktikan */}
      <Modal
        visible={detailPresensiAktif !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDetailPresensiAktif(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons
                  name="document-text-outline"
                  size={19}
                  color="#38bdf8"
                />
                <Text style={styles.modalTitle}>Rincian Catatan Presensi</Text>
              </View>
              <TouchableOpacity onPress={() => setDetailPresensiAktif(null)}>
                <Ionicons name="close" size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {detailPresensiAktif && (
              <View style={styles.modalDetailBody}>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Nama Praktikan:</Text>
                  <Text style={styles.modalInfoValue}>
                    {detailPresensiAktif.namaPraktikan}
                  </Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>NIM:</Text>
                  <Text style={styles.modalInfoValue}>
                    {detailPresensiAktif.nimPraktikan}
                  </Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Kelas:</Text>
                  <Text style={styles.modalInfoValue}>
                    {detailPresensiAktif.kelasPraktikan}
                  </Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Waktu Presensi:</Text>
                  <Text style={styles.modalInfoHighlight}>
                    {detailPresensiAktif.waktuPresensi}
                  </Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Status Kehadiran:</Text>
                  <View
                    style={[
                      styles.statusPill,
                      detailPresensiAktif.statusKehadiran === 'HADIR' &&
                        styles.statusPillHadir,
                      detailPresensiAktif.statusKehadiran === 'IZIN' &&
                        styles.statusPillIzin,
                      detailPresensiAktif.statusKehadiran === 'SAKIT' &&
                        styles.statusPillSakit,
                    ]}
                  >
                    <Text style={styles.statusPillText}>
                      {detailPresensiAktif.statusKehadiran}
                    </Text>
                  </View>
                </View>
                <View style={styles.modalCatatanBox}>
                  <Text style={styles.modalInfoLabel}>
                    Keterangan / Catatan Praktikan:
                  </Text>
                  <Text style={styles.modalCatatanText}>
                    {detailPresensiAktif.catatan ||
                      'Tidak ada catatan tambahan.'}
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.modalBtnPrimary}
              onPress={() => setDetailPresensiAktif(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalBtnPrimaryText}>Tutup Rincian</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Informasi Praktikan yang Belum Presensi */}
      <Modal
        visible={detailBelumPresensiMhs !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDetailBelumPresensiMhs(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons
                  name="alert-circle-outline"
                  size={19}
                  color="#fbbf24"
                />
                <Text style={styles.modalTitle}>Status Belum Presensi</Text>
              </View>
              <TouchableOpacity
                onPress={() => setDetailBelumPresensiMhs(null)}
              >
                <Ionicons name="close" size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {detailBelumPresensiMhs && (
              <View style={styles.modalDetailBody}>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Nama Mahasiswa:</Text>
                  <Text style={styles.modalInfoValue}>
                    {detailBelumPresensiMhs.nama}
                  </Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>NIM:</Text>
                  <Text style={styles.modalInfoValue}>
                    {detailBelumPresensiMhs.nomorInduk}
                  </Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Kelas Terdaftar:</Text>
                  <Text style={styles.modalInfoValue}>
                    {detailBelumPresensiMhs.kelas || '-'}
                  </Text>
                </View>
                <View style={styles.modalCatatanBox}>
                  <Text style={styles.modalInfoLabel}>Keterangan Sistem:</Text>
                  <Text style={styles.modalCatatanText}>
                    Mahasiswa ini terdaftar pada kelas{' '}
                    {sesiDipilih?.kelas || '-'}, namun belum mengirimkan
                    presensi pada sesi {sesiDipilih?.namaPraktikum || ''}.
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.modalBtnPrimary}
              onPress={() => setDetailBelumPresensiMhs(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalBtnPrimaryText}>Mengerti</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    width: '100%',
  },
  personalSummaryRow: {
    flexDirection: 'row',
    backgroundColor: '#0a101f',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  personalStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  personalStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#1e293b',
  },
  personalStatValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#38bdf8',
  },
  personalStatLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 2,
  },
  textGreen: {
    color: '#4ade80',
  },
  textAmber: {
    color: '#fbbf24',
  },
  personalListBox: {
    gap: 8,
  },
  personalItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0a101f',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 10,
  },
  personalItemLeft: {
    flex: 1,
  },
  personalItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 2,
  },
  personalItemSub: {
    fontSize: 11,
    color: '#94a3b8',
  },
  sesiSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  sesiChip: {
    backgroundColor: '#0a101f',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    minWidth: 225,
  },
  sesiChipActive: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  sesiChipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  sesiKelasBadge: {
    flexShrink: 1,
  },
  sesiChipKelas: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  sesiChipKelasActive: {
    color: '#38bdf8',
  },
  sesiChipTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 6,
  },
  sesiChipTitleActive: {
    color: '#ffffff',
  },
  sesiChipFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 6,
  },
  sesiMetaInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sesiChipSub: {
    fontSize: 11,
    color: '#64748b',
  },
  sesiCountTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38bdf8',
  },
  sessionMetaBanner: {
    backgroundColor: '#0a101f',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 12,
  },
  sessionMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  sessionMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sessionMetaText: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  progressSection: {
    marginBottom: 14,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  progressRatioText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38bdf8',
  },
  progressBarTrack: {
    width: '100%',
    height: 8,
    backgroundColor: '#0a101f',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 4,
  },
  statGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#0a101f',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  statBoxTotal: {
    borderColor: '#38bdf8',
  },
  statBoxHadir: {
    borderColor: '#22c55e',
  },
  statBoxIzin: {
    borderColor: '#f59e0b',
  },
  statBoxSakit: {
    borderColor: '#ef4444',
  },
  statBoxBelum: {
    borderColor: '#64748b',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#f8fafc',
  },
  statValueHadir: {
    color: '#4ade80',
  },
  statValueIzin: {
    color: '#fbbf24',
  },
  statValueSakit: {
    color: '#f87171',
  },
  statValueBelum: {
    color: '#94a3b8',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a101f',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 13,
    paddingVertical: 2,
  },
  filterScroll: {
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#0a101f',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#38bdf8',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  rekapRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a101f',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 10,
  },
  rowNumberCol: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#131b2e',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  rowNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  rowInfoCol: {
    flex: 1,
  },
  rowNama: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 2,
  },
  rowNim: {
    fontSize: 11,
    color: '#94a3b8',
  },
  rowCatatan: {
    fontSize: 11,
    color: '#cbd5e1',
    fontStyle: 'italic',
    marginTop: 2,
  },
  rowBelumHint: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  rowTimeCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusPillHadir: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: '#22c55e',
  },
  statusPillIzin: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#f59e0b',
  },
  statusPillSakit: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444',
  },
  statusPillBelum: {
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
    borderColor: '#475569',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  statusPillTextBelum: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
  },
  timestampBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timestampText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    backgroundColor: '#131b2e',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  modalDetailBody: {
    backgroundColor: '#0a101f',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 10,
    marginBottom: 16,
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#131b2e',
  },
  modalInfoLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  modalInfoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f8fafc',
  },
  modalInfoHighlight: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38bdf8',
  },
  modalCatatanBox: {
    paddingTop: 4,
    gap: 4,
  },
  modalCatatanText: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  modalBtnPrimary: {
    backgroundColor: '#2563eb',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalBtnPrimaryText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
