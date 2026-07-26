import React from 'react'
import LoginPage from '@/pages/LoginPage'
import Dashboard from '@/pages/Dashboard'
import '../styles/global.css'

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false)

  React.useEffect(() => {
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
  }, [])

  return isLoggedIn ? <Dashboard /> : <LoginPage />
}

export default App
