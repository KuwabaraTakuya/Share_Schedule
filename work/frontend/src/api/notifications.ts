import { apiRequest } from './client'

export async function registerFCMToken(token: string): Promise<void> {
  return apiRequest<void>('/api/v1/notifications/token', {
    method: 'POST',
    body: JSON.stringify({ token }),
  })
}

export async function updateNotificationSettings(settings: {
  quietHoursStart?: string
  quietHoursEnd?: string
  enabled?: boolean
}): Promise<void> {
  return apiRequest<void>('/api/v1/notifications/settings', {
    method: 'PATCH',
    body: JSON.stringify(settings),
  })
}
