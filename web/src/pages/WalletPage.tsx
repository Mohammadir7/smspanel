import React from 'react'
import { Card, Button, Badge, Spinner } from '@/components/UI'

interface Transaction {
  id: string
  amount: number
  type: 'charge' | 'debit'
  reason: string
  created_at: string
}

const WalletPage: React.FC = () => {
  const [balance, setBalance] = React.useState(0)
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [loading, setLoading] = React.useState(true)
  const [showChargeModal, setShowChargeModal] = React.useState(false)
  const [chargeAmount, setChargeAmount] = React.useState('')
  const [charging, setCharging] = React.useState(false)

  React.useEffect(() => {
    fetchWalletData()
  }, [])

  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/v1/wallet/balance', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      setBalance(data.balance)
      // fetch transactions
      const txResponse = await fetch('/api/v1/wallet/transactions', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const txData = await txResponse.json()
      setTransactions(txData.transactions || [])
    } catch (err) {
      console.error('خطا در بارگذاری', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChargeWallet = async () => {
    if (!chargeAmount || parseInt(chargeAmount) <= 0) {
      alert('مبلغ معتبر را وارد کنید')
      return
    }

    setCharging(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/v1/wallet/charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseInt(chargeAmount),
          method: 'zarinpal',
        }),
      })
      const data = await response.json()
      if (data.redirect_url) {
        window.location.href = data.redirect_url
      }
    } catch (err) {
      console.error('خطا در شارژ', err)
    } finally {
      setCharging(false)
    }
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <Spinner />
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>💰 کیف پول</h1>
      </div>

      <div style={styles.mainGrid}>
        {/* Balance Card */}
        <Card style={{ gridColumn: '1 / -1' }}>
          <div style={styles.balanceCard}>
            <div style={styles.balanceLeft}>
              <div style={styles.balanceLabel}>موجودی فعلی</div>
              <div style={styles.balanceAmount}>
                {balance.toLocaleString('fa-IR')} ریال
              </div>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setShowChargeModal(true)}
            >
              💳 شارژ کردن
            </Button>
          </div>
        </Card>

        {/* Quick Charge Options */}
        <Card title="⚡ شارژ سریع" style={{ gridColumn: '1 / -1' }}>
          <div style={styles.quickChargeGrid}>
            {[10000, 25000, 50000, 100000].map((amount) => (
              <button
                key={amount}
                style={styles.quickChargeBtn}
                onClick={() => {
                  setChargeAmount(amount.toString())
                  setShowChargeModal(true)
                }}
              >
                {amount.toLocaleString('fa-IR')} ریال
              </button>
            ))}
          </div>
        </Card>

        {/* Transactions */}
        <Card title="📋 تاریخچه تراکنش‌ها" style={{ gridColumn: '1 / -1' }}>
          <div style={styles.transactionsList}>
            {transactions.length === 0 ? (
              <p style={styles.emptyState}>هیچ تراکنشی وجود ندارد</p>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} style={styles.transactionItem}>
                  <div style={styles.txInfo}>
                    <div style={styles.txReason}>{tx.reason}</div>
                    <div style={styles.txDate}>
                      {new Date(tx.created_at).toLocaleDateString('fa-IR')}
                    </div>
                  </div>
                  <div style={styles.txAmount}>
                    <Badge variant={tx.type === 'charge' ? 'success' : 'danger'}>
                      {tx.type === 'charge' ? '+' : '-'}{' '}
                      {tx.amount.toLocaleString('fa-IR')} ریال
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Charge Modal */}
      {showChargeModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2>شارژ کیف پول</h2>
              <button
                style={styles.closeBtn}
                onClick={() => setShowChargeModal(false)}
              >
                ✕
              </button>
            </div>
            <div style={styles.modalBody}>
              <input
                type="number"
                placeholder="مبلغ (ریال)"
                value={chargeAmount}
                onChange={(e) => setChargeAmount(e.target.value)}
                style={styles.modalInput}
              />
              <div style={styles.modalActions}>
                <Button
                  variant="primary"
                  size="lg"
                  block
                  onClick={handleChargeWallet}
                  disabled={charging}
                >
                  {charging ? 'در حال پردازش...' : 'ادامه به درگاه'}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  block
                  onClick={() => setShowChargeModal(false)}
                >
                  لغو
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
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
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1.5rem',
    maxWidth: '1200px',
    margin: '0 auto',
  } as React.CSSProperties,
  balanceCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '2rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '1rem',
    color: 'white',
  } as React.CSSProperties,
  balanceLeft: {
    flex: 1,
  } as React.CSSProperties,
  balanceLabel: {
    fontSize: '0.875rem',
    opacity: 0.9,
    marginBottom: '0.5rem',
  } as React.CSSProperties,
  balanceAmount: {
    fontSize: '3rem',
    fontWeight: 'bold',
  } as React.CSSProperties,
  quickChargeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1rem',
  } as React.CSSProperties,
  quickChargeBtn: {
    padding: '1rem',
    border: '2px solid #e5e7eb',
    borderRadius: '0.5rem',
    background: 'white',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.3s',
  } as React.CSSProperties,
  transactionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    maxHeight: '500px',
    overflowY: 'auto',
  } as React.CSSProperties,
  transactionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    background: '#f9fafb',
    borderRadius: '0.5rem',
    border: '1px solid #e5e7eb',
  } as React.CSSProperties,
  txInfo: {
    flex: 1,
  } as React.CSSProperties,
  txReason: {
    fontWeight: '500',
    marginBottom: '0.25rem',
  } as React.CSSProperties,
  txDate: {
    fontSize: '0.875rem',
    color: '#6b7280',
  } as React.CSSProperties,
  txAmount: {
    textAlign: 'right',
  } as React.CSSProperties,
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  } as React.CSSProperties,
  modalContent: {
    background: 'white',
    borderRadius: '1rem',
    width: '90%',
    maxWidth: '400px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  } as React.CSSProperties,
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    borderBottom: '1px solid #e5e7eb',
  } as React.CSSProperties,
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  modalBody: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  } as React.CSSProperties,
  modalInput: {
    padding: '0.75rem 1rem',
    border: '2px solid #e5e7eb',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    direction: 'rtl',
  } as React.CSSProperties,
  modalActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  } as React.CSSProperties,
  emptyState: {
    textAlign: 'center',
    padding: '2rem',
    color: '#9ca3af',
  } as React.CSSProperties,
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
  } as React.CSSProperties,
}

export default WalletPage
