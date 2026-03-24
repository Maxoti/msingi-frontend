import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  initiateStkPush, pollStkStatus, confirmMpesaManual,
  resetMpesa, setMpesaTimeout, selectMpesa,
} from "../fees.slice";
import { C } from "./constants";
import { Modal, Inp, Btn, Alert, Spinner } from "./primitives";

export const MpesaModal = ({ invoice, onClose }) => {
  const dispatch = useDispatch();
  const mpesa    = useSelector(selectMpesa);
  const [phone,  setPhone]  = useState("");
  const [amount, setAmount] = useState(String(invoice?.balance || invoice?.total_amount || ""));
  const [manRef, setManRef] = useState("");
  const [manAmt, setManAmt] = useState(String(invoice?.balance || ""));
  const [timer,  setTimer]  = useState(90);
  const timerRef = useRef(null);

  useEffect(() => {
    if (mpesa.stkStatus !== "PENDING") return;
    timerRef.current = setInterval(() => {
      setTimer(p => {
        if (p <= 1) { clearInterval(timerRef.current); dispatch(setMpesaTimeout()); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [mpesa.stkStatus]);

  useEffect(() => {
    if (mpesa.stkStatus !== "PENDING" || !mpesa.checkoutRequestId) return;
    const poll = setInterval(() => dispatch(pollStkStatus(mpesa.checkoutRequestId)), 5000);
    return () => clearInterval(poll);
  }, [mpesa.stkStatus, mpesa.checkoutRequestId]);

  const handleClose = () => { dispatch(resetMpesa()); clearInterval(timerRef.current); onClose(); };

  if (mpesa.stkStatus === "SUCCESS") return (
    <Modal title="Payment Confirmed" onClose={handleClose}>
      <div style={{ textAlign: "center", padding: "32px 0" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: C.emeraldDim, border: `2px solid ${C.emerald}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 20px" }}>✅</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Payment Recorded</div>
        <div style={{ color: C.muted, fontSize: 13.5, marginBottom: 28 }}>M-Pesa transaction confirmed successfully.</div>
        <Btn variant="success" onClick={handleClose} style={{ margin: "0 auto" }}>Done</Btn>
      </div>
    </Modal>
  );

  if (mpesa.stkStatus === "PENDING") return (
    <Modal title="Waiting for M-Pesa PIN" subtitle={`STK push sent to ${phone}`} onClose={handleClose}>
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: C.emeraldDim, border: `3px solid ${C.emerald}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 34, animation: "fm-pulse 1.4s ease infinite" }}>📱</div>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Enter M-Pesa PIN</div>
        <div style={{ color: C.muted, fontSize: 13, marginBottom: 22 }}>Check your phone and authorize the payment</div>
        <div style={{ fontSize: 44, fontWeight: 700, marginBottom: 24, color: timer < 20 ? C.rose : C.emerald, fontFamily: "'DM Mono', monospace" }}>{timer}s</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <Btn variant="outline" onClick={() => { clearInterval(timerRef.current); dispatch(setMpesaTimeout()); }}>Enter Code Manually</Btn>
          <Btn variant="danger" onClick={handleClose}>Cancel</Btn>
        </div>
      </div>
    </Modal>
  );

  if (mpesa.stkStatus === "TIMEOUT") return (
    <Modal title="Enter M-Pesa Code Manually" subtitle="STK Push timed out — pay via Paybill then enter code" onClose={handleClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: "#F8FAFC", borderRadius: 10, padding: 16, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: .6, marginBottom: 10 }}>Paybill Details</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13 }}>
            <div><span style={{ color: C.muted }}>Business No: </span><b>522522</b></div>
            <div><span style={{ color: C.muted }}>Account: </span><b style={{ color: C.indigo }}>{invoice?.invoice_no || `INV-${invoice?.id}`}</b></div>
          </div>
        </div>
        <Inp label="M-Pesa Confirmation Code" placeholder="e.g. QKF5TXXX" value={manRef} onChange={e => setManRef(e.target.value.toUpperCase())} />
        <Inp label="Amount (KES)" type="number" value={manAmt} onChange={e => setManAmt(e.target.value)} />
        {mpesa.manualError && <Alert type="error" msg={mpesa.manualError} />}
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="outline" onClick={() => dispatch(resetMpesa())} style={{ flex: 1 }}>Back</Btn>
          <Btn variant="mpesa" loading={mpesa.manualLoading} style={{ flex: 2 }}
            onClick={() => { if (manRef && manAmt) dispatch(confirmMpesaManual({ invoice_id: invoice.id, amount: parseFloat(manAmt), reference_number: manRef, payment_date: new Date().toISOString().split("T")[0], received_by: "Cashier" })); }}>
             Confirm Payment
          </Btn>
        </div>
      </div>
    </Modal>
  );

  if (mpesa.stkStatus === "FAILED") return (
    <Modal title="Payment Failed" onClose={handleClose}>
      <div style={{ textAlign: "center", padding: "28px 0" }}>
        <div style={{ width: 68, height: 68, borderRadius: "50%", background: C.roseDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, margin: "0 auto 16px" }}>❌</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.rose, marginBottom: 8 }}>Payment Failed</div>
        <div style={{ color: C.muted, fontSize: 13, marginBottom: 28 }}>{mpesa.stkPushError || mpesa.resultDesc || "Customer cancelled or request timed out."}</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <Btn variant="outline" onClick={() => dispatch(resetMpesa())}>Try Again</Btn>
          <Btn variant="amber" onClick={() => dispatch(setMpesaTimeout())}>Enter Manually</Btn>
        </div>
      </div>
    </Modal>
  );

  return (
    <Modal title="Pay via M-Pesa" subtitle={`Invoice ${invoice?.invoice_no || `#${invoice?.id}`}`} onClose={handleClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: C.emeraldDim, border: `1px solid ${C.emerald}30`, borderRadius: 12, padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.emerald, textTransform: "uppercase", letterSpacing: .5, marginBottom: 4 }}>Balance Due</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: C.emerald, fontFamily: "'DM Mono', monospace" }}>
              KES {parseFloat(invoice?.balance || invoice?.total_amount || 0).toLocaleString("en-KE")}
            </div>
          </div>
          <div style={{ fontSize: 36 }}></div>
        </div>
        <Inp label="Customer Phone (Safaricom)" placeholder="254712345678" value={phone} onChange={e => setPhone(e.target.value)} />
        <Inp label="Amount to Pay (KES)" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
        {mpesa.stkPushError && <Alert type="error" msg={mpesa.stkPushError} />}
        <div style={{ background: "#F8FAFC", borderRadius: 9, padding: "11px 14px", fontSize: 12.5, color: C.muted, lineHeight: 1.6 }}>
          An STK push notification will be sent to <b style={{ color: C.ink }}>{phone || "the phone number above"}</b>.
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="outline" onClick={handleClose} style={{ flex: 1 }}>Cancel</Btn>
          <Btn variant="mpesa" loading={mpesa.stkPushLoading} style={{ flex: 2 }}
            onClick={() => { if (phone && amount) dispatch(initiateStkPush({ admissionNo: invoice.admission_no, phoneNumber: phone, amount: parseFloat(amount) })); }}>
             Send STK Push
          </Btn>
        </div>
        <button onClick={() => dispatch(setMpesaTimeout())} style={{ background: "none", border: "none", color: C.muted, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>
          Enter M-Pesa code manually instead
        </button>
      </div>
    </Modal>
  );
};