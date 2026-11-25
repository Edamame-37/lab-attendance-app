import {
  GeoPoint,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { validateCoordinates } from './locationService';

export const LABS_COLLECTION = 'labs';
const MAX_BATCH_WRITES = 500;

const cleanText = (value) => String(value ?? '').trim();
const cleanIdentifier = (value) => cleanText(value).toLowerCase();

const parseNumericField = (value, {
  fieldLabel,
  fallback,
  minimum,
  strictlyPositive = false,
}) => {
  const rawValue = cleanText(value).replace(',', '.');
  const numberValue = rawValue === '' ? fallback : Number(rawValue);
  const isBelowMinimum = strictlyPositive
    ? numberValue <= minimum
    : numberValue < minimum;

  if (!Number.isFinite(numberValue) || isBelowMinimum) {
    const requirement = strictlyPositive
      ? `lebih dari ${minimum}`
      : `minimal ${minimum}`;
    throw new Error(`${fieldLabel} harus berupa angka ${requirement}.`);
  }

  return numberValue;
};

export const normalizeLabMember = (member, { requireClass = false } = {}) => {
  const uid = cleanText(member?.uid);
  const nama = cleanText(member?.nama);
  const nomorInduk = cleanText(member?.nomorInduk);
  const kelas = cleanText(member?.kelas);
  const email = cleanText(member?.email).toLowerCase();

  if (!nama || !nomorInduk) {
    throw new Error('Nama dan nomor induk anggota wajib diisi.');
  }
  if (requireClass && !kelas) {
    throw new Error(`Kelas praktikan ${nama} wajib diisi.`);
  }

  return {
    ...(uid ? { uid } : {}),
    nama,
    nomorInduk,
    ...(kelas ? { kelas } : {}),
    ...(email ? { email } : {}),
  };
};

const membersMatch = (firstMember, secondMember) => {
  const firstUid = cleanIdentifier(firstMember?.uid);
  const secondUid = cleanIdentifier(secondMember?.uid);
  const firstNumber = cleanIdentifier(firstMember?.nomorInduk);
  const secondNumber = cleanIdentifier(secondMember?.nomorInduk);

  return Boolean(
    (firstUid && secondUid && firstUid === secondUid) ||
    (firstNumber && secondNumber && firstNumber === secondNumber)
  );
};

export const mergeLabMembers = (
  existingMembers = [],
  incomingMembers = [],
  options = {},
) => {
  const mergedMembers = existingMembers.map((member) => normalizeLabMember(member, options));

  for (const rawMember of incomingMembers) {
    const member = normalizeLabMember(rawMember, options);
    const existingIndex = mergedMembers.findIndex((current) => membersMatch(current, member));

    if (existingIndex >= 0) {
      mergedMembers[existingIndex] = {
        ...mergedMembers[existingIndex],
        ...member,
      };
    } else {
      mergedMembers.push(member);
    }
  }

  return mergedMembers;
};

const getMemberIds = (members) => [
  ...new Set(members.map((member) => cleanText(member.uid)).filter(Boolean)),
];

const mapLabData = (id, data) => ({
  id,
  ...data,
  courseCode: cleanText(data.courseCode),
  courseName: cleanText(data.courseName),
  address: cleanText(data.address),
  latitude: data.location?.latitude ?? null,
  longitude: data.location?.longitude ?? null,
  radiusMeters: Number.isFinite(Number(data.radiusMeters)) ? Number(data.radiusMeters) : 50,
  gracePeriodMinutes: Number.isFinite(Number(data.gracePeriodMinutes))
    ? Number(data.gracePeriodMinutes)
    : 15,
  lateFineAmount: Number.isFinite(Number(data.lateFineAmount))
    ? Number(data.lateFineAmount)
    : 10_000,
  aslabId: cleanText(data.aslabId),
  asprakIds: Array.isArray(data.asprakIds) ? data.asprakIds.filter((idValue) => typeof idValue === 'string' && idValue.trim()) : [],
  asprakMembers: Array.isArray(data.asprakMembers) ? data.asprakMembers : [],
  studentIds: Array.isArray(data.studentIds) ? data.studentIds.filter((idValue) => typeof idValue === 'string' && idValue.trim()) : [],
  studentMembers: Array.isArray(data.studentMembers) ? data.studentMembers : [],
  isActive: data.isActive !== false,
});

const mapLabDocument = (documentSnapshot) => mapLabData(
  documentSnapshot.id,
  documentSnapshot.data(),
);

export const validateLabInput = (labInput) => {
  const name = cleanText(labInput?.name);
  const code = cleanText(labInput?.code).toUpperCase();
  const courseCode = cleanText(labInput?.courseCode).toUpperCase();
  const courseName = cleanText(labInput?.courseName);
  const address = cleanText(labInput?.address);
  const coordinates = validateCoordinates(labInput?.latitude, labInput?.longitude);
  const radiusMeters = parseNumericField(labInput?.radiusMeters, {
    fieldLabel: 'Radius laboratorium',
    fallback: 50,
    minimum: 0,
    strictlyPositive: true,
  });
  const gracePeriodMinutes = parseNumericField(labInput?.gracePeriodMinutes, {
    fieldLabel: 'Grace period',
    fallback: 15,
    minimum: 0,
  });
  const lateFineAmount = parseNumericField(labInput?.lateFineAmount, {
    fieldLabel: 'Nominal denda',
    fallback: 10_000,
    minimum: 0,
  });

  if (!name || !code) {
    throw new Error('Nama dan kode laboratorium wajib diisi.');
  }

  return {
    name,
    code,
    courseCode,
    courseName,
    address,
    location: new GeoPoint(coordinates.latitude, coordinates.longitude),
    radiusMeters,
    gracePeriodMinutes,
    lateFineAmount,
  };
};

const requireUserId = (userId) => {
  const cleanUserId = cleanText(userId);
  if (!cleanUserId) throw new Error('Sesi Aslab tidak tersedia. Silakan masuk kembali.');
  return cleanUserId;
};

export const getLabs = async ({ activeOnly = false } = {}) => {
  const snapshot = await getDocs(collection(db, LABS_COLLECTION));
  return snapshot.docs
    .map(mapLabDocument)
    .filter((lab) => !activeOnly || lab.isActive)
    .sort((firstLab, secondLab) => firstLab.name.localeCompare(secondLab.name));
};

export const getLabById = async (labId) => {
  if (!labId) return null;
  const snapshot = await getDoc(doc(db, LABS_COLLECTION, labId));
  return snapshot.exists() ? mapLabDocument(snapshot) : null;
};

export const subscribeToLabs = (onUpdate, onError, { activeOnly = false } = {}) => onSnapshot(
  collection(db, LABS_COLLECTION),
  (snapshot) => {
    const labs = snapshot.docs
      .map(mapLabDocument)
      .filter((lab) => !activeOnly || lab.isActive)
      .sort((firstLab, secondLab) => firstLab.name.localeCompare(secondLab.name));
    onUpdate(labs);
  },
  onError,
);

export const createLab = async (labInput, userId) => {
  const cleanUserId = requireUserId(userId);
  const validatedLab = validateLabInput(labInput);
  const reference = await addDoc(collection(db, LABS_COLLECTION), {
    ...validatedLab,
    aslabId: cleanText(labInput?.aslabId) || cleanUserId,
    asprakIds: [],
    asprakMembers: [],
    studentIds: [],
    studentMembers: [],
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: cleanUserId,
  });
  return reference.id;
};

export const updateLab = async (labId, labInput, userId) => {
  if (!labId) throw new Error('ID laboratorium wajib diisi.');
  const cleanUserId = requireUserId(userId);
  const validatedLab = validateLabInput(labInput);
  await updateDoc(doc(db, LABS_COLLECTION, labId), {
    ...validatedLab,
    updatedAt: serverTimestamp(),
    updatedBy: cleanUserId,
  });
};

export const setLabActiveState = async (labId, isActive, userId) => {
  if (!labId) throw new Error('ID laboratorium wajib diisi.');
  const cleanUserId = requireUserId(userId);

  if (!isActive) {
    const activeSessionQuery = query(
      collection(db, 'sessions'),
      where('labId', '==', labId),
      where('status', '==', 'open'),
    );
    const activeSessions = await getDocs(activeSessionQuery);
    if (!activeSessions.empty) {
      throw new Error('Laboratorium tidak dapat dinonaktifkan karena masih digunakan oleh sesi yang sedang dibuka.');
    }
  }

  await updateDoc(doc(db, LABS_COLLECTION, labId), {
    isActive,
    updatedAt: serverTimestamp(),
    updatedBy: cleanUserId,
  });
};

export const bulkCreateLabsByCourse = async ({
  courseCode,
  courseName,
  labs,
  userId,
}) => {
  const cleanUserId = requireUserId(userId);
  const cleanCourseCode = cleanText(courseCode).toUpperCase();
  const cleanCourseName = cleanText(courseName);

  if (!cleanCourseCode || !cleanCourseName) {
    throw new Error('Kode dan nama mata kuliah wajib diisi.');
  }
  if (!Array.isArray(labs) || labs.length === 0) {
    throw new Error('Tidak ada data laboratorium yang dapat disimpan.');
  }
  if (labs.length > MAX_BATCH_WRITES) {
    throw new Error(`Maksimal ${MAX_BATCH_WRITES} laboratorium dapat disimpan dalam satu batch.`);
  }

  const normalizedLabs = labs.map((lab) => validateLabInput({
    ...lab,
    courseCode: cleanCourseCode,
    courseName: cleanCourseName,
  }));
  const codes = normalizedLabs.map((lab) => lab.code);
  if (new Set(codes).size !== codes.length) {
    throw new Error('Kode laboratorium dalam satu batch tidak boleh duplikat.');
  }

  const batch = writeBatch(db);
  const ids = normalizedLabs.map((lab) => {
    const reference = doc(collection(db, LABS_COLLECTION));
    batch.set(reference, {
      ...lab,
      aslabId: cleanUserId,
      asprakIds: [],
      asprakMembers: [],
      studentIds: [],
      studentMembers: [],
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: cleanUserId,
    });
    return reference.id;
  });

  await batch.commit();
  return { success: true, count: ids.length, ids };
};

const bulkAssignMembersToLab = async ({
  labId,
  members,
  userId,
  memberField,
  idField,
  requireClass,
}) => {
  if (!labId) throw new Error('Laboratorium tujuan wajib dipilih.');
  if (!Array.isArray(members) || members.length === 0) {
    throw new Error('Tidak ada anggota yang dapat disimpan.');
  }
  const cleanUserId = requireUserId(userId);
  const labReference = doc(db, LABS_COLLECTION, labId);

  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(labReference);
    if (!snapshot.exists()) throw new Error('Laboratorium tujuan tidak ditemukan.');

    const labData = snapshot.data();
    const mergedMembers = mergeLabMembers(
      Array.isArray(labData[memberField]) ? labData[memberField] : [],
      members,
      { requireClass },
    );
    transaction.update(labReference, {
      [memberField]: mergedMembers,
      [idField]: getMemberIds(mergedMembers),
      updatedAt: serverTimestamp(),
      updatedBy: cleanUserId,
    });

    return { success: true, count: mergedMembers.length };
  });
};

