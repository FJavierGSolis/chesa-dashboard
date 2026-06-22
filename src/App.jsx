import { useState, useEffect, useRef } from "react";

// ── Firebase config ───────────────────────────────────────────────────────────
const FIREBASE_URL = "https://dashboard-changan-chesa-default-rtdb.firebaseio.com";

const AGENCIAS = ["TUXTLA", "TAPACHULA", "SAN CRISTÓBAL", "COMITÁN", "OCOSINGO"];

const LINEAS_PRODUCTO = [
  "ALSVIN", "CS35", "CS55", "HUNTER PLUS", "HONOR", "STAR TRUCK",
  "EADO IDD", "CS55 IDD", "CS75 PRO", "DEEPAL", "EADO PLUS",
  "UNIK", "HUNTER CHASIS", "HUNTER WORK", "HUNTER E",
];

const COLORES_LINEAS = [
  "#D4AF37", "#4ade80", "#60a5fa", "#f87171", "#c084fc", "#fb923c",
  "#22d3ee", "#fbbf24", "#a3e635", "#f472b6", "#818cf8",
  "#34d399", "#fb7185", "#38bdf8", "#facc15",
];

const initialData = {
  ventasJunioInterno: {
    TUXTLA:          { facturado: 0, objetivo: 35 },
    TAPACHULA:       { facturado: 0, objetivo: 17 },
    "SAN CRISTÓBAL": { facturado: 0, objetivo: 12 },
    COMITÁN:         { facturado: 0, objetivo: 7  },
    OCOSINGO:        { facturado: 0, objetivo: 7  },
  },
  ventasJunioMexico: {
    TUXTLA:          { facturado: 0, objetivo: 27 },
    TAPACHULA:       { facturado: 0, objetivo: 20 },
    "SAN CRISTÓBAL": { facturado: 0, objetivo: 16 },
    COMITÁN:         { facturado: 0, objetivo: 10 },
    OCOSINGO:        { facturado: 0, objetivo: 9  },
  },
  ws: {
    TUXTLA:          { objetivo: 12, real: 0 },
    TAPACHULA:       { objetivo: 12, real: 0 },
    "SAN CRISTÓBAL": { objetivo: 8,  real: 0 },
    COMITÁN:         { objetivo: 3,  real: 0 },
    OCOSINGO:        { objetivo: 5,  real: 0 },
  },
  auditoria: {
    TUXTLA: 0, TAPACHULA: 0, "SAN CRISTÓBAL": 0, COMITÁN: 0, OCOSINGO: 0,
  },
  ssi: {
    TUXTLA:    { objetivo: 0.87, cbd: 0, ssi: 0 },
    TAPACHULA: { objetivo: 0.87, cbd: 0, ssi: 0 },
    OCOSINGO:  { objetivo: 0.87, cbd: 0, ssi: 0 },
  },
  csi: {
    TUXTLA:    { objetivo: 0.87, cbd: 0, csi: 0 },
    TAPACHULA: { objetivo: 0.87, cbd: 0, csi: 0 },
  },
  isi: {
    TUXTLA:          { objetivo: 0.85, real: 0 },
    TAPACHULA:       { objetivo: 0.85, real: 0 },
    "SAN CRISTÓBAL": { objetivo: 0.85, real: 0 },
    COMITÁN:         { objetivo: 0.85, real: 0 },
    OCOSINGO:        { objetivo: 0.85, real: 0 },
  },
  rotacion: {
    TUXTLA:          { real: 0, objetivo: 2.5 },
    TAPACHULA:       { real: 0, objetivo: 2.5 },
    "SAN CRISTÓBAL": { real: 0, objetivo: 2.5 },
    COMITÁN:         { real: 0, objetivo: 2.5 },
    OCOSINGO:        { real: 0, objetivo: 2.5 },
  },
  msMayo: {
    TUXTLA:          { objetivo: 0.02,  real: 0, tiv: 0 },
    TAPACHULA:       { objetivo: 0.03,  real: 0, tiv: 0 },
    "SAN CRISTÓBAL": { objetivo: 0.03,  real: 0, tiv: 0 },
    COMITÁN:         { objetivo: 0.025, real: 0, tiv: 0 },
    OCOSINGO:        { objetivo: 0.04,  real: 0, tiv: 0 },
  },
  van: {
    TUXTLA:          { real: 0, objetivo: 3 },
    TAPACHULA:       { real: 0, objetivo: 2 },
    "SAN CRISTÓBAL": { real: 0, objetivo: 1 },
    COMITÁN:         { real: 0, objetivo: 1 },
    OCOSINGO:        { real: 0, objetivo: 1 },
  },
  vau: {
    TUXTLA: true, TAPACHULA: true, "SAN CRISTÓBAL": true, COMITÁN: true, OCOSINGO: true,
  },
  lineasProducto: {
    TUXTLA:          Object.fromEntries(LINEAS_PRODUCTO.map(l => [l, 0])),
    TAPACHULA:       Object.fromEntries(LINEAS_PRODUCTO.map(l => [l, 0])),
    "SAN CRISTÓBAL": Object.fromEntries(LINEAS_PRODUCTO.map(l => [l, 0])),
    COMITÁN:         Object.fromEntries(LINEAS_PRODUCTO.map(l => [l, 0])),
    OCOSINGO:        Object.fromEntries(LINEAS_PRODUCTO.map(l => [l, 0])),
  },
};

