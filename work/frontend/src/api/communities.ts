import { apiRequest } from './client'
import type { Community, CommunityMember, InviteResult } from '../types'

export async function getCommunities(): Promise<Community[]> {
  return apiRequest<Community[]>('/api/v1/communities')
}

export async function getCommunity(id: string): Promise<Community> {
  return apiRequest<Community>(`/api/v1/communities/${id}`)
}

export async function createCommunity(data: {
  name: string
  iconUrl?: string
}): Promise<Community> {
  return apiRequest<Community>('/api/v1/communities', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateCommunity(
  id: string,
  data: Partial<Community>,
): Promise<Community> {
  return apiRequest<Community>(`/api/v1/communities/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteCommunity(id: string): Promise<void> {
  return apiRequest<void>(`/api/v1/communities/${id}`, { method: 'DELETE' })
}

export async function getCommunityMembers(
  communityId: string,
): Promise<CommunityMember[]> {
  return apiRequest<CommunityMember[]>(
    `/api/v1/communities/${communityId}/members`,
  )
}

export async function generateInviteLink(
  communityId: string,
): Promise<InviteResult> {
  return apiRequest<InviteResult>(
    `/api/v1/communities/${communityId}/invite`,
    { method: 'POST' },
  )
}

export async function joinCommunity(inviteCode: string): Promise<Community> {
  return apiRequest<Community>('/api/v1/communities/join', {
    method: 'POST',
    body: JSON.stringify({ inviteCode }),
  })
}

export async function kickMember(
  communityId: string,
  userId: string,
): Promise<void> {
  return apiRequest<void>(
    `/api/v1/communities/${communityId}/members/${userId}`,
    { method: 'DELETE' },
  )
}

export async function updateMemberRole(
  communityId: string,
  userId: string,
  role: 'admin' | 'member',
): Promise<void> {
  return apiRequest<void>(
    `/api/v1/communities/${communityId}/members/${userId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    },
  )
}
