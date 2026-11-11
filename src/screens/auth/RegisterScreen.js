/**
 * @file src/screens/auth/RegisterScreen.js
 * @description Antarmuka Form Registrasi pengguna baru (Praktikan & Asisten) berbasis Firebase Authentication.
 * Menyediakan pemilihan peran (Role Selector), input NIM/NIP, kelas praktikum kondisional,
 * serta validasi konfirmasi kata sandi dan integritas data input.
 *
 * @author Azlan (feature/auth-user-management)
 * @srs SRS-FT-01, SRS-FT-08
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

/**
 * Komponen Layar Registrasi
 * @param {Object} props
 * @param {Function} [props.onNavigateToLogin] - Callback navigasi kembali ke LoginScreen
 */
const RegisterScreen = ({ onNavigateToLogin }) => {
  const { register } = useAuth();

  // State data formulir pendaftaran
  const [nama, setNama] = useState('');
  const [nomorInduk, setNomorInduk] = useState('');
  const [role, setRole] = useState('praktikan'); // 'praktikan' | 'asisten'
  const [kelas, setKelas] = useState('A');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // State tampilan interaktif
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  /**
   * Menangani submit form pendaftaran
   */
  const handleRegister = async () => {
    // Validasi kelengkapan form
    const cleanNama = nama.trim();
    const cleanNomorInduk = nomorInduk.trim();
    const cleanEmail = email.trim();

    if (!cleanNama) {
      setErrorMessage('Nama lengkap wajib diisi.');
      return;
    }

    if (!cleanNomorInduk) {
      setErrorMessage(
        role === 'praktikan' ? 'NIM wajib diisi.' : 'NIP / ID Asisten wajib diisi.'
      );
      return;
    }

    if (!cleanEmail) {
      setErrorMessage('Alamat email wajib diisi.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Format alamat email tidak valid.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Kata sandi harus terdiri dari minimal 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setErrorMessage('');
    setLoading(true);

    try {
      await register({
        email: cleanEmail,
        password,
        nama: cleanNama,
        nomorInduk: cleanNomorInduk,
        role,
        kelas: role === 'praktikan' ? kelas : '',
      });
      // Pendaftaran berhasil, AuthContext secara otomatis memperbarui state login
    } catch (error) {
      setErrorMessage(error.message || 'Gagal mendaftarkan akun. Silakan coba kembali.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Visual */}
          <View style={styles.headerContainer}>
            <TouchableOpacity
              onPress={onNavigateToLogin}
              style={styles.backButton}
              disabled={loading}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="#18181B" />
            </TouchableOpacity>
            <View style={styles.headerTitles}>
              <Text style={styles.appTitle}>Daftar Akun Baru</Text>
              <Text style={styles.appSubtitle}>
                Lengkapi identitas untuk mendaftar sebagai peserta praktikum
              </Text>
            </View>
          </View>

          {/* Kotak Formulir */}
          <View style={styles.cardContainer}>
            {/* Banner Error */}
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={20} color="#DC2626" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Pilihan Peran (Role Selector) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Daftar Sebagai Peran</Text>
              <View style={styles.roleSelectorWrapper}>
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    role === 'praktikan' && styles.roleOptionActive,
                  ]}
                  onPress={() => setRole('praktikan')}
                  disabled={loading}
                >
                  <Ionicons
                    name="person"
                    size={18}
                    color={role === 'praktikan' ? '#FFFFFF' : '#71717A'}
                  />
                  <Text
                    style={[
                      styles.roleText,
                      role === 'praktikan' && styles.roleTextActive,
                    ]}
                  >
                    Praktikan (Mhs)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    role === 'asisten' && styles.roleOptionActive,
                  ]}
                  onPress={() => setRole('asisten')}
                  disabled={loading}
                >
                  <Ionicons
                    name="shield-checkmark"
                    size={18}
                    color={role === 'asisten' ? '#FFFFFF' : '#71717A'}
                  />
                  <Text
                    style={[
                      styles.roleText,
                      role === 'asisten' && styles.roleTextActive,
                    ]}
                  >
                    Asisten Lab
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Input Nama Lengkap */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nama Lengkap</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#71717A"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Nama Lengkap Anda"
                  placeholderTextColor="#A1A1AA"
                  value={nama}
                  onChangeText={(text) => {
                    setNama(text);
                    if (errorMessage) setErrorMessage('');
                  }}
                  autoCapitalize="words"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Input NIM / NIP */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {role === 'praktikan' ? 'Nomor Induk Mahasiswa (NIM)' : 'NIP / ID Asisten'}
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="card-outline"
                  size={20}
                  color="#71717A"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder={
                    role === 'praktikan' ? 'contoh: 21120121140001' : 'contoh: AST-001'
                  }
                  placeholderTextColor="#A1A1AA"
                  value={nomorInduk}
                  onChangeText={(text) => {
                    setNomorInduk(text);
                    if (errorMessage) setErrorMessage('');
                  }}
                  keyboardType="default"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Input Pilihan Kelas (Khusus Praktikan) */}
            {role === 'praktikan' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Kelas Praktikum</Text>
                <View style={styles.classChipsWrapper}>
                  {['A', 'B', 'C', 'D'].map((kelasItem) => (
                    <TouchableOpacity
                      key={kelasItem}
                      style={[
                        styles.classChip,
                        kelas === kelasItem && styles.classChipActive,
                      ]}
                      onPress={() => setKelas(kelasItem)}
                      disabled={loading}
                    >
                      <Text
                        style={[
                          styles.classChipText,
                          kelas === kelasItem && styles.classChipTextActive,
                        ]}
                      >
                        Kelas {kelasItem}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Input Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Alamat Email</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="#71717A"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="contoh: nama@students.undip.ac.id"
                  placeholderTextColor="#A1A1AA"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errorMessage) setErrorMessage('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Input Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Kata Sandi (Min. 6 Karakter)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#71717A"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Buat kata sandi akun"
                  placeholderTextColor="#A1A1AA"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errorMessage) setErrorMessage('');
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#71717A"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Input Konfirmasi Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Konfirmasi Kata Sandi</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="shield-outline"
                  size={20}
                  color="#71717A"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Ulangi kata sandi"
                  placeholderTextColor="#A1A1AA"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errorMessage) setErrorMessage('');
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#71717A"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Tombol Aksi Daftar */}
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.primaryButtonText}>Daftar Akun</Text>
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer Navigasi kembali ke Login */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Sudah memiliki akun praktikum?</Text>
            <TouchableOpacity
              onPress={onNavigateToLogin}
              disabled={loading}
              style={styles.loginLink}
            >
              <Text style={styles.loginLinkText}>Masuk di sini</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F4F5',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitles: {
    flex: 1,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#18181B',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 13,
    color: '#52525B',
    marginTop: 2,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    shadowColor: '#18181B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 18,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#991B1B',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#27272A',
    marginBottom: 8,
  },
  roleSelectorWrapper: {
    flexDirection: 'row',
    backgroundColor: '#F4F4F5',
    borderRadius: 12,
    padding: 4,
    gap: 6,
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  roleOptionActive: {
    backgroundColor: '#047857',
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#52525B',
  },
  roleTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  classChipsWrapper: {
    flexDirection: 'row',
    gap: 8,
  },
  classChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
  },
  classChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#047857',
  },
  classChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#52525B',
  },
  classChipTextActive: {
    color: '#047857',
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#18181B',
    height: '100%',
  },
  eyeButton: {
    padding: 4,
  },
  primaryButton: {
    backgroundColor: '#047857',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 6,
  },
  footerText: {
    fontSize: 14,
    color: '#52525B',
  },
  loginLink: {
    paddingVertical: 4,
  },
  loginLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#047857',
  },
});

export default RegisterScreen;

