import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../../../config/api";
import { createFeeStructure, selectFeeStructuresLoading } from "../fees.slice";
import { fetchAllTerms, selectAllTerms } from "../../academicTerms/academicTerms.slice";
import { C, termLabel, selStyle, QUICK_FEE_TYPES } from "./constants";
import { Modal, Btn, Alert } from "./primitives";

export const CreateFeeStructureModal = ({ onClose }) => {
  const dispatch = useDispatch();
  const loading  = useSelector(selectFeeStructuresLoading);
  const terms    = useSelector(selectAllTerms);

  const [termId,  setTermId]  = useState("");
  const [classId, setClassId] = useState("");
  const [classes, setClasses] = useState([]);
  const [error,   setError]   = useState(null);
  const [items,   setItems]   = useState([{ fee_type: "", amount: "", is_mandatory: true }]);

  useEffect(() => {
    if (!terms?.length) dispatch(fetchAllTerms({}));
    api.get("/classes").then(res => setClasses(res.data?.data || [])).catch(() => {});
  }, []);

  const addItem    = () => setItems(p => [...p, { fee_type: "", amount: "", is_mandatory: true }]);
  const removeItem = i  => setItems(p => p.filter((_, idx) => idx !== i));
  const setItem    = (i, f, v) => setItems(p => p.map((it, idx) => idx === i ? { ...it, [f]: v } : it));
  const total = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);

  const handleSubmit = async () => {
    if (!termId || !classId) { setError("Please select a term and class."); return; }
    if (items.some(i => !i.fee_type || !i.amount)) { setError("All fee items need a type and amount."); return; }
    setError(null);
    try {
      await Promise.all(items.map(item =>
        dispatch(createFeeStructure({
          term_id:      parseInt(termId, 10),
          class_id:     parseInt(classId, 10),
          fee_type:     item.fee_type,
          amount:       parseFloat(item.amount),
          is_mandatory: item.is_mandatory,
        })).unwrap()
      ));
      onClose();
    } catch (err) {
      setError(err || "Failed to create fee structure.");
    }
  };

  return (
    <Modal title="New Fee Structure" subtitle="Define all fees for a class and term" onClose={onClose} width={620}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: .5 }}>Academic Term</label>
            <select value={termId} onChange={e => setTermId(e.target.value)} style={selStyle()}>
              <option value="">— Select term —</option>
              {terms?.map(t => <option key={t.id} value={t.id}>{termLabel(t)}{t.is_active ? " ✓" : ""}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: .5 }}>Class</label>
            <select value={classId} onChange={e => setClassId(e.target.value)} style={selStyle()}>
              <option value="">— Select class —</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name || c.class_name || `Class ${c.id}`}</option>)}
            </select>
          </div>
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: .5 }}>Fee Items</label>
            <Btn size="sm" variant="outline" onClick={addItem}>+ Add Item</Btn>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 80px 36px", gap: 8, marginBottom: 6, padding: "0 4px" }}>
            {["Fee Type","Amount (KES)","Required",""].map((h, i) => (
              <span key={i} style={{ fontSize: 10, fontWeight: 600, color: C.subtle, textTransform: "uppercase", letterSpacing: .5 }}>{h}</span>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {items.map((item, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 80px 36px", gap: 8, alignItems: "center" }}>
                <div>
                  <input list="fee-types-create" placeholder="e.g. Tuition" value={item.fee_type}
                    onChange={e => setItem(i, "fee_type", e.target.value)}
                    style={{ width: "100%", background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 9, padding: "9px 13px", fontSize: 13, color: C.text }} />
                  <datalist id="fee-types-create">
                    {QUICK_FEE_TYPES.map(t => <option key={t} value={t} />)}
                  </datalist>
                </div>
                <input type="number" placeholder="0" value={item.amount}
                  onChange={e => setItem(i, "amount", e.target.value)}
                  style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 9, padding: "9px 13px", fontSize: 13, color: C.text }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <input type="checkbox" checked={item.is_mandatory}
                    onChange={e => setItem(i, "is_mandatory", e.target.checked)}
                    style={{ width: 16, height: 16, cursor: "pointer" }} />
                </div>
                {items.length > 1 && (
                  <button onClick={() => removeItem(i)} style={{ background: C.roseDim, border: "none", borderRadius: 8, color: C.rose, padding: "8px", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderTop: `1.5px solid ${C.border}` }}>
          <span style={{ fontSize: 13, color: C.muted }}>Total Fees</span>
          <span style={{ fontSize: 20, fontWeight: 700, color: C.indigo, fontFamily: "'DM Mono', monospace" }}>
            KES {total.toLocaleString("en-KE", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {error && <Alert type="error" msg={error} onDismiss={() => setError(null)} />}

        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="outline" onClick={onClose} style={{ flex: 1 }}>Cancel</Btn>
          <Btn loading={loading} disabled={!termId || !classId} style={{ flex: 2 }} onClick={handleSubmit}>
            Create Fee Structure
          </Btn>
        </div>
      </div>
    </Modal>
  );
};