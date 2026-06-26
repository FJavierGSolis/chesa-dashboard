import { useState, useEffect, useRef } from "react";

// ── Firebase config ───────────────────────────────────────────────────────────
const FIREBASE_URL = "https://dashboard-changan-chesa-default-rtdb.firebaseio.com";

const AGENCIAS = ["TUXTLA", "TAPACHULA", "SAN CRISTÓBAL", "COMITÁN", "OCOSINGO"];

const PLANES = [
  { key: "CONTADO",     color: "#D4AF37" },
  { key: "BBVA",        color: "#1e88e5" },
  { key: "BANORTE",     color: "#e53935" },
  { key: "CAFI",        color: "#8e44ad" },
  { key: "SANTANDER",   color: "#ff7043" },
  { key: "BANJÉRCITO",  color: "#26a69a" },
  { key: "SCOTIABANK",  color: "#ec407a" },
];

const LINEAS_PRODUCTO = [
  { key: "ALSVIN",         color: "#D4AF37" },
  { key: "CS35",           color: "#4ade80" },
  { key: "CS55",           color: "#60a5fa" },
  { key: "HUNTER PLUS",    color: "#f87171" },
  { key: "HONOR",          color: "#c084fc" },
  { key: "STAR TRUCK",     color: "#fb923c" },
  { key: "EADO IDD",       color: "#22d3ee" },
  { key: "CS55 IDD",       color: "#fbbf24" },
  { key: "CS75 PRO",       color: "#a3e635" },
  { key: "DEEPAL",         color: "#f472b6" },
  { key: "EADO PLUS",      color: "#818cf8" },
  { key: "UNIK",           color: "#34d399" },
  { key: "HUNTER CHASIS",  color: "#fb7185" },
  { key: "HUNTER WORK",    color: "#38bdf8" },
  { key: "HUNTER E",       color: "#facc15" },
];

// ── Conversión de Asesores ────────────────────────────────────────────────────
const CONVERSION_PATH = "conversionAsesores";

const ETAPAS = [
  { key: "contactados",     label: "Contactados",      num: "contactados",     den: "leads",           objetivo: 0.60 },
  { key: "citasAgendadas",  label: "Citas Agendadas",  num: "citasAgendadas",  den: "contactados",     objetivo: 0.60 },
  { key: "citasAsistidas",  label: "Citas Asistidas",  num: "citasAsistidas",  den: "citasAgendadas",  objetivo: 0.60 },
  { key: "demosAsistidas",  label: "Demos Asistidas",  num: "demosAsistidas",  den: "citasAsistidas",  objetivo: 0.50 },
  { key: "ventas",          label: "Ventas",           num: "ventas",          den: "demosAsistidas",  objetivo: 0.80 },
];

const genAsesorId = () => `a_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const asesorBlank = () => ({ nombre: "Nuevo Asesor", leads: 0, contactados: 0, citasAgendadas: 0, citasAsistidas: 0, demosAsistidas: 0, ventas: 0 });

// Datos iniciales tomados del Reporte de Estadísticas Vendedor (ene–may 2026), agencia Tuxtla
const initialConversion = {
  TUXTLA: {
    a01: { nombre: "Adrian Clemente", leads: 0, contactados: 0, citasAgendadas: 0, citasAsistidas: 0, demosAsistidas: 0, ventas: 0 },
    a02: { nombre: "Alejandra Concilco Roblero", leads: 67, contactados: 0, citasAgendadas: 0, citasAsistidas: 0, demosAsistidas: 0, ventas: 0 },
    a03: { nombre: "Catherine Flores Aguilar", leads: 97, contactados: 0, citasAgendadas: 1, citasAsistidas: 1, demosAsistidas: 0, ventas: 0 },
    a04: { nombre: "Emilio Perez", leads: 59, contactados: 47, citasAgendadas: 11, citasAsistidas: 0, demosAsistidas: 0, ventas: 1 },
    a05: { nombre: "Henry Diaz", leads: 48, contactados: 48, citasAgendadas: 3, citasAsistidas: 0, demosAsistidas: 1, ventas: 0 },
    a06: { nombre: "Jose Ivan Cruz Cruz", leads: 84, contactados: 74, citasAgendadas: 10, citasAsistidas: 2, demosAsistidas: 0, ventas: 0 },
    a07: { nombre: "Nehemias Toledo", leads: 138, contactados: 118, citasAgendadas: 35, citasAsistidas: 19, demosAsistidas: 3, ventas: 2 },
    a08: { nombre: "Ricardo Ramos Cha Tux Gut", leads: 381, contactados: 10, citasAgendadas: 1, citasAsistidas: 1, demosAsistidas: 0, ventas: 0 },
    a09: { nombre: "Sergio Ezequiel Lopez Dominguez", leads: 583, contactados: 1, citasAgendadas: 0, citasAsistidas: 0, demosAsistidas: 0, ventas: 0 },
    a10: { nombre: "Vanesa Morales", leads: 388, contactados: 304, citasAgendadas: 78, citasAsistidas: 19, demosAsistidas: 2, ventas: 8 },
    a11: { nombre: "Victor Berzunza", leads: 125, contactados: 45, citasAgendadas: 32, citasAsistidas: 13, demosAsistidas: 2, ventas: 2 },
  },
  TAPACHULA: {},
  "SAN CRISTÓBAL": {},
  COMITÁN: {},
  OCOSINGO: {},
};

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
  planesPago: {
    TUXTLA:          { CONTADO: 0, BBVA: 0, BANORTE: 0, CAFI: 0, SANTANDER: 0, BANJÉRCITO: 0, SCOTIABANK: 0 },
    TAPACHULA:       { CONTADO: 0, BBVA: 0, BANORTE: 0, CAFI: 0, SANTANDER: 0, BANJÉRCITO: 0, SCOTIABANK: 0 },
    "SAN CRISTÓBAL": { CONTADO: 0, BBVA: 0, BANORTE: 0, CAFI: 0, SANTANDER: 0, BANJÉRCITO: 0, SCOTIABANK: 0 },
    COMITÁN:         { CONTADO: 0, BBVA: 0, BANORTE: 0, CAFI: 0, SANTANDER: 0, BANJÉRCITO: 0, SCOTIABANK: 0 },
    OCOSINGO:        { CONTADO: 0, BBVA: 0, BANORTE: 0, CAFI: 0, SANTANDER: 0, BANJÉRCITO: 0, SCOTIABANK: 0 },
  },
  lineasProducto: {
    TUXTLA:          Object.fromEntries(LINEAS_PRODUCTO.map(l => [l.key, 0])),
    TAPACHULA:       Object.fromEntries(LINEAS_PRODUCTO.map(l => [l.key, 0])),
    "SAN CRISTÓBAL": Object.fromEntries(LINEAS_PRODUCTO.map(l => [l.key, 0])),
    COMITÁN:         Object.fromEntries(LINEAS_PRODUCTO.map(l => [l.key, 0])),
    OCOSINGO:        Object.fromEntries(LINEAS_PRODUCTO.map(l => [l.key, 0])),
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
};

// ── Firebase helpers ──────────────────────────────────────────────────────────
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

// ── Manejo de meses ────────────────────────────────────────────────────────────
const MES_NOMBRES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

function getMonthKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`; // ej. "2026-07"
}

