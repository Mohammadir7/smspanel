import React from 'react'
import { Button, Card, Input, Alert } from '@/components/UI'

const LoginPage: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          password,
        }),
      })

      if (!response.ok) {
        throw new Error('ورود ناموفق')
      }

      const data = await response.json()
      setSuccess('خوش آمدید!')
      localStorage.setItem('token', data.token)
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'خطای ورود')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.contentWrapper}>
        <div style={styles.logoArea}>
          <div style={styles.logo}>📱</div>
          <h1 style={styles.title}>پنل پیامک</h1>
          <p style={styles.subtitle}>ارسال پیام‌های سریع و قابل‌اعتماد</p>
        </div>

        <Card className="login-card" title="ورود به حساب">
          {error && <Alert type="danger" message={error} />}
          {success && <Alert type="success" message={success} />}

          <form onSubmit={handleSubmit}>
            <Input
              label="شماره موبایل"
              type="tel"
              placeholder="09121234567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />

            <Input
              label="رمز عبور"
              type="password"
              placeholder="رمز عبور خود را وارد کنید"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              block
              disabled={loading}
            >
              {loading ? 'در حال ورود...' : 'ورود'}
            </Button>
          </form>

          <div style={styles.demoInfo}>
            <p style={styles.demoTitle}>🔓 حساب نمایشی:</p>
            <p>👤 Admin: 09120000001 | 🔑 admin123</p>
            <p>👤 User: 09120000002 | 🔑 user123</p>
          </div>
        </Card>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '1rem',
  } as React.CSSProperties,
  contentWrapper: {
    width: '100%',
    maxWidth: '500px',
  } as React.CSSProperties,
  logoArea: {
    textAlign: 'center',
    marginBottom: '2rem',
    color: 'white',
  } as React.CSSProperties,
  logo: {
    fontSize: '4rem',
    marginBottom: '1rem',
  } as React.CSSProperties,
  title: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
  } as React.CSSProperties,
  subtitle: {
    fontSize: '1.125rem',
    opacity: 0.9,
  } as React.CSSProperties,
  demoInfo: {
    marginTop: '1.5rem',
    padding: '1rem',
    backgroundColor: '#f0f4ff',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    direction: 'rtl',
  } as React.CSSProperties,
  demoTitle: {
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    color: '#667eea',
  } as React.CSSProperties,
}

export default LoginPage
