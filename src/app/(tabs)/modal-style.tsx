/**
 * @file src/app/(tabs)/modal-style.tsx
 * @description Modul Pembelajaran 4: Modal Component & StyleSheet System
 * Referensi Modal: https://reactnative.dev/docs/modal
 * Referensi StyleSheet: https://reactnative.dev/docs/style
 *
 * Konsep Inti yang Dipelajari:
 * 1. Modal: Komponen overlay dialog untuk menampilkan konten di atas layar saat ini.
 * 2. Properti Modal: visible, animationType ('slide' | 'fade' | 'none'), transparent, onRequestClose.
 * 3. StyleSheet.create: Menghasilkan objek style yang efisien secara performa.
 * 4. Komposisi Style: Menggabungkan beberapa style menggunakan format array [style1, kondisi && style2].
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SectionCard } from '@/components/SectionCard';

type AnimationMode = 'slide' | 'fade' | 'none';

export default function ModalStyleScreen(): React.JSX.Element {
  // State untuk visibilitas modal
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // State untuk jenis animasi modal
  const [animationType, setAnimationType] = useState<AnimationMode>('slide');

  // State untuk demonstrasi komposisi StyleSheet dinamis
  const [isHighlightCard, setIsHighlightCard] = useState<boolean>(false);
  const [isRounded, setIsRounded] = useState<boolean>(true);

  return (
    <ScreenContainer
      badge="Modul 4"
      title="Modal & StyleSheet"
      description="Implementasi dialog overlay dengan Modal dan penguasaan teknik styling teroptimasi dengan StyleSheet."
      docUrl="https://reactnative.dev/docs/modal"
    >
      {/* Seksi 1: Kontrol & Buka Modal */}
      <SectionCard
        title="1. Pengujian Modal Overlay"
        subtitle="Tekan tombol di bawah untuk membuka dialog modal sesuai tipe animasi yang dipilih."
      >
        <Text style={styles.label}>Pilih Tipe Animasi:</Text>
        <View style={styles.animRow}>
          {(['slide', 'fade', 'none'] as AnimationMode[]).map((anim) => (
            <TouchableOpacity
              key={anim}
              style={[
                styles.animPill,
                animationType === anim && styles.animPillActive,
              ]}
              onPress={() => setAnimationType(anim)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.animPillText,
                  animationType === anim && styles.animPillTextActive,
                ]}
              >
                {anim}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.btnOpenModal}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.btnOpenText}>Buka Dialog Modal</Text>
        </TouchableOpacity>
      </SectionCard>

      {/* Seksi 2: Demonstrasi Komposisi StyleSheet Dinamis */}
      <SectionCard
        title="2. Teknik Komposisi StyleSheet"
        subtitle="Kombinasi style menggunakan format array [styleDasar, kondisi && styleTambahan]."
      >
        {/* Box yang gayanya berubah berdasarkan state */}
        <View
          style={[
            styles.dynamicBox,
            isHighlightCard && styles.dynamicBoxHighlight,
            isRounded ? styles.boxRounded : styles.boxSquare,
          ]}
        >
          <Text
            style={[
              styles.dynamicBoxTitle,
              isHighlightCard && styles.dynamicBoxTitleHighlight,
            ]}
          >
            {isHighlightCard ? '🌟 Status: Highlighted' : 'Normal Card'}
          </Text>
          <Text style={styles.dynamicBoxDesc}>
            Style diterapkan secara dinamis melalui array styling.
          </Text>
        </View>

        {/* Tombol Toggle Gaya */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.btnToggle, isHighlightCard && styles.btnToggleActive]}
            onPress={() => setIsHighlightCard((prev) => !prev)}
            activeOpacity={0.8}
          >
            <Text style={styles.btnToggleText}>
              {isHighlightCard ? 'Matikan Highlight' : 'Aktifkan Highlight'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnToggle, isRounded && styles.btnToggleActive]}
            onPress={() => setIsRounded((prev) => !prev)}
            activeOpacity={0.8}
          >
            <Text style={styles.btnToggleText}>
              {isRounded ? 'Bentuk: Kotak' : 'Bentuk: Bulat'}
            </Text>
          </TouchableOpacity>
        </View>
      </SectionCard>

      {/* Komponen Modal */}
      <Modal
        animationType={animationType}
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          // Callback saat tombol back fisik di Android ditekan
          setModalVisible(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Konfirmasi Praktikum</Text>
              <Text style={styles.modalBadge}>{animationType}</Text>
            </View>

            <Text style={styles.modalMessage}>
              Ini adalah contoh implementasi komponen &lt;Modal&gt; React Native
              dengan properti transparent={'{true}'} dan animasi &apos;{animationType}&apos;.
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnClose]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalBtnCloseText}>Tutup Dialog</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 8,
  },
  animRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  animPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0a101f',
    alignItems: 'center',
  },
  animPillActive: {
    backgroundColor: '#2563eb',
    borderColor: '#38bdf8',
  },
  animPillText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  animPillTextActive: {
    color: '#ffffff',
  },
  btnOpenModal: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnOpenText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  dynamicBox: {
    backgroundColor: '#0a101f',
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 14,
  },
  dynamicBoxHighlight: {
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 2,
  },
  boxRounded: {
    borderRadius: 14,
  },
  boxSquare: {
    borderRadius: 2,
  },
  dynamicBoxTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  dynamicBoxTitleHighlight: {
    color: '#fbbf24',
  },
  dynamicBoxDesc: {
    fontSize: 13,
    color: '#94a3b8',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnToggle: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1e293b',
    alignItems: 'center',
  },
  btnToggleActive: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  btnToggleText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#131b2e',
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f8fafc',
  },
  modalBadge: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    textTransform: 'uppercase',
  },
  modalMessage: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 22,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  modalBtnClose: {
    backgroundColor: '#2563eb',
  },
  modalBtnCloseText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
  },
});
