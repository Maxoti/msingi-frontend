import { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchClasses,
  createClass,
  updateClass,
  deleteClass,
  assignTeacher,
  removeTeacher,
  fetchClassStudents,
  setFilters,
  clearFilters,
  clearError,
  clearSuccessMessage,
  selectFilteredClasses,
  selectClassesLoading,
  selectClassesError,
  selectClassesSuccess,
  selectClassStudents,
  selectClassesFilters,
} from './classes.slice';

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ path, size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.75} strokeLinecap="round"
    strokeLinejoin="round" className={className}>
    <path d={path} />
  </svg>
);

const ICONS = {
  plus:    'M12 5v14M5 12h14',
  search:  'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z',
  edit:    'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
  trash:   'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
  users:   'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  teacher: 'M12 14l9-5-9-5-9 5 9 5zM12 14l6.16-3.422a12.083 12.083 0 0 1 .665 6.479A11.952 11.952 0 0 0 12 20.055a11.952 11.952 0 0 0-6.824-2.998 12.078 12.078 0 0 1 .665-6.479L12 14z',
  close:   'M18 6 6 18M6 6l12 12',
  check:   'M20 6 9 17l-5-5',
  warning: 'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
  chevron: 'M9 18l6-6-6-6',
  filter:  'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
  cap:     'M22 10v6M2 10l10-5 10 5-10 5-10-5zM6 12v5c3.33 1.67 8.67 1.67 12 0v-5',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const GRADE_LABELS = { 1:'Grade 1',2:'Grade 2',3:'Grade 3',4:'Grade 4',5:'Grade 5',
  6:'Grade 6',7:'Grade 7',8:'Grade 8',9:'Grade 9',10:'Grade 10',11:'Grade 11',12:'Grade 12' };

const capacityColor = (pct) => {
  if (pct >= 100) return '#ef4444';
  if (pct >= 80)  return '#f59e0b';
  return '#10b981';
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div style={{
      position:'fixed', bottom:28, right:28, zIndex:9999,
      display:'flex', alignItems:'center', gap:12,
      background: type === 'error' ? '#fee2e2' : '#d1fae5',
      border: `1.5px solid ${type === 'error' ? '#fca5a5' : '#6ee7b7'}`,
      borderRadius:12, padding:'12px 18px', boxShadow:'0 8px 30px rgba(0,0,0,.12)',
      fontFamily:'inherit', fontSize:14, fontWeight:500,
      color: type === 'error' ? '#b91c1c' : '#065f46',
      animation:'slideUp .25s ease',
    }}>
      <Icon path={type === 'error' ? ICONS.warning : ICONS.check}
        size={16} />
      {message}
      <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',
        padding:0,display:'flex',opacity:.6}}>
        <Icon path={ICONS.close} size={14} />
      </button>
    </div>
  );
}

function CapacityBar({ used, total }) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const color = capacityColor(pct);
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',
        fontSize:11,fontWeight:600,marginBottom:4,color:'#64748b'}}>
        <span>{used}/{total} students</span>
        <span style={{color}}>{pct}%</span>
      </div>
      <div style={{height:5,borderRadius:99,background:'#e2e8f0',overflow:'hidden'}}>
        <div style={{height:'100%',width:`${pct}%`,background:color,
          borderRadius:99,transition:'width .4s ease'}} />
      </div>
    </div>
  );
}

