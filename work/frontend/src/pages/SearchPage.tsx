import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { searchUsers, searchMessages, searchPlaces } from '../api/search'
import Avatar from '../components/common/Avatar'
import LoadingSpinner from '../components/common/LoadingSpinner'
import type { CommunityMember, Message, LocationData } from '../types'
import { formatMessageTime } from '../utils/date'
import toast from 'react-hot-toast'

type SearchType = 'users' | 'messages' | 'places'

export default function SearchPage() {
  const navigate = useNavigate()
  const { communityId } = useParams<{ communityId: string }>()
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState<SearchType>('messages')
  const [isSearching, setIsSearching] = useState(false)
  const [userResults, setUserResults] = useState<CommunityMember[]>([])
  const [messageResults, setMessageResults] = useState<Message[]>([])
  const [placeResults, setPlaceResults] = useState<LocationData[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async () => {
    if (!query.trim() || !communityId) return

    setIsSearching(true)
    setHasSearched(true)

    try {
      if (searchType === 'users') {
        const results = await searchUsers(query, communityId)
        setUserResults(results)
      } else if (searchType === 'messages') {
        const results = await searchMessages(query, communityId)
        setMessageResults(results)
      } else {
        const results = await searchPlaces(query, communityId)
        setPlaceResults(results)
      }
    } catch {
      toast.error('検索に失敗しました')
    } finally {
      setIsSearching(false)
    }
  }

  const tabs: { key: SearchType; label: string }[] = [
    { key: 'messages', label: 'メッセージ' },
    { key: 'users', label: 'メンバー' },
    { key: 'places', label: '場所' },
  ]

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* 検索バー */}
      <div className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-app-text-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="検索..."
              className="w-full rounded-lg border border-app-border bg-app-surface py-3 pl-10 pr-4 text-app-text-primary placeholder-app-text-muted focus:border-app-accent focus:outline-none"
              autoFocus
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching || !query.trim()}
            className="rounded-lg bg-app-accent px-4 py-3 font-medium text-white hover:bg-app-accent-hover disabled:opacity-50 transition-colors"
          >
            検索
          </button>
        </div>

        {/* タブ */}
        <div className="mt-3 flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSearchType(tab.key)}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                searchType === tab.key
                  ? 'bg-app-accent text-white'
                  : 'text-app-text-muted hover:bg-app-surface-hover hover:text-app-text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 検索結果 */}
      {isSearching ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-2">
          {/* メンバー検索結果 */}
          {searchType === 'users' &&
            userResults.map((member) => (
              <div
                key={member.userId}
                className="flex items-center gap-3 rounded-lg border border-app-border p-3"
              >
                <Avatar
                  userId={member.userId}
                  displayName={member.displayName}
                  size="md"
                />
                <div>
                  <p className="font-medium text-app-text-primary">
                    {member.displayName}
                  </p>
                  <p className="text-sm text-app-text-muted capitalize">
                    {member.role === 'owner' ? 'オーナー' : member.role === 'admin' ? '管理者' : 'メンバー'}
                  </p>
                </div>
              </div>
            ))}

          {/* メッセージ検索結果 */}
          {searchType === 'messages' &&
            messageResults.map((message) => (
              <button
                key={message.id}
                onClick={() =>
                  navigate(`/c/${communityId}/ch/${message.channelId}`)
                }
                className="block w-full rounded-lg border border-app-border p-3 text-left hover:bg-app-surface-hover transition-colors"
              >
                <p className="text-xs text-app-text-muted mb-1">
                  {formatMessageTime(message.createdAt)}
                </p>
                <p className="text-sm text-app-text-primary line-clamp-2">
                  {message.content}
                </p>
              </button>
            ))}

          {/* 場所検索結果 */}
          {searchType === 'places' &&
            placeResults.map((place) => (
              <div
                key={place.placeId}
                className="flex items-center gap-3 rounded-lg border border-app-border p-3"
              >
                <span className="text-2xl">📍</span>
                <div>
                  <p className="font-medium text-app-text-primary">
                    {place.name}
                  </p>
                  <p className="text-sm text-app-text-muted">{place.address}</p>
                </div>
              </div>
            ))}

          {/* 結果なし */}
          {hasSearched && !isSearching && (
            <>
              {searchType === 'users' && userResults.length === 0 && (
                <p className="text-center text-app-text-muted py-8">
                  「{query}」に一致するメンバーが見つかりませんでした
                </p>
              )}
              {searchType === 'messages' && messageResults.length === 0 && (
                <p className="text-center text-app-text-muted py-8">
                  「{query}」に一致するメッセージが見つかりませんでした
                </p>
              )}
              {searchType === 'places' && placeResults.length === 0 && (
                <p className="text-center text-app-text-muted py-8">
                  「{query}」に一致する場所が見つかりませんでした
                </p>
              )}
            </>
          )}

          {!hasSearched && (
            <div className="text-center py-12 text-app-text-muted">
              <p className="text-4xl mb-3">🔍</p>
              <p>キーワードを入力して検索</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
