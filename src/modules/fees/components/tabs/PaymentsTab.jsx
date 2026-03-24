import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPayments, selectPayments, selectPaymentsPagination, selectPaymentsLoading } from "../../fees.slice";
import { C } from "../constants";
import { Surface, TH, TD, Chip, Mono, EmptyState, SkeletonRows, Pagination } from "../primitives";

export const PaymentsTab = () => {
  const dispatch   = useDispatch();
  const payments   = useSelector(selectPayments);
  const pagination = useSelector(selectPaymentsPagination);
  const loading    = useSelector(selectPaymentsLoading);

  const [method,    setMethod]    = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate,   setEndDate]   = useState("");
  const [page,      setPage]      = useState(1);

  useEffect(() => {
    dispatch(fetchPayments({
      ...(method    && { payment_method: method }),
      ...(startDate && { start_date: startDate }),
      ...(endDate   && { end_date: endDate }),
      page, limit: 15,
    }));
  }, [method, startDate, endDate, page]);

  const methodCfg = {
    MPESA: { color: C.emerald, bg: C.emeraldDim, },
    BANK:  { color: C.sky,     bg: C.skyDim,      },
    CASH:  { color: C.amber,   bg: C.amberDim,   },
  };

  const inp = {
    background: C.surface, border: `1.5px solid ${C.border}`,
    borderRadius: 9, padding: "8px 12px", fontSize: 13,
    color: C.text, outline: "none",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap", alignItems: "center" }}>
        <select value={method} onChange={e => { setMethod(e.target.value); setPage(1); }}
          style={{ ...inp, cursor: "pointer", fontFamily: "'Sora',sans-serif" }}>
          <option value="">All Methods</option>
          <option value="MPESA">M-Pesa</option>
          <option value="BANK">Bank Transfer</option>
          <option value="CASH">Cash</option>
        </select>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inp} />
        <input type="date" value={endDate}   onChange={e => setEndDate(e.target.value)}   style={inp} />
      </div>

      <Surface style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Ref Code","Student","Invoice","Amount","Method","Date","Received By"].map(h => <TH key={h} label={h} />)}</tr></thead>
          <tbody>
            {loading ? <SkeletonRows cols={7} /> : payments.length === 0 ? (
              <tr><td colSpan={7}><EmptyState  title="No payments found" sub="Try adjusting the date range or method filter" /></td></tr>
            ) : payments.map((p, i) => {
              const m = methodCfg[p.payment_method] || { color: C.muted, bg: "#F1F5F9", icon: "💳" };
              return (
                <tr key={p.id || i} className="row-hover in" style={{ animationDelay: `${i * 25}ms` }}>
                  <TD><Mono>{p.reference_number || "—"}</Mono></TD>
                  <TD><span style={{ fontWeight: 600 }}>{p.student_name || "—"}</span></TD>
                  <TD><Mono color={C.indigo}>{p.invoice_no || `INV-${p.invoice_id}`}</Mono></TD>
                  <TD><Mono color={C.emerald}>KES {parseFloat(p.amount).toLocaleString()}</Mono></TD>
                  <TD><Chip label={`${m.icon} ${p.payment_method || "—"}`} color={m.color} bg={m.bg} /></TD>
                  <TD><span style={{ fontSize: 12.5, color: C.muted }}>{p.payment_date}</span></TD>
                  <TD><span style={{ fontSize: 12.5, color: C.muted }}>{p.received_by || "—"}</span></TD>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && <Pagination pagination={pagination} onPage={setPage} />}
      </Surface>
    </div>
  );
};