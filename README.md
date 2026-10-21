# PPK Mobile Praktikum - React Native

Repositori ini berisi proyek praktikum pengembangan aplikasi mobile berbasis **React Native** menggunakan **Expo SDK 58**, **TypeScript**, dan **Expo Router (File-based Routing)**.

Seluruh modul materi diimplementasikan secara interaktif sesuai dengan standar dokumentasi resmi:
1. **React Fundamentals** ([reactnative.dev/docs/intro-react](https://reactnative.dev/docs/intro-react?language=typescript&guide=android))
2. **Flexbox Layout** ([reactnative.dev/docs/flexbox](https://reactnative.dev/docs/flexbox?language=javascript))
3. **useState & Handling Text Input** ([reactnative.dev/docs/handling-text-input](https://reactnative.dev/docs/handling-text-input))
4. **Modal Component** ([reactnative.dev/docs/modal](https://reactnative.dev/docs/modal))
5. **StyleSheet System** ([reactnative.dev/docs/style](https://reactnative.dev/docs/style))
6. **Navigation with Expo Router** ([docs.expo.dev/tutorial/add-navigation](https://docs.expo.dev/tutorial/add-navigation/))

---

## 📱 Modul Materi dalam Aplikasi

Aplikasi dibagi ke dalam 4 tab navigasi interaktif:

| Tab Navigasi | Berkas Sumber | Topik & Konsep Utama |
|---|---|---|
| 🏠 **Fundamental** | [src/app/(tabs)/index.tsx](file:///c:/my-project/ppk-mobile-praktikum/src/app/%28tabs%29/index.tsx) | Custom Components, JSX Native (`View`, `Text`), TypeScript Props Interfaces, dan Siklus Re-render. |
| 📐 **Flexbox** | [src/app/(tabs)/flexbox.tsx](file:///c:/my-project/ppk-mobile-praktikum/src/app/%28tabs%29/flexbox.tsx) | Playground visual interaktif untuk `flexDirection` (main axis), `justifyContent`, `alignItems` (cross axis), dan `gap`. |
| 📝 **Input State** | [src/app/(tabs)/state-input.tsx](file:///c:/my-project/ppk-mobile-praktikum/src/app/%28tabs%29/state-input.tsx) | Controlled Component dengan `TextInput`, hook `useState`, event `onChangeText`, dan Pizza Translator sesuai dokumentasi resmi. |
| 🪟 **Modal & Style** | [src/app/(tabs)/modal-style.tsx](file:///c:/my-project/ppk-mobile-praktikum/src/app/%28tabs%29/modal-style.tsx) | Dialog `<Modal>` (`animationType`, `transparent`, `onRequestClose`), dan teknik array styling dinamis dengan `StyleSheet.create`. |

---

## 🚀 Panduan Menjalankan Aplikasi

### 1. Menjalankan Server Pengembangan (Dev Server)
Untuk menjalankan server Metro bundler:
```bash
npm start
# atau dengan cache bersih jika baru mengubah konfigurasi
npx expo start --clear
```

Setelah server berjalan:
- **Android / iOS Fisik**: Buka aplikasi **Expo Go** di smartphone Anda, lalu pindai (scan) kode QR yang muncul di terminal.
- **Web Browser**: Tekan tombol `w` di terminal untuk menjalankan versi web.
- **Emulator Android / Simulator iOS**: Tekan `a` untuk Android Emulator atau `i` untuk iOS Simulator.

---

## 📁 Struktur Berkas Proyek

```text
c:/my-project/ppk-mobile-praktikum
├── src/
│   ├── app/
│   │   ├── _layout.tsx         # Root Stack Navigator
│   │   ├── +not-found.tsx      # Fallback layar 404
│   │   └── (tabs)/             # Grup Navigasi Bottom Tabs
│   │       ├── _layout.tsx     # Konfigurasi tab & ikon @expo/vector-icons
│   │       ├── index.tsx       # Modul 1: React Fundamentals & Props
│   │       ├── flexbox.tsx     # Modul 2: Flexbox Playground
│   │       ├── state-input.tsx # Modul 3: useState & Handling Text Input
│   │       └── modal-style.tsx # Modul 4: Modal & StyleSheet
│   └── components/
│       ├── ScreenContainer.tsx # Reusable wrapper layar dengan safe-area & header
│       └── SectionCard.tsx     # Reusable card container untuk seksi materi
├── app.json                    # Konfigurasi Expo & plugins expo-router
├── package.json                # Dependensi (Expo SDK 58, Expo Router, React Native 0.88)
├── tsconfig.json               # Konfigurasi path alias @/* dan typedRoutes
└── eas.json                    # Konfigurasi build cloud EAS (jika digunakan)
```

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
   npx eas-cli login
   ```
2. **Inisialisasi Konfigurasi EAS**:
   ```bash
   npx eas-cli build:configure
   ```
   Perintah ini akan membuat file `eas.json`.
3. **Build APK Standalone untuk Android (Preview/Testing)**:
   ```bash
   npx eas-cli build -p android --profile preview
   ```
   File `.apk` siap diunduh dan dipasang langsung di HP Android.

---

## 🛠️ Perintah Tambahan
- `npx tsc --noEmit` : Memeriksa validitas tipe TypeScript di seluruh proyek.
- `npx expo-doctor` : Mendiagnosis integritas dependensi Expo.
