import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCollectionSummary, fetchPayments, selectCollectionSummary, selectSummaryLoading, selectPayments } from "../../fees.slice";
import { C } from "../constants";
import { Surface, StatCard, Chip, Mono, Bar, EmptyState } from "../primitives";

export const DashboardTab = ({ activeTerm }) => {
  const dispatch = useDispatch();
  const summary  = useSelector(selectCollectionSummary);
  const loading  = useSelector(selectSummaryLoading);
  const payments = useSelector(selectPayments);

  useEffect(() => {
    dispatch(fetchCollectionSummary(activeTerm ? { term_id: activeTerm } : {}));
    dispatch(fetchPayments({ limit: 6 }));
  }, [activeTerm]);

  const fmt = v => parseFloat(v || 0).toLocaleString("en-KE");
  const pct = (a, b) => b > 0 ? Math.round((a / b) * 100) : 0;
  const collected = parseFloat(summary?.total_collected || 0);
  const billed    = parseFloat(summary?.total_billed    || 0);

  const methodCfg = {
    MPESA: { color: C.emerald, bg: C.emeraldDim, icon: "💚" },
    BANK:  { color: C.sky,     bg: C.skyDim,     icon: "🏦" },
    CASH:  { color: C.amber,   bg: C.amberDim,   icon: "💵" },
  };

  const stats = summary ? [
    { label: "Total Billed",  value: `KES ${fmt(billed)}`,                   color: C.indigo,  colorDim: C.indigoDim,  delay: 0 },
    { label: "Collected",     value: `KES ${fmt(collected)}`,                 color: C.emerald, colorDim: C.emeraldDim, delay: 60,  pct: pct(collected, billed), sub: `${pct(collected, billed)}% collection rate` },
    { label: "Outstanding",   value: `KES ${fmt(summary?.total_outstanding)}`,color: C.rose,    colorDim: C.roseDim,    delay: 120 },
    { label: "M-Pesa (MTD)",  value: `KES ${fmt(summary?.mpesa_total)}`,      color: C.emerald, colorDim: C.emeraldDim, delay: 180 },
  ] : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        {loading
          ? [0,1,2,3].map(i => <Surface key={i} style={{ height: 124 }}><div className="sk" style={{ height: "100%", borderRadius: 13 }} /></Surface>)
          : stats.map(s => <StatCard key={s.label} {...s} />)
        }
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "5fr 2fr", gap: 16 }}>
        <Surface>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Recent Payments</span>
            <Chip label="Live" color={C.emerald} bg={C.emeraldDim} />
          </div>
          {payments.slice(0, 6).map((p, i) => {
            const m = methodCfg[p.payment_method] || { color: C.indigo, bg: C.indigoDim, };
            return (
              <div key={p.id || i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 20px", borderBottom: i < 5 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: m.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{m.icon}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.student_name || p.reference_number || "—"}</div>
                    <Mono color={C.subtle}>{p.payment_date}</Mono>
                  </div>
                </div>
                <span style={{ fontWeight: 700, fontSize: 13.5, color: C.emerald, fontFamily: "'DM Mono',monospace" }}>
                  +KES {parseFloat(p.amount || 0).toLocaleString()}
                </span>
              </div>
            );
          })}
          {!payments.length && !loading && <EmptyState  title="No payments yet" sub="Payments will appear here" />}
        </Surface>

        <Surface>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>By Method</span>
          </div>
          <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 18 }}>
            {summary?.by_method?.map(m => {
              const cfg = methodCfg[m.method] || { color: C.indigo, icon: "💳" };
              return (
                <div key={m.method}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 7, fontWeight: 500 }}>
                    <span>{cfg.icon} {m.method}</span>
                    <Mono color={C.ink}>KES {fmt(m.total)}</Mono>
                  </div>
                  <Bar pct={m.percentage || 0} color={cfg.color} height={6} />
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{m.percentage || 0}%</div>
                </div>
              );
            })}
            {!summary?.by_method?.length && <div style={{ fontSize: 13, color: C.muted }}>No data</div>}
          </div>
        </Surface>
      </div>
    </div>
  );
};