import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string): string {
  if (!name) return '?'
  const trimmed = name.trim()
  // 日本語文字の場合は最初の1文字
  if (/[　-鿿가-힯]/.test(trimmed[0])) {
    return trimmed[0]
  }
  // 英語は最初の2文字（イニシャル）
  const parts = trimmed.split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return trimmed.slice(0, 2).toUpperCase()
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

const DANGEROUS_EXTENSIONS = [
  '.exe', '.sh', '.bat', '.cmd', '.msi', '.app', '.apk',
  '.dmg', '.deb', '.rpm', '.jar', '.vbs', '.ps1',
]

const DANGEROUS_MIME_TYPES = [
  'application/x-msdownload',
  'application/x-executable',
  'application/x-sh',
  'application/x-bat',
  'application/x-msdos-program',
  'application/java-archive',
]

export function isDangerousFile(mimeType: string, fileName: string): boolean {
  if (DANGEROUS_MIME_TYPES.includes(mimeType)) return true
  const lower = fileName.toLowerCase()
  return DANGEROUS_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

export function generateAvatarColor(userId: string): string {
  const colors = [
    '#5865f2', '#ed4245', '#3ba55d', '#faa61a',
    '#eb459e', '#00b0f4', '#f47fff', '#43b581',
  ]
  const index =
    userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    colors.length
  return colors[index]
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
