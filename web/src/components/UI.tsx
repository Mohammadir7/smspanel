import React from 'react'
import '../styles/global.css'
import '../styles/components.css'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  block?: boolean
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  block = false,
  className = '',
  ...props
}) => {
  const baseClass = 'btn'
  const variantClass = `btn-${variant}`
  const sizeClass = size !== 'md' ? `btn-${size}` : ''
  const blockClass = block ? 'btn-block' : ''

  return (
    <button
      className={`${baseClass} ${variantClass} ${sizeClass} ${blockClass} ${className}`.trim()}
      {...props}
    />
  )
}

interface CardProps {
  title?: string
  children: React.ReactNode
  className?: string
}

export const Card: React.FC<CardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`card ${className}`.trim()}>
      {title && <div className="card-header">{title}</div>}
      {children}
    </div>
  )
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="input-group">
      {label && <label className="input-label">{label}</label>}
      <input
        className={`input-field ${error ? 'input-error' : ''} ${className}`.trim()}
        {...props}
      />
      {error && <span className="error-message">{error}</span>}
    </div>
  )
}

interface AlertProps {
  type?: 'success' | 'danger' | 'warning'
  message: string
}

export const Alert: React.FC<AlertProps> = ({ type = 'success', message }) => {
  return <div className={`alert alert-${type}`}>{message}</div>
}

interface BadgeProps {
  variant?: 'primary' | 'success' | 'danger' | 'warning'
  children: React.ReactNode
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'primary', children }) => {
  return <span className={`badge badge-${variant}`}>{children}</span>
}

export const Spinner: React.FC = () => {
  return <div className="spinner"></div>
}