// El día 1 del mes nuevo se sigue capturando como el mes anterior (cierre con 1 día de gracia).
// A partir del día 2 a las 00:00, ya es el mes en curso "de verdad".
function getOperativeMonthKey(date = new Date()) {
  if (date.getDate() === 1) {
    const prev = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    return getMonthKey(prev);
  }
  return getMonthKey(date);
}

function getMonthLabel(monthKey) {
  const [y, m] = monthKey.split("-");
  return `${MES_NOMBRES[parseInt(m, 10) - 1]} ${y}`;
}

function getPreviousMonthKey(monthKey) {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 2, 1); // mes-1 (0-indexed) -1 más = mes anterior
  return getMonthKey(d);
}

// Extrae solo los objetivos de "data" (deja todo lo "real"/"facturado"/capturado en cero)
// para usarlos como base del mes nuevo.
function extractObjectivesOnly(prevData) {
  const next = JSON.parse(JSON.stringify(initialData)); // estructura limpia en cero

  // Ventas: solo copiamos los objetivos, no lo facturado
  ["ventasJunioInterno", "ventasJunioMexico"].forEach(bloque => {
    AGENCIAS.forEach(ag => {
      if (prevData[bloque]?.[ag]) next[bloque][ag].objetivo = prevData[bloque][ag].objetivo;
    });
  });
  // WS
  AGENCIAS.forEach(ag => { if (prevData.ws?.[ag]) next.ws[ag].objetivo = prevData.ws[ag].objetivo; });
  // SSI / CSI / ISI
  Object.keys(next.ssi).forEach(ag => { if (prevData.ssi?.[ag]) next.ssi[ag].objetivo = prevData.ssi[ag].objetivo; });
  Object.keys(next.csi).forEach(ag => { if (prevData.csi?.[ag]) next.csi[ag].objetivo = prevData.csi[ag].objetivo; });
  Object.keys(next.isi).forEach(ag => { if (prevData.isi?.[ag]) next.isi[ag].objetivo = prevData.isi[ag].objetivo; });
  // Rotación
  AGENCIAS.forEach(ag => { if (prevData.rotacion?.[ag]) next.rotacion[ag].objetivo = prevData.rotacion[ag].objetivo; });
  // Market share (objetivo + tiv, que suele repetirse; ventas/real en cero)
  AGENCIAS.forEach(ag => {
    if (prevData.msMayo?.[ag]) {
      next.msMayo[ag].objetivo = prevData.msMayo[ag].objetivo;
      next.msMayo[ag].tiv = prevData.msMayo[ag].tiv;
    }
  });
  // VAN
  AGENCIAS.forEach(ag => { if (prevData.van?.[ag]) next.van[ag].objetivo = prevData.van[ag].objetivo; });
  // planesPago y lineasProducto: no tienen "objetivo", arrancan en cero (ya están en initialData)
  // auditoria y vau: arrancan en valor neutro (ya están en initialData)

  return next;
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

// ── Gráfica de pastel (CSS conic-gradient, sin librerías externas) ───────────
function PieChart({ entries, size = 190 }) {
  const total = entries.reduce((s, e) => s + e.value, 0);
  let acc = 0;
  const stops = entries.map(e => {
    const start = total > 0 ? (acc / total * 100) : 0;
    acc += e.value;
    const end = total > 0 ? (acc / total * 100) : 0;
    return `${e.color} ${start}% ${end}%`;
  }).join(", ");
  const bg = total > 0 ? `conic-gradient(${stops})` : "#1e3a5f";
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <div style={{ width: size, height: size, borderRadius: "50%", background: bg, border: "3px solid #0d1b2e", boxShadow: "0 0 0 1px #1e3a5f" }} />
      <div style={{
        position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column"
      }}>
        <div style={{
          width: size * 0.52, height: size * 0.52, borderRadius: "50%", background: "#0f2239",
          display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
          border: "1px solid #1e3a5f"
        }}>
          <div style={{ color: "#D4AF37", fontSize: 18, fontWeight: 800 }}>{total}</div>
          <div style={{ color: "#64748b", fontSize: 9, fontWeight: 700, letterSpacing: .5 }}>UNIDADES</div>
        </div>
      </div>
    </div>
  );
}

