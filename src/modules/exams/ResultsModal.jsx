/**
 * ResultsModal.jsx
 * Enter, view, and export exam results — with pagination for large classes
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../../config/api';
import {
  fetchExamSubjects,
  fetchExamStatistics,
  selectExamSubjects,
  selectExamStatistics,
  selectExamLoading,
  selectExamErrors,
} from './exam.slice';
import { styles } from './examConstants';
import { TypeBadge, StatusBadge, StatCard } from './ExamPrimitives';

// ─── Grade helper ─────────────────────────────────────────────────────────────
const getGrade = (pct) => {
  if (pct === null || pct === undefined) return null;
  if (pct >= 80) return 'EE';
  if (pct >= 60) return 'ME';
  if (pct >= 40) return 'AE';
  return 'BE';
};

const GRADE_STYLE = {
  EE: { background: '#DCFCE7', color: '#166534' },
  ME: { background: '#DBEAFE', color: '#1E40AF' },
  AE: { background: '#FEF9C3', color: '#854D0E' },
  BE: { background: '#FEE2E2', color: '#991B1B' },
};

// ─── Pagination config ────────────────────────────────────────────────────────
const PAGE_SIZE_OPTIONS = [10, 15, 20, 25, 40];
const DEFAULT_PAGE_SIZE = 15;

// ─── Rank helper ──────────────────────────────────────────────────────────────
const computeRanks = (students, subjects, marks) => {
  const totals = students.map(st => {
    let total = 0; let filled = 0;
    subjects.forEach(s => {
      const v = marks[st.id]?.[s.id];
      if (v !== undefined && v !== '') { total += parseFloat(v); filled++; }
    });
    return { id: st.id, total: filled === subjects.length ? total : null };
  });
  const sorted = [...totals].sort((a, b) => (b.total ?? -1) - (a.total ?? -1));
  const rankMap = {};
  sorted.forEach((r, i) => { rankMap[r.id] = r.total !== null ? i + 1 : null; });
  return rankMap;
};

// ─── Print helpers ────────────────────────────────────────────────────────────
const printMarkList = (exam, subjects, students, marks, schoolName, className) => {
  const maxTotal       = subjects.reduce((a, s) => a + s.max_marks, 0);
  const rankMap        = computeRanks(students, subjects, marks);
  const sortedStudents = [...students].sort((a, b) => {
    const ra = rankMap[a.id] ?? Infinity;
    const rb = rankMap[b.id] ?? Infinity;
    return ra - rb;
  });

  const studentRows = sortedStudents.map((st, i) => {
    let total = 0; let filled = 0;
    const subjectCells = subjects.map(s => {
      const v = marks[st.id]?.[s.id];
      const hasVal = v !== undefined && v !== '';
      if (hasVal) { total += parseFloat(v); filled++; }
      const pct   = hasVal ? Math.round((parseFloat(v) / s.max_marks) * 100) : null;
      const grade = getGrade(pct);
      const gs    = grade ? `background:${GRADE_STYLE[grade].background};color:${GRADE_STYLE[grade].color};` : '';
      return `
        <td class="c">${hasVal ? v : '—'}</td>
        <td class="c">${pct !== null ? pct + '%' : '—'}</td>
        <td class="c"><span style="${gs}padding:1px 4px;border-radius:3px;font-weight:700">${grade || '—'}</span></td>`;
    }).join('');
    const allFilled = filled === subjects.length;
    const avg       = allFilled ? Math.round((total / maxTotal) * 100) : null;
    const overall   = getGrade(avg);
    const oGs       = overall ? `background:${GRADE_STYLE[overall].background};color:${GRADE_STYLE[overall].color};` : '';
    return `
      <tr>
        <td class="c">${i + 1}</td>
        <td class="name">${st.firstName} ${st.lastName}</td>
        <td class="c mono">${st.admissionNo}</td>
        ${subjectCells}
        <td class="c bold">${allFilled ? total : '—'}</td>
        <td class="c">${avg !== null ? avg + '%' : '—'}</td>
        <td class="c"><span style="${oGs}padding:1px 4px;border-radius:3px;font-weight:700">${overall || '—'}</span></td>
        <td class="c bold">${rankMap[st.id] ?? '—'}</td>
      </tr>`;
  }).join('');

  const subjectSums = subjects.map(s => {
    let sum = 0; let cnt = 0;
    students.forEach(st => {
      const v = marks[st.id]?.[s.id];
      if (v !== undefined && v !== '') { sum += parseFloat(v); cnt++; }
    });
    return { sum, avg: cnt ? Math.round(sum / cnt) : 0 };
  });

  const sumCells = subjectSums.map(s => `<td class="c bold">${s.sum}</td><td class="c"></td><td class="c"></td>`).join('');
  const avgCells = subjectSums.map(s => `<td class="c">${s.avg}</td><td class="c"></td><td class="c"></td>`).join('');
  const subjectHeaders = subjects.map(s =>
    `<th colspan="3" class="subj-hdr">${s.subject_name}<br><span style="font-weight:400;font-size:9px">/${s.max_marks}</span></th>`
  ).join('');
  const subSubHeaders = subjects.map(() =>
    `<th class="sub-h">Marks</th><th class="sub-h">%</th><th class="sub-h">Grd</th>`
  ).join('');

  const w = window.open('', '_blank');
  w.document.write(`
    <html><head><title>${exam.name} — Mark List</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:Arial,sans-serif;font-size:11px;color:#111;padding:14px}
      .hdr{text-align:center;margin-bottom:10px}
      .hdr h1{font-size:15px;font-weight:800;text-transform:uppercase}
      .hdr h2{font-size:13px;font-weight:700;margin-top:3px}
      .hdr h3{font-size:11px;color:#374151;margin-top:2px}
      table{width:100%;border-collapse:collapse;margin-top:8px}
      th,td{border:1px solid #D1D5DB;padding:3px 4px}
      th{background:#F3F4F6;font-size:9px;text-transform:uppercase;text-align:center}
      .subj-hdr{background:#E0E7FF;font-size:10px;text-align:center}
      .sub-h{background:#F9FAFB;font-size:9px;text-align:center}
      td.c{text-align:center} td.name{font-weight:600;white-space:nowrap}
      td.mono{font-family:monospace;font-size:10px;color:#6B7280}
      td.bold{font-weight:700} tr.sum td{background:#F9FAFB;font-weight:700}
      tr.avg td{background:#F0FDF4}
      .legend{margin-top:8px;font-size:9px;color:#6B7280}
    </style></head>
    <body>
      <div class="hdr">
        <h1>${schoolName || 'School'}</h1>
        <h2>${exam.name}</h2>
        <h3>${exam.exam_type} · ${exam.term_name || ''} · ${className} · Printed ${new Date().toLocaleDateString('en-KE')}</h3>
      </div>
      <table>
        <thead>
          <tr>
            <th rowspan="2">#</th>
            <th rowspan="2" style="min-width:120px">Student Name</th>
            <th rowspan="2">Adm No</th>
            ${subjectHeaders}
            <th colspan="3">Overall</th>
            <th rowspan="2">Position</th>
          </tr>
          <tr>${subSubHeaders}<th class="sub-h">Total</th><th class="sub-h">Avg%</th><th class="sub-h">Grd</th></tr>
        </thead>
        <tbody>
          ${studentRows}
          <tr class="sum"><td colspan="3" class="c">SUM</td>${sumCells}<td colspan="4"></td></tr>
          <tr class="avg"><td colspan="3" class="c">AVERAGE</td>${avgCells}<td colspan="4"></td></tr>
        </tbody>
      </table>
      <p class="legend">EE ≥80% · ME 60–79% · AE 40–59% · BE &lt;40%</p>
    </body></html>
  `);
  w.document.close(); w.print();
};

const printResultSlips = (exam, subjects, students, marks, schoolName, className) => {
  const maxTotal = subjects.reduce((a, s) => a + s.max_marks, 0);
  const rankMap  = computeRanks(students, subjects, marks);

  const slips = students.map(st => {
    let total = 0; let filled = 0;
    const subjectRows = subjects.map(s => {
      const v = marks[st.id]?.[s.id];
      const hasVal = v !== undefined && v !== '';
      if (hasVal) { total += parseFloat(v); filled++; }
      const pct   = hasVal ? Math.round((parseFloat(v) / s.max_marks) * 100) : null;
      const grade = getGrade(pct);
      const gs    = grade ? `background:${GRADE_STYLE[grade].background};color:${GRADE_STYLE[grade].color}` : 'background:#F3F4F6;color:#6B7280';
      return `<tr>
        <td class="sname">${s.subject_name}</td>
        <td class="c">${s.max_marks}</td>
        <td class="c bold">${hasVal ? v : '—'}</td>
        <td class="c">${pct !== null ? pct + '%' : '—'}</td>
        <td class="c"><span style="${gs};padding:2px 8px;border-radius:4px;font-weight:700;font-size:11px">${grade || '—'}</span></td>
      </tr>`;
    }).join('');
    const allFilled = filled === subjects.length;
    const avg       = allFilled ? (total / maxTotal * 100) : null;
    const overall   = getGrade(avg);
    const oGs       = overall ? `background:${GRADE_STYLE[overall].background};color:${GRADE_STYLE[overall].color}` : '';
    return `
      <div class="slip">
        <div class="slip-hdr">
          <h1>${schoolName || 'School'}</h1>
          <h2>${exam.name}</h2>
          <h3>${exam.exam_type} · ${exam.term_name || ''} · ${className}</h3>
        </div>
        <div class="info-grid">
          <div><span class="lbl">Name:</span> <strong>${st.firstName} ${st.lastName}</strong></div>
          <div><span class="lbl">Adm No:</span> <span class="mono">${st.admissionNo}</span></div>
          <div><span class="lbl">Class:</span> ${className}</div>
          <div><span class="lbl">Position:</span> <strong>${rankMap[st.id] ? rankMap[st.id] + ' of ' + students.length : '—'}</strong></div>
        </div>
        <table>
          <thead><tr><th style="text-align:left">Subject</th><th>Out of</th><th>Marks</th><th>%</th><th>Grade</th></tr></thead>
          <tbody>${subjectRows}</tbody>
          <tfoot>
            <tr class="total-row">
              <td class="bold">TOTAL</td>
              <td class="c">${maxTotal}</td>
              <td class="c bold">${allFilled ? total : '—'}</td>
              <td class="c">${avg !== null ? avg.toFixed(1) + '%' : '—'}</td>
              <td class="c"><span style="${oGs};padding:2px 8px;border-radius:4px;font-weight:700">${overall || '—'}</span></td>
            </tr>
          </tfoot>
        </table>
        <div class="legend">EE ≥80% · ME 60–79% · AE 40–59% · BE &lt;40%</div>
      </div>`;
  }).join('<div class="break"></div>');

  const w = window.open('', '_blank');
  w.document.write(`
    <html><head><title>${exam.name} — Result Slips</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:Arial,sans-serif;font-size:12px;color:#111}
      .slip{padding:24px 28px;max-width:600px;margin:0 auto}
      .break{page-break-after:always;height:0}
      .slip-hdr{text-align:center;border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:12px}
      .slip-hdr h1{font-size:16px;font-weight:800;text-transform:uppercase}
      .slip-hdr h2{font-size:13px;font-weight:700;margin-top:3px}
      .slip-hdr h3{font-size:11px;color:#374151;margin-top:2px}
      .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;margin-bottom:14px;font-size:12px}
      .lbl{color:#6B7280;font-size:11px} .mono{font-family:monospace;font-size:11px;color:#6B7280}
      table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #E5E7EB;padding:6px 10px}
      th{background:#F9FAFB;font-size:10px;text-transform:uppercase;text-align:center}
      td.c{text-align:center} td.sname{font-weight:500} td.bold{font-weight:700;text-align:center}
      tr.total-row td{background:#F3F4F6;font-weight:700;border-top:2px solid #D1D5DB}
      .legend{margin-top:10px;font-size:10px;color:#9CA3AF;text-align:center}
      @media print{.break{page-break-after:always}}
    </style></head>
    <body>${slips}</body></html>
  `);
  w.document.close(); w.print();
};

// ─── Pagination Component ─────────────────────────────────────────────────────
const Pagination = ({ currentPage, totalPages, totalStudents, pageSize, onPageChange, onPageSizeChange }) => {
  if (totalStudents === 0) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) pages.push(i);

  const btnStyle = (active) => ({
    padding: '5px 10px',
    borderRadius: 6,
    border: `1.5px solid ${active ? '#2563EB' : '#E5E7EB'}`,
    background: active ? '#2563EB' : '#fff',
    color: active ? '#fff' : '#374151',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: active ? 700 : 400,
    minWidth: 34,
    textAlign: 'center',
    fontFamily: 'inherit',
  });

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 24px', borderTop: '1px solid #F3F4F6',
      background: '#FAFAFA', flexWrap: 'wrap', gap: 8,
    }}>
      {/* Left — page size + info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: '#6B7280' }}>
        <span>Rows per page:</span>
        <select
          value={pageSize}
          onChange={e => onPageSizeChange(Number(e.target.value))}
          style={{
            padding: '4px 8px', borderRadius: 6, border: '1.5px solid #E5E7EB',
            fontSize: 13, color: '#374151', background: '#fff', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          {PAGE_SIZE_OPTIONS.map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <span>
          {Math.min((currentPage - 1) * pageSize + 1, totalStudents)}–{Math.min(currentPage * pageSize, totalStudents)} of {totalStudents} students
        </span>
      </div>

      {/* Right — page buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          style={{ ...btnStyle(false), opacity: currentPage === 1 ? 0.4 : 1 }}
        >«</button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{ ...btnStyle(false), opacity: currentPage === 1 ? 0.4 : 1 }}
        >‹</button>

        {pages.map(p => {
          // Show first, last, current and neighbors
          const show = p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1;
          const showDots = !show && (p === 2 || p === totalPages - 1);
          if (showDots) return <span key={p} style={{ padding: '0 4px', color: '#9CA3AF' }}>…</span>;
          if (!show) return null;
          return (
            <button key={p} onClick={() => onPageChange(p)} style={btnStyle(p === currentPage)}>
              {p}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{ ...btnStyle(false), opacity: currentPage === totalPages ? 0.4 : 1 }}
        >›</button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          style={{ ...btnStyle(false), opacity: currentPage === totalPages ? 0.4 : 1 }}
        >»</button>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const ResultsModal = ({ exam, onClose }) => {
  const dispatch = useDispatch();
  const subjects = useSelector(selectExamSubjects);
  const loading  = useSelector(selectExamLoading);
  const errors   = useSelector(selectExamErrors);

  const [students,    setStudents]    = useState([]);
  const [marks,       setMarks]       = useState({});
  const [inputErrs,   setInputErrs]   = useState({});
  const [saving,      setSaving]      = useState(false);
  const [saveMsg,     setSaveMsg]     = useState(null);
  const [fetchErr,    setFetchErr]    = useState(null);
  const [studLoading, setStudLoading] = useState(false);
  const [schoolName,  setSchoolName]  = useState('');
  const [smsSending,  setSmsSending]  = useState(false);
  const [smsMsg,      setSmsMsg]      = useState(null);

  // ── Pagination state ──────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize,    setPageSize]    = useState(DEFAULT_PAGE_SIZE);

  const authUser = useSelector(state => state.auth?.user);

  useEffect(() => {
    dispatch(fetchExamSubjects(exam.id));
    dispatch(fetchExamStatistics(exam.id));
    loadStudents();
    const name = authUser?.school?.name || authUser?.schoolName || authUser?.school || '';
    setSchoolName(name);
  }, [exam.id, authUser]);

  // Reset to page 1 when page size changes
  useEffect(() => { setCurrentPage(1); }, [pageSize]);

  const loadStudents = async () => {
    if (!exam.class_id) {
      setFetchErr('This exam has no class assigned. Edit the exam to assign a class.');
      return;
    }
    setStudLoading(true);
    setFetchErr(null);
    try {
      const res = await api.get('/students', {
        params: { class_id: exam.class_id, is_active: true, limit: 200 },
      });
      setStudents(res.data?.data || []);
      try {
        const rRes = await api.get(`/exams/${exam.id}/results`);
        const existing = rRes.data?.data || [];
        const prefilled = {};
        existing.forEach(r => {
          if (!prefilled[r.student_id]) prefilled[r.student_id] = {};
          prefilled[r.student_id][r.subject_id] = r.marks;
        });
        setMarks(prefilled);
      } catch { /* no existing results */ }
    } catch {
      setFetchErr('Failed to load students. Check the class assigned to this exam.');
    } finally {
      setStudLoading(false);
    }
  };

  // ── Pagination computed values ────────────────────────────────────────────
  const totalPages   = Math.max(1, Math.ceil(students.length / pageSize));
  const pagedStudents = students.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePageChange = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };
  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // ── Mark entry ────────────────────────────────────────────────────────────
  const handleMark = (sid, subId, max, val) => {
    const key     = `${sid}-${subId}`;
    const num     = parseFloat(val);
    const invalid = val !== '' && (isNaN(num) || num < 0 || num > max);
    setInputErrs(e => ({ ...e, [key]: invalid }));
    setMarks(m => ({
      ...m,
      [sid]: { ...m[sid], [subId]: invalid || val === '' ? undefined : num },
    }));
  };

  // ── Row summary ───────────────────────────────────────────────────────────
  const rowSummary = (sid) => {
    if (!subjects?.length) return { total: null, grade: null, allFilled: false };
    const maxTotal = subjects.reduce((a, s) => a + s.max_marks, 0);
    let total = 0; let allFilled = true;
    subjects.forEach(s => {
      const v = marks[sid]?.[s.id];
      if (v !== undefined) total += v;
      else allFilled = false;
    });
    if (!allFilled && total === 0) return { total: null, grade: null, allFilled: false };
    const pct = allFilled ? (total / maxTotal) * 100 : null;
    return { total, grade: getGrade(pct), allFilled };
  };

  // ── Live stats (all students, not just current page) ─────────────────────
  const liveStats = () => {
    const totalCells = students.length * (subjects?.length || 0);
    let entered = 0; const pcts = [];
    students.forEach(st => {
      subjects?.forEach(s => {
        const v = marks[st.id]?.[s.id];
        if (v !== undefined) { entered++; pcts.push((v / s.max_marks) * 100); }
      });
    });
    return {
      entered,
      completion: totalCells ? Math.round((entered / totalCells) * 100) : 0,
      avg:        pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : null,
      highest:    pcts.length ? Math.round(Math.max(...pcts)) : null,
    };
  };

  // ── Save (saves ALL students, not just current page) ──────────────────────
  const handleSave = async () => {
    setSaving(true); setSaveMsg(null);
    try {
      const results = [];
      students.forEach(st => {
        subjects?.forEach(s => {
          const v = marks[st.id]?.[s.id];
          if (v !== undefined) {
            results.push({ exam_id: exam.id, student_id: st.id, subject_id: s.id, marks: v, grade: getGrade((v / s.max_marks) * 100) });
          }
        });
      });
      if (results.length === 0) { setSaveMsg({ type: 'error', text: 'No marks entered yet.' }); return; }
      await api.post(`/exams/${exam.id}/results/bulk`, { results });
      dispatch(fetchExamStatistics(exam.id));
      setSaveMsg({ type: 'success', text: `Saved ${results.length} result${results.length !== 1 ? 's' : ''} successfully.` });
    } catch (err) {
      setSaveMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save results.' });
    } finally { setSaving(false); }
  };

  // ── Send SMS ──────────────────────────────────────────────────────────────
  const handleSendSms = async () => {
    if (!window.confirm(`Send result SMS to parents of ${students.length} student(s)?`)) return;
    setSmsSending(true); setSmsMsg(null);
    try {
      const res = await api.post(`/exams/${exam.id}/results/send-sms`);
      const d   = res.data?.data;
      setSmsMsg({ type: 'success', text: `SMS sent: ${d?.sent} delivered, ${d?.failed} failed, ${d?.skipped} skipped.` });
    } catch (err) {
      setSmsMsg({ type: 'error', text: err.response?.data?.message || 'Failed to send SMS.' });
    } finally { setSmsSending(false); }
  };

  const ls        = liveStats();
  const className = exam.class_name || '';

  const thStyle = {
    padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700,
    color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em',
    borderBottom: '1px solid #E5E7EB', background: '#F9FAFB', whiteSpace: 'nowrap',
    position: 'sticky', top: 0, zIndex: 1,
  };
  const tdStyle = { padding: '8px 12px', borderBottom: '1px solid #F3F4F6', verticalAlign: 'middle' };

  return (
    <div style={styles.overlay}>
      <div style={{ ...styles.modal, maxWidth: 960, maxHeight: '93vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={styles.modalHeader}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
              Results — {exam.name}
            </div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TypeBadge type={exam.exam_type} />
              <StatusBadge status={exam.status} />
              {exam.term_name  && <span>· {exam.term_name}</span>}
              {exam.class_name && <span>· {exam.class_name}</span>}
            </div>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        {/* Stats bar */}
        <div style={{ display: 'flex', gap: 12, padding: '14px 24px', borderBottom: '1px solid #F3F4F6', flexWrap: 'wrap' }}>
          <StatCard label="Students"   value={students.length}                                gradient="linear-gradient(135deg,#2563EB,#1d4ed8)" />
          <StatCard label="Entered"    value={`${ls.entered}/${students.length * (subjects?.length || 0)}`} gradient="linear-gradient(135deg,#7c3aed,#6d28d9)" />
          <StatCard label="Completion" value={`${ls.completion}%`}                            gradient="linear-gradient(135deg,#059669,#047857)" />
          <StatCard label="Class Avg"  value={ls.avg !== null ? `${ls.avg}%` : '—'}           gradient="linear-gradient(135deg,#f59e0b,#d97706)" />
          <StatCard label="Highest"    value={ls.highest !== null ? `${ls.highest}%` : '—'}   gradient="linear-gradient(135deg,#0891b2,#0369a1)" />
        </div>

        {/* Toolbar */}
        <div style={{ padding: '10px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 12, color: '#9CA3AF' }}>
            EE ≥80% · ME 60–79% · AE 40–59% · BE &lt;40%
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { setMarks({}); setInputErrs({}); }}
              style={{ padding: '7px 14px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#374151', fontFamily: 'inherit' }}>
              Clear all
            </button>
            <button onClick={() => printMarkList(exam, subjects || [], students, marks, schoolName, className)}
              style={{ padding: '7px 14px', borderRadius: 6, border: 'none', background: '#16A34A', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
              🖨 Mark List
            </button>
            <button onClick={() => printResultSlips(exam, subjects || [], students, marks, schoolName, className)}
              style={{ padding: '7px 14px', borderRadius: 6, border: 'none', background: '#2563EB', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
              🖨 Result Slips
            </button>
            <button onClick={handleSendSms} disabled={smsSending}
              style={{ padding: '7px 14px', borderRadius: 6, border: 'none', background: smsSending ? '#9CA3AF' : '#7C3AED', color: '#fff', cursor: smsSending ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
              {smsSending ? 'Sending…' : ' SMS Parents'}
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
          {fetchErr || errors.subjects ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#DC2626', fontSize: 14 }}>⚠ {fetchErr || errors.subjects}</div>
          ) : loading.subjects || studLoading ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#9CA3AF' }}>
              <div style={{ fontSize: 30, marginBottom: 10 }}></div>Loading students and subjects…
            </div>
          ) : students.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#9CA3AF' }}>
              <div style={{ fontSize: 38, marginBottom: 10 }}></div>
              <div style={{ fontWeight: 700, color: '#374151', marginBottom: 4 }}>No students found</div>
              <div style={{ fontSize: 13 }}>Make sure students are assigned to this exam's class</div>
            </div>
          ) : !subjects?.length ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#9CA3AF' }}>
              <div style={{ fontSize: 38, marginBottom: 10 }}></div>
              <div style={{ fontWeight: 700, color: '#374151', marginBottom: 4 }}>No subjects added</div>
              <div style={{ fontSize: 13 }}>Add subjects to this exam first using the Subjects button</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: 36, textAlign: 'center' }}>#</th>
                  <th style={{ ...thStyle, minWidth: 160 }}>Student</th>
                  <th style={{ ...thStyle, minWidth: 90 }}>Adm No</th>
                  {subjects.map(s => (
                    <th key={s.id} style={{ ...thStyle, minWidth: 90, textAlign: 'center' }}>
                      {s.subject_name}
                      <span style={{ display: 'block', fontWeight: 400, textTransform: 'none', fontSize: 10, letterSpacing: 0 }}>
                        / {s.max_marks}
                      </span>
                    </th>
                  ))}
                  <th style={{ ...thStyle, minWidth: 70, textAlign: 'center' }}>Total</th>
                  <th style={{ ...thStyle, minWidth: 60, textAlign: 'center' }}>Grade</th>
                </tr>
              </thead>
              <tbody>
                {pagedStudents.map((st, idx) => {
                  const { total, grade, allFilled } = rowSummary(st.id);
                  const gs = grade ? GRADE_STYLE[grade] : { background: '#F3F4F6', color: '#9CA3AF' };
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={st.id}
                      onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      <td style={{ ...tdStyle, textAlign: 'center', color: '#9CA3AF', fontSize: 12 }}>{globalIdx}</td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: '#111827' }}>{st.firstName} {st.lastName}</td>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 12, color: '#9CA3AF' }}>{st.admissionNo}</td>
                      {subjects.map(s => {
                        const key   = `${st.id}-${s.id}`;
                        const isErr = inputErrs[key];
                        return (
                          <td key={s.id} style={{ ...tdStyle, textAlign: 'center' }}>
                            <input
                              type="number" min={0} max={s.max_marks} placeholder="—"
                              value={marks[st.id]?.[s.id] ?? ''}
                              onChange={e => handleMark(st.id, s.id, s.max_marks, e.target.value)}
                              style={{
                                width: 60, padding: '5px 8px', borderRadius: 5,
                                border: `1.5px solid ${isErr ? '#DC2626' : '#E5E7EB'}`,
                                background: isErr ? '#FEF2F2' : '#FAFAFA',
                                fontSize: 13, textAlign: 'center', outline: 'none',
                                color: '#111827', fontFamily: 'inherit',
                              }}
                            />
                            {isErr && <div style={{ fontSize: 10, color: '#DC2626', marginTop: 2 }}>max {s.max_marks}</div>}
                          </td>
                        );
                      })}
                      <td style={{ ...tdStyle, fontWeight: 700, color: '#111827', textAlign: 'center' }}>
                        {total !== null ? `${total}${allFilled ? '' : '+'}` : '—'}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span style={{ ...gs, borderRadius: 5, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>
                          {grade || '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Pagination ─────────────────────────────────────────────────────── */}
        {students.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalStudents={students.length}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )}

        {/* Footer */}
        <div style={{ ...styles.modalFooter, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {saveMsg && (
              <span style={{ fontSize: 13, color: saveMsg.type === 'success' ? '#16A34A' : '#DC2626', fontWeight: 500 }}>
                {saveMsg.type === 'success' ? '✓' : '⚠'} {saveMsg.text}
              </span>
            )}
            {smsMsg && (
              <span style={{ fontSize: 13, color: smsMsg.type === 'success' ? '#7C3AED' : '#DC2626', fontWeight: 500 }}>
                {smsMsg.text}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={styles.btnSecondary}>Close</button>
            <button onClick={handleSave} disabled={saving} style={styles.btnPrimary(saving)}>
              {saving ? 'Saving…' : 'Save Results'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};