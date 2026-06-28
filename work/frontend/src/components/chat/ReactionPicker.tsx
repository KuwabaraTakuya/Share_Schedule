const COMMON_EMOJIS = [
  '👍', '❤️', '😂', '😮', '😢', '😡',
  '🎉', '🙏', '👏', '🔥', '✅', '❌',
  '⭐', '💯', '🚀', '👀', '💪', '🤔',
  '😊', '🥺',
]

interface ReactionPickerProps {
  onSelect: (emoji: string) => void
}

export default function ReactionPicker({ onSelect }: ReactionPickerProps) {
  return (
    <div className="grid grid-cols-6 gap-1 rounded-lg border border-app-border bg-app-surface p-2 shadow-xl">
      {COMMON_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onSelect(emoji)}
          className="flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-app-surface-hover transition-colors"
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
