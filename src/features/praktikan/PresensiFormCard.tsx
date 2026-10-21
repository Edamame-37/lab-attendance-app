
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from 'react-native';
import type { JadwalSesi, StatusKehadiran } from '@/types';

interface PresensiFormCardProps {
  sesi: JadwalSesi;
  sudahPresensi: boolean;
  onSubmit: (
    status: StatusKehadiran,
    catatan: string
  ) => { sukses: boolean; pesan: string };
}

const pilihanStatus: {
  label: string;
  value: StatusKehadiran;
}[] = [
  { label: 'Hadir', value: 'HADIR' },
  { label: 'Izin', value: 'IZIN' },
  { label: 'Sakit', value: 'SAKIT' },
];

export default function PresensiFormCard({
  sesi,
  sudahPresensi,
  onSubmit,
}: PresensiFormCardProps) {
  const [statusKehadiran, setStatusKehadiran] =
    useState<StatusKehadiran>('HADIR');
  const [catatan, setCatatan] = useState('');
  const [pesanError, setPesanError] = useState('');

  const sesiDibuka = sesi.status === 'DIBUKA';
  const formNonaktif = !sesiDibuka || sudahPresensi;

  const handleSubmit = () => {
    setPesanError('');

    if (!sesiDibuka) {
      setPesanError('Presensi hanya dapat dilakukan saat sesi dibuka.');
      return;
    }

    if (sudahPresensi) {
      setPesanError('Kamu sudah melakukan presensi pada sesi ini.');
      return;
    }

    const hasil = onSubmit(statusKehadiran, catatan.trim());

    if (!hasil.sukses) {
      setPesanError(hasil.pesan);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.judul}>Form Presensi</Text>
      <Text style={styles.deskripsi}>
        Pilih status kehadiranmu dan isi catatan jika diperlukan.
      </Text>

      <View style={styles.infoSesi}>
        <Text style={styles.namaPraktikum}>
          {sesi.namaPraktikum}
        </Text>
        <Text style={styles.infoText}>
          {sesi.kodeMataKuliah} · Kelas {sesi.kelas}
        </Text>
        <Text style={styles.infoText}>
          {sesi.hari}, {sesi.jamMulai}–{sesi.jamSelesai}
        </Text>
        <Text style={styles.infoText}>
          Ruang: {sesi.ruangLab}
        </Text>
      </View>

      {!sesiDibuka && (
        <Text style={styles.peringatan}>
          Sesi belum dibuka atau sudah selesai.
        </Text>
      )}

      {sudahPresensi && (
        <Text style={styles.peringatan}>
          Kamu sudah presensi pada sesi ini.
        </Text>
      )}

      <Text style={styles.label}>Status Kehadiran</Text>

      <View style={styles.pilihanContainer}>
        {pilihanStatus.map((pilihan) => {
          const terpilih =
            statusKehadiran === pilihan.value;

          return (
            <Pressable
              key={pilihan.value}
              disabled={formNonaktif}
              onPress={() => setStatusKehadiran(pilihan.value)}
              style={[
                styles.pilihan,
                terpilih && styles.pilihanTerpilih,
                formNonaktif && styles.nonaktif,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ checked: terpilih }}
            >
              <Text
                style={[
                  styles.pilihanText,
                  terpilih && styles.pilihanTextTerpilih,
                ]}
              >
                {pilihan.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Catatan (opsional)</Text>

      <TextInput
        value={catatan}
        onChangeText={setCatatan}
        placeholder="Contoh: izin karena ada keperluan"
        placeholderTextColor="#8A94A6"
        multiline
        numberOfLines={3}
        editable={!formNonaktif}
        textAlignVertical="top"
        style={[
          styles.input,
          formNonaktif && styles.inputNonaktif,
        ]}
      />

      {pesanError !== '' && (
        <Text style={styles.errorText}>{pesanError}</Text>
      )}

      <Pressable
        onPress={handleSubmit}
        disabled={formNonaktif}
        style={[
          styles.tombol,
          formNonaktif && styles.tombolNonaktif,
        ]}
      >
        <Text style={styles.tombolText}>
          {sudahPresensi ? 'Sudah Presensi' : 'Kirim Presensi'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  judul: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  deskripsi: {
    fontSize: 14,
    lineHeight: 20,
    color: '#64748B',
    marginBottom: 16,
  },
  infoSesi: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    gap: 5,
  },
  namaPraktikum: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 3,
  },
  infoText: {
    fontSize: 13,
    color: '#475569',
  },
  peringatan: {
    color: '#B45309',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 9,
    marginTop: 5,
  },
  pilihanContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  pilihan: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  pilihanTerpilih: {
    backgroundColor: '#DBEAFE',
    borderColor: '#2563EB',
  },
  pilihanText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  pilihanTextTerpilih: {
    color: '#1D4ED8',
  },
  nonaktif: {
    opacity: 0.5,
  },
  input: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 12,
    color: '#1E293B',
    fontSize: 14,
    marginBottom: 16,
  },
  inputNonaktif: {
    backgroundColor: '#F1F5F9',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    marginBottom: 12,
  },
  tombol: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  tombolNonaktif: {
    backgroundColor: '#94A3B8',
  },
  tombolText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});