import { useEffect } from 'react'
import { getToken, onMessage } from 'firebase/messaging'
import { getMessagingInstance, VAPID_KEY } from '../firebase'
import { registerFCMToken } from '../api/notifications'
import { useAuthStore } from '../store/auth.store'
import toast from 'react-hot-toast'

export function useNotifications() {
  const { user } = useAuthStore()

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        toast.error('通知の許可が必要です')
        return
      }

      const messaging = await getMessagingInstance()
      if (!messaging) {
        toast.error('このブラウザはプッシュ通知に対応していません')
        return
      }

      const token = await getToken(messaging, { vapidKey: VAPID_KEY })
      if (token) {
        await registerFCMToken(token)
        toast.success('通知を有効にしました')
      }
    } catch (err) {
      console.error('Failed to get FCM token:', err)
      toast.error('通知の設定に失敗しました')
    }
  }

  useEffect(() => {
    if (!user) return

    let unsubscribe: (() => void) | undefined

    const setupForegroundListener = async () => {
      const messaging = await getMessagingInstance()
      if (!messaging) return

      unsubscribe = onMessage(messaging, (payload) => {
        const { notification } = payload
        if (notification) {
          toast(notification.body || 'メッセージが届きました', {
            icon: '💬',
            duration: 4000,
          })
        }
      })
    }

    setupForegroundListener()

    return () => {
      unsubscribe?.()
    }
  }, [user])

  return { requestPermission }
}
