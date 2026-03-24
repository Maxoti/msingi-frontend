/**
 * TermsPage.jsx
 * Academic Terms management — full CRUD + statistics
 * Connects to: terms.service.js (getAllTerms, createTerm, updateTerm,
 *              setActiveTerm, deleteTerm, getTermStatistics)
 */

import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllTerms,
  fetchTermStatistics,
  createTerm,
  updateTerm,
  setActiveTerm,
  deleteTerm,
  selectAllTerms,
  selectTermsLoading,
  selectTermsError,
  selectTermStatistics,
} from './academicTerms.slice';

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg:       '#F0F4F8',
  surface:  '#FFFFFF',
  border:   '#E2E8F0',
  ink:      '#0F172A',
  text:      '#334155',
  muted:    '#94A3B8',
  subtle:   '#CBD5E1',

  teal:     '#0D9488',
  tealDim:  '#CCFBF1',
  tealStr:  '#0F766E',

  blue:     '#2563EB',
  blueDim:  '#DBEAFE',

  amber:    '#D97706',
  amberDim: '#FEF3C7',

  rose:     '#E11D48',
  roseDim:  '#FFE4E6',

  slate:    '#475569',
  slateDim: '#F1F5F9',

  shadow:   '0 1px 4px rgba(15,23,42,.07), 0 1px 2px rgba(15,23,42,.04)',
  shadow2:  '0 8px 24px rgba(15,23,42,.10), 0 2px 8px rgba(15,23,42,.06)',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const termLabel = (t) => t ? `Term ${t.term} — ${t.year}` : '—';

const termStatus = (t) => {
  if (!t) return 'unknown';
  const now   = new Date();
  const start = new Date(t.start_date);
  const end   = new Date(t.end_date);
  if (now < start) return 'upcoming';
  if (now > end)   return 'completed';
  return 'ongoing';
};

