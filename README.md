# PPK Mobile Praktikum - React Native

Repositori ini berisi proyek awal praktikum pengembangan aplikasi mobile berbasis **React Native** menggunakan **Expo SDK** dan **TypeScript**.

---

## 🚀 Panduan Menjalankan Aplikasi

### 1. Menjalankan Server Pengembangan (Dev Server)
Untuk menjalankan server Metro bundler:
```bash
npm start
# atau
npx expo start
```

Setelah server berjalan, Anda dapat:
- **Android / iOS Fisik**: Buka aplikasi **Expo Go** di smartphone Anda, lalu pindai (scan) kode QR yang muncul di terminal.
- **Web Browser**: Tekan tombol `w` di terminal untuk menjalankan versi web.
- **Emulator Android / Simulator iOS**: Tekan `a` untuk Android Emulator atau `i` untuk iOS Simulator (memerlukan instalasi SDK lokal).

---

## 📦 Build Aplikasi: EAS Build vs `expo build`

> ⚠️ **Catatan Penting mengenai `expo build`**:
> Perintah legacy `expo build` (`expo build:android` / `expo build:ios`) **sudah resmi ditutup (deprecated & retired)** oleh Expo sejak SDK 46/47.
> 
> Pengganti resminya adalah **EAS Build (Expo Application Services)**.

### Menggunakan EAS (Expo Application Services)
EAS Build memungkinkan kompilasi file instalasi APK/AAB (Android) atau IPA (iOS) langsung di cloud Expo tanpa perlu konfigurasi Android Studio atau Xcode lokal:

1. **Instalasi EAS CLI & Login**:
   ```bash
   npm install -g eas-cli
   eas login
   ```
2. **Inisialisasi Konfigurasi EAS**:
   ```bash
   eas build:configure
   ```
   Perintah ini akan membuat file `eas.json`.
3. **Build APK Standalone untuk Android (Preview/Testing)**:
   ```bash
   eas build -p android --profile preview
   ```
   File `.apk` siap diunduh dan dipasang langsung di HP Android.

---

## 📁 Struktur Berkas

- [App.tsx](file:///c:/my-project/ppk-mobile-praktikum/App.tsx): Komponen utama aplikasi dengan contoh implementasi `View`, `Text`, `TouchableOpacity`, `StyleSheet`, dan interaksi state.
- [app.json](file:///c:/my-project/ppk-mobile-praktikum/app.json): Konfigurasi metadata aplikasi Expo (nama, orientasi, ikon, splash screen).
- [package.json](file:///c:/my-project/ppk-mobile-praktikum/package.json): Daftar dependensi dan script npm.
- [tsconfig.json](file:///c:/my-project/ppk-mobile-praktikum/tsconfig.json): Konfigurasi TypeScript untuk React Native.
- [assets/](file:///c:/my-project/ppk-mobile-praktikum/assets): Direktori aset gambar ikon dan splash screen.

---

## 🛠️ Perintah Tambahan
- `npx expo lint` : Memeriksa gaya dan standar kode.
- `npx tsc --noEmit` : Memeriksa validitas tipe TypeScript.
- `npx expo doctor` : Mendiagnosis integritas dependensi Expo.
