import { apiRequest } from './client'
import type { CommunityMember, Message, LocationData } from '../types'

export async function searchUsers(
  query: string,
  communityId: string,
): Promise<CommunityMember[]> {
  const params = new URLSearchParams({ q: query, communityId })
  return apiRequest<CommunityMember[]>(`/api/v1/search/users?${params.toString()}`)
}

export async function searchMessages(
  query: string,
  communityId: string,
): Promise<Message[]> {
  const params = new URLSearchParams({ q: query, communityId })
  return apiRequest<Message[]>(`/api/v1/search/messages?${params.toString()}`)
}

export async function searchPlaces(
  query: string,
  communityId: string,
): Promise<LocationData[]> {
  const params = new URLSearchParams({ q: query, communityId })
  return apiRequest<LocationData[]>(`/api/v1/search/places?${params.toString()}`)
}
