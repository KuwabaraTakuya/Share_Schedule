import { useEffect, useRef, type ReactNode } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { cn } from '../../utils/format'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnBackdrop?: boolean
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnBackdrop = true,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 animate-fade-in"
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      <div
        ref={dialogRef}
        className={cn(
          'relative w-full rounded-lg bg-app-surface shadow-xl animate-fade-in',
          sizeClasses[size],
        )}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <div className="flex items-center justify-between border-b border-app-border px-6 py-4">
            <h2 className="text-lg font-semibold text-app-text-primary">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="rounded p-1 text-app-text-muted hover:bg-app-surface-hover hover:text-app-text-primary"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
