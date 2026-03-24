import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchSlotsThunk, createSlotThunk, deleteSlotThunk,
  fetchClassTimetableThunk, fetchTeacherTimetableThunk,
  createEntryThunk, deleteEntryThunk,
  clearSaveError,
  selectSlots, selectGrid, selectSlotDefs,
  selectLoading, selectSaving, selectSaveError, selectError,
} from './timetable.slice';
import { fetchAllStaffThunk, selectStaffList } from '../staff/staff.slice';
import { useSelector as useReduxSelector } from 'react-redux';
import Modal  from '../../shared/components/Modal';
import Button from '../../shared/components/Button';
import api from '../../config/api';

const DAYS     = { 1: 'MON', 2: 'TUE', 3: 'WED', 4: 'THU', 5: 'FRI' };
const DAY_KEYS = [1, 2, 3, 4, 5];

// ── Detects non-teaching slots: break, lunch, recess, games
const isBreakSlot = (name) => /(break|lunch|recess|games)/i.test(name);

const SUBJECT_COLORS = {
  mathematics: { bg: '#1565c0', text: '#fff' },
  english:     { bg: '#6a1b9a', text: '#fff' },
  kiswahili:   { bg: '#e65100', text: '#fff' },
  science:     { bg: '#00838f', text: '#fff' },
  social:      { bg: '#2e7d32', text: '#fff' },
  creative:    { bg: '#c62828', text: '#fff' },
  agriculture: { bg: '#558b2f', text: '#fff' },
  religious:   { bg: '#4e342e', text: '#fff' },
};

const FALLBACK_COLORS = [
  { bg: '#37474f', text: '#fff' },
  { bg: '#ad1457', text: '#fff' },
  { bg: '#00695c', text: '#fff' },
  { bg: '#f57f17', text: '#fff' },
];

const getCardColor = (subjectName) => {
  const lower = subjectName.toLowerCase();
  if (lower.includes('math'))                                                         return SUBJECT_COLORS.mathematics;
  if (lower.includes('english'))                                                      return SUBJECT_COLORS.english;
  if (lower.includes('kiswahili') || lower.includes('swahili'))                      return SUBJECT_COLORS.kiswahili;
  if (lower.includes('science'))                                                      return SUBJECT_COLORS.science;
  if (lower.includes('social'))                                                       return SUBJECT_COLORS.social;
  if (lower.includes('creative') || lower.includes('art'))                           return SUBJECT_COLORS.creative;
  if (lower.includes('agricult'))                                                     return SUBJECT_COLORS.agriculture;
  if (lower.includes('religion') || lower.includes('r.e') || lower.includes('c.r.e') || lower.includes('i.r.e')) return SUBJECT_COLORS.religious;
  let hash = 0;
  for (let i = 0; i < subjectName.length; i++) hash = subjectName.charCodeAt(i) + ((hash << 5) - hash);
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
};

const emptySlotForm  = { name: '', start_time: '', end_time: '', sort_order: '' };
const emptyEntryForm = { class_id: '', staff_id: '', slot_id: '', day_of_week: '', subject_name: '', term_id: '' };

