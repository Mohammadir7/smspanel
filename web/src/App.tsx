import React from 'react'
import LoginPage from '@/pages/LoginPage'
import Dashboard from '@/pages/Dashboard'
import SendSMSPage from '@/pages/SendSMSPage'
import WalletPage from '@/pages/WalletPage'
import HistoryPage from '@/pages/HistoryPage'
import SettingsPage from '@/pages/SettingsPage'
import Navbar from '@/components/Navbar'
import ProtectedRoute from '@/components/ProtectedRoute'
import '../styles/global.css'

type Page = 'login' | 'dashboard' | 'send-sms' | 'wallet' | 'history' | 'settings'

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = React.useState<Page>('login')
  const [isLoggedIn, setIsLoggedIn] = React.useState(false)

  React.useEffect(() => {
    const token = localStorage.getItem('token')
    const path = window.location.pathname

    if (!token) {
      setIsLoggedIn(false)
      setCurrentPage('login')
    } else {
      setIsLoggedIn(true)
      if (path.includes('send-sms')) {
        setCurrentPage('send-sms')
      } else if (path.includes('wallet')) {
        setCurrentPage('wallet')
      } else if (path.includes('history')) {
        setCurrentPage('history')
      } else if (path.includes('settings')) {
        setCurrentPage('settings')
      } else {
        setCurrentPage('dashboard')
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsLoggedIn(false)
    setCurrentPage('login')
  }

  const handleLogin = () => {
    setIsLoggedIn(true)
    setCurrentPage('dashboard')
  }

  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={handleLogin} />
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar currentPath={`/${currentPage}`} onLogout={handleLogout} />
      <ProtectedRoute>
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'send-sms' && <SendSMSPage />}
        {currentPage === 'wallet' && <WalletPage />}
        {currentPage === 'history' && <HistoryPage />}
        {currentPage === 'settings' && <SettingsPage />}
      </ProtectedRoute>
    </div>
  )
}

export default App
