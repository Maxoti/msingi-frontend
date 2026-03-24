/**
 * src/modules/students/StudentForm.jsx
 * Add / Edit student form modal
 * - Basic, Parents, Medical, School tabs
 * - Parents saved to parent_contacts table via /api/v1/students/:id/parents
 */

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createStudentThunk,
  updateStudentThunk,
  clearSaveError,
  selectSaving,
  selectSaveError,
} from './students.slice';
import Modal  from '../../shared/components/Modal';
import Button from '../../shared/components/Button';
import api    from '../../config/api';

const GENDERS         = ['MALE', 'FEMALE'];
const STATUSES        = ['ACTIVE', 'TRANSFERRED', 'COMPLETED', 'DROPPED'];
const RESIDENCE_TYPES = ['DAY', 'BOARDING'];
const BLOOD_GROUPS    = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const RELATIONSHIPS   = ['MOTHER', 'FATHER', 'GUARDIAN'];

const TABS = [
  { id: 'basic',   label: ' Basic'   },
  { id: 'parents', label: ' Parents' },
  { id: 'school',  label: ' School'  },
];

const emptyForm = {
  firstName: '', lastName: '', middleName: '',
  gender: '', dateOfBirth: '', birthCertificateNo: '',
  admissionNo: '', autoGenerateAdmissionNo: true,
  admissionDate: new Date().toISOString().split('T')[0],
  classId: '',
  county: '', subCounty: '',
  bloodGroup: '', allergies: '', medicalConditions: '',
  specialNeeds: false, status: 'ACTIVE',
  residenceType: 'DAY', upiNumber: '',
};

const emptyParent = {
  _key: Date.now(),
  relationship: 'MOTHER',
  name: '',
  phone: '',
  email: '',
  idNumber: '',
  occupation: '',
  isPrimary: false,
};

