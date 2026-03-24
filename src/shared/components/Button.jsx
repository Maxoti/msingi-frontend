/**
 * src/shared/components/Button.jsx
 * Reusable button used across the app
 *
 * Props:
 *   variant   — 'primary' (default) | 'outline' | 'danger' | 'ghost'
 *   size      — 'sm' | 'md' (default) | 'lg'
 *   disabled  — bool
 *   loading   — bool (shows spinner + disables)
 *   onClick   — fn
 *   type      — 'button' (default) | 'submit'
 *   full      — bool (width: 100%)
 *   children  — button label / content
 */

export default function Button({
  variant  = 'primary',
  size     = 'md',
  disabled = false,
  loading  = false,
  onClick,
  type     = 'button',
  full     = false,
  children,
  style: extraStyle,
}) {
  const isDisabled = disabled || loading

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      style={{
        ...base,
        ...variants[variant],
        ...sizes[size],
        ...(full ? { width: '100%' } : {}),
        ...(isDisabled ? disabledStyle : {}),
        ...extraStyle,
      }}
    >
      {loading && <Spinner variant={variant} />}
      {children}
    </button>
  )
}

function Spinner({ variant }) {
  const color = variant === 'outline' || variant === 'ghost' ? '#6c63ff' : '#fff'
  return (
    <span style={{
      display: 'inline-block',
      width: 14, height: 14,
      border: `2px solid ${color}33`,
      borderTop: `2px solid ${color}`,
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      marginRight: 8,
      flexShrink: 0,
    }} />
  )
}

// ── Base ─────────────────────────────────────────────────────
const base = {
  display:        'inline-flex',
  alignItems:     'center',
  justifyContent: 'center',
  gap:            6,
  border:         'none',
  borderRadius:   '8px',
  cursor:         'pointer',
  fontWeight:     600,
  transition:     'all 0.18s ease',
  whiteSpace:     'nowrap',
  outline:        'none',
  fontFamily:     'inherit',
}

// ── Variants ─────────────────────────────────────────────────
const variants = {
  primary: {
    background: 'linear-gradient(135deg, #6c63ff, #48cae4)',
    color:      '#fff',
    boxShadow:  '0 4px 14px rgba(108,99,255,0.25)',
  },
  outline: {
    background:  '#fff',
    color:       '#6c63ff',
    border:      '1.5px solid #6c63ff',
    boxShadow:   'none',
  },
  danger: {
    background: 'linear-gradient(135deg, #ff6b6b, #ee0979)',
    color:      '#fff',
    boxShadow:  '0 4px 14px rgba(238,9,121,0.2)',
  },
  ghost: {
    background: 'transparent',
    color:      '#666',
    border:     '1.5px solid #e0e0e0',
    boxShadow:  'none',
  },
}

// ── Sizes ────────────────────────────────────────────────────
const sizes = {
  sm: { padding: '6px 14px',  fontSize: 12 },
  md: { padding: '10px 20px', fontSize: 14 },
  lg: { padding: '13px 28px', fontSize: 15 },
}

// ── Disabled ─────────────────────────────────────────────────
const disabledStyle = {
  opacity: 0.55,
  cursor:  'not-allowed',
  boxShadow: 'none',
}