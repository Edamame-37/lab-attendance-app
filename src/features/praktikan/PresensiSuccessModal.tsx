
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

interface PresensiSuccessModalProps {
  visible: boolean;
  pesan: string;
  onClose: () => void;
}

export default function PresensiSuccessModal({
  visible,
  pesan,
  onClose,
}: PresensiSuccessModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.iconCircle}>
            <Text style={styles.checkmark}>✓</Text>
          </View>

          <Text style={styles.judul}>Presensi Berhasil</Text>

          <Text style={styles.deskripsi}>
            {pesan || 'Presensimu berhasil dicatat.'}
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={styles.tombol}
          >
            <Text style={styles.tombolText}>Selesai</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  checkmark: {
    color: '#15803D',
    fontSize: 36,
    fontWeight: '700',
  },
  judul: {
    color: '#1E293B',
    fontSize: 21,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  deskripsi: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 24,
  },
  tombol: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },
  tombolText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
