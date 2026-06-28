import { useState, useRef } from 'react'
import { MagnifyingGlassIcon, MapPinIcon } from '@heroicons/react/24/outline'
import Modal from '../common/Modal'
import Button from '../common/Button'
import type { LocationData } from '../../types'

interface LocationPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (location: LocationData) => void
}

interface PlaceCandidate {
  placeId: string
  name: string
  address: string
  lat: number
  lng: number
}

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

export default function LocationPicker({
  isOpen,
  onClose,
  onSelect,
}: LocationPickerProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceCandidate[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selected, setSelected] = useState<PlaceCandidate | null>(null)

  const handleSearch = async () => {
    if (!query.trim()) return
    setIsSearching(true)
    try {
      // Google Places Text Search API
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${MAPS_API_KEY}&language=ja`,
      )
      const data = await response.json()

      if (data.results) {
        setResults(
          data.results.slice(0, 5).map((r: {
            place_id: string
            name: string
            formatted_address: string
            geometry: { location: { lat: number; lng: number } }
          }) => ({
            placeId: r.place_id,
            name: r.name,
            address: r.formatted_address,
            lat: r.geometry.location.lat,
            lng: r.geometry.location.lng,
          })),
        )
      }
    } catch (err) {
      console.error('Places search failed:', err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelect = (place: PlaceCandidate) => {
    setSelected(place)
  }

  const handleConfirm = () => {
    if (!selected) return

    const mapThumbnailUrl = MAPS_API_KEY
      ? `https://maps.googleapis.com/maps/api/staticmap?center=${selected.lat},${selected.lng}&zoom=15&size=400x200&markers=${selected.lat},${selected.lng}&key=${MAPS_API_KEY}`
      : ''

    onSelect({
      placeId: selected.placeId,
      name: selected.name,
      address: selected.address,
      lat: selected.lat,
      lng: selected.lng,
      mapThumbnailUrl,
    })
    setQuery('')
    setResults([])
    setSelected(null)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose()
        setQuery('')
        setResults([])
        setSelected(null)
      }}
      title="場所を共有"
      size="md"
    >
      <div className="space-y-4">
        {/* 検索入力 */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-text-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="場所を検索..."
              className="w-full rounded border border-app-border bg-app-bg py-2 pl-9 pr-3 text-sm text-app-text-primary placeholder-app-text-muted focus:border-app-accent focus:outline-none"
              autoFocus
            />
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleSearch}
            isLoading={isSearching}
          >
            検索
          </Button>
        </div>

        {/* 検索結果 */}
        {results.length > 0 && (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {results.map((place) => (
              <button
                key={place.placeId}
                onClick={() => handleSelect(place)}
                className={`flex w-full items-start gap-3 rounded border px-3 py-2 text-left transition-colors ${
                  selected?.placeId === place.placeId
                    ? 'border-app-accent bg-app-accent/10'
                    : 'border-transparent hover:bg-app-surface-hover'
                }`}
              >
                <MapPinIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-app-accent" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-app-text-primary">
                    {place.name}
                  </p>
                  <p className="text-xs text-app-text-muted truncate">
                    {place.address}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {results.length === 0 && query && !isSearching && (
          <p className="text-center text-sm text-app-text-muted py-4">
            検索結果がありません
          </p>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={handleConfirm} disabled={!selected}>
            この場所を共有
          </Button>
        </div>
      </div>
    </Modal>
  )
}
