importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

// Firebase設定はビルド時に注入、またはキャッシュから取得
// 実際の設定はindex.htmlから self.firebaseConfig に設定すること
firebase.initializeApp(self.firebaseConfig || {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const { notification } = payload
  if (!notification) return

  const title = notification.title || 'ShareSchedule'
  const options = {
    body: notification.body || '',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: payload.data,
    tag: payload.data?.channelId || 'default',
    renotify: true,
  }

  self.registration.showNotification(title, options)
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const channelId = event.notification.data?.channelId
  const communityId = event.notification.data?.communityId

  if (channelId && communityId) {
    event.waitUntil(
      clients.openWindow(`/c/${communityId}/ch/${channelId}`),
    )
  } else {
    event.waitUntil(clients.openWindow('/'))
  }
})
