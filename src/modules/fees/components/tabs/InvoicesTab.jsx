import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchInvoices, fetchInvoiceById,
  selectInvoices, selectInvoicesPagination,
  selectInvoicesLoading, selectInvoicesError,
  selectSelectedInvoice, clearSelectedInvoice,
} from "../../fees.slice";
import { C } from "../constants";
import {
  Surface, TH, TD, Chip, Mono,
  EmptyState, SkeletonRows, Btn, Alert, Pagination,
} from "../primitives";
import { CreateInvoiceModal } from "../CreateInvoiceModal";
import { MpesaModal }         from "../MpesaModal";

// ─── Invoice View Modal ───────────────────────────────────────────────────────
const InvoiceViewModal = ({ invoice, onClose }) => {
  const balance = parseFloat(invoice.total_amount) - parseFloat(invoice.paid_amount || 0);

  const statusColor = {
    PAID:      { color: C.emerald, bg: C.emeraldDim },
    PARTIAL:   { color: C.amber,   bg: C.amberDim   },
    UNPAID:    { color: C.rose,    bg: C.roseDim     },
    CANCELLED: { color: C.muted,   bg: "#F1F5F9"     },
  }[invoice.status] || { color: C.muted, bg: "#F1F5F9" };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(15,23,42,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: "#fff", borderRadius: 16, width: "100%", maxWidth: 560,
        boxShadow: "0 24px 64px rgba(15,23,42,.18)",
        overflow: "hidden",
        maxHeight: "90vh",
        overflowY: "auto",
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #1a1a2e, #6c63ff)",
          padding: "18px 20px",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        }}>
          <div>
            <div style={{ color: "rgba(255,255,255,.65)", fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
              Invoice
            </div>
            <div style={{ color: "#fff", fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>
              {invoice.invoice_no || `INV-${invoice.id}`}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              background: statusColor.bg, color: statusColor.color,
              padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700,
            }}>
              {invoice.status}
            </span>
            <button onClick={onClose} style={{
              background: "rgba(255,255,255,.15)", border: "none", color: "#fff",
              width: 32, height: 32, borderRadius: 8, cursor: "pointer",
              fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
            }}>×</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 20px", display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Student info — 1 col on mobile, 2 on desktop */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
            <div>
              <div style={labelStyle}>Student</div>
              <div style={valueStyle}>{invoice.student_name || "—"}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{invoice.admission_no}</div>
            </div>
            <div>
              <div style={labelStyle}>Academic Term</div>
              <div style={valueStyle}>{invoice.term_name || "—"}</div>
            </div>
            <div>
              <div style={labelStyle}>Issue Date</div>
              <div style={valueStyle}>
                {invoice.created_at ? new Date(invoice.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }) : "—"}
              </div>
            </div>
            <div>
              <div style={labelStyle}>Class</div>
              <div style={valueStyle}>{invoice.class_name || "—"}</div>
            </div>
          </div>

          {/* Line items */}
          {Array.isArray(invoice.items) && invoice.items.length > 0 && (
            <div>
              <div style={{ ...labelStyle, marginBottom: 10 }}>Fee Breakdown</div>
              <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
                {invoice.items.map((item, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between",
                    padding: "10px 14px",
                    borderBottom: i < invoice.items.length - 1 ? `1px solid ${C.border}` : "none",
                    background: i % 2 === 0 ? "#fff" : "#FAFAFA",
                    fontSize: 13, gap: 8,
                  }}>
                    <span style={{ color: C.text, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.description || item.fee_category || `Item ${i + 1}`}
                    </span>
                    <span style={{ fontWeight: 600, color: C.ink, flexShrink: 0 }}>
                      KES {parseFloat(item.amount).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Totals */}
          <div style={{
            background: "#F8FAFC", borderRadius: 12, padding: "16px 16px",
            display: "flex", flexDirection: "column", gap: 10,
          }}>
            {[
              { label: "Total Amount", val: parseFloat(invoice.total_amount).toLocaleString(), color: C.ink },
              { label: "Amount Paid",  val: parseFloat(invoice.paid_amount || 0).toLocaleString(), color: C.emerald },
              { label: "Balance Due",  val: balance.toLocaleString(), color: balance > 0 ? C.rose : C.emerald, bold: true },
            ].map(row => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: C.muted }}>{row.label}</span>
                <span style={{ fontSize: row.bold ? 16 : 13, fontWeight: row.bold ? 700 : 600, color: row.color, fontVariantNumeric: "tabular-nums" }}>
                  KES {row.val}
                </span>
              </div>
            ))}
          </div>

          {invoice.notes && (
            <div>
              <div style={labelStyle}>Notes</div>
              <div style={{ fontSize: 13, color: C.text, marginTop: 4 }}>{invoice.notes}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 20px", borderTop: `1px solid ${C.border}`,
          display: "flex", justifyContent: "flex-end", gap: 10,
          background: "#FAFAFA",
        }}>
          <Btn variant="outline" onClick={onClose}>Close</Btn>
          {balance > 0 && <Btn variant="mpesa" onClick={onClose}>Pay Now</Btn>}
        </div>
      </div>
    </div>
  );
};

const labelStyle = { fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 };
const valueStyle = { fontSize: 14, fontWeight: 600, color: C.ink };