// ── Firebase helpers ──────────────────────────────────────────────────────────
// Convierte claves con caracteres especiales para Firebase (no permite . $ # [ ] /)
const encodeKey = k => k.replace(/[.#$/\[\]]/g, "_");

function buildFirebasePath(obj, prefix = "") {
  const flat = {};
  const recurse = (o, p) => {
    if (o === null || typeof o !== "object") { flat[p] = o; return; }
    Object.keys(o).forEach(k => recurse(o[k], p ? `${p}/${encodeKey(k)}` : encodeKey(k)));
  };
  recurse(obj, prefix);
  return flat;
}

async function fbGet(path) {
  try {
    const r = await fetch(`${FIREBASE_URL}/${path}.json`);
    return await r.json();
  } catch { return null; }
}

async function fbSet(path, value) {
  try {
    await fetch(`${FIREBASE_URL}/${path}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });
  } catch (e) { console.error("Firebase write error:", e); }
}

async function fbPatch(path, value) {
  try {
    await fetch(`${FIREBASE_URL}/${path}.json`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });
  } catch (e) { console.error("Firebase patch error:", e); }
}

// Decodifica las claves de Firebase de vuelta (SAN_CRISTÓBAL → SAN CRISTÓBAL, etc.)
function decodeFirebaseData(raw, template) {
  if (!raw || typeof raw !== "object") return template;
  const result = {};
  Object.keys(template).forEach(origKey => {
    const fbKey = encodeKey(origKey);
    const val = raw[fbKey] ?? raw[origKey];
    if (val !== undefined && val !== null) {
      if (typeof template[origKey] === "object" && template[origKey] !== null && !Array.isArray(template[origKey])) {
        result[origKey] = decodeFirebaseData(val, template[origKey]);
      } else {
        result[origKey] = val;
      }
    } else {
      result[origKey] = template[origKey];
    }
  });
  return result;
}

// ── helpers ───────────────────────────────────────────────────────────────────
const pct = (v, t) => (t > 0 ? Math.min(100, Math.round((v / t) * 100)) : 0);

// ── sub-components ────────────────────────────────────────────────────────────
function ProgressBar({ value, max }) {
  const p = pct(value, max);
  const bg = p >= 100 ? "#22c55e" : p >= 50 ? "#D4AF37" : "#ef4444";
  return (
    <div style={{ background: "#0d1b2e", borderRadius: 4, height: 8, overflow: "hidden", marginTop: 4 }}>
      <div style={{ width: `${p}%`, height: "100%", background: bg, transition: "width .4s" }} />
    </div>
  );
}

function Badge({ ok }) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: 20,
      background: ok ? "#16a34a22" : "#dc262622",
      color: ok ? "#4ade80" : "#f87171",
      fontSize: 12, fontWeight: 700, border: `1px solid ${ok ? "#4ade80" : "#f87171"}`
    }}>
      {ok ? "✓ CUMPLE" : "✗ NO CUMPLE"}
    </span>
  );
}

function NumInput({ value, onChange, step = 1, min = 0, width = 60 }) {
  const [local, setLocal] = useState(String(value));
  useEffect(() => setLocal(String(value)), [value]);
  return (
    <input
      type="number"
      value={local}
      min={min}
      step={step}
      onChange={e => setLocal(e.target.value)}
      onBlur={() => { const n = Number(local); if (!isNaN(n)) onChange(n); }}
      onKeyDown={e => { if (e.key === "Enter") { const n = Number(local); if (!isNaN(n)) onChange(n); } }}
      style={{
        width, background: "#0d1b2e", border: "1px solid #2a3f5f",
        color: "#D4AF37", borderRadius: 4, padding: "2px 6px",
        fontSize: 13, textAlign: "center", outline: "none",
      }}
    />
  );
}

function SectionHeader({ title, icon }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #D4AF3733", paddingBottom: 8, marginBottom: 14 }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <h2 style={{ color: "#D4AF37", fontSize: 14, fontWeight: 700, letterSpacing: 1, margin: 0 }}>{title}</h2>
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background: "#0f2239", border: "1px solid #1e3a5f", borderRadius: 10, padding: "16px 18px", ...style }}>
      {children}
    </div>
  );
}

// ── PIE CHART (SVG puro) ───────────────────────────────────────────────────────
function PieChart({ data, size = 180 }) {
  // data: [{ label, value, color }]
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = size / 2;
  const cx = r, cy = r;

  if (total <= 0) {
    return (
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r - 2} fill="#0d1b2e" stroke="#1e3a5f" strokeWidth="1" />
        <text x={cx} y={cy} textAnchor="middle" dy="0.3em" fill="#475569" fontSize="11">Sin datos</text>
      </svg>
    );
  }

  let startAngle = -90;
  const slices = data
    .filter(d => d.value > 0)
    .map(d => {
      const angle = (d.value / total) * 360;
      const endAngle = startAngle + angle;
      const x1 = cx + (r - 2) * Math.cos((Math.PI / 180) * startAngle);
      const y1 = cy + (r - 2) * Math.sin((Math.PI / 180) * startAngle);
      const x2 = cx + (r - 2) * Math.cos((Math.PI / 180) * endAngle);
      const y2 = cy + (r - 2) * Math.sin((Math.PI / 180) * endAngle);
      const largeArc = angle > 180 ? 1 : 0;
      const path = total === d.value
        ? `M ${cx} ${cy - (r - 2)} A ${r - 2} ${r - 2} 0 1 1 ${cx - 0.01} ${cy - (r - 2)} Z`
        : `M ${cx} ${cy} L ${x1} ${y1} A ${r - 2} ${r - 2} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      const slice = { path, color: d.color, label: d.label, value: d.value };
      startAngle = endAngle;
      return slice;
    });

  return (
    <svg width={size} height={size}>
      {slices.map((s, i) => (
        <path key={i} d={s.path} fill={s.color} stroke="#0f2239" strokeWidth="1">
          <title>{`${s.label}: ${s.value} (${((s.value / total) * 100).toFixed(1)}%)`}</title>
        </path>
      ))}
      <circle cx={cx} cy={cy} r={r * 0.38} fill="#0f2239" />
      <text x={cx} y={cy - 6} textAnchor="middle" fill="#f1f5f9" fontSize="15" fontWeight="800">{total}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#64748b" fontSize="9">unidades</text>
    </svg>
  );
}

// ── SECCIÓN: Líneas de producto ────────────────────────────────────────────────
function LineasProductoSection({ data, onLineaChange }) {
  const totalGeneral = AGENCIAS.reduce(
    (s, ag) => s + LINEAS_PRODUCTO.reduce((s2, l) => s2 + (data.lineasProducto[ag]?.[l] ?? 0), 0), 0
  );

  return (
    <Card>
      <SectionHeader title="VENTAS POR LÍNEA DE PRODUCTO" icon="🥧" />
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        {AGENCIAS.map(ag => {
          const rowData = data.lineasProducto[ag] ?? {};
          const pieData = LINEAS_PRODUCTO.map((linea, i) => ({
            label: linea,
            value: rowData[linea] ?? 0,
            color: COLORES_LINEAS[i % COLORES_LINEAS.length],
          }));
          const totalAgencia = pieData.reduce((s, d) => s + d.value, 0);

          return (
            <div key={ag} style={{ flex: "1 1 280px", minWidth: 280 }}>
              <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: .8 }}>{ag}</p>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <PieChart data={pieData} size={140} />
                <div style={{ flex: 1, maxHeight: 160, overflowY: "auto" }}>
                  {LINEAS_PRODUCTO.map((linea, i) => (
                    <div key={linea} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: COLORES_LINEAS[i % COLORES_LINEAS.length], flexShrink: 0 }} />
                      <span style={{ color: "#94a3b8", fontSize: 10, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{linea}</span>
                      <NumInput
                        value={rowData[linea] ?? 0}
                        onChange={v => onLineaChange(ag, linea, v)}
                        width={42}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: "right", color: "#D4AF37", fontSize: 12, fontWeight: 700, marginTop: 4 }}>
                Total: {totalAgencia} unid.
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ textAlign: "right", color: "#D4AF37", fontSize: 14, fontWeight: 800, marginTop: 16, borderTop: "1px solid #D4AF3733", paddingTop: 10 }}>
        TOTAL GENERAL: {totalGeneral} unidades
      </div>
    </Card>
  );
}

// ── SECCIÓN: Ventas ───────────────────────────────────────────────────────────
function VentasSection({ data, onFieldChange }) {
  const total = (bloque, campo) => AGENCIAS.reduce((s, a) => s + (data[bloque][a]?.[campo] ?? 0), 0);

  const renderTable = (bloque, titulo) => (
    <div style={{ flex: 1, minWidth: 260 }}>
      <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: .8 }}>{titulo}</p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ color: "#64748b", fontSize: 11 }}>
            <th style={{ textAlign: "left", paddingBottom: 6 }}>AGENCIA</th>
            <th style={{ textAlign: "center" }}>FACTURADO</th>
            <th style={{ textAlign: "center" }}>OBJETIVO</th>
            <th style={{ textAlign: "center" }}>AVANCE</th>
          </tr>
        </thead>
        <tbody>
          {AGENCIAS.map(ag => {
            const row = data[bloque][ag] ?? { facturado: 0, objetivo: 0 };
            const p = pct(row.facturado, row.objetivo);
            return (
              <tr key={ag} style={{ borderTop: "1px solid #1e3a5f" }}>
                <td style={{ padding: "6px 0", color: "#cbd5e1", fontSize: 12 }}>{ag}</td>
                <td style={{ textAlign: "center" }}>
                  <NumInput value={row.facturado} onChange={v => onFieldChange(bloque, ag, "facturado", v)} />
                </td>
                <td style={{ textAlign: "center" }}>
                  <NumInput value={row.objetivo} onChange={v => onFieldChange(bloque, ag, "objetivo", v)} />
                </td>
                <td style={{ minWidth: 70 }}>
                  <div style={{ textAlign: "right", fontSize: 12, color: p >= 100 ? "#4ade80" : p >= 50 ? "#D4AF37" : "#f87171", fontWeight: 700 }}>{p}%</div>
                  <ProgressBar value={row.facturado} max={row.objetivo} />
                </td>
              </tr>
            );
          })}
          <tr style={{ borderTop: "2px solid #D4AF3755" }}>
            <td style={{ color: "#D4AF37", fontWeight: 700, padding: "6px 0", fontSize: 12 }}>TOTAL</td>
            <td style={{ color: "#D4AF37", fontWeight: 700, textAlign: "center" }}>{total(bloque, "facturado")}</td>
            <td style={{ color: "#D4AF37", fontWeight: 700, textAlign: "center" }}>{total(bloque, "objetivo")}</td>
            <td style={{ color: "#D4AF37", fontWeight: 700, textAlign: "right", fontSize: 12 }}>
              {pct(total(bloque, "facturado"), total(bloque, "objetivo"))}%
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <Card>
      <SectionHeader title="VENTAS" icon="📊" />
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        {renderTable("ventasJunioInterno", "JUNIO — OBJETIVO INTERNO")}
        {renderTable("ventasJunioMexico", "JUNIO — OBJETIVO CHANGAN MX")}
      </div>
    </Card>
  );
}

