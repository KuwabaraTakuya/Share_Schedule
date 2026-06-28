import { useState, useEffect, useRef, useCallback } from 'react'
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  startAfter,
  getDocs,
  type DocumentSnapshot,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { Message } from '../types'

export function useMessages(channelId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const firstDocRef = useRef<DocumentSnapshot | null>(null)

  useEffect(() => {
    if (!channelId) {
      setMessages([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setMessages([])
    setHasMore(true)
    firstDocRef.current = null

    const q = query(
      collection(db, 'channels', channelId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(50),
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs
      if (docs.length > 0) {
        firstDocRef.current = docs[docs.length - 1]
      }

      const messageList: Message[] = docs
        .map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Message, 'id'>),
        }))
        .filter((m) => !m.deletedAt)
        .reverse()

      setMessages(messageList)
      setHasMore(docs.length === 50)
      setIsLoading(false)
    })

    return unsubscribe
  }, [channelId])

  const loadMore = useCallback(async () => {
    if (!channelId || !firstDocRef.current || isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    try {
      const q = query(
        collection(db, 'channels', channelId, 'messages'),
        orderBy('createdAt', 'desc'),
        startAfter(firstDocRef.current),
        limit(50),
      )

      const snapshot = await getDocs(q)
      const docs = snapshot.docs

      if (docs.length > 0) {
        firstDocRef.current = docs[docs.length - 1]
      }

      const olderMessages: Message[] = docs
        .map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Message, 'id'>),
        }))
        .filter((m) => !m.deletedAt)
        .reverse()

      setMessages((prev) => [...olderMessages, ...prev])
      setHasMore(docs.length === 50)
    } finally {
      setIsLoadingMore(false)
    }
  }, [channelId, isLoadingMore, hasMore])

  return { messages, isLoading, isLoadingMore, hasMore, loadMore }
}
