import { useEffect } from 'react'
import { useCommunityStore } from '../store/community.store'
import { useAuthStore } from '../store/auth.store'
import { getCommunities, getCommunityMembers } from '../api/communities'

export function useCommunities() {
  const { user } = useAuthStore()
  const { communities, setCommunities, setMembers } = useCommunityStore()

  useEffect(() => {
    if (!user) return

    getCommunities().then((list) => {
      setCommunities(list)
      // 各コミュニティのメンバーを取得
      list.forEach((community) => {
        getCommunityMembers(community.id)
          .then((members) => setMembers(community.id, members))
          .catch(() => {})
      })
    }).catch(() => {})
  }, [user, setCommunities, setMembers])

  return communities
}
