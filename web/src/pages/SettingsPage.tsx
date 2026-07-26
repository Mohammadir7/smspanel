import React from 'react'
import { Card, Button } from '@/components/UI'

const SettingsPage: React.FC = () => {
  const [apiKey, setApiKey] = React.useState('')
  const [showApiKey, setShowApiKey] = React.useState(false)
  const [notifications, setNotifications] = React.useState(true)
  const [darkMode, setDarkMode] = React.useState(false)

  React.useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/v1/users/settings', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      setApiKey(data.api_key || '')
    } catch (err) {
      console.error('خطا در بارگیری تنظیمات:', err)
    }
  }

  const generateNewApiKey = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/v1/users/generate-api-key', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      setApiKey(data.api_key)
    } catch (err) {
      console.error('خطا:', err)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey)
    alert('کپی شد!')
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>⚙️ تنظیمات</h1>
      </div>

      <div style={styles.gridContainer}>
        {/* Account Settings */}
        <Card title="👤 تنظیمات حساب">
          <div style={styles.settingItem}>
            <label style={styles.label}>ایمیل:</label>
            <input
              type="email"
              disabled
              placeholder="ایمیل"
              style={styles.input}
            />
          </div>
          <div style={styles.settingItem}>
            <label style={styles.label}>شماره موبایل:</label>
            <input
              type="tel"
              disabled
              placeholder="شماره موبایل"
              style={styles.input}
            />
          </div>
          <Button variant="primary" block style={{ marginTop: '1rem' }}>
            ویرایش حساب
          </Button>
        </Card>

        {/* API Settings */}
        <Card title="🔑 API Key">
          <div style={styles.apiKeyContainer}>
            <div style={styles.apiKeyInput}>
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                readOnly
                style={styles.apiKeyField}
              />
              <button
                style={styles.toggleBtn}
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? '🙈' : '👁️'}
              </button>
            </div>
            <div style={styles.apiActions}>
              <Button
                variant="secondary"
                size="sm"
                onClick={copyToClipboard}
              >
                📋 کپی
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={generateNewApiKey}
              >
                🔄 تولید جدید
              </Button>
            </div>
          </div>
        </Card>

        {/* Preferences */}
        <Card title="🎨 ترجیحات">
          <div style={styles.preferenceItem}>
            <div>
              <div style={styles.preferenceName}>اطلاعات‌رسانی</div>
              <div style={styles.preferenceDesc}>
                دریافت اطلاعات از طریق ایمیل
              </div>
            </div>
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
              style={styles.checkbox}
            />
          </div>
          <div style={styles.preferenceItem}>
            <div>
              <div style={styles.preferenceName}>حالت تاریک</div>
              <div style={styles.preferenceDesc}>فعال‌کردن حالت شب</div>
            </div>
            <input
              type="checkbox"
              checked={darkMode}
              onChange={(e) => setDarkMode(e.target.checked)}
              style={styles.checkbox}
            />
          </div>
        </Card>

        {/* Security */}
        <Card title="🔐 امنیت">
          <div style={styles.securityItem}>
            <div>
              <div style={styles.securityLabel}>تغییر رمز عبور</div>
              <div style={styles.securityDesc}>
                رمز عبور خود را به‌طور منظم تغییر دهید
              </div>
            </div>
            <Button variant="secondary" size="sm">
              تغییر
            </Button>
          </div>
          <div style={styles.securityItem}>
            <div>
              <div style={styles.securityLabel}>احراز هویت دو مرحله‌ای</div>
              <div style={styles.securityDesc}>
                افزایش امنیت حساب شما
              </div>
            </div>
            <Button variant="secondary" size="sm">
              فعال‌کردن
            </Button>
          </div>
          <div style={styles.securityItem}>
            <div>
              <div style={styles.securityLabel}>حذف حساب</div>
              <div style={styles.securityDesc}>حذف دائمی حساب شما</div>
            </div>
            <Button variant="danger" size="sm">
              حذف
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f7fa',
    padding: '2rem 1rem',
  } as React.CSSProperties,
  header: {
    maxWidth: '1200px',
    margin: '0 auto 2rem',
  } as React.CSSProperties,
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1.5rem',
    maxWidth: '1200px',
    margin: '0 auto',
  } as React.CSSProperties,
  settingItem: {
    marginBottom: '1.5rem',
  } as React.CSSProperties,
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '500',
    color: '#374151',
  } as React.CSSProperties,
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1px solid #e5e7eb',
    borderRadius: '0.375rem',
    fontSize: '1rem',
    direction: 'rtl',
  } as React.CSSProperties,
  apiKeyContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  } as React.CSSProperties,
  apiKeyInput: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  } as React.CSSProperties,
  apiKeyField: {
    flex: 1,
    padding: '0.75rem 1rem',
    border: '1px solid #e5e7eb',
    borderRadius: '0.375rem',
    fontSize: '0.875rem',
    fontFamily: 'monospace',
    direction: 'ltr',
  } as React.CSSProperties,
  toggleBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.25rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  apiActions: {
    display: 'flex',
    gap: '0.75rem',
  } as React.CSSProperties,
  preferenceItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 0',
    borderBottom: '1px solid #e5e7eb',
  } as React.CSSProperties,
  preferenceName: {
    fontWeight: '500',
    marginBottom: '0.25rem',
  } as React.CSSProperties,
  preferenceDesc: {
    fontSize: '0.875rem',
    color: '#6b7280',
  } as React.CSSProperties,
  checkbox: {
    width: '1.25rem',
    height: '1.25rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  securityItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 0',
    borderBottom: '1px solid #e5e7eb',
  } as React.CSSProperties,
  securityLabel: {
    fontWeight: '500',
    marginBottom: '0.25rem',
  } as React.CSSProperties,
  securityDesc: {
    fontSize: '0.875rem',
    color: '#6b7280',
  } as React.CSSProperties,
}

export default SettingsPage
