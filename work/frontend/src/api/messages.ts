import { apiRequest } from './client'
import type { Message, PaginatedMessages, LocationData } from '../types'

export async function getMessages(
  channelId: string,
  cursor?: string,
): Promise<PaginatedMessages> {
  const params = new URLSearchParams()
  if (cursor) params.set('cursor', cursor)
  params.set('limit', '50')
  return apiRequest<PaginatedMessages>(
    `/api/v1/channels/${channelId}/messages?${params.toString()}`,
  )
}

export async function sendMessage(
  channelId: string,
  data: {
    content: string
    type?: Message['type']
    location?: LocationData
  },
): Promise<Message> {
  return apiRequest<Message>(`/api/v1/channels/${channelId}/messages`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function editMessage(
  messageId: string,
  content: string,
): Promise<Message> {
  return apiRequest<Message>(`/api/v1/messages/${messageId}`, {
    method: 'PATCH',
    body: JSON.stringify({ content }),
  })
}

export async function deleteMessage(messageId: string): Promise<void> {
  return apiRequest<void>(`/api/v1/messages/${messageId}`, {
    method: 'DELETE',
  })
}

export async function addReaction(
  messageId: string,
  emoji: string,
): Promise<void> {
  return apiRequest<void>(`/api/v1/messages/${messageId}/reactions`, {
    method: 'POST',
    body: JSON.stringify({ emoji }),
  })
}

export async function removeReaction(
  messageId: string,
  emoji: string,
): Promise<void> {
  return apiRequest<void>(
    `/api/v1/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`,
    { method: 'DELETE' },
  )
}

export async function searchMessages(
  query: string,
  communityId: string,
): Promise<Message[]> {
  const params = new URLSearchParams({ q: query, communityId })
  return apiRequest<Message[]>(`/api/v1/search/messages?${params.toString()}`)
}
