import React, { useMemo } from 'react';
import { Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { radius, spacing } from '@/theme';

export default function ProfilScreen(): React.JSX.Element {
  const {
    peranAktif,
    penggunaAktif,
    daftarSesi,
    ambilRiwayatPraktikan,
    gantiPeran,
    modeTema,
    setModeTema,
    tema,
  } = useApp();

  const { logout, user, userProfile } = useAuth();

  const [modalPeranVisible, setModalPeranVisible] = useState<boolean>(false);

  // Label opsi peran dinamis akun
  const praktikanSubLabel = userProfile
    ? `${userProfile.nama} · ${userProfile.nomorInduk || 'Mahasiswa'}${userProfile.kelas ? ` (${userProfile.kelas})` : ''}`
    : 'Ahmad Fauzi · 2141720001 (TI-3A)';

  const asistenSubLabel = userProfile
    ? `${userProfile.nama} · Asisten Laboratorium`
    : 'Rian Hidayat, S.Kom. · Koordinator RPL';

  // Inisial avatar 2 huruf
  const inisial = penggunaAktif.nama
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((kata) => kata[0].toUpperCase())
    .join('');

  const confirmLogout = (): void => {
    Alert.alert('Keluar dari akun', 'Sesi login pada perangkat ini akan diakhiri.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: () => void logout() },
    ]);
  };

  return (
    <ScreenContainer>
      <View style={[styles.profileCard, { backgroundColor: tema.surface, borderColor: tema.border }]}>
        <View style={[styles.avatar, { backgroundColor: tema.accentSurface }]}>
          <Text style={[styles.avatarText, { color: tema.accentText }]}>{initials}</Text>
        </View>
        <Text style={[styles.name, { color: tema.textPrimary }]}>{userProfile?.nama || user?.displayName || 'Pengguna'}</Text>
        <Text style={[styles.identifier, { color: tema.accent }]}>{userProfile?.nomorInduk || '-'}</Text>
        <Text style={[styles.meta, { color: tema.textSecondary }]}>{user?.email || userProfile?.email || '-'}</Text>
        <Text style={[styles.meta, { color: tema.textSecondary }]}>
          {role === 'asisten' ? 'Asisten Laboratorium' : `Praktikan${userProfile?.kelas ? ` · ${userProfile.kelas}` : ''}`}
        </Text>
      </View>

      {availableRoles.length > 1 ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tema.textPrimary }]}>Mode Akun</Text>
          <View style={[styles.card, { backgroundColor: tema.surface, borderColor: tema.border }]}>
            {availableRoles.map((availableRole) => {
              const selected = role === availableRole;
              return (
                <TouchableOpacity
                  key={availableRole}
                  style={[styles.roleRow, selected && { backgroundColor: tema.accentSurface }]}
                  onPress={() => void setActiveRole(availableRole)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <Ionicons name={availableRole === 'asisten' ? 'shield-checkmark-outline' : 'school-outline'} size={20} color={tema.accent} />
                  <Text style={[styles.rowText, { color: tema.textPrimary }]}>
                    {availableRole === 'asisten' ? 'Asisten Laboratorium' : 'Praktikan'}
                  </Text>
                  {selected ? <Ionicons name="checkmark-circle" size={20} color={tema.accent} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: tema.textPrimary }]}>Pengaturan</Text>
        <View style={[styles.card, { backgroundColor: tema.surface, borderColor: tema.border }]}>
          <View style={styles.settingRow}>
            <Ionicons name={modeTema === 'dark' ? 'moon-outline' : 'sunny-outline'} size={20} color={tema.accent} />
            <Text style={[styles.rowText, { color: tema.textPrimary }]}>Mode Gelap</Text>
            <Switch value={modeTema === 'dark'} onValueChange={(enabled) => setModeTema(enabled ? 'dark' : 'light')} />
          </View>
          <TouchableOpacity style={styles.settingRow} onPress={confirmLogout} accessibilityRole="button">
            <Ionicons name="log-out-outline" size={20} color="#DC2626" />
            <Text style={[styles.rowText, { color: '#DC2626' }]}>Keluar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SECTION 3: PENGATURAN & SISTEM */}
      <SectionHeader title="Pengaturan & Sistem" />

      <GroupedInsetList>
        {/* Switch Button: Mode Tampilan (Dark Mode) */}
        <GroupedInsetItem
          title="Mode Tampilan (Dark Mode)"
          subtitle={
            modeTema === 'dark'
              ? 'Obsidian Dark (Opsi 2 Aktif)'
              : 'Warm Academic Stone (Opsi 3 Aktif)'
          }
          leftElement={
            <View
              style={[
                styles.itemIconSquircle,
                {
                  backgroundColor: tema.accentSurface,
                },
              ]}
            >
              <Ionicons
                name={modeTema === 'dark' ? 'moon' : 'sunny'}
                size={17}
                color={tema.accentText}
              />
            </View>
          }
          rightElement={
            <Switch
              value={modeTema === 'dark'}
              onValueChange={(val) => setModeTema(val ? 'dark' : 'light')}
              thumbColor={modeTema === 'dark' ? tema.accent : '#FFFFFF'}
              trackColor={{
                false: '#D4D4D8',
                true: modeTema === 'dark' ? '#312E81' : tema.accentSurface,
              }}
              accessibilityLabel="Pengalih Mode Tampilan Gelap"
            />
          }
        />

        {/* Alih Peran Pengguna */}
        <GroupedInsetItem
          title="Alih Peran Pengguna"
          subtitle="Ganti sudut pandang Mahasiswa / Asisten"
          leftElement={
            <View
              style={[
                styles.itemIconSquircle,
                {
                  backgroundColor: tema.accentSurface,
                },
              ]}
            >
              <Ionicons
                name="swap-horizontal"
                size={17}
                color={tema.accentText}
              />
            </View>
          }
          rightElement={
            <Ionicons
              name="chevron-forward"
              size={16}
              color={tema.textMuted}
            />
          }
          onPress={() => setModalPeranVisible(true)}
        />

        {/* Versi Aplikasi */}
        <GroupedInsetItem
          title="Versi Aplikasi"
          subtitle="v1.0.0 · Production Build"
          isLast
          leftElement={
            <View
              style={[
                styles.itemIconSquircle,
                {
                  backgroundColor: tema.surfaceRaised,
                },
              ]}
            >
              <Ionicons
                name="code-working-outline"
                size={17}
                color={tema.textMuted}
              />
            </View>
          }
          rightElement={
            <View
              style={[
                styles.badgeVersion,
                { backgroundColor: tema.surfaceRaised },
              ]}
            >
              <Text
                style={[styles.badgeVersionText, { color: tema.textMuted }]}
              >
                Official
              </Text>
            </View>
          }
        />
      </GroupedInsetList>

      {/* SECTION 4: SESI & AKUN FIREBASE */}
      <SectionHeader title="Akun & Sesi" />
      <GroupedInsetList>
        <GroupedInsetItem
          title="Email Akun"
          subtitle={user?.email || 'Akun Pengembang / Tamu'}
          leftElement={
            <View
              style={[
                styles.itemIconSquircle,
                { backgroundColor: tema.surfaceRaised },
              ]}
            >
              <Ionicons name="mail-outline" size={17} color={tema.accent} />
            </View>
          }
        />
        <GroupedInsetItem
          title="Keluar dari Akun"
          subtitle="Mengakhiri sesi autentikasi Firebase"
          isLast
          leftElement={
            <View
              style={[
                styles.itemIconSquircle,
                { backgroundColor: '#FEE2E2' },
              ]}
            >
              <Ionicons name="log-out-outline" size={17} color="#DC2626" />
            </View>
          }
          rightElement={
            <Ionicons name="chevron-forward" size={16} color="#DC2626" />
          }
          onPress={async () => {
            try {
              await logout();
            } catch (err) {
              console.error('Logout error:', err);
            }
          }}
        />
      </GroupedInsetList>

      {/* Modal Dialog: Alih Peran */}
      <Modal
        visible={modalPeranVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalPeranVisible(false)}
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
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: tema.textPrimary }]}>
                Pilih Identitas Simulasi
              </Text>
              <TouchableOpacity
                onPress={() => setModalPeranVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color={tema.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalPeranDesc, { color: tema.textSecondary }]}>
              Ganti sudut pandang untuk menguji hak akses & tampilan:
            </Text>

            {/* Opsi Praktikan */}
            <TouchableOpacity
              style={[
                styles.roleChoiceCard,
                {
                  backgroundColor:
                    peranAktif === 'praktikan'
                      ? tema.accentSurface
                      : tema.surfaceRaised,
                  borderColor:
                    peranAktif === 'praktikan' ? tema.accent : tema.border,
                },
              ]}
              onPress={() => {
                gantiPeran('praktikan');
                setModalPeranVisible(false);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.roleChoiceMeta}>
                <Text
                  style={[
                    styles.roleChoiceTitle,
                    {
                      color:
                        peranAktif === 'praktikan'
                          ? tema.accentText
                          : tema.textPrimary,
                    },
                  ]}
                >
                  Mahasiswa (Praktikan)
                </Text>
                <Text
                  style={[
                    styles.roleChoiceSub,
                    { color: tema.textSecondary },
                  ]}
                >
                  {praktikanSubLabel}
                </Text>
              </View>
              {peranAktif === 'praktikan' && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={tema.accent}
                />
              )}
            </TouchableOpacity>

            {/* Opsi Asisten */}
            <TouchableOpacity
              style={[
                styles.roleChoiceCard,
                {
                  backgroundColor:
                    peranAktif === 'asisten'
                      ? tema.accentSurface
                      : tema.surfaceRaised,
                  borderColor:
                    peranAktif === 'asisten' ? tema.accent : tema.border,
                },
              ]}
              onPress={() => {
                gantiPeran('asisten');
                setModalPeranVisible(false);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.roleChoiceMeta}>
                <Text
                  style={[
                    styles.roleChoiceTitle,
                    {
                      color:
                        peranAktif === 'asisten'
                          ? tema.accentText
                          : tema.textPrimary,
                    },
                  ]}
                >
                  Asisten Laboratorium
                </Text>
                <Text
                  style={[
                    styles.roleChoiceSub,
                    { color: tema.textSecondary },
                  ]}
                >
                  {asistenSubLabel}
                </Text>
              </View>
              {peranAktif === 'asisten' && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={tema.accent}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  profileCard: { borderWidth: 1, borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center' },
  avatar: { width: 60, height: 60, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  avatarText: { fontSize: 20, fontWeight: '800' },
  name: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  identifier: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  meta: { fontSize: 12, marginTop: 3, textAlign: 'center' },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: 14, fontWeight: '800' },
  card: { borderWidth: 1, borderRadius: radius.lg, overflow: 'hidden' },
  roleRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, gap: spacing.md },
  settingRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, gap: spacing.md },
  rowText: { flex: 1, fontSize: 13, fontWeight: '600' },
  version: { fontSize: 11, textAlign: 'center', marginTop: spacing.sm },
});
