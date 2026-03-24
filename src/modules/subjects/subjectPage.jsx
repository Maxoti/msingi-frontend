/**
 * SubjectPage.jsx
 * CBC Subjects management page
 */

import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchSubjects,
  fetchSubjectsStatistics,
  createSubject,
  updateSubject,
  deleteSubject,
  activateSubject,
  deactivateSubject,
  openCreateForm,
  openEditForm,
  closeForm,
  openDeleteConfirm,
  closeDeleteConfirm,
  setFilter,
  resetFilters,
  clearError,
  selectFilteredSubjects,
  selectSubjectLoading,
  selectSubjectErrors,
  selectSubjectUI,
  selectSubjectStatistics,
  selectSubjectFilters,
  VALID_GRADE_LEVELS,
  VALID_CATEGORIES,
  GRADE_LEVEL_LABELS,
  CATEGORY_LABELS,
} from './subject.slice';

// ─── Category colour map ──────────────────────────────────────────────────────
const CATEGORY_COLORS = {
  LANGUAGES:           { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  MATHEMATICS:         { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
  SCIENCES:            { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
  SOCIAL_STUDIES:      { bg: '#FDF4FF', text: '#7E22CE', border: '#E9D5FF' },
  RELIGIOUS_EDUCATION: { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  CREATIVE_ARTS:       { bg: '#FFF1F2', text: '#BE123C', border: '#FECDD3' },
  PRETECHNICAL:           { bg: '#F0F9FF', text: '#0369A1', border: '#BAE6FD' },
  AGRICULTURE:         { bg: '#F7FEE7', text: '#4D7C0F', border: '#D9F99D' },
  ENVIRONMENTAL:       { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
  PASTORAL:            { bg: '#FAF5FF', text: '#6B21A8', border: '#DDD6FE' },
};

const GRADE_GROUPS = [
  { label: 'Lower Primary', grades: ['GRADE_1', 'GRADE_2', 'GRADE_3'] },
  { label: 'Upper Primary', grades: ['GRADE_4', 'GRADE_5', 'GRADE_6'] },
  { label: 'Junior School', grades: ['GRADE_7', 'GRADE_8', 'GRADE_9'] },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CategoryBadge = ({ category }) => {
  const colors = CATEGORY_COLORS[category] || { bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' };
  return (
    <span style={{
      backgroundColor: colors.bg,
      color:           colors.text,
      border:          `1px solid ${colors.border}`,
      borderRadius:    '4px',
      padding:         '2px 8px',
      fontSize:        '11px',
      fontWeight:      600,
      letterSpacing:   '0.03em',
      whiteSpace:      'nowrap',
    }}>
      {CATEGORY_LABELS[category] || category}
    </span>
  );
};

const StatusDot = ({ active }) => (
  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <span style={{
      width: 7, height: 7, borderRadius: '50%',
      backgroundColor: active ? '#22C55E' : '#D1D5DB',
      display: 'inline-block',
      boxShadow: active ? '0 0 0 2px #BBF7D0' : 'none',
    }} />
    <span style={{ fontSize: 12, color: active ? '#15803D' : '#9CA3AF', fontWeight: 500 }}>
      {active ? 'Active' : 'Inactive'}
    </span>
  </span>
);

// ─── Stat Card ────────────────────────────────────────────────────────────────

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, gradient, delay = 0 }) => (
  <div style={{
    background:   gradient,
    borderRadius: 12,
    padding:      '20px 24px',
    flex:         1,
    minWidth:     140,
    position:     'relative',
    overflow:     'hidden',
    boxShadow:    '0 4px 14px rgba(0,0,0,.12)',
    animation:    `slideUp .3s ${delay}s ease both`,
  }}>
    {/* decorative circle */}
    <div style={{
      position: 'absolute', right: -18, top: -18,
      width: 80, height: 80, borderRadius: '50%',
      background: 'rgba(255,255,255,.1)', pointerEvents: 'none',
    }}/>
    <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
    <div style={{
      fontSize: 30, fontWeight: 800, color: '#fff', lineHeight: 1,
      letterSpacing: '-0.03em', fontFamily: "'DM Mono', monospace",
    }}>
      {value ?? '—'}
    </div>
    <div style={{
      fontSize: 11, color: 'rgba(255,255,255,.75)', marginTop: 5,
      fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
    }}>
      {label}
    </div>
  </div>
);

// ─── Subject Form ─────────────────────────────────────────────────────────────

const SubjectForm = ({ subject, onClose }) => {
  const dispatch   = useDispatch();
  const loading    = useSelector(selectSubjectLoading);
  const errors     = useSelector(selectSubjectErrors);
  const isEditing  = !!subject;

  const [form, setForm] = useState({
    name:             subject?.name             || '',
    code:             subject?.code             || '',
    description:      subject?.description      || '',
    category:         subject?.category         || '',
    grade_levels:     subject?.grade_levels      || [],
    lessons_per_week: subject?.lessons_per_week ?? '',
  });

  const busy = isEditing ? loading.update : loading.create;
  const err  = isEditing ? errors.update  : errors.create;

  const toggle = useCallback((level) => {
    setForm(f => ({
      ...f,
      grade_levels: f.grade_levels.includes(level)
        ? f.grade_levels.filter(l => l !== level)
        : [...f.grade_levels, level],
    }));
  }, []);

  const handleSubmit = () => {
    const payload = {
      ...form,
      lessons_per_week: form.lessons_per_week === '' ? undefined : Number(form.lessons_per_week),
    };
    if (isEditing) {
      dispatch(updateSubject({ id: subject.id, updates: payload }));
    } else {
      dispatch(createSubject(payload));
    }
  };

  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 6,
    border: '1px solid #D1D5DB', fontSize: 14, color: '#111827',
    outline: 'none', background: '#FAFAFA', boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  const labelStyle = { fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block', letterSpacing: '0.03em' };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: 16,
    }}>
      <div style={{
        background: '#FFF', borderRadius: 12, width: '100%', maxWidth: 560,
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px', borderBottom: '1px solid #F3F4F6',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, background: '#FFF', zIndex: 1,
        }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>
              {isEditing ? 'Edit Subject' : 'New Subject'}
            </div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>CBC Curriculum</div>
          </div>
          <button onClick={onClose} style={{
            background: '#F3F4F6', border: 'none', borderRadius: 6,
            width: 32, height: 32, cursor: 'pointer', fontSize: 18, color: '#6B7280',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {err && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: 6, padding: '10px 14px', fontSize: 13, color: '#B91C1C',
            }}>
              {err}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Subject Name *</label>
              <input style={inputStyle} placeholder="e.g. English" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Subject Code *</label>
              <input style={inputStyle} placeholder="e.g. ENG" value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} maxLength={20} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select style={inputStyle} value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                <option value="">— Select —</option>
                {VALID_CATEGORIES.map(c => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Lessons / Week</label>
              <input style={inputStyle} type="number" min={1} max={10}
                placeholder="1 – 10" value={form.lessons_per_week}
                onChange={e => setForm(f => ({ ...f, lessons_per_week: e.target.value }))} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
              placeholder="Optional description…"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>

          {/* Grade Levels */}
          <div>
            <label style={labelStyle}>Grade Levels</label>
            {GRADE_GROUPS.map(group => (
              <div key={group.label} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }}>
                  {group.label}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {group.grades.map(level => {
                    const selected = form.grade_levels.includes(level);
                    return (
                      <button key={level} onClick={() => toggle(level)} style={{
                        padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                        cursor: 'pointer', transition: 'all 0.15s',
                        border:      selected ? '1.5px solid #2563EB' : '1.5px solid #E5E7EB',
                        background:  selected ? '#EFF6FF' : '#FAFAFA',
                        color:       selected ? '#1D4ED8' : '#6B7280',
                      }}>
                        {GRADE_LEVEL_LABELS[level]}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px', borderTop: '1px solid #F3F4F6',
          display: 'flex', gap: 10, justifyContent: 'flex-end',
          position: 'sticky', bottom: 0, background: '#FFF',
        }}>
          <button onClick={onClose} disabled={busy} style={{
            padding: '9px 20px', borderRadius: 6, border: '1px solid #E5E7EB',
            background: '#FFF', cursor: 'pointer', fontSize: 14, color: '#374151', fontWeight: 500,
          }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={busy} style={{
            padding: '9px 24px', borderRadius: 6, border: 'none',
            background: busy ? '#93C5FD' : '#2563EB', color: '#FFF',
            cursor: busy ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600,
          }}>
            {busy ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Subject'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

const DeleteConfirmModal = ({ subject, onClose }) => {
  const dispatch = useDispatch();
  const loading  = useSelector(selectSubjectLoading);
  const errors   = useSelector(selectSubjectErrors);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
    }}>
      <div style={{
        background: '#FFF', borderRadius: 12, width: '100%', maxWidth: 400,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)', padding: '28px 28px 24px',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, marginBottom: 16,
        }}></div>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
          Delete Subject
        </div>
        <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, marginBottom: 20 }}>
          Are you sure you want to delete <strong style={{ color: '#111827' }}>{subject?.name}</strong>?
          This action cannot be undone.
        </div>
        {errors.delete && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: 6, padding: '9px 12px', fontSize: 13, color: '#B91C1C', marginBottom: 16,
          }}>
            {errors.delete}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '9px', borderRadius: 6, border: '1px solid #E5E7EB',
            background: '#FFF', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: '#374151',
          }}>Cancel</button>
          <button onClick={() => dispatch(deleteSubject(subject.id))} disabled={loading.delete} style={{
            flex: 1, padding: '9px', borderRadius: 6, border: 'none',
            background: loading.delete ? '#FCA5A5' : '#DC2626',
            color: '#FFF', cursor: loading.delete ? 'not-allowed' : 'pointer',
            fontSize: 14, fontWeight: 600,
          }}>
            {loading.delete ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Subject Row ──────────────────────────────────────────────────────────────

const SubjectRow = ({ subject }) => {
  const dispatch = useDispatch();
  const loading  = useSelector(selectSubjectLoading);

  return (
    <tr style={{ borderBottom: '1px solid #F3F4F6', transition: 'background 0.1s' }}
      onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
      onMouseLeave={e => e.currentTarget.style.background = ''}>

      <td style={{ padding: '14px 16px' }}>
        <div style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>{subject.name}</div>
        {subject.description && (
          <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}
            title={subject.description}>
            {subject.description.length > 55 ? subject.description.slice(0, 55) + '…' : subject.description}
          </div>
        )}
      </td>

      <td style={{ padding: '14px 16px' }}>
        <span style={{
          fontFamily: "'DM Mono', monospace", fontSize: 12,
          background: '#F3F4F6', padding: '3px 8px', borderRadius: 4,
          color: '#374151', letterSpacing: '0.05em',
        }}>
          {subject.code}
        </span>
      </td>

      <td style={{ padding: '14px 16px' }}>
        {subject.category ? <CategoryBadge category={subject.category} /> : '—'}
      </td>

      <td style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {subject.grade_levels?.length > 0
            ? [...subject.grade_levels].sort().map(g => ( // ✅ fixed: added ? and spread
                <span key={g} style={{
                  background: '#EFF6FF', color: '#1D4ED8', borderRadius: 4,
                  padding: '2px 7px', fontSize: 11, fontWeight: 600,
                }}>
                  G{g.replace('GRADE_', '')}
                </span>
              ))
            : <span style={{ color: '#D1D5DB', fontSize: 13 }}>—</span>
          }
        </div>
      </td>

      <td style={{ padding: '14px 16px', textAlign: 'center', color: '#6B7280', fontSize: 14 }}>
        {subject.lessons_per_week ?? '—'}
      </td>

      <td style={{ padding: '14px 16px' }}>
        <StatusDot active={subject.is_active} />
      </td>

      <td style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <button
            title={subject.is_active ? 'Deactivate' : 'Activate'}
            disabled={loading.activate}
            onClick={() => dispatch(subject.is_active ? deactivateSubject(subject.id) : activateSubject(subject.id))}
            style={{
              padding: '5px 10px', borderRadius: 5, border: '1px solid #E5E7EB',
              background: '#FFF', cursor: 'pointer', fontSize: 12, color: '#6B7280',
              fontWeight: 500,
            }}>
            {subject.is_active ? '⏸ Deactivate' : '▶ Activate'}
          </button>

          <button
            title="Edit"
            onClick={() => dispatch(openEditForm(subject))}
            style={{
              padding: '5px 10px', borderRadius: 5, border: '1px solid #E5E7EB',
              background: '#FFF', cursor: 'pointer', fontSize: 12, color: '#2563EB', fontWeight: 500,
            }}>
             Edit
          </button>

          <button
            title="Delete"
            onClick={() => dispatch(openDeleteConfirm(subject))}
            style={{
              padding: '5px 10px', borderRadius: 5, border: '1px solid #FECACA',
              background: '#FFF', cursor: 'pointer', fontSize: 12, color: '#DC2626', fontWeight: 500,
            }}>
            Delete

          </button>
        </div>
      </td>
    </tr>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const SubjectPage = () => {
  const dispatch   = useDispatch();
  const subjects   = useSelector(selectFilteredSubjects);
  const loading    = useSelector(selectSubjectLoading);
  const errors     = useSelector(selectSubjectErrors);
  const ui         = useSelector(selectSubjectUI);
  const filters    = useSelector(selectSubjectFilters);
  const statistics = useSelector(selectSubjectStatistics);

  useEffect(() => {
    dispatch(fetchSubjects());
    dispatch(fetchSubjectsStatistics());
  }, [dispatch]);

  const handleSearchChange = useCallback((e) => {
    dispatch(setFilter({ key: 'search', value: e.target.value }));
  }, [dispatch]);

  const thStyle = {
    padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700,
    color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase',
    borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap',
  };

  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", background: '#F9FAFB', minHeight: '100vh', color: '#111827' }}>

      {/* Modals */}
      {ui.showForm && (
        <SubjectForm
          subject={ui.editingId ? subjects.find(s => s.id === ui.editingId) || null : null}
          onClose={() => { dispatch(closeForm()); dispatch(clearError('create')); dispatch(clearError('update')); }}
        />
      )}
      {ui.showDeleteConfirm && (
        <DeleteConfirmModal
          subject={subjects.find(s => s.id === ui.editingId) || null}
          onClose={() => dispatch(closeDeleteConfirm())}
        />
      )}

      {/* Page header */}
      <div style={{ background: '#FFF', borderBottom: '1px solid #E5E7EB', padding: '20px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
              Subjects
            </h1>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 3 }}>
              Competency-Based Curriculum (CBC) · Grades 1 – 9
            </div>
          </div>
          <button
            onClick={() => dispatch(openCreateForm())}
            style={{
              padding: '9px 20px', borderRadius: 7, border: 'none',
              background: '#2563EB', color: '#FFF', fontWeight: 600,
              fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}>
            + Add Subject
          </button>
        </div>
      </div>

      <div style={{ padding: '28px 32px', maxWidth: 1280, margin: '0 auto' }}>

        {/* Stat cards */}
        
        {statistics && (
  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
    <StatCard label="Total Subjects" value={statistics.total_subjects}    gradient="linear-gradient(135deg,#2563EB 0%,#1d4ed8 100%)" delay={0}    />
    <StatCard label="Active"         value={statistics.active_subjects}    gradient="linear-gradient(135deg,#16a34a 0%,#15803d 100%)" delay={0.06} />
    <StatCard label="Inactive"       value={statistics.inactive_subjects}  gradient="linear-gradient(135deg,#64748b 0%,#475569 100%)" delay={0.12} />
    <StatCard label="Categories"     value={statistics.total_categories}   gradient="linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%)" delay={0.18} />
  </div>
)}

  
 

        {/* Filters bar */}
        <div style={{
          background: '#FFF', border: '1px solid #E5E7EB', borderRadius: 8,
          padding: '14px 16px', marginBottom: 16,
          display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center',
        }}>
          <input
            placeholder="Search name or code…"
            value={filters.search}
            onChange={handleSearchChange}
            style={{
              flex: '1 1 200px', padding: '8px 12px', borderRadius: 6,
              border: '1px solid #E5E7EB', fontSize: 14, outline: 'none',
              background: '#FAFAFA', fontFamily: 'inherit',
            }}
          />

          <select
            value={filters.gradeLevel}
            onChange={e => dispatch(setFilter({ key: 'gradeLevel', value: e.target.value }))}
            style={{
              padding: '8px 12px', borderRadius: 6, border: '1px solid #E5E7EB',
              fontSize: 13, color: '#374151', background: '#FAFAFA', fontFamily: 'inherit',
            }}>
            <option value="">All Grades</option>
            {VALID_GRADE_LEVELS.map(g => <option key={g} value={g}>{GRADE_LEVEL_LABELS[g]}</option>)}
          </select>

          <select
            value={filters.category}
            onChange={e => dispatch(setFilter({ key: 'category', value: e.target.value }))}
            style={{
              padding: '8px 12px', borderRadius: 6, border: '1px solid #E5E7EB',
              fontSize: 13, color: '#374151', background: '#FAFAFA', fontFamily: 'inherit',
            }}>
            <option value="">All Categories</option>
            {VALID_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
          </select>

          <select
            value={filters.is_active}
            onChange={e => dispatch(setFilter({ key: 'is_active', value: e.target.value }))}
            style={{
              padding: '8px 12px', borderRadius: 6, border: '1px solid #E5E7EB',
              fontSize: 13, color: '#374151', background: '#FAFAFA', fontFamily: 'inherit',
            }}>
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          {(filters.search || filters.gradeLevel || filters.category || filters.is_active) && (
            <button onClick={() => dispatch(resetFilters())} style={{
              padding: '8px 14px', borderRadius: 6, border: '1px solid #E5E7EB',
              background: '#FFF', cursor: 'pointer', fontSize: 13, color: '#6B7280', fontWeight: 500,
            }}>
              Clear
            </button>
          )}

          <div style={{ marginLeft: 'auto', fontSize: 13, color: '#9CA3AF', whiteSpace: 'nowrap' }}>
            {subjects.length} result{subjects.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Error banner */}
        {errors.fetch && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: 6, padding: '12px 16px', fontSize: 13, color: '#B91C1C',
            marginBottom: 16,
          }}>
            {errors.fetch}
          </div>
        )}

        {/* Table */}
        <div style={{ background: '#FFF', border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
          {loading.fetch ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#9CA3AF', fontSize: 15 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}></div>
              Loading subjects…
            </div>
          ) : subjects.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#9CA3AF', fontSize: 15 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}></div>
              <div style={{ fontWeight: 600, color: '#374151', marginBottom: 6 }}>No subjects found</div>
              <div style={{ fontSize: 13 }}>
                {(filters.search || filters.gradeLevel || filters.category || filters.is_active)
                  ? 'Try adjusting your filters.'
                  : 'Get started by adding your first subject.'}
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB' }}>
                    <th style={thStyle}>Subject</th>
                    <th style={thStyle}>Code</th>
                    <th style={thStyle}>Category</th>
                    <th style={thStyle}>Grade Levels</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Lessons/Wk</th>
                    <th style={thStyle}>Status</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map(subject => (
                    <SubjectRow key={subject.id} subject={subject} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SubjectPage;