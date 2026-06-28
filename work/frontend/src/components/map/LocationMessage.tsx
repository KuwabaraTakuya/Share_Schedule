import { MapPinIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'
import type { LocationData } from '../../types'

interface LocationMessageProps {
  location: LocationData
}

export default function LocationMessage({ location }: LocationMessageProps) {
  const mapsUrl = `https://www.google.com/maps/place/?q=place_id:${location.placeId}`

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block max-w-sm rounded-lg border border-app-border overflow-hidden hover:border-app-accent transition-colors"
    >
      {location.mapThumbnailUrl && (
        <img
          src={location.mapThumbnailUrl}
          alt={location.name}
          className="w-full h-32 object-cover"
        />
      )}
      <div className="flex items-center gap-2 p-3">
        <MapPinIcon className="h-5 w-5 text-app-accent flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-app-text-primary truncate">
            {location.name}
          </p>
          <p className="text-xs text-app-text-muted truncate">
            {location.address}
          </p>
        </div>
        <ArrowTopRightOnSquareIcon className="h-4 w-4 text-app-text-muted flex-shrink-0" />
      </div>
    </a>
  )
}
