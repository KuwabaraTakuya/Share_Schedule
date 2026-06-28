import { useQuery } from '@tanstack/react-query'
import { getAvailability } from '../api/events'
import type { DayAvailability } from '../types'
import { format } from 'date-fns'

export function useAvailability(communityId: string | null, date: Date) {
  const month = format(date, 'yyyy-MM')

  const { data, isLoading, error } = useQuery({
    queryKey: ['availability', communityId, month],
    queryFn: () => getAvailability(communityId!, month),
    enabled: !!communityId,
    staleTime: 5 * 60 * 1000,
  })

  const availabilityMap = (data || []).reduce<Record<string, DayAvailability>>(
    (acc, item) => {
      acc[item.date] = item
      return acc
    },
    {},
  )

  return { availabilityMap, isLoading, error }
}
