/**
 * AttendancePage.jsx
 * Class attendance marking and overview
 */

import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../config/api';
import {
  fetchClassAttendanceByDate,
  fetchSchoolAttendance,
  bulkMarkAttendance,
  setDraftStatus,
  setAllDraftStatus,
  clearDraft,
  clearAllErrors,
  selectClassAttendance,
  selectSchoolAttendance,
  selectAttendanceDraft,
  selectAttendanceLoading,
  selectAttendanceErrors,
  selectLastSaved,
} from './attendance.slice';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];

const STATUS_STYLES = {
  PRESENT: { bg: '#DCFCE7', color: '#15803D', border: '#86EFAC' },
  ABSENT:  { bg: '#FEE2E2', color: '#DC2626', border: '#FCA5A5' },
  LATE:    { bg: '#FEF9C3', color: '#A16207', border: '#FDE047' },
  EXCUSED: { bg: '#EDE9FE', color: '#7C3AED', border: '#C4B5FD' },
  null:    { bg: '#F3F4F6', color: '#9CA3AF', border: '#E5E7EB' },
};

const today = () => new Date().toISOString().split('T')[0];

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const st = STATUS_STYLES[status] || STATUS_STYLES[null];
  return (
    <span style={{
      background:   st.bg,
      color:        st.color,
      border:       `1px solid ${st.border}`,
      borderRadius: 5,
      padding:      '2px 10px',
      fontSize:     11,
      fontWeight:   700,
      letterSpacing:'0.04em',
    }}>
      {status ?? 'NOT MARKED'}
    </span>
  );
};

