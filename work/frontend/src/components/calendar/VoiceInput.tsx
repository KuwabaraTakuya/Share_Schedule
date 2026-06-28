import { useState, useRef } from 'react'
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/outline'
import { cn } from '../../utils/format'

interface VoiceInputProps {
  onResult: (text: string) => void
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

export default function VoiceInput({ onResult }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isSupported] = useState(
    () => !!(window.SpeechRecognition || window.webkitSpeechRecognition),
  )
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  if (!isSupported) return null

  const startRecording = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.lang = 'ja-JP'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      onResult(transcript)
      setIsRecording(false)
    }

    recognition.onerror = () => {
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsRecording(true)
  }

  const stopRecording = () => {
    recognitionRef.current?.stop()
    setIsRecording(false)
  }

  return (
    <button
      type="button"
      onClick={isRecording ? stopRecording : startRecording}
      className={cn(
        'flex items-center gap-1.5 rounded px-2 py-1.5 text-sm transition-colors',
        isRecording
          ? 'bg-red-600/20 text-red-400 animate-pulse'
          : 'text-app-text-muted hover:text-app-text-primary hover:bg-app-surface-hover',
      )}
      title={isRecording ? '停止' : '音声入力'}
    >
      {isRecording ? (
        <>
          <StopIcon className="h-4 w-4" />
          <span>停止</span>
        </>
      ) : (
        <>
          <MicrophoneIcon className="h-4 w-4" />
          <span>音声入力</span>
        </>
      )}
    </button>
  )
}
