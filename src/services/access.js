import { httpsCallable } from 'firebase/functions'
import { firebaseConfig, functions } from '../firebase/config'

export async function requireAppAccess(user) {
  if (!functions || !firebaseConfig.appId) throw new Error('Firebase Access Manager is not configured.')
  const result = await httpsCallable(functions, 'checkMyAccess')({ appId: firebaseConfig.appId })
  const data = result.data && typeof result.data === 'object' ? result.data : {}
  if (data.allowed !== true) {
    const error = new Error('Your account is not approved for Attendance WA Sender. Contact the administrator for access.')
    error.code = 'access/denied'
    throw error
  }
  return user
}
