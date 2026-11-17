import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';

type MenuItemProps = {
  title: string;
  description: string;
  onPress: () => void;
};

function MenuItem({
  title,
  description,
  onPress,
}: MenuItemProps): React.JSX.Element {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.menuText}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#64748B" />
    </TouchableOpacity>
  );
}

export default function FiturSprint2Route(): React.JSX.Element {
  const router = useRouter();
  const { role, userProfile } = useAuth();
  const isAsisten = role === 'asisten';  
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.profileCard}>
        <Text style={styles.profileName}>
          {userProfile?.nama || 'Pengguna'}
        </Text>
        <Text style={styles.profileRole}>
          Role: {isAsisten ? 'Asisten' : 'Praktikan'}
        </Text>
      </View>

      {isAsisten ? (
        <>
          <Text style={styles.sectionTitle}>Menu Asisten</Text>
          <MenuItem
            title="Kelola Sesi Praktikum"
            description="Mengelola sesi praktikum melalui Firestore."
            onPress={() => router.push('/sesi')}
          />
          <MenuItem
            title="Review Pengajuan Izin"
            description="Melihat dan memverifikasi pengajuan izin praktikan."
            onPress={() => router.push('/review-izin')}
          />
        </>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Menu Praktikan</Text>
          <MenuItem
            title="Presensi Firestore"
            description="Melakukan presensi pada sesi yang tersedia."
            onPress={() => router.push('/presensi-firestore')}
          />
          <MenuItem
            title="Pengajuan Izin"
            description="Mengirim pengajuan izin praktikum."
            onPress={() => router.push('/pengajuan-izin')}
          />
          <MenuItem
            title="Status Pengajuan Izin"
            description="Melihat status pengajuan izin."
            onPress={() => router.push('/status-izin')}
          />
        </>
      )}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.replace('/(tabs)')}
      >
        <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
        <Text style={styles.backButtonText}>Kembali ke Beranda</Text>
      </TouchableOpacity>
    </ScrollView>
  );

}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 23,
    fontWeight: '700',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 5,
    lineHeight: 19,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 24,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  profileRole: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    flex: 1,
    paddingRight: 12,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  menuDescription: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 17,
  },
  backButton: {
    marginTop: 24,
    backgroundColor: '#334155',
    borderRadius: 10,
    padding: 13,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});