const SummaryCard = ({ label, value, color }) => (
  <div style={{
    flex: 1, minWidth: 100,
    background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
    borderRadius: 12,
    padding: '16px 20px',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: `0 4px 14px ${color}44`,
  }}>
    <div style={{
      position: 'absolute', top: -20, right: -20,
      width: 76, height: 76, borderRadius: '50%',
      background: 'rgba(255,255,255,.12)', pointerEvents: 'none',
    }}/>
    <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: '-0.03em' }}>
      {value ?? '—'}
    </div>
    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.72)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 5 }}>
      {label}
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AttendancePage() {
  const dispatch = useDispatch();

  const classAttendance = useSelector(selectClassAttendance);
  const schoolAttendance = useSelector(selectSchoolAttendance);
  const draft   = useSelector(selectAttendanceDraft);
  const loading = useSelector(selectAttendanceLoading);
  const errors  = useSelector(selectAttendanceErrors);
  const lastSaved = useSelector(selectLastSaved);

  const [classes,       setClasses]       = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate,  setSelectedDate]  = useState(today());
  const [search,        setSearch]        = useState('');
  const [saveSuccess,   setSaveSuccess]   = useState(false);
  const [tab,           setTab]           = useState('mark'); // 'mark' | 'overview'

  // Load classes on mount
  useEffect(() => {
    api.get('/classes').then(res => {
      const data = res.data?.data ?? res.data ?? [];
      setClasses(Array.isArray(data) ? data : data.classes ?? []);
    }).catch(() => {});
  }, []);

  // Load school overview when date changes
  useEffect(() => {
    if (tab === 'overview') {
      dispatch(fetchSchoolAttendance(selectedDate));
    }
  }, [dispatch, selectedDate, tab]);

  // Load class attendance when class or date changes
  useEffect(() => {
    if (selectedClass && selectedDate) {
      dispatch(fetchClassAttendanceByDate({ classId: selectedClass, date: selectedDate }));
    }
  }, [dispatch, selectedClass, selectedDate]);

  const handleSave = useCallback(async () => {
    if (!selectedClass || !selectedDate) return;
    const userId = JSON.parse(localStorage.getItem('user') || '{}')?.id;

    const records = Object.entries(draft).map(([studentId, status]) => ({
      student_id: parseInt(studentId),
      class_id:   parseInt(selectedClass),
      date:       selectedDate,
      status,
    }));

    if (records.length === 0) return;

    const result = await dispatch(bulkMarkAttendance({ records, markedBy: userId }));
    if (result.meta.requestStatus === 'fulfilled') {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      dispatch(fetchClassAttendanceByDate({ classId: selectedClass, date: selectedDate }));
    }
  }, [dispatch, draft, selectedClass, selectedDate]);

  const markAll = (status) => dispatch(setAllDraftStatus(status));

  const filteredStudents = classAttendance?.students?.filter(s => {
    if (!search) return true;
    return (s.student_name || '').toLowerCase().includes(search.toLowerCase()) ||
           (s.admission_no || '').toLowerCase().includes(search.toLowerCase());
  }) ?? [];

  const draftCount   = Object.keys(draft).length;
  const presentCount = Object.values(draft).filter(s => s === 'PRESENT').length;
  const absentCount  = Object.values(draft).filter(s => s === 'ABSENT').length;
  const lateCount    = Object.values(draft).filter(s => s === 'LATE').length;
  const excusedCount = Object.values(draft).filter(s => s === 'EXCUSED').length;

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: '#F9FAFB', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '18px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#111827' }}>Attendance</h1>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>Mark and track student attendance</div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 8, padding: 3, gap: 2 }}>
            {[['mark', ' Mark Attendance'], ['overview', ' School Overview']].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} style={{
                padding: '7px 18px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
                background: tab === key ? '#fff' : 'transparent',
                color:      tab === key ? '#111827' : '#6B7280',
                boxShadow:  tab === key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>

        {/* Controls row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="date"
            value={selectedDate}
            max={today()}
            onChange={e => setSelectedDate(e.target.value)}
            style={{
              padding: '9px 12px', borderRadius: 7, border: '1.5px solid #E5E7EB',
              fontSize: 14, color: '#111827', background: '#fff', fontFamily: 'inherit',
            }}
          />

          {tab === 'mark' && (
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              style={{
                padding: '9px 14px', borderRadius: 7, border: '1.5px solid #E5E7EB',
                fontSize: 14, color: selectedClass ? '#111827' : '#9CA3AF',
                background: '#fff', fontFamily: 'inherit', minWidth: 200,
              }}
            >
              <option value="">— Select Class —</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}

          {tab === 'mark' && selectedClass && (
            <input
              placeholder="Search student..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                padding: '9px 12px', borderRadius: 7, border: '1.5px solid #E5E7EB',
                fontSize: 14, background: '#fff', fontFamily: 'inherit', minWidth: 180,
              }}
            />
          )}
        </div>

        {/* ── MARK TAB ── */}
        {tab === 'mark' && (
          <>
            {!selectedClass ? (
              <div style={{ textAlign: 'center', padding: '80px 24px', color: '#9CA3AF' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}></div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>Select a class to begin</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>Choose a class and date above to mark attendance</div>
              </div>
            ) : loading.classAttendance ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF', fontSize: 15 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}></div>Loading students…
              </div>
            ) : errors.classAttendance ? (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '14px 18px', color: '#DC2626', fontSize: 14 }}>
                 {errors.classAttendance}
              </div>
            ) : classAttendance && (
              <>
                {/* Summary strip */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                  <SummaryCard label="Total"   value={classAttendance.total_students} color="#6B7280" icon="👥" />
                  <SummaryCard label="Present" value={presentCount} color="#16A34A"  />
                  <SummaryCard label="Absent"  value={absentCount}  color="#DC2626"  />
                  <SummaryCard label="Late"    value={lateCount}    color="#D97706"  />
                  <SummaryCard label="Excused" value={excusedCount} color="#7C3AED"  />
                </div>

                {/* Quick mark all buttons */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, marginRight: 4 }}>MARK ALL:</span>
                  {STATUSES.map(st => {
                    const style = STATUS_STYLES[st];
                    return (
                      <button key={st} onClick={() => markAll(st)} style={{
                        padding: '5px 14px', borderRadius: 5, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                        background: style.bg, color: style.color, border: `1px solid ${style.border}`,
                      }}>
                        {st}
                      </button>
                    );
                  })}
                  {draftCount > 0 && (
                    <button onClick={() => dispatch(clearDraft())} style={{
                      padding: '5px 14px', borderRadius: 5, cursor: 'pointer', fontSize: 12,
                      background: '#fff', color: '#9CA3AF', border: '1px solid #E5E7EB', fontWeight: 600,
                    }}>
                      Clear
                    </button>
                  )}
                </div>

                {/* Error / success banners */}
                {errors.saving && (
                  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 7, padding: '10px 14px', color: '#DC2626', fontSize: 13, marginBottom: 14 }}>
                     {errors.saving}
                  </div>
                )}
                {saveSuccess && (
                  <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 7, padding: '10px 14px', color: '#15803D', fontSize: 13, marginBottom: 14 }}>
                     Attendance saved successfully!
                  </div>
                )}

                {/* Student table */}
                <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#F9FAFB' }}>
                        {['#', 'Student', 'Adm No', 'Status', 'Remarks'].map(h => (
                          <th key={h} style={{
                            padding: '10px 16px', textAlign: 'left', fontSize: 11,
                            fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.06em',
                            textTransform: 'uppercase', borderBottom: '1px solid #E5E7EB',
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student, idx) => {
                        const currentStatus = draft[student.student_id] ?? student.status ?? null;
                        return (
                          <tr key={student.student_id}
                            style={{ borderBottom: '1px solid #F3F4F6' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                            onMouseLeave={e => e.currentTarget.style.background = ''}>

                            <td style={{ padding: '12px 16px', color: '#9CA3AF', fontSize: 13 }}>
                              {idx + 1}
                            </td>

                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>
                                {student.student_name}
                              </div>
                            </td>

                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#6B7280' }}>
                                {student.admission_no || '—'}
                              </span>
                            </td>

                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {STATUSES.map(st => {
                                  const active = currentStatus === st;
                                  const style  = STATUS_STYLES[st];
                                  return (
                                    <button key={st}
                                      onClick={() => dispatch(setDraftStatus({ studentId: student.student_id, status: st }))}
                                      style={{
                                        padding: '4px 10px', borderRadius: 5, cursor: 'pointer',
                                        fontSize: 11, fontWeight: 700, transition: 'all 0.1s',
                                        background: active ? style.bg    : '#F9FAFB',
                                        color:      active ? style.color : '#9CA3AF',
                                        border:     active ? `1.5px solid ${style.border}` : '1.5px solid #E5E7EB',
                                        transform:  active ? 'scale(1.05)' : 'scale(1)',
                                      }}>
                                      {st}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>

                            <td style={{ padding: '12px 16px', color: '#9CA3AF', fontSize: 12 }}>
                              {student.remarks || '—'}
                            </td>
                          </tr>
                        );
                      })}

                      {filteredStudents.length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
                            No students found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Save button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, alignItems: 'center' }}>
                  {lastSaved && (
                    <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                      Last saved {new Date(lastSaved).toLocaleTimeString()}
                    </span>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={loading.saving || draftCount === 0}
                    style={{
                      padding: '10px 28px', borderRadius: 7, border: 'none',
                      background: loading.saving || draftCount === 0 ? '#93C5FD' : '#2563EB',
                      color: '#fff', fontSize: 14, fontWeight: 700,
                      cursor: loading.saving || draftCount === 0 ? 'not-allowed' : 'pointer',
                    }}>
                    {loading.saving ? 'Saving…' : `Save Attendance (${draftCount})`}
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* ── OVERVIEW TAB ── */}
        {tab === 'overview' && (
          <>
            {loading.schoolAttendance ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}></div>Loading overview…
              </div>
            ) : errors.schoolAttendance ? (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '14px 18px', color: '#DC2626', fontSize: 14 }}>
                ⚠️ {errors.schoolAttendance}
              </div>
            ) : schoolAttendance ? (
              <>
                {/* School summary cards */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                  <SummaryCard label="Total Students" value={schoolAttendance.summary?.total_students} color="#2563EB"  />
                  <SummaryCard label="Present"        value={schoolAttendance.summary?.present_count}  color="#16A34A"  />
                  <SummaryCard label="Absent"         value={schoolAttendance.summary?.absent_count}   color="#DC2626"  />
                  <SummaryCard label="Late"           value={schoolAttendance.summary?.late_count}     color="#D97706"  />
                  <SummaryCard label="Excused"        value={schoolAttendance.summary?.excused_count}  color="#7C3AED"  />
                </div>

                {/* Per-class breakdown */}
                <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid #E5E7EB', fontWeight: 700, fontSize: 14, color: '#111827' }}>
                    Class Breakdown — {selectedDate}
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#F9FAFB' }}>
                        {['Class', 'Total', 'Present', 'Absent', 'Attendance %'].map(h => (
                          <th key={h} style={{
                            padding: '10px 16px', textAlign: 'left', fontSize: 11,
                            fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.06em',
                            textTransform: 'uppercase', borderBottom: '1px solid #E5E7EB',
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {schoolAttendance.classes?.map(cls => {
                        const pct = parseFloat(cls.attendance_percentage || 0);
                        const color = pct >= 80 ? '#15803D' : pct >= 60 ? '#D97706' : '#DC2626';
                        return (
                          <tr key={cls.class_id}
                            style={{ borderBottom: '1px solid #F3F4F6' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                            onMouseLeave={e => e.currentTarget.style.background = ''}>
                            <td style={{ padding: '12px 16px', fontWeight: 600, color: '#111827', fontSize: 14 }}>{cls.class_name}</td>
                            <td style={{ padding: '12px 16px', color: '#6B7280' }}>{cls.total_students}</td>
                            <td style={{ padding: '12px 16px', color: '#15803D', fontWeight: 600 }}>{cls.present_count}</td>
                            <td style={{ padding: '12px 16px', color: '#DC2626', fontWeight: 600 }}>{cls.absent_count}</td>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ flex: 1, background: '#F3F4F6', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                                  <div style={{ width: `${pct}%`, background: color, height: '100%', borderRadius: 99 }} />
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 700, color, minWidth: 40 }}>{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '80px 24px', color: '#9CA3AF' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}></div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>No data for this date</div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}