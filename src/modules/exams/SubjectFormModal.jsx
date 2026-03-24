/**
 * SubjectFormModal.jsx
 * Add / remove subjects on an exam
 */

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  addExamSubject,
  deleteExamSubject,
  selectExamSubjects,
  selectExamLoading,
  selectExamErrors,
} from './exam.slice';
import { styles } from './examConstants';

export const SubjectFormModal = ({ exam, onClose }) => {
  const dispatch = useDispatch();
  const loading  = useSelector(selectExamLoading);
  const errors   = useSelector(selectExamErrors);
  const subjects = useSelector(selectExamSubjects);

  const [form, setForm]       = useState({ subject_name: '', max_marks: 100 });
  const [formError, setFormError] = useState('');

  const handleAdd = () => {
    if (!form.subject_name.trim()) { setFormError('Subject name is required'); return; }
    if (!form.max_marks || Number(form.max_marks) < 1) { setFormError('Max marks must be at least 1'); return; }
    setFormError('');
    dispatch(addExamSubject({ examId: exam.id, data: { ...form, max_marks: Number(form.max_marks) } }));
    setForm({ subject_name: '', max_marks: 100 });
  };

  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.modal, maxWidth: 540, maxHeight: '85vh', overflowY: 'auto' }}>

        <div style={{ ...styles.modalHeader, position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#111827' }}>Manage Subjects</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{exam.name}</div>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        <div style={{ padding: '22px 26px' }}>

          {errors.subjects && (
            <div style={{ ...styles.errorBox, marginBottom: 16 }}><span>⚠️</span> {errors.subjects}</div>
          )}

          {/* Add row */}
          <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 16, marginBottom: 20, border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
              Add Subject
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px auto', gap: 10, alignItems: 'end' }}>
              <div>
                <label style={{ ...styles.label, marginBottom: 4 }}>Subject Name</label>
                <input
                  style={styles.input}
                  placeholder="e.g. Mathematics"
                  value={form.subject_name}
                  onChange={e => { setForm(f => ({ ...f, subject_name: e.target.value })); setFormError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                />
              </div>
              <div>
                <label style={{ ...styles.label, marginBottom: 4 }}>Max Marks</label>
                <input
                  style={styles.input}
                  type="number"
                  min={1}
                  value={form.max_marks}
                  onChange={e => { setForm(f => ({ ...f, max_marks: e.target.value })); setFormError(''); }}
                />
              </div>
              <button
                onClick={handleAdd}
                disabled={loading.subjects}
                style={{ ...styles.btnPrimary(loading.subjects), padding: '10px 16px', whiteSpace: 'nowrap' }}
              >
                + Add
              </button>
            </div>
            {formError && <div style={{ fontSize: 12, color: '#DC2626', marginTop: 8 }}>⚠ {formError}</div>}
          </div>

          {/* Subject list */}
          {loading.subjects ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#9CA3AF' }}>Loading…</div>
          ) : subjects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#9CA3AF', fontSize: 14 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📚</div>
              No subjects added yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {subjects.map((s, i) => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#fff', borderRadius: 8, border: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#2563EB' }}>
                      {i + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#111827', fontSize: 14 }}>{s.subject_name}</div>
                      <div style={{ fontSize: 12, color: '#9CA3AF' }}>Max marks: {s.max_marks}</div>
                    </div>
                  </div>
                  {exam.status === 'DRAFT' && (
                    <button
                      onClick={() => dispatch(deleteExamSubject({ examId: exam.id, subjectId: s.id }))}
                      style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.modalFooter}>
          <button onClick={onClose} style={styles.btnPrimary(false)}>Done</button>
        </div>
      </div>
    </div>
  );
};