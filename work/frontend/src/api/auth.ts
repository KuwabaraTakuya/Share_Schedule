import { apiRequest } from './client'
import type { User } from '../types'

export async function verifyAndRegister(idToken: string): Promise<User> {
  return apiRequest<User>('/api/v1/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  })
}
