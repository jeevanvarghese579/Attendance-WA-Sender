import { httpsCallable } from 'firebase/functions'
import { firebaseConfig, functions } from '../firebase/config'
import { offerAccessRequest } from './accessRequestDialog'

export async function requireAppAccess(user) {
  if (!functions || !firebaseConfig.appId) throw new Error('Firebase Access Manager is not configured.')
  const result = await httpsCallable(functions, 'checkMyAccess')({ appId: firebaseConfig.appId })
  const data = result.data && typeof result.data === 'object' ? result.data : {}
  if (data.allowed !== true) {
    await offerAccessRequest({
      appName: 'Attendance WA Sender',
      requestStatus: data.requestStatus,
      sendRequest: async () => (await httpsCallable(functions, 'requestAppAccess')({
        appId: firebaseConfig.appId,
        requestType: 'access-request',
      })).data,
    })
    const error = new Error(data.requestStatus === 'pending'
      ? 'Your access request is awaiting administrator approval.'
      : 'Your account is not approved for Attendance WA Sender.')
    error.code = 'access/denied'
    throw error
  }
  return user
}
