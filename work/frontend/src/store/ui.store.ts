import { create } from 'zustand'

type RightPanelContent = 'members' | 'thread' | null

interface UIStore {
  isSidebarOpen: boolean
  isRightPanelOpen: boolean
  rightPanelContent: RightPanelContent
  selectedThreadMessageId: string | null
  isEventFormOpen: boolean
  eventFormDate: string | null
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  openRightPanel: (content: 'members' | 'thread', messageId?: string) => void
  closeRightPanel: () => void
  openEventForm: (date?: string) => void
  closeEventForm: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  isSidebarOpen: false,
  isRightPanelOpen: false,
  rightPanelContent: null,
  selectedThreadMessageId: null,
  isEventFormOpen: false,
  eventFormDate: null,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  openRightPanel: (content, messageId) =>
    set({
      isRightPanelOpen: true,
      rightPanelContent: content,
      selectedThreadMessageId: messageId || null,
    }),
  closeRightPanel: () =>
    set({ isRightPanelOpen: false, rightPanelContent: null }),
  openEventForm: (date) =>
    set({ isEventFormOpen: true, eventFormDate: date || null }),
  closeEventForm: () => set({ isEventFormOpen: false, eventFormDate: null }),
}))
