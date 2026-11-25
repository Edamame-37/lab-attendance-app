const admin = require('firebase-admin');

// Inisialisasi Firebase Admin SDK.
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

// Akses Firebase Authentication dan Cloud Firestore.
const adminAuth = admin.auth();
const adminDb = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

module.exports = {
  adminAuth,
  adminDb,
  FieldValue,
};
