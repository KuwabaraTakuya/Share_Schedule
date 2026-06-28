import { useParams } from 'react-router-dom'
import { PlusIcon } from '@heroicons/react/24/outline'
import { useUIStore } from '../store/ui.store'
import CommunityCalendar from '../components/calendar/CommunityCalendar'
import EventForm from '../components/calendar/EventForm'

export default function CalendarPage() {
  const { communityId } = useParams<{ communityId: string }>()
  const { isEventFormOpen, eventFormDate, openEventForm, closeEventForm } =
    useUIStore()

  if (!communityId) return null

  return (
    <div className="relative flex h-full flex-col">
      {/* 予定追加ボタン */}
      <div className="absolute right-4 top-4 z-10">
        <button
          onClick={() => openEventForm()}
          className="flex items-center gap-1.5 rounded bg-app-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-app-accent-hover transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          予定を追加
        </button>
      </div>

      {/* カレンダー */}
      <CommunityCalendar communityId={communityId} />

      {/* 予定入力フォーム */}
      <EventForm
        isOpen={isEventFormOpen}
        onClose={closeEventForm}
        initialDate={eventFormDate || undefined}
      />
    </div>
  )
}
