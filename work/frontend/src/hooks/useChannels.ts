import { useEffect } from 'react'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useChannelStore } from '../store/channel.store'
import type { Channel } from '../types'

export function useChannels(communityId: string | null) {
  const { channels, setChannels } = useChannelStore()

  useEffect(() => {
    if (!communityId) return

    const q = query(
      collection(db, 'channels'),
      where('communityId', '==', communityId),
      orderBy('position', 'asc'),
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const channelList: Channel[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Channel, 'id'>),
      }))
      setChannels(communityId, channelList)
    })

    return unsubscribe
  }, [communityId, setChannels])

  return channels[communityId || ''] || []
}
