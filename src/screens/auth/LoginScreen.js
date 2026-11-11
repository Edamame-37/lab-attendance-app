/**
 * @file src/screens/auth/LoginScreen.js
 * @description Antarmuka Form Login pengguna (Praktikan & Asisten) berbasis Firebase Authentication.
 * Dilengkapi validasi form client-side, visual feedback loading, toggle visibilitas kata sandi,
 * dan penanganan error ramah pengguna.
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
 * Komponen Layar Login
 * @param {Object} props
 * @param {Function} [props.onNavigateToRegister] - Callback untuk navigasi ke RegisterScreen
 */
const LoginScreen = ({ onNavigateToRegister }) => {
  const { login } = useAuth();

  // State form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // State interaksi
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  /**
   * Menangani pengiriman formulir login
   */
  const handleLogin = async () => {
    // Validasi form client-side
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Alamat email wajib diisi.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMessage('Format alamat email tidak valid.');
      return;
    }

    if (!password) {
      setErrorMessage('Kata sandi wajib diisi.');
      return;
    }

    setErrorMessage('');
    setLoading(true);

    try {
      await login(cleanEmail, password);
      // Login berhasil, AuthContext secara reaktif memperbarui state sesi
    } catch (error) {
      setErrorMessage(error.message || 'Gagal masuk. Silakan periksa kembali email dan password Anda.');
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
            <View style={styles.logoBadge}>
              <Ionicons name="school" size={40} color="#047857" />
            </View>
            <Text style={styles.appTitle}>Presensi Praktikum</Text>
            <Text style={styles.appSubtitle}>
              Masuk untuk mengakses sistem presensi laboratorium
            </Text>
          </View>

          {/* Kotak Form Login */}
          <View style={styles.cardContainer}>
            {/* Banner Pesan Error */}
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={20} color="#DC2626" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

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
              <Text style={styles.inputLabel}>Kata Sandi</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#71717A"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Masukkan kata sandi"
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

            {/* Tombol Aksi Masuk */}
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.primaryButtonText}>Masuk ke Akun</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer Navigasi ke Register */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Belum memiliki akun praktikum?</Text>
            <TouchableOpacity
              onPress={onNavigateToRegister}
              disabled={loading}
              style={styles.registerLink}
            >
              <Text style={styles.registerLinkText}>Daftar Sekarang</Text>
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
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#18181B',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#52525B',
    textAlign: 'center',
    paddingHorizontal: 16,
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
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#27272A',
    marginBottom: 8,
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
    marginTop: 8,
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
    marginTop: 28,
    gap: 6,
  },
  footerText: {
    fontSize: 14,
    color: '#52525B',
  },
  registerLink: {
    paddingVertical: 4,
  },
  registerLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#047857',
  },
});

export default LoginScreen;
