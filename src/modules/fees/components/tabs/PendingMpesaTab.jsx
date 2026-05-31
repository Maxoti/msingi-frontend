import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPendingMpesa, reconcileByReceipt, reconcileMpesaTransaction,
  resetReconcile, resetReceiptReconcile,
  selectMpesaPending, selectMpesaPendingLoading,
  selectMpesaReconcile, selectReceiptReconcile,
} from "../../fees.slice";
import { C } from "../constants";
import { Surface, TH, TD, Mono, EmptyState, SkeletonRows, Btn, Inp, Alert } from "../primitives";

// ─── Mobile Pending Card ──────────────────────────────────────────────────────
const PendingCard = ({ tx, activeRow, setActiveRow, studentId, setStudentId, invoiceId, setInvoiceId, reconcile, onReconcile, onCancel, dispatch, resetReconcile: resetRec }) => {
  const isActive = activeRow === tx.id;

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
      {/* Receipt + Amount */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <Mono color={C.emerald}>{tx.mpesa_receipt_number}</Mono>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{tx.phone_number}</div>
        </div>
        <span style={{ fontWeight: 700, color: C.emerald, fontFamily: "'DM Mono',monospace", fontSize: 14 }}>
          KES {parseFloat(tx.amount).toLocaleString()}
        </span>
      </div>

      {/* Date + Account Ref */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
        <span style={{ color: C.muted }}>
          {(tx.transaction_date || tx.created_at || "").split("T")[0]}
        </span>
        <span style={{
          fontWeight: 500,
          color: tx.account_reference ? C.text : C.rose,
        }}>
          {tx.account_reference || "⚠ missing ref"}
        </span>
      </div>

      {/* Action */}
      {!isActive ? (
        <Btn size="sm" variant="outline"
          onClick={() => { setActiveRow(tx.id); setStudentId(""); setInvoiceId(""); }}>
          Reconcile
        </Btn>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, background: "#F8FAFC", borderRadius: 10, padding: 12 }}>
          <Inp label="Student ID" placeholder="DB id"
            value={studentId} onChange={e => setStudentId(e.target.value)} />
          <Inp label="Invoice ID" placeholder="DB id"
            value={invoiceId} onChange={e => setInvoiceId(e.target.value)} />
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="outline" size="sm" style={{ flex: 1 }} onClick={onCancel}>Cancel</Btn>
            <Btn variant="mpesa" size="sm" style={{ flex: 2 }} loading={reconcile.loading}
              onClick={() => onReconcile(tx)}>
              Link Invoice
            </Btn>
          </div>
          {reconcile.error && (
            <Alert type="error" msg={reconcile.error}
              onDismiss={() => dispatch(resetRec())} />
          )}
        </div>
      )}
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────
export const PendingMpesaTab = () => {
  const dispatch         = useDispatch();
  const pending          = useSelector(selectMpesaPending);
  const pendingLoading   = useSelector(selectMpesaPendingLoading);
  const reconcile        = useSelector(selectMpesaReconcile);
  const receiptReconcile = useSelector(selectReceiptReconcile);

  const [activeRow, setActiveRow] = useState(null);
  const [studentId, setStudentId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [receiptNo, setReceiptNo] = useState("");
  const [isMobile,  setIsMobile]  = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => { dispatch(fetchPendingMpesa()); }, []);

  useEffect(() => {
    if (reconcile.success) {
      dispatch(resetReconcile());
      setActiveRow(null); setStudentId(""); setInvoiceId("");
    }
  }, [reconcile.success]);

  useEffect(() => {
    if (receiptReconcile.success) {
      dispatch(resetReceiptReconcile());
      setReceiptNo("");
      dispatch(fetchPendingMpesa());
    }
  }, [receiptReconcile.success]);

  const cancelRow = () => { setActiveRow(null); setStudentId(""); setInvoiceId(""); };

  const handleManualReconcile = (tx) => {
    if (!studentId || !invoiceId) return;
    dispatch(reconcileMpesaTransaction({
      transactionId: tx.id,
      student_id:    parseInt(studentId, 10),
      invoice_id:    parseInt(invoiceId, 10),
    }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Banner */}
      <div style={{
        padding: "12px 14px",
        background: pending.length ? C.amberDim : C.emeraldDim,
        border: `1px solid ${pending.length ? C.amber : C.emerald}30`,
        borderRadius: 12,
        display: "flex",
        gap: 12,
        alignItems: "center",
        flexWrap: "wrap",
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: pending.length ? `${C.amber}22` : `${C.emerald}22`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, flexShrink: 0,
        }}>
          {pending.length ? "🔄" : "✅"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, marginBottom: 2, fontSize: 13 }}>
            {pending.length} unmatched M-Pesa transaction{pending.length !== 1 ? "s" : ""}
          </div>
          <div style={{ fontSize: 12, color: C.muted }}>
            Payments received via callback not yet linked to an invoice.
          </div>
        </div>
        <Btn size="sm" variant="outline" onClick={() => dispatch(fetchPendingMpesa())}>↻ Refresh</Btn>
      </div>

      {/* Quick reconcile by receipt */}
      <Surface style={{ padding: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Quick Reconcile by Receipt</div>
        <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 14 }}>
          Enter the M-Pesa receipt code — the system will auto-match it to the correct invoice.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }} className="fm-reconcile-row">
          <Inp
            label="M-Pesa Receipt No."
            placeholder="e.g. QKF5T"
            value={receiptNo}
            onChange={e => setReceiptNo(e.target.value.toUpperCase())}
          />
          <Btn
            variant="mpesa"
            loading={receiptReconcile.loading}
            onClick={() => { if (receiptNo) dispatch(reconcileByReceipt({ receipt_number: receiptNo })); }}
          >
            Auto-Reconcile
          </Btn>
        </div>
        {receiptReconcile.error   && <div style={{ marginTop: 10 }}><Alert type="error"   msg={receiptReconcile.error} /></div>}
        {receiptReconcile.success && <div style={{ marginTop: 10 }}><Alert type="success" msg="Transaction reconciled successfully" /></div>}
      </Surface>

      {/* Mobile: cards */}
      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {pendingLoading ? (
            [0,1,2].map(i => (
              <div key={i} style={{ height: 130, borderRadius: 12, background: C.surface, border: `1px solid ${C.border}` }}>
                <div className="sk" style={{ height: "100%", borderRadius: 12 }} />
              </div>
            ))
          ) : pending.length === 0 ? (
            <EmptyState icon="✅" title="All transactions reconciled" sub="No unmatched M-Pesa payments in the queue" />
          ) : pending.map((tx, i) => (
            <PendingCard
              key={tx.id}
              tx={tx}
              activeRow={activeRow}
              setActiveRow={setActiveRow}
              studentId={studentId}
              setStudentId={setStudentId}
              invoiceId={invoiceId}
              setInvoiceId={setInvoiceId}
              reconcile={reconcile}
              onReconcile={handleManualReconcile}
              onCancel={cancelRow}
              dispatch={dispatch}
              resetReconcile={resetReconcile}
            />
          ))}
        </div>
      ) : (
        /* Desktop: table */
        <Surface style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Receipt No.","Phone","Amount","Date","Account Ref","Actions"].map(h => (
                  <TH key={h} label={h} />
                ))}
              </tr>
            </thead>
            <tbody>
              {pendingLoading ? (
                <SkeletonRows cols={6} />
              ) : pending.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState icon="✅" title="All transactions reconciled"
                      sub="No unmatched M-Pesa payments in the queue" />
                  </td>
                </tr>
              ) : pending.map((tx, i) => (
                <React.Fragment key={tx.id}>
                  <tr className="row-hover in" style={{ animationDelay: `${i * 35}ms` }}>
                    <TD><Mono color={C.emerald}>{tx.mpesa_receipt_number}</Mono></TD>
                    <TD><span style={{ fontSize: 12.5, color: C.muted }}>{tx.phone_number}</span></TD>
                    <TD><Mono color={C.emerald}>KES {parseFloat(tx.amount).toLocaleString()}</Mono></TD>
                    <TD><span style={{ fontSize: 12.5, color: C.muted }}>{(tx.transaction_date || tx.created_at || "").split("T")[0]}</span></TD>
                    <TD>
                      <span style={{ fontSize: 12.5, fontWeight: 500, color: tx.account_reference ? C.text : C.rose }}>
                        {tx.account_reference || "⚠ missing"}
                      </span>
                    </TD>
                    <TD>
                      {activeRow === tx.id ? (
                        <Btn size="sm" variant="danger" onClick={cancelRow}>Cancel</Btn>
                      ) : (
                        <Btn size="sm" variant="outline"
                          onClick={() => { setActiveRow(tx.id); setStudentId(""); setInvoiceId(""); }}>
                          Reconcile
                        </Btn>
                      )}
                    </TD>
                  </tr>

                  {activeRow === tx.id && (
                    <tr>
                      <td colSpan={6} style={{ padding: "0 16px 16px", borderBottom: `1px solid ${C.border}`, background: "#F8FAFC" }}>
                        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", paddingTop: 14 }}>
                          <div style={{ width: 180 }}>
                            <Inp label="Student ID" placeholder="DB id"
                              value={studentId} onChange={e => setStudentId(e.target.value)} />
                          </div>
                          <div style={{ width: 180 }}>
                            <Inp label="Invoice ID" placeholder="DB id"
                              value={invoiceId} onChange={e => setInvoiceId(e.target.value)} />
                          </div>
                          <Btn variant="mpesa" size="sm" loading={reconcile.loading}
                            onClick={() => handleManualReconcile(tx)}>
                            Link Invoice
                          </Btn>
                        </div>
                        {reconcile.error && (
                          <div style={{ marginTop: 10 }}>
                            <Alert type="error" msg={reconcile.error}
                              onDismiss={() => dispatch(resetReconcile())} />
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </Surface>
      )}

      <style>{`
        @media (min-width: 768px) {
          .fm-reconcile-row { flex-direction: row !important; align-items: flex-end; }
          .fm-reconcile-row > * { flex: 1; }
          .fm-reconcile-row > button { flex: 0 0 auto; }
        }
      `}</style>
    </div>
  );
};