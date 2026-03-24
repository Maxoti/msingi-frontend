import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import api from "../../../config/api";
import { createFeeStructure, fetchFeeStructures, selectFeeStructuresLoading } from "../fees.slice";
import { C, QUICK_FEE_TYPES } from "./constants";
import { Modal, Btn, Alert } from "./primitives";

export const EditFeeStructureModal = ({ group, onClose }) => {
  const dispatch = useDispatch();
  const loading  = useSelector(selectFeeStructuresLoading);

  const [items, setItems] = useState(
    group.rows.map(r => ({ id: r.id, fee_type: r.fee_type, amount: String(r.amount), is_mandatory: r.is_mandatory }))
  );
  const [error, setError] = useState(null);

  const addItem    = () => setItems(p => [...p, { fee_type: "", amount: "", is_mandatory: true }]);
  const removeItem = i  => setItems(p => p.filter((_, idx) => idx !== i));
  const setItem    = (i, f, v) => setItems(p => p.map((it, idx) => idx === i ? { ...it, [f]: v } : it));
  const total = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);

  const handleSubmit = async () => {
    if (items.some(i => !i.fee_type || !i.amount)) { setError("All items need a type and amount."); return; }
    setError(null);
    try {
      await Promise.all(items.map(item => {
        if (item.id) {
          return api.put(`/fees/fee-structures/${item.id}`, {
            fee_type: item.fee_type, amount: parseFloat(item.amount), is_mandatory: item.is_mandatory,
          });
        } else {
          return dispatch(createFeeStructure({
            term_id: group.term_id, class_id: group.class_id,
            fee_type: item.fee_type, amount: parseFloat(item.amount), is_mandatory: item.is_mandatory,
          })).unwrap();
        }
      }));
      dispatch(fetchFeeStructures());
      onClose();
    } catch (err) {
      setError("Failed to update fee structure. Please try again.");
    }
  };

  return (
    <Modal
      title={`Edit — ${group.class_name || `Class ${group.class_id}`}`}
      subtitle={group.term_name || `Term ${group.term_id}`}
      onClose={onClose} width={620}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 80px 36px", gap: 8, padding: "0 4px" }}>
          {["Fee Type","Amount (KES)","Required",""].map((h, i) => (
            <span key={i} style={{ fontSize: 10, fontWeight: 600, color: C.subtle, textTransform: "uppercase", letterSpacing: .5 }}>{h}</span>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 80px 36px", gap: 8, alignItems: "center" }}>
              <div>
                <input list="fee-types-edit" placeholder="e.g. Tuition" value={item.fee_type}
                  onChange={e => setItem(i, "fee_type", e.target.value)}
                  style={{ width: "100%", background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 9, padding: "9px 13px", fontSize: 13, color: C.text }} />
                <datalist id="fee-types-edit">
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

        <Btn size="sm" variant="outline" onClick={addItem} style={{ alignSelf: "flex-start" }}>+ Add Item</Btn>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderTop: `1.5px solid ${C.border}` }}>
          <span style={{ fontSize: 13, color: C.muted }}>Total Fees</span>
          <span style={{ fontSize: 20, fontWeight: 700, color: C.indigo, fontFamily: "'DM Mono', monospace" }}>
            KES {total.toLocaleString("en-KE", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {error && <Alert type="error" msg={error} onDismiss={() => setError(null)} />}

        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="outline" onClick={onClose} style={{ flex: 1 }}>Cancel</Btn>
          <Btn loading={loading} style={{ flex: 2 }} onClick={handleSubmit}>Save Changes</Btn>
        </div>
      </div>
    </Modal>
  );
};