import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useAuth } from './AuthContext'
import { isFirebaseConfigured } from '../firebase/config'
import {
  watchSettings,
  watchStudents,
  watchClasses,
  saveSettingsDoc,
  addStudent,
  updateStudent,
  deleteStudent,
  replaceStudents,
  replaceClasses,
  resetAllUserData,
  addClass,
  updateClass,
  deleteClass,
} from '../services/firestoreService'
import { cache } from '../utils/cache'

const DataContext = createContext(null)

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataContextProvider')
  return ctx
}

const DEMO_SEED_KEY = 'absenteeManager:demoSeeded'

const DEFAULT_SETTINGS = {
  region: 'India',
}

function makeId() {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function DataContextProvider({ children }) {
  const { currentUser, isDemoMode } = useAuth()
  const uid = currentUser?.uid

  const [settings, setSettings] = useState(() =>
    uid ? cache.getSettings(uid) || DEFAULT_SETTINGS : DEFAULT_SETTINGS
  )
  const [classes, setClasses] = useState(() => (uid ? cache.getClasses(uid) : []))
  const [activeClassId, setActiveClassIdRaw] = useState(() =>
    uid ? cache.getActiveClassId(uid) : null
  )
  const [allStudents, setAllStudents] = useState(() => (uid ? cache.getStudents(uid) : []))
  const [columns, setColumns] = useState(() => (uid ? cache.getColumns(uid) : 5))
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState('')
  const unsubRef = useRef({ settings: null, students: null, classes: null })

  // Derived: active class object
  const activeClass = useMemo(
    () => classes.find((c) => c.id === activeClassId) || classes[0] || null,
    [classes, activeClassId]
  )

  // Keep activeClassId in sync if active class is deleted
  const resolvedActiveClassId = activeClass?.id || null

  // Students scoped to the active class
  const students = useMemo(
    () => allStudents.filter((s) => s.classId === resolvedActiveClassId),
    [allStudents, resolvedActiveClassId]
  )

  const setActiveClassId = useCallback(
    (id) => {
      setActiveClassIdRaw(id)
      if (uid) cache.setActiveClassId(uid, id)
    },
    [uid]
  )

  // Reset state when user changes
  useEffect(() => {
    if (!uid) {
      setSettings(DEFAULT_SETTINGS)
      setClasses([])
      setActiveClassIdRaw(null)
      setAllStudents([])
      setColumns(5)
      setDataLoading(false)
      return
    }
    const cachedSettings = cache.getSettings(uid)
    const cachedStudents = cache.getStudents(uid)
    const cachedClasses = cache.getClasses(uid)
    const cachedActiveClassId = cache.getActiveClassId(uid)
    if (cachedSettings) setSettings(cachedSettings)
    if (cachedStudents?.length) setAllStudents(cachedStudents)
    if (cachedClasses?.length) setClasses(cachedClasses)
    if (cachedActiveClassId) setActiveClassIdRaw(cachedActiveClassId)
    setColumns(cache.getColumns(uid))
    setDataLoading(true)
  }, [uid])

  // Subscribe to Firestore (real config only)
  useEffect(() => {
    if (!uid || isDemoMode || !isFirebaseConfigured) {
      setDataLoading(false)
      return
    }
    unsubRef.current.settings?.()
    unsubRef.current.students?.()
    unsubRef.current.classes?.()

    setDataLoading(true)
    unsubRef.current.settings = watchSettings(
      uid,
      (s) => {
        const next = s ?? DEFAULT_SETTINGS
        setSettings(next)
        cache.setSettings(uid, next)
      },
      (err) => {
        setDataError(err?.message || 'Failed to load settings')
        setDataLoading(false)
      }
    )
    unsubRef.current.students = watchStudents(
      uid,
      (list) => {
        setAllStudents(list)
        cache.setStudents(uid, list)
        setDataLoading(false)
      },
      (err) => {
        setDataError(err?.message || 'Failed to load students')
        setDataLoading(false)
      }
    )
    unsubRef.current.classes = watchClasses(
      uid,
      (list) => {
        setClasses(list)
        cache.setClasses(uid, list)
      },
      (err) => {
        setDataError(err?.message || 'Failed to load classes')
      }
    )

    return () => {
      unsubRef.current.settings?.()
      unsubRef.current.students?.()
      unsubRef.current.classes?.()
      unsubRef.current.settings = null
      unsubRef.current.students = null
      unsubRef.current.classes = null
    }
  }, [uid, isDemoMode])

  // Demo seed: first login creates one default class + seed students
  useEffect(() => {
    if (!uid || !isDemoMode) return
    try {
      if (!localStorage.getItem(DEMO_SEED_KEY)) {
        const classId = makeId()
        const seedClass = { id: classId, name: 'Class X-A' }
        const seedClasses = [seedClass]
        const seedStudents = [
          { id: makeId(), rollNo: 1, name: 'Akhila', classId },
          { id: makeId(), rollNo: 2, name: 'Anjana', classId },
          { id: makeId(), rollNo: 3, name: 'Fathima', classId },
          { id: makeId(), rollNo: 4, name: 'Lakshmi', classId },
          { id: makeId(), rollNo: 5, name: 'Reshma', classId },
          { id: makeId(), rollNo: 6, name: 'Sneha', classId },
          { id: makeId(), rollNo: 7, name: 'Divya', classId },
          { id: makeId(), rollNo: 8, name: 'Maya', classId },
          { id: makeId(), rollNo: 9, name: 'Priya', classId },
          { id: makeId(), rollNo: 10, name: 'Riya', classId },
        ]
        const newSettings = { region: 'India' }
        setSettings(newSettings)
        setClasses(seedClasses)
        setActiveClassIdRaw(classId)
        setAllStudents(seedStudents)
        cache.setSettings(uid, newSettings)
        cache.setClasses(uid, seedClasses)
        cache.setActiveClassId(uid, classId)
        cache.setStudents(uid, seedStudents)
        localStorage.setItem(DEMO_SEED_KEY, '1')
      }
    } catch {
      // ignore
    }
  }, [uid, isDemoMode])

  // ---- Class mutations ----

  const addClassEntry = useCallback(
    async (name) => {
      const trimmed = String(name || '').trim()
      if (!trimmed) return null
      if (isDemoMode || !isFirebaseConfigured) {
        const newClass = { id: makeId(), name: trimmed }
        setClasses((prev) => {
          const next = [...prev, newClass]
          cache.setClasses(uid, next)
          return next
        })
        setActiveClassId(newClass.id)
        return newClass
      }
      const saved = await addClass(uid, trimmed)
      // Don't update local state - let watchClasses handle it
      setActiveClassId(saved.id)
      return saved
    },
    [uid, setActiveClassId, isDemoMode]
  )

  const renameClass = useCallback(
    async (id, name) => {
      const trimmed = String(name || '').trim()
      if (!trimmed) return
      if (isDemoMode || !isFirebaseConfigured) {
        setClasses((prev) => {
          const next = prev.map((c) => (c.id === id ? { ...c, name: trimmed } : c))
          cache.setClasses(uid, next)
          return next
        })
        return
      }
      await updateClass(uid, id, trimmed)
      // Don't update local state - let watchClasses handle it
    },
    [uid, isDemoMode]
  )

  const deleteClassEntry = useCallback(
    async (id) => {
      if (isDemoMode || !isFirebaseConfigured) {
        setClasses((prev) => {
          const next = prev.filter((c) => c.id !== id)
          cache.setClasses(uid, next)
          // Switch active class if needed
          if (resolvedActiveClassId === id) {
            const fallback = next[0]?.id || null
            setActiveClassIdRaw(fallback)
            cache.setActiveClassId(uid, fallback)
          }
          return next
        })
        // Remove all students in that class
        setAllStudents((prev) => {
          const next = prev.filter((s) => s.classId !== id)
          cache.setStudents(uid, next)
          return next
        })
        return
      }
      await deleteClass(uid, id)
      // Don't update local state - let watchClasses/watchStudents handle it
    },
    [uid, resolvedActiveClassId, isDemoMode]
  )

  // ---- Settings ----

  const persistSettings = useCallback(
    async (patch) => {
      const next = { ...settings, ...patch }
      setSettings(next)
      cache.setSettings(uid, next)
      if (isDemoMode || !isFirebaseConfigured) return next
      try {
        await saveSettingsDoc(uid, next)
      } catch (e) {
        setDataError(e?.message || 'Failed to save settings')
        throw e
      }
      return next
    },
    [settings, uid, isDemoMode]
  )

  const persistColumns = useCallback(
    (n) => {
      setColumns(n)
      if (uid) cache.setColumns(uid, n)
    },
    [uid]
  )

  // ---- Student mutations (all scoped to resolvedActiveClassId) ----

  const addStudentRow = useCallback(
    async (student) => {
      if (isDemoMode || !isFirebaseConfigured) {
        const row = { id: makeId(), classId: resolvedActiveClassId, ...student }
        setAllStudents((prev) => [...prev, row].sort((a, b) => a.rollNo - b.rollNo))
        cache.setStudents(uid, [...allStudents, row].sort((a, b) => a.rollNo - b.rollNo))
        return row
      }
      // Don't update local state - let watchStudents handle it
      return await addStudent(uid, { ...student, classId: resolvedActiveClassId })
    },
    [uid, isDemoMode, allStudents, resolvedActiveClassId]
  )

  const updateStudentRow = useCallback(
    async (id, student) => {
      if (isDemoMode || !isFirebaseConfigured) {
        setAllStudents((prev) =>
          prev.map((s) => (s.id === id ? { ...s, ...student } : s)).sort((a, b) => a.rollNo - b.rollNo)
        )
        return
      }
      await updateStudent(uid, id, student)
      // Don't update local state - let watchStudents handle it
    },
    [uid, isDemoMode]
  )

  const deleteStudentRow = useCallback(
    async (id) => {
      if (isDemoMode || !isFirebaseConfigured) {
        setAllStudents((prev) => prev.filter((s) => s.id !== id))
        return
      }
      await deleteStudent(uid, id)
      // Don't update local state - let watchStudents handle it
    },
    [uid, isDemoMode]
  )

  const importStudents = useCallback(
    async (incoming) => {
      const withIds = incoming.map((s) => ({
        id: s.id || makeId(),
        rollNo: Number(s.rollNo),
        name: String(s.name || '').trim(),
        classId: resolvedActiveClassId,
      }))
      setAllStudents((prev) => {
        // Only merge within the active class by rollNo
        const map = new Map()
        prev.filter((s) => s.classId !== resolvedActiveClassId).forEach((s) => {
          // keep other-class students as-is keyed by id
          map.set(`other:${s.id}`, s)
        })
        const classMap = new Map()
        prev.filter((s) => s.classId === resolvedActiveClassId).forEach((s) => classMap.set(s.rollNo, s))
        withIds.forEach((s) => {
          const existing = classMap.get(s.rollNo)
          classMap.set(s.rollNo, { ...existing, ...s, id: existing?.id || s.id })
        })
        const merged = [
          ...Array.from(map.values()),
          ...Array.from(classMap.values()),
        ].sort((a, b) => a.rollNo - b.rollNo)
        cache.setStudents(uid, merged)
        return merged
      })

      if (isDemoMode || !isFirebaseConfigured) return
      const merged = (() => {
        const classMap = new Map()
        allStudents.filter((s) => s.classId === resolvedActiveClassId).forEach((s) => classMap.set(s.rollNo, s))
        withIds.forEach((s) => {
          const existing = classMap.get(s.rollNo)
          classMap.set(s.rollNo, { ...existing, ...s, id: existing?.id || s.id })
        })
        return [
          ...allStudents.filter((s) => s.classId !== resolvedActiveClassId),
          ...Array.from(classMap.values()),
        ].sort((a, b) => a.rollNo - b.rollNo)
      })()
      await replaceStudents(uid, merged)
      cache.setStudents(uid, merged)
    },
    [uid, isDemoMode, allStudents, resolvedActiveClassId]
  )

  const wipeAll = useCallback(async () => {
    setSettings(DEFAULT_SETTINGS)
    setClasses([])
    setActiveClassIdRaw(null)
    setAllStudents([])
    setColumns(5)
    if (uid) cache.clear(uid)
    if (isDemoMode || !isFirebaseConfigured) return
    await resetAllUserData(uid)
  }, [uid, isDemoMode])

  const restoreFromBackup = useCallback(
    async (payload) => {
      const newSettings = payload.settings || DEFAULT_SETTINGS
      const newClasses = payload.classes || []
      const newStudents = (payload.students || []).map((s) => ({
        ...s,
        rollNo: Number(s.rollNo),
        name: String(s.name || '').trim(),
      }))
      setSettings(newSettings)
      setClasses(newClasses)
      setAllStudents(newStudents)
      if (newClasses[0]) setActiveClassIdRaw(newClasses[0].id)
      cache.setSettings(uid, newSettings)
      cache.setClasses(uid, newClasses)
      cache.setStudents(uid, newStudents)
      if (isDemoMode || !isFirebaseConfigured) return
      await saveSettingsDoc(uid, newSettings)
      await replaceClasses(uid, newClasses)
      await replaceStudents(uid, newStudents)
    },
    [uid, isDemoMode]
  )

  const value = {
    settings,
    classes,
    activeClass,
    activeClassId: resolvedActiveClassId,
    setActiveClassId,
    addClassEntry,
    renameClass,
    deleteClassEntry,
    students,
    allStudents,
    columns,
    dataLoading,
    dataError,
    setDataError,
    persistSettings,
    persistColumns,
    addStudentRow,
    updateStudentRow,
    deleteStudentRow,
    importStudents,
    wipeAll,
    restoreFromBackup,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}