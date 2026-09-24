import { doc } from 'firebase/firestore'
import { db } from './config'

export const APP_KEY = 'attendanceWaSender'
export const userRootPath = (uid) => `apps/${APP_KEY}/users/${uid}`
export const userSubcollectionPath = (uid, name) => `${userRootPath(uid)}/${name}`
export const userRootDocument = (uid) => doc(db, 'apps', APP_KEY, 'users', uid)

