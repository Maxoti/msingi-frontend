/**
 * src/shared/components/Modal.jsx
 * Reusable modal wrapper used across the app
 * Props:
 *   title    — string shown in header
 *   onClose  — fn() called on backdrop click or X button
 *   children — modal content
 *   width    — optional custom width (default 640px)
 */

import { useEffect } from 'react'

export default function Modal({ title, onClose, children, width = 640 }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div style={{ ...s.modal, maxWidth: width }}>

        {/* Header — only shown if title provided */}
        {title && (
          <div style={s.header}>
            <h2 style={s.title}>{title}</h2>
            <button onClick={onClose} style={s.closeBtn} aria-label="Close">✕</button>
          </div>
        )}

        {/* If no title, still show close button */}
        {!title && (
          <button onClick={onClose} style={s.floatingClose} aria-label="Close">✕</button>
        )}

        {/* Content */}
        <div style={s.content}>
          {children}
        </div>
      </div>
    </div>
  )
}

const s = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px',
  },
  modal: {
    background: '#fff',
    borderRadius: '16px',
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 24px 48px rgba(0, 0, 0, 0.2)',
    overflow: 'hidden',
    position: 'relative',
    animation: 'modalIn 0.2s ease',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    borderBottom: '1px solid #f0f0f0',
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    color: '#1a1a2e',
  },
  closeBtn: {
    background: '#f5f5f5',
    border: 'none',
    width: 32,
    height: 32,
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: 14,
    color: '#666',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s',
  },
  floatingClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    width: 32,
    height: 32,
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: 14,
    color: '#fff',
    zIndex: 10,
  },
  content: {
    overflowY: 'auto',
    flex: 1,
  },
}