// ── SECCIÓN: Auditoría Interna ────────────────────────────────────────────────
function AuditoriaSection({ data, onSimpleChange }) {
  return (
    <Card>
      <SectionHeader title="AUDITORÍA INTERNA" icon="🔍" />
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ color: "#64748b", fontSize: 11 }}>
            <th style={{ textAlign: "left", paddingBottom: 6 }}>AGENCIA</th>
            <th style={{ textAlign: "center" }}>CALIFICACIÓN</th>
          </tr>
        </thead>
        <tbody>
          {AGENCIAS.map(ag => (
            <tr key={ag} style={{ borderTop: "1px solid #1e3a5f" }}>
              <td style={{ padding: "6px 0", color: "#cbd5e1", fontSize: 12 }}>{ag}</td>
              <td style={{ textAlign: "center" }}>
                <NumInput value={data.auditoria[ag] ?? 0} onChange={v => onSimpleChange("auditoria", ag, v)} step={0.1} width={70} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

// ── SECCIÓN: Wholesale (WS) ───────────────────────────────────────────────────
function WholesaleSection({ data, onFieldChange }) {
  const totalObj  = AGENCIAS.reduce((s, a) => s + (data.ws[a]?.objetivo ?? 0), 0);
  const totalReal = AGENCIAS.reduce((s, a) => s + (data.ws[a]?.real ?? 0), 0);

  return (
    <Card>
      <SectionHeader title="WHOLESALE (WS)" icon="🚚" />
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ color: "#64748b", fontSize: 11 }}>
            <th style={{ textAlign: "left", paddingBottom: 6 }}>AGENCIA</th>
            <th style={{ textAlign: "center" }}>OBJETIVO</th>
            <th style={{ textAlign: "center" }}>REAL</th>
            <th style={{ textAlign: "center" }}>AVANCE</th>
          </tr>
        </thead>
        <tbody>
          {AGENCIAS.map(ag => {
            const row = data.ws[ag] ?? { objetivo: 0, real: 0 };
            const p = pct(row.real, row.objetivo);
            return (
              <tr key={ag} style={{ borderTop: "1px solid #1e3a5f" }}>
                <td style={{ padding: "6px 0", color: "#cbd5e1", fontSize: 12 }}>{ag}</td>
                <td style={{ textAlign: "center" }}>
                  <NumInput value={row.objetivo} onChange={v => onFieldChange("ws", ag, "objetivo", v)} width={60} />
                </td>
                <td style={{ textAlign: "center" }}>
                  <NumInput value={row.real} onChange={v => onFieldChange("ws", ag, "real", v)} width={60} />
                </td>
                <td style={{ minWidth: 80 }}>
                  <div style={{ textAlign: "right", fontSize: 12, color: p >= 100 ? "#4ade80" : p >= 50 ? "#D4AF37" : "#f87171", fontWeight: 700 }}>{p}%</div>
                  <ProgressBar value={row.real} max={row.objetivo} />
                </td>
              </tr>
            );
          })}
          <tr style={{ borderTop: "2px solid #D4AF3755" }}>
            <td style={{ color: "#D4AF37", fontWeight: 700, padding: "6px 0", fontSize: 12 }}>TOTAL</td>
            <td style={{ color: "#D4AF37", fontWeight: 700, textAlign: "center" }}>{totalObj}</td>
            <td style={{ color: "#D4AF37", fontWeight: 700, textAlign: "center" }}>{totalReal}</td>
            <td style={{ color: "#D4AF37", fontWeight: 700, textAlign: "right", fontSize: 12 }}>{pct(totalReal, totalObj)}%</td>
          </tr>
        </tbody>
      </table>
    </Card>
  );
}

// ── SECCIÓN: VAN / VAU ────────────────────────────────────────────────────────
function VanVauSection({ data, onFieldChange, onToggleVau }) {
  return (
    <Card>
      <SectionHeader title="VAN / VAU JUNIO" icon="🚗" />
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: .8 }}>OBJETIVO VAN JUNIO</p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color: "#64748b", fontSize: 11 }}>
                <th style={{ textAlign: "left", paddingBottom: 6 }}>AGENCIA</th>
                <th style={{ textAlign: "center" }}>REAL</th>
                <th style={{ textAlign: "center" }}>OBJETIVO</th>
                <th style={{ textAlign: "center" }}>AVANCE</th>
              </tr>
            </thead>
            <tbody>
              {AGENCIAS.map(ag => {
                const row = data.van[ag] ?? { real: 0, objetivo: 1 };
                const p = pct(row.real, row.objetivo);
                return (
                  <tr key={ag} style={{ borderTop: "1px solid #1e3a5f" }}>
                    <td style={{ padding: "6px 0", color: "#cbd5e1", fontSize: 12 }}>{ag}</td>
                    <td style={{ textAlign: "center" }}>
                      <NumInput value={row.real} onChange={v => onFieldChange("van", ag, "real", v)} />
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <NumInput value={row.objetivo} onChange={v => onFieldChange("van", ag, "objetivo", v)} />
                    </td>
                    <td style={{ minWidth: 70 }}>
                      <div style={{ textAlign: "right", fontSize: 12, color: p >= 100 ? "#4ade80" : p >= 50 ? "#D4AF37" : "#f87171", fontWeight: 700 }}>{p}%</div>
                      <ProgressBar value={row.real} max={row.objetivo} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: .8 }}>OBJETIVO VAU JUNIO</p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color: "#64748b", fontSize: 11 }}>
                <th style={{ textAlign: "left", paddingBottom: 6 }}>AGENCIA</th>
                <th style={{ textAlign: "center" }}>CUMPLE</th>
              </tr>
            </thead>
            <tbody>
              {AGENCIAS.map(ag => (
                <tr key={ag} style={{ borderTop: "1px solid #1e3a5f" }}>
                  <td style={{ padding: "6px 0", color: "#cbd5e1", fontSize: 12 }}>{ag}</td>
                  <td style={{ textAlign: "center", padding: "4px 0" }}>
                    <button onClick={() => onToggleVau(ag)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      <Badge ok={data.vau[ag]} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}

// ── SECCIÓN: Satisfacción ─────────────────────────────────────────────────────
function SatisfaccionSection({ data, onFieldChange }) {
  return (
    <Card>
      <SectionHeader title="SATISFACCIÓN — ISI / SSI / CSI" icon="⭐" />
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: .8 }}>ISI JUNIO 2026</p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color: "#64748b", fontSize: 11 }}>
                <th style={{ textAlign: "left", paddingBottom: 6 }}>AGENCIA</th>
                <th style={{ textAlign: "center" }}>OBJ</th>
                <th style={{ textAlign: "center" }}>REAL</th>
                <th style={{ textAlign: "center" }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {AGENCIAS.map(ag => {
                const row = data.isi[ag] ?? { objetivo: 0.85, real: 0 };
                const ok = row.real >= row.objetivo;
                return (
                  <tr key={ag} style={{ borderTop: "1px solid #1e3a5f" }}>
                    <td style={{ padding: "6px 0", color: "#cbd5e1", fontSize: 12 }}>{ag}</td>
                    <td style={{ textAlign: "center", color: "#64748b" }}>{(row.objetivo * 100).toFixed(0)}%</td>
                    <td style={{ textAlign: "center" }}>
                      <NumInput value={row.real} onChange={v => onFieldChange("isi", ag, "real", v)} step={0.01} min={0} width={55} />
                    </td>
                    <td style={{ textAlign: "center" }}><Badge ok={ok} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: .8 }}>SSI JUNIO</p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color: "#64748b", fontSize: 11 }}>
                <th style={{ textAlign: "left", paddingBottom: 6 }}>AGENCIA</th>
                <th style={{ textAlign: "center" }}>OBJ</th>
                <th style={{ textAlign: "center" }}>CBD</th>
                <th style={{ textAlign: "center" }}>SSI</th>
              </tr>
            </thead>
            <tbody>
              {["TUXTLA", "TAPACHULA", "OCOSINGO"].map(ag => {
                const row = data.ssi[ag] ?? { objetivo: 0.87, cbd: 0, ssi: 0 };
                return (
                  <tr key={ag} style={{ borderTop: "1px solid #1e3a5f" }}>
                    <td style={{ padding: "6px 0", color: "#cbd5e1", fontSize: 12 }}>{ag}</td>
                    <td style={{ textAlign: "center", color: "#64748b" }}>{(row.objetivo * 100).toFixed(0)}%</td>
                    <td style={{ textAlign: "center" }}>
                      <NumInput value={row.cbd} onChange={v => onFieldChange("ssi", ag, "cbd", v)} step={0.01} width={50} />
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <NumInput value={row.ssi} onChange={v => onFieldChange("ssi", ag, "ssi", v)} step={0.01} width={50} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: .8 }}>CSI JUNIO</p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color: "#64748b", fontSize: 11 }}>
                <th style={{ textAlign: "left", paddingBottom: 6 }}>AGENCIA</th>
                <th style={{ textAlign: "center" }}>OBJ</th>
                <th style={{ textAlign: "center" }}>CBD</th>
                <th style={{ textAlign: "center" }}>CSI</th>
              </tr>
            </thead>
            <tbody>
              {["TUXTLA", "TAPACHULA"].map(ag => {
                const row = data.csi[ag] ?? { objetivo: 0.87, cbd: 0, csi: 0 };
                return (
                  <tr key={ag} style={{ borderTop: "1px solid #1e3a5f" }}>
                    <td style={{ padding: "6px 0", color: "#cbd5e1", fontSize: 12 }}>{ag}</td>
                    <td style={{ textAlign: "center", color: "#64748b" }}>{(row.objetivo * 100).toFixed(0)}%</td>
                    <td style={{ textAlign: "center" }}>
                      <NumInput value={row.cbd} onChange={v => onFieldChange("csi", ag, "cbd", v)} step={0.01} width={50} />
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <NumInput value={row.csi} onChange={v => onFieldChange("csi", ag, "csi", v)} step={0.01} width={50} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}

// ── SECCIÓN: Market Share ─────────────────────────────────────────────────────
function MarketShareSection({ data, onFieldChange }) {
  return (
    <Card>
      <SectionHeader title="MARKET SHARE — JUNIO" icon="📈" />
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ color: "#64748b", fontSize: 11 }}>
            <th style={{ textAlign: "left", paddingBottom: 6 }}>AGENCIA</th>
            <th style={{ textAlign: "center" }}>OBJ MS</th>
            <th style={{ textAlign: "center" }}>VENTAS</th>
            <th style={{ textAlign: "center" }}>TIV</th>
            <th style={{ textAlign: "center" }}>MS REAL</th>
          </tr>
        </thead>
        <tbody>
          {AGENCIAS.map(ag => {
            const row = data.msMayo[ag] ?? { objetivo: 0.02, real: 0, tiv: 0 };
            const msReal = row.tiv > 0 ? ((row.real / row.tiv) * 100).toFixed(1) + "%" : "—";
            const ok = row.tiv > 0 && (row.real / row.tiv) >= row.objetivo;
            return (
              <tr key={ag} style={{ borderTop: "1px solid #1e3a5f" }}>
                <td style={{ padding: "6px 0", color: "#cbd5e1", fontSize: 12 }}>{ag}</td>
                <td style={{ textAlign: "center", color: "#64748b" }}>{(row.objetivo * 100).toFixed(1)}%</td>
                <td style={{ textAlign: "center" }}>
                  <NumInput value={row.real} onChange={v => onFieldChange("msMayo", ag, "real", v)} />
                </td>
                <td style={{ textAlign: "center" }}>
                  <NumInput value={row.tiv} onChange={v => onFieldChange("msMayo", ag, "tiv", v)} />
                </td>
                <td style={{ textAlign: "center", color: row.tiv > 0 ? (ok ? "#4ade80" : "#f87171") : "#64748b", fontWeight: 700 }}>
                  {msReal}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

// ── SECCIÓN: Rotación (de personal) ───────────────────────────────────────────
function RotacionSection({ data, onFieldChange }) {
  return (
    <Card>
      <SectionHeader title="ROTACIÓN" icon="👥" />
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ color: "#64748b", fontSize: 11 }}>
            <th style={{ textAlign: "left", paddingBottom: 6 }}>AGENCIA</th>
            <th style={{ textAlign: "center" }}>REAL</th>
            <th style={{ textAlign: "center" }}>OBJ</th>
            <th style={{ textAlign: "center" }}>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {AGENCIAS.map(ag => {
            const row = data.rotacion[ag] ?? { real: 0, objetivo: 2.5 };
            const ok = row.real >= row.objetivo;
            return (
              <tr key={ag} style={{ borderTop: "1px solid #1e3a5f" }}>
                <td style={{ padding: "6px 0", color: "#cbd5e1", fontSize: 12 }}>{ag}</td>
                <td style={{ textAlign: "center" }}>
                  <NumInput value={row.real} onChange={v => onFieldChange("rotacion", ag, "real", v)} step={0.001} width={65} />
                </td>
                <td style={{ textAlign: "center", color: "#64748b" }}>{row.objetivo}</td>
                <td style={{ textAlign: "center" }}><Badge ok={ok} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

// ── KPI BAR ───────────────────────────────────────────────────────────────────
function KpiBar({ data }) {
  const totalFact   = AGENCIAS.reduce((s, a) => s + (data.ventasJunioInterno[a]?.facturado ?? 0), 0);
  const totalObj    = AGENCIAS.reduce((s, a) => s + (data.ventasJunioInterno[a]?.objetivo  ?? 0), 0);
  const totalFactMx = AGENCIAS.reduce((s, a) => s + (data.ventasJunioMexico[a]?.facturado ?? 0), 0);
  const totalObjMx  = AGENCIAS.reduce((s, a) => s + (data.ventasJunioMexico[a]?.objetivo  ?? 0), 0);
  const avanceV  = pct(totalFact, totalObj);
  const avanceMx = pct(totalFactMx, totalObjMx);
  const isiOk = AGENCIAS.filter(a => (data.isi[a]?.real ?? 0) >= (data.isi[a]?.objetivo ?? 0.85)).length;
  const vauOk = AGENCIAS.filter(a => data.vau[a]).length;
  const wsReal = AGENCIAS.reduce((s, a) => s + (data.ws[a]?.real ?? 0), 0);
  const wsObj  = AGENCIAS.reduce((s, a) => s + (data.ws[a]?.objetivo ?? 0), 0);

  const kpis = [
    { label: "Ventas Jun Interno", value: `${avanceV}%`, sub: `${totalFact}/${totalObj} unid.`, ok: avanceV >= 80 },
    { label: "Ventas Jun MX",      value: `${avanceMx}%`, sub: `${totalFactMx}/${totalObjMx} unid.`, ok: avanceMx >= 80 },
    { label: "ISI Cumplimiento",   value: `${isiOk}/${AGENCIAS.length}`, sub: "agencias ≥ objetivo", ok: isiOk === AGENCIAS.length },
    { label: "VAU Cumplimiento",   value: `${vauOk}/${AGENCIAS.length}`, sub: "agencias cumplen", ok: vauOk === AGENCIAS.length },
    { label: "WS Total Junio",     value: wsReal, sub: `de ${wsObj} objetivo`, ok: wsReal >= wsObj },
    { label: "VAN Total Jun",      value: AGENCIAS.reduce((s,a) => s+(data.van[a]?.real??0),0), sub: `de ${AGENCIAS.reduce((s,a)=>s+(data.van[a]?.objetivo??0),0)} objetivo`, ok: false },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
      {kpis.map(k => (
        <div key={k.label} style={{
          background: "#0f2239", border: `1px solid ${k.ok ? "#16a34a55" : "#1e3a5f"}`,
          borderTop: `3px solid ${k.ok ? "#4ade80" : "#D4AF37"}`,
          borderRadius: 8, padding: "12px 14px"
        }}>
          <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700, letterSpacing: .8, marginBottom: 4 }}>{k.label}</div>
          <div style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{k.value}</div>
          <div style={{ color: "#475569", fontSize: 11, marginTop: 3 }}>{k.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [data, setData] = useState(initialData);
  const [status, setStatus] = useState("conectando"); // conectando | ok | error
  const [lastSaved, setLastSaved] = useState(null);
  const saveTimer = useRef(null);

  // ── Cargar datos de Firebase al montar ──────────────────────────────────────
  useEffect(() => {
    (async () => {
      const raw = await fbGet("junio2026");
      if (raw && typeof raw === "object") {
        const merged = {};
        Object.keys(initialData).forEach(section => {
          merged[section] = decodeFirebaseData(raw[section], initialData[section]);
        });
        setData(merged);
        setStatus("ok");
      } else {
        // Primera vez: inicializar en Firebase
        await fbSet("junio2026", buildFirebaseSafeData(initialData));
        setStatus("ok");
      }
    })();

    // Polling cada 15 segundos para sincronizar cambios de otros usuarios
    const poll = setInterval(async () => {
      const raw = await fbGet("junio2026");
      if (raw && typeof raw === "object") {
        const merged = {};
        Object.keys(initialData).forEach(section => {
          merged[section] = decodeFirebaseData(raw[section], initialData[section]);
        });
        setData(merged);
      }
    }, 15000);

    return () => clearInterval(poll);
  }, []);

  // Construir objeto con claves Firebase-safe
  function buildFirebaseSafeData(d) {
    const safe = {};
    Object.keys(d).forEach(section => {
      const val = d[section];
      if (typeof val === "object" && val !== null) {
        safe[section] = {};
        Object.keys(val).forEach(k => {
          safe[section][encodeKey(k)] = val[k];
        });
      } else {
        safe[section] = val;
      }
    });
    return safe;
  }

  // ── Guardar a Firebase con debounce 800ms ────────────────────────────────────
  const scheduleSave = (newData) => {
    setStatus("guardando");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await fbSet("junio2026", buildFirebaseSafeData(newData));
        setStatus("ok");
        setLastSaved(new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      } catch {
        setStatus("error");
      }
    }, 800);
  };

  // ── Handlers centralizados ───────────────────────────────────────────────────
  const onFieldChange = (section, ag, field, val) => {
    setData(prev => {
      const next = {
        ...prev,
        [section]: {
          ...prev[section],
          [ag]: { ...prev[section][ag], [field]: val }
        }
      };
      scheduleSave(next);
      return next;
    });
  };

  const onSimpleChange = (section, ag, val) => {
    setData(prev => {
      const next = { ...prev, [section]: { ...prev[section], [ag]: val } };
      scheduleSave(next);
      return next;
    });
  };

  const onToggleVau = (ag) => {
    setData(prev => {
      const next = { ...prev, vau: { ...prev.vau, [ag]: !prev.vau[ag] } };
      scheduleSave(next);
      return next;
    });
  };

  const onLineaChange = (ag, linea, val) => {
    setData(prev => {
      const next = {
        ...prev,
        lineasProducto: {
          ...prev.lineasProducto,
          [ag]: { ...prev.lineasProducto[ag], [linea]: val }
        }
      };
      scheduleSave(next);
      return next;
    });
  };

  // ── Status indicator ────────────────────────────────────────────────────────
  const statusColor = { conectando: "#D4AF37", guardando: "#60a5fa", ok: "#4ade80", error: "#f87171" }[status];
  const statusLabel = { conectando: "Conectando…", guardando: "Guardando…", ok: lastSaved ? `Guardado ${lastSaved}` : "Conectado", error: "Error de conexión" }[status];

  return (
    <div style={{ minHeight: "100vh", background: "#070f1a", fontFamily: "'Inter', 'Segoe UI', sans-serif", color: "#f1f5f9", padding: "0 0 40px" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0d1b2e 0%, #0a2040 100%)",
        borderBottom: "2px solid #D4AF37",
        padding: "18px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8
      }}>
        <div>
          <div style={{ color: "#D4AF37", fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>CHANGAN · CHESA</div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#f1f5f9" }}>Dashboard Operativo — Junio 2026</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
          <span style={{ color: statusColor, fontSize: 12, fontWeight: 600 }}>{statusLabel}</span>
        </div>
      </div>

      <div style={{ padding: "20px 24px", maxWidth: 1400, margin: "0 auto" }}>
        <KpiBar data={data} />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <LineasProductoSection data={data} onLineaChange={onLineaChange} />
          <VentasSection data={data} onFieldChange={onFieldChange} />
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <AuditoriaSection data={data} onSimpleChange={onSimpleChange} />
            </div>
            <div style={{ flex: 1, minWidth: 280 }}>
              <WholesaleSection data={data} onFieldChange={onFieldChange} />
            </div>
            <div style={{ flex: 1, minWidth: 280 }}>
              <VanVauSection data={data} onFieldChange={onFieldChange} onToggleVau={onToggleVau} />
            </div>
          </div>
          <SatisfaccionSection data={data} onFieldChange={onFieldChange} />
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <MarketShareSection data={data} onFieldChange={onFieldChange} />
            </div>
            <div style={{ flex: 1, minWidth: 280 }}>
              <RotacionSection data={data} onFieldChange={onFieldChange} />
            </div>
          </div>
        </div>
        <div style={{ textAlign: "center", color: "#1e3a5f", fontSize: 11, marginTop: 24 }}>
          Los cambios se sincronizan automáticamente con Firebase · Actualización cada 15 seg
        </div>
      </div>
    </div>
  );
}
