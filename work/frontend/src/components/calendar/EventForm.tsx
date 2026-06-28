import { useState } from 'react'
import { parseISO, format, addHours } from 'date-fns'
import Modal from '../common/Modal'
import Button from '../common/Button'
import VoiceInput from './VoiceInput'
import { createEvent, parseEventFromText } from '../../api/events'
import { useAuthStore } from '../../store/auth.store'
import type { CalendarEvent, ParsedEvent } from '../../types'
import toast from 'react-hot-toast'

interface EventFormProps {
  isOpen: boolean
  onClose: () => void
  initialDate?: string
  onEventCreated?: (event: CalendarEvent) => void
}

export default function EventForm({
  isOpen,
  onClose,
  initialDate,
  onEventCreated,
}: EventFormProps) {
  const { user } = useAuthStore()
  const now = new Date()
  const defaultStart = initialDate
    ? `${initialDate}T09:00`
    : format(now, "yyyy-MM-dd'T'HH:00")
  const defaultEnd = initialDate
    ? `${initialDate}T10:00`
    : format(addHours(now, 1), "yyyy-MM-dd'T'HH:00")

  const [title, setTitle] = useState('')
  const [startTime, setStartTime] = useState(defaultStart)
  const [endTime, setEndTime] = useState(defaultEnd)
  const [isAllDay, setIsAllDay] = useState(false)
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<'private' | 'community'>('private')
  const [naturalInput, setNaturalInput] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [parsedPreview, setParsedPreview] = useState<ParsedEvent | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleNaturalInputParse = async (text: string) => {
    if (!text.trim()) return
    setIsParsing(true)
    try {
      const parsed = await parseEventFromText(
        text,
        user?.timezone || 'Asia/Tokyo',
      )
      setParsedPreview(parsed)
      if (parsed.title) setTitle(parsed.title)
      if (parsed.startTime)
        setStartTime(format(parseISO(parsed.startTime), "yyyy-MM-dd'T'HH:mm"))
      if (parsed.endTime)
        setEndTime(format(parseISO(parsed.endTime), "yyyy-MM-dd'T'HH:mm"))
      if (parsed.location) setLocation(parsed.location)
      if (parsed.description) setDescription(parsed.description)
      setIsAllDay(parsed.isAllDay)
    } catch {
      toast.error('予定の解析に失敗しました')
    } finally {
      setIsParsing(false)
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('タイトルを入力してください')
      return
    }

    setIsSaving(true)
    try {
      const event = await createEvent({
        userId: user!.id,
        title: title.trim(),
        description,
        startTime: isAllDay ? `${startTime.split('T')[0]}T00:00:00` : new Date(startTime).toISOString(),
        endTime: isAllDay ? `${endTime.split('T')[0]}T23:59:59` : new Date(endTime).toISOString(),
        isAllDay,
        location: location || undefined,
        visibility,
        source: 'manual',
        recurrence: { type: 'none' },
      })
      toast.success('予定を作成しました')
      onEventCreated?.(event)
      onClose()
      resetForm()
    } catch {
      toast.error('予定の作成に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  const resetForm = () => {
    setTitle('')
    setNaturalInput('')
    setParsedPreview(null)
    setLocation('')
    setDescription('')
    setIsAllDay(false)
    setVisibility('private')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="予定を作成" size="lg">
      <div className="space-y-4">
        {/* 自然言語入力 */}
        <div className="rounded-lg border border-app-accent/30 bg-app-accent/5 p-3">
          <p className="mb-2 text-xs text-app-text-muted">
            AIで自動入力 — 例:「2日の12時に学校」「土曜日午後3時から映画」
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={naturalInput}
              onChange={(e) => setNaturalInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' && handleNaturalInputParse(naturalInput)
              }
              placeholder="予定を自然な言葉で入力..."
              className="flex-1 rounded border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text-primary placeholder-app-text-muted focus:border-app-accent focus:outline-none"
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleNaturalInputParse(naturalInput)}
              isLoading={isParsing}
              disabled={!naturalInput.trim()}
            >
              解析
            </Button>
            <VoiceInput onResult={(text) => {
              setNaturalInput(text)
              handleNaturalInputParse(text)
            }} />
          </div>
          {parsedPreview && parsedPreview.confidence < 0.7 && (
            <p className="mt-2 text-xs text-app-warning">
              ⚠️ 内容を確認してください（確信度: {Math.round(parsedPreview.confidence * 100)}%）
            </p>
          )}
        </div>

        {/* タイトル */}
        <div>
          <label className="mb-1 block text-sm text-app-text-muted">
            タイトル <span className="text-app-danger">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="予定のタイトル"
            className="w-full rounded border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text-primary placeholder-app-text-muted focus:border-app-accent focus:outline-none"
          />
        </div>

        {/* 終日チェック */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isAllDay"
            checked={isAllDay}
            onChange={(e) => setIsAllDay(e.target.checked)}
            className="rounded border-app-border"
          />
          <label htmlFor="isAllDay" className="text-sm text-app-text-primary">
            終日
          </label>
        </div>

        {/* 日時 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm text-app-text-muted">開始</label>
            <input
              type={isAllDay ? 'date' : 'datetime-local'}
              value={isAllDay ? startTime.split('T')[0] : startTime}
              onChange={(e) => setStartTime(isAllDay ? `${e.target.value}T00:00` : e.target.value)}
              className="w-full rounded border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text-primary focus:border-app-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-app-text-muted">終了</label>
            <input
              type={isAllDay ? 'date' : 'datetime-local'}
              value={isAllDay ? endTime.split('T')[0] : endTime}
              onChange={(e) => setEndTime(isAllDay ? `${e.target.value}T23:59` : e.target.value)}
              className="w-full rounded border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text-primary focus:border-app-accent focus:outline-none"
            />
          </div>
        </div>

        {/* 場所 */}
        <div>
          <label className="mb-1 block text-sm text-app-text-muted">場所</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="場所を入力..."
            className="w-full rounded border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text-primary placeholder-app-text-muted focus:border-app-accent focus:outline-none"
          />
        </div>

        {/* メモ */}
        <div>
          <label className="mb-1 block text-sm text-app-text-muted">メモ</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="メモを入力..."
            rows={3}
            className="w-full resize-none rounded border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text-primary placeholder-app-text-muted focus:border-app-accent focus:outline-none"
          />
        </div>

        {/* 公開範囲 */}
        <div>
          <label className="mb-1 block text-sm text-app-text-muted">公開範囲</label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as 'private' | 'community')}
            className="w-full rounded border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text-primary focus:border-app-accent focus:outline-none"
          >
            <option value="private">自分のみ</option>
            <option value="community">コミュニティ全員</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose}>
            キャンセル
          </Button>
          <Button onClick={handleSave} isLoading={isSaving}>
            保存
          </Button>
        </div>
      </div>
    </Modal>
  )
}
