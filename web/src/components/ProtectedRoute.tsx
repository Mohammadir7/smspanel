import React from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      window.location.href = '/'
    } else {
      setIsLoggedIn(true)
    }
    setLoading(false)
  }, [])

  if (loading) {
    return <div>درحال بارگیری...</div>
  }

  return isLoggedIn ? <>{children}</> : null
}

export default ProtectedRoute