// ── SECCIÓN: Ventas por Tipo de Plan ──────────────────────────────────────────
function PlanesPagoSection({ data, onFieldChange }) {
  const [agSel, setAgSel] = useState("TOTAL");
  const opciones = ["TOTAL", ...AGENCIAS];

  const valores = PLANES.map(p => ({
    ...p,
    value: agSel === "TOTAL"
      ? AGENCIAS.reduce((s, ag) => s + (data.planesPago[ag]?.[p.key] ?? 0), 0)
      : (data.planesPago[agSel]?.[p.key] ?? 0),
  }));
  const total = valores.reduce((s, v) => s + v.value, 0);
  const facturadoRef = agSel === "TOTAL"
    ? AGENCIAS.reduce((s, ag) => s + (data.ventasJunioInterno[ag]?.facturado ?? 0), 0)
    : (data.ventasJunioInterno[agSel]?.facturado ?? 0);
  const coincide = total === facturadoRef;

  return (
    <Card>
      <SectionHeader title="VENTAS POR TIPO DE PLAN" icon="🥧" />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {opciones.map(ag => (
          <button key={ag} onClick={() => setAgSel(ag)} style={{
            background: agSel === ag ? "#D4AF37" : "#0f2239",
            color: agSel === ag ? "#0a1628" : "#94a3b8",
            border: `1px solid ${agSel === ag ? "#D4AF37" : "#1e3a5f"}`,
            borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer"
          }}>
            {ag}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 28, flexWrap: "wrap", alignItems: "center" }}>
        <PieChart entries={valores} />
        <div style={{ flex: 1, minWidth: 300 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color: "#64748b", fontSize: 11 }}>
                <th style={{ textAlign: "left", paddingBottom: 6 }}>PLAN</th>
                <th style={{ textAlign: "center" }}>UNIDADES</th>
                <th style={{ textAlign: "right" }}>% PARTICIPACIÓN</th>
              </tr>
            </thead>
            <tbody>
              {valores.map(v => {
                const p = total > 0 ? (v.value / total * 100) : 0;
                return (
                  <tr key={v.key} style={{ borderTop: "1px solid #1e3a5f" }}>
                    <td style={{ padding: "6px 0" }}>
                      <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: v.color, marginRight: 7 }} />
                      <span style={{ color: "#cbd5e1", fontSize: 12 }}>{v.key}</span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {agSel === "TOTAL"
                        ? <span style={{ color: "#cbd5e1" }}>{v.value}</span>
                        : <NumInput value={v.value} onChange={val => onFieldChange("planesPago", agSel, v.key, val)} width={55} />}
                    </td>
                    <td style={{ textAlign: "right", color: p > 0 ? "#D4AF37" : "#475569", fontWeight: 700 }}>{p.toFixed(1)}%</td>
                  </tr>
                );
              })}
              <tr style={{ borderTop: "2px solid #D4AF3755" }}>
                <td style={{ color: "#D4AF37", fontWeight: 700, padding: "6px 0" }}>TOTAL</td>
                <td style={{ textAlign: "center", color: "#D4AF37", fontWeight: 700 }}>{total}</td>
                <td style={{ textAlign: "right", color: "#D4AF37", fontWeight: 700 }}>100%</td>
              </tr>
            </tbody>
          </table>
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 11.5, color: "#64748b" }}>
            <span>Capturado por plan: <b style={{ color: "#cbd5e1" }}>{total}</b></span>
            <span>· Facturado en Ventas ({agSel}): <b style={{ color: "#cbd5e1" }}>{facturadoRef}</b></span>
            <Badge ok={coincide} />
          </div>
        </div>
      </div>
    </Card>
  );
}

