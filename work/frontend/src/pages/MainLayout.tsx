import { Outlet } from 'react-router-dom'
import { useUIStore } from '../store/ui.store'
import Sidebar from '../components/common/Sidebar'
import Header from '../components/common/Header'
import { useCommunities } from '../hooks/useCommunities'
import { useNotifications } from '../hooks/useNotifications'

export default function MainLayout() {
  useCommunities()
  useNotifications()

  const { isSidebarOpen, setSidebarOpen } = useUIStore()

  return (
    <div className="flex h-screen overflow-hidden bg-app-bg">
      {/* モバイル用オーバーレイ */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* サイドバー */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 flex w-[280px] flex-col transition-transform duration-200
          lg:relative lg:translate-x-0 lg:w-[280px]
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar />
      </aside>

      {/* メインコンテンツ */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
