import { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventClickArg, DateSelectArg, EventDropArg } from '@fullcalendar/core'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowPathIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import { getEvents, updateEvent, deleteEvent, importICS } from '../api/events'
import { getMonthRange, toISODateString } from '../utils/date'
import EventForm from '../components/calendar/EventForm'
import { useUIStore } from '../store/ui.store'
import type { CalendarEvent } from '../types'
import toast from 'react-hot-toast'
import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'

export default function PersonalCalendarPage() {
  const { communityId } = useParams<{ communityId: string }>()
  const queryClient = useQueryClient()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const icsInputRef = useRef<HTMLInputElement>(null)
  const { isEventFormOpen, eventFormDate, openEventForm, closeEventForm } =
    useUIStore()

  const { start, end } = getMonthRange(currentDate)
  const { data: events = [] } = useQuery({
    queryKey: ['personal-events', start.toISOString()],
    queryFn: () => getEvents(start.toISOString(), end.toISOString()),
  })

  const fcEvents = events.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.startTime,
    end: event.endTime,
    allDay: event.isAllDay,
    backgroundColor: event.color || '#5865f2',
    borderColor: event.color || '#5865f2',
    extendedProps: { event },
  }))

  const handleEventClick = (arg: EventClickArg) => {
    const event = arg.event.extendedProps.event as CalendarEvent
    setSelectedEvent(event)
  }

  const handleDateSelect = (arg: DateSelectArg) => {
    openEventForm(toISODateString(arg.start))
  }

  const handleEventDrop = async (arg: EventDropArg) => {
    const event = arg.event.extendedProps.event as CalendarEvent
    try {
      await updateEvent(event.id, {
        startTime: arg.event.start?.toISOString(),
        endTime: arg.event.end?.toISOString(),
      })
      queryClient.invalidateQueries({ queryKey: ['personal-events'] })
    } catch {
      arg.revert()
      toast.error('予定の移動に失敗しました')
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId)
      setSelectedEvent(null)
      queryClient.invalidateQueries({ queryKey: ['personal-events'] })
      toast.success('予定を削除しました')
    } catch {
      toast.error('予定の削除に失敗しました')
    }
  }

  const handleGoogleSync = async () => {
    // Google OAuth は Firebase Auth の getIdToken では Calendar scope を取れないため、
    // ユーザーに再認証を促すか、別途 OAuth フローを実装する必要がある。
    // ここでは Google 認証のアクセストークンがある場合に同期する。
    const googleUser = (window as any).gapi?.auth2?.getAuthInstance?.()?.currentUser?.get()
    const accessToken = googleUser?.getAuthResponse?.()?.access_token

    if (!accessToken) {
      toast.error('Googleカレンダーとの連携にはGoogle認証が必要です')
      return
    }

    setIsSyncing(true)
    try {
      const result = await fetch('/api/v1/events/sync/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ accessToken }),
      }).then((r) => r.json())

      queryClient.invalidateQueries({ queryKey: ['personal-events'] })
      toast.success(`${result.synced}件のイベントを同期しました`)
    } catch {
      toast.error('Googleカレンダーの同期に失敗しました')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleICSImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.ics')) {
      toast.error('.icsファイルを選択してください')
      return
    }

    try {
      const result = await importICS(file)
      queryClient.invalidateQueries({ queryKey: ['personal-events'] })
      toast.success(`${result.imported}件のイベントをインポートしました`)
    } catch {
      toast.error('iCalファイルのインポートに失敗しました')
    } finally {
      if (icsInputRef.current) icsInputRef.current.value = ''
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-app-border px-4 py-2">
        <span className="text-sm font-semibold text-app-text-primary">マイカレンダー</span>
        <div className="flex gap-2">
          <button
            onClick={handleGoogleSync}
            disabled={isSyncing}
            title="Googleカレンダーを同期"
            className="flex items-center gap-1 rounded px-3 py-1.5 text-xs text-app-text-muted hover:bg-app-surface-hover disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Google同期
          </button>
          <label
            title=".icsファイルをインポート"
            className="flex cursor-pointer items-center gap-1 rounded px-3 py-1.5 text-xs text-app-text-muted hover:bg-app-surface-hover"
          >
            <ArrowUpTrayIcon className="h-4 w-4" />
            iCal読み込み
            <input
              ref={icsInputRef}
              type="file"
              accept=".ics,text/calendar"
              className="hidden"
              onChange={handleICSImport}
            />
          </label>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="ja"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          buttonText={{
            today: '今日',
            month: '月',
            week: '週',
            day: '日',
          }}
          events={fcEvents}
          eventClick={handleEventClick}
          select={handleDateSelect}
          eventDrop={handleEventDrop}
          selectable
          editable
          datesSet={(info) => setCurrentDate(info.view.currentStart)}
          height="100%"
        />
      </div>

      {/* 予定詳細パネル */}
      {selectedEvent && (
        <div className="absolute right-4 top-16 z-10 w-72 rounded-lg border border-app-border bg-app-surface p-4 shadow-xl">
          <div className="mb-3 flex items-start justify-between">
            <div
              className="h-3 w-3 rounded-full mt-1 mr-2 flex-shrink-0"
              style={{ backgroundColor: selectedEvent.color || '#5865f2' }}
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-app-text-primary">
                {selectedEvent.title}
              </h3>
              <p className="text-sm text-app-text-muted">
                {selectedEvent.isAllDay
                  ? format(parseISO(selectedEvent.startTime), 'M月d日（eee）終日', { locale: ja })
                  : `${format(parseISO(selectedEvent.startTime), 'M月d日 HH:mm', { locale: ja })} - ${format(parseISO(selectedEvent.endTime), 'HH:mm')}`}
              </p>
            </div>
            <button
              onClick={() => setSelectedEvent(null)}
              className="text-app-text-muted hover:text-app-text-primary text-lg leading-none"
            >
              ×
            </button>
          </div>
          {selectedEvent.location && (
            <p className="mb-2 text-sm text-app-text-muted">
              📍 {selectedEvent.location}
            </p>
          )}
          {selectedEvent.description && (
            <p className="mb-3 text-sm text-app-text-primary">
              {selectedEvent.description}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => handleDeleteEvent(selectedEvent.id)}
              className="rounded px-3 py-1 text-sm text-app-danger hover:bg-app-danger/10"
            >
              削除
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => openEventForm()}
        className="absolute bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-app-accent text-white shadow-lg hover:bg-app-accent-hover transition-colors text-2xl"
      >
        +
      </button>

      <EventForm
        isOpen={isEventFormOpen}
        onClose={closeEventForm}
        initialDate={eventFormDate || undefined}
        onEventCreated={() =>
          queryClient.invalidateQueries({ queryKey: ['personal-events'] })
        }
      />
    </div>
  )
}