// ─── Mobile Invoice Card ──────────────────────────────────────────────────────
const InvoiceCard = ({ inv, statusCfg, onPay, onView }) => {
  const balance = parseFloat(inv.total_amount) - parseFloat(inv.paid_amount || 0);
  const cfg     = statusCfg[inv.status] || statusCfg.UNPAID;

  return (
    <div style={{
      background: C.surface,
      borderRadius: 12,
      border: `1px solid ${C.border}`,
      padding: 14,
      display: "flex",
      flexDirection: "column",
      gap: 10,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <Mono color={C.indigo}>{inv.invoice_no || `INV-${inv.id}`}</Mono>
          <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {inv.student_name}
          </div>
          <Mono color={C.subtle}>{inv.admission_no}</Mono>
        </div>
        <Chip label={inv.status} color={cfg.color} bg={cfg.bg} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 12 }}>
        <div>
          <div style={{ color: C.muted, marginBottom: 2 }}>Total</div>
          <Mono color={C.ink}>{parseFloat(inv.total_amount).toLocaleString()}</Mono>
        </div>
        <div>
          <div style={{ color: C.muted, marginBottom: 2 }}>Paid</div>
          <Mono color={C.emerald}>{parseFloat(inv.paid_amount || 0).toLocaleString()}</Mono>
        </div>
        <div>
          <div style={{ color: C.muted, marginBottom: 2 }}>Balance</div>
          <Mono color={balance > 0 ? C.rose : C.muted}>{balance.toLocaleString()}</Mono>
        </div>
      </div>

      {inv.term_name && (
        <div style={{ fontSize: 12, color: C.muted }}>{inv.term_name}</div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        {balance > 0 && (
          <Btn size="sm" variant="mpesa" style={{ flex: 1 }} onClick={() => onPay({ ...inv, balance })}>
            Pay
          </Btn>
        )}
        <Btn size="sm" variant="outline" style={{ flex: 1 }} onClick={() => onView(inv)}>
          View
        </Btn>
      </div>
    </div>
  );
};

// ─── Invoices Tab ─────────────────────────────────────────────────────────────
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
  const [viewInv,      setViewInv]      = useState(null);
  const [isMobile,     setIsMobile]     = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

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

      {/* Filters row */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Status filters — scrollable */}
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <div style={{ display: "flex", gap: 8, minWidth: "max-content" }}>
            {["ALL", "PAID", "PARTIAL", "UNPAID"].map(s => (
              <button key={s} className={`fm filter-tag ${statusFilter === s ? "active" : ""}`}
                onClick={() => { setStatusFilter(s); setPage(1); }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Search + New Invoice */}
        <div style={{ display: "flex", gap: 10 }}>
          <input
            placeholder="Search student…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{
              flex: 1,
              background: C.surface, border: `1.5px solid ${C.border}`,
              borderRadius: 9, padding: "8px 14px", fontSize: 13,
              outline: "none", color: C.text,
            }}
          />
          <Btn onClick={() => setShowCreate(true)}>+ New Invoice</Btn>
        </div>
      </div>

      {error && <Alert type="error" msg={error} />}

      {/* Mobile: cards */}
      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {loading ? (
            [0,1,2].map(i => (
              <div key={i} style={{ height: 160, borderRadius: 12, background: C.surface, border: `1px solid ${C.border}` }}>
                <div className="sk" style={{ height: "100%", borderRadius: 12 }} />
              </div>
            ))
          ) : invoices.length === 0 ? (
            <EmptyState title="No invoices found" sub="Try adjusting your filters" />
          ) : invoices.map((inv, i) => (
            <InvoiceCard
              key={inv.id || i}
              inv={inv}
              statusCfg={statusCfg}
              onPay={setMpesaInv}
              onView={setViewInv}
            />
          ))}
          {!loading && <Pagination pagination={pagination} onPage={setPage} />}
        </div>
      ) : (
        /* Desktop: table */
        <Surface style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>{["Invoice","Student","Term","Total","Paid","Balance","Status","Actions"].map(h => <TH key={h} label={h} />)}</tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={8} />
              ) : invoices.length === 0 ? (
                <tr><td colSpan={8}><EmptyState title="No invoices found" sub="Try adjusting your filters" /></td></tr>
              ) : invoices.map((inv, i) => {
                const balance = parseFloat(inv.total_amount) - parseFloat(inv.paid_amount || 0);
                const cfg     = statusCfg[inv.status] || statusCfg.UNPAID;
                return (
                  <tr key={inv.id} className="row-hover in" style={{ animationDelay: `${i * 25}ms` }}>
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
                          <Btn size="sm" variant="mpesa" onClick={() => setMpesaInv({ ...inv, balance })}>Pay</Btn>
                        )}
                        <Btn size="sm" variant="outline" onClick={() => setViewInv(inv)}>View</Btn>
                      </div>
                    </TD>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && <Pagination pagination={pagination} onPage={setPage} />}
        </Surface>
      )}

      {showCreate && <CreateInvoiceModal onClose={() => setShowCreate(false)} onCreated={load} />}
      {mpesaInv   && <MpesaModal invoice={mpesaInv} onClose={() => setMpesaInv(null)} />}
      {viewInv    && <InvoiceViewModal invoice={viewInv} onClose={() => setViewInv(null)} />}
    </div>
  );
};