export const bulkAssignStudentsToLab = (params) => bulkAssignMembersToLab({
  ...params,
  memberField: 'studentMembers',
  idField: 'studentIds',
  requireClass: true,
});

export const bulkAssignAspraksToLab = (params) => bulkAssignMembersToLab({
  ...params,
  memberField: 'asprakMembers',
  idField: 'asprakIds',
  requireClass: false,
});

const findMemberIndex = (members, identifier) => {
  const cleanTarget = cleanIdentifier(identifier);
  return members.findIndex((member) => (
    cleanIdentifier(member.uid) === cleanTarget ||
    cleanIdentifier(member.nomorInduk) === cleanTarget
  ));
};

const validateTransferInput = ({ fromLabId, toLabId, identifier, userId }) => {
  if (!fromLabId || !toLabId) throw new Error('Laboratorium asal dan tujuan wajib dipilih.');
  if (fromLabId === toLabId) throw new Error('Laboratorium tujuan harus berbeda dari laboratorium asal.');
  if (!cleanText(identifier)) throw new Error('Anggota yang akan dipindahkan wajib dipilih.');
  return requireUserId(userId);
};

export const transferStudentBetweenLabs = async ({
  fromLabId,
  toLabId,
  studentIdentifier,
  userId,
}) => {
  const cleanUserId = validateTransferInput({
    fromLabId,
    toLabId,
    identifier: studentIdentifier,
    userId,
  });
  const sourceReference = doc(db, LABS_COLLECTION, fromLabId);
  const targetReference = doc(db, LABS_COLLECTION, toLabId);

  return runTransaction(db, async (transaction) => {
    const [sourceSnapshot, targetSnapshot] = await Promise.all([
      transaction.get(sourceReference),
      transaction.get(targetReference),
    ]);
    if (!sourceSnapshot.exists() || !targetSnapshot.exists()) {
      throw new Error('Laboratorium asal atau tujuan tidak ditemukan.');
    }

    const sourceMembers = Array.isArray(sourceSnapshot.data().studentMembers)
      ? sourceSnapshot.data().studentMembers
      : [];
    const memberIndex = findMemberIndex(sourceMembers, studentIdentifier);
    if (memberIndex < 0) throw new Error('Praktikan tidak ditemukan pada laboratorium asal.');

    const [movedMember] = sourceMembers.splice(memberIndex, 1);
    const targetMembers = mergeLabMembers(
      Array.isArray(targetSnapshot.data().studentMembers)
        ? targetSnapshot.data().studentMembers
        : [],
      [movedMember],
      { requireClass: true },
    );
    const auditFields = { updatedAt: serverTimestamp(), updatedBy: cleanUserId };

    transaction.update(sourceReference, {
      studentMembers: sourceMembers,
      studentIds: getMemberIds(sourceMembers),
      ...auditFields,
    });
    transaction.update(targetReference, {
      studentMembers: targetMembers,
      studentIds: getMemberIds(targetMembers),
      ...auditFields,
    });

    return { success: true, member: movedMember };
  });
};

