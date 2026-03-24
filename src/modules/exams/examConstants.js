/**
 * examConstants.js
 * All constants, metadata, and shared style objects for the Exams module
 */

export const EXAM_TYPES = ['CAT', 'MIDTERM', 'ENDTERM'];
export const STATUSES   = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

export const TYPE_META = {
  CAT:     { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', dot: '#3B82F6' },
  MIDTERM: { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA', dot: '#F97316' },
  ENDTERM: { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0', dot: '#22C55E' },
};

export const STATUS_META = {
  DRAFT:     { bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB', dot: '#9CA3AF' },
  PUBLISHED: { bg: '#DCFCE7', color: '#15803D', border: '#86EFAC', dot: '#22C55E' },
  ARCHIVED:  { bg: '#FEF9C3', color: '#A16207', border: '#FDE047', dot: '#EAB308' },
};

export const GRADE_COLORS = {
  EE1: '#15803D', EE2: '#16A34A',
  ME1: '#2563EB', ME2: '#3B82F6',
  AE1: '#D97706', AE2: '#F59E0B',
  BE1: '#DC2626', BE2: '#EF4444',
};

export const styles = {
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 13px',
    borderRadius: 7,
    border: '1.5px solid #E5E7EB',
    fontSize: 14,
    color: '#111827',
    outline: 'none',
    background: '#FAFAFA',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
    color: '#374151',
    marginBottom: 5,
    display: 'block',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  errorBox: {
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: 7,
    padding: '10px 14px',
    fontSize: 13,
    color: '#B91C1C',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,23,42,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 16,
    backdropFilter: 'blur(2px)',
  },
  modal: {
    background: '#fff',
    borderRadius: 14,
    width: '100%',
    boxShadow: '0 25px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04)',
  },
  modalHeader: {
    padding: '22px 26px 18px',
    borderBottom: '1px solid #F3F4F6',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalFooter: {
    padding: '16px 26px',
    borderTop: '1px solid #F3F4F6',
    display: 'flex',
    gap: 10,
    justifyContent: 'flex-end',
  },
  closeBtn: {
    background: '#F3F4F6',
    border: 'none',
    borderRadius: 7,
    width: 34,
    height: 34,
    cursor: 'pointer',
    fontSize: 18,
    color: '#6B7280',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    flexShrink: 0,
  },
  btnSecondary: {
    padding: '9px 20px',
    borderRadius: 7,
    border: '1.5px solid #E5E7EB',
    background: '#fff',
    cursor: 'pointer',
    fontSize: 14,
    color: '#374151',
    fontWeight: 600,
    fontFamily: 'inherit',
    transition: 'background 0.15s',
  },
  btnPrimary: (disabled) => ({
    padding: '9px 24px',
    borderRadius: 7,
    border: 'none',
    background: disabled ? '#93C5FD' : '#2563EB',
    color: '#fff',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 14,
    fontWeight: 700,
    fontFamily: 'inherit',
    transition: 'background 0.15s, transform 0.1s',
    opacity: disabled ? 0.7 : 1,
  }),
};