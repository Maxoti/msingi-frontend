import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPendingMpesa, reconcileByReceipt, reconcileMpesaTransaction,
  resetReconcile, resetReceiptReconcile,
  selectMpesaPending, selectMpesaPendingLoading,
  selectMpesaReconcile, selectReceiptReconcile,
} from "../../fees.slice";
import { C } from "../constants";
import { Surface, TH, TD, Mono, EmptyState, SkeletonRows, Btn, Inp, Alert } from "../primitives";

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Banner */}
      <div style={{ padding: "14px 18px", background: pending.length ? C.amberDim : C.emeraldDim, border: `1px solid ${pending.length ? C.amber : C.emerald}30`, borderRadius: 12, display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: pending.length ? `${C.amber}22` : `${C.emerald}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
          {pending.length ? "🔄" : "✅"}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, marginBottom: 2 }}>{pending.length} unmatched M-Pesa transaction{pending.length !== 1 ? "s" : ""}</div>
          <div style={{ fontSize: 12.5, color: C.muted }}>Payments received via callback not yet linked to an invoice.</div>
        </div>
        <Btn size="sm" variant="outline" onClick={() => dispatch(fetchPendingMpesa())}>↻ Refresh</Btn>
      </div>

      {/* Quick reconcile by receipt */}
      <Surface style={{ padding: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Quick Reconcile by Receipt</div>
        <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 16 }}>Enter the M-Pesa receipt code — the system will auto-match it to the correct invoice.</div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <div style={{ width: 260 }}>
            <Inp label="M-Pesa Receipt No." placeholder="e.g. QKF5TXXX" value={receiptNo}
              onChange={e => setReceiptNo(e.target.value.toUpperCase())} />
          </div>
          <Btn variant="mpesa" loading={receiptReconcile.loading}
            onClick={() => { if (receiptNo) dispatch(reconcileByReceipt({ receipt_number: receiptNo })); }}>
             Auto-Reconcile
          </Btn>
        </div>
        {receiptReconcile.error   && <div style={{ marginTop: 10 }}><Alert type="error"   msg={receiptReconcile.error} /></div>}
        {receiptReconcile.success && <div style={{ marginTop: 10 }}><Alert type="success" msg="Transaction reconciled successfully" /></div>}
      </Surface>

      {/* Pending table */}
      <Surface style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Receipt No.","Phone","Amount","Date","Account Ref","Actions"].map(h => <TH key={h} label={h} />)}</tr></thead>
          <tbody>
            {pendingLoading ? <SkeletonRows cols={6} /> : pending.length === 0 ? (
              <tr><td colSpan={6}><EmptyState icon="✅" title="All transactions reconciled" sub="No unmatched M-Pesa payments in the queue" /></td></tr>
            ) : pending.map((tx, i) => (
              <>
                <tr key={tx.id} className="row-hover in" style={{ animationDelay: `${i * 35}ms` }}>
                  <TD><Mono color={C.emerald}>{tx.mpesa_receipt_number}</Mono></TD>
                  <TD><span style={{ fontSize: 12.5, color: C.muted }}>{tx.phone_number}</span></TD>
                  <TD><Mono color={C.emerald}>KES {parseFloat(tx.amount).toLocaleString()}</Mono></TD>
                  <TD><span style={{ fontSize: 12.5, color: C.muted }}>{(tx.transaction_date || tx.created_at || "").split("T")[0]}</span></TD>
                  <TD><span style={{ fontSize: 12.5, fontWeight: 500, color: tx.account_reference ? C.text : C.rose }}>{tx.account_reference || "⚠ missing"}</span></TD>
                  <TD>
                    {activeRow === tx.id ? (
                      <Btn size="sm" variant="danger" onClick={() => { setActiveRow(null); setStudentId(""); setInvoiceId(""); }}>Cancel</Btn>
                    ) : (
                      <Btn size="sm" variant="outline" onClick={() => { setActiveRow(tx.id); setStudentId(""); setInvoiceId(""); }}>Reconcile</Btn>
                    )}
                  </TD>
                </tr>
                {activeRow === tx.id && (
                  <tr key={`form-${tx.id}`}>
                    <td colSpan={6} style={{ padding: "0 16px 16px", borderBottom: `1px solid ${C.border}`, background: "#F8FAFC" }}>
                      <div style={{ display: "flex", gap: 12, alignItems: "flex-end", paddingTop: 14 }}>
                        <div style={{ width: 180 }}><Inp label="Student ID" placeholder="DB id" value={studentId} onChange={e => setStudentId(e.target.value)} /></div>
                        <div style={{ width: 180 }}><Inp label="Invoice ID" placeholder="DB id" value={invoiceId} onChange={e => setInvoiceId(e.target.value)} /></div>
                        <Btn variant="mpesa" size="sm" loading={reconcile.loading}
                          onClick={() => { if (!studentId || !invoiceId) return; dispatch(reconcileMpesaTransaction({ transactionId: tx.id, student_id: parseInt(studentId), invoice_id: parseInt(invoiceId) })); }}>
                           Link Invoice
                        </Btn>
                      </div>
                      {reconcile.error && <div style={{ marginTop: 10 }}><Alert type="error" msg={reconcile.error} onDismiss={() => dispatch(resetReconcile())} /></div>}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </Surface>
    </div>
  );
};