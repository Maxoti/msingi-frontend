/**
 * ExamPage.jsx
 * Exam management — lean orchestrator that composes all sub-components
 */

import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ExamAnalyzer from '../artificial_Intelligence/components/ExamAnalyzer'
import api from '../../config/api';
import {
  fetchAllExams,
  fetchExamSubjects,
  publishExam,
  archiveExam,
  openCreateForm,
  openEditForm,
  closeForm,
  openDeleteConfirm,
  closeDeleteConfirm,
  openSubjectForm,
  closeSubjectForm,
  openResultsModal,
  closeResultsModal,
  setFilter,
  resetFilters,
  clearError,
  selectFilteredExams,
  selectSelectedExam,
  selectExamLoading,
  selectExamErrors,
  selectExamUI,
  selectExamFilters,
} from './exam.slice';

import { EXAM_TYPES, STATUSES, styles } from './examConstants';
import { TypeBadge, StatusBadge, StatCard, ActionBtn } from './ExamPrimitives';
import { ExamForm }           from './ExamForm';
import { SubjectFormModal }   from './SubjectFormModal';
import { ResultsModal }       from './ResultsModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';

const thStyle = {
  padding: '10px 16px',
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 700,
  color: '#9CA3AF',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  borderBottom: '1px solid #E5E7EB',
  whiteSpace: 'nowrap',
  background: '#F9FAFB',
};

