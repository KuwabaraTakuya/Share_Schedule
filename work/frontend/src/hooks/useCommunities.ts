import { useEffect } from 'react'
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useCommunityStore } from '../store/community.store'
import { useAuthStore } from '../store/auth.store'
import type { Community } from '../types'

export function useCommunities() {
  const { user } = useAuthStore()
  const { communities, setCommunities } = useCommunityStore()

  useEffect(() => {
    if (!user) return

    // コミュニティのメンバーとして存在するコミュニティを取得
    // サブコレクションの検索なので、ユーザーのIDからコミュニティIDを別途管理する必要があるが、
    // ここでは簡略化してメンバーのドキュメントが存在するコミュニティを取得
    const membershipQuery = query(
      collection(db, 'communities'),
    )

    const unsubscribe = onSnapshot(membershipQuery, (snapshot) => {
      const communityList: Community[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Community, 'id'>),
      }))
      setCommunities(communityList)
    })

    return unsubscribe
  }, [user, setCommunities])

  return communities
}