function ClassCard({ cls, onEdit, onDelete, onViewStudents, onManageTeacher, selected, onSelect }) {
  const pct = cls.capacity > 0 ? Math.round((parseInt(cls.student_count||0)/cls.capacity)*100) : 0;
  const isFull = pct >= 100;

  return (
    <div onClick={onSelect} style={{
      background:'#fff',
      border: selected ? '2px solid #6366f1' : '1.5px solid #e2e8f0',
      borderRadius:16, padding:20, cursor:'pointer',
      transition:'all .18s ease',
      boxShadow: selected ? '0 0 0 4px rgba(99,102,241,.1)' : '0 1px 4px rgba(0,0,0,.05)',
      position:'relative', overflow:'hidden',
    }}
      onMouseEnter={e => { if(!selected) e.currentTarget.style.borderColor='#c7d2fe'; }}
      onMouseLeave={e => { if(!selected) e.currentTarget.style.borderColor='#e2e8f0'; }}
    >
      {/* Grade badge */}
      {cls.grade_level && (
        <div style={{position:'absolute',top:14,right:14,
          background:'#ede9fe',color:'#6d28d9',
          fontSize:10,fontWeight:700,letterSpacing:.5,
          padding:'3px 8px',borderRadius:99,textTransform:'uppercase'}}>
          {GRADE_LABELS[cls.grade_level] || `Grade ${cls.grade_level}`}
        </div>
      )}

      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
        <div style={{width:38,height:38,borderRadius:10,
          background: isFull ? '#fee2e2' : '#ede9fe',
          display:'flex',alignItems:'center',justifyContent:'center',
          color: isFull ? '#dc2626' : '#7c3aed',flexShrink:0}}>
          <Icon path={ICONS.cap} size={18} />
        </div>
        <div>
          <div style={{fontWeight:700,fontSize:15,color:'#1e293b',lineHeight:1.2}}>
            {cls.name}
          </div>
          {cls.teacher_name && (
            <div style={{fontSize:11,color:'#94a3b8',marginTop:2}}>
              {cls.teacher_name}
            </div>
          )}
        </div>
      </div>

      <CapacityBar used={parseInt(cls.student_count||0)} total={cls.capacity} />

      {/* Action row */}
      <div style={{display:'flex',gap:6,marginTop:14}}
        onClick={e => e.stopPropagation()}>
        <ActionBtn icon={ICONS.users} label="Students"
          onClick={() => onViewStudents(cls)}
          color="#6366f1" bg="#eef2ff" />
        <ActionBtn icon={ICONS.teacher} label="Teacher"
          onClick={() => onManageTeacher(cls)}
          color="#0891b2" bg="#e0f2fe" />
        <ActionBtn icon={ICONS.edit} label="Edit"
          onClick={() => onEdit(cls)}
          color="#0d9488" bg="#f0fdfa" />
        <ActionBtn icon={ICONS.trash} label="Delete"
          onClick={() => onDelete(cls)}
          color="#dc2626" bg="#fef2f2" />
      </div>
    </div>
  );
}

function ActionBtn({ icon, label, onClick, color, bg }) {
  return (
    <button onClick={onClick} title={label} style={{
      flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:5,
      border:'none', borderRadius:8, padding:'7px 4px', cursor:'pointer',
      background:bg, color:color, fontSize:11, fontWeight:600,
      transition:'opacity .15s',
    }}
      onMouseEnter={e => e.currentTarget.style.opacity='.75'}
      onMouseLeave={e => e.currentTarget.style.opacity='1'}>
      <Icon path={icon} size={13} />
      {label}
    </button>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children, width = 480 }) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.45)',
      zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',
      backdropFilter:'blur(2px)',animation:'fadeIn .15s ease'}}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{background:'#fff',borderRadius:20,width:'100%',maxWidth:width,
        margin:16,boxShadow:'0 24px 60px rgba(0,0,0,.18)',
        animation:'scaleIn .2s ease',overflow:'hidden'}}>
        <div style={{padding:'20px 24px',borderBottom:'1px solid #f1f5f9',
          display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <h3 style={{margin:0,fontSize:17,fontWeight:700,color:'#1e293b'}}>{title}</h3>
          <button onClick={onClose} style={{background:'#f1f5f9',border:'none',
            width:30,height:30,borderRadius:8,cursor:'pointer',display:'flex',
            alignItems:'center',justifyContent:'center',color:'#64748b'}}>
            <Icon path={ICONS.close} size={15} />
          </button>
        </div>
        <div style={{padding:'24px'}}>{children}</div>
      </div>
    </div>
  );
}

