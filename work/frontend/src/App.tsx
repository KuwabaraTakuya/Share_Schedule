import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthListener } from './hooks/useAuth'
import { useAuthStore } from './store/auth.store'
import AuthPage from './pages/AuthPage'
import MainLayout from './pages/MainLayout'
import CalendarPage from './pages/CalendarPage'
import ChatPage from './pages/ChatPage'
import PersonalCalendarPage from './pages/PersonalCalendarPage'
import SearchPage from './pages/SearchPage'
import LoadingSpinner from './components/common/LoadingSpinner'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-app-bg">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  return <>{children}</>
}

export default function App() {
  useAuthListener()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/c" replace />} />
          <Route path="/c" element={<div className="flex h-full items-center justify-center text-app-text-muted">コミュニティを選択してください</div>} />
          <Route path="/c/:communityId" element={<CalendarPage />} />
          <Route path="/c/:communityId/ch/:channelId" element={<ChatPage />} />
          <Route path="/c/:communityId/calendar" element={<PersonalCalendarPage />} />
          <Route path="/c/:communityId/search" element={<SearchPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
