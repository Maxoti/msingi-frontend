import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setActiveTerm, selectActiveTerm } from "./fees.slice";
import { fetchAllTerms, selectAllTerms } from "../academicTerms/academicTerms.slice";

import { C, termLabel }    from "./components/constants";
import { Styles, Spinner } from "./components/primitives";
import { DashboardTab }    from "./components/tabs/DashboardTab";
import { InvoicesTab }     from "./components/tabs/InvoicesTab";
import { PaymentsTab }     from "./components/tabs/PaymentsTab";
import { DefaultersTab }   from "./components/tabs/DefaultersTab";
import { StructuresTab }   from "./components/tabs/StructuresTab";
import { PendingMpesaTab } from "./components/tabs/PendingMpesaTab";

const TABS = [
  { id: "dashboard",  label: "Dashboard"      },
  { id: "invoices",   label: "Invoices"        },
  { id: "payments",   label: "Payments"        },
  { id: "defaulters", label: "Defaulters"      },
  { id: "structures", label: "Fee Structures"  },
  { id: "pending",    label: "Pending M-Pesa"  },
];

export default function FeesPage() {
  const dispatch     = useDispatch();
  const activeTerm   = useSelector(selectActiveTerm);
  const terms        = useSelector(selectAllTerms);

  // ── FIX: selectTermsLoading returns an object { list, single, active, ... }
  // Reading only the 'list' flag gives us the boolean we need for the spinner.
  const termsLoading = useSelector((s) => s.academicTerms.loading.list);

  const [tab, setTab] = useState("dashboard");

  useEffect(() => {
    if (!terms?.length) dispatch(fetchAllTerms({}));
  }, [dispatch]);

  return (
    <div
      className="fm"
      style={{
        fontFamily: "'Sora', sans-serif",
        fontSize: 14,
        color: C.text,
        minHeight: "100%",
        background: C.bg,
      }}
    >
      <Styles />

      {/* ── Sticky sub-nav ── */}
      <div
        style={{
          background: C.surface,
          borderBottom: `1px solid ${C.border}`,
          padding: "0 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          height: 54,
          boxShadow: "0 1px 3px rgba(15,23,42,.06)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        {/* Tab navigation */}
        <nav style={{ display: "flex", gap: 4 }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`fm tab-btn ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {/* Term selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <label
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: C.muted,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              whiteSpace: "nowrap",
            }}
          >
            Term
          </label>

          {termsLoading ? (
            <Spinner size={14} />
          ) : (
            <select
              value={activeTerm || ""}
              onChange={(e) =>
                dispatch(
                  setActiveTerm(e.target.value ? parseInt(e.target.value, 10) : null)
                )
              }
              style={{
                background: C.bg,
                border: `1.5px solid ${C.border}`,
                borderRadius: 9,
                padding: "6px 12px",
                fontSize: 12.5,
                color: C.ink,
                outline: "none",
                cursor: "pointer",
                fontFamily: "'Sora', sans-serif",
                minWidth: 160,
              }}
            >
              <option value="">All Terms</option>
              {Array.isArray(terms) && terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {termLabel(t)}{t.is_active ? " ✓" : ""}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ── Page body ── */}
      <div style={{ padding: "28px 28px" }}>
        <div style={{ marginBottom: 22 }}>
          <h1
            style={{
              fontSize: 21,
              fontWeight: 700,
              letterSpacing: -0.4,
              color: C.ink,
              marginBottom: 3,
            }}
          >
            {TABS.find((t) => t.id === tab)?.label}
          </h1>
          <div style={{ fontSize: 12.5, color: C.muted }}>
            Msingi School Management · Academic Year {new Date().getFullYear()}
          </div>
        </div>

        {tab === "dashboard"  && <DashboardTab  activeTerm={activeTerm} />}
        {tab === "invoices"   && <InvoicesTab   activeTerm={activeTerm} />}
        {tab === "payments"   && <PaymentsTab />}
        {tab === "defaulters" && <DefaultersTab activeTerm={activeTerm} />}
        {tab === "structures" && <StructuresTab />}
        {tab === "pending"    && <PendingMpesaTab />}
      </div>
    </div>
  );
}