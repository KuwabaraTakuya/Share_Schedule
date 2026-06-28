import { create } from 'zustand'
import type { Community, CommunityMember } from '../types'

interface CommunityStore {
  communities: Community[]
  currentCommunityId: string | null
  members: Record<string, CommunityMember[]>
  setCommunities: (communities: Community[]) => void
  setCurrentCommunity: (id: string | null) => void
  addCommunity: (community: Community) => void
  updateCommunity: (id: string, data: Partial<Community>) => void
  removeCommunity: (id: string) => void
  setMembers: (communityId: string, members: CommunityMember[]) => void
}

export const useCommunityStore = create<CommunityStore>((set) => ({
  communities: [],
  currentCommunityId: null,
  members: {},
  setCommunities: (communities) => set({ communities }),
  setCurrentCommunity: (id) => set({ currentCommunityId: id }),
  addCommunity: (community) =>
    set((state) => ({ communities: [...state.communities, community] })),
  updateCommunity: (id, data) =>
    set((state) => ({
      communities: state.communities.map((c) =>
        c.id === id ? { ...c, ...data } : c,
      ),
    })),
  removeCommunity: (id) =>
    set((state) => ({
      communities: state.communities.filter((c) => c.id !== id),
    })),
  setMembers: (communityId, members) =>
    set((state) => ({
      members: { ...state.members, [communityId]: members },
    })),
}))
