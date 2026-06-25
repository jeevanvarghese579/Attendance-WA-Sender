import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../firebase/config'

// ----------------------------------------------------------------------------
// Multi-user data isolation:
//   users/{uid}/settings/{docId}
//   users/{uid}/students/{docId}
//   users/{uid}/absentees/{docId}
//   users/{uid}/backups/{docId}
// ----------------------------------------------------------------------------

const userScope = (uid, sub) => `users/${uid}/${sub}`

const subCol = (uid, sub) => collection(db, userScope(uid, sub))

// --------------------------- Settings ---------------------------

export const SETTINGS_DOC_ID = 'main'

export async function fetchSettings(uid) {
  const ref = doc(db, userScope(uid, 'settings'), SETTINGS_DOC_ID)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function saveSettingsDoc(uid, data) {
  const ref = doc(db, userScope(uid, 'settings'), SETTINGS_DOC_ID)
  const existing = await getDoc(ref)
  const payload = { ...data }
  if (existing.exists()) {
    await updateDoc(ref, payload)
  } else {
    payload.createdAt = serverTimestamp()
    await setDoc(ref, payload, { merge: true })
  }
  return { id: ref.id, ...payload }
}

export function watchSettings(uid, cb, onError) {
  const ref = doc(db, userScope(uid, 'settings'), SETTINGS_DOC_ID)
  return onSnapshot(
    ref,
    (snap) => cb(snap.exists() ? { id: snap.id, ...snap.data() } : null),
    onError
  )
}

// --------------------------- Classes ---------------------------

export async function fetchClasses(uid) {
  const q = query(subCol(uid, 'classes'), orderBy('createdAt', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export function watchClasses(uid, cb, onError) {
  const q = query(subCol(uid, 'classes'), orderBy('createdAt', 'asc'))
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  )
}

export async function addClass(uid, name) {
  const ref = await addDoc(subCol(uid, 'classes'), {
    name: String(name || '').trim(),
    createdAt: serverTimestamp(),
  })
  return { id: ref.id, name: String(name || '').trim() }
}

export async function updateClass(uid, id, name) {
  const ref = doc(db, userScope(uid, 'classes'), id)
  await updateDoc(ref, { name: String(name || '').trim() })
}

export async function deleteClass(uid, id) {
  // Delete the class and its students.
  const batch = writeBatch(db)
  batch.delete(doc(db, userScope(uid, 'classes'), id))
  const studentsSnap = await getDocs(
    query(collection(db, userScope(uid, 'students')))
  )
  studentsSnap.forEach((d) => {
    if (d.data()?.classId === id) batch.delete(d.ref)
  })
  await batch.commit()
}

export async function replaceClasses(uid, classes) {
  const colRef = subCol(uid, 'classes')
  const existing = await getDocs(colRef)
  const batch = writeBatch(db)
  existing.forEach((d) => batch.delete(d.ref))
  classes.forEach((c) => {
    const newRef = doc(colRef)
    const payload = {
      name: String(c.name || '').trim(),
      createdAt: serverTimestamp(),
    }
    batch.set(newRef, payload)
  })
  await batch.commit()
}

// --------------------------- Students ---------------------------

export async function fetchStudents(uid) {
  const q = query(subCol(uid, 'students'), orderBy('rollNo', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export function watchStudents(uid, cb, onError) {
  const q = query(subCol(uid, 'students'), orderBy('rollNo', 'asc'))
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  )
}

export async function addStudent(uid, student) {
  const payload = {
    rollNo: Number(student.rollNo),
    name: String(student.name || '').trim(),
  }
  if (student.classId) payload.classId = student.classId
  const ref = await addDoc(subCol(uid, 'students'), payload)
  return { id: ref.id, ...payload }
}

export async function updateStudent(uid, id, student) {
  const ref = doc(db, userScope(uid, 'students'), id)
  await updateDoc(ref, {
    rollNo: Number(student.rollNo),
    name: String(student.name || '').trim(),
  })
}

export async function deleteStudent(uid, id) {
  const ref = doc(db, userScope(uid, 'students'), id)
  await deleteDoc(ref)
}

export async function replaceStudents(uid, students) {
  const colRef = subCol(uid, 'students')
  const existing = await getDocs(colRef)
  const batch = writeBatch(db)
  existing.forEach((d) => batch.delete(d.ref))
  students.forEach((s) => {
    const newRef = doc(colRef)
    const payload = {
      rollNo: Number(s.rollNo),
      name: String(s.name || '').trim(),
    }
    if (s.classId) payload.classId = s.classId
    batch.set(newRef, payload)
  })
  await batch.commit()
}

export async function clearStudents(uid) {
  const colRef = subCol(uid, 'students')
  const existing = await getDocs(colRef)
  const batch = writeBatch(db)
  existing.forEach((d) => batch.delete(d.ref))
  await batch.commit()
}

// --------------------------- Absentees ---------------------------

export async function saveAbsentees(uid, absenteeRecord) {
  // absenteeRecord: { date, selectedStudents } - stored keyed by date.
  const ref = doc(db, userScope(uid, 'absentees'), absenteeRecord.date)
  await setDoc(ref, absenteeRecord, { merge: true })
  return absenteeRecord
}

// --------------------------- Reset ---------------------------

export async function resetAllUserData(uid) {
  const batch = writeBatch(db)
  for (const sub of ['students', 'absentees', 'backups', 'classes']) {
    const snap = await getDocs(subCol(uid, sub))
    snap.forEach((d) => batch.delete(d.ref))
  }
  // settings doc
  const settingsRef = doc(db, userScope(uid, 'settings'), SETTINGS_DOC_ID)
  batch.delete(settingsRef)
  await batch.commit()
}