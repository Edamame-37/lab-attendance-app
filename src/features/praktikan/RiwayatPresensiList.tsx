
import { StyleSheet, Text, View } from 'react-native';
import type { CatatanPresensi, JadwalSesi } from '@/types';

interface RiwayatPresensiListProps {
  riwayat: CatatanPresensi[];
  daftarSesi: JadwalSesi[];
}

function formatStatus(status: CatatanPresensi['statusKehadiran']) {
  switch (status) {
    case 'HADIR':
      return 'Hadir';
    case 'IZIN':
      return 'Izin';
    case 'SAKIT':
      return 'Sakit';
    default:
      return status;
  }
}

export default function RiwayatPresensiList({
  riwayat,
  daftarSesi,
}: RiwayatPresensiListProps) {
  // AppContext menambahkan presensi baru di awal array.
  const riwayatTerurut = riwayat;

  if (riwayatTerurut.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>Belum Ada Riwayat</Text>
        <Text style={styles.emptyDescription}>
          Riwayat presensimu akan ditampilkan di sini setelah kamu
          mengisi presensi pada sesi praktikum.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {riwayatTerurut.map((item) => {
        const sesi = daftarSesi.find(
          (dataSesi) => dataSesi.id === item.sesiId
        );

        return (
          <View key={item.id} style={styles.card}>
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.namaPraktikum}>
                  {sesi?.namaPraktikum ?? 'Sesi Praktikum'}
                </Text>
                <Text style={styles.kodeMataKuliah}>
                  {sesi?.kodeMataKuliah ?? 'Kode mata kuliah tidak tersedia'}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  item.statusKehadiran === 'HADIR'
                    ? styles.statusHadir
                    : styles.statusLain,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    item.statusKehadiran === 'HADIR'
                      ? styles.statusTextHadir
                      : styles.statusTextLain,
                  ]}
                >
                  {formatStatus(item.statusKehadiran)}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.detail}>
              Kelas: {item.kelasPraktikan}
            </Text>
            <Text style={styles.detail}>
              NIM: {item.nimPraktikan}
            </Text>
            <Text style={styles.detail}>
              Waktu presensi: {item.waktuPresensi}
            </Text>

            {item.catatan ? (
              <View style={styles.catatanBox}>
                <Text style={styles.catatanLabel}>Catatan</Text>
                <Text style={styles.catatanText}>{item.catatan}</Text>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  namaPraktikum: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  kodeMataKuliah: {
    fontSize: 13,
    color: '#64748B',
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusHadir: {
    backgroundColor: '#DCFCE7',
  },
  statusLain: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusTextHadir: {
    color: '#166534',
  },
  statusTextLain: {
    color: '#92400E',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  detail: {
    fontSize: 13,
    lineHeight: 21,
    color: '#475569',
  },
  catatanBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  catatanLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  catatanText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: '#64748B',
    textAlign: 'center',
  },
});
