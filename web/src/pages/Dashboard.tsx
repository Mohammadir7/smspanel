import React from 'react'
import { Card, Button, Badge, Spinner } from '@/components/UI'

const Dashboard: React.FC = () => {
  const [user, setUser] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/v1/users/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      setUser(data)
    } catch (err) {
      console.error('خطا در بارگذاری اطلاعات', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <Spinner />
        <p>در حال بارگذاری...</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>داشبورد</h1>
        <Button variant="outline" onClick={() => {
          localStorage.removeItem('token')
          window.location.href = '/'
        }}>
          خروج
        </Button>
      </div>

      <div style={styles.gridContainer} className="grid grid-cols-3">
        {/* User Info Card */}
        <Card title="اطلاعات کاربر">
          <div style={styles.cardContent}>
            <div style={styles.infoRow}>
              <span>نام:</span>
              <strong>{user?.phone_number}</strong>
            </div>
            <div style={styles.infoRow}>
              <span>نقش:</span>
              <Badge>{user?.role === 'admin' ? 'مدیر' : 'کاربر'}</Badge>
            </div>
          </div>
        </Card>

        {/* Balance Card */}
        <Card title="موجودی کیف پول">
          <div style={styles.balanceCard}>
            <div style={styles.balanceAmount}>
              {(user?.balance || 0).toLocaleString('fa-IR')} ریال
            </div>
            <Button variant="primary" size="sm" block>
              شارژ کیف پول
            </Button>
          </div>
        </Card>

        {/* SMS Stats Card */}
        <Card title="آمار ارسال">
          <div style={styles.statsGrid}>
            <div style={styles.statItem}>
              <div style={styles.statNumber}>124</div>
              <div style={styles.statLabel}>پیام‌های ارسال‌شده</div>
            </div>
            <div style={styles.statItem}>
              <div style={styles.statNumber}>12</div>
              <div style={styles.statLabel}>پیام‌های در انتظار</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div style={styles.actionsArea}>
        <h2>عملیات سریع</h2>
        <div style={styles.actionButtons}>
          <Button variant="primary" size="lg">
            📨 ارسال پیام جدید
          </Button>
          <Button variant="secondary" size="lg">
            📊 تاریخچه پیام‌ها
          </Button>
          <Button variant="outline" size="lg">
            ⚙️ تنظیمات
          </Button>
        </div>
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    maxWidth: '1200px',
    margin: '0 auto 2rem',
  } as React.CSSProperties,
  gridContainer: {
    maxWidth: '1200px',
    margin: '0 auto 2rem',
  } as React.CSSProperties,
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  } as React.CSSProperties,
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 0',
    borderBottom: '1px solid #e5e7eb',
  } as React.CSSProperties,
  balanceCard: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  } as React.CSSProperties,
  balanceAmount: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#667eea',
  } as React.CSSProperties,
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  } as React.CSSProperties,
  statItem: {
    textAlign: 'center',
  } as React.CSSProperties,
  statNumber: {
    fontSize: '1.75rem',
    fontWeight: 'bold',
    color: '#667eea',
  } as React.CSSProperties,
  statLabel: {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginTop: '0.5rem',
  } as React.CSSProperties,
  actionsArea: {
    maxWidth: '1200px',
    margin: '0 auto',
  } as React.CSSProperties,
  actionButtons: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
    marginTop: '1rem',
  } as React.CSSProperties,
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    flexDirection: 'column',
    gap: '1rem',
  } as React.CSSProperties,
}

export default Dashboard
