/** * @file backend/src/server.js
    * @description Backend API untuk pembayaran denda praktikum. */

const path = require('path');

// Membaca konfigurasi dari backend/.env.
require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
});

const express = require('express');
const cors = require('cors');

// Firebase Admin diinisialisasi setelah dotenv.
const { adminAuth } = require('./firebaseAdmin');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware umum.
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Mengecek apakah server berjalan.
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Payment backend is running.',
  });
});

// Memverifikasi Firebase ID Token dari aplikasi.
async function verifyFirebaseToken(req, res, next) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token autentikasi tidak ditemukan.',
      });
    }

    const idToken = authorization.split(' ')[1];

    const decodedToken = await adminAuth.verifyIdToken(idToken);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
    };

    next();
  } catch (error) {
    console.error('Firebase token verification failed:', error.message);

    return res.status(401).json({
      success: false,
      message: 'Token autentikasi tidak valid atau sudah kedaluwarsa.',
    });
  }
}

// Mengecek autentikasi Firebase.
app.get('/api/auth/me', verifyFirebaseToken, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

// Menangani endpoint yang tidak ditemukan.
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan.',
  });
});

// Menangani error server.
app.use((error, req, res, next) => {
  console.error('Server error:', error);

  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan pada server.',
  });
});

// Menjalankan server.
app.listen(PORT, () => {
  console.log(`Payment backend berjalan di port ${PORT}`);
});

module.exports = app;
