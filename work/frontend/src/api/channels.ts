import { apiRequest } from './client'
import type { Channel } from '../types'

export async function getChannels(communityId: string): Promise<Channel[]> {
  return apiRequest<Channel[]>(`/api/v1/communities/${communityId}/channels`)
}

export async function createChannel(
  communityId: string,
  data: { name: string; type: 'text' | 'date'; date?: string },
): Promise<Channel> {
  return apiRequest<Channel>(`/api/v1/communities/${communityId}/channels`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteChannel(channelId: string): Promise<void> {
  return apiRequest<void>(`/api/v1/channels/${channelId}`, {
    method: 'DELETE',
  })
}

export async function updateChannelPosition(
  channelId: string,
  position: number,
): Promise<void> {
  return apiRequest<void>(`/api/v1/channels/${channelId}/position`, {
    method: 'PATCH',
    body: JSON.stringify({ position }),
  })
}
