/**
 * @file src/app/test-farrel.tsx
 * @description Halaman pengujian terpadu untuk modul Farrel (Sprint 2).
 * Memungkinkan pengujian interaktif antara antarmuka Asisten (SessionManageScreen)
 * dan Praktikan (AttendanceScanScreen) dengan alur Firestore real-time.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { SessionManageScreen } from '@/screens/asisten/SessionManageScreen';
import { AttendanceScanScreen } from '@/screens/praktikan/AttendanceScanScreen';

export default function TestFarrelScreen(): React.JSX.Element {
  const router = useRouter();
  const { tema } = useApp();
  const [activeTab, setActiveTab] = useState<'asisten' | 'praktikan'>('asisten');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: tema.canvas }]}>
      <View style={[styles.container, { backgroundColor: tema.canvas }]}>
        {/* Header Navigasi Pengujian */}
        <View style={[styles.header, { backgroundColor: tema.surface, borderBottomColor: tema.border }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)');
              }
            }}
          >
            <Ionicons name="arrow-back" size={22} color={tema.textPrimary} />
            <Text style={[styles.backText, { color: tema.textPrimary }]}>Kembali</Text>
          </TouchableOpacity>

          <View style={styles.titleWrapper}>
            <Text style={[styles.headerTitle, { color: tema.textPrimary }]}>
              Testing Modul Farrel
            </Text>
            <Text style={[styles.headerSub, { color: tema.textSecondary }]}>
              SRS-FT-02 • SRS-FT-03 • SRS-FT-04
            </Text>
          </View>
        </View>

        {/* Tab Switcher: Asisten vs Praktikan */}
        <View style={[styles.switcherContainer, { backgroundColor: tema.surface, borderBottomColor: tema.borderSubtle }]}>
          <TouchableOpacity
            style={[
              styles.switchTab,
              activeTab === 'asisten' && [styles.switchTabActive, { backgroundColor: tema.accent }],
            ]}
            onPress={() => setActiveTab('asisten')}
          >
            <Ionicons
              name="briefcase-outline"
              size={16}
              color={activeTab === 'asisten' ? '#FFFFFF' : tema.textSecondary}
            />
            <Text
              style={[
                styles.switchTabText,
                { color: activeTab === 'asisten' ? '#FFFFFF' : tema.textSecondary },
              ]}
            >
              Mode Asisten (CRUD & Live Recap)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.switchTab,
              activeTab === 'praktikan' && [styles.switchTabActive, { backgroundColor: tema.accent }],
            ]}
            onPress={() => setActiveTab('praktikan')}
          >
            <Ionicons
              name="person-outline"
              size={16}
              color={activeTab === 'praktikan' ? '#FFFFFF' : tema.textSecondary}
            />
            <Text
              style={[
                styles.switchTabText,
                { color: activeTab === 'praktikan' ? '#FFFFFF' : tema.textSecondary },
              ]}
            >
              Mode Praktikan (Presensi 1x)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Konten Screen Aktif */}
        <View style={styles.contentBody}>
          {activeTab === 'asisten' ? (
            <SessionManageScreen />
          ) : (
            <AttendanceScanScreen />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
  },
  titleWrapper: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  switcherContainer: {
    flexDirection: 'row',
    padding: 8,
    gap: 8,
    borderBottomWidth: 1,
  },
  switchTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
  },
  switchTabActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  switchTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  contentBody: {
    flex: 1,
  },
});

