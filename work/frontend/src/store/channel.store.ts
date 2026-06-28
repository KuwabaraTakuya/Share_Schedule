import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Channel, NotificationMode } from '../types'

interface ChannelStore {
  channels: Record<string, Channel[]>
  currentChannelId: string | null
  channelNotifications: Record<string, NotificationMode>
  unreadCounts: Record<string, number>
  setChannels: (communityId: string, channels: Channel[]) => void
  setCurrentChannel: (id: string | null) => void
  addChannel: (channel: Channel) => void
  removeChannel: (channelId: string, communityId: string) => void
  reorderChannels: (communityId: string, orderedChannels: Channel[]) => void
  setChannelNotification: (channelId: string, mode: NotificationMode) => void
  incrementUnread: (channelId: string) => void
  clearUnread: (channelId: string) => void
}

export const useChannelStore = create<ChannelStore>()(
  persist(
    (set) => ({
      channels: {},
      currentChannelId: null,
      channelNotifications: {},
      unreadCounts: {},
      setChannels: (communityId, channels) =>
        set((state) => ({
          channels: {
            ...state.channels,
            [communityId]: [...channels].sort((a, b) => a.position - b.position),
          },
        })),
      setCurrentChannel: (id) => set({ currentChannelId: id }),
      addChannel: (channel) =>
        set((state) => ({
          channels: {
            ...state.channels,
            [channel.communityId]: [
              ...(state.channels[channel.communityId] || []),
              channel,
            ],
          },
        })),
      removeChannel: (channelId, communityId) =>
        set((state) => ({
          channels: {
            ...state.channels,
            [communityId]: (state.channels[communityId] || []).filter(
              (c) => c.id !== channelId,
            ),
          },
        })),
      reorderChannels: (communityId, orderedChannels) =>
        set((state) => ({
          channels: { ...state.channels, [communityId]: orderedChannels },
        })),
      setChannelNotification: (channelId, mode) =>
        set((state) => ({
          channelNotifications: {
            ...state.channelNotifications,
            [channelId]: mode,
          },
        })),
      incrementUnread: (channelId) =>
        set((state) => ({
          unreadCounts: {
            ...state.unreadCounts,
            [channelId]: (state.unreadCounts[channelId] || 0) + 1,
          },
        })),
      clearUnread: (channelId) =>
        set((state) => ({
          unreadCounts: { ...state.unreadCounts, [channelId]: 0 },
        })),
    }),
    {
      name: 'channel-storage',
      partialize: (state) => ({ channelNotifications: state.channelNotifications }),
    },
  ),
)
