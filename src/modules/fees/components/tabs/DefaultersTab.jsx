import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDefaulters, selectDefaulters, selectDefaultersLoading } from "../../fees.slice";
import api from "../../../../config/api";
import { C } from "../constants";
import { Surface, TH, TD, Mono, EmptyState, SkeletonRows, Btn, Inp, Bar, Modal, Alert } from "../primitives";
import { MpesaModal } from "../MpesaModal";

// ─── SMS Reminders Modal ───────────────────────────────────────────────────────
const SmsRemindersModal = ({ defaulters, onClose }) => {
  const [status,  setStatus]  = useState("idle");
  const [results, setResults] = useState(null);
  const [error,   setError]   = useState(null);
  const [message, setMessage] = useState(
    "Dear parent, your child {name} has an outstanding school fees balance of KES {balance}. Please pay by end of term to avoid disruption. Thank you."
  );

  // Each defaulter gets their own editable phone field
  const [phones, setPhones] = useState(
    defaulters.map(d => ({ ...d, phone: d.parent_phone || d.phone || "" }))
  );
  const setPhone = (i, val) => setPhones(p => p.map((r, idx) => idx === i ? { ...r, phone: val } : r));

  const missingPhones = phones.filter(p => !p.phone).length;

 const handleSend = async () => {
  if (missingPhones > 0) { setError(`${missingPhones} recipients are missing phone numbers.`); return; }
  setStatus("loading"); setError(null);

  let sent = 0, failed = 0;
  try {
    await Promise.all(phones.map(async (d) => {
      // Auto-format phone to 254XXXXXXXXX
      let phone = d.phone.replace(/\D/g, "");
      if (phone.startsWith("0")) phone = "254" + phone.slice(1);
      if (phone.startsWith("7")) phone = "254" + phone;

      // Personalise message per recipient
      const personalised = message
        .replace(/\{name\}/g,    d.student_name || "")
        .replace(/\{balance\}/g, parseFloat(d.balance).toLocaleString("en-KE"));

      try {
        await api.post("/sms/send", { to: phone, message: personalised });
        sent++;
      } catch (e) {
        console.error(`SMS failed for ${phone}:`, e.response?.data);
        failed++;
      }
    }));

    setResults({ sent, failed });
    setStatus("done");
  } catch (err) {
    setError(err.response?.data?.message || "Failed to send SMS reminders.");
    setStatus("error");
  }
};

  return (
    <Modal title="Send SMS Reminders" subtitle={`${defaulters.length} students will be notified`} onClose={onClose} width={580}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

        {/* Recipients with phone inputs */}
        <div style={{ background: C.bg, borderRadius: 12, padding: 14, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: .5, marginBottom: 10 }}>
            Recipients & Phone Numbers
          </div>

          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 140px", gap: 8, marginBottom: 8, padding: "0 4px" }}>
            {["Student", "Balance", "Phone Number"].map(h => (
              <span key={h} style={{ fontSize: 10, fontWeight: 600, color: C.subtle, textTransform: "uppercase", letterSpacing: .5 }}>{h}</span>
            ))}
          </div>

          <div style={{ maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
            {phones.map((d, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 140px", gap: 8, alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{d.student_name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{d.admission_no}</div>
                </div>
                <span style={{ fontFamily: "'DM Mono', monospace", color: C.rose, fontWeight: 600, fontSize: 13 }}>
                  KES {parseFloat(d.balance).toLocaleString()}
                </span>
                <input
                  type="tel"
                  placeholder="254712345678"
                  value={d.phone}
                  onChange={e => setPhone(i, e.target.value)}
                  style={{
                    background: C.surface,
                    border: `1.5px solid ${d.phone ? C.border : C.rose}`,
                    borderRadius: 8, padding: "7px 10px", fontSize: 12,
                    color: C.text, outline: "none", width: "100%",
                  }}
                />
              </div>
            ))}
          </div>

          {missingPhones > 0 && (
            <div style={{ marginTop: 10, fontSize: 12, color: C.rose }}>
              ⚠ {missingPhones} recipient{missingPhones > 1 ? "s are" : " is"} missing a phone number
            </div>
          )}
        </div>

        {/* Message template */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: .5 }}>
            Message Template
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={4}
            style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 9, padding: "10px 13px", fontSize: 13, color: C.text, resize: "vertical", fontFamily: "'Sora', sans-serif" }}
          />
          <span style={{ fontSize: 11, color: C.muted }}>
            Use <b style={{ color: C.indigo }}>{"{balance}"}</b> for balance, <b style={{ color: C.indigo }}>{"{name}"}</b> for student name.
          </span>
        </div>

        {status === "done"  && results && (
  <Alert type={results.failed > 0 ? "warn" : "success"}
    msg={`Sent: ${results.sent}${results.failed > 0 ? ` · ❌ Failed: ${results.failed}` : ""}`} />
)}
{status === "error" && <Alert type="error" msg={error} onDismiss={() => { setStatus("idle"); setError(null); }} />}

        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="outline" onClick={onClose} style={{ flex: 1 }}>
            {status === "done" ? "Close" : "Cancel"}
          </Btn>
          {status !== "done" && (
            <Btn
              loading={status === "loading"}
              disabled={missingPhones > 0}
              style={{ flex: 2, background: "#2563EB", boxShadow: "0 2px 8px #2563EB40" }}
              onClick={handleSend}
            >
               Send {defaulters.length} SMS Reminder{defaulters.length > 1 ? "s" : ""}
            </Btn>
          )}
        </div>
      </div>
    </Modal>
  );
};
// ─── DefaultersTab ─────────────────────────────────────────────────────────────
export const DefaultersTab = ({ activeTerm }) => {
  const dispatch   = useDispatch();
  const defaulters = useSelector(selectDefaulters);
  const loading    = useSelector(selectDefaultersLoading);

  const [mpesa,   setMpesa]   = useState(null);
  const [showSms, setShowSms] = useState(false);
  const [minBal,  setMinBal]  = useState(1);

  useEffect(() => {
    dispatch(fetchDefaulters({ ...(activeTerm && { term_id: activeTerm }), min_balance: minBal }));
  }, [activeTerm, minBal]);

  const total    = defaulters.reduce((s, d) => s + parseFloat(d.balance || 0), 0);
  const urgColor = d => d > 45 ? C.rose : d > 20 ? C.amber : C.muted;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {defaulters.length > 0 && (
        <div style={{ padding: "14px 18px", background: C.roseDim, border: `1px solid ${C.rose}30`, borderRadius: 12, display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: `${C.rose}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>⚠️</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>{defaulters.length} students with outstanding balances</div>
            <div style={{ fontSize: 12.5, color: C.muted }}>
              Total: <b style={{ color: C.rose, fontFamily: "'DM Mono',monospace" }}>KES {total.toLocaleString("en-KE")}</b>
            </div>
          </div>
          <Btn size="sm" variant="outline" onClick={() => setShowSms(true)}>📱 Send SMS Reminders</Btn>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{ width: 220 }}>
          <Inp label="Min Balance (KES)" type="number" value={minBal} onChange={e => setMinBal(Number(e.target.value) || 1)} />
        </div>
      </div>

      <Surface style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Student","Class","Invoice","Balance","Days Overdue","Urgency","Actions"].map(h => <TH key={h} label={h} />)}</tr></thead>
          <tbody>
            {loading ? <SkeletonRows cols={7} /> : defaulters.length === 0 ? (
              <tr><td colSpan={7}><EmptyState title="No defaulters!" sub="All students are up to date" /></td></tr>
            ) : [...defaulters].sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance)).map((d, i) => {
              const urg  = urgColor(d.days_overdue || 0);
              const days = d.days_overdue || 0;

              // ✅ fix INV-undefined: use invoice_no if available, fallback to invoice_id
              const invLabel = d.invoice_no || (d.invoice_id ? `INV-${d.invoice_id}` : "—");
              return (
                <tr key={d.id || i} className="row-hover in" style={{ animationDelay: `${i * 35}ms` }}>
                  <TD>
                    <div style={{ fontWeight: 600 }}>{d.student_name}</div>
                    <Mono color={C.subtle}>{d.admission_no}</Mono>
                  </TD>
                  <TD><span style={{ fontSize: 12.5, color: C.muted }}>{d.class_name || "—"}</span></TD>
                  <TD><Mono color={C.indigo}>{invLabel}</Mono></TD>
                  <TD><span style={{ fontWeight: 700, color: C.rose, fontSize: 14, fontFamily: "'DM Mono',monospace" }}>KES {parseFloat(d.balance).toLocaleString()}</span></TD>
                  <TD><span style={{ fontWeight: 700, color: urg, fontFamily: "'DM Mono',monospace" }}>{days}d</span></TD>
                  <TD style={{ width: 130 }}><Bar pct={Math.min((days / 90) * 100, 100)} color={urg} height={6} /></TD>
                  <TD>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Btn size="sm" variant="mpesa"
                        onClick={() => setMpesa({ id: d.invoice_id, invoice_no: d.invoice_no, admission_no: d.admission_no, balance: parseFloat(d.balance) })}>
                        Pay
                      </Btn>
                      <Btn size="sm" variant="outline" onClick={() => setShowSms(true)}>SMS</Btn>
                    </div>
                  </TD>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Surface>

      {mpesa   && <MpesaModal invoice={mpesa} onClose={() => setMpesa(null)} />}
      {showSms && <SmsRemindersModal defaulters={defaulters} onClose={() => setShowSms(false)} />}
    </div>
  );
};