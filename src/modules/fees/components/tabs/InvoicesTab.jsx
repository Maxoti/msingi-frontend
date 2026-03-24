import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchInvoices, selectInvoices, selectInvoicesPagination, selectInvoicesLoading, selectInvoicesError } from "../../fees.slice";
import { C } from "../constants";
import { Surface, TH, TD, Chip, Mono, EmptyState, SkeletonRows, Btn, Alert, Pagination } from "../primitives";
import { CreateInvoiceModal } from "../CreateInvoiceModal";
import { MpesaModal } from "../MpesaModal";

export const InvoicesTab = ({ activeTerm }) => {
  const dispatch   = useDispatch();
  const invoices   = useSelector(selectInvoices);
  const pagination = useSelector(selectInvoicesPagination);
  const loading    = useSelector(selectInvoicesLoading);
  const error      = useSelector(selectInvoicesError);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search,       setSearch]       = useState("");
  const [page,         setPage]         = useState(1);
  const [showCreate,   setShowCreate]   = useState(false);
  const [mpesaInv,     setMpesaInv]     = useState(null);

  const load = useCallback(() => {
    dispatch(fetchInvoices({
      ...(statusFilter !== "ALL" && { status: statusFilter }),
      ...(activeTerm            && { term_id: activeTerm }),
      ...(search                && { student_id: search }),
      page, limit: 15,
    }));
  }, [statusFilter, activeTerm, search, page]);

  useEffect(() => { load(); }, [load]);

  const statusCfg = {
    PAID:      { color: C.emerald, bg: C.emeraldDim },
    PARTIAL:   { color: C.amber,   bg: C.amberDim   },
    UNPAID:    { color: C.rose,    bg: C.roseDim     },
    CANCELLED: { color: C.muted,   bg: "#F1F5F9"     },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {["ALL","PAID","PARTIAL","UNPAID"].map(s => (
            <button key={s} className={`fm filter-tag ${statusFilter === s ? "active" : ""}`}
              onClick={() => { setStatusFilter(s); setPage(1); }}>{s}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <input placeholder="  Search student…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 9, padding: "8px 14px", fontSize: 13, outline: "none", width: 220, color: C.text }} />
          <Btn onClick={() => setShowCreate(true)}>+ New Invoice</Btn>
        </div>
      </div>

      {error && <Alert type="error" msg={error} />}

      <Surface style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Invoice","Student","Term","Total","Paid","Balance","Status","Actions"].map(h => <TH key={h} label={h} />)}</tr></thead>
          <tbody>
            {loading ? <SkeletonRows cols={8} /> : invoices.length === 0 ? (
              <tr><td colSpan={8}><EmptyState title="No invoices found" sub="Try adjusting your filters" /></td></tr>
            ) : invoices.map((inv, i) => {
              const balance = parseFloat(inv.total_amount) - parseFloat(inv.paid_amount || 0);
              const cfg     = statusCfg[inv.status] || statusCfg.UNPAID;
              return (
                <tr key={inv.id} className="row-hover in" style={{ animationDelay: `${i * 25}ms`, transition: "background .12s" }}>
                  <TD><Mono color={C.indigo}>{inv.invoice_no || `INV-${inv.id}`}</Mono></TD>
                  <TD>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{inv.student_name}</div>
                    <Mono color={C.subtle}>{inv.admission_no}</Mono>
                  </TD>
                  <TD><span style={{ fontSize: 12.5, color: C.muted }}>{inv.term_name}</span></TD>
                  <TD><Mono color={C.ink}>{parseFloat(inv.total_amount).toLocaleString()}</Mono></TD>
                  <TD><Mono color={C.emerald}>{parseFloat(inv.paid_amount || 0).toLocaleString()}</Mono></TD>
                  <TD><Mono color={balance > 0 ? C.rose : C.muted}>{balance.toLocaleString()}</Mono></TD>
                  <TD><Chip label={inv.status} color={cfg.color} bg={cfg.bg} /></TD>
                  <TD>
                    <div style={{ display: "flex", gap: 6 }}>
                      {balance > 0 && (
                        <Btn size="sm" variant="mpesa" onClick={() => setMpesaInv({ ...inv, balance })}> Pay</Btn>
                      )}
                      <Btn size="sm" variant="outline">View</Btn>
                    </div>
                  </TD>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && <Pagination pagination={pagination} onPage={setPage} />}
      </Surface>

      {showCreate && <CreateInvoiceModal onClose={() => setShowCreate(false)} />}
      {mpesaInv   && <MpesaModal invoice={mpesaInv} onClose={() => setMpesaInv(null)} />}
    </div>
  );
};