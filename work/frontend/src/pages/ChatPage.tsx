import { useParams } from 'react-router-dom'
import MessageList from '../components/chat/MessageList'
import MessageInput from '../components/chat/MessageInput'

export default function ChatPage() {
  const { channelId, communityId } = useParams<{
    channelId: string
    communityId: string
  }>()

  if (!channelId || !communityId) return null

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <MessageList channelId={channelId} communityId={communityId} />
      <MessageInput channelId={channelId} />
    </div>
  )
}
