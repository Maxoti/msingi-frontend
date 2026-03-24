/**
 * src/modules/students/components/StudentProfile.jsx
 * Full student profile view including parents management
 * Props:
 *   studentId — string
 *   onClose   — fn()
 *   onEdit    — fn(student)
 */

import { useState, useEffect } from 'react';
import Modal from '../../shared/components/Modal';
import Button from '../../shared/components/Button';
import { getStudentById, getParents, addParent, deleteParent } from './api';

const STATUS_COLORS = {
  ACTIVE:      { bg: '#e8f5e9', color: '#2e7d32' },
  TRANSFERRED: { bg: '#fff3e0', color: '#e65100' },
  COMPLETED:   { bg: '#e3f2fd', color: '#1565c0' },
  DROPPED:     { bg: '#fce4ec', color: '#c62828' },
};

const TABS = ['info', 'contact',  'parents'];

export default function StudentProfile({ studentId, onClose, onEdit }) {
  const [student, setStudent]     = useState(null);
  const [parents, setParents]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState('info');
  const [addingParent, setAddingParent] = useState(false);
  const [parentForm, setParentForm]     = useState({ name: '', phone: '', email: '', relationship: 'GUARDIAN', isPrimary: false });
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, pRes] = await Promise.all([
          getStudentById(studentId),
          getParents(studentId),
        ]);
        // Controller: { success: true, data: student }
        const studentData = sRes.data?.data || sRes.data?.student || sRes.data || sRes;
        setStudent(studentData);

        // Controller: { success: true, data: [...parents] }
        const parentsData = pRes.data?.data || pRes.data || pRes || [];
        setParents(Array.isArray(parentsData) ? parentsData : []);
      } catch (e) {
        setError(e.response?.data?.message || e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [studentId]);

  const handleAddParent = async () => {
    if (!parentForm.name || !parentForm.phone) return alert('Name and phone are required.');
    setSaving(true);
    try {
      const res = await addParent(studentId, parentForm);
      setParents(p => [...p, res.data || res]);
      setAddingParent(false);
      setParentForm({ name: '', phone: '', email: '', relationship: 'GUARDIAN', isPrimary: false });
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteParent = async (parentId) => {
    if (!window.confirm('Remove this parent/guardian?')) return;
    try {
      await deleteParent(studentId, parentId);
      setParents(p => p.filter(x => x.id !== parentId));
    } catch (e) {
      alert(e.response?.data?.message || e.message);
    }
  };

  const tabLabel = (t) => ({
    info:    ' Info',
    contact: ' Contact',
    medical: ' Medical',
    parents: ` Parents (${Array.isArray(parents) ? parents.length : 0})`,
  }[t]);

  if (loading) return (
    <Modal onClose={onClose} title="Student Profile">
      <div style={{ padding: '60px 24px', textAlign: 'center', color: '#aaa' }}>
        Loading profile...
      </div>
    </Modal>
  );

  if (error || !student) return (
    <Modal onClose={onClose} title="Student Profile">
      <div style={{ padding: 24, color: '#c0392b' }}> {error || 'Student not found'}</div>
    </Modal>
  );

  // Backend may return snake_case or camelCase field names
  const firstName  = student.firstName  || student.first_name  || '';
  const lastName   = student.lastName   || student.last_name   || '';
  const middleName = student.middleName || student.middle_name || '';
  const fullName   = [firstName, middleName, lastName].filter(Boolean).join(' ') || 'Unknown Student';
  const initials   = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || '?';
  const badge    = STATUS_COLORS[student.status] || STATUS_COLORS.ACTIVE;
  const admNo    = student.admissionNo   || student.admission_no   || '—';
  const className = student.className   || student.class_name      || '—';
  const gender   = student.gender       || '—';
  const resType  = student.residenceType || student.residence_type || '—';

  return (
    <Modal onClose={onClose} title=" ">
      {/* Profile Banner */}
      <div style={s.banner}>
        <div style={s.avatarLg}>{initials}</div>
        <h2 style={s.name}>{fullName}</h2>
        <div style={s.metaRow}>
          <span style={{ ...s.statusPill, background: badge.bg, color: badge.color }}>{student.status}</span>
          <span style={s.admTag}>#{admNo}</span>
        </div>
        <div style={s.statsRow}>
          {[['Class', className], ['Gender', gender], ['Type', resType]].map(([lbl, val]) => (
            <div key={lbl} style={s.statBlock}>
              <span style={s.statLabel}>{lbl}</span>
              <span style={s.statVal}>{val}</span>
            </div>
          ))}
        </div>
        <button onClick={() => onEdit(student)} style={s.editBtn}> Edit Student</button>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ ...s.tab, ...(tab === t ? s.activeTab : {}) }}>
            {tabLabel(t)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={s.content}>
        {tab === 'info' && (
          <>
            <Row label="Admission No"   val={student.admissionNo   || student.admission_no   || '—'} />
            <Row label="Date of Birth"  val={(student.dateOfBirth  || student.date_of_birth)  ? new Date(student.dateOfBirth  || student.date_of_birth).toLocaleDateString()  : '—'} />
            <Row label="Admission Date" val={(student.admissionDate || student.admission_date) ? new Date(student.admissionDate || student.admission_date).toLocaleDateString() : '—'} />

<Row label="Birth Cert No" val={student.birthCertificateNo || student.birthCertificateNumber || student.birth_certificate_number || '—'} />
            <Row label="UPI Number"     val={student.upiNumber     || student.upi_number      || '—'} />
            <Row label="Class"          val={student.className     || student.class_name      || '—'} />
            <Row label="Gender"         val={student.gender        || '—'} />
            <Row label="Residence"      val={student.residenceType || student.residence_type  || '—'} />
            <Row label="Special Needs"  val={(student.specialNeeds || student.special_needs)  ? ' Yes' : 'No'} />
          </>
        )}
{tab === 'contact' && (() => {
  const primary = parents.find(p => p.isPrimary || p.is_primary) || parents[0];
  return (
    <>
      {primary ? (
        <>
          <div style={{ background: '#f0f4ff', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: '#6c63ff', fontWeight: 600 }}>
             Contact via: {primary.name} ({primary.relationship})
          </div>
          <Row label="Phone (SMS)"    val={primary.phone || '—'} />
          <Row label="Email"          val={primary.email || '—'} />
        </>
      ) : (
        <p style={{ textAlign: 'center', color: '#aaa', margin: '24px 0', fontSize: 13 }}>
          No parent contact added yet. Go to the Parents tab to add one.
        </p>
      )}
      <div style={{ borderTop: '1px solid #f0f0f0', marginTop: 12, paddingTop: 12 }}>
        <Row label="County"     val={student.county    || '—'} />
        <Row label="Sub County" val={student.subCounty || student.sub_county || '—'} />
      </div>
    </>
  );
})()}
       
        {tab === 'parents' && (
          <div>
            {parents.length === 0 && !addingParent && (
              <p style={{ textAlign: 'center', color: '#aaa', margin: '24px 0' }}>No parents/guardians added yet.</p>
            )}
            {parents.map(p => (
              <div key={p.id} style={s.parentCard}>
                <div style={s.parentAvatar}>{p.name?.[0]?.toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
<div style={{ fontSize: 12, color: '#888' }}>{p.relationship}{(p.isPrimary || p.is_primary) ? ' Primary' : ''}</div>
                  <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>{p.phone}{p.email ? `  ${p.email}` : ''}</div>
                </div>
                <button onClick={() => handleDeleteParent(p.id)} style={s.deleteIcon} title="Remove"></button>
              </div>
            ))}

            {addingParent ? (
              <div style={s.addParentBox}>
                <p style={{ margin: '0 0 12px', fontWeight: 600, fontSize: 14 }}>New Parent / Guardian</p>
                <div style={s.grid2}>
                  {[['Name *', 'name'], ['Phone *', 'phone'], ['Email', 'email']].map(([lbl, key]) => (
                    <div key={key}>
                      <label style={s.smallLabel}>{lbl}</label>
                      <input style={s.smallInput} value={parentForm[key]}
                        onChange={e => setParentForm(f => ({ ...f, [key]: e.target.value }))} />
                    </div>
                  ))}
                  <div>
                    <label style={s.smallLabel}>Relationship</label>
                    <select style={s.smallInput} value={parentForm.relationship}
                      onChange={e => setParentForm(f => ({ ...f, relationship: e.target.value }))}>
                        // AFTER (only what DB allows)
{['MOTHER', 'FATHER', 'GUARDIAN'].map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                <label style={{ ...s.smallLabel, display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                  <input type="checkbox" checked={parentForm.isPrimary}
                    onChange={e => setParentForm(f => ({ ...f, isPrimary: e.target.checked }))} />
                  Primary Contact
                </label>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <Button variant="outline" onClick={() => setAddingParent(false)}>Cancel</Button>
                  <Button onClick={handleAddParent} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingParent(true)} style={s.addParentBtn}>+ Add Parent / Guardian</button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

function Row({ label, val }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
      <span style={{ fontSize: 13, color: '#888', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#1a1a2e' }}>{val}</span>
    </div>
  );
}

const s = {
  banner: {
    background: 'linear-gradient(135deg, #1a1a2e, #6c63ff)',
    padding: '28px 24px 20px', textAlign: 'center',
  },
  avatarLg: {
    width: 68, height: 68, borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)', color: '#fff',
    fontSize: 26, fontWeight: 700, margin: '0 auto 10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '3px solid rgba(255,255,255,0.3)',
  },
  name:    { color: '#fff', margin: '0 0 8px', fontSize: 18, fontWeight: 700 },
  metaRow: { display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 14 },
  statusPill: { padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 },
  admTag:  { background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '3px 10px', borderRadius: 999, fontSize: 12 },
  statsRow:{ display: 'flex', justifyContent: 'center', gap: 28, marginBottom: 14 },
  statBlock: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  statVal:   { color: '#fff', fontWeight: 600, fontSize: 13 },
  editBtn: {
    background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
    color: '#fff', padding: '7px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
  },
  tabs: { display: 'flex', borderBottom: '1px solid #f0f0f0', padding: '0 16px', gap: 4, overflowX: 'auto' },
  tab: {
    padding: '10px 12px', background: 'none', border: 'none',
    cursor: 'pointer', fontSize: 12, color: '#888', whiteSpace: 'nowrap',
    borderBottom: '2px solid transparent', transition: 'all 0.2s',
  },
  activeTab: { color: '#6c63ff', borderBottom: '2px solid #6c63ff', fontWeight: 600 },
  content: { padding: '16px 24px', overflowY: 'auto', maxHeight: '40vh' },
  parentCard: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: 12, border: '1px solid #f0f0f0', borderRadius: 10, marginBottom: 8,
  },
  parentAvatar: {
    width: 38, height: 38, borderRadius: '50%',
    background: 'linear-gradient(135deg, #6c63ff, #48cae4)',
    color: '#fff', fontWeight: 700, fontSize: 15,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  deleteIcon: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, opacity: 0.5 },
  addParentBox: { background: '#f9f9ff', borderRadius: 10, padding: 16, marginBottom: 10 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  smallLabel: { display: 'block', fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 4, textTransform: 'uppercase' },
  smallInput: { width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1.5px solid #e8e8e8', borderRadius: 6, fontSize: 13 },
  addParentBtn: {
    width: '100%', padding: 10, borderRadius: 8,
    border: '1.5px dashed #6c63ff', background: 'none',
    color: '#6c63ff', cursor: 'pointer', fontSize: 13, fontWeight: 600, marginTop: 4,
  },
};