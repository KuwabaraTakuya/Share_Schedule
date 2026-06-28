import {
  format,
  isToday,
  isYesterday,
  isSameDay,
  startOfMonth,
  endOfMonth,
  parseISO,
} from 'date-fns'
import { ja } from 'date-fns/locale'

export function formatMessageTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date

  if (isToday(d)) {
    return format(d, 'HH:mm')
  }
  if (isYesterday(d)) {
    return `昨日 ${format(d, 'HH:mm')}`
  }
  return format(d, 'M月d日 HH:mm', { locale: ja })
}

export function formatCalendarDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'yyyy年M月d日（eee）', { locale: ja })
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'M月d日', { locale: ja })
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'HH:mm')
}

export function formatMonth(date: Date): string {
  return format(date, 'yyyy年M月', { locale: ja })
}

export function getMonthRange(date: Date): { start: Date; end: Date } {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  }
}

export function toISODateString(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export { isSameDay, parseISO }