export default function StudentForm({ student, classes: classesProp = [], onClose, onSaved }) {
  const dispatch  = useDispatch();
  const saving    = useSelector(selectSaving);
  const saveError = useSelector(selectSaveError);
  const isEdit    = Boolean(student);

  const [form, setForm]             = useState(emptyForm);
  const [tab, setTab]               = useState('basic');
  const [localError, setLocalError] = useState('');
  const [parents, setParents]       = useState([{ ...emptyParent, isPrimary: true }]);
  const [parentsLoading, setParentsLoading] = useState(false);

  // ── Classes ──────────────────────────────────────────────────
  const [classes, setClasses]               = useState(classesProp);
  const [classesLoading, setClassesLoading] = useState(false);

  useEffect(() => {
    if (classesProp.length > 0) { setClasses(classesProp); return; }
    const CLASS_ORDER = [
      'pp1','pp2','grade 1','grade 2','grade 3','grade 4',
      'grade 5','grade 6','grade 7','grade 8','grade 9',
    ];
    setClassesLoading(true);
    api.get('/classes')
      .then(res => {
        const list = res.data?.data || res.data?.classes || res.data || [];
        const cleaned = list
          .filter(c => {
            const n = (c.name||'').toLowerCase().trim();
            return !n.startsWith('empty class') && !n.startsWith('api test') &&
                   !n.startsWith('test class') && !/\d{8,}/.test(n);
          })
          .sort((a, b) => {
            const ai = CLASS_ORDER.indexOf((a.name||'').toLowerCase().trim());
            const bi = CLASS_ORDER.indexOf((b.name||'').toLowerCase().trim());
            if (ai === -1 && bi === -1) return (a.name||'').localeCompare(b.name||'');
            if (ai === -1) return 1; if (bi === -1) return -1;
            return ai - bi;
          });
        setClasses(cleaned);
      })
      .catch(err => console.error('Failed to load classes:', err))
      .finally(() => setClassesLoading(false));
  }, [classesProp]);

  // ── Populate form when editing ───────────────────────────────
  useEffect(() => {
    dispatch(clearSaveError());
    setLocalError('');
    if (student) {
      setForm({
        firstName:               student.firstName            || '',
        lastName:                student.lastName             || '',
        middleName:              student.middleName           || '',
        gender:                  student.gender               || '',
        dateOfBirth:             student.dateOfBirth?.split('T')[0]   || '',
        admissionNo:             student.admissionNo          || '',

birthCertificateNo: student.birthCertificateNo || student.birthCertificateNumber || '',
        autoGenerateAdmissionNo: false,
        admissionDate:           student.admissionDate?.split('T')[0] || '',
        classId:                 student.classId              || '',
        county:                  student.county               || '',
        subCounty:               student.subCounty            || '',
        bloodGroup:              student.bloodGroup           || '',
        allergies:               student.allergies            || '',
        medicalConditions:       student.medicalConditions    || '',
        specialNeeds:            student.specialNeeds         || false,
        status:                  student.status               || 'ACTIVE',
        residenceType:           student.residenceType        || 'DAY',
        upiNumber:               student.upiNumber            || '',
      });

      // Load existing parents when editing
      if (student.id) {
        setParentsLoading(true);
        api.get(`/students/${student.id}/parents`)
          .then(res => {
            const list = res.data?.data || res.data?.parents || res.data || [];
            if (list.length > 0) {
              setParents(list.map(p => ({
                _key:         p.id || Date.now() + Math.random(),
                id:           p.id,
                relationship: p.relationship || 'MOTHER',
                name:         p.name         || '',
                phone:        p.phone        || '',
                email:        p.email        || '',
                idNumber:     p.idNumber ?? p.id_number ?? '',
                occupation:   p.occupation   || '',
                isPrimary:    p.isPrimary    ?? p.is_primary ?? false,
              })));
            }
          })
          .catch(err => console.error('Failed to load parents:', err))
          .finally(() => setParentsLoading(false));
      }
    } else {
      setForm(emptyForm);
      setParents([{ ...emptyParent, _key: Date.now(), isPrimary: true }]);
    }
  }, [student, dispatch]);

  // ── Field setters ────────────────────────────────────────────
  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [field]: val }));
    setLocalError('');
  };

  // ── Parent helpers ────────────────────────────────────────────
  const setParentField = (key, field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    if (field === 'isPrimary' && val) {
      // Only one primary at a time
      setParents(prev => prev.map(p => ({ ...p, isPrimary: p._key === key })));
    } else {
      setParents(prev => prev.map(p => p._key !== key ? p : { ...p, [field]: val }));
    }
  };

  const addParent = () =>
    setParents(prev => [...prev, { ...emptyParent, _key: Date.now() }]);

  const removeParent = (key) => {
    setParents(prev => {
      const next = prev.filter(p => p._key !== key);
      if (next.length > 0 && !next.some(p => p.isPrimary)) next[0].isPrimary = true;
      return next;
    });
  };

  // ── Validation ───────────────────────────────────────────────
  const validate = () => {
    const missing = [];
    if (!form.firstName)    missing.push('First Name');
    if (!form.lastName)     missing.push('Last Name');
    if (!form.gender)       missing.push('Gender');
    if (!form.dateOfBirth)  missing.push('Date of Birth');
    if (!form.classId)      missing.push('Class');
    if (!form.admissionDate) missing.push('Admission Date');
    if (!isEdit && !form.autoGenerateAdmissionNo && !form.admissionNo)
      missing.push('Admission No');
    if (form.upiNumber && form.upiNumber.length !== 12)
      missing.push('UPI Number must be exactly 12 characters');
    parents.filter(p => p.name || p.phone).forEach(p => {
      if (!p.name)  missing.push(`Parent name (${p.relationship})`);
      if (!p.phone) missing.push(`Parent phone (${p.relationship})`);
    });
    return missing;
  };

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const errors = validate();
    if (errors.length > 0) {
      if (errors.some(e => e === 'Class' || e === 'Admission Date')) setTab('school');
      setLocalError(`Please fill in: ${errors.join(', ')}`);
      return;
    }

    setLocalError('');
    const action = isEdit
      ? await dispatch(updateStudentThunk({ id: student.id, data: form }))
      : await dispatch(createStudentThunk(form));

    if (action.meta.requestStatus !== 'fulfilled') return;

    const savedStudent = action.payload?.student || action.payload;
    const studentId    = savedStudent?.id || student?.id;

    // Save parents
    const filledParents = parents.filter(p => p.name && p.phone);
    try {
      await Promise.all(filledParents.map(p => {
        const payload = {
          relationship: p.relationship,
          name:         p.name,
          phone:        p.phone,
          email:        p.email       || null,
          idNumber:     p.idNumber    || null,
          occupation:   p.occupation  || null,
          isPrimary:    p.isPrimary,
        };
        return isEdit && p.id
          ? api.put(`/students/${studentId}/parents/${p.id}`, payload)
          : api.post(`/students/${studentId}/parents`, payload);
      }));
    } catch (err) {
      console.error('Failed to save parent contacts:', err);
      setLocalError('Student saved but parent contacts failed. Please edit the student to retry.');
      return;
    }

    onSaved?.(savedStudent);
    onClose();
  };

  const displayError = localError || saveError;

  return (
    <Modal onClose={onClose} title={isEdit ? '✏️ Edit Student' : '➕ Add New Student'}>

      <div style={s.tabs}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setLocalError(''); }}
            style={{ ...s.tab, ...(tab === t.id ? s.activeTab : {}) }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={s.body}>
        {displayError && <div style={s.errorBanner}>⚠️ {displayError}</div>}

        {/* ── BASIC ── */}
        {tab === 'basic' && (
          <div style={s.grid2}>
            <Field label="First Name *"    value={form.firstName}          onChange={set('firstName')} />
            <Field label="Last Name *"     value={form.lastName}           onChange={set('lastName')} />
            <Field label="Middle Name"     value={form.middleName}         onChange={set('middleName')} />
            <Select label="Gender *"       value={form.gender}             onChange={set('gender')} options={GENDERS} />
            <Field label="Date of Birth *" value={form.dateOfBirth}        onChange={set('dateOfBirth')} type="date" />
            <Field label="Birth Cert No"   value={form.birthCertificateNo} onChange={set('birthCertificateNo')} />
            <Field label="County"          value={form.county}             onChange={set('county')} />
            <Field label="Sub County"      value={form.subCounty}          onChange={set('subCounty')} />
          </div>
        )}

        {/* ── PARENTS ── */}
        {tab === 'parents' && (
          <div>
            {parentsLoading ? (
              <p style={s.hint}>Loading parent contacts...</p>
            ) : (
              <>
                {parents.map((p, idx) => (
                  <div key={p._key} style={s.parentCard}>
                    <div style={s.parentCardHeader}>
                      <span style={s.parentCardTitle}>
                        Parent / Guardian {idx + 1}
                        {p.isPrimary && <span style={s.primaryBadge}>★ Primary</span>}
                      </span>
                      {parents.length > 1 && (
                        <button onClick={() => removeParent(p._key)} style={s.removeBtn}>
                          ✕ Remove
                        </button>
                      )}
                    </div>
                    <div style={s.grid2}>
                      <Select label="Relationship *" value={p.relationship}
                        onChange={setParentField(p._key, 'relationship')} options={RELATIONSHIPS} />
                      <Field label="Full Name *" value={p.name}
                        onChange={setParentField(p._key, 'name')} />
                      <Field label="Phone * (used for SMS)" value={p.phone} type="tel"
                        onChange={setParentField(p._key, 'phone')} />
                      <Field label="Email" value={p.email} type="email"
                        onChange={setParentField(p._key, 'email')} />
                      <Field label="ID Number" value={p.idNumber}
                        onChange={setParentField(p._key, 'idNumber')} />
                      <Field label="Occupation" value={p.occupation}
                        onChange={setParentField(p._key, 'occupation')} />
                      <div style={{ gridColumn: '1/-1' }}>
                        <label style={s.checkboxRow}>
                          <input type="checkbox" checked={p.isPrimary}
                            onChange={setParentField(p._key, 'isPrimary')}
                            style={{ marginRight: 8 }} />
                          Primary contact (receives SMS notifications)
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={addParent} style={s.addParentBtn}>
                  + Add Another Parent / Guardian
                </button>
              </>
            )}
          </div>
        )}

       

        {/* ── SCHOOL ── */}
        {tab === 'school' && (
          <div style={s.grid2}>
            <div>
              <label style={s.label}>Class *</label>
              <select style={s.input} value={form.classId} onChange={set('classId')}>
                <option value="">{classesLoading ? 'Loading classes...' : 'Select class...'}</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {classes.length === 0 && !classesLoading &&
                <p style={s.hint}>⚠️ No classes found. Please create classes first.</p>}
            </div>
            <Field label="Admission Date *" value={form.admissionDate} onChange={set('admissionDate')} type="date" />
            <Select label="Status"          value={form.status}        onChange={set('status')}        options={STATUSES} />
            <Select label="Residence Type"  value={form.residenceType} onChange={set('residenceType')} options={RESIDENCE_TYPES} />
            <Field  label="UPI Number (12 chars)" value={form.upiNumber} onChange={set('upiNumber')} maxLength={12} />
            {!isEdit && (
              <div style={{ gridColumn: '1/-1' }}>
                <label style={s.checkboxRow}>
                  <input type="checkbox" checked={form.autoGenerateAdmissionNo}
                    onChange={set('autoGenerateAdmissionNo')} style={{ marginRight: 8 }} />
                  Auto-generate Admission Number
                </label>
                {!form.autoGenerateAdmissionNo &&
                  <Field label="Admission No *" value={form.admissionNo} onChange={set('admissionNo')} />}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={s.footer}>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} loading={saving} disabled={saving}>
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Student'}
        </Button>
      </div>
    </Modal>
  );
}

function Field({ label, value, onChange, type = 'text', full, maxLength }) {
  return (
    <div style={full ? { gridColumn: '1/-1' } : {}}>
      <label style={s.label}>{label}</label>
      <input type={type} value={value} onChange={onChange} maxLength={maxLength} style={s.input} />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label style={s.label}>{label}</label>
      <select value={value} onChange={onChange} style={s.input}>
        <option value="">Select...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

const s = {
  tabs:     { display: 'flex', borderBottom: '1px solid #f0f0f0', padding: '0 24px', gap: 4 },
  tab:      { padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#888', borderBottom: '2px solid transparent', transition: 'all 0.2s' },
  activeTab:{ color: '#6c63ff', borderBottom: '2px solid #6c63ff', fontWeight: 600 },
  body:     { padding: '20px 24px', overflowY: 'auto', maxHeight: '55vh' },
  grid2:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  label:    { display: 'block', fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' },
  input:    { width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1.5px solid #e8e8e8', borderRadius: 8, fontSize: 14, color: '#1a1a2e', outline: 'none' },
  checkboxRow: { display: 'flex', alignItems: 'center', fontSize: 14, color: '#333', cursor: 'pointer', marginBottom: 12 },
  errorBanner: { background: '#fff0f0', border: '1px solid #ffcdd2', borderRadius: 8, padding: '10px 14px', color: '#c0392b', fontSize: 13, marginBottom: 16 },
  hint:     { fontSize: 12, color: '#e65100', marginTop: 6 },
  footer:   { display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #f0f0f0' },
  parentCard:       { border: '1.5px solid #e8e8e8', borderRadius: 10, padding: 16, marginBottom: 16, background: '#fafafa' },
  parentCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  parentCardTitle:  { fontSize: 13, fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 8 },
  primaryBadge:     { background: '#e8f5e9', color: '#2e7d32', fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600 },
  removeBtn:        { background: 'none', border: '1px solid #ffcdd2', color: '#e53935', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 },
  addParentBtn:     { width: '100%', padding: '12px', border: '2px dashed #c5cae9', borderRadius: 10, background: 'none', color: '#6c63ff', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
};