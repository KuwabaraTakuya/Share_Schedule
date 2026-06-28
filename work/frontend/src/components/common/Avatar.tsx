import { cn, getInitials, generateAvatarColor } from '../../utils/format'

interface AvatarProps {
  userId?: string
  displayName: string
  avatarUrl?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  isOnline?: boolean
  className?: string
}

const sizeClasses = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
}

const dotSizeClasses = {
  xs: 'h-2 w-2 -bottom-0.5 -right-0.5',
  sm: 'h-2.5 w-2.5 -bottom-0.5 -right-0.5',
  md: 'h-3 w-3 -bottom-0.5 -right-0.5',
  lg: 'h-3.5 w-3.5 -bottom-0.5 -right-0.5',
}

export default function Avatar({
  userId,
  displayName,
  avatarUrl,
  size = 'md',
  isOnline,
  className,
}: AvatarProps) {
  const bgColor = userId ? generateAvatarColor(userId) : '#5865f2'

  return (
    <div className={cn('relative flex-shrink-0', className)}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={displayName}
          className={cn(
            'rounded-full object-cover',
            sizeClasses[size],
          )}
        />
      ) : (
        <div
          className={cn(
            'flex items-center justify-center rounded-full font-medium text-white',
            sizeClasses[size],
          )}
          style={{ backgroundColor: bgColor }}
        >
          {getInitials(displayName)}
        </div>
      )}
      {isOnline !== undefined && (
        <span
          className={cn(
            'absolute block rounded-full border-2 border-app-bg',
            dotSizeClasses[size],
            isOnline ? 'bg-app-success' : 'bg-app-text-muted',
          )}
          style={{ borderColor: '#1a1d21' }}
        />
      )}
    </div>
  )
}
