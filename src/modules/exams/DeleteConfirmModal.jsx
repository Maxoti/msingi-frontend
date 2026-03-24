/**
 * DeleteConfirmModal.jsx
 * Confirm before deleting an exam
 */

import { useDispatch, useSelector } from 'react-redux';
import { deleteExam, selectExamLoading, selectExamErrors } from './exam.slice';
import { styles } from './examConstants';

export const DeleteConfirmModal = ({ exam, onClose }) => {
  const dispatch = useDispatch();
  const loading  = useSelector(selectExamLoading);
  const errors   = useSelector(selectExamErrors);

  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.modal, maxWidth: 420, padding: '30px 28px' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 18 }}>🗑️</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#111827', marginBottom: 8 }}>Delete Exam</div>
        <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.65, marginBottom: 22 }}>
          Are you sure you want to delete <strong style={{ color: '#111827' }}>{exam?.name}</strong>?
          This will also remove all associated subjects and results. This action cannot be undone.
        </div>
        {errors.delete && (
          <div style={{ ...styles.errorBox, marginBottom: 18 }}><span>⚠️</span> {errors.delete}</div>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ ...styles.btnSecondary, flex: 1 }}>Cancel</button>
          <button
            onClick={() => dispatch(deleteExam(exam.id))}
            disabled={loading.delete}
            style={{ flex: 1, padding: '9px', borderRadius: 7, border: 'none', background: loading.delete ? '#FCA5A5' : '#DC2626', color: '#fff', cursor: loading.delete ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit' }}
          >
            {loading.delete ? 'Deleting…' : 'Delete Exam'}
          </button>
        </div>
      </div>
    </div>
  );
};