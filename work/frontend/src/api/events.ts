import { apiRequest, apiRequestFormData } from './client'
import type { CalendarEvent, DayAvailability, ParsedEvent } from '../types'

export async function getEvents(start: string, end: string): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({ start, end })
  return apiRequest<CalendarEvent[]>(`/api/v1/events?${params.toString()}`)
}

export async function createEvent(
  data: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<CalendarEvent> {
  return apiRequest<CalendarEvent>('/api/v1/events', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateEvent(
  id: string,
  data: Partial<CalendarEvent>,
): Promise<CalendarEvent> {
  return apiRequest<CalendarEvent>(`/api/v1/events/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteEvent(id: string): Promise<void> {
  return apiRequest<void>(`/api/v1/events/${id}`, { method: 'DELETE' })
}

export async function parseEventFromText(
  text: string,
  timezone = 'Asia/Tokyo',
): Promise<ParsedEvent> {
  return apiRequest<ParsedEvent>('/api/v1/events/parse', {
    method: 'POST',
    body: JSON.stringify({ text, timezone }),
  })
}

export async function parseEventFromVoice(
  audioBlob: Blob,
  timezone = 'Asia/Tokyo',
): Promise<ParsedEvent> {
  const formData = new FormData()
  formData.append('audio', audioBlob, 'audio.webm')
  formData.append('timezone', timezone)
  return apiRequestFormData<ParsedEvent>('/api/v1/events/voice', formData)
}

export async function getAvailability(
  communityId: string,
  month: string,
): Promise<DayAvailability[]> {
  const params = new URLSearchParams({ month })
  return apiRequest<DayAvailability[]>(
    `/api/v1/communities/${communityId}/availability?${params.toString()}`,
  )
}

export async function syncGoogleCalendar(
  accessToken: string,
  start?: string,
  end?: string,
): Promise<{ synced: number }> {
  return apiRequest<{ synced: number }>('/api/v1/events/sync/google', {
    method: 'POST',
    body: JSON.stringify({ accessToken, start, end }),
  })
}

export async function importICS(file: File): Promise<{ imported: number; total: number }> {
  const formData = new FormData()
  formData.append('file', file)
  return apiRequestFormData<{ imported: number; total: number }>('/api/v1/events/import/ics', formData)
}
