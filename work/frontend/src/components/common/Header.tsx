import { useParams } from 'react-router-dom'
import {
  HashtagIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  UsersIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline'
import { useChannelStore } from '../../store/channel.store'
import { useCommunityStore } from '../../store/community.store'
import { useUIStore } from '../../store/ui.store'

export default function Header() {
  const { communityId, channelId } = useParams()
  const { channels } = useChannelStore()
  const { members } = useCommunityStore()
  const { toggleSidebar, openRightPanel, isRightPanelOpen } = useUIStore()

  const communityChannels = channels[communityId || ''] || []
  const currentChannel = communityChannels.find((c) => c.id === channelId)
  const memberCount = (members[communityId || ''] || []).length

  return (
    <header className="flex h-12 flex-shrink-0 items-center justify-between border-b border-app-border bg-app-surface px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="rounded p-1 text-app-text-muted hover:text-app-text-primary lg:hidden"
        >
          <Bars3Icon className="h-5 w-5" />
        </button>

        {currentChannel ? (
          <div className="flex items-center gap-2">
            {currentChannel.type === 'date' ? (
              <CalendarIcon className="h-5 w-5 text-app-text-muted" />
            ) : (
              <HashtagIcon className="h-5 w-5 text-app-text-muted" />
            )}
            <span className="font-semibold text-app-text-primary">
              {currentChannel.name}
            </span>
            {currentChannel.topic && (
              <>
                <span className="text-app-border">|</span>
                <span className="text-sm text-app-text-muted truncate max-w-xs">
                  {currentChannel.topic}
                </span>
              </>
            )}
          </div>
        ) : communityId ? (
          <span className="font-semibold text-app-text-primary">カレンダー</span>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <button className="rounded p-1 text-app-text-muted hover:text-app-text-primary">
          <MagnifyingGlassIcon className="h-5 w-5" />
        </button>
        <button
          onClick={() => openRightPanel('members')}
          className={`flex items-center gap-1 rounded px-2 py-1 text-sm transition-colors ${
            isRightPanelOpen
              ? 'bg-app-surface-hover text-app-text-primary'
              : 'text-app-text-muted hover:text-app-text-primary'
          }`}
        >
          <UsersIcon className="h-4 w-4" />
          <span>{memberCount}</span>
        </button>
      </div>
    </header>
  )
}
