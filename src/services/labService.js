import {
  GeoPoint,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { validateCoordinates } from './locationService';

export const LABS_COLLECTION = 'labs';

const mapLabDocument = (documentSnapshot) => {
  const data = documentSnapshot.data();
  return {
    id: documentSnapshot.id,
    ...data,
    latitude: data.location?.latitude ?? null,
    longitude: data.location?.longitude ?? null,
    radiusMeters: Number.isFinite(Number(data.radiusMeters)) ? Number(data.radiusMeters) : 50,
  };
};

export const validateLabInput = (labInput) => {
  const name = labInput?.name?.trim();
  const code = labInput?.code?.trim().toUpperCase();
  const address = labInput?.address?.trim() || '';
  const coordinates = validateCoordinates(labInput?.latitude, labInput?.longitude);
  const cleanRadiusStr = String(labInput?.radiusMeters ?? '').trim().replace(',', '.');
  const radiusMeters = Number(cleanRadiusStr);

  if (!name || !code) {
    throw new Error('Nama dan kode laboratorium wajib diisi.');
  }
  if (cleanRadiusStr === '' || !Number.isFinite(radiusMeters) || radiusMeters <= 0) {
    throw new Error('Radius laboratorium harus berupa angka positif lebih dari 0 meter.');
  }

  return {
    name,
    code,
    address,
    location: new GeoPoint(coordinates.latitude, coordinates.longitude),
    radiusMeters,
  };
};

export const getLabs = async ({ activeOnly = false } = {}) => {
  const snapshot = await getDocs(collection(db, LABS_COLLECTION));
  return snapshot.docs
    .map(mapLabDocument)
    .filter((lab) => !activeOnly || lab.isActive !== false)
    .sort((firstLab, secondLab) => firstLab.name.localeCompare(secondLab.name));
};

export const getLabById = async (labId) => {
  if (!labId) return null;
  const snapshot = await getDoc(doc(db, LABS_COLLECTION, labId));
  return snapshot.exists() ? mapLabDocument(snapshot) : null;
};

export const subscribeToLabs = (onUpdate, onError, { activeOnly = false } = {}) => {
  return onSnapshot(
    collection(db, LABS_COLLECTION),
    (snapshot) => {
      const labs = snapshot.docs
        .map(mapLabDocument)
        .filter((lab) => !activeOnly || lab.isActive !== false)
        .sort((firstLab, secondLab) => firstLab.name.localeCompare(secondLab.name));
      onUpdate(labs);
    },
    onError
  );
};

export const createLab = async (labInput, userId) => {
  const validatedLab = validateLabInput(labInput);
  const reference = await addDoc(collection(db, LABS_COLLECTION), {
    ...validatedLab,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
  return reference.id;
};

export const updateLab = async (labId, labInput, userId) => {
  if (!labId) throw new Error('ID laboratorium wajib diisi.');
  const validatedLab = validateLabInput(labInput);
  await updateDoc(doc(db, LABS_COLLECTION, labId), {
    ...validatedLab,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
};

export const setLabActiveState = async (labId, isActive, userId) => {
  if (!labId) throw new Error('ID laboratorium wajib diisi.');
  await updateDoc(doc(db, LABS_COLLECTION, labId), {
    isActive,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
};