// ── SECCIÓN: Ventas por Línea de Producto ─────────────────────────────────────
function LineasProductoSection({ data, onLineaChange }) {
  const [agSel, setAgSel] = useState("TOTAL");
  const opciones = ["TOTAL", ...AGENCIAS];

  const valores = LINEAS_PRODUCTO.map(l => ({
    ...l,
    value: agSel === "TOTAL"
      ? AGENCIAS.reduce((s, ag) => s + (data.lineasProducto[ag]?.[l.key] ?? 0), 0)
      : (data.lineasProducto[agSel]?.[l.key] ?? 0),
  }));
  const total = valores.reduce((s, v) => s + v.value, 0);
  const facturadoRef = agSel === "TOTAL"
    ? AGENCIAS.reduce((s, ag) => s + (data.ventasJunioInterno[ag]?.facturado ?? 0), 0)
    : (data.ventasJunioInterno[agSel]?.facturado ?? 0);
  const coincide = total === facturadoRef;

  return (
    <Card>
      <SectionHeader title="VENTAS POR LÍNEA DE PRODUCTO" icon="🥧" />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {opciones.map(ag => (
          <button key={ag} onClick={() => setAgSel(ag)} style={{
            background: agSel === ag ? "#D4AF37" : "#0f2239",
            color: agSel === ag ? "#0a1628" : "#94a3b8",
            border: `1px solid ${agSel === ag ? "#D4AF37" : "#1e3a5f"}`,
            borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer"
          }}>
            {ag}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 28, flexWrap: "wrap", alignItems: "center" }}>
        <PieChart entries={valores} />
        <div style={{ flex: 1, minWidth: 300 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color: "#64748b", fontSize: 11 }}>
                <th style={{ textAlign: "left", paddingBottom: 6 }}>LÍNEA</th>
                <th style={{ textAlign: "center" }}>UNIDADES</th>
                <th style={{ textAlign: "right" }}>% PARTICIPACIÓN</th>
              </tr>
            </thead>
            <tbody>
              {valores.map(v => {
                const p = total > 0 ? (v.value / total * 100) : 0;
                return (
                  <tr key={v.key} style={{ borderTop: "1px solid #1e3a5f" }}>
                    <td style={{ padding: "6px 0" }}>
                      <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: v.color, marginRight: 7 }} />
                      <span style={{ color: "#cbd5e1", fontSize: 12 }}>{v.key}</span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {agSel === "TOTAL"
                        ? <span style={{ color: "#cbd5e1" }}>{v.value}</span>
                        : <NumInput value={v.value} onChange={val => onLineaChange(agSel, v.key, val)} width={55} />}
                    </td>
                    <td style={{ textAlign: "right", color: p > 0 ? "#D4AF37" : "#475569", fontWeight: 700 }}>{p.toFixed(1)}%</td>
                  </tr>
                );
              })}
              <tr style={{ borderTop: "2px solid #D4AF3755" }}>
                <td style={{ color: "#D4AF37", fontWeight: 700, padding: "6px 0" }}>TOTAL</td>
                <td style={{ textAlign: "center", color: "#D4AF37", fontWeight: 700 }}>{total}</td>
                <td style={{ textAlign: "right", color: "#D4AF37", fontWeight: 700 }}>100%</td>
              </tr>
            </tbody>
          </table>
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 11.5, color: "#64748b" }}>
            <span>Capturado por línea: <b style={{ color: "#cbd5e1" }}>{total}</b></span>
            <span>· Facturado en Ventas ({agSel}): <b style={{ color: "#cbd5e1" }}>{facturadoRef}</b></span>
            <Badge ok={coincide} />
          </div>
        </div>
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
      <SectionHeader title="SATISFACCIÓN — SSI / CSI / ISI" icon="⭐" />
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 320 }}>
          <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: .8 }}>SSI JUNIO (Objetivo aplica a CBD y SSI)</p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color: "#64748b", fontSize: 11 }}>
                <th style={{ textAlign: "left", paddingBottom: 6 }}>AGENCIA</th>
                <th style={{ textAlign: "center" }}>OBJ</th>
                <th style={{ textAlign: "center" }}>CBD</th>
                <th style={{ textAlign: "center" }}></th>
                <th style={{ textAlign: "center" }}>SSI</th>
                <th style={{ textAlign: "center" }}></th>
              </tr>
            </thead>
            <tbody>
              {["TUXTLA", "TAPACHULA", "OCOSINGO"].map(ag => {
                const row = data.ssi[ag] ?? { objetivo: 0.87, cbd: 0, ssi: 0 };
                const objPct = row.objetivo * 100;
                const cbdOk = row.cbd >= objPct;
                const ssiOk = row.ssi >= objPct;
                return (
                  <tr key={ag} style={{ borderTop: "1px solid #1e3a5f" }}>
                    <td style={{ padding: "6px 0", color: "#cbd5e1", fontSize: 12 }}>{ag}</td>
                    <td style={{ textAlign: "center", color: "#64748b" }}>{objPct.toFixed(0)}%</td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
                        <NumInput value={row.cbd} onChange={v => onFieldChange("ssi", ag, "cbd", v)} step={0.1} width={50} />
                        <span style={{ color: "#64748b", fontSize: 12 }}>%</span>
                      </div>
                    </td>
                    <td style={{ textAlign: "center" }}><Badge ok={cbdOk} /></td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
                        <NumInput value={row.ssi} onChange={v => onFieldChange("ssi", ag, "ssi", v)} step={0.1} width={50} />
                        <span style={{ color: "#64748b", fontSize: 12 }}>%</span>
                      </div>
                    </td>
                    <td style={{ textAlign: "center" }}><Badge ok={ssiOk} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ flex: 1, minWidth: 320 }}>
          <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: .8 }}>CSI JUNIO (Objetivo aplica a CBD y CSI)</p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color: "#64748b", fontSize: 11 }}>
                <th style={{ textAlign: "left", paddingBottom: 6 }}>AGENCIA</th>
                <th style={{ textAlign: "center" }}>OBJ</th>
                <th style={{ textAlign: "center" }}>CBD</th>
                <th style={{ textAlign: "center" }}></th>
                <th style={{ textAlign: "center" }}>CSI</th>
                <th style={{ textAlign: "center" }}></th>
              </tr>
            </thead>
            <tbody>
              {["TUXTLA", "TAPACHULA"].map(ag => {
                const row = data.csi[ag] ?? { objetivo: 0.87, cbd: 0, csi: 0 };
                const objPct = row.objetivo * 100;
                const cbdOk = row.cbd >= objPct;
                const csiOk = row.csi >= objPct;
                return (
                  <tr key={ag} style={{ borderTop: "1px solid #1e3a5f" }}>
                    <td style={{ padding: "6px 0", color: "#cbd5e1", fontSize: 12 }}>{ag}</td>
                    <td style={{ textAlign: "center", color: "#64748b" }}>{objPct.toFixed(0)}%</td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
                        <NumInput value={row.cbd} onChange={v => onFieldChange("csi", ag, "cbd", v)} step={0.1} width={50} />
                        <span style={{ color: "#64748b", fontSize: 12 }}>%</span>
                      </div>
                    </td>
                    <td style={{ textAlign: "center" }}><Badge ok={cbdOk} /></td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
                        <NumInput value={row.csi} onChange={v => onFieldChange("csi", ag, "csi", v)} step={0.1} width={50} />
                        <span style={{ color: "#64748b", fontSize: 12 }}>%</span>
                      </div>
                    </td>
                    <td style={{ textAlign: "center" }}><Badge ok={csiOk} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
                const objPct = row.objetivo * 100;
                const ok = row.real >= objPct;
                return (
                  <tr key={ag} style={{ borderTop: "1px solid #1e3a5f" }}>
                    <td style={{ padding: "6px 0", color: "#cbd5e1", fontSize: 12 }}>{ag}</td>
                    <td style={{ textAlign: "center", color: "#64748b" }}>{objPct.toFixed(0)}%</td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
                        <NumInput value={row.real} onChange={v => onFieldChange("isi", ag, "real", v)} step={0.1} min={0} width={55} />
                        <span style={{ color: "#64748b", fontSize: 12 }}>%</span>
                      </div>
                    </td>
                    <td style={{ textAlign: "center" }}><Badge ok={ok} /></td>
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
function MarketShareSection({ data, onFieldChange, monthKey }) {
  const tivLabel = getMonthLabel(getPreviousMonthKey(monthKey));
  const tivLabelCap = tivLabel.charAt(0).toUpperCase() + tivLabel.slice(1);
  return (
    <Card>
      <SectionHeader title={`MARKET SHARE — ${tivLabelCap.toUpperCase()}`} icon="📈" />
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

// ── SECCIÓN: Conversión de Asesores ───────────────────────────────────────────
function ConversionKpiBar({ asesores }) {
  const rows = Object.values(asesores);
  const sum = (f) => rows.reduce((s, r) => s + (Number(r[f]) || 0), 0);
  const totales = {
    leads: sum("leads"), contactados: sum("contactados"), citasAgendadas: sum("citasAgendadas"),
    citasAsistidas: sum("citasAsistidas"), demosAsistidas: sum("demosAsistidas"), ventas: sum("ventas"),
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 18 }}>
      {ETAPAS.map(et => {
        const num = totales[et.num], den = totales[et.den];
        const ratio = den > 0 ? num / den : 0;
        const p = Math.round(ratio * 100);
        const ok = ratio >= et.objetivo;
        const cumplen = rows.filter(r => {
          const d = Number(r[et.den]) || 0, n = Number(r[et.num]) || 0;
          return d > 0 && (n / d) >= et.objetivo;
        }).length;
        return (
          <div key={et.key} style={{
            background: "#0f2239", border: `1px solid ${ok ? "#16a34a55" : "#1e3a5f"}`,
            borderTop: `3px solid ${ok ? "#4ade80" : "#D4AF37"}`,
            borderRadius: 8, padding: "12px 14px"
          }}>
            <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700, letterSpacing: .8, marginBottom: 4 }}>% {et.label.toUpperCase()}</div>
            <div style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{p}%</div>
            <div style={{ color: "#475569", fontSize: 11, marginTop: 3 }}>obj. {Math.round(et.objetivo * 100)}% · {cumplen}/{rows.length} asesores cumplen</div>
          </div>
        );
      })}
    </div>
  );
}

function ConversionTable({ agencia, asesores, onFieldChange, onAdd, onRemove }) {
  const ids = Object.keys(asesores);
  const campoCols = [
    { key: "leads", label: "Leads" },
    { key: "contactados", label: "Contact." },
    { key: "citasAgendadas", label: "Citas Agend." },
    { key: "citasAsistidas", label: "Citas Asist." },
    { key: "demosAsistidas", label: "Demos Asist." },
    { key: "ventas", label: "Ventas" },
  ];
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <SectionHeader title={`ASESORES — ${agencia}`} icon="🧑‍💼" />
        <button onClick={() => onAdd(agencia)} style={{
          background: "#D4AF3722", border: "1px solid #D4AF37", color: "#D4AF37",
          borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", marginBottom: 14
        }}>
          + Agregar asesor
        </button>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, minWidth: 1100 }}>
          <thead>
            <tr style={{ color: "#64748b", fontSize: 10.5 }}>
              <th style={{ textAlign: "left", paddingBottom: 6, minWidth: 160 }}>ASESOR</th>
              {campoCols.map(c => <th key={c.key} style={{ textAlign: "center", minWidth: 70 }}>{c.label}</th>)}
              {ETAPAS.map(et => <th key={et.key} style={{ textAlign: "center", minWidth: 95 }}>% {et.label}</th>)}
              <th style={{ minWidth: 30 }}></th>
            </tr>
          </thead>
          <tbody>
            {ids.length === 0 && (
              <tr><td colSpan={campoCols.length + ETAPAS.length + 2} style={{ color: "#475569", padding: "14px 0", textAlign: "center", fontSize: 12 }}>
                Sin asesores registrados en {agencia}. Usa "+ Agregar asesor" para empezar.
              </td></tr>
            )}
            {ids.map(id => {
              const row = asesores[id];
              return (
                <tr key={id} style={{ borderTop: "1px solid #1e3a5f" }}>
                  <td style={{ padding: "6px 0" }}>
                    <input
                      defaultValue={row.nombre}
                      onBlur={e => onFieldChange(agencia, id, "nombre", e.target.value)}
                      style={{ width: "100%", background: "#0d1b2e", border: "1px solid #2a3f5f", color: "#f1f5f9", borderRadius: 4, padding: "3px 6px", fontSize: 12.5 }}
                    />
                  </td>
                  {campoCols.map(c => (
                    <td key={c.key} style={{ textAlign: "center" }}>
                      <NumInput value={row[c.key] ?? 0} onChange={v => onFieldChange(agencia, id, c.key, v)} width={62} />
                    </td>
                  ))}
                  {ETAPAS.map(et => {
                    const num = Number(row[et.num]) || 0, den = Number(row[et.den]) || 0;
                    const ratio = den > 0 ? num / den : 0;
                    const p = Math.round(ratio * 100);
                    const ok = den > 0 && ratio >= et.objetivo;
                    return (
                      <td key={et.key} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: den === 0 ? "#475569" : ok ? "#4ade80" : "#f87171" }}>
                          {den === 0 ? "—" : `${p}%`}
                        </div>
                        {den > 0 && <ProgressBar value={num} max={Math.max(den * et.objetivo, num)} />}
                      </td>
                    );
                  })}
                  <td style={{ textAlign: "center" }}>
                    <button onClick={() => onRemove(agencia, id)} title="Eliminar asesor" style={{
                      background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 14, fontWeight: 700
                    }}>✕</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function ConversionSection({ conversionData, onFieldChange, onAdd, onRemove }) {
  const [agenciaSel, setAgenciaSel] = useState("TUXTLA");
  const asesores = conversionData[agenciaSel] ?? {};
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {AGENCIAS.map(ag => (
          <button key={ag} onClick={() => setAgenciaSel(ag)} style={{
            background: agenciaSel === ag ? "#D4AF37" : "#0f2239",
            color: agenciaSel === ag ? "#0a1628" : "#94a3b8",
            border: `1px solid ${agenciaSel === ag ? "#D4AF37" : "#1e3a5f"}`,
            borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer"
          }}>
            {ag} <span style={{ opacity: .7, fontWeight: 400 }}>({Object.keys(conversionData[ag] ?? {}).length})</span>
          </button>
        ))}
      </div>
      <ConversionKpiBar asesores={asesores} />
      <ConversionTable agencia={agenciaSel} asesores={asesores} onFieldChange={onFieldChange} onAdd={onAdd} onRemove={onRemove} />
      <div style={{ color: "#475569", fontSize: 11, textAlign: "center" }}>
        % Contactados = Contactados/Leads (obj. 60%) · % Citas Agendadas = Citas Agendadas/Contactados (obj. 60%) ·
        % Citas Asistidas = Citas Asistidas/Citas Agendadas (obj. 60%) · % Demos Asistidas = Demos Asistidas/Citas Asistidas (obj. 50%) ·
        % Ventas = Ventas/Demos Asistidas (obj. 80%)
      </div>
    </div>
  );
}

// ── SECCIÓN: Análisis con IA ──────────────────────────────────────────────────
function buildResumenParaIA(data, monthKey) {
  const mesLabel = getMonthLabel(monthKey);
  const lineas = [];
  lineas.push(`MES ANALIZADO: ${mesLabel}`);

  lineas.push("\n--- VENTAS (Objetivo Interno) ---");
  AGENCIAS.forEach(ag => {
    const r = data.ventasJunioInterno[ag] ?? {};
    lineas.push(`${ag}: facturado ${r.facturado ?? 0} / objetivo ${r.objetivo ?? 0}`);
  });

  lineas.push("\n--- VENTAS (Objetivo Changan México) ---");
  AGENCIAS.forEach(ag => {
    const r = data.ventasJunioMexico[ag] ?? {};
    lineas.push(`${ag}: facturado ${r.facturado ?? 0} / objetivo ${r.objetivo ?? 0}`);
  });

  lineas.push("\n--- VENTAS POR TIPO DE PLAN (total agencias) ---");
  PLANES.forEach(p => {
    const total = AGENCIAS.reduce((s, ag) => s + (data.planesPago[ag]?.[p.key] ?? 0), 0);
    lineas.push(`${p.key}: ${total} unidades`);
  });

  lineas.push("\n--- VENTAS POR LÍNEA DE PRODUCTO (total agencias) ---");
  LINEAS_PRODUCTO.forEach(l => {
    const total = AGENCIAS.reduce((s, ag) => s + (data.lineasProducto[ag]?.[l.key] ?? 0), 0);
    lineas.push(`${l.key}: ${total} unidades`);
  });

  lineas.push("\n--- WHOLESALE (WS) ---");
  AGENCIAS.forEach(ag => {
    const r = data.ws[ag] ?? {};
    lineas.push(`${ag}: real ${r.real ?? 0} / objetivo ${r.objetivo ?? 0}`);
  });

  lineas.push("\n--- AUDITORÍA INTERNA (calificación) ---");
  AGENCIAS.forEach(ag => lineas.push(`${ag}: ${data.auditoria[ag] ?? 0}`));

  lineas.push("\n--- SSI (CBD / SSI vs objetivo) ---");
  Object.keys(data.ssi).forEach(ag => {
    const r = data.ssi[ag];
    lineas.push(`${ag}: objetivo ${(r.objetivo*100).toFixed(0)}% · CBD ${r.cbd}% · SSI ${r.ssi}%`);
  });

  lineas.push("\n--- CSI (CBD / CSI vs objetivo) ---");
  Object.keys(data.csi).forEach(ag => {
    const r = data.csi[ag];
    lineas.push(`${ag}: objetivo ${(r.objetivo*100).toFixed(0)}% · CBD ${r.cbd}% · CSI ${r.csi}%`);
  });

  lineas.push("\n--- ISI ---");
  AGENCIAS.forEach(ag => {
    const r = data.isi[ag] ?? {};
    lineas.push(`${ag}: real ${r.real ?? 0}% / objetivo ${(r.objetivo*100).toFixed(0)}%`);
  });

  lineas.push("\n--- MARKET SHARE ---");
  AGENCIAS.forEach(ag => {
    const r = data.msMayo[ag] ?? {};
    const msReal = r.tiv > 0 ? ((r.real / r.tiv) * 100).toFixed(1) : "N/D";
    lineas.push(`${ag}: ventas ${r.real ?? 0} / TIV ${r.tiv ?? 0} → MS real ${msReal}% (objetivo ${(r.objetivo*100).toFixed(1)}%)`);
  });

  lineas.push("\n--- ROTACIÓN (de personal) ---");
  AGENCIAS.forEach(ag => {
    const r = data.rotacion[ag] ?? {};
    lineas.push(`${ag}: real ${r.real ?? 0} / objetivo ${r.objetivo ?? 0}`);
  });

  lineas.push("\n--- VAN / VAU ---");
  AGENCIAS.forEach(ag => {
    const v = data.van[ag] ?? {};
    lineas.push(`${ag}: VAN real ${v.real ?? 0} / objetivo ${v.objetivo ?? 0} · VAU: ${data.vau[ag] ? "Cumple" : "No cumple"}`);
  });

  return lineas.join("\n");
}

function AnalisisSection({ data, monthKey }) {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState("");
  const [error, setError] = useState("");

  const generarAnalisis = async () => {
    setLoading(true);
    setError("");
    setResultado("");
    try {
      const resumen = buildResumenParaIA(data, monthKey);
      const prompt = `Eres un consultor experto en gestión de dealerships automotrices (marca Changan, grupo CHESA, 5 agencias en Chiapas: Tuxtla, Tapachula, San Cristóbal, Comitán, Ocosingo).

Te comparto el corte de indicadores operativos del mes de ${getMonthLabel(monthKey)}. Analiza la información y entrega:

1. **Diagnóstico general** (3-5 puntos clave, identificando qué agencias y qué indicadores están en mayor riesgo o destacan positivamente)
2. **Plan de acción inmediato** (acciones concretas, accionables esta semana, priorizadas, indicando responsable sugerido por área: ventas, servicio/satisfacción, inventario/personal)
3. **Alertas críticas** (cualquier indicador muy por debajo del objetivo que requiera atención urgente del Director de Marca)

Sé directo, concreto y orientado a la acción — evita generalidades. Usa los nombres reales de las agencias. Formato en markdown con encabezados.

DATOS:
${resumen}`;

      const response = await fetch("/api/analisis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const responseData = await response.json();
      if (!response.ok) {
        setError(responseData.error || "Ocurrió un error generando el análisis.");
        return;
      }
      setResultado(responseData.text || "No se recibió respuesta del análisis. Intenta de nuevo.");
    } catch (e) {
      setError("Ocurrió un error generando el análisis. Verifica tu conexión e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Render simple de markdown (encabezados, negritas, listas) sin librerías externas
  const renderMarkdown = (md) => {
    const lines = md.split("\n");
    const out = [];
    let listBuffer = [];
    const flushList = () => {
      if (listBuffer.length) {
        out.push(<ul key={`ul-${out.length}`} style={{ margin: "6px 0 12px 18px", padding: 0 }}>{listBuffer}</ul>);
        listBuffer = [];
      }
    };
    const renderInline = (text) => {
      const parts = text.split(/(\*\*[^*]+\*\*)/g);
      return parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**")
          ? <b key={i} style={{ color: "#D4AF37" }}>{p.slice(2, -2)}</b>
          : <span key={i}>{p}</span>
      );
    };
    lines.forEach((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) { flushList(); return; }
      if (trimmed.startsWith("### ")) { flushList(); out.push(<h4 key={i} style={{ color: "#D4AF37", fontSize: 14, margin: "14px 0 6px" }}>{renderInline(trimmed.slice(4))}</h4>); }
      else if (trimmed.startsWith("## ")) { flushList(); out.push(<h3 key={i} style={{ color: "#D4AF37", fontSize: 16, margin: "16px 0 8px" }}>{renderInline(trimmed.slice(3))}</h3>); }
      else if (trimmed.startsWith("# ")) { flushList(); out.push(<h2 key={i} style={{ color: "#D4AF37", fontSize: 18, margin: "16px 0 8px" }}>{renderInline(trimmed.slice(2))}</h2>); }
      else if (/^[-*]\s+/.test(trimmed)) { listBuffer.push(<li key={i} style={{ color: "#cbd5e1", fontSize: 13, marginBottom: 4 }}>{renderInline(trimmed.replace(/^[-*]\s+/, ""))}</li>); }
      else if (/^\d+\.\s+/.test(trimmed)) { flushList(); out.push(<p key={i} style={{ color: "#cbd5e1", fontSize: 13, margin: "6px 0", fontWeight: 700 }}>{renderInline(trimmed)}</p>); }
      else { flushList(); out.push(<p key={i} style={{ color: "#cbd5e1", fontSize: 13, margin: "6px 0", lineHeight: 1.6 }}>{renderInline(trimmed)}</p>); }
    });
    flushList();
    return out;
  };

  return (
    <Card>
      <SectionHeader title={`ANÁLISIS Y PLAN DE ACCIÓN — ${getMonthLabel(monthKey).toUpperCase()}`} icon="🧠" />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <button
          onClick={generarAnalisis}
          disabled={loading}
          style={{
            background: loading ? "#1e3a5f" : "#D4AF37",
            color: loading ? "#64748b" : "#0a1628",
            border: "none", borderRadius: 8, padding: "10px 20px",
            fontSize: 13, fontWeight: 700, cursor: loading ? "default" : "pointer"
          }}
        >
          {loading ? "Generando análisis…" : "🧠 Generar análisis y plan de acción"}
        </button>
        <span style={{ color: "#64748b", fontSize: 11.5 }}>
          Analiza todos los indicadores capturados de {getMonthLabel(monthKey)} y genera un diagnóstico con acciones concretas.
        </span>
      </div>

      {error && (
        <div style={{ background: "#dc262622", border: "1px solid #f87171", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 13, marginBottom: 14 }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ color: "#94a3b8", fontSize: 13, padding: "20px 0", textAlign: "center" }}>
          Analizando indicadores de las 5 agencias… esto puede tardar unos segundos.
        </div>
      )}

      {!loading && resultado && (
        <div style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", borderRadius: 8, padding: "18px 20px", maxHeight: "70vh", overflowY: "auto" }}>
          {renderMarkdown(resultado)}
        </div>
      )}

      {!loading && !resultado && !error && (
        <div style={{ color: "#475569", fontSize: 12.5, textAlign: "center", padding: "30px 0" }}>
          Da clic en el botón para generar el diagnóstico y plan de acción basado en los datos actuales del dashboard.
        </div>
      )}
    </Card>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("operativo"); // operativo | conversion
  const [data, setData] = useState(initialData);
  const [conversionData, setConversionData] = useState(initialConversion);
  const [status, setStatus] = useState("conectando"); // conectando | ok | error
  const [lastSaved, setLastSaved] = useState(null);
  const saveTimer = useRef(null);
  const convSaveTimer = useRef(null);

  const currentMonthKey = getOperativeMonthKey();
  const [viewMonth, setViewMonth] = useState(currentMonthKey); // mes que se está viendo
  const [availableMonths, setAvailableMonths] = useState([currentMonthKey]);
  const isReadOnly = viewMonth !== currentMonthKey;

  // ── Cargar conversión de Firebase al montar + polling ───────────────────────
  useEffect(() => {
    const loadConversion = async () => {
      const raw = await fbGet(CONVERSION_PATH);
      if (raw && typeof raw === "object") {
        const merged = {};
        AGENCIAS.forEach(ag => { merged[ag] = raw[ag] && typeof raw[ag] === "object" ? raw[ag] : (initialConversion[ag] ?? {}); });
        setConversionData(merged);
      } else {
        await fbSet(CONVERSION_PATH, initialConversion);
      }
    };
    loadConversion();
    const poll = setInterval(loadConversion, 15000);
    return () => clearInterval(poll);
  }, []);

  const scheduleSaveConversion = (next) => {
    if (convSaveTimer.current) clearTimeout(convSaveTimer.current);
    convSaveTimer.current = setTimeout(() => { fbSet(CONVERSION_PATH, next); }, 800);
  };

  const onAsesorFieldChange = (agencia, id, field, val) => {
    setConversionData(prev => {
      const next = {
        ...prev,
        [agencia]: { ...prev[agencia], [id]: { ...prev[agencia][id], [field]: val } }
      };
      scheduleSaveConversion(next);
      return next;
    });
  };

  const onAddAsesor = (agencia) => {
    setConversionData(prev => {
      const next = { ...prev, [agencia]: { ...prev[agencia], [genAsesorId()]: asesorBlank() } };
      scheduleSaveConversion(next);
      return next;
    });
  };

  const onRemoveAsesor = (agencia, id) => {
    setConversionData(prev => {
      const agObj = { ...prev[agencia] };
      delete agObj[id];
      const next = { ...prev, [agencia]: agObj };
      scheduleSaveConversion(next);
      return next;
    });
  };

  // ── Cargar lista de meses disponibles ───────────────────────────────────────
  useEffect(() => {
    (async () => {
      const idx = await fbGet("mesesIndex");
      const meses = Array.isArray(idx) ? idx : (idx ? Object.values(idx) : []);
      const set = new Set([...meses, currentMonthKey]);
      const ordered = Array.from(set).sort().reverse(); // más reciente primero
      setAvailableMonths(ordered);
    })();
  }, []);

  // ── Cargar datos del mes actual (o crear el mes nuevo heredando objetivos) ──
  useEffect(() => {
    (async () => {
      const raw = await fbGet(`datos/${currentMonthKey}`);
      if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
        const merged = {};
        Object.keys(initialData).forEach(section => {
          merged[section] = decodeFirebaseData(raw[section], initialData[section]);
        });
        setData(merged);
        setStatus("ok");
      } else {
        // Mes nuevo: buscamos el mes anterior para heredar objetivos
        const prevKey = getPreviousMonthKey(currentMonthKey);
        const prevRaw = await fbGet(`datos/${prevKey}`);
        let base = initialData;
        if (prevRaw && typeof prevRaw === "object" && Object.keys(prevRaw).length > 0) {
          const prevMerged = {};
          Object.keys(initialData).forEach(section => {
            prevMerged[section] = decodeFirebaseData(prevRaw[section], initialData[section]);
          });
          base = extractObjectivesOnly(prevMerged);
        }
        await fbSet(`datos/${currentMonthKey}`, buildFirebaseSafeData(base));
        // Actualizar índice de meses
        const idx = await fbGet("mesesIndex");
        const meses = Array.isArray(idx) ? idx : (idx ? Object.values(idx) : []);
        const nuevoIdx = Array.from(new Set([...meses, currentMonthKey]));
        await fbSet("mesesIndex", nuevoIdx);
        setAvailableMonths(nuevoIdx.sort().reverse());
        setData(base);
        setStatus("ok");
      }
    })();

    // Polling cada 15 segundos para sincronizar cambios de otros usuarios (solo si viendo el mes actual)
    const poll = setInterval(async () => {
      if (viewMonth !== currentMonthKey) return; // no refrescar si está viendo histórico
      const raw = await fbGet(`datos/${currentMonthKey}`);
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

  // ── Cuando el usuario navega a ver un mes distinto (histórico, solo lectura) ─
  useEffect(() => {
    if (viewMonth === currentMonthKey) return; // ya se maneja arriba
    (async () => {
      setStatus("conectando");
      const raw = await fbGet(`datos/${viewMonth}`);
      if (raw && typeof raw === "object") {
        const merged = {};
        Object.keys(initialData).forEach(section => {
          merged[section] = decodeFirebaseData(raw[section], initialData[section]);
        });
        setData(merged);
      }
      setStatus("ok");
    })();
  }, [viewMonth]);

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
    if (isReadOnly) return; // no se guarda si se está viendo un mes histórico
    setStatus("guardando");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await fbSet(`datos/${currentMonthKey}`, buildFirebaseSafeData(newData));
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
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#f1f5f9" }}>
            Dashboard Operativo — {getMonthLabel(viewMonth).charAt(0).toUpperCase() + getMonthLabel(viewMonth).slice(1)}
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <select
            value={viewMonth}
            onChange={e => setViewMonth(e.target.value)}
            style={{
              background: "#0d1b2e", border: "1px solid #2a3f5f", color: "#D4AF37",
              borderRadius: 6, padding: "6px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer"
            }}
          >
            {availableMonths.map(mk => (
              <option key={mk} value={mk}>
                {getMonthLabel(mk).charAt(0).toUpperCase() + getMonthLabel(mk).slice(1)}{mk === currentMonthKey ? " (actual)" : ""}
              </option>
            ))}
          </select>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setTab("operativo")} style={{
              background: tab === "operativo" ? "#D4AF37" : "transparent",
              color: tab === "operativo" ? "#0a1628" : "#94a3b8",
              border: "1px solid #D4AF37", borderRadius: 6, padding: "6px 14px",
              fontSize: 12, fontWeight: 700, cursor: "pointer"
            }}>📊 Operativo</button>
            <button onClick={() => setTab("conversion")} style={{
              background: tab === "conversion" ? "#D4AF37" : "transparent",
              color: tab === "conversion" ? "#0a1628" : "#94a3b8",
              border: "1px solid #D4AF37", borderRadius: 6, padding: "6px 14px",
              fontSize: 12, fontWeight: 700, cursor: "pointer"
            }}>🧑‍💼 Conversión Asesores</button>
            <button onClick={() => setTab("analisis")} style={{
              background: tab === "analisis" ? "#D4AF37" : "transparent",
              color: tab === "analisis" ? "#0a1628" : "#94a3b8",
              border: "1px solid #D4AF37", borderRadius: 6, padding: "6px 14px",
              fontSize: 12, fontWeight: 700, cursor: "pointer"
            }}>🧠 Análisis IA</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isReadOnly ? (
              <>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fbbf24", boxShadow: "0 0 6px #fbbf24" }} />
                <span style={{ color: "#fbbf24", fontSize: 12, fontWeight: 600 }}>Histórico (solo lectura)</span>
              </>
            ) : (
              <>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
                <span style={{ color: statusColor, fontSize: 12, fontWeight: 600 }}>{statusLabel}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {isReadOnly && (
        <div style={{ background: "#fbbf2422", borderBottom: "1px solid #fbbf24", padding: "8px 28px", textAlign: "center", fontSize: 12.5, color: "#fbbf24" }}>
          Estás viendo el histórico de <b>{getMonthLabel(viewMonth)}</b> — los datos no se pueden editar.{" "}
          <button onClick={() => setViewMonth(currentMonthKey)} style={{
            background: "none", border: "none", color: "#fbbf24", textDecoration: "underline", cursor: "pointer", fontSize: 12.5, fontWeight: 700
          }}>
            Volver al mes actual
          </button>
        </div>
      )}

      <div style={{ padding: "20px 24px", maxWidth: 1400, margin: "0 auto", opacity: (isReadOnly && tab !== "analisis") ? 0.85 : 1, pointerEvents: (isReadOnly && tab !== "analisis") ? "none" : "auto" }}>
        {tab === "operativo" ? (
          <>
            <KpiBar data={data} />
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <VentasSection data={data} onFieldChange={onFieldChange} />
              <PlanesPagoSection data={data} onFieldChange={onFieldChange} />
              <LineasProductoSection data={data} onLineaChange={onLineaChange} />
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
                  <MarketShareSection data={data} onFieldChange={onFieldChange} monthKey={viewMonth} />
                </div>
                <div style={{ flex: 1, minWidth: 280 }}>
                  <RotacionSection data={data} onFieldChange={onFieldChange} />
                </div>
              </div>
            </div>
          </>
        ) : tab === "conversion" ? (
          <ConversionSection
            conversionData={conversionData}
            onFieldChange={onAsesorFieldChange}
            onAdd={onAddAsesor}
            onRemove={onRemoveAsesor}
          />
        ) : (
          <AnalisisSection data={data} monthKey={viewMonth} />
        )}
        <div style={{ textAlign: "center", color: "#1e3a5f", fontSize: 11, marginTop: 24 }}>
          Los cambios se sincronizan automáticamente con Firebase · Actualización cada 15 seg
        </div>
      </div>
    </div>
  );
}
