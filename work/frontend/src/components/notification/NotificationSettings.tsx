import { useState } from 'react'
import { BellIcon, BellSlashIcon, BellAlertIcon } from '@heroicons/react/24/outline'
import { useChannelStore } from '../../store/channel.store'
import { useNotifications } from '../../hooks/useNotifications'
import { updateNotificationSettings } from '../../api/notifications'
import Button from '../common/Button'
import type { NotificationMode } from '../../types'
import toast from 'react-hot-toast'

interface NotificationSettingsProps {
  communityId: string
}

export default function NotificationSettings({ communityId }: NotificationSettingsProps) {
  const { channels, channelNotifications, setChannelNotification } =
    useChannelStore()
  const { requestPermission } = useNotifications()
  const [quietStart, setQuietStart] = useState('23:00')
  const [quietEnd, setQuietEnd] = useState('07:00')
  const [isSaving, setIsSaving] = useState(false)

  const communityChannels = channels[communityId] || []

  const notificationIcons: Record<NotificationMode, typeof BellIcon> = {
    all: BellAlertIcon,
    mentions: BellIcon,
    muted: BellSlashIcon,
  }

  const notificationLabels: Record<NotificationMode, string> = {
    all: '全ての通知',
    mentions: 'メンションのみ',
    muted: 'ミュート',
  }

  const handleSaveQuietHours = async () => {
    setIsSaving(true)
    try {
      await updateNotificationSettings({
        quietHoursStart: quietStart,
        quietHoursEnd: quietEnd,
      })
      toast.success('通知設定を保存しました')
    } catch {
      toast.error('設定の保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* プッシュ通知の許可 */}
      <div>
        <h3 className="mb-2 font-medium text-app-text-primary">
          プッシュ通知
        </h3>
        <Button size="sm" variant="secondary" onClick={requestPermission}>
          通知を有効にする
        </Button>
        <p className="mt-1 text-xs text-app-text-muted">
          ブラウザの通知を許可することで、メッセージをリアルタイムで受け取れます
        </p>
      </div>

      {/* おやすみモード */}
      <div>
        <h3 className="mb-2 font-medium text-app-text-primary">
          おやすみモード
        </h3>
        <div className="flex items-center gap-4">
          <div>
            <label className="mb-1 block text-xs text-app-text-muted">開始</label>
            <input
              type="time"
              value={quietStart}
              onChange={(e) => setQuietStart(e.target.value)}
              className="rounded border border-app-border bg-app-bg px-2 py-1 text-sm text-app-text-primary focus:border-app-accent focus:outline-none"
            />
          </div>
          <span className="text-app-text-muted">〜</span>
          <div>
            <label className="mb-1 block text-xs text-app-text-muted">終了</label>
            <input
              type="time"
              value={quietEnd}
              onChange={(e) => setQuietEnd(e.target.value)}
              className="rounded border border-app-border bg-app-bg px-2 py-1 text-sm text-app-text-primary focus:border-app-accent focus:outline-none"
            />
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleSaveQuietHours}
            isLoading={isSaving}
            className="self-end"
          >
            保存
          </Button>
        </div>
      </div>

      {/* チャンネルごとの通知設定 */}
      <div>
        <h3 className="mb-3 font-medium text-app-text-primary">
          チャンネルの通知設定
        </h3>
        <div className="space-y-2">
          {communityChannels.map((channel) => {
            const currentMode = channelNotifications[channel.id] || 'all'
            const Icon = notificationIcons[currentMode]

            return (
              <div
                key={channel.id}
                className="flex items-center justify-between rounded border border-app-border p-2"
              >
                <span className="text-sm text-app-text-primary">
                  #{channel.name}
                </span>
                <div className="flex items-center gap-1">
                  {(['all', 'mentions', 'muted'] as NotificationMode[]).map(
                    (mode) => (
                      <button
                        key={mode}
                        onClick={() =>
                          setChannelNotification(channel.id, mode)
                        }
                        className={`rounded px-2 py-1 text-xs transition-colors ${
                          currentMode === mode
                            ? 'bg-app-accent text-white'
                            : 'text-app-text-muted hover:bg-app-surface-hover'
                        }`}
                      >
                        {notificationLabels[mode]}
                      </button>
                    ),
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
