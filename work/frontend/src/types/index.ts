export interface User {
  id: string
  displayName: string
  email: string
  avatarUrl: string
  timezone: string
  createdAt?: string
  updatedAt?: string
}

export interface CommunitySettings {
  availabilityThreshold: number
  allowAnonymousAvailability: boolean
}

export interface Community {
  id: string
  name: string
  iconUrl: string
  ownerId: string
  inviteCode: string
  settings: CommunitySettings
  createdAt?: string
}

export type PrivacyShareValue = 'all' | 'none' | string[]

export interface PrivacySettings {
  shareCalendarWith: PrivacyShareValue
  shareDetailWith: PrivacyShareValue
}

export type MemberRole = 'owner' | 'admin' | 'member'
export type NotificationMode = 'all' | 'mentions' | 'muted'

export interface MemberNotificationSettings {
  default: NotificationMode
}

export interface CommunityMember {
  userId: string
  role: MemberRole
  displayName: string
  joinedAt: string
  privacySettings: PrivacySettings
  notificationSettings: MemberNotificationSettings
  sharedCalendarIds?: string[]
}

export type ChannelType = 'text' | 'date'

export interface Channel {
  id: string
  communityId: string
  name: string
  type: ChannelType
  date?: string
  position: number
  topic?: string
  createdAt: string
  createdBy: string
}

export interface Attachment {
  name: string
  url: string
  size: number
  mimeType: string
  isSafe: boolean
}

export interface LocationData {
  placeId: string
  name: string
  address: string
  lat: number
  lng: number
  mapThumbnailUrl: string
}

export type MessageType = 'text' | 'image' | 'file' | 'location' | 'system'

export interface Message {
  id: string
  channelId: string
  userId: string
  content: string
  type: MessageType
  attachments: Attachment[]
  location?: LocationData
  reactions: Record<string, string[]>
  threadCount: number
  editedAt?: string
  deletedAt?: string
  createdAt: string
  readBy: string[]
}

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom'

export interface Recurrence {
  type: RecurrenceType
  until?: string
  interval?: number
}

export type EventVisibility = 'private' | 'community' | string[]
export type EventSource = 'manual' | 'google' | 'ics'

export interface CalendarEvent {
  id: string
  userId: string
  communityId?: string
  title: string
  description: string
  startTime: string
  endTime: string
  isAllDay: boolean
  location?: string
  color?: string
  recurrence: Recurrence
  visibility: EventVisibility
  source: EventSource
  sourceEventId?: string
  createdAt: string
  updatedAt: string
}

export interface DayAvailability {
  date: string
  status: '○' | '△' | '×'
  availableCount: number
  totalCount: number
  bestTimeRanges?: string[]
}

export interface ParsedEvent {
  title: string
  startTime: string
  endTime: string
  isAllDay: boolean
  location?: string
  description?: string
  confidence: number
}

export interface ApiResponse<T> {
  data?: T
  error?: string
}

export interface PaginatedMessages {
  messages: Message[]
  nextCursor?: string
}

export interface ChannelNotificationSetting {
  channelId: string
  mode: NotificationMode
}

export interface SearchResult {
  messages: Message[]
  events: CalendarEvent[]
  places: LocationData[]
}

export interface SafetyResult {
  isSafe: boolean
  threatType?: string
}

export interface InviteResult {
  inviteCode: string
  inviteUrl: string
}
