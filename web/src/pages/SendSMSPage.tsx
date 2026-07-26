import React from 'react'
import { Card, Button, Input, Alert, Badge, Spinner } from '@/components/UI'

interface Recipient {
  phoneNumber: string
  status: 'pending' | 'sent' | 'failed'
}

const SendSMSPage: React.FC = () => {
  const [recipients, setRecipients] = React.useState<Recipient[]>([])
  const [currentPhone, setCurrentPhone] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [estimatedCost, setEstimatedCost] = React.useState(0)

  const MAX_MESSAGE_LENGTH = 160

  // بروزرسانی هزینه‌ی تخمینی
  React.useEffect(() => {
    const cost = recipients.length * 500 // هر پیام 500 ریال
    setEstimatedCost(cost)
  }, [recipients])

  const handleAddRecipient = () => {
    if (!currentPhone.trim()) {
      setError('لطفاً شماره موبایل را وارد کنید')
      return
    }

    if (!/^(\+?98)?[0-9]{10}$/.test(currentPhone.replace(/^0/, '0'))) {
      setError('شماره موبایل معتبر نیست')
      return
    }

    if (recipients.some((r) => r.phoneNumber === currentPhone)) {
      setError('این شماره قبلاً اضافه شده')
      return
    }

    setRecipients([...recipients, { phoneNumber: currentPhone, status: 'pending' }])
    setCurrentPhone('')
    setError('')
  }

  const handleRemoveRecipient = (phoneNumber: string) => {
    setRecipients(recipients.filter((r) => r.phoneNumber !== phoneNumber))
  }

  const handleSendSMS = async () => {
    if (!message.trim()) {
      setError('لطفاً متن پیام را وارد کنید')
      return
    }

    if (recipients.length === 0) {
      setError('لطفاً حداقل یک گیرنده اضافه کنید')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/v1/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone_numbers: recipients.map((r) => r.phoneNumber),
          message,
        }),
      })

      if (!response.ok) {
        throw new Error('ارسال پیام ناموفق بود')
      }

      setSuccess(`✅ ${recipients.length} پیام با موفقیت ارسال شد`)
      setMessage('')
      setRecipients([])
    } catch (err: any) {
      setError(err.message || 'خطا در ارسال پیام')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>📨 ارسال پیام جدید</h1>
      </div>

      <div style={styles.gridContainer}>
        {/* Left Column - Composer */}
        <div style={styles.leftColumn}>
          <Card title="نوشتن پیام">
            <div style={styles.composerArea}>
              <div style={styles.textareaContainer}>
                <textarea
                  style={styles.textarea}
                  placeholder="متن پیام را اینجا وارد کنید"
                  value={message}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_MESSAGE_LENGTH) {
                      setMessage(e.target.value)
                    }
                  }}
                />
                <div style={styles.charCounter}>
                  {message.length} / {MAX_MESSAGE_LENGTH}
                </div>
              </div>
            </div>
          </Card>

          {/* Recipients Input */}
          <Card title="افزودن گیرندگان" style={{ marginTop: '1.5rem' }}>
            <div style={styles.recipientInputArea}>
              <div style={styles.inputRow}>
                <Input
                  type="tel"
                  placeholder="09121234567"
                  value={currentPhone}
                  onChange={(e) => setCurrentPhone(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddRecipient()
                    }
                  }}
                />
                <Button
                  variant="primary"
                  onClick={handleAddRecipient}
                  style={{ marginTop: '0.25rem' }}
                >
                  ➕ افزودن
                </Button>
              </div>

              {error && <Alert type="danger" message={error} />}
              {success && <Alert type="success" message={success} />}
            </div>
          </Card>
        </div>

        {/* Right Column - Summary */}
        <div style={styles.rightColumn}>
          {/* Cost Summary */}
          <Card title="🧾 خلاصه">
            <div style={styles.summaryItem}>
              <span>تعداد پیام:</span>
              <strong>{recipients.length}</strong>
            </div>
            <div style={styles.summaryItem}>
              <span>هزینه هر پیام:</span>
              <strong>500 ریال</strong>
            </div>
            <div style={styles.summaryItemTotal}>
              <span>کل هزینه:</span>
              <strong>{estimatedCost.toLocaleString('fa-IR')} ریال</strong>
            </div>
          </Card>

          {/* Recipients List */}
          <Card title="📋 گیرندگان" style={{ marginTop: '1.5rem' }}>
            <div style={styles.recipientsList}>
              {recipients.length === 0 ? (
                <p style={styles.emptyState}>هیچ گیرنده‌ای اضافه نشده</p>
              ) : (
                recipients.map((recipient, idx) => (
                  <div key={idx} style={styles.recipientItem}>
                    <div style={styles.recipientInfo}>
                      <span>{recipient.phoneNumber}</span>
                      <Badge
                        variant={
                          recipient.status === 'sent'
                            ? 'success'
                            : recipient.status === 'failed'
                              ? 'danger'
                              : 'warning'
                        }
                      >
                        {recipient.status === 'sent'
                          ? '✓ ارسال شد'
                          : recipient.status === 'failed'
                            ? '✗ ناموفق'
                            : '⏳ در انتظار'}
                      </Badge>
                    </div>
                    <button
                      style={styles.removeButton}
                      onClick={() => handleRemoveRecipient(recipient.phoneNumber)}
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Send Button */}
          <Button
            variant="primary"
            size="lg"
            block
            onClick={handleSendSMS}
            disabled={loading || recipients.length === 0 || !message.trim()}
            style={{ marginTop: '1.5rem' }}
          >
            {loading ? '📨 در حال ارسال...' : '📤 ارسال پیام‌ها'}
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
    maxWidth: '1400px',
    margin: '0 auto 2rem',
  } as React.CSSProperties,
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '1.5rem',
    maxWidth: '1400px',
    margin: '0 auto',
  } as React.CSSProperties,
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  } as React.CSSProperties,
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
  } as React.CSSProperties,
  composerArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  } as React.CSSProperties,
  textareaContainer: {
    position: 'relative',
  } as React.CSSProperties,
  textarea: {
    width: '100%',
    minHeight: '200px',
    padding: '1rem',
    border: '2px solid #e5e7eb',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    fontFamily: 'inherit',
    direction: 'rtl',
    resize: 'vertical',
  } as React.CSSProperties,
  charCounter: {
    textAlign: 'left',
    fontSize: '0.875rem',
    color: '#6b7280',
    marginTop: '0.5rem',
  } as React.CSSProperties,
  recipientInputArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  } as React.CSSProperties,
  inputRow: {
    display: 'flex',
    gap: '0.75rem',
  } as React.CSSProperties,
  summaryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.75rem 0',
    borderBottom: '1px solid #e5e7eb',
  } as React.CSSProperties,
  summaryItemTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '1rem 0',
    borderTop: '2px solid #667eea',
    marginTop: '0.5rem',
    fontSize: '1.125rem',
    fontWeight: 'bold',
  } as React.CSSProperties,
  recipientsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    maxHeight: '400px',
    overflowY: 'auto',
  } as React.CSSProperties,
  recipientItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    background: '#f9fafb',
    borderRadius: '0.5rem',
    border: '1px solid #e5e7eb',
  } as React.CSSProperties,
  recipientInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flex: 1,
  } as React.CSSProperties,
  removeButton: {
    background: '#fee2e2',
    border: 'none',
    color: '#dc2626',
    width: '2rem',
    height: '2rem',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    fontSize: '1.25rem',
    transition: 'all 0.2s',
  } as React.CSSProperties,
  emptyState: {
    textAlign: 'center',
    padding: '2rem',
    color: '#9ca3af',
  } as React.CSSProperties,
}

export default SendSMSPage
