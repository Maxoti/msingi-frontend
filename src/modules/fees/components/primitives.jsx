import { C } from "./constants";
export const selStyle = {
  background: C.surface,
  border: `1.5px solid ${C.border}`,
  borderRadius: 9,
  padding: "9px 13px",
  fontSize: 13.5,
  color: C.text,
  width: "100%",
  cursor: "pointer",
};

export const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
    .fm *{box-sizing:border-box;margin:0;padding:0;}
    .fm{font-family:'Sora',sans-serif;font-size:14px;color:${C.text};}
    .fm input,.fm select,.fm textarea,.fm button{font-family:'Sora',sans-serif;}
    .fm ::-webkit-scrollbar{width:4px;height:4px;}
    .fm ::-webkit-scrollbar-track{background:transparent;}
    .fm ::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:4px;}
    @keyframes fm-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
    @keyframes fm-spin{to{transform:rotate(360deg)}}
    @keyframes fm-pulse{0%,100%{opacity:1}50%{opacity:.4}}
    @keyframes fm-shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
    @keyframes fm-pop{0%{opacity:0;transform:scale(.94)}100%{opacity:1;transform:scale(1)}}
    .fm .in{animation:fm-in .22s ease both;}
    .fm .pop{animation:fm-pop .2s ease both;}
    .fm .row-hover:hover{background:#F8FAFC;}
    .fm input:focus,.fm select:focus{
      outline:none;border-color:${C.indigo}!important;
      box-shadow:0 0 0 3px ${C.indigoDim};
    }
    .fm .tab-btn{
      padding:7px 16px;border:none;border-radius:8px;cursor:pointer;
      font-size:12.5px;font-weight:500;font-family:'Sora',sans-serif;
      transition:all .15s;background:transparent;color:${C.muted};
    }
    .fm .tab-btn:hover{background:${C.indigoDim};color:${C.indigo};}
    .fm .tab-btn.active{background:${C.indigo};color:#fff;font-weight:600;}
    .fm .filter-tag{
      padding:5px 14px;border-radius:20px;font-size:12px;font-weight:500;
      cursor:pointer;border:1.5px solid ${C.border};background:${C.surface};color:${C.muted};
      transition:all .15s;
    }
    .fm .filter-tag.active{border-color:${C.indigo};background:${C.indigoDim};color:${C.indigo};}
    .fm .filter-tag:hover:not(.active){border-color:#C7D2FE;color:${C.indigo};}
    .fm .sk{
      background:linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%);
      background-size:400px 100%;animation:fm-shimmer 1.4s ease infinite;border-radius:8px;
    }
  `}</style>
);

export const Spinner = ({ size = 18, color = C.indigo }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%",
    border: `2px solid ${color}28`, borderTopColor: color,
    animation: "fm-spin .65s linear infinite",
    display: "inline-block", flexShrink: 0,
  }} />
);

export const Chip = ({ label, color = C.indigo, bg = C.indigoDim }) => (
  <span style={{
    display: "inline-flex", alignItems: "center",
    padding: "2px 9px", borderRadius: 20,
    fontSize: 11, fontWeight: 600, letterSpacing: .3,
    background: bg, color, border: `1px solid ${color}28`,
  }}>{label}</span>
);

export const Mono = ({ children, color = C.muted }) => (
  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color }}>{children}</span>
);

export const Inp = ({ label, error, ...props }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    {label && (
      <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: .5 }}>
        {label}
      </label>
    )}
    <input {...props} style={{
      background: C.surface, border: `1.5px solid ${error ? C.rose : C.border}`,
      borderRadius: 9, padding: "9px 13px", color: C.text,
      fontSize: 13.5, width: "100%", transition: "border .15s, box-shadow .15s",
      ...props.style,
    }} />
    {error && <span style={{ fontSize: 11, color: C.rose }}>{error}</span>}
  </div>
);

export const Btn = ({ children, variant = "primary", size = "md", loading = false, style = {}, ...props }) => {
  const sz = { sm: "5px 13px", md: "9px 18px", lg: "11px 24px" };
  const fs = { sm: 12, md: 13, lg: 14 };
  const vr = {
    primary: { background: C.indigo,    color: "#fff",    border: "none",  boxShadow: `0 2px 8px ${C.indigo}40` },
    outline: { background: C.surface,   color: C.ink,     border: `1.5px solid ${C.border}` },
    ghost:   { background: "transparent",color: C.muted,  border: "none" },
    danger:  { background: C.roseDim,   color: C.rose,    border: `1.5px solid ${C.rose}30` },
    success: { background: C.emeraldDim,color: C.emerald, border: `1.5px solid ${C.emerald}30` },
    mpesa:   { background: "#00A550",   color: "#fff",    border: "none",  boxShadow: "0 2px 8px #00a55040", fontWeight: 600 },
    amber:   { background: C.amberDim,  color: C.amber,   border: `1.5px solid ${C.amber}30` },
  };
  return (
    <button {...props} disabled={loading || props.disabled} style={{
      display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 9,
      cursor: loading || props.disabled ? "not-allowed" : "pointer",
      padding: sz[size], fontSize: fs[size], fontWeight: 500,
      transition: "all .15s", opacity: loading || props.disabled ? .55 : 1,
      ...vr[variant], ...style,
    }}>
      {loading ? <Spinner size={13} color={["primary","mpesa"].includes(variant) ? "#fff" : C.indigo} /> : children}
    </button>
  );
};

export const Surface = ({ children, style = {}, className = "" }) => (
  <div className={className} style={{
    background: C.surface, borderRadius: 14,
    border: `1px solid ${C.border}`, boxShadow: C.shadow, ...style,
  }}>{children}</div>
);

export const Modal = ({ title, subtitle, onClose, children, width = 540 }) => (
  <div style={{
    position: "fixed", inset: 0, background: "rgba(15,23,42,.55)",
    backdropFilter: "blur(4px)", display: "flex",
    alignItems: "center", justifyContent: "center", zIndex: 300, padding: 20,
  }}>
    <div className="pop" style={{
      background: C.surface, borderRadius: 16,
      border: `1px solid ${C.border}`, boxShadow: C.shadow3,
      width, maxHeight: "90vh", overflowY: "auto",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        padding: "20px 24px 18px", borderBottom: `1px solid ${C.border}`,
      }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{title}</h3>
          {subtitle && <p style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{subtitle}</p>}
        </div>
        <button onClick={onClose} style={{
          background: "#F1F5F9", border: "none", borderRadius: 8,
          width: 30, height: 30, cursor: "pointer", color: C.muted,
          fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
        }}>×</button>
      </div>
      <div style={{ padding: "22px 24px" }}>{children}</div>
    </div>
  </div>
);

export const Alert = ({ type = "error", msg, onDismiss }) => {
  if (!msg) return null;
  const cfg = {
    error:   { bg: C.roseDim,    border: `${C.rose}30`,    color: C.rose,      },
    info:    { bg: C.indigoDim,  border: `${C.indigo}30`,  color: C.indigo,   },
    success: { bg: C.emeraldDim, border: `${C.emerald}30`, color: C.emerald,  },
    warn:    { bg: C.amberDim,   border: `${C.amber}30`,   color: C.amber,   },
  }[type];
  return (
    <div style={{
      padding: "10px 14px", borderRadius: 9,
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      color: cfg.color, fontSize: 12.5, fontWeight: 500,
      display: "flex", alignItems: "center", gap: 8,
    }}>
      <span>{cfg.icon}</span>
      <span style={{ flex: 1 }}>{msg}</span>
      {onDismiss && (
        <button onClick={onDismiss} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 16 }}>×</button>
      )}
    </div>
  );
};

export const EmptyState = ({ icon, title, sub }) => (
  <div style={{ padding: "60px 20px", textAlign: "center" }}>
    <div style={{ fontSize: 40, marginBottom: 14, opacity: .8 }}>{icon}</div>
    <div style={{ fontSize: 15, fontWeight: 600, color: C.ink, marginBottom: 6 }}>{title}</div>
    {sub && <div style={{ fontSize: 12.5, color: C.muted }}>{sub}</div>}
  </div>
);

export const Bar = ({ pct, color = C.emerald, height = 5 }) => (
  <div style={{ background: "#E2E8F0", borderRadius: 99, height, overflow: "hidden" }}>
    <div style={{
      width: `${Math.min(pct, 100)}%`, height: "100%",
      background: color, borderRadius: 99, transition: "width .7s cubic-bezier(.4,0,.2,1)",
    }} />
  </div>
);

export const TH = ({ label }) => (
  <th style={{
    padding: "11px 16px", textAlign: "left",
    fontSize: 11, fontWeight: 600, color: C.subtle,
    letterSpacing: .7, textTransform: "uppercase",
    borderBottom: `1px solid ${C.border}`, background: "#F8FAFC",
    whiteSpace: "nowrap",
  }}>{label}</th>
);

export const TD = ({ children, style = {} }) => (
  <td style={{
    padding: "13px 16px", borderBottom: `1px solid ${C.border}`,
    verticalAlign: "middle", fontSize: 13.5, ...style,
  }}>{children}</td>
);

export const Pagination = ({ pagination, onPage }) => {
  if (!pagination) return null;
  const total = pagination.totalPages ?? pagination.pages ?? 1;
  const count = pagination.totalCount  ?? pagination.total ?? 0;
  const page  = pagination.page ?? 1;
  if (total <= 1) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: `1px solid ${C.border}` }}>
      <span style={{ fontSize: 12, color: C.muted }}><b style={{ color: C.ink }}>{count}</b> total records</span>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <Btn size="sm" variant="outline" disabled={page === 1} onClick={() => onPage(page - 1)}>← Prev</Btn>
        <span style={{ fontSize: 12, color: C.muted, padding: "0 10px", fontWeight: 500 }}>{page} / {total}</span>
        <Btn size="sm" variant="outline" disabled={page === total} onClick={() => onPage(page + 1)}>Next →</Btn>
      </div>
    </div>
  );
};

export const SkeletonRows = ({ cols = 5, rows = 5 }) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i}>
        {Array.from({ length: cols }).map((_, j) => (
          <td key={j} style={{ padding: "13px 16px", borderBottom: `1px solid ${C.border}` }}>
            <div className="sk" style={{ height: 14, width: `${50 + (j * 13) % 40}%` }} />
          </td>
        ))}
      </tr>
    ))}
  </>
);

export const StatCard = ({ icon, label, value, sub, pct, color, colorDim, delay = 0 }) => (
  <div className="in" style={{
    animationDelay: `${delay}ms`,
    padding: "20px 22px",
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
    boxShadow: `0 4px 18px ${color}44`,
  }}>
    {/* decorative circle */}
    <div style={{
      position: "absolute", top: -24, right: -24,
      width: 90, height: 90, borderRadius: "50%",
      background: "rgba(255,255,255,.12)", pointerEvents: "none",
    }} />
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
      <div style={{
        width: 42, height: 42, borderRadius: 11,
        background: "rgba(255,255,255,.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20,
      }}>{icon}</div>
      {pct !== undefined && (
        <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "'DM Mono', monospace" }}>
          {pct}%
        </span>
      )}
    </div>
    <div style={{
      fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.7)",
      textTransform: "uppercase", letterSpacing: .7, marginBottom: 5,
    }}>{label}</div>
    <div style={{
      fontSize: 22, fontWeight: 700, color: "#fff",
      letterSpacing: -0.5, fontFamily: "'DM Mono', monospace",
    }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: "rgba(255,255,255,.65)", marginTop: 4 }}>{sub}</div>}
    {pct !== undefined && (
      <div style={{ marginTop: 12 }}>
        <div style={{ background: "rgba(255,255,255,.25)", borderRadius: 4, height: 5, overflow: "hidden" }}>
          <div style={{
            width: `${Math.min(pct, 100)}%`, height: "100%",
            background: "#fff", borderRadius: 4, transition: "width .6s ease",
          }} />
        </div>
      </div>
    )}
  </div>
);
