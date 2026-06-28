import { useState, useRef, type KeyboardEvent } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import {
  PaperClipIcon,
  MapPinIcon,
  MicrophoneIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { sendMessage } from '../../api/messages'
import { uploadFile, checkUrlSafety } from '../../api/upload'
import { isImageFile, isDangerousFile, formatFileSize, cn } from '../../utils/format'
import type { Attachment, LocationData } from '../../types'
import LocationPicker from '../map/LocationPicker'
import toast from 'react-hot-toast'

interface MessageInputProps {
  channelId: string
}

interface PendingAttachment {
  file: File
  preview?: string
  isUploading: boolean
  uploaded?: Attachment
  isDangerous?: boolean
}

export default function MessageInput({ channelId }: MessageInputProps) {
  const [content, setContent] = useState('')
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([])
  const [isSending, setIsSending] = useState(false)
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canSend =
    (content.trim().length > 0 || pendingAttachments.length > 0) && !isSending

  const handleSend = async () => {
    if (!canSend) return

    const pendingUploads = pendingAttachments.filter((a) => !a.uploaded)
    if (pendingUploads.length > 0 || pendingAttachments.some((a) => a.isUploading)) {
      toast.error('ファイルのアップロード中です')
      return
    }

    setIsSending(true)
    try {
      const attachments = pendingAttachments
        .map((a) => a.uploaded)
        .filter((a): a is Attachment => !!a)

      await sendMessage(channelId, {
        content: content.trim(),
        type: attachments.length > 0 ? (isImageFile(attachments[0].mimeType) ? 'image' : 'file') : 'text',
      })

      setContent('')
      setPendingAttachments([])
    } catch {
      toast.error('メッセージの送信に失敗しました')
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return

    for (const file of Array.from(files)) {
      const dangerous = isDangerousFile(file.type, file.name)
      if (dangerous) {
        toast.error(`${file.name} は危険なファイルタイプです`, { icon: '⚠️' })
      }

      const preview = isImageFile(file.type)
        ? URL.createObjectURL(file)
        : undefined

      const pending: PendingAttachment = {
        file,
        preview,
        isUploading: true,
        isDangerous: dangerous,
      }

      setPendingAttachments((prev) => [...prev, pending])

      try {
        const uploaded = await uploadFile(
          file,
          isImageFile(file.type) ? 'image' : 'file',
        )
        setPendingAttachments((prev) =>
          prev.map((a) =>
            a.file === file ? { ...a, isUploading: false, uploaded } : a,
          ),
        )
      } catch {
        toast.error(`${file.name} のアップロードに失敗しました`)
        setPendingAttachments((prev) => prev.filter((a) => a.file !== file))
      }
    }
  }

  const handleLocationSelect = async (location: LocationData) => {
    setIsLocationPickerOpen(false)
    try {
      await sendMessage(channelId, {
        content: location.name,
        type: 'location',
        location,
      })
    } catch {
      toast.error('場所の共有に失敗しました')
    }
  }

  const removePendingAttachment = (file: File) => {
    setPendingAttachments((prev) => prev.filter((a) => a.file !== file))
  }

  return (
    <div className="px-4 pb-4">
      {/* 添付ファイルプレビュー */}
      {pendingAttachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {pendingAttachments.map((attachment, i) => (
            <div
              key={i}
              className={cn(
                'relative flex items-center gap-2 rounded border px-3 py-2',
                attachment.isDangerous
                  ? 'border-app-warning bg-app-warning/10'
                  : 'border-app-border bg-app-surface',
              )}
            >
              {attachment.preview ? (
                <img
                  src={attachment.preview}
                  alt=""
                  className="h-12 w-12 rounded object-cover"
                />
              ) : (
                <div className="flex items-center gap-2">
                  {attachment.isDangerous && (
                    <ExclamationTriangleIcon className="h-4 w-4 text-app-warning" />
                  )}
                  <div>
                    <p className="text-sm text-app-text-primary truncate max-w-[150px]">
                      {attachment.file.name}
                    </p>
                    <p className="text-xs text-app-text-muted">
                      {formatFileSize(attachment.file.size)}
                    </p>
                  </div>
                </div>
              )}
              {attachment.isUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded bg-black/40">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              )}
              <button
                onClick={() => removePendingAttachment(attachment.file)}
                className="ml-1 rounded-full p-0.5 hover:bg-app-surface-hover"
              >
                <XMarkIcon className="h-4 w-4 text-app-text-muted" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 入力エリア */}
      <div className="flex items-end gap-2 rounded-lg border border-app-border bg-app-surface px-3 py-2 focus-within:border-app-accent transition-colors">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0 rounded p-1 text-app-text-muted hover:text-app-text-primary"
          title="ファイルを添付"
        >
          <PaperClipIcon className="h-5 w-5" />
        </button>

        <TextareaAutosize
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="メッセージを入力..."
          maxRows={5}
          className="flex-1 resize-none bg-transparent text-sm text-app-text-primary placeholder-app-text-muted focus:outline-none"
          maxLength={2000}
        />

        <div className="flex flex-shrink-0 items-center gap-1">
          <button
            onClick={() => setIsLocationPickerOpen(true)}
            className="rounded p-1 text-app-text-muted hover:text-app-text-primary"
            title="場所を共有"
          >
            <MapPinIcon className="h-5 w-5" />
          </button>
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={cn(
              'rounded p-1 transition-colors',
              canSend
                ? 'text-app-accent hover:text-app-accent-hover'
                : 'text-app-text-muted cursor-not-allowed',
            )}
            title="送信（Enter）"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {content.length > 1800 && (
        <p className="mt-1 text-right text-xs text-app-warning">
          {content.length}/2000
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
      />

      <LocationPicker
        isOpen={isLocationPickerOpen}
        onClose={() => setIsLocationPickerOpen(false)}
        onSelect={handleLocationSelect}
      />
    </div>
  )
}