export default function ExamPage() {
  const dispatch = useDispatch();

  const exams    = useSelector(selectFilteredExams);
  const loading  = useSelector(selectExamLoading);
  const errors   = useSelector(selectExamErrors);
  const ui       = useSelector(selectExamUI);
  const filters  = useSelector(selectExamFilters);
  const selected = useSelector(selectSelectedExam);

  const [terms,        setTerms]        = useState([]);
  const [termsLoading, setTermsLoading] = useState(false);
  const [termsError,   setTermsError]   = useState('');

  useEffect(() => {
    dispatch(fetchAllExams());

    setTermsLoading(true);
    setTermsError('');
    api.get('/terms')
      .then(res => {
        const data = res.data?.data ?? res.data ?? [];
        setTerms(Array.isArray(data) ? data : (data.terms ?? []));
      })
      .catch(() => setTermsError('Could not load terms. Please create an Academic Term first.'))
      .finally(() => setTermsLoading(false));
  }, [dispatch]);

  const handlePublish = useCallback((exam) => {
    if (window.confirm(`Publish "${exam.name}"? This will make it visible to teachers.`)) {
      dispatch(publishExam(exam.id));
    }
  }, [dispatch]);

  const handleArchive = useCallback((exam) => {
    if (window.confirm(`Archive "${exam.name}"?`)) {
      dispatch(archiveExam(exam.id));
    }
  }, [dispatch]);

  const handleOpenSubjects = (exam) => {
    dispatch(openSubjectForm(exam));
    dispatch(fetchExamSubjects(exam.id));
  };

  const total     = exams.length;
  const published = exams.filter(e => e.status === 'PUBLISHED').length;
  const draft     = exams.filter(e => e.status === 'DRAFT').length;
  const archived  = exams.filter(e => e.status === 'ARCHIVED').length;

  return (
    <div style={{ fontFamily: "'Segoe UI', 'Inter', sans-serif", background: '#F8FAFC', minHeight: '100vh' }}>

      {/* ── Modals ── */}
      {ui.showForm && (
        <ExamForm
          exam={ui.editingId ? exams.find(e => e.id === ui.editingId) ?? selected : null}
          terms={terms}
          termsLoading={termsLoading}
          termsError={termsError}
          onClose={() => { dispatch(closeForm()); dispatch(clearError('create')); dispatch(clearError('update')); }}
        />
      )}
      {ui.showDeleteConfirm && selected && (
        <DeleteConfirmModal exam={selected} onClose={() => dispatch(closeDeleteConfirm())} />
      )}
      {ui.showSubjectForm && selected && (
        <SubjectFormModal exam={selected} onClose={() => dispatch(closeSubjectForm())} />
      )}
      {ui.showResultsModal && selected && (
        <ResultsModal exam={selected} onClose={() => dispatch(closeResultsModal())} />
      )}

      {/* ── Page Header ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '22px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, maxWidth: 1280, margin: '0 auto' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em' }}>Exams</h1>
            <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>CBC Assessment Management</div>
          </div>
          <button
            onClick={() => dispatch(openCreateForm())}
            style={{ padding: '10px 22px', borderRadius: 8, border: 'none', background: '#2563EB', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            + New Exam
          </button>
        </div>
      </div>

      <div style={{ padding: '28px 32px', maxWidth: 1280, margin: '0 auto' }}>

        {/* ── Stat Cards ── */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
          <StatCard label="Total Exams" value={total}      gradient="linear-gradient(135deg,#0f172a 0%,#1e293b 100%)" />
          <StatCard label="Published"   value={published}  gradient="linear-gradient(135deg,#059669 0%,#047857 100%)" />
          <StatCard label="Draft"       value={draft}      gradient="linear-gradient(135deg,#f59e0b 0%,#d97706 100%)" />
          <StatCard label="Archived"    value={archived}   gradient="linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%)" />
        </div>

          {/* ── AI Analyzer ── */}
        <ExamAnalyzer />

        {/* ── Filters ── */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: '14px 16px', marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            placeholder="Search exam name…"
            value={filters.search}
            onChange={e => dispatch(setFilter({ key: 'search', value: e.target.value }))}
            style={{ flex: '1 1 200px', padding: '8px 12px', borderRadius: 7, border: '1.5px solid #E5E7EB', fontSize: 14, outline: 'none', background: '#FAFAFA', fontFamily: 'inherit' }}
          />
          <select value={filters.exam_type} onChange={e => dispatch(setFilter({ key: 'exam_type', value: e.target.value }))}
            style={{ padding: '8px 12px', borderRadius: 7, border: '1.5px solid #E5E7EB', fontSize: 13, color: '#374151', background: '#FAFAFA', fontFamily: 'inherit', outline: 'none' }}>
            <option value="">All Types</option>
            {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filters.status} onChange={e => dispatch(setFilter({ key: 'status', value: e.target.value }))}
            style={{ padding: '8px 12px', borderRadius: 7, border: '1.5px solid #E5E7EB', fontSize: 13, color: '#374151', background: '#FAFAFA', fontFamily: 'inherit', outline: 'none' }}>
            <option value="">All Status</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {(filters.search || filters.exam_type || filters.status) && (
            <button onClick={() => dispatch(resetFilters())}
              style={{ padding: '8px 14px', borderRadius: 7, border: '1.5px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#6B7280', fontFamily: 'inherit' }}>
              ✕ Clear
            </button>
          )}
          <div style={{ marginLeft: 'auto', fontSize: 13, color: '#9CA3AF' }}>
            {exams.length} result{exams.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* ── Errors ── */}
        {errors.fetch   && <div style={{ ...styles.errorBox, marginBottom: 16 }}><span></span> {errors.fetch}</div>}
        {errors.publish && <div style={{ ...styles.errorBox, marginBottom: 16 }}><span></span> {errors.publish}</div>}

        {/* ── Table ── */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
          {loading.fetch ? (
            <div style={{ padding: 70, textAlign: 'center', color: '#9CA3AF' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}></div>
              <div style={{ fontWeight: 600 }}>Loading exams…</div>
            </div>
          ) : exams.length === 0 ? (
            <div style={{ padding: 70, textAlign: 'center', color: '#9CA3AF' }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}></div>
              <div style={{ fontWeight: 700, color: '#374151', fontSize: 16, marginBottom: 6 }}>No exams found</div>
              <div style={{ fontSize: 13 }}>Click "+ New Exam" to create your first exam</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Exam</th>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Term</th>
                    <th style={thStyle}>Subjects</th>
                    <th style={thStyle}>Created</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map(exam => (
                    <tr key={exam.id}
                      style={{ borderBottom: '1px solid #F3F4F6' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#111827', fontSize: 14 }}>{exam.name}</div>
                        {exam.published_at && (
                          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                            Published {new Date(exam.published_at).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}><TypeBadge type={exam.exam_type} /></td>
                      <td style={{ padding: '14px 16px' }}><StatusBadge status={exam.status} /></td>
                      <td style={{ padding: '14px 16px', color: '#6B7280', fontSize: 13 }}>
                        {exam.term_name || `Term ${exam.term_id}`}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#6B7280', fontSize: 13 }}>
                        {exam.subject_count ?? '—'}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#9CA3AF', fontSize: 12 }}>
                        {exam.created_at ? new Date(exam.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <ActionBtn onClick={() => dispatch(openResultsModal(exam))}>
                            Results
                          </ActionBtn>
                          {exam.status !== 'ARCHIVED' && (
                            <ActionBtn onClick={() => handleOpenSubjects(exam)} variant="purple">
                              Subjects
                            </ActionBtn>
                          )}
                          {exam.status !== 'ARCHIVED' && (
                            <ActionBtn onClick={() => dispatch(openEditForm(exam))} variant="blue">
                              Edit
                            </ActionBtn>
                          )}
                          {exam.status === 'DRAFT' && (
                            <ActionBtn onClick={() => handlePublish(exam)} disabled={loading.publish} variant="green">
                              Publish
                            </ActionBtn>
                          )}
                          {exam.status === 'PUBLISHED' && (
                            <ActionBtn onClick={() => handleArchive(exam)} variant="yellow">
                              Archive
                            </ActionBtn>
                          )}
                          {exam.status !== 'ARCHIVED' && (
                            <ActionBtn onClick={() => dispatch(openDeleteConfirm(exam))} variant="red">
                              Delete
                            </ActionBtn>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}