import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../../../config/api";
import { createInvoice, resetCreateInvoice, selectCreateInvoice } from "../fees.slice";
import { fetchAllTerms, selectAllTerms, selectTermsLoading } from "../../academicTerms/academicTerms.slice";
import { C, termLabel } from "./constants";
import { Modal, Inp, Btn, Alert, Spinner, selStyle } from "./primitives";

// re-export selStyle from primitives so callers can import it from here too
export { selStyle };

export const CreateInvoiceModal = ({ onClose }) => {
  const dispatch = useDispatch();
  const { loading, error, success } = useSelector(selectCreateInvoice);

  const terms        = useSelector(selectAllTerms);
  const termsLoading = useSelector(state => selectTermsLoading(state).list);

  const [studentId,   setStudentId]   = useState("");
  const [termId,      setTermId]      = useState("");
  const [items,       setItems]       = useState([{ description: "", amount: "" }]);
  const [submitError, setSubmitError] = useState(null);
  const [looking,     setLooking]     = useState(false);

  const total = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);

  useEffect(() => {
    if (!terms?.length) dispatch(fetchAllTerms({}));
  }, []);

  useEffect(() => {
    if (!termId && terms?.length) {
      const active = terms.find(t => t.is_active);
      if (active) setTermId(String(active.id));
    }
  }, [terms]);

  useEffect(() => {
    if (success) { dispatch(resetCreateInvoice()); onClose(); }
  }, [success]);

  const addItem    = () => setItems(p => [...p, { description: "", amount: "" }]);
  const removeItem = i  => setItems(p => p.filter((_, idx) => idx !== i));
  const setItem    = (i, f, v) => setItems(p => p.map((it, idx) => idx === i ? { ...it, [f]: v } : it));

  const handleSubmit = async () => {
    if (!studentId || !termId) return;
    setSubmitError(null);
    setLooking(true);
    try {
      const res     = await api.get(`/students`, { params: { admission_no: studentId, limit: 1 } });
      const student = res.data?.data?.[0];
      if (!student) {
        setSubmitError(`Student "${studentId}" not found. Check the admission number.`);
        setLooking(false);
        return;
      }
      dispatch(createInvoice({
        student_id: student.id,
        term_id:    parseInt(termId, 10),
        items: items.map(i => ({ description: i.description, amount: parseFloat(i.amount) })),
      }));
    } catch (err) {
      setSubmitError("Failed to look up student. Please try again.");
    } finally {
      setLooking(false);
    }
  };

  return (
    <Modal title="Create Invoice" subtitle="Generate a new fee invoice for a student" onClose={onClose} width={580}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <Inp
          label="Student ID (Admission No.)"
          placeholder="e.g. STD2026001"
          value={studentId}
          onChange={e => { setStudentId(e.target.value); setSubmitError(null); }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: .5 }}>Academic Term</label>
          {termsLoading ? (
            <div style={{ ...selStyle, display: "flex", alignItems: "center", gap: 8, color: C.muted, pointerEvents: "none" }}>
              <Spinner size={14} /> Loading terms…
            </div>
          ) : (
            <select value={termId} onChange={e => setTermId(e.target.value)} style={selStyle}>
              <option value="">— Select a term —</option>
              {terms?.map(t => (
                <option key={t.id} value={t.id}>{termLabel(t)}{t.is_active ? "  ✓ Active" : ""}</option>
              ))}
            </select>
          )}
          {!termId && !termsLoading && (
            <span style={{ fontSize: 11, color: C.amber }}>⚡ Select the academic term this invoice belongs to</span>
          )}
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: .5 }}>Fee Items</label>
            <Btn size="sm" variant="outline" onClick={addItem}>+ Add Item</Btn>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {items.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input placeholder="Description" value={item.description} onChange={e => setItem(i, "description", e.target.value)}
                  style={{ flex: 2, background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 9, padding: "9px 13px", fontSize: 13.5, color: C.text }} />
                <input placeholder="Amount" type="number" value={item.amount} onChange={e => setItem(i, "amount", e.target.value)}
                  style={{ flex: 1, background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 9, padding: "9px 13px", fontSize: 13.5, color: C.text }} />
                {items.length > 1 && (
                  <button onClick={() => removeItem(i)} style={{ background: C.roseDim, border: "none", borderRadius: 8, color: C.rose, padding: "9px 12px", cursor: "pointer", fontSize: 16 }}>×</button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderTop: `1.5px solid ${C.border}` }}>
          <span style={{ color: C.muted, fontSize: 13 }}>Total Amount</span>
          <span style={{ fontSize: 20, fontWeight: 700, color: C.indigo, fontFamily: "'DM Mono', monospace" }}>
            KES {total.toLocaleString("en-KE", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {submitError && <Alert type="error" msg={submitError} onDismiss={() => setSubmitError(null)} />}
        {error       && <Alert type="error" msg={error} />}

        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="outline" onClick={onClose} style={{ flex: 1 }}>Cancel</Btn>
          <Btn loading={loading || looking} disabled={!studentId || !termId} style={{ flex: 2 }} onClick={handleSubmit}>
            Create Invoice
          </Btn>
        </div>
      </div>
    </Modal>
  );
};