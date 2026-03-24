// ─── Design tokens ────────────────────────────────────────────────────────────
export const C = {
  bg:        "#F4F6FA",
  surface:   "#FFFFFF",
  border:    "#E4E8EF",
  text:      "#0F172A",
  muted:     "#64748B",
  subtle:    "#94A3B8",
  ink:       "#1E293B",
  indigo:    "#4F46E5",
  indigoDim: "#EEF2FF",
  indigoStr: "#3730A3",
  emerald:   "#059669",
  emeraldDim:"#ECFDF5",
  amber:     "#D97706",
  amberDim:  "#FFFBEB",
  rose:      "#E11D48",
  roseDim:   "#FFF1F2",
  sky:       "#0284C7",
  skyDim:    "#F0F9FF",
  shadow:    "0 1px 3px rgba(15,23,42,.06), 0 1px 2px rgba(15,23,42,.04)",
  shadow2:   "0 4px 16px rgba(15,23,42,.10), 0 2px 6px rgba(15,23,42,.06)",
  shadow3:   "0 20px 40px rgba(15,23,42,.14), 0 8px 16px rgba(15,23,42,.08)",
};

export const selStyle = (extra = {}) => ({
  background: C.surface, border: `1.5px solid ${C.border}`,
  borderRadius: 9, padding: "9px 13px", fontSize: 13.5,
  color: C.text, width: "100%", cursor: "pointer",
  fontFamily: "'Sora', sans-serif", outline: "none", ...extra,
});

export const termLabel = (t) => `Term ${t.term} – ${t.year}`;

export const QUICK_FEE_TYPES = [
  "Tuition", "Meals", "Academic Trips", "Swimming",
  "Transport", "Boarding", "Books & Stationery", "Uniform", "Activity Fee"
];