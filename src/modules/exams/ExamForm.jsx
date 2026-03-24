/**
 * ExamForm.jsx
 * Create / Edit exam modal — includes class selector so exam.class_id is always set
 */

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../config/api';
import {
  createExam,
  updateExam,
  selectExamLoading,
  selectExamErrors,
} from './exam.slice';
import { EXAM_TYPES, TYPE_META, styles } from './examConstants';
import { ValidationMsg } from './ExamPrimitives';

export const ExamForm = ({ exam, terms, termsLoading, termsError, onClose }) => {
  const dispatch  = useDispatch();
  const loading   = useSelector(selectExamLoading);
  const errors    = useSelector(selectExamErrors);
  const isEditing = !!exam;

  const [form, setForm] = useState({
    name:      exam?.name      || '',
    term_id:   exam?.term_id   || '',
    exam_type: exam?.exam_type || '',
    class_id:  exam?.class_id  || '',
  });

  const [touched, setTouched] = useState({
    name: false, term_id: false, exam_type: false, class_id: false,
  });

  const [classes,       setClasses]       = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [classesError,   setClassesError]   = useState('');

  const busy     = isEditing ? loading.update : loading.create;
  const apiError = isEditing ? errors.update  : errors.create;

  // Load classes on mount
  useEffect(() => {
    setClassesLoading(true);
    api.get('/classes')
      .then(res => {
        const data = res.data?.data ?? res.data ?? [];
        setClasses(Array.isArray(data) ? data : (data.classes ?? []));
      })
      .catch(() => setClassesError('Could not load classes.'))
      .finally(() => setClassesLoading(false));
  }, []);

  const validation = {
    name:      !form.name.trim() ? 'Exam name is required'      : '',
    term_id:   !form.term_id     ? 'Please select a term'       : '',
    exam_type: !form.exam_type   ? 'Please select an exam type' : '',
    class_id:  !form.class_id    ? 'Please select a class'      : '',
  };

  const isFormValid = Object.values(validation).every(v => !v);

  const handleSubmit = () => {
    setTouched({ name: true, term_id: true, exam_type: true, class_id: true });
    if (!isFormValid) return;
    const payload = {
      ...form,
      term_id:  Number(form.term_id),
      class_id: Number(form.class_id),
    };
    if (isEditing) {
      dispatch(updateExam({ id: exam.id, data: payload }));
    } else {
      dispatch(createExam(payload));
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.modal, maxWidth: 500 }}>

        {/* Header */}
        <div style={styles.modalHeader}>
          <div>
            <div style={{ fontSize: 19, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
              {isEditing ? 'Edit Exam' : 'New Exam'}
            </div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>CBC Assessment</div>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {apiError && (
            <div style={styles.errorBox}><span></span> {apiError}</div>
          )}

          {/* Exam Name */}
          <div>
            <label style={styles.label}>Exam Name <span style={{ color: '#DC2626' }}>*</span></label>
            <input
              style={{ ...styles.input, borderColor: touched.name && validation.name ? '#FCA5A5' : '#E5E7EB' }}
              placeholder="e.g. Term 1 Midterm 2026"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              onBlur={() => setTouched(t => ({ ...t, name: true }))}
            />
            {touched.name && <ValidationMsg msg={validation.name} />}
          </div>

          {/* Term */}
          <div>
            <label style={styles.label}>Term <span style={{ color: '#DC2626' }}>*</span></label>
            <select
              style={{
                ...styles.input,
                borderColor: touched.term_id && validation.term_id ? '#FCA5A5' : '#E5E7EB',
                color: form.term_id ? '#111827' : '#9CA3AF',
                opacity: termsLoading ? 0.6 : 1,
              }}
              value={form.term_id}
              onChange={e => setForm(f => ({ ...f, term_id: e.target.value }))}
              onBlur={() => setTouched(t => ({ ...t, term_id: true }))}
              disabled={termsLoading}
            >
              <option value="" disabled>{termsLoading ? 'Loading terms…' : '— Select Term —'}</option>
              {terms.map(t => (
                <option key={t.id} value={t.id}>{t.term_name || `Term ${t.term} (${t.year})`}</option>
              ))}
            </select>
            {termsError && !termsLoading && (
              <div style={{ fontSize: 12, color: '#DC2626', marginTop: 5 }}>
                ⚠ {termsError} — please create an Academic Term first.
              </div>
            )}
            {!termsError && terms.length === 0 && !termsLoading && (
              <div style={{ fontSize: 12, color: '#D97706', marginTop: 5 }}>
                ⚠ No terms found. Go to <strong>Academic Terms</strong> and create one first.
              </div>
            )}
            {touched.term_id && !termsError && <ValidationMsg msg={validation.term_id} />}
          </div>

          {/* Class */}
          <div>
            <label style={styles.label}>Class <span style={{ color: '#DC2626' }}>*</span></label>
            <select
              style={{
                ...styles.input,
                borderColor: touched.class_id && validation.class_id ? '#FCA5A5' : '#E5E7EB',
                color: form.class_id ? '#111827' : '#9CA3AF',
                opacity: classesLoading ? 0.6 : 1,
              }}
              value={form.class_id}
              onChange={e => setForm(f => ({ ...f, class_id: e.target.value }))}
              onBlur={() => setTouched(t => ({ ...t, class_id: true }))}
              disabled={classesLoading}
            >
              <option value="" disabled>
                {classesLoading ? 'Loading classes…' : '— Select Class —'}
              </option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name || c.class_name || `Class ${c.id}`}
                </option>
              ))}
            </select>
            {classesError && (
              <div style={{ fontSize: 12, color: '#DC2626', marginTop: 5 }}>⚠ {classesError}</div>
            )}
            {!classesError && classes.length === 0 && !classesLoading && (
              <div style={{ fontSize: 12, color: '#D97706', marginTop: 5 }}>
                ⚠ No classes found. Create a class first before adding an exam.
              </div>
            )}
            {touched.class_id && <ValidationMsg msg={validation.class_id} />}
          </div>

          {/* Exam Type */}
          <div>
            <label style={styles.label}>Exam Type <span style={{ color: '#DC2626' }}>*</span></label>
            <div style={{ display: 'flex', gap: 8 }}>
              {EXAM_TYPES.map(type => {
                const st       = TYPE_META[type];
                const selected = form.exam_type === type;
                return (
                  <button
                    key={type}
                    onClick={() => { setForm(f => ({ ...f, exam_type: type })); setTouched(t => ({ ...t, exam_type: true })); }}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 7, cursor: 'pointer',
                      fontSize: 13, fontWeight: 800, fontFamily: 'inherit', letterSpacing: '0.03em',
                      background: selected ? st.bg    : '#F9FAFB',
                      color:      selected ? st.color : '#9CA3AF',
                      border:     selected ? `2px solid ${st.border}` : '2px solid #E5E7EB',
                      transition: 'all 0.15s',
                    }}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
            {touched.exam_type && <ValidationMsg msg={validation.exam_type} />}
          </div>

        </div>

        {/* Footer */}
        <div style={styles.modalFooter}>
          <button onClick={onClose} style={styles.btnSecondary}>Cancel</button>
          <button onClick={handleSubmit} disabled={busy} style={styles.btnPrimary(busy)}>
            {busy ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Exam'}
          </button>
        </div>

      </div>
    </div>
  );
};