function FormField({ label, children, required }) {
  return (
    <div style={{marginBottom:16}}>
      <label style={{display:'block',fontSize:12,fontWeight:600,color:'#475569',
        marginBottom:6,letterSpacing:.3}}>
        {label}{required && <span style={{color:'#ef4444',marginLeft:3}}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width:'100%',boxSizing:'border-box',border:'1.5px solid #e2e8f0',
  borderRadius:10,padding:'10px 14px',fontSize:14,fontFamily:'inherit',
  color:'#1e293b',outline:'none',background:'#f8fafc',transition:'border-color .15s',
};

function ClassFormModal({ initial, onSubmit, onClose, loading }) {
  const [form, setForm] = useState({
    name:             initial?.name            || '',
    grade_level:      initial?.grade_level     || '',
    capacity:         initial?.capacity        || '',
    class_teacher_id: initial?.class_teacher_id || '',
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (!payload.grade_level)      delete payload.grade_level;
    if (!payload.class_teacher_id) delete payload.class_teacher_id;
    payload.capacity = Number(payload.capacity);
    onSubmit(payload);
  };

  return (
    <Modal title={initial ? 'Edit Class' : 'New Class'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label="Class Name" required>
          <input style={inputStyle} value={form.name} onChange={set('name')}
            placeholder="e.g. Class 7A" required
            onFocus={e => e.target.style.borderColor='#6366f1'}
            onBlur={e => e.target.style.borderColor='#e2e8f0'} />
        </FormField>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <FormField label="Grade Level">
            <select style={{...inputStyle,cursor:'pointer'}}
              value={form.grade_level} onChange={set('grade_level')}
              onFocus={e => e.target.style.borderColor='#6366f1'}
              onBlur={e => e.target.style.borderColor='#e2e8f0'}>
              <option value="">— None —</option>
              {Object.entries(GRADE_LABELS).map(([v,l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Capacity" required>
            <input style={inputStyle} type="number" min={1} value={form.capacity}
              onChange={set('capacity')} placeholder="e.g. 35" required
              onFocus={e => e.target.style.borderColor='#6366f1'}
              onBlur={e => e.target.style.borderColor='#e2e8f0'} />
          </FormField>
        </div>

        <div style={{display:'flex',gap:10,marginTop:8}}>
          <button type="button" onClick={onClose} style={{
            flex:1,padding:'11px',borderRadius:10,border:'1.5px solid #e2e8f0',
            background:'#fff',cursor:'pointer',fontSize:14,fontWeight:600,color:'#64748b',
          }}>Cancel</button>
          <button type="submit" disabled={loading} style={{
            flex:2,padding:'11px',borderRadius:10,border:'none',
            background: loading ? '#a5b4fc' : '#6366f1',color:'#fff',
            cursor: loading ? 'not-allowed' : 'pointer',fontSize:14,fontWeight:700,
          }}>
            {loading ? 'Saving…' : (initial ? 'Save Changes' : 'Create Class')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ConfirmModal({ message, onConfirm, onClose, loading }) {
  return (
    <Modal title="Confirm Delete" onClose={onClose} width={400}>
      <div style={{textAlign:'center',paddingBottom:8}}>
        <div style={{width:52,height:52,borderRadius:16,background:'#fee2e2',
          display:'flex',alignItems:'center',justifyContent:'center',
          margin:'0 auto 16px',color:'#dc2626'}}>
          <Icon path={ICONS.warning} size={26} />
        </div>
        <p style={{margin:'0 0 24px',color:'#475569',fontSize:14,lineHeight:1.6}}>
          {message}
        </p>
        <div style={{display:'flex',gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:'11px',borderRadius:10,
            border:'1.5px solid #e2e8f0',background:'#fff',cursor:'pointer',
            fontSize:14,fontWeight:600,color:'#64748b'}}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{flex:1,padding:'11px',
            borderRadius:10,border:'none',background: loading?'#fca5a5':'#dc2626',
            color:'#fff',cursor:loading?'not-allowed':'pointer',
            fontSize:14,fontWeight:700}}>
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function StudentsModal({ cls, students: rawStudents, loading, onClose }) {
  const students = Array.isArray(rawStudents) ? rawStudents : [];
  return (
    <Modal title={`Students — ${cls.name}`} onClose={onClose} width={520}>
      {loading ? (
        <div style={{textAlign:'center',padding:'32px 0',color:'#94a3b8'}}>
          Loading students…
        </div>
      ) : students.length === 0 ? (
        <div style={{textAlign:'center',padding:'32px 0'}}>
          <div style={{fontSize:32,marginBottom:8}}>🎒</div>
          <p style={{color:'#94a3b8',margin:0}}>No students enrolled yet</p>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:8,maxHeight:360,overflowY:'auto'}}>
          {students.map((s) => (
            <div key={s.id} style={{display:'flex',alignItems:'center',gap:12,
              padding:'10px 12px',background:'#f8fafc',borderRadius:10}}>
              <div style={{width:34,height:34,borderRadius:10,
                background:'#ede9fe',color:'#7c3aed',
                display:'flex',alignItems:'center',justifyContent:'center',
                fontWeight:700,fontSize:12,flexShrink:0}}>
                {(s.first_name?.[0]||'')}{(s.last_name?.[0]||'')}
              </div>
              <div>
                <div style={{fontSize:14,fontWeight:600,color:'#1e293b'}}>
                  {s.first_name} {s.last_name}
                </div>
                {s.admission_number && (
                  <div style={{fontSize:11,color:'#94a3b8'}}>{s.admission_number}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

function TeacherModal({ cls, onAssign, onRemove, onClose, loading }) {
  const [teacherId, setTeacherId] = useState('');

  return (
    <Modal title={`Manage Teacher — ${cls.name}`} onClose={onClose} width={440}>
      {cls.teacher_name ? (
        <div>
          <div style={{display:'flex',alignItems:'center',gap:12,
            background:'#f0f9ff',borderRadius:12,padding:'14px 16px',marginBottom:20}}>
            <div style={{width:40,height:40,borderRadius:10,background:'#bae6fd',
              display:'flex',alignItems:'center',justifyContent:'center',color:'#0369a1'}}>
              <Icon path={ICONS.teacher} size={20} />
            </div>
            <div>
              <div style={{fontWeight:700,color:'#0c4a6e',fontSize:14}}>
                {cls.teacher_name}
              </div>
              <div style={{fontSize:11,color:'#7dd3fc'}}>Current teacher</div>
            </div>
          </div>
          <div style={{display:'flex',gap:10}}>
            <button onClick={onClose} style={{flex:1,padding:'11px',borderRadius:10,
              border:'1.5px solid #e2e8f0',background:'#fff',cursor:'pointer',
              fontSize:14,fontWeight:600,color:'#64748b'}}>Close</button>
            <button onClick={() => onRemove(cls.id)} disabled={loading} style={{
              flex:1,padding:'11px',borderRadius:10,border:'none',
              background:loading?'#fca5a5':'#fee2e2',color:'#dc2626',
              cursor:loading?'not-allowed':'pointer',fontSize:14,fontWeight:700}}>
              {loading ? 'Removing…' : 'Remove Teacher'}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p style={{margin:'0 0 16px',fontSize:14,color:'#64748b'}}>
            Enter a teacher ID to assign them to this class.
          </p>
          <FormField label="Teacher ID" required>
            <input style={inputStyle} type="number" value={teacherId}
              onChange={e => setTeacherId(e.target.value)}
              placeholder="Enter teacher ID"
              onFocus={e => e.target.style.borderColor='#6366f1'}
              onBlur={e => e.target.style.borderColor='#e2e8f0'} />
          </FormField>
          <div style={{display:'flex',gap:10,marginTop:8}}>
            <button onClick={onClose} style={{flex:1,padding:'11px',borderRadius:10,
              border:'1.5px solid #e2e8f0',background:'#fff',cursor:'pointer',
              fontSize:14,fontWeight:600,color:'#64748b'}}>Cancel</button>
            <button onClick={() => onAssign(cls.id, teacherId)}
              disabled={!teacherId || loading} style={{
                flex:2,padding:'11px',borderRadius:10,border:'none',
                background:(!teacherId||loading)?'#a5b4fc':'#6366f1',
                color:'#fff',cursor:(!teacherId||loading)?'not-allowed':'pointer',
                fontSize:14,fontWeight:700}}>
              {loading ? 'Assigning…' : 'Assign Teacher'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ClassesPage() {
  const dispatch    = useDispatch();
  const classes     = useSelector(selectFilteredClasses);
  const loading     = useSelector(selectClassesLoading);
  const error       = useSelector(selectClassesError);
  const success     = useSelector(selectClassesSuccess);
  const filters     = useSelector(selectClassesFilters);

  const [modal,    setModal]    = useState(null);
  const [target,   setTarget]   = useState(null);
  const studentSelector = useMemo(() => selectClassStudents(target?.id), [target?.id]);
  const students = useSelector(studentSelector);

  useEffect(() => { dispatch(fetchClasses()); }, [dispatch]);

  useEffect(() => {
    if (modal === 'students' && target) {
      dispatch(fetchClassStudents(target.id));
    }
  }, [modal, target, dispatch]);

  const closeModal  = useCallback(() => { setModal(null); setTarget(null); }, []);
  const clearToast  = useCallback(() => {
    dispatch(clearError()); dispatch(clearSuccessMessage());
  }, [dispatch]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleCreate = async (formData) => {
    const result = await dispatch(createClass(formData));
    if (!result.error) closeModal();
  };

  const handleUpdate = async (formData) => {
    const result = await dispatch(updateClass({ id: target.id, updateData: formData }));
    if (!result.error) closeModal();
  };

  const handleDelete = async () => {
    const result = await dispatch(deleteClass(target.id));
    if (!result.error) closeModal();
  };

  const handleAssignTeacher = async (classId, teacherId) => {
    const result = await dispatch(assignTeacher({ classId, teacherId: Number(teacherId) }));
    if (!result.error) closeModal();
  };

  const handleRemoveTeacher = async (classId) => {
    const result = await dispatch(removeTeacher(classId));
    if (!result.error) closeModal();
  };

  // ── Stats ────────────────────────────────────────────────────────────────────
  const totalStudents  = classes.reduce((s, c) => s + parseInt(c.student_count || 0), 0);
  const fullClasses    = classes.filter(c => parseInt(c.student_count||0) >= c.capacity).length;
  const withTeacher    = classes.filter(c => c.class_teacher_id).length;

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', fontFamily:"'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes scaleIn  { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }
        @keyframes slideUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { width:6px }
        ::-webkit-scrollbar-track { background:#f1f5f9 }
        ::-webkit-scrollbar-thumb { background:#cbd5e1;border-radius:3px }
      `}</style>

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div style={{ background:'#fff', borderBottom:'1px solid #f1f5f9',
        padding:'0 32px', display:'flex', alignItems:'center',
        justifyContent:'space-between', height:64 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'#ede9fe',
            display:'flex', alignItems:'center', justifyContent:'center', color:'#7c3aed' }}>
            <Icon path={ICONS.cap} size={20} />
          </div>
          <div>
            <h1 style={{ margin:0, fontSize:18, fontWeight:800, color:'#1e293b', letterSpacing:-.3 }}>
              Classes
            </h1>
            <p style={{ margin:0, fontSize:12, color:'#94a3b8' }}>
              {classes.length} class{classes.length !== 1 ? 'es' : ''}
            </p>
          </div>
        </div>

        <button onClick={() => setModal('create')} style={{
          display:'flex', alignItems:'center', gap:7, padding:'9px 18px',
          background:'#6366f1', color:'#fff', border:'none', borderRadius:10,
          fontFamily:'inherit', fontSize:14, fontWeight:700, cursor:'pointer',
          transition:'background .15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background='#4f46e5'}
          onMouseLeave={e => e.currentTarget.style.background='#6366f1'}>
          <Icon path={ICONS.plus} size={16} />
          New Class
        </button>
      </div>

      {/* ── Stats Bar ────────────────────────────────────────────────────────── */}
<div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)',
  gap:16, padding:'24px 32px 0' }}>
  {[
    {
      label:'Total Students', value:totalStudents,
      color:'#fff', valueColor:'#fff', labelColor:'rgba(255,255,255,.75)',
      iconBg:'rgba(255,255,255,.2)', iconColor:'#fff',
      background:'linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)',
      border:'none', icon:ICONS.users,
    },
    {
      label:'Classes at Capacity', value:`${fullClasses}/${classes.length}`,
      color:'#fff', valueColor:'#fff', labelColor:'rgba(255,255,255,.75)',
      iconBg:'rgba(255,255,255,.2)', iconColor:'#fff',
      background:'linear-gradient(135deg,#f43f5e 0%,#dc2626 100%)',
      border:'none', icon:ICONS.warning,
    },
    {
      label:'With Assigned Teacher', value:`${withTeacher}/${classes.length}`,
      color:'#fff', valueColor:'#fff', labelColor:'rgba(255,255,255,.75)',
      iconBg:'rgba(255,255,255,.2)', iconColor:'#fff',
      background:'linear-gradient(135deg,#0ea5e9 0%,#0369a1 100%)',
      border:'none', icon:ICONS.teacher,
    },
  ].map(({ label, value, valueColor, labelColor, iconBg, iconColor, background, border, icon }, i) => (
    <div key={i} style={{
      background,
      borderRadius:14,
      padding:'20px 24px',
      border: border || 'none',
      display:'flex',
      alignItems:'center',
      gap:16,
      boxShadow:'0 4px 14px rgba(0,0,0,.12)',
      position:'relative',
      overflow:'hidden',
      animation:`slideUp .3s ${i * .08}s ease both`,
    }}>
      {/* decorative circle */}
      <div style={{
        position:'absolute', right:-20, top:-20,
        width:90, height:90, borderRadius:'50%',
        background:'rgba(255,255,255,.08)',
        pointerEvents:'none',
      }}/>
      <div style={{
        width:46, height:46, borderRadius:12,
        background:iconBg,
        display:'flex', alignItems:'center', justifyContent:'center',
        color:iconColor, flexShrink:0,
      }}>
        <Icon path={icon} size={22} />
      </div>
      <div>
        <div style={{
          fontSize:26, fontWeight:800,
          color:valueColor, lineHeight:1, letterSpacing:-.5,
        }}>{value}</div>
        <div style={{
          fontSize:12, fontWeight:500,
          color:labelColor, marginTop:4,
        }}>{label}</div>
      </div>
    </div>
  ))}
</div>
      {/* ── Filters ──────────────────────────────────────────────────────────── */}
      <div style={{ padding:'20px 32px 0', display:'flex', gap:12, flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:'1 1 240px' }}>
          <div style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)',
            color:'#94a3b8', pointerEvents:'none' }}>
            <Icon path={ICONS.search} size={16} />
          </div>
          <input style={{ ...inputStyle, paddingLeft:38, background:'#fff' }}
            placeholder="Search classes…"
            value={filters.search}
            onChange={e => dispatch(setFilters({ search: e.target.value }))}
            onFocus={e => e.target.style.borderColor='#6366f1'}
            onBlur={e => e.target.style.borderColor='#e2e8f0'} />
        </div>

        <select style={{ ...inputStyle, flex:'0 0 160px', background:'#fff', cursor:'pointer' }}
          value={filters.grade_level}
          onChange={e => dispatch(setFilters({ grade_level: e.target.value }))}
          onFocus={e => e.target.style.borderColor='#6366f1'}
          onBlur={e => e.target.style.borderColor='#e2e8f0'}>
          <option value="">All Grades</option>
          {Object.entries(GRADE_LABELS).map(([v,l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>

        {(filters.search || filters.grade_level) && (
          <button onClick={() => dispatch(clearFilters())} style={{
            display:'flex', alignItems:'center', gap:6,
            padding:'10px 14px', border:'1.5px solid #fca5a5',
            background:'#fef2f2', borderRadius:10, cursor:'pointer',
            fontSize:13, fontWeight:600, color:'#dc2626', fontFamily:'inherit',
          }}>
            <Icon path={ICONS.close} size={13} />
            Clear
          </button>
        )}
      </div>

      {/* ── Grid ─────────────────────────────────────────────────────────────── */}
      <div style={{ padding:'20px 32px 40px' }}>
        {loading.list ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
            {[...Array(6)].map((_,i) => (
              <div key={i} style={{ height:180, background:'#fff', borderRadius:16,
                border:'1.5px solid #f1f5f9',
                animation:`pulse 1.4s ${i*.1}s ease-in-out infinite` }}>
                <style>{`@keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}`}</style>
              </div>
            ))}
          </div>
        ) : classes.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 0', color:'#94a3b8' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🏫</div>
            <h3 style={{ margin:'0 0 8px', fontSize:18, fontWeight:700, color:'#cbd5e1' }}>
              No classes found
            </h3>
            <p style={{ margin:'0 0 20px', fontSize:14 }}>
              {filters.search || filters.grade_level
                ? 'Try adjusting your filters'
                : 'Create your first class to get started'}
            </p>
            {!filters.search && !filters.grade_level && (
              <button onClick={() => setModal('create')} style={{
                display:'inline-flex', alignItems:'center', gap:8,
                padding:'10px 20px', background:'#6366f1', color:'#fff',
                border:'none', borderRadius:10, cursor:'pointer',
                fontFamily:'inherit', fontSize:14, fontWeight:700,
              }}>
                <Icon path={ICONS.plus} size={16} />
                New Class
              </button>
            )}
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
            {classes.map((cls) => (
              <ClassCard
                key={cls.id}
                cls={cls}
                selected={target?.id === cls.id}
                onSelect={() => setTarget(t => t?.id === cls.id ? null : cls)}
                onEdit={(c)            => { setTarget(c); setModal('edit'); }}
                onDelete={(c)          => { setTarget(c); setModal('delete'); }}
                onViewStudents={(c)    => { setTarget(c); setModal('students'); }}
                onManageTeacher={(c)   => { setTarget(c); setModal('teacher'); }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      {modal === 'create' && (
        <ClassFormModal
          onSubmit={handleCreate}
          onClose={closeModal}
          loading={loading.create}
        />
      )}
      {modal === 'edit' && target && (
        <ClassFormModal
          initial={target}
          onSubmit={handleUpdate}
          onClose={closeModal}
          loading={loading.update}
        />
      )}
      {modal === 'delete' && target && (
        <ConfirmModal
          message={`Are you sure you want to delete "${target.name}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onClose={closeModal}
          loading={loading.delete}
        />
      )}
      {modal === 'students' && target && (
        <StudentsModal
          cls={target}
          students={students}
          loading={loading.students}
          onClose={closeModal}
        />
      )}
      {modal === 'teacher' && target && (
        <TeacherModal
          cls={target}
          onAssign={handleAssignTeacher}
          onRemove={handleRemoveTeacher}
          onClose={closeModal}
          loading={loading.teacher}
        />
      )}

      {/* ── Toasts ───────────────────────────────────────────────────────────── */}
      {error   && <Toast message={error}   type="error"   onClose={clearToast} />}
      {success && <Toast message={success} type="success" onClose={clearToast} />}
    </div>
  );
}