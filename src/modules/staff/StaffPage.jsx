/**
 * src/modules/staff/StaffPage.jsx
 * Staff management — list, add, edit, deactivate
 */

import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllStaffThunk,
  createStaffThunk,
  updateStaffThunk,
  deactivateStaffThunk,
  clearSaveError,
  selectStaffList,
  selectStaffLoading,
  selectStaffSaving,
  selectSaveError,
  selectStaffError,
} from './staff.slice';
import Modal  from '../../shared/components/Modal';
import Button from '../../shared/components/Button';

/* ── Constants ─────────────────────────────────────────────── */

const DEPARTMENTS = ['Teaching', 'Administration', 'Support', 'Finance', 'IT', 'Other'];

const emptyForm = {
  firstName:      '',
  lastName:       '',
  phone:          '',
  email:          '',
  employeeNumber: '',
  position:       '',
  department:     '',
  hireDate:       '',
};

/* ── Responsive hook ───────────────────────────────────────── */

function useIsMobile(bp = 640) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < bp);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${bp - 1}px)`);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [bp]);
  return isMobile;
}

/* ── Component ─────────────────────────────────────────────── */

export default function StaffPage() {
  const dispatch  = useDispatch();
  const list      = useSelector(selectStaffList);
  const loading   = useSelector(selectStaffLoading);
  const saving    = useSelector(selectStaffSaving);
  const saveError = useSelector(selectSaveError);
  const error     = useSelector(selectStaffError);
  const isMobile  = useIsMobile();

  const [search,            setSearch]            = useState('');
  const [deptFilter,        setDeptFilter]        = useState('');
  const [activeFilter,      setActiveFilter]      = useState('active');
  const [showForm,          setShowForm]          = useState(false);
  const [editing,           setEditing]           = useState(null);
  const [form,              setForm]              = useState(emptyForm);
  const [localError,        setLocalError]        = useState('');
  const [confirmDeactivate, setConfirmDeactivate] = useState(null);

  useEffect(() => { dispatch(fetchAllStaffThunk()); }, [dispatch]);

  /* ── Filtered list ───────────────────────────────────────── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return list.filter(s => {
      const firstName = s.firstName || s.first_name || '';
      const lastName  = s.lastName  || s.last_name  || '';
      const isActive  = s.isActive !== false && s.is_active !== false;

      const matchSearch = !q ||
        `${firstName} ${lastName}`.toLowerCase().includes(q) ||
        (s.employeeNumber || s.employee_number || '').toLowerCase().includes(q) ||
        (s.email    || '').toLowerCase().includes(q) ||
        (s.phone    || '').includes(q) ||
        (s.position || '').toLowerCase().includes(q);

      const matchDept = !deptFilter || (s.department || '') === deptFilter;

      const matchActive =
        activeFilter === 'all'      ? true :
        activeFilter === 'active'   ? isActive :
        /* inactive */                !isActive;

      return matchSearch && matchDept && matchActive;
    });
  }, [list, search, deptFilter, activeFilter]);

  /* ── Form open / close ───────────────────────────────────── */
  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setLocalError('');
    dispatch(clearSaveError());
    setShowForm(true);
  };

  const openEdit = (staff) => {
    setEditing(staff);
    setForm({
      firstName:      staff.firstName      || staff.first_name      || '',
      lastName:       staff.lastName       || staff.last_name       || '',
      phone:          staff.phone          || '',
      email:          staff.email          || '',
      employeeNumber: staff.employeeNumber || staff.employee_number || '',
      position:       staff.position       || '',
      department:     staff.department     || '',
      hireDate:       (staff.hireDate || staff.hire_date || '').split('T')[0] || '',
    });
    setLocalError('');
    dispatch(clearSaveError());
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditing(null); };

  /* ── Field setter ────────────────────────────────────────── */
  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setLocalError('');
  };

  /* ── Validation ──────────────────────────────────────────── */
  const validate = () => {
    const missing = [];
    if (!form.firstName) missing.push('First Name');
    if (!form.lastName)  missing.push('Last Name');
    if (!form.email)     missing.push('Email');
    return missing;
  };

  /* ── Submit ──────────────────────────────────────────────── */
  const handleSubmit = async () => {
    const errors = validate();
    if (errors.length > 0) { setLocalError(`Required: ${errors.join(', ')}`); return; }
    setLocalError('');

    const action = isEdit
      ? await dispatch(updateStaffThunk({ id: editing.id, data: form }))
      : await dispatch(createStaffThunk(form));

    if (action.meta.requestStatus === 'fulfilled') closeForm();
    dispatch(fetchAllStaffThunk());
    closeForm();
  };

  /* ── Deactivate ──────────────────────────────────────────── */
  const handleDeactivate = async (staff) => {
    await dispatch(deactivateStaffThunk(staff.id));
    setConfirmDeactivate(null);
  };

  const isEdit        = Boolean(editing);
  const displayError  = localError || saveError;
  const activeCount   = list.filter(s => s.isActive !== false && s.is_active !== false).length;
  const inactiveCount = list.length - activeCount;

  const r = responsive(isMobile);

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div style={r.page}>

      {/* ── Header ── */}
      <div style={r.header}>
        <div style={r.headerText}>
          <h1 style={s.title}>Staff</h1>
          <p style={s.subtitle}>{activeCount} active · {inactiveCount} inactive</p>
        </div>
        <div style={r.headerAction}>
          <Button style={{ width: '100%' }} onClick={openAdd}>+ Add Staff</Button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div style={r.filters}>
        <input
          style={r.searchInput}
          placeholder="Search name, email, employee no, position..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={r.filterControls}>
          <select style={r.select} value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
            <option value="">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <div style={r.segmented}>
            {[['all','All'], ['active','Active'], ['inactive','Inactive']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setActiveFilter(val)}
                style={{ ...r.segment, ...(activeFilter === val ? s.segmentActive : {}) }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <div style={s.errorBanner}>⚠️ {error}</div>}

      {loading && <div style={s.empty}>Loading staff...</div>}

      {!loading && filtered.length === 0 && (
        <div style={s.empty}>
          {search || deptFilter || activeFilter !== 'active'
            ? 'No staff match your filters.'
            : 'No staff added yet. Click "+ Add Staff" to get started.'}
        </div>
      )}

      {/* ── Mobile: Card list ── */}
      {!loading && filtered.length > 0 && isMobile && (
        <div style={s.cardList}>
          {filtered.map(staff => {
            const firstName = staff.firstName || staff.first_name || '';
            const lastName  = staff.lastName  || staff.last_name  || '';
            const initials  = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || '?';
            const isActive  = staff.isActive !== false && staff.is_active !== false;

            return (
              <div key={staff.id} style={s.staffCard}>
                <div style={s.cardHeader}>
                  <div style={{ ...s.avatar, ...(isActive ? {} : s.avatarInactive) }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.cardName}>{firstName} {lastName}</div>
                    {staff.role && <div style={s.roleTag}>{staff.role}</div>}
                  </div>
                  <span style={{ ...s.pill, ...(isActive ? s.pillActive : s.pillInactive) }}>
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div style={s.cardBody}>
                  {[
                    ['Employee No', staff.employeeNumber || staff.employee_number || '—'],
                    ['Position',    staff.position   || '—'],
                    ['Department',  staff.department || '—'],
                    ['Phone',       staff.phone      || '—'],
                    ['Email',       staff.email      || '—'],
                  ].map(([label, value]) => (
                    <div key={label} style={s.cardRow}>
                      <span style={s.cardLabel}>{label}</span>
                      <span style={s.cardValue}>{value}</span>
                    </div>
                  ))}
                </div>

                <div style={s.cardActions}>
                  <button style={{ ...s.editBtn, flex: 1 }} onClick={() => openEdit(staff)}>Edit</button>
                  {isActive && (
                    <button style={{ ...s.deactivateBtn, flex: 1 }} onClick={() => setConfirmDeactivate(staff)}>
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Desktop: Table ── */}
      {!loading && filtered.length > 0 && !isMobile && (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                {['Name','Employee No','Position','Department','Phone','Email','Status',''].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(staff => {
                const firstName = staff.firstName || staff.first_name || '';
                const lastName  = staff.lastName  || staff.last_name  || '';
                const initials  = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || '?';
                const isActive  = staff.isActive !== false && staff.is_active !== false;

                return (
                  <tr key={staff.id} style={s.tr}>
                    <td style={s.td}>
                      <div style={s.nameCell}>
                        <div style={{ ...s.avatar, ...(isActive ? {} : s.avatarInactive) }}>
                          {initials}
                        </div>
                        <div>
                          <div style={s.nameText}>{firstName} {lastName}</div>
                          {staff.role && <div style={s.roleTag}>{staff.role}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={s.td}><span style={s.mono}>{staff.employeeNumber || staff.employee_number || '—'}</span></td>
                    <td style={s.td}>{staff.position   || '—'}</td>
                    <td style={s.td}>{staff.department  || '—'}</td>
                    <td style={s.td}>{staff.phone       || '—'}</td>
                    <td style={s.td}>{staff.email       || '—'}</td>
                    <td style={s.td}>
                      <span style={{ ...s.pill, ...(isActive ? s.pillActive : s.pillInactive) }}>
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={s.td}>
                      <div style={s.actions}>
                        <button style={s.editBtn} onClick={() => openEdit(staff)}>Edit</button>
                        {isActive && (
                          <button style={s.deactivateBtn} onClick={() => setConfirmDeactivate(staff)}>
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {showForm && (
        <Modal onClose={closeForm} title={isEdit ? 'Edit Staff Member' : 'Add Staff Member'}>
          <div style={s.modalBody}>
            {displayError && <div style={s.formError}>{displayError}</div>}

            <SectionLabel>Personal Details</SectionLabel>
            <div style={r.grid2}>
              <Field label="First Name *" value={form.firstName} onChange={set('firstName')} />
              <Field label="Last Name *"  value={form.lastName}  onChange={set('lastName')} />
              <Field label="Phone"        value={form.phone}     onChange={set('phone')}  type="tel" />
              <Field label="Email *"      value={form.email}     onChange={set('email')}  type="email" />
            </div>

            <div style={s.divider} />

            <SectionLabel>Employment Details</SectionLabel>
            <div style={r.grid2}>
              <Field label="Employee Number" value={form.employeeNumber} onChange={set('employeeNumber')} />
              <Field label="Position"        value={form.position}       onChange={set('position')} />
              <div>
                <label style={s.label}>Department</label>
                <select style={s.input} value={form.department} onChange={set('department')}>
                  <option value="">Select department...</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <Field label="Hire Date" value={form.hireDate} onChange={set('hireDate')} type="date" />
            </div>
          </div>

          <div style={s.modalFooter}>
            <Button variant="outline" onClick={closeForm}>Cancel</Button>
            <Button onClick={handleSubmit} loading={saving} disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Staff Member'}
            </Button>
          </div>
        </Modal>
      )}

      {/* ── Confirm Deactivate Modal ── */}
      {confirmDeactivate && (
        <Modal onClose={() => setConfirmDeactivate(null)} title="Deactivate Staff Member">
          <div style={{ padding: '20px 24px' }}>
            <p style={s.confirmText}>
              Are you sure you want to deactivate{' '}
              <strong>
                {confirmDeactivate.firstName || confirmDeactivate.first_name}{' '}
                {confirmDeactivate.lastName  || confirmDeactivate.last_name}
              </strong>?
              Their account will be disabled and they will no longer be able to log in.
            </p>
            <div style={s.confirmActions}>
              <Button variant="outline" onClick={() => setConfirmDeactivate(null)}>Cancel</Button>
              <Button
                onClick={() => handleDeactivate(confirmDeactivate)}
                style={{ background: '#e53935', borderColor: '#e53935' }}
              >
                Yes, Deactivate
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */

function SectionLabel({ children }) {
  return <p style={sectionLabelStyle}>{children}</p>;
}
const sectionLabelStyle = {
  fontSize: 11, fontWeight: 700, color: '#6c63ff',
  textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px',
};

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label style={s.label}>{label}</label>
      <input type={type} value={value} onChange={onChange} style={s.input} />
    </div>
  );
}

/* ── Static styles (desktop baseline — untouched by responsive()) ── */
const s = {
  page:     { padding: '24px 28px', fontFamily: 'inherit' },
  title:    { fontSize: 24, fontWeight: 700, color: '#1a1a2e', margin: 0 },
  subtitle: { fontSize: 13, color: '#888', margin: '4px 0 0' },

  segmentActive: { background: '#6c63ff', color: '#fff', fontWeight: 600 },

  errorBanner: { background: '#fff0f0', border: '1px solid #ffcdd2', borderRadius: 8, padding: '10px 14px', color: '#c0392b', fontSize: 13, marginBottom: 16 },
  empty:       { textAlign: 'center', padding: '60px 24px', color: '#aaa', fontSize: 14 },

  tableWrap: { overflowX: 'auto', borderRadius: 12, border: '1px solid #f0f0f0' },
  table:     { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th:        { padding: '11px 14px', textAlign: 'left', fontWeight: 700, fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#fafafa', borderBottom: '1px solid #f0f0f0', whiteSpace: 'nowrap' },
  tr:        { borderBottom: '1px solid #f8f8f8' },
  td:        { padding: '12px 14px', color: '#333', verticalAlign: 'middle' },

  nameCell:      { display: 'flex', alignItems: 'center', gap: 10 },
  avatar:        { width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #6c63ff, #48cae4)', color: '#fff', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  avatarInactive:{ background: 'linear-gradient(135deg, #bbb, #ddd)' },
  nameText:      { fontWeight: 600, color: '#1a1a2e', fontSize: 13 },
  roleTag:       { fontSize: 10, color: '#888', marginTop: 1 },
  mono:          { fontFamily: 'monospace', fontSize: 12, color: '#666' },

  pill:         { padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600 },
  pillActive:   { background: '#e8f5e9', color: '#2e7d32' },
  pillInactive: { background: '#f5f5f5', color: '#999' },

  actions:       { display: 'flex', gap: 6 },
  editBtn:       { padding: '5px 12px', borderRadius: 6, border: '1px solid #e0e0e0', background: '#fff', color: '#6c63ff', cursor: 'pointer', fontSize: 12, fontWeight: 600 },
  deactivateBtn: { padding: '5px 12px', borderRadius: 6, border: '1px solid #ffcdd2', background: '#fff', color: '#e53935', cursor: 'pointer', fontSize: 12, fontWeight: 600 },

  // Mobile cards
  cardList:   { display: 'flex', flexDirection: 'column', gap: 12 },
  staffCard:  { background: '#fff', borderRadius: 12, border: '1px solid #ebebeb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid #f5f5f5' },
  cardName:   { fontWeight: 700, fontSize: 15, color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  cardBody:   { padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 8 },
  cardRow:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  cardLabel:  { fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0, paddingTop: 1 },
  cardValue:  { fontSize: 13, color: '#374151', textAlign: 'right', wordBreak: 'break-all' },
  cardActions:{ display: 'flex', gap: 8, padding: '10px 16px', borderTop: '1px solid #f5f5f5', background: '#fafafa' },

  // Modal
  modalBody:      { padding: '20px 24px', overflowY: 'auto', maxHeight: '60vh' },
  modalFooter:    { display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #f0f0f0' },
  formError:      { background: '#fff0f0', border: '1px solid #ffcdd2', borderRadius: 8, padding: '10px 14px', color: '#c0392b', fontSize: 13, marginBottom: 16 },
  divider:        { borderTop: '1px solid #f0f0f0', margin: '18px 0' },
  label:          { display: 'block', fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' },
  input:          { width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1.5px solid #e8e8e8', borderRadius: 8, fontSize: 14, color: '#1a1a2e', outline: 'none' },
  confirmText:    { fontSize: 14, color: '#444', marginBottom: 20, lineHeight: 1.6 },
  confirmActions: { display: 'flex', justifyContent: 'flex-end', gap: 12 },
};

/* ── Responsive overrides — all viewport-driven changes in one place ── */
function responsive(isMobile) {
  return {
    page: { ...s.page, padding: isMobile ? '16px' : '24px 28px' },

    // Header stacks on mobile so "+ Add Staff" never overflows
    header: {
      display: 'flex',
      flexDirection:  isMobile ? 'column' : 'row',
      justifyContent: 'space-between',
      alignItems:     isMobile ? 'stretch' : 'flex-start',
      gap:            isMobile ? 12 : 0,
      marginBottom:   24,
    },
    headerText:   { marginBottom: isMobile ? 4 : 0 },
    headerAction: { width: isMobile ? '100%' : 'auto' },

    // Filters always column so search bar stays full-width
    filters: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 },

    searchInput: {
      width: '100%', boxSizing: 'border-box',
      padding: '10px 14px', border: '1.5px solid #e8e8e8',
      borderRadius: 8, fontSize: 14, outline: 'none', color: '#1a1a2e',
    },

    // Department + status — row on desktop, column on mobile
    filterControls: {
      display:        'flex',
      flexDirection:  isMobile ? 'column' : 'row',
      gap:            isMobile ? 10 : 12,
      alignItems:     isMobile ? 'stretch' : 'center',
    },

    select: {
      width:     isMobile ? '100%' : 'auto',
      minWidth:  isMobile ? 'unset' : 160,
      boxSizing: 'border-box',
      padding: '10px 14px', border: '1.5px solid #e8e8e8',
      borderRadius: 8, fontSize: 14, outline: 'none',
      color: '#1a1a2e', background: '#fff',
    },

    // Status tabs full-width on mobile with larger tap targets
    segmented: {
      display: 'flex', border: '1.5px solid #e8e8e8',
      borderRadius: 8, overflow: 'hidden',
      width: isMobile ? '100%' : 'fit-content',
    },

    segment: {
      flex:       isMobile ? 1 : 'none',
      padding:    isMobile ? '10px 0' : '8px 16px',
      background: '#fff', border: 'none', cursor: 'pointer',
      fontSize: 13, color: '#888', transition: 'all 0.15s', textAlign: 'center',
    },

    // Modal form grid — single column on mobile
    grid2: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
      gap: 16, marginBottom: 4,
    },
  };
}