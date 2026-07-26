import React from 'react'
import { Button } from '@/components/UI'

interface NavLink {
  label: string
  path: string
  icon: string
}

const navLinks: NavLink[] = [
  { label: 'داشبورد', path: '/dashboard', icon: '📊' },
  { label: 'ارسال پیام', path: '/send-sms', icon: '📨' },
  { label: 'کیف پول', path: '/wallet', icon: '💰' },
  { label: 'تاریخچه', path: '/history', icon: '📋' },
  { label: 'تنظیمات', path: '/settings', icon: '⚙️' },
]

const Navbar: React.FC<{ currentPath: string; onLogout: () => void }> = ({
  currentPath,
  onLogout,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  return (
    <nav style={styles.navbar}>
      <div style={styles.container}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>📱</span>
          <span style={styles.logoText}>پنل پیامک</span>
        </div>

        {/* Desktop Menu */}
        <div style={styles.desktopMenu}>
          {navLinks.map((link) => (
            <a
              key={link.path}
              href={link.path}
              style={{
                ...styles.navLink,
                ...(currentPath === link.path ? styles.navLinkActive : {}),
              }}
            >
              <span style={styles.navIcon}>{link.icon}</span>
              <span>{link.label}</span>
            </a>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <button
          style={styles.mobileMenuBtn}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          ☰
        </button>

        <button style={styles.logoutBtn} onClick={onLogout}>
          خروج
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div style={styles.mobileMenu}>
          {navLinks.map((link) => (
            <a
              key={link.path}
              href={link.path}
              style={{
                ...styles.mobileNavLink,
                ...(currentPath === link.path
                  ? styles.mobileNavLinkActive
                  : {}),
              }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span style={styles.navIcon}>{link.icon}</span>
              <span>{link.label}</span>
            </a>
          ))}
        </div>
      )}
    </nav>
  )
}

const styles = {
  navbar: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties,
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '1.25rem',
    fontWeight: 'bold',
    cursor: 'pointer',
  } as React.CSSProperties,
  logoIcon: {
    fontSize: '2rem',
  } as React.CSSProperties,
  logoText: {
    display: 'block',
  } as React.CSSProperties,
  desktopMenu: {
    display: 'flex',
    gap: '0.5rem',
    flex: 1,
    justifyContent: 'center',
    '@media (max-width: 768px)': {
      display: 'none',
    },
  } as React.CSSProperties,
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.25rem',
    color: 'rgba(255, 255, 255, 0.8)',
    textDecoration: 'none',
    borderRadius: '0.5rem',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  } as React.CSSProperties,
  navLinkActive: {
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    fontWeight: 'bold',
  } as React.CSSProperties,
  navIcon: {
    fontSize: '1.25rem',
  } as React.CSSProperties,
  mobileMenuBtn: {
    display: 'none',
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '1.5rem',
    cursor: 'pointer',
    '@media (max-width: 768px)': {
      display: 'block',
    },
  } as React.CSSProperties,
  logoutBtn: {
    padding: '0.5rem 1rem',
    background: 'rgba(255, 255, 255, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    color: 'white',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  } as React.CSSProperties,
  mobileMenu: {
    background: 'rgba(0, 0, 0, 0.1)',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  } as React.CSSProperties,
  mobileNavLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    color: 'rgba(255, 255, 255, 0.8)',
    textDecoration: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  mobileNavLinkActive: {
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    fontWeight: 'bold',
  } as React.CSSProperties,
}

export default Navbar
