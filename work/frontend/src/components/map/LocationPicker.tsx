import { useEffect, useRef, useState } from 'react'
import { MagnifyingGlassIcon, MapPinIcon, CursorArrowRaysIcon } from '@heroicons/react/24/outline'
import Modal from '../common/Modal'
import Button from '../common/Button'
import type { LocationData } from '../../types'

interface LocationPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (location: LocationData) => void
}

interface SelectedPlace {
  placeId?: string
  name: string
  address: string
  lat: number
  lng: number
}

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

declare global {
  interface Window {
    google: typeof google
    initMap: () => void
  }
}

function loadGoogleMaps(): Promise<void> {
  if (window.google?.maps) return Promise.resolve()
  return new Promise((resolve, reject) => {
    if (!MAPS_KEY) { reject(new Error('No Maps API key')); return }
    window.initMap = resolve
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places&callback=initMap&language=ja`
    script.async = true
    script.onerror = reject
    document.head.appendChild(script)
  })
}

export default function LocationPicker({ isOpen, onClose, onSelect }: LocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  const [selected, setSelected] = useState<SelectedPlace | null>(null)
  const [mapsLoaded, setMapsLoaded] = useState(false)
  const [mapsError, setMapsError] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [fallbackResults, setFallbackResults] = useState<SelectedPlace[]>([])

  // Google Maps 読み込み
  useEffect(() => {
    if (!isOpen) return
    loadGoogleMaps()
      .then(() => setMapsLoaded(true))
      .catch(() => setMapsError(true))
  }, [isOpen])

  // マップ初期化
  useEffect(() => {
    if (!mapsLoaded || !mapContainerRef.current || mapRef.current) return

    const map = new window.google.maps.Map(mapContainerRef.current, {
      center: { lat: 35.6812, lng: 139.7671 }, // 東京
      zoom: 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    })
    mapRef.current = map

    // クリックでピンを立てる
    map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return
      const lat = e.latLng.lat()
      const lng = e.latLng.lng()
      placeMarker(map, lat, lng)

      // 逆ジオコーディング
      const geocoder = new window.google.maps.Geocoder()
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          const r = results[0]
          setSelected({
            name: r.address_components?.[0]?.long_name || '選択した場所',
            address: r.formatted_address,
            lat,
            lng,
          })
        } else {
          setSelected({ name: '選択した場所', address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng })
        }
      })
    })

    // Autocomplete
    if (searchInputRef.current) {
      const ac = new window.google.maps.places.Autocomplete(searchInputRef.current, {
        language: 'ja',
      })
      ac.bindTo('bounds', map)
      ac.addListener('place_changed', () => {
        const place = ac.getPlace()
        if (!place.geometry?.location) return
        const lat = place.geometry.location.lat()
        const lng = place.geometry.location.lng()
        map.setCenter({ lat, lng })
        map.setZoom(16)
        placeMarker(map, lat, lng)
        setSelected({
          placeId: place.place_id,
          name: place.name || '',
          address: place.formatted_address || '',
          lat,
          lng,
        })
      })
      autocompleteRef.current = ac
    }
  }, [mapsLoaded])

  function placeMarker(map: google.maps.Map, lat: number, lng: number) {
    markerRef.current?.setMap(null)
    const marker = new window.google.maps.Marker({
      position: { lat, lng },
      map,
      animation: window.google.maps.Animation.DROP,
    })
    markerRef.current = marker
  }

  const handleCurrentLocation = () => {
    if (!navigator.geolocation || !mapRef.current) return
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      mapRef.current!.setCenter({ lat, lng })
      mapRef.current!.setZoom(16)
      placeMarker(mapRef.current!, lat, lng)
      const geocoder = new window.google.maps.Geocoder()
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          setSelected({ name: '現在地', address: results[0].formatted_address, lat, lng })
        } else {
          setSelected({ name: '現在地', address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng })
        }
      })
    })
  }

  // Maps API キーなし時のフォールバック検索
  const handleFallbackSearch = async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5&accept-language=ja`
      )
      const data = await res.json()
      setFallbackResults(
        data.map((r: { place_id: string; display_name: string; lat: string; lon: string }) => ({
          placeId: String(r.place_id),
          name: r.display_name.split(',')[0],
          address: r.display_name,
          lat: parseFloat(r.lat),
          lng: parseFloat(r.lon),
        }))
      )
    } catch {
      setFallbackResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleConfirm = () => {
    if (!selected) return
    const mapThumbnailUrl = MAPS_KEY
      ? `https://maps.googleapis.com/maps/api/staticmap?center=${selected.lat},${selected.lng}&zoom=15&size=400x200&markers=${selected.lat},${selected.lng}&key=${MAPS_KEY}`
      : `https://static-maps.yandex.ru/1.x/?ll=${selected.lng},${selected.lat}&z=15&l=map&size=400,200&pt=${selected.lng},${selected.lat},pm2rdm`
    onSelect({
      placeId: selected.placeId || '',
      name: selected.name,
      address: selected.address,
      lat: selected.lat,
      lng: selected.lng,
      mapThumbnailUrl,
    })
    handleClose()
  }

  const handleClose = () => {
    setSelected(null)
    setSearchQuery('')
    setFallbackResults([])
    markerRef.current?.setMap(null)
    markerRef.current = null
    mapRef.current = null
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="場所を共有" size="lg">
      <div className="space-y-3">
        {/* 検索バー */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-text-muted pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && mapsError) handleFallbackSearch() }}
              placeholder="場所を検索..."
              className="w-full rounded border border-app-border bg-app-bg py-2 pl-9 pr-3 text-sm text-app-text-primary placeholder-app-text-muted focus:border-app-accent focus:outline-none"
              autoFocus
            />
          </div>
          {mapsError && (
            <Button size="sm" variant="secondary" onClick={handleFallbackSearch} isLoading={isSearching}>
              検索
            </Button>
          )}
          {mapsLoaded && (
            <button
              onClick={handleCurrentLocation}
              title="現在地"
              className="flex items-center justify-center rounded border border-app-border bg-app-bg px-3 hover:bg-app-surface-hover transition-colors"
            >
              <CursorArrowRaysIcon className="h-4 w-4 text-app-accent" />
            </button>
          )}
        </div>

        {/* Google Maps インタラクティブマップ */}
        {!mapsError && (
          <div
            ref={mapContainerRef}
            className="w-full rounded-lg overflow-hidden border border-app-border bg-app-surface-hover"
            style={{ height: 280 }}
          >
            {!mapsLoaded && (
              <div className="flex h-full items-center justify-center text-app-text-muted text-sm">
                {MAPS_KEY ? '地図を読み込み中...' : 'Google Maps API キーが設定されていません'}
              </div>
            )}
          </div>
        )}

        {/* Maps APIなし時のフォールバック検索結果 */}
        {mapsError && fallbackResults.length > 0 && (
          <div className="max-h-48 overflow-y-auto space-y-1">
            {fallbackResults.map((place) => (
              <button
                key={place.placeId}
                onClick={() => setSelected(place)}
                className={`flex w-full items-start gap-3 rounded border px-3 py-2 text-left transition-colors ${
                  selected?.placeId === place.placeId
                    ? 'border-app-accent bg-app-accent/10'
                    : 'border-transparent hover:bg-app-surface-hover'
                }`}
              >
                <MapPinIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-app-accent" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-app-text-primary">{place.name}</p>
                  <p className="text-xs text-app-text-muted truncate">{place.address}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* 選択中の場所 */}
        {selected && (
          <div className="flex items-center gap-2 rounded-lg border border-app-accent/50 bg-app-accent/10 px-3 py-2">
            <MapPinIcon className="h-4 w-4 flex-shrink-0 text-app-accent" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-app-text-primary">{selected.name}</p>
              <p className="text-xs text-app-text-muted truncate">{selected.address}</p>
            </div>
          </div>
        )}

        {mapsLoaded && (
          <p className="text-xs text-center text-app-text-muted">
            地図をクリックしてピンを立てるか、場所名で検索してください
          </p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="ghost" onClick={handleClose}>キャンセル</Button>
          <Button onClick={handleConfirm} disabled={!selected}>この場所を共有</Button>
        </div>
      </div>
    </Modal>
  )
}
