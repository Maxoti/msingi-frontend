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
  // Account (create only)
 
  // Personal
  firstName:      '',
  lastName:       '',
  phone:          '',
  email:          '',
  // Employment
  employeeNumber: '',
  position:       '',
  department:     '',
  hireDate:       '',
};

/* ── Component ─────────────────────────────────────────────── */

export default function StaffPage() {
  const dispatch  = useDispatch();
  const list      = useSelector(selectStaffList);
  const loading   = useSelector(selectStaffLoading);
  const saving    = useSelector(selectStaffSaving);
  const saveError = useSelector(selectSaveError);
  const error     = useSelector(selectStaffError);

  const [search,         setSearch]         = useState('');
  const [deptFilter,     setDeptFilter]     = useState('');
  const [activeFilter,   setActiveFilter]   = useState('active'); // 'all' | 'active' | 'inactive'
  const [showForm,       setShowForm]       = useState(false);
  const [editing,        setEditing]        = useState(null);
  const [form,           setForm]           = useState(emptyForm);
  const [localError,     setLocalError]     = useState('');
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
        (s.email  || '').toLowerCase().includes(q) ||
        (s.phone  || '').includes(q) ||
        (s.position   || '').toLowerCase().includes(q);

      const matchDept = !deptFilter || (s.department || '') === deptFilter;

      const matchActive =
        activeFilter === 'all'      ? true :
        activeFilter === 'active'   ? isActive :
        /* inactive */                !isActive;

      return matchSearch && matchDept && matchActive;
    });
  }, [list, search, deptFilter, activeFilter]);

  /* ── Form open/close ─────────────────────────────────────── */
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
    // ✅ removed username, password, role
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

  const isEdit         = Boolean(editing);
  const displayError   = localError || saveError;
  const activeCount    = list.filter(s => s.isActive !== false && s.is_active !== false).length;
  const inactiveCount  = list.length - activeCount;

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Staff</h1>
          <p style={s.subtitle}>
            {activeCount} active · {inactiveCount} inactive
          </p>
        </div>
        <Button onClick={openAdd}>+ Add Staff</Button>
      </div>

      {/* Filters */}
      <div style={s.filters}>
        <input
          style={s.searchInput}
          placeholder=" Search name, email, employee no, position..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select style={s.select} value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
          <option value="">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <div style={s.segmented}>
          {[['all','All'], ['active','Active'], ['inactive','Inactive']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setActiveFilter(val)}
              style={{ ...s.segment, ...(activeFilter === val ? s.segmentActive : {}) }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Global error */}
      {error && <div style={s.errorBanner}>⚠️ {error}</div>}

      {/* Table */}
      {loading ? (
        <div style={s.empty}>Loading staff...</div>
      ) : filtered.length === 0 ? (
        <div style={s.empty}>
          {search || deptFilter || activeFilter !== 'active'
            ? 'No staff match your filters.'
            : 'No staff added yet. Click "+ Add Staff" to get started.'}
        </div>
      ) : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>
                {['Name', 'Employee No', 'Position', 'Department', 'Phone', 'Email', 'Status', ''].map(h => (
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
                    <td style={s.td}>
                      <span style={s.mono}>
                        {staff.employeeNumber || staff.employee_number || '—'}
                      </span>
                    </td>
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
        <Modal onClose={closeForm} title={isEdit ? ' Edit Staff Member' : ' Add Staff Member'}>
          <div style={s.modalBody}>

            {displayError && <div style={s.formError}> {displayError}</div>}

           
            {/* Personal section */}
            <SectionLabel>Personal Details</SectionLabel>
            <div style={s.grid2}>
              <Field label="First Name *" value={form.firstName} onChange={set('firstName')} />
              <Field label="Last Name *"  value={form.lastName}  onChange={set('lastName')} />
              <Field label="Phone"        value={form.phone}     onChange={set('phone')}  type="tel" />
              <Field label="Email *"      value={form.email}     onChange={set('email')}  type="email" />
            </div>

            <div style={s.divider} />

            {/* Employment section */}
            <SectionLabel>Employment Details</SectionLabel>
            <div style={s.grid2}>
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
  textTransform: 'uppercase', letterSpacing: '0.08em',
  margin: '0 0 12px',
};

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label style={s.label}>{label}</label>
      <input type={type} value={value} onChange={onChange} style={s.input} />
    </div>
  );
}

/* ── Styles ─────────────────────────────────────────────────── */
const s = {
  page:      { padding: '24px 28px', fontFamily: 'inherit' },
  header:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title:     { fontSize: 24, fontWeight: 700, color: '#1a1a2e', margin: 0 },
  subtitle:  { fontSize: 13, color: '#888', margin: '4px 0 0' },

  filters:   { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' },
  searchInput: {
    flex: 1, minWidth: 200, padding: '10px 14px',
    border: '1.5px solid #e8e8e8', borderRadius: 8,
    fontSize: 14, outline: 'none', color: '#1a1a2e',
  },
  select: {
    padding: '10px 14px', border: '1.5px solid #e8e8e8',
    borderRadius: 8, fontSize: 14, outline: 'none',
    color: '#1a1a2e', background: '#fff', minWidth: 160,
  },
  segmented: { display: 'flex', border: '1.5px solid #e8e8e8', borderRadius: 8, overflow: 'hidden' },
  segment: {
    padding: '8px 16px', background: '#fff', border: 'none',
    cursor: 'pointer', fontSize: 13, color: '#888', transition: 'all 0.15s',
  },
  segmentActive: { background: '#6c63ff', color: '#fff', fontWeight: 600 },

  errorBanner: {
    background: '#fff0f0', border: '1px solid #ffcdd2', borderRadius: 8,
    padding: '10px 14px', color: '#c0392b', fontSize: 13, marginBottom: 16,
  },
  empty: { textAlign: 'center', padding: '60px 24px', color: '#aaa', fontSize: 14 },

  tableWrap: { overflowX: 'auto', borderRadius: 12, border: '1px solid #f0f0f0' },
  table:     { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: {
    padding: '11px 14px', textAlign: 'left', fontWeight: 700,
    fontSize: 11, color: '#888', textTransform: 'uppercase',
    letterSpacing: '0.05em', background: '#fafafa',
    borderBottom: '1px solid #f0f0f0', whiteSpace: 'nowrap',
  },
  tr:  { borderBottom: '1px solid #f8f8f8' },
  td:  { padding: '12px 14px', color: '#333', verticalAlign: 'middle' },

  nameCell:      { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: {
    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg, #6c63ff, #48cae4)',
    color: '#fff', fontWeight: 700, fontSize: 13,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  avatarInactive: { background: 'linear-gradient(135deg, #bbb, #ddd)' },
  nameText:  { fontWeight: 600, color: '#1a1a2e', fontSize: 13 },
  roleTag:   { fontSize: 10, color: '#888', marginTop: 1 },
  mono:      { fontFamily: 'monospace', fontSize: 12, color: '#666' },

  pill:        { padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600 },
  pillActive:  { background: '#e8f5e9', color: '#2e7d32' },
  pillInactive:{ background: '#f5f5f5', color: '#999' },

  actions:      { display: 'flex', gap: 6 },
  editBtn: {
    padding: '5px 12px', borderRadius: 6, border: '1px solid #e0e0e0',
    background: '#fff', color: '#6c63ff', cursor: 'pointer', fontSize: 12, fontWeight: 600,
  },
  deactivateBtn: {
    padding: '5px 12px', borderRadius: 6, border: '1px solid #ffcdd2',
    background: '#fff', color: '#e53935', cursor: 'pointer', fontSize: 12, fontWeight: 600,
  },

  // Modal
  modalBody:   { padding: '20px 24px', overflowY: 'auto', maxHeight: '60vh' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #f0f0f0' },
  formError:   { background: '#fff0f0', border: '1px solid #ffcdd2', borderRadius: 8, padding: '10px 14px', color: '#c0392b', fontSize: 13, marginBottom: 16 },
  grid2:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 4 },
  divider:     { borderTop: '1px solid #f0f0f0', margin: '18px 0' },
  label:       { display: 'block', fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' },
  input:       { width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1.5px solid #e8e8e8', borderRadius: 8, fontSize: 14, color: '#1a1a2e', outline: 'none' },
  passwordWrap:{ position: 'relative' },
  eyeBtn:      { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 },

  confirmText:    { fontSize: 14, color: '#444', marginBottom: 20, lineHeight: 1.6 },
  confirmActions: { display: 'flex', justifyContent: 'flex-end', gap: 12 },
};