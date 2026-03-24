import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { analyzeResults, clearAIResult } from '../ai.slice';
import api from '../../../config/api';

export default function ExamAnalyzer() {
  const dispatch = useDispatch();
  const { result, loading, error } = useSelector(state => state.ai);

  const [exams,    setExams]    = useState([]);
  const [classes,  setClasses]  = useState([]);
  const [students, setStudents] = useState([]);
  const [scores,   setScores]   = useState([]);
  const [history,  setHistory]  = useState(null);
  const [metrics,  setMetrics]  = useState(null);

  const [selectedExam,    setSelectedExam]    = useState('');
  const [selectedClass,   setSelectedClass]   = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');

  const [loadingMarks,    setLoadingMarks]    = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Load exams and classes on mount
  useEffect(() => {
    api.get('/exams').then(res => {
      const data = res.data?.data ?? res.data ?? [];
      setExams(Array.isArray(data) ? data : (data.exams ?? []));
    }).catch(() => {});

    api.get('/classes').then(res => {
      const data = res.data?.data ?? res.data ?? [];
      setClasses(Array.isArray(data) ? data : (data.classes ?? []));
    }).catch(() => {});
  }, []);

  // Load students when class changes
  useEffect(() => {
    if (!selectedClass) return;
    setStudents([]);
    setSelectedStudent('');
    setScores([]);
    setHistory(null);
    setMetrics(null);
    dispatch(clearAIResult());
    setLoadingStudents(true);

    api.get(`/classes/${selectedClass}/students`)
      .then(res => {
        const data = res.data?.data ?? res.data ?? [];
        setStudents(Array.isArray(data) ? data : (data.students ?? []));
      })
      .catch(() => {})
      .finally(() => setLoadingStudents(false));
  }, [selectedClass]);

  // Auto-populate marks + fetch history
  useEffect(() => {
    if (!selectedExam || !selectedStudent) return;
    setScores([]);
    setHistory(null);
    setMetrics(null);
    dispatch(clearAIResult());
    setLoadingMarks(true);

    // Fetch current exam scores
    api.get(`/exams/${selectedExam}/results/${selectedStudent}`)
      .then(res => {
        const data    = res.data?.data ?? res.data ?? [];
        const results = Array.isArray(data) ? data : (data.results ?? data.subjects ?? []);
        const mapped  = results.map(r => ({
          subject: r.subject_name ?? r.subject ?? r.name,
          score:   r.score ?? r.marks ?? r.total ?? '',
        }));
        setScores(mapped);

        // Compute metrics locally for UI
        const values   = mapped.map(s => parseFloat(s.score)).filter(n => !isNaN(n));
        if (values.length) {
          const avg      = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
          const strongest = mapped.reduce((a, b) => parseFloat(a.score) > parseFloat(b.score) ? a : b);
          const weakest   = mapped.reduce((a, b) => parseFloat(a.score) < parseFloat(b.score) ? a : b);
          const atRisk    = mapped.filter(s => parseFloat(s.score) < 50);
          const riskLevel = avg < 50 ? 'HIGH' : avg < 65 ? 'MEDIUM' : 'LOW';
          setMetrics({ avg, strongest, weakest, atRisk, riskLevel });
        }
      })
      .catch(() => setScores([]))
      .finally(() => setLoadingMarks(false));

    // Fetch previous exam for history
    const previousExam = exams
      .filter(e => String(e.id) !== String(selectedExam))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

    if (previousExam) {
      api.get(`/exams/${previousExam.id}/results/${selectedStudent}`)
        .then(res => {
          const data    = res.data?.data ?? res.data ?? [];
          const results = Array.isArray(data) ? data : (data.results ?? data.subjects ?? []);
          const values  = results.map(r => parseFloat(r.score ?? r.marks ?? 0)).filter(n => !isNaN(n));
          if (values.length) {
            const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
            setHistory({ average: avg, examName: previousExam.name });
          }
        }).catch(() => {});
    }
  }, [selectedExam, selectedStudent]);

  const studentObj = students.find(s => String(s.id) === String(selectedStudent));
  const fullName   = studentObj
    ? `${studentObj.first_name ?? ''} ${studentObj.last_name ?? ''}`.trim()
    : '';

  const handleAnalyze = () => {
    const filledScores = scores.filter(s =>
      s.score !== '' && s.score !== null && s.score !== undefined
    );
    if (!filledScores.length) return;

    // Send structured data — backend builds the prompt
    dispatch(analyzeResults({
      studentName: fullName,
      scores:      filledScores,
      history:     history || null,
    }));
  };

  const handleClear = () => {
    dispatch(clearAIResult());
    setSelectedExam('');
    setSelectedClass('');
    setSelectedStudent('');
    setScores([]);
    setHistory(null);
    setMetrics(null);
  };

  // Risk color helper
  const riskColor = (level) => ({
    HIGH:   { bg: '#fee2e2', color: '#dc2626' },
    MEDIUM: { bg: '#fef3c7', color: '#d97706' },
    LOW:    { bg: '#dcfce7', color: '#16a34a' },
  }[level] || { bg: '#f3f4f6', color: '#6b7280' });

  // Parse result sections from AI markdown
  const parseSection = (text, heading) => {
    if (!text) return null;
    const regex = new RegExp(`## ${heading}\\n([\\s\\S]*?)(?=##|$)`);
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  };

  const aiSections = result ? {
    summary:    parseSection(result.analysis ?? result, 'Performance Summary'),
    risk:       parseSection(result.analysis ?? result, 'Risk Assessment'),
    breakdown:  parseSection(result.analysis ?? result, 'Subject Breakdown'),
    recommendations: parseSection(result.analysis ?? result, 'Recommendations'),
  } : null;

  // Use metrics from API response if available, else local
  const displayMetrics = result?.metrics || metrics;

  return (
    <div style={s.wrapper}>

      {/* Header */}
      <div style={s.header}>
        <span style={s.badge}>AI</span>
        <h3 style={s.title}>Exam Results Analyzer</h3>
        {displayMetrics && (
          <span style={{
            ...s.riskBadge,
            background: riskColor(displayMetrics.riskLevel).bg,
            color:      riskColor(displayMetrics.riskLevel).color,
          }}>
            {displayMetrics.riskLevel} RISK
          </span>
        )}
      </div>

      {/* Selectors */}
      <div style={s.grid3}>
        <div>
          <div style={s.label}>Exam</div>
          <select style={s.select} value={selectedExam}
            onChange={e => { setSelectedExam(e.target.value); setScores([]); setMetrics(null); dispatch(clearAIResult()); }}>
            <option value="">Select exam...</option>
            {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div>
          <div style={s.label}>Class</div>
          <select style={s.select} value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}>
            <option value="">Select class...</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <div style={s.label}>Student</div>
          <select style={s.select} value={selectedStudent}
            onChange={e => setSelectedStudent(e.target.value)}
            disabled={!selectedClass || loadingStudents}>
            <option value="">
              {loadingStudents ? 'Loading...' : 'Select student...'}
            </option>
            {students.map(st => (
              <option key={st.id} value={st.id}>
                {st.first_name} {st.last_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Metrics Row — shows before AI analysis */}
      {displayMetrics && (
        <div style={s.metricsRow}>
          <div style={s.metricCard}>
            <span style={s.metricLabel}>Average</span>
            <span style={s.metricValue}>{displayMetrics.avg ?? displayMetrics.average}%</span>
          </div>
          <div style={s.metricCard}>
            <span style={s.metricLabel}>Strongest</span>
            <span style={{ ...s.metricValue, fontSize: 13 }}>
              {displayMetrics.strongest?.subject}
            </span>
          </div>
          <div style={s.metricCard}>
            <span style={s.metricLabel}>Needs Work</span>
            <span style={{ ...s.metricValue, fontSize: 13, color: '#dc2626' }}>
              {displayMetrics.weakest?.subject}
            </span>
          </div>
          {history && (
            <div style={s.metricCard}>
              <span style={s.metricLabel}>vs Last Exam</span>
              <span style={{
                ...s.metricValue,
                color: parseFloat(displayMetrics.avg ?? displayMetrics.average) > parseFloat(history.average)
                  ? '#16a34a' : '#dc2626'
              }}>
                {parseFloat(displayMetrics.avg ?? displayMetrics.average) > parseFloat(history.average) ? '▲' : '▼'}
                {Math.abs(
                  parseFloat(displayMetrics.avg ?? displayMetrics.average) - parseFloat(history.average)
                ).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Marks Table */}
      {loadingMarks && <div style={s.loadingMarks}>Loading marks...</div>}

      {scores.length > 0 && !loadingMarks && (
        <div style={s.scoresBox}>
          <div style={s.scoresHeader}>
            <span style={s.label}>Subject Scores</span>
            {fullName && <span style={s.studentChip}>{fullName}</span>}
            {history && (
              <span style={s.historyChip}>
                Prev: {history.average}% — {history.examName}
              </span>
            )}
          </div>
          <div style={s.scoresGrid}>
            {scores.map((item, i) => {
              const score    = parseFloat(item.score);
              const isAtRisk = score < 50;
              const isWeak   = score >= 50 && score < 65;
              return (
                <div key={i} style={s.scoreRow}>
                  <span style={{
                    ...s.subjectName,
                    color: isAtRisk ? '#dc2626' : isWeak ? '#d97706' : '#374151'
                  }}>
                    {item.subject}
                    {isAtRisk && <span style={s.atRiskTag}>AT RISK</span>}
                  </span>
                  <input
                    style={{
                      ...s.scoreInput,
                      borderColor: isAtRisk ? '#fca5a5' : isWeak ? '#fcd34d' : '#d1d5db'
                    }}
                    type="number"
                    min="0"
                    max="100"
                    value={item.score}
                    onChange={e => setScores(prev =>
                      prev.map((p, idx) => idx === i ? { ...p, score: e.target.value } : p)
                    )}
                  />
                  <span style={s.outOf}>/100</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No results */}
      {!loadingMarks && selectedExam && selectedStudent && scores.length === 0 && (
        <div style={s.emptyBox}>No results found for this student in the selected exam.</div>
      )}

      {/* Buttons */}
      <div style={s.btnRow}>
        <button
          style={{ ...s.btnPrimary, opacity: (!scores.length || loading) ? 0.6 : 1 }}
          onClick={handleAnalyze}
          disabled={!scores.length || loading}
        >
          {loading ? 'Analyzing...' : 'Analyze with AI'}
        </button>
        <button style={s.btnSecondary} onClick={handleClear}>Clear</button>
      </div>

      {error && <p style={s.error}>{error}</p>}

      {/* AI Report — structured sections */}
      {(result) && (
        <div style={s.reportBox}>
          <div style={s.reportHeader}>
            <span style={s.reportTitle}>
              AI Analysis {fullName && `— ${fullName}`}
            </span>
          </div>

          {aiSections?.summary && (
            <div style={s.section}>
              <div style={s.sectionLabel}>Performance Summary</div>
              <p style={s.sectionText}>{aiSections.summary}</p>
            </div>
          )}

          {aiSections?.risk && (
            <div style={{ ...s.section, borderLeft: `3px solid ${riskColor(displayMetrics?.riskLevel).color}` }}>
              <div style={s.sectionLabel}>Risk Assessment</div>
              <p style={s.sectionText}>{aiSections.risk}</p>
            </div>
          )}

          {aiSections?.breakdown && (
            <div style={s.section}>
              <div style={s.sectionLabel}>Subject Breakdown</div>
              <p style={s.sectionText}>{aiSections.breakdown}</p>
            </div>
          )}

          {aiSections?.recommendations && (
            <div style={{ ...s.section, background: '#f0fdf4', borderRadius: 6, padding: '10px 12px' }}>
              <div style={{ ...s.sectionLabel, color: '#15803d' }}>Recommendations</div>
              <p style={{ ...s.sectionText, color: '#166534' }}>{aiSections.recommendations}</p>
            </div>
          )}

          {/* Fallback if sections not parsed */}
          {!aiSections?.summary && (
            <p style={s.sectionText}>{result?.analysis ?? result}</p>
          )}
        </div>
      )}
    </div>
  );
}

const s = {
  wrapper:      { background: '#fff', borderRadius: 12, padding: '1.5rem', border: '1px solid #e5e7eb', marginBottom: 20 },
  header:       { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 },
  badge:        { background: '#1D9E75', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 },
  title:        { fontSize: 15, fontWeight: 600, margin: 0, color: '#111', flex: 1 },
  riskBadge:    { fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 },
  grid3:        { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 },
  label:        { fontSize: 12, color: '#6b7280', marginBottom: 4, fontWeight: 500 },
  select:       { width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, background: '#fafafa', cursor: 'pointer', boxSizing: 'border-box' },
  metricsRow:   { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 },
  metricCard:   { background: '#f9fafb', borderRadius: 8, padding: '10px 12px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: 4 },
  metricLabel:  { fontSize: 11, color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' },
  metricValue:  { fontSize: 20, fontWeight: 700, color: '#111' },
  loadingMarks: { textAlign: 'center', padding: '12px', fontSize: 13, color: '#9ca3af' },
  scoresBox:    { background: '#f9fafb', borderRadius: 8, padding: '1rem', marginBottom: 16, border: '1px solid #e5e7eb' },
  scoresHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 6 },
  studentChip:  { fontSize: 12, background: '#dbeafe', color: '#1d4ed8', padding: '2px 10px', borderRadius: 20, fontWeight: 500 },
  historyChip:  { fontSize: 11, background: '#f3f4f6', color: '#6b7280', padding: '2px 10px', borderRadius: 20 },
  scoresGrid:   { display: 'flex', flexDirection: 'column', gap: 8 },
  scoreRow:     { display: 'flex', alignItems: 'center', gap: 8 },
  subjectName:  { flex: 1, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 },
  atRiskTag:    { fontSize: 10, background: '#fee2e2', color: '#dc2626', padding: '1px 6px', borderRadius: 10, fontWeight: 700 },
  scoreInput:   { width: 70, padding: '5px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, textAlign: 'center' },
  outOf:        { fontSize: 12, color: '#9ca3af' },
  emptyBox:     { textAlign: 'center', padding: '12px', fontSize: 13, color: '#9ca3af', background: '#f9fafb', borderRadius: 8, marginBottom: 16 },
  btnRow:       { display: 'flex', gap: 8, marginBottom: 8 },
  btnPrimary:   { flex: 1, padding: '10px', borderRadius: 8, background: '#1D9E75', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnSecondary: { padding: '10px 16px', borderRadius: 8, background: '#f3f4f6', color: '#374151', border: 'none', fontSize: 14, cursor: 'pointer' },
  error:        { color: '#dc2626', fontSize: 13 },
  reportBox:    { marginTop: 12, border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' },
  reportHeader: { background: '#f9fafb', padding: '10px 14px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  reportTitle:  { fontSize: 13, fontWeight: 700, color: '#111' },
  section:      { padding: '12px 14px', borderBottom: '1px solid #f3f4f6' },
  sectionLabel: { fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 },
  sectionText:  { fontSize: 13, color: '#374151', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' },
};
