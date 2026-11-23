import fs from 'node:fs';
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

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
const applyChanges = process.argv.includes('--apply');
const allowedRoles = new Set(['praktikan', 'asisten']);

const usersSnapshot = await firestore.collection('users').get();
const migrations = [];

for (const userDocument of usersSnapshot.docs) {
  const profile = userDocument.data();
  const roles = Array.isArray(profile.roles)
    ? [...new Set(profile.roles.filter((role) => allowedRoles.has(role)))]
    : allowedRoles.has(profile.role)
      ? [profile.role]
      : [];

  if (roles.length === 0) {
    console.warn(`[SKIP] ${userDocument.id}: role tidak valid dan memerlukan pemeriksaan manual.`);
    continue;
  }

  const canonicalRole = roles.includes(profile.role) ? profile.role : roles[0];
  const accountStatus = profile.accountStatus === 'suspended' ? 'suspended' : 'active';
  const rolesChanged = JSON.stringify(profile.roles || []) !== JSON.stringify(roles);
  if (rolesChanged || profile.role !== canonicalRole || profile.accountStatus !== accountStatus) {
    migrations.push({ reference: userDocument.ref, role: canonicalRole, roles, accountStatus });
    console.log(`[${applyChanges ? 'APPLY' : 'DRY-RUN'}] ${userDocument.id}: role=${canonicalRole}, roles=${roles.join(',')}, accountStatus=${accountStatus}`);
  }
}

if (applyChanges && migrations.length > 0) {
  for (let offset = 0; offset < migrations.length; offset += 400) {
    const batch = firestore.batch();
    for (const migration of migrations.slice(offset, offset + 400)) {
      batch.update(migration.reference, {
        role: migration.role,
        roles: migration.roles,
        accountStatus: migration.accountStatus,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
  }
}

console.log(`${applyChanges ? 'Migrasi' : 'Dry-run'} selesai: ${migrations.length} profil perlu diperbarui dari ${usersSnapshot.size} profil.`);
if (!applyChanges && migrations.length > 0) {
  console.log('Tinjau hasil di atas, lalu jalankan kembali dengan --apply untuk menerapkan perubahan.');
}
