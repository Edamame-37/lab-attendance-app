import fs from 'node:fs';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const loadProjectId = () => {
  if (process.env.FIREBASE_PROJECT_ID || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID) {
    return process.env.FIREBASE_PROJECT_ID || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  }
  if (!fs.existsSync('.env')) return undefined;

  const projectLine = fs.readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .find((line) => line.startsWith('EXPO_PUBLIC_FIREBASE_PROJECT_ID='));
  return projectLine?.split('=').slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
};

const projectId = loadProjectId();
const useEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
if (!projectId) {
  throw new Error('Set FIREBASE_PROJECT_ID atau EXPO_PUBLIC_FIREBASE_PROJECT_ID terlebih dahulu.');
}

const app = getApps()[0] || initializeApp({
  projectId,
  ...(useEmulator ? {} : { credential: applicationDefault() }),
});
const firestore = getFirestore(app);
const [labsSnapshot, sessionsSnapshot] = await Promise.all([
  firestore.collection('labs').get(),
  firestore.collection('sessions').get(),
]);
const labsById = new Map(labsSnapshot.docs.map((document) => [document.id, document.data()]));
const findings = [];

for (const sessionDocument of sessionsSnapshot.docs) {
  const session = sessionDocument.data();
  const lab = session.labId ? labsById.get(session.labId) : null;
  const sessionLabel = `${sessionDocument.id} (${session.namaPraktikum || 'tanpa nama'})`;

  if (!session.labId) {
    findings.push(`${sessionLabel}: tidak memiliki labId.`);
    continue;
  }
  if (!lab) {
    findings.push(`${sessionLabel}: labId ${session.labId} tidak ditemukan.`);
    continue;
  }
  if (lab.isActive === false) {
    findings.push(`${sessionLabel}: menunjuk laboratorium nonaktif ${session.labId}.`);
  }
  if (!Number.isFinite(lab.location?.latitude) || !Number.isFinite(lab.location?.longitude)) {
    findings.push(`${sessionLabel}: laboratorium tidak memiliki GeoPoint valid.`);
  }
  if (session.ruangLab && lab.name && session.ruangLab !== lab.name) {
    findings.push(`${sessionLabel}: ruangLab '${session.ruangLab}' berbeda dari nama canonical '${lab.name}'.`);
  }
}

console.log(`Audit selesai: ${labsSnapshot.size} lab dan ${sessionsSnapshot.size} sesi diperiksa.`);
if (findings.length === 0) {
  console.log('Tidak ditemukan relasi sesi-lab yang tidak valid.');
} else {
  for (const finding of findings) console.error(`[TEMUAN] ${finding}`);
  console.error(`Total temuan: ${findings.length}`);
  process.exitCode = 1;
}
