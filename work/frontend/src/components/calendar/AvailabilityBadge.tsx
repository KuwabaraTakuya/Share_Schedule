import { cn } from '../../utils/format'
import type { DayAvailability } from '../../types'

interface AvailabilityBadgeProps {
  availability: DayAvailability
  compact?: boolean
}

const statusConfig = {
  '○': {
    bg: 'bg-green-600/20',
    text: 'text-green-400',
    border: 'border-green-600/30',
    label: '○',
  },
  '△': {
    bg: 'bg-yellow-600/20',
    text: 'text-yellow-400',
    border: 'border-yellow-600/30',
    label: '△',
  },
  '×': {
    bg: 'bg-red-600/20',
    text: 'text-red-400',
    border: 'border-red-600/30',
    label: '×',
  },
}

export default function AvailabilityBadge({
  availability,
  compact = false,
}: AvailabilityBadgeProps) {
  const config = statusConfig[availability.status]

  if (compact) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded px-1 text-xs font-bold',
          config.bg,
          config.text,
        )}
      >
        {config.label}
      </span>
    )
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center rounded border px-1 py-0.5',
        config.bg,
        config.border,
      )}
    >
      <span className={cn('text-sm font-bold leading-none', config.text)}>
        {config.label}
      </span>
      <span className={cn('text-xs', config.text)}>
        {availability.availableCount}/{availability.totalCount}
      </span>
    </div>
  )
}
