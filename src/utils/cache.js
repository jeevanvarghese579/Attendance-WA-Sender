// Lightweight localStorage cache layer. Used to cache the last-known
// Firestore state so the UI can render instantly while reconnecting.

const PREFIX = 'absenteeManager:'

const key = (uid, suffix) => `${PREFIX}${uid}:${suffix}`

function safeSet(k, value) {
  try {
    localStorage.setItem(k, JSON.stringify(value))
  } catch {
    // storage full / unavailable — ignore.
  }
}

function safeGet(k) {
  try {
    const raw = localStorage.getItem(k)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const cache = {
  getSettings(uid) {
    return safeGet(key(uid, 'settings'))
  },
  setSettings(uid, settings) {
    safeSet(key(uid, 'settings'), settings)
  },
  getClasses(uid) {
    return safeGet(key(uid, 'classes')) || []
  },
  setClasses(uid, classes) {
    safeSet(key(uid, 'classes'), classes)
  },
  getActiveClassId(uid) {
    return safeGet(key(uid, 'activeClassId')) || null
  },
  setActiveClassId(uid, classId) {
    safeSet(key(uid, 'activeClassId'), classId)
  },
  getStudents(uid) {
    return safeGet(key(uid, 'students')) || []
  },
  setStudents(uid, students) {
    safeSet(key(uid, 'students'), students)
  },
  getColumns(uid) {
    const v = safeGet(key(uid, 'columns'))
    return typeof v === 'number' ? v : 5
  },
  setColumns(uid, n) {
    safeSet(key(uid, 'columns'), n)
  },
  clear(uid) {
    try {
      const base = `${PREFIX}${uid}:`
      const toRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k && k.startsWith(base)) toRemove.push(k)
      }
      toRemove.forEach((k) => localStorage.removeItem(k))
    } catch {
      // ignore
    }
  },
}
