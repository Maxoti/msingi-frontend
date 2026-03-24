/**
 * ExamPrimitives.jsx
 * Shared small components: TypeBadge, StatusBadge, StatCard, ValidationMsg, ActionBtn
 */

import { TYPE_META, STATUS_META } from './examConstants';

export const TypeBadge = ({ type }) => {
  const st = TYPE_META[type] || { bg: '#F3F4F6', color: '#374151', border: '#E5E7EB', dot: '#9CA3AF' };
  return (
    <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 800, letterSpacing: '0.05em', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: st.dot, display: 'inline-block' }} />
      {type}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  const st = STATUS_META[status] || STATUS_META.DRAFT;
  return (
    <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: 5, padding: '2px 10px', fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: st.dot, display: 'inline-block' }} />
      {status}
    </span>
  );
};

export const StatCard = ({ label, value, gradient, icon }) => (
  <div style={{
    background:   gradient,
    borderRadius: 12,
    padding:      '20px 24px',
    flex:         1,
    minWidth:     140,
    position:     'relative',
    overflow:     'hidden',
    boxShadow:    '0 4px 14px rgba(0,0,0,.12)',
  }}>
    <div style={{
      position: 'absolute', right: -18, top: -18,
      width: 80, height: 80, borderRadius: '50%',
      background: 'rgba(255,255,255,.1)', pointerEvents: 'none',
    }}/>
    <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
    <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: '-0.03em' }}>
      {value ?? '—'}
    </div>
    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.75)', marginTop: 5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
      {label}
    </div>
  </div>
);

export const ValidationMsg = ({ msg }) => msg ? (
  <div style={{ fontSize: 12, color: '#DC2626', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
    <span></span> {msg}
  </div>
) : null;

export const ActionBtn = ({ onClick, disabled, children, variant = 'default' }) => {
  const variants = {
    default: { border: '1px solid #E5E7EB', background: '#fff',    color: '#374151' },
    purple:  { border: '1px solid #DDD6FE', background: '#FAF5FF', color: '#7C3AED' },
    blue:    { border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#2563EB' },
    green:   { border: '1px solid #86EFAC', background: '#F0FDF4', color: '#15803D' },
    yellow:  { border: '1px solid #FDE047', background: '#FEF9C3', color: '#A16207' },
    red:     { border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626' },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '5px 11px',
        borderRadius: 6,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 12,
        fontWeight: 700,
        fontFamily: 'inherit',
        whiteSpace: 'nowrap',
        opacity: disabled ? 0.6 : 1,
        transition: 'opacity 0.15s',
        ...variants[variant],
      }}
    >
      {children}
    </button>
  );
};