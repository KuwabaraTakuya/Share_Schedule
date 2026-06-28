import { useState, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { DayCellContentArg } from '@fullcalendar/core'
import { useAvailability } from '../../hooks/useAvailability'
import { useChannelStore } from '../../store/channel.store'
import { useQuery } from '@tanstack/react-query'
import { getEvents } from '../../api/events'
import { getMonthRange, toISODateString } from '../../utils/date'
import AvailabilityBadge from './AvailabilityBadge'
import DayDetailPanel from './DayDetailPanel'
import type { CalendarEvent, Channel } from '../../types'

interface CommunityCalendarProps {
  communityId: string
}

export default function CommunityCalendar({ communityId }: CommunityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const calendarRef = useRef<FullCalendar>(null)

  const { availabilityMap } = useAvailability(communityId, currentDate)
  const { channels } = useChannelStore()

  const { start, end } = getMonthRange(currentDate)
  const { data: events = [] } = useQuery({
    queryKey: ['events', start.toISOString(), end.toISOString()],
    queryFn: () =>
      getEvents(start.toISOString(), end.toISOString()),
    staleTime: 5 * 60 * 1000,
  })

  const communityChannels = channels[communityId] || []

  const getDateChannels = (dateStr: string): Channel[] =>
    communityChannels.filter(
      (ch) => ch.type === 'date' && ch.date?.startsWith(dateStr),
    )

  const getDateEvents = (dateStr: string): CalendarEvent[] =>
    events.filter((event) => {
      const eventDate = event.startTime.split('T')[0]
      return eventDate === dateStr && event.visibility !== 'private'
    })

  const handleDateClick = (arg: { dateStr: string }) => {
    setSelectedDate(arg.dateStr)
  }

  const renderDayCell = (arg: DayCellContentArg) => {
    const dateStr = toISODateString(arg.date)
    const availability = availabilityMap[dateStr]

    return (
      <div className="flex flex-col items-start p-1 h-full">
        <span className="text-sm">{arg.dayNumberText.replace('日', '')}</span>
        {availability && (
          <div className="mt-0.5">
            <AvailabilityBadge availability={availability} compact />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* カレンダー本体 */}
      <div className={`flex-1 overflow-auto p-4 transition-all ${selectedDate ? 'lg:pr-0' : ''}`}>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="ja"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: '',
          }}
          buttonText={{
            today: '今月',
          }}
          dayCellContent={renderDayCell}
          dateClick={handleDateClick}
          datesSet={(info) => setCurrentDate(info.view.currentStart)}
          height="100%"
          dayMaxEventRows={2}
        />
      </div>

      {/* 日付詳細パネル */}
      {selectedDate && (
        <div className="w-80 border-l border-app-border bg-app-surface overflow-hidden flex-shrink-0">
          <DayDetailPanel
            date={selectedDate}
            communityId={communityId}
            availability={availabilityMap[selectedDate]}
            events={getDateEvents(selectedDate)}
            dateChannels={getDateChannels(selectedDate)}
            onClose={() => setSelectedDate(null)}
          />
        </div>
      )}
    </div>
  )
}
