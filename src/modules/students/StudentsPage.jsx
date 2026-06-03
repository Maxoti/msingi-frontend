/**
 * src/modules/students/StudentsPage.jsx
 * Main students list page — mobile responsive
 */

import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchStudents,
  searchStudentsThunk,
  deleteStudentThunk,
  selectStudents,
  selectLoading,
  selectDeleting,
  selectError,
  clearError,
} from './students.slice';
import StudentForm    from './StudentForm';
import StudentProfile from './StudentProfile';
import api from '../../config/api';

const STATUS_COLORS = {
  ACTIVE:      { bg: '#e8f5e9', color: '#2e7d32' },
  TRANSFERRED: { bg: '#fff3e0', color: '#e65100' },
  COMPLETED:   { bg: '#e3f2fd', color: '#1565c0' },
  DROPPED:     { bg: '#fce4ec', color: '#c62828' },
};

const PER_PAGE = 10;

const MOBILE_CSS = `
  @media (max-width: 640px) {
    .sp-page        { padding: 16px !important; }
    .sp-header      { flex-wrap: wrap; gap: 8px; align-items: center !important; }
    .sp-title       { font-size: 22px !important; }
    .sp-add-btn     { font-size: 13px !important; padding: 9px 14px !important; white-space: nowrap; }
    .sp-filters     { gap: 8px !important; }
    .sp-search-wrap { flex: 1 1 100% !important; }
    .sp-selects     { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; width: 100%; }
    .sp-select      { width: 100% !important; }
    .sp-table-wrap  { display: none !important; }
    .sp-cards       { display: flex !important; }
    .sp-pager       { gap: 10px !important; }
  }
  @media (min-width: 641px) {
    .sp-cards { display: none !important; }
    .sp-table-wrap { display: block !important; }
    .sp-selects { display: contents; }
  }
`;

function injectStyle() {
  if (typeof document !== 'undefined' && !document.getElementById('sp-mobile-css')) {
    const tag = document.createElement('style');
    tag.id = 'sp-mobile-css';
    tag.textContent = MOBILE_CSS;
    document.head.appendChild(tag);
  }
}

