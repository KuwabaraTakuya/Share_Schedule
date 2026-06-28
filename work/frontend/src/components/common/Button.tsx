import { type ButtonHTMLAttributes } from 'react'
import { cn } from '../../utils/format'
import LoadingSpinner from './LoadingSpinner'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  fullWidth?: boolean
}

const variantClasses = {
  primary: 'bg-app-accent hover:bg-app-accent-hover text-white',
  secondary: 'bg-app-surface hover:bg-app-surface-hover text-app-text-primary border border-app-border',
  danger: 'bg-app-danger hover:opacity-90 text-white',
  ghost: 'bg-transparent hover:bg-app-surface-hover text-app-text-primary',
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-app-accent focus:ring-offset-1 focus:ring-offset-app-bg disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <LoadingSpinner size="sm" />}
      {children}
    </button>
  )
}
