import React from 'react'
import { Card, Button, Badge, Input } from '@/components/UI'

interface SMSRecord {
  id: string
  phone_number: string
  message: string
  status: 'sent' | 'pending' | 'failed'
  cost: number
  created_at: string
}

const HistoryPage: React.FC = () => {
  const [records, setRecords] = React.useState<SMSRecord[]>([])
  const [loading, setLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<'all' | 'sent' | 'pending' | 'failed'>('all')
  const [searchTerm, setSearchTerm] = React.useState('')

  React.useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/v1/sms/history', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      setRecords(data.sms_history || [])
    } catch (err) {
      console.error('خطا در بارگذاری', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredRecords = records
    .filter((r) => filter === 'all' || r.status === filter)
    .filter((r) =>
      r.phone_number.includes(searchTerm) || r.message.includes(searchTerm)
    )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'success'
      case 'failed':
        return 'danger'
      default:
        return 'warning'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'sent':
        return '✓ ارسال شد'
      case 'pending':
        return '⏳ در انتظار'
      default:
        return '✗ ناموفق'
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>📊 تاریخچه پیام‌ها</h1>
      </div>

      <div style={styles.controlsArea}>
        <Card>
          <div style={styles.controls}>
            <Input
              type="text"
              placeholder="جستجو برای شماره یا متن"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div style={styles.filterButtons}>
              {(['all', 'sent', 'pending', 'failed'] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(f)}
                >
                  {f === 'all'
                    ? 'همه'
                    : f === 'sent'
                      ? 'ارسال شده'
                      : f === 'pending'
                        ? 'در انتظار'
                        : 'ناموفق'}
                </Button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Records Table */}
      <Card style={styles.tableCard}>
        {filteredRecords.length === 0 ? (
          <p style={styles.emptyState}>هیچ رکوردی پیدا نشد</p>
        ) : (
          <div style={styles.tableContainer}>
            <div style={styles.tableHeader}>
              <div style={styles.tableCell}>تاریخ</div>
              <div style={styles.tableCell}>شماره</div>
              <div style={styles.tableCell}>متن</div>
              <div style={styles.tableCell}>وضعیت</div>
              <div style={styles.tableCell}>هزینه</div>
            </div>
            {filteredRecords.map((record) => (
              <div key={record.id} style={styles.tableRow}>
                <div style={styles.tableCell}>
                  {new Date(record.created_at).toLocaleDateString('fa-IR')}
                </div>
                <div style={styles.tableCell}>{record.phone_number}</div>
                <div style={styles.tableCell}>
                  <span style={styles.messagePreview}>
                    {record.message.substring(0, 30)}...
                  </span>
                </div>
                <div style={styles.tableCell}>
                  <Badge variant={getStatusColor(record.status)}>
                    {getStatusLabel(record.status)}
                  </Badge>
                </div>
                <div style={styles.tableCell}>
                  {record.cost.toLocaleString('fa-IR')} ریال
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
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
  controlsArea: {
    maxWidth: '1200px',
    margin: '0 auto 1.5rem',
  } as React.CSSProperties,
  controls: {
    display: 'flex',
    gap: '1rem',
    flexDirection: 'column',
  } as React.CSSProperties,
  filterButtons: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  tableCard: {
    maxWidth: '1200px',
    margin: '0 auto',
  } as React.CSSProperties,
  tableContainer: {
    overflowX: 'auto',
  } as React.CSSProperties,
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '150px 150px 1fr 120px 120px',
    gap: '1rem',
    padding: '1rem',
    background: '#f3f4f6',
    borderRadius: '0.5rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
  } as React.CSSProperties,
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '150px 150px 1fr 120px 120px',
    gap: '1rem',
    padding: '1rem',
    borderBottom: '1px solid #e5e7eb',
    alignItems: 'center',
  } as React.CSSProperties,
  tableCell: {
    fontSize: '0.875rem',
  } as React.CSSProperties,
  messagePreview: {
    color: '#6b7280',
    fontSize: '0.8rem',
  } as React.CSSProperties,
  emptyState: {
    textAlign: 'center',
    padding: '2rem',
    color: '#9ca3af',
  } as React.CSSProperties,
}

export default HistoryPage