export default function StudentsPage() {
  injectStyle();

  const dispatch  = useDispatch();
  const students  = useSelector(selectStudents);
  const loading   = useSelector(selectLoading);
  const deleting  = useSelector(selectDeleting);
  const error     = useSelector(selectError);

  const [classes, setClasses]               = useState([]);
  const [classesLoading, setClassesLoading] = useState(true);

  useEffect(() => {
    const CLASS_ORDER = [
      'pp1','pp2','grade 1','grade 2','grade 3','grade 4','grade 5',
      'grade 6','grade 7','grade 8','grade 9',
    ];
    api.get('/classes')
      .then(res => {
        const list = res.data?.data || res.data?.classes || res.data || [];
        const cleaned = list
          .filter(c => {
            const name = (c.name || '').toLowerCase().trim();
            return !name.startsWith('empty class') &&
                   !name.startsWith('api test') &&
                   !name.startsWith('test class') &&
                   !/\d{8,}/.test(name);
          })
          .sort((a, b) => {
            const ai = CLASS_ORDER.indexOf((a.name || '').toLowerCase().trim());
            const bi = CLASS_ORDER.indexOf((b.name || '').toLowerCase().trim());
            if (ai === -1 && bi === -1) return (a.name || '').localeCompare(b.name || '');
            if (ai === -1) return 1;
            if (bi === -1) return -1;
            return ai - bi;
          });
        setClasses(cleaned);
      })
      .catch(err => console.error('Failed to load classes:', err))
      .finally(() => setClassesLoading(false));
  }, []);

  const [search, setSearch]             = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterClass,  setFilterClass]  = useState('');
  const [page, setPage]                 = useState(1);
  const [showAdd, setShowAdd]           = useState(false);
  const [editStudent, setEditStudent]   = useState(null);
  const [profileId, setProfileId]       = useState(null);

  const load = useCallback(() => {
    const filters = {};
    if (filterGender) filters.gender  = filterGender;
    if (filterStatus) filters.status  = filterStatus;
    if (filterClass)  filters.classId = filterClass;
    if (search.trim()) {
      dispatch(searchStudentsThunk({ term: search, filters }));
    } else {
      dispatch(fetchStudents(filters));
    }
    setPage(1);
  }, [dispatch, search, filterGender, filterStatus, filterClass]);

  useEffect(() => {
    const delay = setTimeout(load, search ? 400 : 0);
    return () => clearTimeout(delay);
  }, [load, search]);

  const handleDelete = (student) => {
    const name = `${student.firstName} ${student.lastName}`;
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    dispatch(deleteStudentThunk(student.id));
  };

  const totalPages = Math.ceil(students.length / PER_PAGE);
  const paged      = students.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const fullName = (s) => [s.firstName, s.middleName, s.lastName].filter(Boolean).join(' ');
  const initials = (s) => `${s.firstName?.[0] || ''}${s.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="sp-page" style={s.page}>

      {/* ── Header ── */}
      <div className="sp-header" style={s.header}>
        <div>
          <h1 className="sp-title" style={s.title}>Students</h1>
          <p style={s.subtitle}>
            {loading ? 'Loading...' : `${students.length} student${students.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button className="sp-add-btn" onClick={() => setShowAdd(true)} style={s.addBtn}>
          + Add Student
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="sp-filters" style={s.filtersRow}>
        {/* Search — always full width on mobile */}
        <div className="sp-search-wrap" style={s.searchWrap}>
          <SearchIcon />
          <input
            style={s.searchInput}
            placeholder="Search name or admission no..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button style={s.clearBtn} onClick={() => setSearch('')}>✕</button>}
        </div>

        {/* Selects — 2-col grid on mobile, inline on desktop */}
        <div className="sp-selects">
          <select className="sp-select" value={filterGender} onChange={e => setFilterGender(e.target.value)} style={s.select}>
            <option value="">All Genders</option>
            {['MALE','FEMALE'].map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select className="sp-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={s.select}>
            <option value="">All Statuses</option>
            {['ACTIVE','TRANSFERRED','COMPLETED','DROPPED'].map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select className="sp-select" value={filterClass} onChange={e => setFilterClass(e.target.value)} style={s.select}>
            <option value="">{classesLoading ? 'Loading...' : 'All Classes'}</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {(filterGender || filterStatus || filterClass) && (
            <button
              onClick={() => { setFilterGender(''); setFilterStatus(''); setFilterClass(''); }}
              style={s.clearFilters}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={s.errorBanner}>
          ⚠ {error}
          <button onClick={() => { dispatch(clearError()); load(); }} style={s.retryBtn}>Retry</button>
        </div>
      )}

      {/* ── Desktop Table ── */}
      <div className="sp-table-wrap" style={s.card}>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
        ) : paged.length === 0 ? (
          <EmptyState search={search} onAdd={() => setShowAdd(true)} />
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                {['Student','Admission No','Class','Gender','Status','Actions'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map(student => {
                const badge = STATUS_COLORS[student.status] || STATUS_COLORS.ACTIVE;
                return (
                  <tr key={student.id} style={s.tr}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={s.td}>
                      <div style={s.studentCell}>
                        <div style={s.avatar}>{initials(student)}</div>
                        <div>
                          <div style={s.sName}>{fullName(student)}</div>
                          <div style={s.sMeta}>{student.email || student.phone || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={s.td}><span style={s.admNo}>{student.admissionNo}</span></td>
                    <td style={s.td}>{student.className || student.classId || '—'}</td>
                    <td style={s.td}>{student.gender}</td>
                    <td style={s.td}>
                      <span style={{ ...s.statusBadge, ...badge }}>{student.status}</span>
                    </td>
                    <td style={s.td}>
                      <div style={s.actions}>
                        <ActionBtn title="View"   label="view"   onClick={() => setProfileId(student.id)} />
                        <ActionBtn title="Edit"   label="Edit"   onClick={() => setEditStudent(student)} />
                        <ActionBtn
                          title="Delete" label={deleting === student.id ? '...' : 'Delete'}
                          onClick={() => handleDelete(student)}
                          disabled={deleting === student.id} danger
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Mobile Cards ── */}
      <div className="sp-cards" style={{ flexDirection:'column', gap:10 }}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <MobileSkeletonCard key={i} />)
        ) : paged.length === 0 ? (
          <EmptyState search={search} onAdd={() => setShowAdd(true)} />
        ) : (
          paged.map(student => {
            const badge = STATUS_COLORS[student.status] || STATUS_COLORS.ACTIVE;
            return (
              <div key={student.id} style={s.mobileCard}>
                {/* Top row */}
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                  <div style={s.avatar}>{initials(student)}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ ...s.sName, fontSize:15 }}>{fullName(student)}</div>
                    <div style={s.sMeta}>{student.email || student.phone || '—'}</div>
                  </div>
                  <span style={{ ...s.statusBadge, ...badge, fontSize:11 }}>{student.status}</span>
                </div>
                {/* Info grid */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 12px', marginBottom:12, fontSize:13 }}>
                  <div>
                    <div style={{ fontSize:10, color:'#aaa', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:2 }}>Admission No</div>
                    <span style={s.admNo}>{student.admissionNo}</span>
                  </div>
                  <div>
                    <div style={{ fontSize:10, color:'#aaa', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:2 }}>Class</div>
                    <div style={{ color:'#333' }}>{student.className || student.classId || '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:10, color:'#aaa', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:2 }}>Gender</div>
                    <div style={{ color:'#333' }}>{student.gender}</div>
                  </div>
                </div>
                {/* Actions */}
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => setProfileId(student.id)} style={s.mobileActionBtn}>
                     View
                  </button>
                  <button onClick={() => setEditStudent(student)} style={s.mobileActionBtn}>
                     Edit
                  </button>
                  <button
                    onClick={() => handleDelete(student)}
                    disabled={deleting === student.id}
                    style={{ ...s.mobileActionBtn, background:'#fff0f0', color:'#dc2626' }}
                  >
                    {deleting === student.id ? '...' : ' Delete'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="sp-pager" style={s.pager}>
          <button onClick={() => setPage(p => p - 1)} disabled={page === 1} style={s.pageBtn}>← Prev</button>
          <span style={{ fontSize: 13, color: '#888' }}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} style={s.pageBtn}>Next →</button>
        </div>
      )}

      {/* ── Modals ── */}
      {showAdd && (
        <StudentForm classes={classes} onClose={() => setShowAdd(false)} onSaved={() => load()} />
      )}
      {editStudent && (
        <StudentForm
          student={editStudent} classes={classes}
          onClose={() => setEditStudent(null)}
          onSaved={() => { load(); setEditStudent(null); }}
        />
      )}
      {profileId && (
        <StudentProfile
          studentId={profileId}
          onClose={() => setProfileId(null)}
          onEdit={(st) => { setProfileId(null); setEditStudent(st); }}
        />
      )}
    </div>
  );
}

// ── Small reusable components ────────────────────────────────

function EmptyState({ search, onAdd }) {
  return (
    <div style={s.empty}>
      <div style={{ fontSize: 48, marginBottom: 12 }}></div>
      <h3 style={{ margin: '0 0 8px', color: '#333' }}>No students found</h3>
      <p style={{ color: '#aaa', margin: '0 0 16px' }}>
        {search ? 'Try a different search term' : 'Click "Add Student" to get started'}
      </p>
      {!search && (
        <button onClick={onAdd} style={{ ...s.addBtn, fontSize:13 }}>+ Add Student</button>
      )}
    </div>
  );
}

function ActionBtn({ label, onClick, title, disabled, danger }) {
  return (
    <button title={title} onClick={onClick} disabled={disabled}
      style={{
        background: danger ? '#fff0f0' : '#f5f5f5',
        border: 'none', borderRadius: 6,
        padding: '6px 10px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 13, color: danger ? '#dc2626' : '#333',
      }}>
      {label}
    </button>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}

function SkeletonRow() {
  const sk = { background: '#f0f0f0', borderRadius: 4, display: 'inline-block' };
  return (
    <div style={{ display: 'flex', gap: 16, padding: '16px 24px', alignItems: 'center' }}>
      <div style={{ ...sk, width: 38, height: 38, borderRadius: '50%' }} />
      <div style={{ flex: 1 }}>
        <div style={{ ...sk, width: '35%', height: 13, marginBottom: 6, display: 'block' }} />
        <div style={{ ...sk, width: '20%', height: 11 }} />
      </div>
      <div style={{ ...sk, width: '10%', height: 13 }} />
      <div style={{ ...sk, width: '8%', height: 13 }} />
      <div style={{ ...sk, width: 60, height: 22, borderRadius: 999 }} />
      <div style={{ ...sk, width: 80, height: 13 }} />
    </div>
  );
}

function MobileSkeletonCard() {
  const sk = { background: '#f0f0f0', borderRadius: 4 };
  return (
    <div style={{ background:'#fff', borderRadius:12, padding:16, border:'1px solid #f0f0f0' }}>
      <div style={{ display:'flex', gap:12, marginBottom:12 }}>
        <div style={{ ...sk, width:42, height:42, borderRadius:'50%', flexShrink:0 }} />
        <div style={{ flex:1 }}>
          <div style={{ ...sk, height:14, width:'60%', marginBottom:6 }} />
          <div style={{ ...sk, height:11, width:'40%' }} />
        </div>
      </div>
      <div style={{ ...sk, height:11, width:'80%', marginBottom:12 }} />
      <div style={{ display:'flex', gap:8 }}>
        {[1,2,3].map(i => <div key={i} style={{ ...sk, flex:1, height:34, borderRadius:8 }} />)}
      </div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────
const s = {
  page:        { padding: '28px 32px', background: '#f7f8fc', minHeight: '100vh' },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 12 },
  title:       { margin: 0, fontSize: 26, fontWeight: 800, color: '#1a1a2e' },
  subtitle:    { margin: '4px 0 0', fontSize: 14, color: '#888' },
  addBtn: {
    padding: '10px 22px', borderRadius: 10, border: 'none',
    background: 'linear-gradient(135deg, #6c63ff, #48cae4)',
    color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700,
    boxShadow: '0 4px 14px rgba(108,99,255,0.3)', whiteSpace: 'nowrap', flexShrink: 0,
  },
  filtersRow:  { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' },
  searchWrap: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#fff', borderRadius: 10, padding: '10px 14px',
    border: '1.5px solid #e8e8e8', flex: '1 1 240px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
  },
  searchInput: { border: 'none', outline: 'none', fontSize: 14, flex: 1, background: 'transparent' },
  clearBtn:    { background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 13 },
  select: {
    padding: '10px 14px', borderRadius: 10,
    border: '1.5px solid #e8e8e8', fontSize: 13, color: '#444',
    background: '#fff', cursor: 'pointer',
  },
  clearFilters: {
    padding: '8px 14px', borderRadius: 8,
    border: '1.5px solid #ff6b6b', color: '#ff6b6b',
    background: '#fff0f0', cursor: 'pointer', fontSize: 13,
  },
  errorBanner: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: '#fff0f0', border: '1px solid #ffcdd2',
    borderRadius: 10, padding: '12px 16px',
    color: '#c0392b', fontSize: 13, marginBottom: 16,
  },
  retryBtn:    { padding: '6px 12px', borderRadius: 6, border: 'none', background: '#c0392b', color: '#fff', cursor: 'pointer', fontSize: 12 },
  card:        { background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' },
  table:       { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '13px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700,
    color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em',
    borderBottom: '1px solid #f0f0f0', background: '#fafafa',
  },
  tr:          { transition: 'background 0.15s' },
  td:          { padding: '14px 20px', borderBottom: '1px solid #f8f8f8', fontSize: 14, color: '#333' },
  studentCell: { display: 'flex', alignItems: 'center', gap: 12 },
  avatar: {
    width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg, #6c63ff, #48cae4)',
    color: '#fff', fontWeight: 700, fontSize: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  sName:       { fontWeight: 600, color: '#1a1a2e', fontSize: 14 },
  sMeta:       { fontSize: 12, color: '#aaa', marginTop: 2 },
  admNo:       { background: '#f0f0ff', color: '#6c63ff', padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 },
  statusBadge: { padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 },
  actions:     { display: 'flex', gap: 6 },
  empty:       { padding: '60px 24px', textAlign: 'center' },
  pager:       { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 20 },
  pageBtn: {
    padding: '8px 18px', borderRadius: 8, border: '1.5px solid #e0e0e0',
    background: '#fff', cursor: 'pointer', fontSize: 13, color: '#555',
  },
  mobileCard: {
    background: '#fff', borderRadius: 14, padding: 16,
    boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0',
  },
  mobileActionBtn: {
    flex: 1, padding: '8px 4px', borderRadius: 8, border: 'none',
    background: '#f5f5f5', color: '#333', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', textAlign: 'center',
  },
};