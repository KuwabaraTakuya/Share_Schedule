import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PlusIcon } from '@heroicons/react/24/outline'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { useCommunityStore } from '../../store/community.store'
import { useChannelStore } from '../../store/channel.store'
import { useChannels } from '../../hooks/useChannels'
import { useUIStore } from '../../store/ui.store'
import { updateChannelPosition } from '../../api/channels'
import ChannelList from '../chat/ChannelList'
import Modal from './Modal'
import Button from './Button'
import { createCommunity } from '../../api/communities'
import toast from 'react-hot-toast'

function CommunityIcon({
  community,
  isActive,
  onClick,
}: {
  community: { id: string; name: string; iconUrl: string }
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={community.name}
      className={`group relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200 ${
        isActive
          ? 'rounded-xl bg-app-accent'
          : 'bg-app-surface hover:rounded-xl hover:bg-app-accent'
      }`}
    >
      {community.iconUrl ? (
        <img
          src={community.iconUrl}
          alt={community.name}
          className="h-full w-full rounded-[inherit] object-cover"
        />
      ) : (
        <span className="text-lg font-bold text-white">
          {community.name[0]}
        </span>
      )}
      {isActive && (
        <span className="absolute -left-2 h-8 w-1 rounded-r-full bg-white" />
      )}
    </button>
  )
}

export default function Sidebar() {
  const navigate = useNavigate()
  const { communityId } = useParams()
  const { communities } = useCommunityStore()
  const { channels, reorderChannels } = useChannelStore()
  const { setSidebarOpen } = useUIStore()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newCommunityName, setNewCommunityName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useChannels(communityId || null)

  const currentChannels = channels[communityId || ''] || []

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !communityId) return

    const oldIndex = currentChannels.findIndex((c) => c.id === active.id)
    const newIndex = currentChannels.findIndex((c) => c.id === over.id)
    const reordered = arrayMove(currentChannels, oldIndex, newIndex).map(
      (ch, i) => ({ ...ch, position: i }),
    )

    reorderChannels(communityId, reordered)

    try {
      await Promise.all(
        reordered.map((ch) => updateChannelPosition(ch.id, ch.position)),
      )
    } catch {
      toast.error('並び替えに失敗しました')
    }
  }

  const handleCreateCommunity = async () => {
    if (!newCommunityName.trim()) return
    setIsCreating(true)
    try {
      const community = await createCommunity({ name: newCommunityName.trim() })
      toast.success(`${community.name} を作成しました`)
      setIsCreateModalOpen(false)
      setNewCommunityName('')
      navigate(`/c/${community.id}`)
    } catch {
      toast.error('コミュニティの作成に失敗しました')
    } finally {
      setIsCreating(false)
    }
  }

  const handleSelectCommunity = (id: string) => {
    navigate(`/c/${id}`)
    setSidebarOpen(false)
  }

  return (
    <div className="flex h-full">
      {/* コミュニティアイコン列 */}
      <div className="flex w-[72px] flex-col items-center gap-2 overflow-y-auto bg-app-bg py-3">
        {communities.map((community) => (
          <CommunityIcon
            key={community.id}
            community={community}
            isActive={community.id === communityId}
            onClick={() => handleSelectCommunity(community.id)}
          />
        ))}
        <div className="my-1 h-px w-8 bg-app-border" />
        <button
          onClick={() => setIsCreateModalOpen(true)}
          title="コミュニティを作成"
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-app-surface text-app-success hover:rounded-xl hover:bg-app-success hover:text-white transition-all duration-200"
        >
          <PlusIcon className="h-6 w-6" />
        </button>
      </div>

      {/* チャンネルリスト */}
      {communityId && (
        <div className="flex flex-1 flex-col bg-app-surface overflow-hidden">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={currentChannels.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <ChannelList
                communityId={communityId}
                channels={currentChannels}
              />
            </SortableContext>
          </DndContext>
        </div>
      )}

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="コミュニティを作成"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-app-text-muted">
              コミュニティ名
            </label>
            <input
              type="text"
              value={newCommunityName}
              onChange={(e) => setNewCommunityName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateCommunity()}
              placeholder="例: 友達グループ"
              className="w-full rounded bg-app-bg px-3 py-2 text-app-text-primary placeholder-app-text-muted border border-app-border focus:border-app-accent focus:outline-none"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleCreateCommunity}
              isLoading={isCreating}
              disabled={!newCommunityName.trim()}
            >
              作成
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
