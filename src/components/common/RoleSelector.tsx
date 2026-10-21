/**
 * @file src/components/common/RoleSelector.tsx
 * @description Komponen pemilih peran (Praktikan vs Asisten Praktikum) dan identitas pengguna aktif.
 * Memudahkan pengujian sprint dari dua sudut pandang peran secara responsif tanpa simbol emoji.
 */

import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useApp } from '@/context/AppContext';
import { Ionicons } from '@expo/vector-icons';

export const RoleSelector: React.FC = () => {
  const {
    peranAktif,
    penggunaAktif,
    daftarAsisten,
    daftarPraktikan,
    gantiPeran,
    gantiPengguna,
  } = useApp();

  const daftarPenggunaSesuaiPeran =
    peranAktif === 'asisten' ? daftarAsisten : daftarPraktikan;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.labelContainer}>
          <Ionicons name="people-outline" size={16} color="#38bdf8" />
          <Text style={styles.title}>Simulasi Peran Pengguna</Text>
        </View>
        <View style={styles.currentBadgeBox}>
          <Ionicons
            name={peranAktif === 'asisten' ? 'shield-checkmark-outline' : 'person-circle-outline'}
            size={12}
            color="#38bdf8"
          />
          <Text style={styles.currentBadge}>
            {peranAktif === 'asisten' ? 'Mode Asisten' : 'Mode Praktikan'}
          </Text>
        </View>
      </View>

      {/* Toggle Peran */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            peranAktif === 'praktikan' && styles.tabButtonActive,
          ]}
          onPress={() => gantiPeran('praktikan')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="school-outline"
            size={16}
            color={peranAktif === 'praktikan' ? '#ffffff' : '#64748b'}
          />
          <Text
            style={[
              styles.tabText,
              peranAktif === 'praktikan' && styles.tabTextActive,
            ]}
          >
            Praktikan ({daftarPraktikan.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            peranAktif === 'asisten' && styles.tabButtonActive,
          ]}
          onPress={() => gantiPeran('asisten')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="briefcase-outline"
            size={16}
            color={peranAktif === 'asisten' ? '#ffffff' : '#64748b'}
          />
          <Text
            style={[
              styles.tabText,
              peranAktif === 'asisten' && styles.tabTextActive,
            ]}
          >
            Asisten Praktikum ({daftarAsisten.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Pilihan Akun Pengguna Aktif */}
      <View style={styles.userSection}>
        <View style={styles.userHeaderRow}>
          <Text style={styles.userLabel}>Pilih Identitas Pengguna:</Text>
          <Text style={styles.activeUserHint}>
            Aktif: {penggunaAktif.nama}
            {penggunaAktif.kelas ? ` (${penggunaAktif.kelas})` : ''}
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.userRow}>
            {daftarPenggunaSesuaiPeran.map((p) => {
              const isSelected = penggunaAktif.id === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.userChip,
                    isSelected && styles.userChipActive,
                  ]}
                  onPress={() => gantiPengguna(p.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.userChipTop}>
                    <Text
                      style={[
                        styles.userName,
                        isSelected && styles.userNameActive,
                      ]}
                    >
                      {p.nama}
                    </Text>
                    {p.kelas && (
                      <View
                        style={[
                          styles.kelasTag,
                          isSelected && styles.kelasTagActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.kelasTagText,
                            isSelected && styles.kelasTagTextActive,
                          ]}
                        >
                          {p.kelas}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.userSub}>
                    {p.peran === 'asisten' ? 'NIP: ' : 'NIM: '}
                    {p.nomorInduk}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#131b2e',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
  },
  currentBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  currentBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#38bdf8',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#0a101f',
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#2563eb',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  userSection: {
    marginTop: 2,
  },
  userHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  userLabel: {
    fontSize: 11,
    color: '#94a3b8',
  },
  activeUserHint: {
    fontSize: 11,
    fontWeight: '600',
    color: '#38bdf8',
  },
  userRow: {
    flexDirection: 'row',
    gap: 8,
  },
  userChip: {
    backgroundColor: '#0a101f',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  userChipActive: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  userChipTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  userNameActive: {
    color: '#38bdf8',
  },
  kelasTag: {
    backgroundColor: '#131b2e',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  kelasTagActive: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
  },
  kelasTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
  },
  kelasTagTextActive: {
    color: '#38bdf8',
  },
  userSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
});
