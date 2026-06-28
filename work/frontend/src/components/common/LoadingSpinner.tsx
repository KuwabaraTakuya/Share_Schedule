import { cn } from '../../utils/format'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-4',
}

export default function LoadingSpinner({
  size = 'md',
  className,
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-app-border border-t-app-accent',
        sizeClasses[size],
        className,
      )}
      style={{ borderTopColor: '#5865f2' }}
      role="status"
      aria-label="読み込み中"
    />
  )
}