export const transferAsprakBetweenLabs = async ({
  fromLabId,
  toLabId,
  asprakIdentifier,
  userId,
}) => {
  const cleanUserId = validateTransferInput({
    fromLabId,
    toLabId,
    identifier: asprakIdentifier,
    userId,
  });
  const sourceReference = doc(db, LABS_COLLECTION, fromLabId);
  const targetReference = doc(db, LABS_COLLECTION, toLabId);

  return runTransaction(db, async (transaction) => {
    const [sourceSnapshot, targetSnapshot] = await Promise.all([
      transaction.get(sourceReference),
      transaction.get(targetReference),
    ]);
    if (!sourceSnapshot.exists() || !targetSnapshot.exists()) {
      throw new Error('Laboratorium asal atau tujuan tidak ditemukan.');
    }

    const sourceData = sourceSnapshot.data();
    const targetData = targetSnapshot.data();
    const auditFields = { updatedAt: serverTimestamp(), updatedBy: cleanUserId };

    if (cleanIdentifier(sourceData.aslabId) === cleanIdentifier(asprakIdentifier)) {
      if (targetData.aslabId && cleanIdentifier(targetData.aslabId) !== cleanIdentifier(asprakIdentifier)) {
        throw new Error('Laboratorium tujuan sudah memiliki Aslab penanggung jawab.');
      }
      transaction.update(sourceReference, { aslabId: '', ...auditFields });
      transaction.update(targetReference, { aslabId: cleanText(sourceData.aslabId), ...auditFields });
      return { success: true, memberType: 'aslab', uid: cleanText(sourceData.aslabId) };
    }

    const sourceMembers = Array.isArray(sourceData.asprakMembers)
      ? [...sourceData.asprakMembers]
      : [];
    const memberIndex = findMemberIndex(sourceMembers, asprakIdentifier);
    if (memberIndex < 0) throw new Error('Asprak tidak ditemukan pada laboratorium asal.');

    const [movedMember] = sourceMembers.splice(memberIndex, 1);
    const targetMembers = mergeLabMembers(
      Array.isArray(targetData.asprakMembers) ? targetData.asprakMembers : [],
      [movedMember],
    );

    transaction.update(sourceReference, {
      asprakMembers: sourceMembers,
      asprakIds: getMemberIds(sourceMembers),
      ...auditFields,
    });
    transaction.update(targetReference, {
      asprakMembers: targetMembers,
      asprakIds: getMemberIds(targetMembers),
      ...auditFields,
    });

    return { success: true, memberType: 'asprak', member: movedMember };
  });
};