const STATUS_CFG = {
  ongoing:   { label: 'Ongoing',   bg: T.tealDim,  color: T.tealStr,  dot: T.teal  },
  upcoming:  { label: 'Upcoming',  bg: T.blueDim,  color: T.blue,     dot: T.blue  },
  completed: { label: 'Completed', bg: T.slateDim, color: T.slate,    dot: T.muted },
  unknown:   { label: '—',         bg: T.slateDim, color: T.muted,    dot: T.muted },
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-KE', { day:'numeric', month:'short', year:'numeric' }) : '—';
const daysLeft = (end) => {
  const diff = Math.ceil((new Date(end) - new Date()) / 86400000);
  return diff > 0 ? diff : 0;
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
    .tm *{box-sizing:border-box;}
    .tm{font-family:'Plus Jakarta Sans',sans-serif;}
    .tm input,.tm select,.tm textarea,.tm button{font-family:'Plus Jakarta Sans',sans-serif;}
    .tm ::-webkit-scrollbar{width:4px;}
    .tm ::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:4px;}
    @keyframes tm-in  {from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
    @keyframes tm-pop {from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
    @keyframes tm-spin{to{transform:rotate(360deg)}}
    @keyframes tm-pulse{0%,100%{opacity:1}50%{opacity:.45}}
    .tm .in {animation:tm-in  .24s ease both;}
    .tm .pop{animation:tm-pop .2s  ease both;}
    .tm .row:hover{background:#F8FAFC;}
    .tm .card-hover:hover{border-color:#A5B4FC;box-shadow:0 4px 20px rgba(99,102,241,.12);}
    .tm input:focus,.tm select:focus,.tm textarea:focus{
      outline:none;border-color:${T.teal}!important;
      box-shadow:0 0 0 3px ${T.tealDim};
    }
    .tm .btn-primary:hover{background:${T.tealStr}!important;}
    .tm .btn-ghost:hover{background:${T.slateDim};}
  `}</style>
);

// ─── Atoms ────────────────────────────────────────────────────────────────────
const Spinner = ({ size = 18, color = T.teal }) => (
  <div style={{ width:size, height:size, borderRadius:'50%', flexShrink:0,
    border:`2px solid ${color}28`, borderTopColor:color,
    animation:'tm-spin .65s linear infinite', display:'inline-block' }} />
);

const StatusChip = ({ status, active }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG.unknown;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5,
      padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700,
      background:cfg.bg, color:cfg.color, letterSpacing:.3 }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:cfg.dot,
        animation: status==='ongoing' ? 'tm-pulse 1.8s ease infinite' : 'none' }}/>
      {cfg.label}
      {active && <span style={{ marginLeft:3, background:cfg.color, color:'#fff',
        borderRadius:10, padding:'1px 6px', fontSize:10 }}>ACTIVE</span>}
    </span>
  );
};

const ProgressRing = ({ pct, size=52, stroke=4, color=T.teal }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct,100) / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform:'rotate(-90deg)', flexShrink:0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.border} strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition:'stroke-dashoffset .6s ease' }}/>
    </svg>
  );
};

const StatPill = ({ label, value, gradient }) => (
  <div style={{ flex:1, minWidth:100, borderRadius:12, padding:'14px 18px',
    background:gradient, position:'relative', overflow:'hidden',
    boxShadow:'0 3px 12px rgba(0,0,0,.10)' }}>
    <div style={{ position:'absolute', right:-16, top:-16, width:64, height:64,
      borderRadius:'50%', background:'rgba(255,255,255,.12)' }}/>
    <div style={{ fontSize:22, fontWeight:800, color:'#fff', letterSpacing:-.5,
      fontFamily:"'JetBrains Mono',monospace" }}>{value ?? '—'}</div>
    <div style={{ fontSize:10, color:'rgba(255,255,255,.72)', fontWeight:600,
      textTransform:'uppercase', letterSpacing:.6, marginTop:4 }}>{label}</div>
  </div>
);

const Inp = ({ label, error, ...props }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
    {label && <label style={{ fontSize:11, fontWeight:700, color:T.text,
      textTransform:'uppercase', letterSpacing:.5 }}>{label}</label>}
    <input {...props} style={{ background:T.surface, border:`1.5px solid ${error?T.rose:T.border}`,
      borderRadius:9, padding:'9px 13px', color:T.ink, fontSize:13.5, width:'100%', ...props.style }} />
    {error && <span style={{ fontSize:11, color:T.rose }}>{error}</span>}
  </div>
);

const Btn = ({ children, variant='primary', loading=false, style={}, ...props }) => {
  const vr = {
    primary: { background:T.teal,    color:'#fff',  border:'none',  className:'btn-primary' },
    outline: { background:T.surface, color:T.text,  border:`1.5px solid ${T.border}`, className:'btn-ghost' },
    ghost:   { background:'transparent', color:T.muted, border:'none', className:'btn-ghost' },
    danger:  { background:T.roseDim, color:T.rose,  border:`1.5px solid ${T.rose}30`, className:'' },
    amber:   { background:T.amberDim,color:T.amber, border:`1.5px solid ${T.amber}30`, className:'' },
  };
  const v = vr[variant] || vr.primary;
  return (
    <button {...props} className={`tm ${v.className}`} disabled={loading||props.disabled} style={{
      display:'inline-flex', alignItems:'center', gap:6, borderRadius:9,
      padding:'9px 18px', fontSize:13, fontWeight:600, cursor:'pointer',
      transition:'all .15s', opacity:loading||props.disabled?.55:1,
      background:v.background, color:v.color, border:v.border||'none', ...style,
    }}>
      {loading ? <Spinner size={13} color={variant==='primary'?'#fff':T.teal}/> : children}
    </button>
  );
};

const Alert = ({ type='error', msg }) => {
  if (!msg) return null;
  const cfg = {
    error:   { bg:T.roseDim,  border:`${T.rose}30`,  color:T.rose,  icon:'⚠' },
    success: { bg:T.tealDim,  border:`${T.teal}30`,  color:T.tealStr, icon:'✓' },
    info:    { bg:T.blueDim,  border:`${T.blue}30`,  color:T.blue,  icon:'ℹ' },
  }[type];
  return (
    <div style={{ padding:'10px 14px', borderRadius:9, background:cfg.bg,
      border:`1px solid ${cfg.border}`, color:cfg.color, fontSize:12.5,
      fontWeight:500, display:'flex', gap:8, alignItems:'flex-start' }}>
      <span>{cfg.icon}</span><span>{msg}</span>
    </div>
  );
};

// ─── Term Form Modal ──────────────────────────────────────────────────────────
const TermFormModal = ({ term, onClose, onSaved }) => {
  const dispatch = useDispatch();
  const loading  = useSelector(selectTermsLoading);
  const isEdit   = !!term;

  const [form, setForm] = useState({
    year:       term?.year       || new Date().getFullYear(),
    term:       term?.term       || 1,
    start_date: term?.start_date?.split('T')[0] || '',
    end_date:   term?.end_date?.split('T')[0]   || '',
    is_active:  term?.is_active  || false,
  });
  const [errors, setErrors] = useState({});
  const [apiErr, setApiErr] = useState('');

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type==='checkbox' ? e.target.checked : e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.year)       e.year       = 'Required';
    if (!form.term)       e.term       = 'Required';
    if (!form.start_date) e.start_date = 'Required';
    if (!form.end_date)   e.end_date   = 'Required';
    if (form.start_date && form.end_date && new Date(form.start_date) >= new Date(form.end_date))
      e.end_date = 'Must be after start date';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setApiErr('');
    try {
      const payload = { ...form, year:parseInt(form.year), term:parseInt(form.term) };
      const result  = isEdit
        ? await dispatch(updateTerm({ id:term.id, updates:payload }))
        : await dispatch(createTerm(payload));
      if (result.error) { setApiErr(result.payload || 'Failed'); return; }
      onSaved?.();
      onClose();
    } catch (err) {
      setApiErr(err.message || 'Failed');
    }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.55)',
      backdropFilter:'blur(4px)', display:'flex', alignItems:'center',
      justifyContent:'center', zIndex:400, padding:20 }}>
      <div className="tm pop" style={{ background:T.surface, borderRadius:18,
        border:`1px solid ${T.border}`, boxShadow:T.shadow2,
        width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto' }}>

        {/* Header */}
        <div style={{ padding:'20px 24px 18px', borderBottom:`1px solid ${T.border}`,
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h3 style={{ fontSize:17, fontWeight:800, color:T.ink }}>
              {isEdit ? 'Edit Term' : 'New Academic Term'}
            </h3>
            <p style={{ fontSize:12, color:T.muted, marginTop:2 }}>
              CBC Academic Calendar
            </p>
          </div>
          <button onClick={onClose} style={{ background:T.slateDim, border:'none',
            borderRadius:8, width:32, height:32, cursor:'pointer', color:T.muted,
            fontSize:18, display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding:'22px 24px', display:'flex', flexDirection:'column', gap:16 }}>
          {apiErr && <Alert type="error" msg={apiErr}/>}

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <Inp label="Year" type="number" min={2000} max={2100}
              value={form.year} onChange={set('year')} error={errors.year}/>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <label style={{ fontSize:11, fontWeight:700, color:T.text,
                textTransform:'uppercase', letterSpacing:.5 }}>Term *</label>
              <select value={form.term} onChange={set('term')}
                style={{ background:T.surface, border:`1.5px solid ${T.border}`,
                  borderRadius:9, padding:'9px 13px', fontSize:13.5, color:T.ink, width:'100%' }}>
                <option value={1}>Term 1</option>
                <option value={2}>Term 2</option>
                <option value={3}>Term 3</option>
              </select>
              {errors.term && <span style={{ fontSize:11, color:T.rose }}>{errors.term}</span>}
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <Inp label="Start Date" type="date" value={form.start_date}
              onChange={set('start_date')} error={errors.start_date}/>
            <Inp label="End Date" type="date" value={form.end_date}
              onChange={set('end_date')} error={errors.end_date}/>
          </div>

          {/* Duration hint */}
          {form.start_date && form.end_date && new Date(form.end_date) > new Date(form.start_date) && (
            <div style={{ background:T.tealDim, border:`1px solid ${T.teal}30`,
              borderRadius:8, padding:'9px 13px', fontSize:12.5, color:T.tealStr,
              display:'flex', alignItems:'center', gap:6 }}>
               Duration: <b>{Math.ceil((new Date(form.end_date)-new Date(form.start_date))/86400000)} days</b>
              &nbsp;· 30–150 days allowed
            </div>
          )}

          <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer',
            padding:'10px 13px', background:T.slateDim, borderRadius:9,
            border:`1.5px solid ${form.is_active ? T.teal : T.border}`,
            transition:'border-color .15s' }}>
            <input type="checkbox" checked={form.is_active} onChange={set('is_active')}
              style={{ width:16, height:16, accentColor:T.teal, cursor:'pointer' }}/>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:T.ink }}>Set as Active Term</div>
              <div style={{ fontSize:11, color:T.muted }}>Deactivates all other terms automatically</div>
            </div>
          </label>
        </div>

        {/* Footer */}
        <div style={{ padding:'14px 24px', borderTop:`1px solid ${T.border}`,
          display:'flex', gap:10, justifyContent:'flex-end' }}>
          <Btn variant="outline" onClick={onClose}>Cancel</Btn>
          <Btn loading={loading.create || loading.update} onClick={handleSubmit}>
            {isEdit ? 'Save Changes' : 'Create Term'}
          </Btn>
        </div>
      </div>
    </div>
  );
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
const DeleteModal = ({ term, onClose, onDeleted }) => {
  const dispatch = useDispatch();
  const loading  = useSelector(selectTermsLoading);
  const [err, setErr] = useState('');

  const handleDelete = async () => {
    setErr('');
    const result = await dispatch(deleteTerm(term.id));
    if (result.error) { setErr(result.payload || 'Delete failed'); return; }
    onDeleted?.();
    onClose();
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.55)',
      backdropFilter:'blur(4px)', display:'flex', alignItems:'center',
      justifyContent:'center', zIndex:400, padding:20 }}>
      <div className="tm pop" style={{ background:T.surface, borderRadius:18,
        border:`1px solid ${T.border}`, boxShadow:T.shadow2, width:'100%', maxWidth:400, padding:28 }}>
        <div style={{ width:48, height:48, borderRadius:14, background:T.roseDim,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:22, marginBottom:16 }}>🗑</div>
        <div style={{ fontSize:17, fontWeight:800, color:T.ink, marginBottom:8 }}>Delete Term</div>
        <div style={{ fontSize:13.5, color:T.text, lineHeight:1.6, marginBottom:20 }}>
          Are you sure you want to delete <b style={{ color:T.ink }}>{termLabel(term)}</b>?
          This cannot be undone and will fail if exams exist for this term.
        </div>
        {err && <div style={{ marginBottom:14 }}><Alert type="error" msg={err}/></div>}
        <div style={{ display:'flex', gap:10 }}>
          <Btn variant="outline" onClick={onClose} style={{ flex:1 }}>Cancel</Btn>
          <Btn variant="danger" loading={loading.delete} onClick={handleDelete} style={{ flex:1 }}>
            Delete
          </Btn>
        </div>
      </div>
    </div>
  );
};



// ─── Term Card ────────────────────────────────────────────────────────────────
const TermCard = ({ term, onEdit, onDelete, onSetActive, onStats, delay }) => {
  const dispatch = useDispatch();
  const loading  = useSelector(selectTermsLoading);
  const status   = termStatus(term);
  const cfg      = STATUS_CFG[status];
  const days     = daysLeft(term.end_date);
  const pctElapsed = (() => {
    const total   = new Date(term.end_date) - new Date(term.start_date);
    const elapsed = new Date() - new Date(term.start_date);
    return Math.min(100, Math.max(0, Math.round((elapsed/total)*100)));
  })();

  return (
    <div className="tm in card-hover" style={{
      animationDelay: `${delay}ms`,
      background: T.surface, borderRadius:16,
      border: `1.5px solid ${term.is_active ? T.teal : T.border}`,
      boxShadow: term.is_active
        ? `0 4px 20px ${T.teal}22, ${T.shadow}`
        : T.shadow,
      padding:22, position:'relative', overflow:'hidden', transition:'all .2s',
    }}>
      {/* Active glow strip */}
      {term.is_active && (
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3,
          background:`linear-gradient(90deg, ${T.teal}, ${T.tealStr})`,
          borderRadius:'16px 16px 0 0' }}/>
      )}

      {/* Decorative bg circle */}
      <div style={{ position:'absolute', bottom:-28, right:-28, width:100, height:100,
        borderRadius:'50%', background:`${cfg.dot}08`, pointerEvents:'none' }}/>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
        <div>
          <div style={{ fontSize:16, fontWeight:800, color:T.ink, letterSpacing:-.3 }}>
            {termLabel(term)}
          </div>
          <div style={{ marginTop:5 }}>
            <StatusChip status={status} active={term.is_active}/>
          </div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
         
          <button onClick={() => onEdit(term)} title="Edit" style={{
            background:T.blueDim, border:'none', borderRadius:7,
            padding:'6px 10px', cursor:'pointer', fontSize:13, color:T.blue,
          }}>Edit</button>
          {!term.is_active && (
            <button onClick={() => onDelete(term)} title="Delete" style={{
              background:T.roseDim, border:'none', borderRadius:7,
              padding:'6px 10px', cursor:'pointer', fontSize:13, color:T.rose,
            }}>🗑</button>
          )}
        </div>
      </div>

      {/* Dates */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
        {[
          { label:'Start', value:fmt(term.start_date) },
          { label:'End',   value:fmt(term.end_date)   },
        ].map(({ label, value }) => (
          <div key={label} style={{ background:T.slateDim, borderRadius:8, padding:'8px 11px' }}>
            <div style={{ fontSize:10, color:T.muted, fontWeight:600,
              textTransform:'uppercase', letterSpacing:.4, marginBottom:2 }}>{label}</div>
            <div style={{ fontSize:12.5, fontWeight:700, color:T.ink,
              fontFamily:"'JetBrains Mono',monospace" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
          <span style={{ fontSize:11, color:T.muted, fontWeight:600 }}>Progress</span>
          <span style={{ fontSize:11, fontWeight:700, color:T.ink,
            fontFamily:"'JetBrains Mono',monospace" }}>{pctElapsed}%</span>
        </div>
        <div style={{ background:T.border, borderRadius:99, height:5, overflow:'hidden' }}>
          <div style={{
            width:`${pctElapsed}%`, height:'100%', borderRadius:99,
            background: status==='completed'
              ? T.muted
              : `linear-gradient(90deg, ${T.teal}, ${T.tealStr})`,
            transition:'width .7s cubic-bezier(.4,0,.2,1)',
          }}/>
        </div>
        {status === 'ongoing' && days > 0 && (
          <div style={{ fontSize:11, color:T.muted, marginTop:5 }}>
            <b style={{ color:T.ink }}>{days}</b> days remaining
          </div>
        )}
      </div>

      {/* Set Active button */}
      {!term.is_active && (
        <Btn variant="outline" loading={loading.setActive}
          onClick={() => onSetActive(term.id)}
          style={{ width:'100%', justifyContent:'center', fontSize:12 }}>
          ☑ Set as Active
        </Btn>
      )}
      {term.is_active && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
          gap:6, padding:'8px', borderRadius:9, background:T.tealDim,
          fontSize:12, fontWeight:700, color:T.tealStr }}>
          <span style={{ width:7, height:7, borderRadius:'50%', background:T.teal,
            animation:'tm-pulse 1.8s ease infinite' }}/>
          Currently Active
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TermsPage() {
  const dispatch = useDispatch();
  const terms    = useSelector(selectAllTerms);
  const loading  = useSelector(selectTermsLoading);
  const error    = useSelector(selectTermsError);

  const [modal,      setModal]      = useState(null); // 'create'|'edit'|'delete'|'stats'
  const [target,     setTarget]     = useState(null);
  const [yearFilter, setYearFilter] = useState('');
  const [search,     setSearch]     = useState('');
  const [toast,      setToast]      = useState(null);

  useEffect(() => { dispatch(fetchAllTerms({})); }, [dispatch]);

  const showToast = (msg, type='success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const handleSetActive = useCallback(async (id) => {
    const result = await dispatch(setActiveTerm(id));
    if (!result.error) showToast('Term set as active');
    else showToast(result.payload || 'Failed', 'error');
  }, [dispatch]);

  const years = [...new Set(terms.map(t => t.year))].sort((a,b) => b-a);

  const filtered = terms.filter(t => {
    if (yearFilter && String(t.year) !== String(yearFilter)) return false;
    if (search) {
      const q = search.toLowerCase();
      return termLabel(t).toLowerCase().includes(q);
    }
    return true;
  });

  const activeCount  = terms.filter(t => t.is_active).length;
  const ongoingCount = terms.filter(t => termStatus(t) === 'ongoing').length;
  const upcoming     = terms.filter(t => termStatus(t) === 'upcoming').length;

  return (
    <div className="tm" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",
      background:T.bg, minHeight:'100vh', color:T.text }}>
      <Styles/>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ background:T.surface, borderBottom:`1px solid ${T.border}`,
        padding:'20px 32px', boxShadow:T.shadow }}>
        <div style={{ display:'flex', justifyContent:'space-between',
          alignItems:'center', flexWrap:'wrap', gap:12, maxWidth:1200, margin:'0 auto' }}>
          <div>
            <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:T.ink, letterSpacing:-.4 }}>
              Academic Terms
            </h1>
            <p style={{ margin:0, fontSize:12.5, color:T.muted, marginTop:3 }}>
              CBC Calendar · {terms.length} term{terms.length!==1?'s':''} configured
            </p>
          </div>
          <Btn onClick={() => setModal('create')}>+ New Term</Btn>
        </div>
      </div>

      <div style={{ padding:'28px 32px', maxWidth:1200, margin:'0 auto' }}>

        {/* ── Stat pills ──────────────────────────────────────────────────── */}
        <div style={{ display:'flex', gap:14, marginBottom:28, flexWrap:'wrap' }}>
          <StatPill label="Total Terms"  value={terms.length}   gradient="linear-gradient(135deg,#0F172A,#1E293B)"/>
          <StatPill label="Active"       value={activeCount}    gradient="linear-gradient(135deg,#0D9488,#0F766E)"/>
          <StatPill label="Ongoing"      value={ongoingCount}   gradient="linear-gradient(135deg,#2563EB,#1D4ED8)"/>
          <StatPill label="Upcoming"     value={upcoming}       gradient="linear-gradient(135deg,#7C3AED,#6D28D9)"/>
        </div>

        {/* ── Filters ─────────────────────────────────────────────────────── */}
        <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
          <input placeholder="Search terms…" value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex:'1 1 200px', background:T.surface, border:`1.5px solid ${T.border}`,
              borderRadius:9, padding:'9px 13px', fontSize:13.5, color:T.ink, outline:'none' }}/>
          <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}
            style={{ background:T.surface, border:`1.5px solid ${T.border}`, borderRadius:9,
              padding:'9px 13px', fontSize:13.5, color:T.ink, outline:'none', cursor:'pointer' }}>
            <option value="">All Years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {(search || yearFilter) && (
            <Btn variant="ghost" onClick={() => { setSearch(''); setYearFilter(''); }}
              style={{ fontSize:12 }}>✕ Clear</Btn>
          )}
          <span style={{ marginLeft:'auto', fontSize:12, color:T.muted }}>
            {filtered.length} result{filtered.length!==1?'s':''}
          </span>
        </div>

        {/* ── Error ───────────────────────────────────────────────────────── */}
        {error && <div style={{ marginBottom:16 }}><Alert type="error" msg={error}/></div>}

        {/* ── Grid ────────────────────────────────────────────────────────── */}
        {loading.list ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ height:260, background:T.surface, borderRadius:16,
                border:`1.5px solid ${T.border}`, opacity:.6,
                animation:'tm-pulse 1.5s ease infinite', animationDelay:`${i*.1}s` }}/>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 24px', color:T.muted }}>
            <div style={{ fontSize:48, marginBottom:12, opacity:.5 }}></div>
            <div style={{ fontSize:17, fontWeight:700, color:T.ink, marginBottom:6 }}>
              {search || yearFilter ? 'No terms match your filters' : 'No terms yet'}
            </div>
            <div style={{ fontSize:13, marginBottom:24 }}>
              {search || yearFilter ? 'Try adjusting your search' : 'Create your first academic term to get started'}
            </div>
            {!search && !yearFilter && (
              <Btn onClick={() => setModal('create')}>+ New Term</Btn>
            )}
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
            {filtered.map((t, i) => (
              <TermCard
                key={t.id}
                term={t}
                delay={i * 50}
                onEdit={(term)   => { setTarget(term); setModal('edit'); }}
                onDelete={(term) => { setTarget(term); setModal('delete'); }}
                onSetActive={handleSetActive}
                onStats={() => { setTarget(t); setModal('stats'); }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {modal === 'create' && (
        <TermFormModal
          onClose={() => setModal(null)}
          onSaved={() => { showToast('Term created successfully'); dispatch(fetchAllTerms({})); }}
        />
      )}
      {modal === 'edit' && target && (
        <TermFormModal
          term={target}
          onClose={() => { setModal(null); setTarget(null); }}
          onSaved={() => { showToast('Term updated successfully'); dispatch(fetchAllTerms({})); }}
        />
      )}
      {modal === 'delete' && target && (
        <DeleteModal
          term={target}
          onClose={() => { setModal(null); setTarget(null); }}
          onDeleted={() => { showToast('Term deleted'); dispatch(fetchAllTerms({})); }}
        />
      )}
      {modal === 'stats' && target && (
        <StatsPanel
          termId={target.id}
          onClose={() => { setModal(null); setTarget(null); }}
        />
      )}

      {/* ── Toast ───────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="tm in" style={{ position:'fixed', bottom:28, right:28, zIndex:999,
          background: toast.type==='error' ? T.roseDim : T.tealDim,
          border:`1.5px solid ${toast.type==='error' ? T.rose+'44' : T.teal+'44'}`,
          color: toast.type==='error' ? T.rose : T.tealStr,
          borderRadius:12, padding:'12px 18px', fontSize:13.5, fontWeight:600,
          boxShadow:T.shadow2, display:'flex', alignItems:'center', gap:8 }}>
          {toast.type === 'error' ? '⚠' : '✓'} {toast.msg}
        </div>
      )}
    </div>
  );
}