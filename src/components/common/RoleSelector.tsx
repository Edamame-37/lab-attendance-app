/**
 * @file src/components/common/RoleSelector.tsx
 * @description Komponen pemilih peran (Praktikan vs Asisten Praktikum) dan identitas pengguna aktif.
 * Memudahkan pengujian sprint dari dua sudut pandang peran tanpa emoji.
 */

import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useApp } from '@/context/AppContext';
import { PeranPengguna } from '@/types';
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
        <Text style={styles.currentBadge}>
          {peranAktif === 'asisten' ? 'Mode Asisten' : 'Mode Praktikan'}
        </Text>
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
            Praktikan
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
            Asisten Praktikum
          </Text>
        </TouchableOpacity>
      </View>

      {/* Pilihan Akun Pengguna Aktif */}
      <View style={styles.userSection}>
        <Text style={styles.userLabel}>Pilih Identitas Pengguna:</Text>
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
                  <Text
                    style={[
                      styles.userName,
                      isSelected && styles.userNameActive,
                    ]}
                  >
                    {p.nama}
                  </Text>
                  <Text style={styles.userSub}>{p.nomorInduk}</Text>
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
  currentBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
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
  userLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 6,
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
    paddingVertical: 6,
    borderRadius: 8,
  },
  userChipActive: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  userName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  userNameActive: {
    color: '#38bdf8',
  },
  userSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
});