export default function TimetablePage() {
  const dispatch  = useDispatch();
  const slots     = useSelector(selectSlots);
  const grid      = useSelector(selectGrid);
  const slotDefs  = useSelector(selectSlotDefs);
  const loading   = useSelector(selectLoading);
  const saving    = useSelector(selectSaving);
  const saveError = useSelector(selectSaveError);
  const error     = useSelector(selectError);
  const staffList = useReduxSelector(selectStaffList);

  const [view,            setView]            = useState('class');
  const [classes,         setClasses]         = useState([]);
  const [terms,           setTerms]           = useState([]);
  const [selectedClass,   setSelectedClass]   = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedTerm,    setSelectedTerm]    = useState('');

  const [showSlotForm,  setShowSlotForm]  = useState(false);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [slotForm,      setSlotForm]      = useState(emptySlotForm);
  const [entryForm,     setEntryForm]     = useState(emptyEntryForm);
  const [localError,    setLocalError]    = useState('');

  useEffect(() => {
    dispatch(fetchSlotsThunk());
    dispatch(fetchAllStaffThunk());
    api.get('/classes').then(r => setClasses(r.data?.data || r.data || [])).catch(() => {});
    api.get('/terms').then(r => {
      const list = r.data?.data?.terms || r.data?.data || r.data || [];
      setTerms(list);
      const active = list.find(t => t.is_active);
      if (active) setSelectedTerm(String(active.id));
    }).catch(() => {});
  }, [dispatch]);

  useEffect(() => {
    if (!selectedTerm) return;
    if (view === 'class' && selectedClass)
      dispatch(fetchClassTimetableThunk({ classId: selectedClass, termId: selectedTerm }));
    if (view === 'teacher' && selectedTeacher)
      dispatch(fetchTeacherTimetableThunk({ staffId: selectedTeacher, termId: selectedTerm }));
  }, [view, selectedClass, selectedTeacher, selectedTerm, dispatch]);

  const refresh = () => {
    if (!selectedTerm) return;
    if (view === 'class' && selectedClass)
      dispatch(fetchClassTimetableThunk({ classId: selectedClass, termId: selectedTerm }));
    if (view === 'teacher' && selectedTeacher)
      dispatch(fetchTeacherTimetableThunk({ staffId: selectedTeacher, termId: selectedTerm }));
  };

  const handleCreateSlot = async () => {
    if (!slotForm.name || !slotForm.start_time || !slotForm.end_time) {
      setLocalError('Name, start time and end time are required'); return;
    }
    setLocalError('');
    const action = await dispatch(createSlotThunk({ ...slotForm, sort_order: Number(slotForm.sort_order) || 0 }));
    if (action.meta.requestStatus === 'fulfilled') { setShowSlotForm(false); setSlotForm(emptySlotForm); }
  };

  const handleDeleteSlot = async (id) => { await dispatch(deleteSlotThunk(id)); };

  const openEntryForm = (dayOfWeek = '', slotId = '') => {
    setEntryForm({
      ...emptyEntryForm,
      day_of_week: String(dayOfWeek),
      slot_id: String(slotId),
      term_id: selectedTerm,
      class_id: view === 'class' ? selectedClass : '',
    });
    setLocalError('');
    dispatch(clearSaveError());
    setShowEntryForm(true);
  };

  const handleCreateEntry = async () => {
    if (!entryForm.class_id || !entryForm.slot_id || !entryForm.day_of_week || !entryForm.subject_name || !entryForm.term_id) {
      setLocalError('All fields are required'); return;
    }
    setLocalError('');
    const action = await dispatch(createEntryThunk({
      ...entryForm,
      class_id:    Number(entryForm.class_id),
      slot_id:     Number(entryForm.slot_id),
      day_of_week: Number(entryForm.day_of_week),
      term_id:     Number(entryForm.term_id),
      staff_id:    entryForm.staff_id ? Number(entryForm.staff_id) : null,
    }));
    if (action.meta.requestStatus === 'fulfilled') { setShowEntryForm(false); setEntryForm(emptyEntryForm); refresh(); }
  };

  const handleDeleteEntry = async (id) => { await dispatch(deleteEntryThunk(id)); refresh(); };

  const setE = (field) => (e) => { setEntryForm(f => ({ ...f, [field]: e.target.value })); setLocalError(''); };
  const setS = (field) => (e) => { setSlotForm(f => ({ ...f, [field]: e.target.value })); setLocalError(''); };

  const hasGrid        = slotDefs.length > 0;
  const teachableSlots = slots.filter(sl => !isBreakSlot(sl.name));

  const selectedClassName = classes.find(c => String(c.id) === String(selectedClass))?.name || '';
  const selectedTermLabel = terms.find(t => String(t.id) === String(selectedTerm));
  const termLabel = selectedTermLabel ? `Term ${selectedTermLabel.term} — ${selectedTermLabel.year}` : '';

  return (
    <div style={s.page}>

      {/* ── Page header ── */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Timetable</h1>
          <p style={s.subtitle}>Manage weekly class and teacher schedules</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" onClick={() => { setShowSlotForm(true); setSlotForm(emptySlotForm); setLocalError(''); }}>
            + Add Time Slot
          </Button>
          <Button onClick={() => openEntryForm()}>+ Add Entry</Button>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div style={s.toolbar}>
        <div style={s.segmented}>
          {[['class', 'Class View'], ['teacher', 'Teacher View']].map(([val, label]) => (
            <button key={val} onClick={() => setView(val)}
              style={{ ...s.segment, ...(view === val ? s.segmentActive : {}) }}>
              {label}
            </button>
          ))}
        </div>

        {view === 'class' ? (
          <select style={s.select} value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
            <option value="">Select class...</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        ) : (
          <select style={s.select} value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)}>
            <option value="">Select teacher...</option>
            {staffList.map(st => <option key={st.id} value={st.id}>{st.firstName || st.first_name} {st.lastName || st.last_name}</option>)}
          </select>
        )}

        <select style={s.select} value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)}>
          <option value="">Select term...</option>
          {terms.map(t => <option key={t.id} value={t.id}>{t.year} Term {t.term}{t.is_active ? ' (active)' : ''}</option>)}
        </select>
      </div>

      {error && <div style={s.errorBanner}>⚠️ {error}</div>}

      {/* ── Timetable card ── */}
      {loading ? (
        <div style={s.empty}>Loading timetable...</div>
      ) : !selectedTerm || (view === 'class' && !selectedClass) || (view === 'teacher' && !selectedTeacher) ? (
        <div style={s.empty}>Select a {view === 'class' ? 'class' : 'teacher'} and term to view the timetable.</div>
      ) : (
        <div style={s.card}>

          {/* Title bar */}
          <div style={s.titleBar}>
            <div style={s.ttTitle}>
              {selectedClassName
                ? `${selectedClassName.toUpperCase()} CLASS TIMETABLE`
                : 'CLASS TIMETABLE'}
            </div>
            <div style={s.ttMeta}>
              <span>TERM: <strong>{termLabel}</strong></span>
            </div>
          </div>

          {/* Color legend */}
          <div style={s.legend}>
            {Object.entries(SUBJECT_COLORS).map(([key, col]) => (
              <div key={key} style={s.legendItem}>
                <div style={{ ...s.legendDot, background: col.bg }} />
                <span style={s.legendLabel}>
                  {{ mathematics: 'Mathematics', english: 'English', kiswahili: 'Kiswahili', science: 'Science', social: 'Social Studies', creative: 'Creative Arts', agriculture: 'Agriculture', religious: 'Religious Ed.' }[key]}
                </span>
              </div>
            ))}
          </div>

          {/* Grid — days as rows, slots as columns */}
          {!hasGrid ? (
            <div style={s.empty}>No entries yet. Click "+ Add Entry" to get started.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={{ ...s.th, ...s.dayTh }}></th>
                    {slotDefs.map(slot => {
                      const isBreak = isBreakSlot(slot.name);
                      return (
                        <th key={slot.id} style={{ ...s.th, ...(isBreak ? s.breakTh : {}), ...(isBreak ? s.breakThNarrow : {}) }}>
                          <div style={s.slotName}>{slot.name}</div>
                          {!isBreak && (
                            <>
                              <div style={s.slotTime}>{slot.start_time?.slice(0, 5)}</div>
                              <div style={s.slotTime}>{slot.end_time?.slice(0, 5)}</div>
                            </>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {DAY_KEYS.map(day => (
                    <tr key={day}>
                      <td style={s.dayCell}>{DAYS[day]}</td>

                      {slotDefs.map(slot => {
                        const isBreak = isBreakSlot(slot.name);

                        if (isBreak) {
                          return (
                            <td key={slot.id} style={s.breakBodyCell}>
                              <div style={s.breakLabel}>{slot.name}</div>
                            </td>
                          );
                        }

                        const entry = grid[day]?.slots?.[slot.id];
                        const color = entry ? getCardColor(entry.subject_name) : null;
                        return (
                          <td key={slot.id} style={s.entryTd}>
                            {entry ? (
                              <div style={{ ...s.entryCard, background: color.bg }}>
                                <div style={{ ...s.subjectText, color: color.text }}>
                                  {entry.subject_name}
                                </div>
                                {entry.teacher_name && (
                                  <div style={{ ...s.teacherText, color: 'rgba(255,255,255,0.8)' }}>
                                    {entry.teacher_name}
                                  </div>
                                )}
                                {entry.class_name && (
                                  <div style={{ ...s.teacherText, color: 'rgba(255,255,255,0.8)' }}>
                                    {entry.class_name}
                                  </div>
                                )}
                                <button style={s.deleteBtn} onClick={() => handleDeleteEntry(entry.id)}>✕</button>
                              </div>
                            ) : (
                              <button style={s.addBtn} onClick={() => openEntryForm(day, slot.id)}>+</button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div style={s.footer}>
            <span style={s.footerLabel}>CLASS TEACHER: ___________________________</span>
            <span style={s.footerLabel}>SIGNATURE: ___________________________</span>
          </div>
        </div>
      )}

      {/* ── Defined time slots ── */}
      <div style={s.slotsSection}>
        <p style={s.slotsTitle}>Defined Time Slots</p>
        <div style={s.slotsList}>
          {slots.length === 0 ? (
            <span style={{ color: '#aaa', fontSize: 13 }}>No time slots defined yet.</span>
          ) : slots.map(sl => (
            <div key={sl.id} style={{ ...s.slotPill, ...(isBreakSlot(sl.name) ? s.slotPillBreak : {}) }}>
              <span>{sl.name}</span>
              <span style={s.slotPillTime}>{sl.start_time?.slice(0, 5)}–{sl.end_time?.slice(0, 5)}</span>
              <button style={s.slotDeleteBtn} onClick={() => handleDeleteSlot(sl.id)}>✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Add Time Slot Modal ── */}
      {showSlotForm && (
        <Modal onClose={() => setShowSlotForm(false)} title="Add Time Slot">
          <div style={s.modalBody}>
            {localError && <div style={s.formError}>{localError}</div>}
            <p style={s.hint}>Tip: name it "Break", "Lunch", or "Games" to mark it as a non-teaching period.</p>
            <div style={s.grid2}>
              <div>
                <label style={s.label}>Name *</label>
                <input style={s.input} value={slotForm.name} onChange={setS('name')} placeholder="e.g. Period 1, Break, Games" />
              </div>
              <div>
                <label style={s.label}>Sort Order</label>
                <input style={s.input} type="number" value={slotForm.sort_order} onChange={setS('sort_order')} placeholder="1" />
              </div>
              <div>
                <label style={s.label}>Start Time *</label>
                <input style={s.input} type="time" value={slotForm.start_time} onChange={setS('start_time')} />
              </div>
              <div>
                <label style={s.label}>End Time *</label>
                <input style={s.input} type="time" value={slotForm.end_time} onChange={setS('end_time')} />
              </div>
            </div>
          </div>
          <div style={s.modalFooter}>
            <Button variant="outline" onClick={() => setShowSlotForm(false)}>Cancel</Button>
            <Button onClick={handleCreateSlot} loading={saving} disabled={saving}>
              {saving ? 'Saving...' : 'Create Slot'}
            </Button>
          </div>
        </Modal>
      )}

      {/* ── Add Entry Modal ── */}
      {showEntryForm && (
        <Modal onClose={() => setShowEntryForm(false)} title="Add Timetable Entry">
          <div style={s.modalBody}>
            {(localError || saveError) && <div style={s.formError}>{localError || saveError}</div>}
            <div style={s.grid2}>
              <div>
                <label style={s.label}>Class *</label>
                <select style={s.input} value={entryForm.class_id} onChange={setE('class_id')}>
                  <option value="">Select class...</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Teacher</label>
                <select style={s.input} value={entryForm.staff_id} onChange={setE('staff_id')}>
                  <option value="">Select teacher...</option>
                  {staffList.map(st => <option key={st.id} value={st.id}>{st.firstName || st.first_name} {st.lastName || st.last_name}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Day *</label>
                <select style={s.input} value={entryForm.day_of_week} onChange={setE('day_of_week')}>
                  <option value="">Select day...</option>
                  {DAY_KEYS.map(d => <option key={d} value={d}>{DAYS[d]}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Period *</label>
                <select style={s.input} value={entryForm.slot_id} onChange={setE('slot_id')}>
                  <option value="">Select period...</option>
                  {teachableSlots.map(sl => (
                    <option key={sl.id} value={sl.id}>
                      {sl.name} ({sl.start_time?.slice(0, 5)}–{sl.end_time?.slice(0, 5)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={s.label}>Term *</label>
                <select style={s.input} value={entryForm.term_id} onChange={setE('term_id')}>
                  <option value="">Select term...</option>
                  {terms.map(t => <option key={t.id} value={t.id}>{t.year} Term {t.term}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Learning Area *</label>
                <select style={s.input} value={entryForm.subject_name} onChange={setE('subject_name')}>
                  <option value="">Select learning area...</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="English">English</option>
                  <option value="Kiswahili">Kiswahili</option>
                  <option value="Science">Science</option>
                  <option value="Social Studies">Social Studies</option>
                  <option value="Creative Arts">Creative Arts</option>
                  <option value="Agriculture">Agriculture</option>
                  <option value="Religious Education">Religious Education</option>
                </select>
              </div>
            </div>
          </div>
          <div style={s.modalFooter}>
            <Button variant="outline" onClick={() => setShowEntryForm(false)}>Cancel</Button>
            <Button onClick={handleCreateEntry} loading={saving} disabled={saving}>
              {saving ? 'Saving...' : 'Add Entry'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

const s = {
  page:     { padding: '24px 28px', fontFamily: 'inherit' },
  header:   { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title:    { fontSize: 24, fontWeight: 700, color: '#1a1a2e', margin: 0 },
  subtitle: { fontSize: 13, color: '#888', margin: '4px 0 0' },

  toolbar:  { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' },
  segmented:{ display: 'flex', border: '1.5px solid #e8e8e8', borderRadius: 8, overflow: 'hidden' },
  segment:  { padding: '8px 16px', background: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, color: '#888', transition: 'all 0.15s' },
  segmentActive: { background: '#6c63ff', color: '#fff', fontWeight: 600 },
  select:   { padding: '10px 14px', border: '1.5px solid #e8e8e8', borderRadius: 8, fontSize: 14, outline: 'none', color: '#1a1a2e', background: '#fff', minWidth: 180 },

  errorBanner: { background: '#fff0f0', border: '1px solid #ffcdd2', borderRadius: 8, padding: '10px 14px', color: '#c0392b', fontSize: 13, marginBottom: 16 },
  empty:    { textAlign: 'center', padding: '60px 24px', color: '#aaa', fontSize: 14 },

  // Timetable card
  card:     { background: '#fff', border: '2px solid #1a1a2e', borderRadius: 12, overflow: 'hidden', marginBottom: 24 },

  titleBar: { background: '#1a1a2e', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  ttTitle:  { fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '0.06em' },
  ttMeta:   { fontSize: 13, color: '#aab4c8' },

  legend:     { display: 'flex', flexWrap: 'wrap', gap: 10, padding: '10px 16px', borderBottom: '1px solid #eee', background: '#fafafa' },
  legendItem: { display: 'flex', alignItems: 'center', gap: 5 },
  legendDot:  { width: 10, height: 10, borderRadius: 3, flexShrink: 0 },
  legendLabel:{ fontSize: 10, color: '#444', fontWeight: 500 },

  table:    { width: '100%', borderCollapse: 'collapse', fontSize: 11 },

  // Header cells
  th:       { padding: '6px 4px', textAlign: 'center', fontWeight: 700, fontSize: 10, color: '#333', background: '#f0f0f0', border: '1px solid #ddd', whiteSpace: 'nowrap', minWidth: 72 },
  dayTh:    { minWidth: 46, background: '#1a1a2e', color: '#fff' },
  breakTh:  { background: '#fff9e6', color: '#b8860b' },
  // ── Narrow break columns so they don't dominate the layout
  breakThNarrow: { minWidth: 38, width: 38, maxWidth: 52 },

  slotName: { fontWeight: 700, fontSize: 10 },
  slotTime: { fontSize: 9, color: '#666', lineHeight: 1.2 },

  // Day label cells
  dayCell:  { background: '#1a1a2e', color: '#fff', fontWeight: 800, fontSize: 12, textAlign: 'center', padding: '0 8px', border: '1px solid #333', letterSpacing: '0.05em', minWidth: 46 },

  // Break body cells — narrow + compact
  breakBodyCell: { background: '#fff9e6', border: '1px solid #f0e0a0', textAlign: 'center', padding: '4px 2px', width: 38, maxWidth: 52 },
  breakLabel:    { fontSize: 9, color: '#b8860b', fontWeight: 700, writingMode: 'vertical-rl', transform: 'rotate(180deg)', margin: '0 auto', lineHeight: 1.2 },

  // Entry cells — reduced height for compactness
  entryTd:  { padding: 2, border: '1px solid #e8e8e8', minWidth: 72, height: 46 },
  entryCard:{ borderRadius: 4, padding: '4px 6px', height: '100%', boxSizing: 'border-box', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  subjectText: { fontWeight: 700, fontSize: 10, lineHeight: 1.3 },
  teacherText: { fontSize: 9, marginTop: 2, lineHeight: 1.2 },
  deleteBtn:   { position: 'absolute', top: 2, right: 3, background: 'none', border: 'none', cursor: 'pointer', fontSize: 9, padding: 0, color: 'rgba(255,255,255,0.6)' },
  addBtn:      { width: '100%', height: '100%', minHeight: 42, background: 'none', border: '1.5px dashed #e0e0e0', borderRadius: 4, color: '#ddd', fontSize: 14, cursor: 'pointer' },

  footer:      { borderTop: '2px solid #1a1a2e', padding: '10px 20px', display: 'flex', gap: 40, background: '#fafafa' },
  footerLabel: { fontSize: 11, fontWeight: 600, color: '#444', letterSpacing: '0.03em' },

  slotsSection: { marginTop: 8 },
  slotsTitle:   { fontSize: 11, fontWeight: 700, color: '#6c63ff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 },
  slotsList:    { display: 'flex', flexWrap: 'wrap', gap: 8 },
  slotPill:     { display: 'flex', alignItems: 'center', gap: 8, background: '#f3f1ff', border: '1px solid #d4d0ff', borderRadius: 999, padding: '5px 12px', fontSize: 12, color: '#6c63ff' },
  slotPillBreak:{ background: '#fffbea', border: '1px solid #f0e0a0', color: '#b8860b' },
  slotPillTime: { color: '#aaa', fontSize: 11 },
  slotDeleteBtn:{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: 12, padding: 0 },

  modalBody:   { padding: '20px 24px', overflowY: 'auto', maxHeight: '60vh' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '16px 24px', borderTop: '1px solid #f0f0f0' },
  formError:   { background: '#fff0f0', border: '1px solid #ffcdd2', borderRadius: 8, padding: '10px 14px', color: '#c0392b', fontSize: 13, marginBottom: 16 },
  hint:        { fontSize: 12, color: '#aaa', margin: '0 0 16px', fontStyle: 'italic' },
  grid2:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  label:       { display: 'block', fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' },
  input:       { width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1.5px solid #e8e8e8', borderRadius: 8, fontSize: 14, color: '#1a1a2e', outline: 'none' },
};