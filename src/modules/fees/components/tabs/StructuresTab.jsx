import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFeeStructures, selectFeeStructures, selectFeeStructuresLoading } from "../../fees.slice";
import { C } from "../constants";
import { Surface, Spinner, EmptyState, Chip, Mono, Btn } from "../primitives";
import { CreateFeeStructureModal } from "../CreateFeeStructureModal";
import { EditFeeStructureModal }   from "../EditFeeStructureModal";
import { GenerateInvoicesModal }   from "../GenerateInvoicesModal";

export const StructuresTab = () => {
  const dispatch   = useDispatch();
  const structures = useSelector(selectFeeStructures);
  const loading    = useSelector(selectFeeStructuresLoading);

  const [showCreate,    setShowCreate]    = useState(false);
  const [editGroup,     setEditGroup]     = useState(null);
  const [generateGroup, setGenerateGroup] = useState(null);

  useEffect(() => { dispatch(fetchFeeStructures()); }, []);

  // Group rows by class + term
  const groups = Object.values(
    structures.reduce((acc, s) => {
      const k = `${s.class_id}_${s.term_id}`;
      if (!acc[k]) acc[k] = { ...s, rows: [] };
      acc[k].rows.push(s);
      return acc;
    }, {})
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Btn onClick={() => setShowCreate(true)}>+ New Fee Structure</Btn>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <Spinner size={28} />
        </div>
      ) : groups.length === 0 ? (
        <Surface>
          <EmptyState icon="📋" title="No fee structures" sub="Create fee structures to generate invoices automatically" />
        </Surface>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", gap: 16 }}>
          {groups.map((g, i) => {
            const total = g.rows.reduce((s, r) => s + parseFloat(r.amount || 0), 0);
            return (
              <Surface key={i} className="in" style={{ overflow: "hidden", animationDelay: `${i * 55}ms` }}>
                {/* Card header */}
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 11, background: C.indigoDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🎓</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{g.class_name || `Class ${g.class_id}`}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>{g.term_name || `Term ${g.term_id}`}</div>
                    </div>
                  </div>
                  <Chip label={`KES ${total.toLocaleString()}`} />
                </div>

                {/* Fee rows */}
                <div style={{ padding: "12px 20px", display: "flex", flexDirection: "column", gap: 7 }}>
                  {g.rows.map((r, j) => (
                    <div key={j} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: C.bg, borderRadius: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13 }}>
                        <span style={{ fontWeight: 500 }}>{r.fee_type}</span>
                        {!r.is_mandatory && (
                          <span style={{ fontSize: 10, color: C.amber, border: `1px solid ${C.amber}44`, borderRadius: 10, padding: "1px 7px" }}>Optional</span>
                        )}
                      </div>
                      <Mono color={C.indigo}>{parseFloat(r.amount).toLocaleString()}</Mono>
                    </div>
                  ))}
                </div>

                {/* Buttons */}
                <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
                  <Btn size="sm" variant="outline" style={{ flex: 1 }} onClick={() => setEditGroup(g)}>Edit</Btn>
                  <Btn size="sm" variant="outline" style={{ flex: 1 }} onClick={() => setGenerateGroup(g)}> Generate</Btn>
                </div>
              </Surface>
            );
          })}
        </div>
      )}

      {showCreate    && <CreateFeeStructureModal onClose={() => { setShowCreate(false);    dispatch(fetchFeeStructures()); }} />}
      {editGroup     && <EditFeeStructureModal   group={editGroup}     onClose={() => setEditGroup(null)} />}
      {generateGroup && <GenerateInvoicesModal   group={generateGroup} onClose={() => setGenerateGroup(null)} />}
    </div>
  );
};