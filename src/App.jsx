import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";
import * as XLSX from "xlsx";

// ── Firebase config (SDK completo, para Authentication) ──────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDCajCyO0xDoROVLSIW49IN7CvPUdf7y0k",
  authDomain: "dashboard-changan-chesa.firebaseapp.com",
  databaseURL: "https://dashboard-changan-chesa-default-rtdb.firebaseio.com",
  projectId: "dashboard-changan-chesa",
  storageBucket: "dashboard-changan-chesa.firebasestorage.app",
  messagingSenderId: "250703738355",
  appId: "1:250703738355:web:a3226d6c26330aeace4e86",
};
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

// ── Roles y asignación de agencia por usuario ─────────────────────────────────
// El Director (correo de gerencia general) ve y edita todo.
// Cada gerente solo PUEDE EDITAR su agencia asignada, pero ve todo el panorama
// en la pestaña Operativo. En Tendencias/Análisis/Alertas/Chat, los gerentes
// solo ven y analizan su propia agencia.
const DIRECTOR_EMAILS = ["gerencia.general@changanchiapas.com.mx"];
const GERENTE_AGENCIA = {
  // "correo@chesa.com.mx": "TUXTLA",
  // Se completa conforme se creen las cuentas de cada gerente en Firebase Authentication.
};

function getRoleForEmail(email) {
  const lower = (email || "").toLowerCase().trim();
  if (DIRECTOR_EMAILS.map(e => e.toLowerCase()).includes(lower)) {
    return { role: "director", agencia: null };
  }
  const agencia = GERENTE_AGENCIA[lower];
  if (agencia) {
    return { role: "gerente", agencia };
  }
  // Por defecto, cualquier cuenta no reconocida se trata como director
  // (evita bloquear el acceso por error de configuración; ajustar si se requiere más estricto).
  return { role: "director", agencia: null };
}

// ── Firebase config ───────────────────────────────────────────────────────────
const FIREBASE_URL = "https://dashboard-changan-chesa-default-rtdb.firebaseio.com";

const AGENCIAS = ["TUXTLA", "TAPACHULA", "SAN CRISTÓBAL", "COMITÁN", "OCOSINGO"];

const MUNICIPIOS_CHIAPAS = [
  "Acacoyagua", "Acala", "Acapetahua", "Aldama", "Altamirano", "Amatán",
  "Amatenango de la Frontera", "Amatenango del Valle", "Ángel Albino Corzo", "Arriaga",
  "Bejucal de Ocampo", "Bella Vista", "Benemérito de las Américas", "Berriozábal",
  "Bochil", "El Bosque", "Cacahoatán", "Capitán Luis Ángel Vidal", "Catazajá",
  "Cintalapa", "Coapilla", "Comitán de Domínguez", "La Concordia", "Copainalá",
  "Chalchihuitán", "Chamula", "Chanal", "Chapultenango", "Chenalhó",
  "Chiapa de Corzo", "Chiapilla", "Chicoasén", "Chicomuselo", "Chilón",
  "Emiliano Zapata", "Escuintla", "Francisco León", "Frontera Comalapa",
  "Frontera Hidalgo", "La Grandeza", "Honduras de la Sierra", "Huehuetán",
  "Huixtán", "Huitiupán", "Huixtla", "La Independencia", "Ixhuatán",
  "Ixtacomitán", "Ixtapa", "Ixtapangajoya", "Jiquipilas", "Jitotol", "Juárez",
  "Larráinzar", "La Libertad", "Mapastepec", "Las Margaritas", "Marqués de Comillas",
  "Maravilla Tenejapa", "Mazapa de Madero", "Mazatán", "Metapa", "Mezcalapa",
  "Mitontic", "Montecristo de Guerrero", "Motozintla", "Nicolás Ruíz", "Ocosingo",
  "Ocotepec", "Ocozocoautla de Espinosa", "Ostuacán", "Osumacinta", "Oxchuc",
  "Palenque", "Pantelhó", "Pantepec", "El Parral", "Pichucalco", "Pijijiapan",
  "El Porvenir", "Villa Comaltitlán", "Pueblo Nuevo Solistahuacán", "Rayón",
  "Reforma", "Rincón Chamula San Pedro", "Las Rosas", "Sabanilla", "Salto de Agua",
  "San Andrés Duraznal", "San Cristóbal de las Casas", "San Fernando",
  "San Juan Cancuc", "San Lucas", "Santiago el Pinar", "Siltepec", "Simojovel",
  "Sitalá", "Socoltenango", "Solosuchiapa", "Soyaló", "Suchiapa", "Suchiate",
  "Sunuapa", "Tapachula", "Tapalapa", "Tapilula", "Tecpatán", "Tenejapa",
  "Teopisca", "Tila", "Tonalá", "Totolapa", "La Trinitaria", "Tumbalá",
  "Tuxtla Gutiérrez", "Tuxtla Chico", "Tuzantán", "Tzimol", "Unión Juárez",
  "Venustiano Carranza", "Villa Corzo", "Villaflores", "Yajalón", "Zinacantán",
];


const PLANES = [
  { key: "CONTADO",     color: "#D4AF37" },
  { key: "BBVA",        color: "#1e88e5" },
  { key: "BANORTE",     color: "#e53935" },
  { key: "CAFI",        color: "#8e44ad" },
  { key: "SANTANDER",   color: "#ff7043" },
  { key: "BANJÉRCITO",  color: "#26a69a" },
  { key: "SCOTIABANK",  color: "#ec407a" },
  { key: "CI BANCO",    color: "#9ca3af" },
  { key: "KUNA",        color: "#84cc16" },
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
  { key: "EADO PLUS",      color: "#818cf8" },
  { key: "UNIK",           color: "#34d399" },
  { key: "HUNTER CHASIS",  color: "#fb7185" },
  { key: "HUNTER WORK",    color: "#38bdf8" },
  { key: "HUNTER E",       color: "#facc15" },
  { key: "CS95",           color: "#e879f9" },
  { key: "G318",           color: "#fb7185" },
  { key: "S05 REEV",       color: "#2dd4bf" },
  { key: "S07 BEV",        color: "#fdba74" },
  { key: "S07 REEV",       color: "#93c5fd" },
];

// ── Conversión de Asesores ────────────────────────────────────────────────────
const FUNNEL_PATH = "funnelVentas"; // funnelVentas/{monthKey}/{AGENCIA}

const FUENTES_LEAD = [
  { key: "metaIntegraciones", label: "META/Integraciones",   color: "#3b9eea" },
  { key: "marca",             label: "Marca",                color: "#D4AF37" },
  { key: "piso",              label: "PISO",                 color: "#4ade80" },
  { key: "formOnline",        label: "Form Online (Digital)",color: "#c084fc" },
  { key: "calle",             label: "Calle (Prospección)",  color: "#fb923c" },
  { key: "fbChat",            label: "FB Chat (Digital)",    color: "#f472b6" },
];

// Etapas del Funnel de Ventas, capturadas manualmente por agencia.
// "leads" se alimenta automáticamente del reporte de Fuentes (suma de FUENTES_LEAD);
// el resto se captura a mano. Cada etapa muestra el % de paso respecto a la etapa anterior.
const ETAPAS_FUNNEL = [
  { key: "leads",           label: "Leads",            objetivo: null },
  { key: "contactados",     label: "Contactados",      objetivo: 0.60 },
  { key: "citasAgendadas",  label: "Citas Agendadas",  objetivo: 0.60 },
  { key: "citasAsistidas",  label: "Citas Asistidas",  objetivo: 0.60 },
  { key: "demosAgendadas",  label: "Demos Agendadas",  objetivo: 0.60 },
  { key: "demosAsistidas",  label: "Demos Asistidas",  objetivo: 0.50 },
  { key: "ventas",          label: "Ventas",           objetivo: 0.80 },
];

const funnelAgenciaBlank = () => ({
  leads: 0, asignados: 0, contactados: 0, citasAgendadas: 0, citasAsistidas: 0,
  demosAgendadas: 0, demosAsistidas: 0, ventas: 0,
});

const initialFunnel = {
  TUXTLA:          funnelAgenciaBlank(),
  TAPACHULA:       funnelAgenciaBlank(),
  "SAN CRISTÓBAL": funnelAgenciaBlank(),
  COMITÁN:         funnelAgenciaBlank(),
  OCOSINGO:        funnelAgenciaBlank(),
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
    TUXTLA:          Object.fromEntries(PLANES.map(p => [p.key, 0])),
    TAPACHULA:       Object.fromEntries(PLANES.map(p => [p.key, 0])),
    "SAN CRISTÓBAL": Object.fromEntries(PLANES.map(p => [p.key, 0])),
    COMITÁN:         Object.fromEntries(PLANES.map(p => [p.key, 0])),
    OCOSINGO:        Object.fromEntries(PLANES.map(p => [p.key, 0])),
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
    TUXTLA:          { plantillaInicial: 0, altas: 0, bajas: 0, objetivo: 2.5 },
    TAPACHULA:       { plantillaInicial: 0, altas: 0, bajas: 0, objetivo: 2.5 },
    "SAN CRISTÓBAL": { plantillaInicial: 0, altas: 0, bajas: 0, objetivo: 2.5 },
    COMITÁN:         { plantillaInicial: 0, altas: 0, bajas: 0, objetivo: 2.5 },
    OCOSINGO:        { plantillaInicial: 0, altas: 0, bajas: 0, objetivo: 2.5 },
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

// Genera todos los monthKey desde INICIO_OPERACIONES hasta el mes operativo actual (inclusive).
const INICIO_OPERACIONES = "2024-05"; // mayo 2024, cuando CHESA inició operaciones
function getAllMonthsRange(hastaKey) {
  const out = [];
  let [y, m] = INICIO_OPERACIONES.split("-").map(Number);
  const [yEnd, mEnd] = hastaKey.split("-").map(Number);
  while (y < yEnd || (y === yEnd && m <= mEnd)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return out;
}

function getYearFromKey(monthKey) { return monthKey.split("-")[0]; }
function getMonthNumFromKey(monthKey) { return parseInt(monthKey.split("-")[1], 10); }

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
  // Rotación: solo se hereda el objetivo (%); plantilla y bajas arrancan en cero cada mes
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

// ── PANTALLA DE LOGIN ──────────────────────────────────────────────────────────
// ── ENCUESTA PÚBLICA DE DEMO ──────────────────────────────────────────────────
// Página sin sesión, pensada para que el prospecto la responda desde su celular
// justo después de la prueba de manejo. Guarda en Firebase bajo encuestasDemo/{monthKey}.
const ENCUESTA_DEMO_PATH_PREFIX = "encuestasDemo";

// ── Contexto estratégico de CHESA — se inyecta en TODOS los prompts de IA ───
// Actualizar aquí cuando cambien las prioridades del negocio.
const CONTEXTO_CHESA = `CONTEXTO ESTRATÉGICO DE CHESA CHANGAN (leer antes de cualquier análisis):

Grupo CHESA es distribuidor exclusivo de Changan en Chiapas, México, con 5 agencias:
Tuxtla Gutiérrez (flagship, mayor objetivo), Tapachula, San Cristóbal de las Casas, Comitán y Ocosingo.

MARCA Y MERCADO:
- Changan es una marca china relativamente nueva en México. El principal obstáculo comercial es la desconfianza del consumidor chiapaneco hacia marcas chinas.
- Competidores directos en el mismo rango de precio: Chevrolet (GM), Nissan, Kia.
- Los indicadores de satisfacción (SSI/CSI) y las demos (pruebas de manejo) son críticos porque son la principal herramienta para romper la barrera de desconfianza.
- Cada venta perdida por atención lenta o mala experiencia se va directamente a la competencia.

CONTEXTO DE MERCADO CHIAPAS 2026 (Fuente: ADACH — Asociación de Distribuidores de Automóviles de Chiapas):
- Mercado total Chiapas promedio mensual ene-may 2026: ~2,832 unidades/mes
- Tendencia 2026 vs 2025: mercado con leve contracción proyectada (-1.3%)
- Distribución geográfica: Tuxtla concentra ~59% de ventas, Tapachula ~21%, San Cristóbal ~10-13%
- IMPORTANTE: En los reportes ADACH, las ventas de Changan en "Tuxtla" integran también Ocosingo, Comitán y San Cristóbal. Es decir, CHESA ES el único distribuidor Changan en Chiapas — los datos de ADACH representan el 100% de las ventas Changan en el estado.
- Ventas Changan = Ventas CHESA en Chiapas: Ene: 46, Feb: 50, Mar: 33, Abr: 37, May: 36 unidades
- Market share Changan/CHESA en Chiapas: ~1% del mercado total, ~10-14% dentro del segmento de marcas emergentes
- Segmento de marcas emergentes (chinas y nuevas): promedio 279 uds/mes en 2026 vs 335 en 2025 (-17%)
- GEELY y BYD ya no reportan ventas en Chiapas — el segmento chino se está concentrando
- Principales competidores chinos directos en Chiapas: MG (~40 uds/mes), JAC (~33 uds/mes), Chirey (~53 uds/mes), Jetour (~31 uds/mes)
- Líderes del mercado total: Nissan (~460-630 uds/mes), VW (~460-545), GM (~390-512)

IMPLICACIONES ESTRATÉGICAS DEL MERCADO:
- CHESA captura el 100% de las ventas Changan en Chiapas — no hay competencia interna de marca
- Con 33-50 unidades/mes, CHESA compite contra MG, JAC, Chirey y Jetour dentro del segmento emergente
- El mercado de marcas chinas NO está creciendo en Chiapas — la desconfianza es real y medible (-17% segmento)
- Crecer participación en un mercado en contracción requiere diferenciarse en experiencia, no solo en precio
- Tapachula y San Cristóbal son plazas con alto potencial para Changan dado el tamaño del mercado local

WHOLESALE (WS): NO es prioridad en este momento. CHESA está sobreinventariado. Si el WS está bajo vs objetivo, NO señalarlo como problema urgente — el objetivo es regularizar el inventario antes de comprar más. Solo mencionar WS si hay excedente operativo que resolver.

FINANCIAMIENTO: El foco es BBVA con ~50% de participación en ventas financiadas. No interesa crecer en otras financieras. Excepción: CAFI (financiera de casa, para clientes rechazados por banca o no bancarizados) — es estratégica. Si BBVA está por debajo del 50%, es alerta real.

INVENTARIO: El costo de plan piso (TIIE + spread diario) es pérdida financiera real. Unidades con más de 90 días son prioridad de venta agresiva, no de reposición. Unidades con daño pendiente = riesgo financiero + riesgo de imagen.

PRIORIDADES EN ORDEN REAL:
① Cierre de ventas del mes vs objetivo interno
② Velocidad de contactación de leads (tiempo de respuesta < 10 minutos es el estándar Changan)
③ Rotación de inventario crítico (>90 días)
④ Participación de BBVA en el mix de financiamiento (~50%)
⑤ SSI/CSI como indicador de la barrera de desconfianza
⑥ WS: solo si hay excedente operativo, no como objetivo de compra`;


// Catálogo simple de asesores por agencia (solo nombre), gestionado desde la pestaña Demos.
// Reemplaza al antiguo modelo de "Conversión de Asesores"; solo alimenta el selector
// de la encuesta pública de prueba de manejo.
const ASESORES_CATALOGO_PATH = "asesoresCatalogo"; // asesoresCatalogo/{AGENCIA} = { id: nombre, ... }
const genAsesorId = () => `a_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;


function EncuestaDemoPublica() {
  const [catalogoAsesores, setCatalogoAsesores] = useState(null);
  const [agencia, setAgencia] = useState("");
  const [asesorId, setAsesorId] = useState("");
  const [version, setVersion] = useState("");
  const [calificacion, setCalificacion] = useState("");
  const [legusto, setLegusto] = useState("");
  const [nolegusto, setNolegusto] = useState("");
  const [ofertas, setOfertas] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [colonia, setColonia] = useState("");
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const raw = await fbGet(ASESORES_CATALOGO_PATH);
      setCatalogoAsesores(raw || {});
    })();
  }, []);

  const asesoresDeAgencia = (() => {
    if (!catalogoAsesores || !agencia) return [];
    const agKey = encodeKey(agencia);
    const obj = catalogoAsesores[agKey] || catalogoAsesores[agencia] || {};
    return Object.entries(obj).map(([id, nombre]) => ({ id, nombre }));
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agencia || !asesorId || !version || !calificacion || !municipio.trim()) {
      setError("Por favor completa agencia, asesor, versión, calificación y municipio/colonia.");
      return;
    }
    setError("");
    setEnviando(true);
    try {
      const asesorNombre = asesoresDeAgencia.find(a => a.id === asesorId)?.nombre || "";
      const registro = {
        agencia, asesorId, asesorNombre, version,
        calificacion: Number(calificacion),
        legusto: legusto.trim(), nolegusto: nolegusto.trim(),
        ofertas: ofertas || "",
        municipio: municipio.trim(), colonia: colonia.trim(), comentario: comentario.trim(),
        fecha: new Date().toISOString(),
      };
      const monthKey = getOperativeMonthKey();
      const existentes = await fbGet(`${ENCUESTA_DEMO_PATH_PREFIX}/${monthKey}`);
      const lista = Array.isArray(existentes) ? existentes : (existentes ? Object.values(existentes) : []);
      lista.push(registro);
      await fbSet(`${ENCUESTA_DEMO_PATH_PREFIX}/${monthKey}`, lista);
      setEnviado(true);
    } catch (err) {
      setError("Ocurrió un error al enviar tu respuesta. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) {
    return (
      <div style={{ minHeight: "100vh", background: "#070f1a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', 'Segoe UI', sans-serif", padding: 20 }}>
        <div style={{ maxWidth: 420, textAlign: "center", color: "#f1f5f9" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <h2 style={{ fontFamily: "Georgia, serif", fontWeight: 700 }}>¡Gracias por tu opinión!</h2>
          <p style={{ color: "#94a3b8", fontSize: 14 }}>Tu respuesta nos ayuda a mejorar la experiencia en Changan CHESA.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#070f1a", fontFamily: "'Inter', 'Segoe UI', sans-serif", padding: "30px 16px", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 460 }}>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <img src="/logo-changan.png" alt="Changan" style={{ width: 130, objectFit: "contain" }} />
        </div>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h1 style={{ color: "#f1f5f9", fontSize: 19, fontWeight: 700, fontFamily: "Georgia, serif", margin: 0 }}>
            ¿Cómo fue tu prueba de manejo?
          </h1>
          <p style={{ color: "#64748b", fontSize: 12.5, marginTop: 6 }}>Tu opinión nos ayuda a mejorar — toma menos de 1 minuto.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", borderTop: "3px solid #3b9eea", borderRadius: 12, padding: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: "#94a3b8", fontSize: 11.5, fontWeight: 700, marginBottom: 6 }}>AGENCIA QUE TE ATENDIÓ *</label>
            <select value={agencia} onChange={e => { setAgencia(e.target.value); setAsesorId(""); }} required
              style={{ width: "100%", background: "#0a1830", border: "1px solid #1e3a5f", color: "#f1f5f9", borderRadius: 6, padding: "9px 10px", fontSize: 13, boxSizing: "border-box" }}>
              <option value="">Selecciona…</option>
              {AGENCIAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: "#94a3b8", fontSize: 11.5, fontWeight: 700, marginBottom: 6 }}>ASESOR QUE TE ATENDIÓ *</label>
            <select value={asesorId} onChange={e => setAsesorId(e.target.value)} required disabled={!agencia}
              style={{ width: "100%", background: "#0a1830", border: "1px solid #1e3a5f", color: "#f1f5f9", borderRadius: 6, padding: "9px 10px", fontSize: 13, boxSizing: "border-box" }}>
              <option value="">{agencia ? "Selecciona…" : "Primero elige tu agencia"}</option>
              {asesoresDeAgencia.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: "#94a3b8", fontSize: 11.5, fontWeight: 700, marginBottom: 6 }}>VERSIÓN QUE PROBASTE *</label>
            <select value={version} onChange={e => setVersion(e.target.value)} required
              style={{ width: "100%", background: "#0a1830", border: "1px solid #1e3a5f", color: "#f1f5f9", borderRadius: 6, padding: "9px 10px", fontSize: 13, boxSizing: "border-box" }}>
              <option value="">Selecciona…</option>
              {LINEAS_PRODUCTO.map(l => <option key={l.key} value={l.key}>{l.key}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: "#94a3b8", fontSize: 11.5, fontWeight: 700, marginBottom: 6 }}>
              CALIFICACIÓN GENERAL DE LA PRUEBA DE MANEJO (0-10) *
            </label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {Array.from({ length: 11 }, (_, i) => i).map(n => (
                <button type="button" key={n} onClick={() => setCalificacion(String(n))} style={{
                  width: 32, height: 32, borderRadius: 6, border: `1px solid ${calificacion === String(n) ? "#3b9eea" : "#1e3a5f"}`,
                  background: calificacion === String(n) ? "#3b9eea" : "#0a1830",
                  color: calificacion === String(n) ? "#0a1628" : "#94a3b8",
                  fontSize: 13, fontWeight: 700, cursor: "pointer"
                }}>{n}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: "#94a3b8", fontSize: 11.5, fontWeight: 700, marginBottom: 6 }}>¿QUÉ TE GUSTÓ DEL VEHÍCULO?</label>
            <textarea value={legusto} onChange={e => setLegusto(e.target.value)} rows={2}
              style={{ width: "100%", background: "#0a1830", border: "1px solid #1e3a5f", color: "#f1f5f9", borderRadius: 6, padding: "9px 10px", fontSize: 13, boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: "#94a3b8", fontSize: 11.5, fontWeight: 700, marginBottom: 6 }}>¿QUÉ NO TE GUSTÓ O MEJORARÍAS?</label>
            <textarea value={nolegusto} onChange={e => setNolegusto(e.target.value)} rows={2}
              style={{ width: "100%", background: "#0a1830", border: "1px solid #1e3a5f", color: "#f1f5f9", borderRadius: 6, padding: "9px 10px", fontSize: 13, boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: "#94a3b8", fontSize: 11.5, fontWeight: 700, marginBottom: 6 }}>
              ¿EL ASESOR TE COMPARTIÓ LAS GRANDES OFERTAS DEL MES?
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["Sí", "No", "No recuerdo"].map(op => (
                <button type="button" key={op} onClick={() => setOfertas(op)} style={{
                  flex: 1, minWidth: 90, padding: "9px 10px", borderRadius: 6,
                  border: `1px solid ${ofertas === op ? "#3b9eea" : "#1e3a5f"}`,
                  background: ofertas === op ? "#3b9eea" : "#0a1830",
                  color: ofertas === op ? "#0a1628" : "#94a3b8",
                  fontSize: 13, fontWeight: 700, cursor: "pointer"
                }}>{op}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: "#94a3b8", fontSize: 11.5, fontWeight: 700, marginBottom: 6 }}>MUNICIPIO DONDE VIVES *</label>
            <select value={municipio} onChange={e => setMunicipio(e.target.value)} required
              style={{ width: "100%", background: "#0a1830", border: "1px solid #1e3a5f", color: "#f1f5f9", borderRadius: 6, padding: "9px 10px", fontSize: 13, boxSizing: "border-box" }}>
              <option value="">Selecciona…</option>
              {MUNICIPIOS_CHIAPAS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: "#94a3b8", fontSize: 11.5, fontWeight: 700, marginBottom: 6 }}>COLONIA (OPCIONAL)</label>
            <input type="text" value={colonia} onChange={e => setColonia(e.target.value)} placeholder="Ej. Col. Moctezuma"
              style={{ width: "100%", background: "#0a1830", border: "1px solid #1e3a5f", color: "#f1f5f9", borderRadius: 6, padding: "9px 10px", fontSize: 13, boxSizing: "border-box" }} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", color: "#94a3b8", fontSize: 11.5, fontWeight: 700, marginBottom: 6 }}>COMENTARIO O SUGERENCIA ADICIONAL (OPCIONAL)</label>
            <textarea value={comentario} onChange={e => setComentario(e.target.value)} rows={2}
              style={{ width: "100%", background: "#0a1830", border: "1px solid #1e3a5f", color: "#f1f5f9", borderRadius: 6, padding: "9px 10px", fontSize: 13, boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }} />
          </div>

          {error && (
            <div style={{ background: "#dc262622", border: "1px solid #f87171", borderRadius: 6, padding: "8px 12px", color: "#f87171", fontSize: 12, marginBottom: 14 }}>{error}</div>
          )}

          <button type="submit" disabled={enviando} style={{
            width: "100%", background: enviando ? "#1e3a5f" : "#3b9eea", color: enviando ? "#64748b" : "#0a1628",
            border: "none", borderRadius: 8, padding: "12px 0", fontSize: 14, fontWeight: 700, cursor: enviando ? "default" : "pointer"
          }}>
            {enviando ? "Enviando…" : "Enviar mi opinión"}
          </button>
        </form>

        <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
          <div style={{ background: "#f1f5f9", borderRadius: 6, padding: "5px 10px" }}>
            <img src="/chesa-logo-v3.png" alt="CHESA" style={{ width: 65, objectFit: "contain" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PANTALLA DE LOGIN ──────────────────────────────────────────────────────────
function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // onAuthStateChanged en App() se encarga de avanzar a la pantalla principal
    } catch (err) {
      const map = {
        "auth/invalid-credential": "Correo o contraseña incorrectos.",
        "auth/invalid-email": "El correo no tiene un formato válido.",
        "auth/user-not-found": "No existe una cuenta con ese correo.",
        "auth/wrong-password": "Contraseña incorrecta.",
        "auth/too-many-requests": "Demasiados intentos. Intenta de nuevo en unos minutos.",
      };
      setError(map[err.code] || "Ocurrió un error al iniciar sesión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email.trim()) { setError("Escribe tu correo arriba antes de solicitar el restablecimiento."); return; }
    setError("");
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
    } catch (err) {
      setError("No se pudo enviar el correo de restablecimiento. Verifica que el correo sea correcto.");
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#070f1a", display: "flex",
      alignItems: "center", justifyContent: "center", fontFamily: "'Inter', 'Segoe UI', sans-serif",
      padding: "20px"
    }}>
      <div style={{
        width: 400, background: "#0d1b2e", border: "1px solid #1e3a5f", borderTop: "3px solid #3b9eea",
        borderRadius: 12, padding: "36px 36px 24px", position: "relative"
      }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <img src="/logo-changan.png" alt="Changan" style={{ width: 165, objectFit: "contain" }} />
        </div>

        <div style={{ textAlign: "center", marginBottom: 28, paddingBottom: 20, borderBottom: "1px solid #1e3a5f" }}>
          <div style={{ color: "#3b9eea", fontSize: 11, fontWeight: 700, letterSpacing: 3 }}>FORESIGHT</div>
          <div style={{ color: "#f1f5f9", fontSize: 21, fontWeight: 700, fontFamily: "Georgia, 'Times New Roman', serif", marginTop: 4 }}>
            Foresight Auto Intelligence
          </div>
        </div>

        {!showReset ? (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", color: "#94a3b8", fontSize: 11, fontWeight: 700, letterSpacing: .5, marginBottom: 6 }}>CORREO</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus
                style={{ width: "100%", background: "#0a1830", border: "1px solid #1e3a5f", color: "#f1f5f9", borderRadius: 6, padding: "10px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ marginBottom: 22 }}>
              <label style={{ display: "block", color: "#94a3b8", fontSize: 11, fontWeight: 700, letterSpacing: .5, marginBottom: 6 }}>CONTRASEÑA</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                style={{ width: "100%", background: "#0a1830", border: "1px solid #1e3a5f", color: "#f1f5f9", borderRadius: 6, padding: "10px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }}
              />
            </div>

            {error && (
              <div style={{ background: "#dc262622", border: "1px solid #f87171", borderRadius: 6, padding: "8px 12px", color: "#f87171", fontSize: 12, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              style={{
                width: "100%", background: loading ? "#1e3a5f" : "#3b9eea", color: loading ? "#64748b" : "#0a1628",
                border: "none", borderRadius: 8, padding: "11px 0", fontSize: 13, fontWeight: 700, cursor: loading ? "default" : "pointer"
              }}
            >
              {loading ? "Ingresando…" : "Iniciar sesión"}
            </button>

            <div style={{ textAlign: "center", marginTop: 16 }}>
              <span onClick={() => { setShowReset(true); setError(""); }} style={{ color: "#3b9eea", fontSize: 11.5, cursor: "pointer" }}>
                ¿Olvidaste tu contraseña?
              </span>
            </div>
          </form>
        ) : (
          <div>
            {resetSent ? (
              <div style={{ color: "#4ade80", fontSize: 13, textAlign: "center", padding: "10px 0 20px" }}>
                Te enviamos un correo a <b>{email}</b> con instrucciones para restablecer tu contraseña.
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: "block", color: "#94a3b8", fontSize: 11, fontWeight: 700, letterSpacing: .5, marginBottom: 6 }}>CORREO</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    style={{ width: "100%", background: "#0a1830", border: "1px solid #1e3a5f", color: "#f1f5f9", borderRadius: 6, padding: "10px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                {error && (
                  <div style={{ background: "#dc262622", border: "1px solid #f87171", borderRadius: 6, padding: "8px 12px", color: "#f87171", fontSize: 12, marginBottom: 16 }}>
                    {error}
                  </div>
                )}
                <button
                  onClick={handleReset}
                  style={{ width: "100%", background: "#3b9eea", color: "#0a1628", border: "none", borderRadius: 8, padding: "11px 0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                >
                  Enviar correo de restablecimiento
                </button>
              </>
            )}
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <span onClick={() => { setShowReset(false); setResetSent(false); setError(""); }} style={{ color: "#64748b", fontSize: 11.5, cursor: "pointer" }}>
                ← Volver a iniciar sesión
              </span>
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginTop: 24, paddingTop: 16, borderTop: "1px solid #1e3a5f" }}>
          <img src="/chesa-logo-v3.png" alt="CHESA" style={{ width: 85, objectFit: "contain", opacity: 0.9 }} />
        </div>
      </div>
    </div>
  );
}

function NumInput({ value, onChange, step = 1, min = 0, width = 60, valueColor, disabled }) {
  const [local, setLocal] = useState(String(value ?? 0));
  const [focused, setFocused] = useState(false);
  // Solo sincronizar con el valor externo cuando el campo NO tiene foco
  useEffect(() => {
    if (!focused) setLocal(String(value ?? 0));
  }, [value, focused]);
  return (
    <input
      type="number"
      value={local}
      min={min}
      step={step}
      disabled={disabled}
      onChange={e => setLocal(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        const n = Number(local);
        if (!isNaN(n)) onChange(n);
      }}
      onKeyDown={e => { if (e.key === "Enter") { const n = Number(local); if (!isNaN(n)) onChange(n); } }}
      style={{
        width, background: disabled ? "#0a1830" : "#0d1b2e", border: "1px solid #2a3f5f",
        color: disabled ? "#475569" : (valueColor || "#D4AF37"), borderRadius: 4, padding: "2px 6px",
        fontSize: 13, textAlign: "center", outline: "none", cursor: disabled ? "not-allowed" : "text",
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
function VentasSection({ data, onFieldChange, monthKey }) {
  const mesCap = getMonthLabel(monthKey).toUpperCase();
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
        {renderTable("ventasJunioInterno", `${mesCap} — OBJETIVO INTERNO`)}
        {renderTable("ventasJunioMexico", `${mesCap} — OBJETIVO CHANGAN MX`)}
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

// ── SECCIÓN: Vista Anual (suma de los 12 meses) ───────────────────────────────
// Carga los 12 meses de un año y suma ventasJunioInterno, ventasJunioMexico,
// planesPago y lineasProducto — solo lectura, ya que es un total agregado.
async function buildVistaAnual(anio) {
  const meses = [];
  for (let m = 1; m <= 12; m++) meses.push(`${anio}-${String(m).padStart(2, "0")}`);

  const acumulado = {
    ventasJunioInterno: Object.fromEntries(AGENCIAS.map(a => [a, { facturado: 0, objetivo: 0 }])),
    ventasJunioMexico: Object.fromEntries(AGENCIAS.map(a => [a, { facturado: 0, objetivo: 0 }])),
    planesPago: Object.fromEntries(AGENCIAS.map(a => [a, Object.fromEntries(PLANES.map(p => [p.key, 0]))])),
    lineasProducto: Object.fromEntries(AGENCIAS.map(a => [a, Object.fromEntries(LINEAS_PRODUCTO.map(l => [l.key, 0]))])),
  };
  let mesesConDatos = 0;

  for (const mk of meses) {
    const raw = await fbGet(`datos/${mk}`);
    if (!raw || typeof raw !== "object" || Object.keys(raw).length === 0) continue;
    mesesConDatos++;
    const merged = {};
    Object.keys(initialData).forEach(section => {
      merged[section] = decodeFirebaseData(raw[section], initialData[section]);
    });

    AGENCIAS.forEach(a => {
      acumulado.ventasJunioInterno[a].facturado += merged.ventasJunioInterno?.[a]?.facturado ?? 0;
      acumulado.ventasJunioInterno[a].objetivo  += merged.ventasJunioInterno?.[a]?.objetivo ?? 0;
      acumulado.ventasJunioMexico[a].facturado  += merged.ventasJunioMexico?.[a]?.facturado ?? 0;
      acumulado.ventasJunioMexico[a].objetivo   += merged.ventasJunioMexico?.[a]?.objetivo ?? 0;
      PLANES.forEach(p => { acumulado.planesPago[a][p.key] += merged.planesPago?.[a]?.[p.key] ?? 0; });
      LINEAS_PRODUCTO.forEach(l => { acumulado.lineasProducto[a][l.key] += merged.lineasProducto?.[a]?.[l.key] ?? 0; });
    });
  }

  return { acumulado, mesesConDatos };
}

function VistaAnualSection({ anio }) {
  const [loading, setLoading] = useState(true);
  const [datosAnuales, setDatosAnuales] = useState(null);
  const [mesesConDatos, setMesesConDatos] = useState(0);
  const [agSelPlan, setAgSelPlan] = useState("TOTAL");
  const [agSelLinea, setAgSelLinea] = useState("TOTAL");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { acumulado, mesesConDatos: mcd } = await buildVistaAnual(anio);
      setDatosAnuales(acumulado);
      setMesesConDatos(mcd);
      setLoading(false);
    })();
  }, [anio]);

  if (loading) {
    return (
      <Card>
        <SectionHeader title={`VISTA ANUAL — ${anio}`} icon="🗓️" />
        <div style={{ color: "#64748b", fontSize: 13, textAlign: "center", padding: "30px 0" }}>Sumando los 12 meses de {anio}…</div>
      </Card>
    );
  }

  const totalFact = AGENCIAS.reduce((s, a) => s + datosAnuales.ventasJunioInterno[a].facturado, 0);

  const valoresPlan = PLANES.map(p => ({
    ...p,
    value: agSelPlan === "TOTAL"
      ? AGENCIAS.reduce((s, ag) => s + datosAnuales.planesPago[ag][p.key], 0)
      : datosAnuales.planesPago[agSelPlan][p.key],
  }));
  const totalPlan = valoresPlan.reduce((s, v) => s + v.value, 0);

  const valoresLinea = LINEAS_PRODUCTO.map(l => ({
    ...l,
    value: agSelLinea === "TOTAL"
      ? AGENCIAS.reduce((s, ag) => s + datosAnuales.lineasProducto[ag][l.key], 0)
      : datosAnuales.lineasProducto[agSelLinea][l.key],
  }));
  const totalLinea = valoresLinea.reduce((s, v) => s + v.value, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <SectionHeader title={`VISTA ANUAL — ${anio} (SUMA DE ${mesesConDatos} MESES CON DATOS)`} icon="🗓️" />
        <div style={{ color: "#475569", fontSize: 11.5, marginBottom: 14 }}>
          Esta vista es de solo lectura — es la suma de los meses capturados de {anio}. Para editar un mes específico, selecciónalo arriba en lugar de "Año completo".
        </div>

        <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: .8 }}>VENTAS — TOTAL {anio}</p>
        <div style={{ maxWidth: 400 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color: "#64748b", fontSize: 11 }}>
                <th style={{ textAlign: "left", paddingBottom: 6 }}>AGENCIA</th>
                <th style={{ textAlign: "center" }}>FACTURADO</th>
              </tr>
            </thead>
            <tbody>
              {AGENCIAS.map(ag => (
                <tr key={ag} style={{ borderTop: "1px solid #1e3a5f" }}>
                  <td style={{ padding: "6px 0", color: "#cbd5e1", fontSize: 12 }}>{ag}</td>
                  <td style={{ textAlign: "center", color: "#cbd5e1" }}>{datosAnuales.ventasJunioInterno[ag].facturado}</td>
                </tr>
              ))}
              <tr style={{ borderTop: "2px solid #D4AF3755" }}>
                <td style={{ color: "#D4AF37", fontWeight: 700, padding: "6px 0", fontSize: 12 }}>TOTAL</td>
                <td style={{ textAlign: "center", color: "#D4AF37", fontWeight: 700 }}>{totalFact}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <SectionHeader title={`VENTAS POR TIPO DE PLAN — TOTAL ${anio}`} icon="🥧" />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          {["TOTAL", ...AGENCIAS].map(ag => (
            <button key={ag} onClick={() => setAgSelPlan(ag)} style={{
              background: agSelPlan === ag ? "#D4AF37" : "#0f2239",
              color: agSelPlan === ag ? "#0a1628" : "#94a3b8",
              border: `1px solid ${agSelPlan === ag ? "#D4AF37" : "#1e3a5f"}`,
              borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer"
            }}>{ag}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap", alignItems: "center" }}>
          <PieChart entries={valoresPlan} />
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
                {valoresPlan.map(v => {
                  const p = totalPlan > 0 ? (v.value / totalPlan * 100) : 0;
                  return (
                    <tr key={v.key} style={{ borderTop: "1px solid #1e3a5f" }}>
                      <td style={{ padding: "6px 0" }}>
                        <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: v.color, marginRight: 7 }} />
                        <span style={{ color: "#cbd5e1", fontSize: 12 }}>{v.key}</span>
                      </td>
                      <td style={{ textAlign: "center", color: "#cbd5e1" }}>{v.value}</td>
                      <td style={{ textAlign: "right", color: p > 0 ? "#D4AF37" : "#475569", fontWeight: 700 }}>{p.toFixed(1)}%</td>
                    </tr>
                  );
                })}
                <tr style={{ borderTop: "2px solid #D4AF3755" }}>
                  <td style={{ color: "#D4AF37", fontWeight: 700, padding: "6px 0" }}>TOTAL</td>
                  <td style={{ textAlign: "center", color: "#D4AF37", fontWeight: 700 }}>{totalPlan}</td>
                  <td style={{ textAlign: "right", color: "#D4AF37", fontWeight: 700 }}>100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeader title={`VENTAS POR LÍNEA DE PRODUCTO — TOTAL ${anio}`} icon="🥧" />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          {["TOTAL", ...AGENCIAS].map(ag => (
            <button key={ag} onClick={() => setAgSelLinea(ag)} style={{
              background: agSelLinea === ag ? "#D4AF37" : "#0f2239",
              color: agSelLinea === ag ? "#0a1628" : "#94a3b8",
              border: `1px solid ${agSelLinea === ag ? "#D4AF37" : "#1e3a5f"}`,
              borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer"
            }}>{ag}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap", alignItems: "center" }}>
          <PieChart entries={valoresLinea} />
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
                {valoresLinea.map(v => {
                  const p = totalLinea > 0 ? (v.value / totalLinea * 100) : 0;
                  return (
                    <tr key={v.key} style={{ borderTop: "1px solid #1e3a5f" }}>
                      <td style={{ padding: "6px 0" }}>
                        <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: v.color, marginRight: 7 }} />
                        <span style={{ color: "#cbd5e1", fontSize: 12 }}>{v.key}</span>
                      </td>
                      <td style={{ textAlign: "center", color: "#cbd5e1" }}>{v.value}</td>
                      <td style={{ textAlign: "right", color: p > 0 ? "#D4AF37" : "#475569", fontWeight: 700 }}>{p.toFixed(1)}%</td>
                    </tr>
                  );
                })}
                <tr style={{ borderTop: "2px solid #D4AF3755" }}>
                  <td style={{ color: "#D4AF37", fontWeight: 700, padding: "6px 0" }}>TOTAL</td>
                  <td style={{ textAlign: "center", color: "#D4AF37", fontWeight: 700 }}>{totalLinea}</td>
                  <td style={{ textAlign: "right", color: "#D4AF37", fontWeight: 700 }}>100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
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
          {AGENCIAS.map(ag => {
            const valor = data.auditoria[ag] ?? 0;
            const bajoObjetivo = valor > 0 && valor < 85;
            return (
              <tr key={ag} style={{ borderTop: "1px solid #1e3a5f" }}>
                <td style={{ padding: "6px 0", color: "#cbd5e1", fontSize: 12 }}>{ag}</td>
                <td style={{ textAlign: "center" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <NumInput
                      value={valor}
                      onChange={v => onSimpleChange("auditoria", ag, v)}
                      step={0.1}
                      width={70}
                      valueColor={bajoObjetivo ? "#f87171" : undefined}
                    />
                    <span style={{ color: bajoObjetivo ? "#f87171" : "#64748b", fontSize: 12, fontWeight: bajoObjetivo ? 700 : 400 }}>%</span>
                  </div>
                </td>
              </tr>
            );
          })}
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
function VanVauSection({ data, onFieldChange, onToggleVau, monthKey }) {
  const mesCap = getMonthLabel(monthKey).toUpperCase();
  return (
    <Card>
      <SectionHeader title={`VAN / VAU ${mesCap}`} icon="🚗" />
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 260 }}>
          <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: .8 }}>{`OBJETIVO VAN ${mesCap}`}</p>
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
          <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: .8 }}>{`OBJETIVO VAU ${mesCap}`}</p>
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
function SatisfaccionSection({ data, onFieldChange, monthKey }) {
  const mesCap = getMonthLabel(monthKey).toUpperCase();
  const mesLabelCap = getMonthLabel(monthKey).charAt(0).toUpperCase() + getMonthLabel(monthKey).slice(1);
  return (
    <Card>
      <SectionHeader title="SATISFACCIÓN — SSI / CSI / ISI" icon="⭐" />
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 320 }}>
          <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: .8 }}>{`SSI ${mesCap} (Objetivo aplica a CBD y SSI)`}</p>
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
          <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: .8 }}>{`CSI ${mesCap} (Objetivo aplica a CBD y CSI)`}</p>
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
          <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: .8 }}>{`ISI ${mesLabelCap}`}</p>
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

  const totalVentas = AGENCIAS.reduce((s, ag) => s + (data.msMayo[ag]?.real ?? 0), 0);
  const totalTiv = AGENCIAS.reduce((s, ag) => s + (data.msMayo[ag]?.tiv ?? 0), 0);
  const msTotal = totalTiv > 0 ? (totalVentas / totalTiv) * 100 : 0;

  return (
    <Card>
      <SectionHeader title={`MS — ${tivLabelCap.toUpperCase()}`} icon="📈" />
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ color: "#64748b", fontSize: 11 }}>
            <th style={{ textAlign: "left", paddingBottom: 6 }}>AGENCIA</th>
            <th style={{ textAlign: "center" }}>OBJ MS</th>
            <th style={{ textAlign: "center" }}>VENTAS</th>
            <th style={{ textAlign: "center" }}>TIV</th>
            <th style={{ textAlign: "center" }}>MS</th>
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
          <tr style={{ borderTop: "2px solid #D4AF3755" }}>
            <td style={{ color: "#D4AF37", fontWeight: 700, padding: "6px 0", fontSize: 12 }}>TOTAL CHIAPAS</td>
            <td></td>
            <td style={{ textAlign: "center", color: "#D4AF37", fontWeight: 700 }}>{totalVentas}</td>
            <td style={{ textAlign: "center", color: "#D4AF37", fontWeight: 700 }}>{totalTiv}</td>
            <td style={{ textAlign: "center", color: "#D4AF37", fontWeight: 800 }}>
              {totalTiv > 0 ? `${msTotal.toFixed(1)}%` : "—"}
            </td>
          </tr>
        </tbody>
      </table>
      <div style={{ color: "#475569", fontSize: 11, marginTop: 10, textAlign: "center" }}>
        % Participación total de la marca Changan en Chiapas: ventas totales de las 5 agencias ÷ TIV total del mercado.
      </div>
    </Card>
  );
}

// ── SECCIÓN: Rotación (de personal) ───────────────────────────────────────────
function RotacionSection({ data, onFieldChange }) {
  const totales = AGENCIAS.reduce((acc, ag) => {
    const row = data.rotacion[ag] ?? { plantillaInicial: 0, altas: 0, bajas: 0, objetivo: 2.5 };
    acc.plantillaInicial += row.plantillaInicial;
    acc.altas += row.altas ?? 0;
    acc.bajas += row.bajas;
    return acc;
  }, { plantillaInicial: 0, altas: 0, bajas: 0 });
  const plantillaTotalFinal = totales.plantillaInicial + totales.altas - totales.bajas;

  return (
    <Card>
      <SectionHeader title="ROTACIÓN" icon="👥" />
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ color: "#64748b", fontSize: 11 }}>
            <th style={{ textAlign: "left", paddingBottom: 6 }}>AGENCIA</th>
            <th style={{ textAlign: "center" }}>PLANTILLA INICIAL</th>
            <th style={{ textAlign: "center" }}>ALTAS</th>
            <th style={{ textAlign: "center" }}>BAJAS</th>
            <th style={{ textAlign: "center" }}>PLANTILLA FINAL</th>
            <th style={{ textAlign: "center" }}>% ROTACIÓN</th>
            <th style={{ textAlign: "center" }}>OBJ</th>
            <th style={{ textAlign: "center" }}>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {AGENCIAS.map(ag => {
            const row = data.rotacion[ag] ?? { plantillaInicial: 0, altas: 0, bajas: 0, objetivo: 2.5 };
            const altas = row.altas ?? 0;
            const plantillaFinal = row.plantillaInicial + altas - row.bajas;
            const pctRotacion = row.plantillaInicial > 0 ? (row.bajas / row.plantillaInicial) * 100 : 0;
            // Cumple si el % está dentro del objetivo, O si solo hubo 1 baja (excepción para agencias chicas)
            const ok = (row.plantillaInicial > 0 && pctRotacion <= row.objetivo) || row.bajas <= 1;
            const excepcionAplicada = row.bajas <= 1 && row.plantillaInicial > 0 && pctRotacion > row.objetivo;
            return (
              <tr key={ag} style={{ borderTop: "1px solid #1e3a5f" }}>
                <td style={{ padding: "6px 0", color: "#cbd5e1", fontSize: 12 }}>{ag}</td>
                <td style={{ textAlign: "center" }}>
                  <NumInput value={row.plantillaInicial} onChange={v => onFieldChange("rotacion", ag, "plantillaInicial", v)} width={70} />
                </td>
                <td style={{ textAlign: "center" }}>
                  <NumInput value={altas} onChange={v => onFieldChange("rotacion", ag, "altas", v)} width={60} />
                </td>
                <td style={{ textAlign: "center" }}>
                  <NumInput value={row.bajas} onChange={v => onFieldChange("rotacion", ag, "bajas", v)} width={60} />
                </td>
                <td style={{ textAlign: "center", color: "#94a3b8", fontWeight: 700 }}>
                  {plantillaFinal}
                </td>
                <td style={{ textAlign: "center", color: "#cbd5e1", fontWeight: 700 }}>
                  {row.plantillaInicial > 0 ? `${pctRotacion.toFixed(1)}%` : "—"}
                </td>
                <td style={{ textAlign: "center", color: "#64748b" }}>{row.objetivo}%</td>
                <td style={{ textAlign: "center" }}>
                  <Badge ok={ok} />
                  {excepcionAplicada && (
                    <div style={{ fontSize: 9.5, color: "#60a5fa", marginTop: 3 }}>Excepción: 1 baja</div>
                  )}
                </td>
              </tr>
            );
          })}
          <tr style={{ borderTop: "2px solid #D4AF3755" }}>
            <td style={{ color: "#D4AF37", fontWeight: 700, padding: "6px 0", fontSize: 12 }}>TOTAL</td>
            <td style={{ textAlign: "center", color: "#D4AF37", fontWeight: 700 }}>{totales.plantillaInicial}</td>
            <td style={{ textAlign: "center", color: "#D4AF37", fontWeight: 700 }}>{totales.altas}</td>
            <td style={{ textAlign: "center", color: "#D4AF37", fontWeight: 700 }}>{totales.bajas}</td>
            <td style={{ textAlign: "center", color: "#D4AF37", fontWeight: 800 }}>{plantillaTotalFinal}</td>
            <td colSpan={3}></td>
          </tr>
        </tbody>
      </table>
      <div style={{ color: "#475569", fontSize: 11, marginTop: 12, textAlign: "center" }}>
        % Rotación = Bajas ÷ Plantilla Inicial. Cumple si % ≤ objetivo, o si solo hubo 1 baja en el mes (excepción para agencias pequeñas).
      </div>
    </Card>
  );
}

// ── KPI BAR ───────────────────────────────────────────────────────────────────
function KpiBar({ data, monthKey }) {
  const mesAbrev = MES_NOMBRES[getMonthNumFromKey(monthKey) - 1].slice(0, 3);
  const mesAbrevCap = mesAbrev.charAt(0).toUpperCase() + mesAbrev.slice(1);
  const totalFact   = AGENCIAS.reduce((s, a) => s + (data.ventasJunioInterno[a]?.facturado ?? 0), 0);
  const totalObj    = AGENCIAS.reduce((s, a) => s + (data.ventasJunioInterno[a]?.objetivo  ?? 0), 0);
  const totalFactMx = AGENCIAS.reduce((s, a) => s + (data.ventasJunioMexico[a]?.facturado ?? 0), 0);
  const totalObjMx  = AGENCIAS.reduce((s, a) => s + (data.ventasJunioMexico[a]?.objetivo  ?? 0), 0);
  const avanceV  = pct(totalFact, totalObj);
  const avanceMx = pct(totalFactMx, totalObjMx);

  const ssiAgencias = Object.keys(data.ssi ?? {});
  const ssiVals = ssiAgencias.map(a => data.ssi[a]?.ssi ?? 0).filter(v => v > 0);
  const ssiPromedio = ssiVals.length > 0 ? (ssiVals.reduce((s, v) => s + v, 0) / ssiVals.length) : null;
  const ssiObj = ssiAgencias.length > 0 ? ((data.ssi[ssiAgencias[0]]?.objetivo ?? 0.87) * 100) : 87;

  const csiAgencias = Object.keys(data.csi ?? {});
  const csiVals = csiAgencias.map(a => data.csi[a]?.csi ?? 0).filter(v => v > 0);
  const csiPromedio = csiVals.length > 0 ? (csiVals.reduce((s, v) => s + v, 0) / csiVals.length) : null;
  const csiObj = csiAgencias.length > 0 ? ((data.csi[csiAgencias[0]]?.objetivo ?? 0.87) * 100) : 87;

  const vauOk  = AGENCIAS.filter(a => data.vau[a]).length;
  // Participación de BBVA sobre el TOTAL de ventas del mes.
  // Objetivo estratégico: BBVA ≥ 50% del total.
  const bbvaUnidades = AGENCIAS.reduce((s, a) => s + (data.planesPago[a]?.["BBVA"] ?? 0), 0);
  const ventasTotalPlanes = AGENCIAS.reduce((s, a) => {
    return s + PLANES.reduce((acc, p) => acc + (data.planesPago[a]?.[p.key] ?? 0), 0);
  }, 0);
  const bbvaPct = ventasTotalPlanes > 0 ? (bbvaUnidades / ventasTotalPlanes) * 100 : null;
  const vanReal = AGENCIAS.reduce((s, a) => s + (data.van[a]?.real ?? 0), 0);
  const vanObj  = AGENCIAS.reduce((s, a) => s + (data.van[a]?.objetivo ?? 0), 0);

  // Cada KPI tiene un nivel: "rojo" | "amarillo" | "verde"
  // Se calcula según qué tan lejos está del objetivo, no solo si cumple o no.
  const calcNivel = (avancePct, umbralVerde = 80, umbralAmarillo = 50) => {
    if (avancePct >= umbralVerde) return "verde";
    if (avancePct >= umbralAmarillo) return "amarillo";
    return "rojo";
  };

  const kpis = [
    {
      label: `Ventas ${mesAbrevCap} Interno`,
      value: `${avanceV}%`,
      sub: `${totalFact} de ${totalObj} unidades`,
      nivel: calcNivel(avanceV),
      peso: 10, // peso para ordenar (mayor = más importante)
    },
    {
      label: `Ventas ${mesAbrevCap} Changan MX`,
      value: `${avanceMx}%`,
      sub: `${totalFactMx} de ${totalObjMx} unidades`,
      nivel: calcNivel(avanceMx),
      peso: 9,
    },
    {
      label: "VAU Cumplimiento",
      value: `${vauOk}/${AGENCIAS.length}`,
      sub: `${AGENCIAS.length - vauOk} agencia${AGENCIAS.length - vauOk !== 1 ? "s" : ""} sin cumplir`,
      nivel: vauOk === AGENCIAS.length ? "verde" : vauOk >= 3 ? "amarillo" : "rojo",
      peso: 8,
    },
    {
      label: `BBVA — Participación`,
      value: bbvaPct !== null ? `${bbvaPct.toFixed(0)}%` : "—",
      sub: bbvaPct !== null ? `${bbvaUnidades} de ${ventasTotalPlanes} ventas · obj. 50%` : "sin ventas capturadas",
      // Objetivo 50%: verde si lo alcanza, ámbar si está cerca (40-50%), rojo si por debajo de 40%.
      nivel: bbvaPct === null ? "verde" : bbvaPct >= 50 ? "verde" : bbvaPct >= 40 ? "amarillo" : "rojo",
      peso: 7,
    },
    {
      label: `VAN Total ${mesAbrevCap}`,
      value: vanReal,
      sub: `de ${vanObj} objetivo`,
      nivel: vanObj > 0 ? calcNivel(pct(vanReal, vanObj)) : "verde",
      peso: 6,
    },
    {
      label: "SSI Promedio",
      value: ssiPromedio !== null ? `${ssiPromedio.toFixed(1)}%` : "—",
      sub: `objetivo ${ssiObj}%`,
      nivel: ssiPromedio === null ? "verde" : calcNivel((ssiPromedio / ssiObj) * 100),
      peso: 5,
    },
    {
      label: "CSI Promedio",
      value: csiPromedio !== null ? `${csiPromedio.toFixed(1)}%` : "—",
      sub: `objetivo ${csiObj}%`,
      nivel: csiPromedio === null ? "verde" : calcNivel((csiPromedio / csiObj) * 100),
      peso: 4,
    },
  ];

  // Ordenar: rojo primero (más urgente), luego amarillo, luego verde.
  // Dentro de cada nivel, por peso descendente (más importante primero).
  const nivelOrden = { rojo: 0, amarillo: 1, verde: 2 };
  const kpisOrdenados = [...kpis].sort((a, b) => {
    if (nivelOrden[a.nivel] !== nivelOrden[b.nivel]) return nivelOrden[a.nivel] - nivelOrden[b.nivel];
    return b.peso - a.peso;
  });

  const rojos    = kpis.filter(k => k.nivel === "rojo").length;
  const amarillos = kpis.filter(k => k.nivel === "amarillo").length;
  const verdes   = kpis.filter(k => k.nivel === "verde").length;

  // Color del panel de estado general
  const estadoGeneral = rojos > 0 ? "rojo" : amarillos > 0 ? "amarillo" : "verde";
  const ESTADO = {
    rojo:     { color: "#ef4444", bg: "#7f1d1d22", border: "#ef4444", emoji: "🔴", texto: `${rojos} indicador${rojos !== 1 ? "es" : ""} crítico${rojos !== 1 ? "s" : ""}` },
    amarillo: { color: "#fbbf24", bg: "#78350f22", border: "#fbbf24", emoji: "🟡", texto: `${amarillos} indicador${amarillos !== 1 ? "es" : ""} en atención` },
    verde:    { color: "#4ade80", bg: "#14532d22", border: "#4ade80", emoji: "🟢", texto: "Todos los indicadores en orden" },
  };
  const estado = ESTADO[estadoGeneral];

  const NIV = {
    rojo:     { border: "#ef4444", topBorder: "#ef4444", bg: "#7f1d1d18", valuColor: "#f87171", badgeBg: "#ef444422", badgeColor: "#ef4444", badgeLabel: "CRÍTICO" },
    amarillo: { border: "#fbbf2455", topBorder: "#fbbf24", bg: "#78350f15", valuColor: "#fbbf24", badgeBg: "#fbbf2422", badgeColor: "#fbbf24", badgeLabel: "ATENCIÓN" },
    verde:    { border: "#16a34a55", topBorder: "#4ade80", bg: "transparent", valuColor: "#f1f5f9", badgeBg: "#4ade8022", badgeColor: "#4ade80", badgeLabel: "OK" },
  };

  return (
    <div style={{ marginBottom: 20 }}>
      {/* ── Panel de estado general ───────────────────────────────────────── */}
      <div style={{
        background: estado.bg,
        border: `1px solid ${estado.border}55`,
        borderLeft: `4px solid ${estado.color}`,
        borderRadius: 10,
        padding: "14px 20px",
        marginBottom: 14,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 28 }}>{estado.emoji}</span>
          <div>
            <div style={{ color: estado.color, fontSize: 13, fontWeight: 800, letterSpacing: .5 }}>
              ESTADO OPERATIVO — {getMonthLabel(monthKey).toUpperCase()}
            </div>
            <div style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 900, lineHeight: 1.1, marginTop: 2 }}>
              {estado.texto}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {rojos > 0 && (
            <div style={{ background: "#ef444422", border: "1px solid #ef4444", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
              <div style={{ color: "#ef4444", fontSize: 22, fontWeight: 900, lineHeight: 1 }}>{rojos}</div>
              <div style={{ color: "#ef4444", fontSize: 10, fontWeight: 700, marginTop: 2 }}>CRÍTICO</div>
            </div>
          )}
          {amarillos > 0 && (
            <div style={{ background: "#fbbf2422", border: "1px solid #fbbf24", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
              <div style={{ color: "#fbbf24", fontSize: 22, fontWeight: 900, lineHeight: 1 }}>{amarillos}</div>
              <div style={{ color: "#fbbf24", fontSize: 10, fontWeight: 700, marginTop: 2 }}>ATENCIÓN</div>
            </div>
          )}
          {verdes > 0 && (
            <div style={{ background: "#4ade8022", border: "1px solid #4ade80", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
              <div style={{ color: "#4ade80", fontSize: 22, fontWeight: 900, lineHeight: 1 }}>{verdes}</div>
              <div style={{ color: "#4ade80", fontSize: 10, fontWeight: 700, marginTop: 2 }}>OK</div>
            </div>
          )}
        </div>
      </div>

      {/* ── KPIs ordenados por urgencia ──────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: 10 }}>
        {kpisOrdenados.map((k, i) => {
          const n = NIV[k.nivel];
          const esPrimero = i === 0 && k.nivel === "rojo";
          return (
            <div key={k.label} style={{
              background: n.bg || "#0f2239",
              border: `1px solid ${n.border}`,
              borderTop: `3px solid ${n.topBorder}`,
              borderRadius: 8,
              padding: esPrimero ? "16px 16px" : "12px 14px",
              position: "relative",
              // El indicador más crítico (primero rojo) tiene un leve efecto de pulsación visual
              boxShadow: esPrimero ? `0 0 18px ${n.topBorder}33` : "none",
            }}>
              {/* Badge de nivel */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700, letterSpacing: .8 }}>{k.label}</div>
                <span style={{
                  background: n.badgeBg, color: n.badgeColor,
                  fontSize: 9, fontWeight: 800, padding: "2px 6px",
                  borderRadius: 10, border: `1px solid ${n.badgeColor}55`,
                  letterSpacing: .5, whiteSpace: "nowrap"
                }}>{n.badgeLabel}</span>
              </div>
              <div style={{
                color: n.valuColor,
                fontSize: esPrimero ? 28 : 22,
                fontWeight: 900,
                lineHeight: 1,
                marginBottom: 4,
              }}>{k.value}</div>
              <div style={{ color: "#475569", fontSize: 11 }}>{k.sub}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ── SECCIÓN: Fuentes y Leads (detalle real desde el reporte de la plataforma) ──
const FUENTES_LEADS_PATH = "fuentesLeads"; // fuentesLeads/{monthKey}/{AGENCIA}

// Mapea el texto de "Fuente" tal como viene en el Excel a nuestras claves internas.
function mapearFuenteExcel(fuenteRaw) {
  const f = (fuenteRaw || "").toString().toLowerCase();
  if (f.includes("meta") || f.includes("integracion")) return "metaIntegraciones";
  if (f.includes("marca")) return "marca";
  if (f.includes("piso")) return "piso";
  if (f.includes("form online") || f.includes("form_online") || f.includes("formonline")) return "formOnline";
  if (f.includes("calle") || f.includes("prosp")) return "calle";
  if (f.includes("fb chat") || f.includes("fbchat")) return "fbChat";
  return "otros";
}

// Corrige el encoding roto típico de estos reportes (UTF-8 mal interpretado como Latin-1).
function corregirEncoding(texto) {
  if (!texto || typeof texto !== "string") return texto;
  try {
    // Heurística simple: reemplazo de secuencias mal codificadas más comunes en estos reportes.
    return texto
      .replace(/Ã©/g, "é").replace(/Ã¡/g, "á").replace(/Ã­/g, "í").replace(/Ã³/g, "ó").replace(/Ãº/g, "ú")
      .replace(/Ã±/g, "ñ").replace(/Ã‘/g, "Ñ").replace(/Â¿/g, "¿").replace(/Â¡/g, "¡")
      .replace(/Ã‰/g, "É").replace(/Ã/g, "Í");
  } catch {
    return texto;
  }
}

// Normaliza los valores de SubCampaña: corrige encoding y agrupa variantes similares
function normalizarSubcampania(raw) {
  if (!raw) return "Sin subcampaña";
  const s = raw.toString().trim()
    .replace(/Ã³/g, "ó").replace(/Ã©/g, "é").replace(/Ã¡/g, "á").replace(/Ã\xad/g, "í")
    .replace(/Ãº/g, "ú").replace(/Ã±/g, "ñ").replace(/Ã‰/g, "É").replace(/Ã"/g, "Ó")
    .replace(/ÃƒÂ\x83Ã‚Â/g, "").replace(/ÃƒÂ/g, "").replace(/Ã‚Â/g, "");
  const u = s.toUpperCase().trim();
  // Agrupar variantes de TRÁFICO A PISO
  if (u.includes("TRÁFICO") || u.includes("TRAFICO") || u.includes("TR") && u.includes("PISO")) return "Tráfico a Piso";
  if (u.includes("META")) return "META";
  if (u.includes("REDES SOCIALES") || u.includes("APV")) return "Redes Sociales APV";
  if (u.includes("LLAMADA HOSTESS") || u.includes("HOSTESS")) return "Llamada Hostess";
  if (u.includes("PROSPECCION") || u.includes("PROSPECCIÓN") || u.includes("PROSPECCIONES")) return "Prospecciones";
  if (u.includes("DINÁMICA") || u.includes("DINAMICA") || u.includes("MUNDIAL")) return "Dinámica Mundial";
  if (u.includes("WHATSAPP")) return "WhatsApp Hostess";
  if (u.includes("TIKTOK")) return "TikTok";
  if (u.includes("STAYINTHEGAME")) return "Stay in the Game";
  if (u.includes("CLUB") || u.includes("PADEL")) return "Club Marca";
  if (u.includes("OFERTA") || u.includes("CAMPAÑA") || u.includes("CAMPANA")) return "Oferta/Campaña";
  return s || "Sin subcampaña";
}

function parseFuentesLeadsWorkbook(workbook) {
  const sheetName = workbook.SheetNames[0];
  const ws = workbook.Sheets[sheetName];
  // blankrows:true evita que SheetJS salte filas; sheet_to_json con header:1 puede devolver
  // arreglos de distinta longitud si las últimas celdas de una fila están vacías — por eso
  // normalizamos cada fila a la longitud de los encabezados antes de leer por índice.
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, blankrows: true });
  if (rows.length < 3) return [];

  const headers = rows[1].map(h => corregirEncoding(h));
  const numCols = headers.length;
  const idx = (nombre) => headers.findIndex(h => (h || "").toString().toLowerCase().trim() === nombre.toLowerCase());

  const iFecha = idx("Fecha de Alta");
  const iProducto = idx("Producto");
  const iTemperatura = idx("Temperatura");
  const iAsesor = idx("Asesor");
  const iFuente = idx("Fuente");
  const iEstatus = idx("Estatus");
  const iNombre = idx("Nombre");
  // SubCampaña — col 20 en el Excel de Changan. Buscamos por nombre (con tolerancia a encoding roto)
  const iSubcampania = headers.findIndex(h =>
    (h || "").toString().toLowerCase().replace(/[^a-z]/g, "").includes("subcampa")
  );

  const registros = [];
  for (let r = 2; r < rows.length; r++) {
    let row = rows[r];
    if (!row) continue;
    // Normaliza la longitud de la fila para que row[iFuente] nunca quede fuera de rango
    // por celdas vacías al final que SheetJS recorta.
    if (row.length < numCols) {
      row = [...row, ...Array(numCols - row.length).fill(null)];
    }
    const fuenteCelda = row[iFuente];
    if (fuenteCelda === null || fuenteCelda === undefined || String(fuenteCelda).trim() === "") continue;
    registros.push({
      fecha: iFecha >= 0 ? row[iFecha] : null,
      nombreCliente: iNombre >= 0 ? corregirEncoding(row[iNombre]) : "",
      producto: iProducto >= 0 ? corregirEncoding(row[iProducto]) : "Sin especificar",
      temperatura: iTemperatura >= 0 ? (row[iTemperatura] || "Sin dato") : "Sin dato",
      asesor: iAsesor >= 0 && row[iAsesor] ? corregirEncoding(row[iAsesor]).trim() : "Sin asignar",
      fuenteRaw: fuenteCelda,
      fuente: mapearFuenteExcel(fuenteCelda),
      estatus: iEstatus >= 0 ? (row[iEstatus] || "Sin estatus") : "Sin estatus",
      subcampania: iSubcampania >= 0 && row[iSubcampania]
        ? normalizarSubcampania(corregirEncoding(row[iSubcampania]))
        : "Sin subcampaña",
    });
  }
  return registros;
}

// Agrega los registros individuales en los totales que necesita el dashboard.
function agregarFuentesLeads(registros) {
  const porFuente = {};
  FUENTES_LEAD.forEach(f => { porFuente[f.key] = 0; });
  porFuente.otros = 0;

  const porEstatus = {};
  const porTemperatura = {};
  const porProducto = {};
  const porAsesor = {};
  const porSubcampania = {};

  registros.forEach(r => {
    porFuente[r.fuente] = (porFuente[r.fuente] ?? 0) + 1;
    porEstatus[r.estatus] = (porEstatus[r.estatus] ?? 0) + 1;
    porTemperatura[r.temperatura] = (porTemperatura[r.temperatura] ?? 0) + 1;
    porProducto[r.producto] = (porProducto[r.producto] ?? 0) + 1;
    if (r.subcampania && r.subcampania !== "Sin subcampaña") {
      porSubcampania[r.subcampania] = (porSubcampania[r.subcampania] ?? 0) + 1;
    }
    if (!porAsesor[r.asesor]) porAsesor[r.asesor] = {};
    porAsesor[r.asesor][r.fuente] = (porAsesor[r.asesor][r.fuente] ?? 0) + 1;
  });

  return {
    total: registros.length,
    porFuente, porEstatus, porTemperatura, porProducto, porAsesor, porSubcampania,
    registros,
  };
}

// Funnel visual: barras horizontales decrecientes mostrando el resultado real de cada etapa,
// el objetivo esperado (línea de referencia), y el % de paso entre etapas consecutivas.
// Embudo visual real: trapecios apilados que se van angostando según el valor de cada etapa.
// Misma paleta usada en las gráficas de pastel (Distribución por Fuente, Top Productos, etc.)
const PALETA_FUNNEL = ["#3b9eea", "#D4AF37", "#4ade80", "#c084fc", "#fb923c", "#f472b6", "#60a5fa", "#fbbf24"];

function FunnelEtapas({ etapasData }) {
  // Ancho de cada trapecio = valor / leads_total (Leads siempre = 100%).
  // El texto y % de paso se mantienen igual que antes.

  const widthSvg = 640;
  const stepHeight = 60;
  const gap = 5;
  const totalHeight = etapasData.length * (stepHeight + gap) - gap;
  const minFrac = 0.08; // mínimo visible aunque el valor sea 0

  const leadsTotal = etapasData[0]?.valor ?? 1;

  const fracPara = (valor) => {
    if (leadsTotal <= 0) return minFrac;
    return Math.max((valor ?? 0) / leadsTotal, minFrac);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width="100%" viewBox={`0 0 ${widthSvg} ${totalHeight}`} style={{ maxWidth: widthSvg }}>
        {etapasData.map((e, i) => {
          const fracTop    = fracPara(e.valor);
          const fracBottom = i < etapasData.length - 1 ? fracPara(etapasData[i + 1].valor) : fracPara(e.valor) * 0.92;
          const yTop    = i * (stepHeight + gap);
          const yBottom = yTop + stepHeight;
          const topWidth    = widthSvg * fracTop;
          const bottomWidth = widthSvg * fracBottom;
          const xTopLeft    = (widthSvg - topWidth) / 2;
          const xTopRight   = xTopLeft + topWidth;
          const xBottomLeft  = (widthSvg - bottomWidth) / 2;
          const xBottomRight = xBottomLeft + bottomWidth;
          const pasoPct = i > 0 && (etapasData[i - 1].valor ?? 0) > 0
            ? ((e.valor ?? 0) / etapasData[i - 1].valor * 100)
            : null;
          const cumple = pasoPct !== null && e.objetivoPct !== null
            ? pasoPct >= e.objetivoPct
            : null;
          const color = PALETA_FUNNEL[i % PALETA_FUNNEL.length];
          return (
            <g key={e.label}>
              <polygon
                points={`${xTopLeft},${yTop} ${xTopRight},${yTop} ${xBottomRight},${yBottom} ${xBottomLeft},${yBottom}`}
                fill={color}
                fillOpacity="0.88"
                stroke={color}
                strokeWidth="1"
              />
              <text x={widthSvg / 2} y={yTop + stepHeight / 2 - 7}
                textAnchor="middle" fontSize="12" fontWeight="700" fill="#f1f5f9">
                {e.label}
              </text>
              <text x={widthSvg / 2} y={yTop + stepHeight / 2 + 13}
                textAnchor="middle" fontSize="14" fontWeight="800" fill="#f1f5f9">
                {e.valor}
                {pasoPct !== null && (
                  <tspan
                    fontSize="11"
                    fontWeight="700"
                    fill={cumple ? "#86efac" : "#ff4444"}
                  >
                    {" "}· {pasoPct.toFixed(0)}%{e.objetivoPct !== null ? ` / obj. ${e.objetivoPct}%` : ""}
                  </tspan>
                )}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function PieChartLeyenda({ datos, colores, size = 170, prevDatos = null }) {
  // datos: [{ label, value }]
  // prevDatos: { label: value } — mapa del mes anterior para mostrar variación inline
  const entries = datos.map((d, i) => ({ ...d, color: colores[i % colores.length] }));
  const total = entries.reduce((s, e) => s + e.value, 0);
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
      <PieChart entries={entries} size={size} />
      <div style={{ flex: 1, minWidth: 180 }}>
        {entries.filter(e => e.value > 0).sort((a, b) => b.value - a.value).map(e => {
          const pct = total > 0 ? (e.value / total * 100) : 0;
          const ant = prevDatos?.[e.label];
          let varEl = null;
          if (ant != null && ant > 0) {
            const diff = ((e.value - ant) / ant * 100);
            const color = diff > 0 ? "#4ade80" : diff < 0 ? "#ff4444" : "#64748b";
            varEl = (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 8,
                background: `${color}22`, color, border: `1px solid ${color}44`,
                whiteSpace: "nowrap", marginLeft: 4,
              }}>
                {diff > 0 ? "+" : ""}{diff.toFixed(0)}%
              </span>
            );
          }
          return (
            <div key={e.label} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, fontSize: 12 }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: e.color, flexShrink: 0 }} />
              <span style={{ color: "#cbd5e1", flex: 1 }}>{e.label}</span>
              <span style={{ color: "#94a3b8", fontWeight: 700 }}>{e.value}</span>
              <span style={{ color: "#64748b", fontSize: 11, minWidth: 38, textAlign: "right" }}>{pct.toFixed(0)}%</span>
              {varEl}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const COLORES_ESTATUS = { "Sin Atender": "#f87171", "Asignado": "#fbbf24", "Contactado": "#60a5fa", "Finalizado": "#4ade80", "Abandonados": "#94a3b8", "1 Ventas": "#34d399", "2 Ventas": "#10b981" };
const COLORES_TEMPERATURA = { "Caliente": "#f87171", "Tibio": "#fbbf24", "Frio": "#60a5fa", "Sin dato": "#475569" };

function FunnelSection({ monthKey, funnelData, onFunnelFieldChange, saveStatus }) {
  const [agenciaSel, setAgenciaSel] = useState(AGENCIAS[0]);
  const [fuentesSel, setFuentesSel] = useState(FUENTES_LEAD.map(f => f.key)); // todas activas por defecto
  const [datosPorAgencia, setDatosPorAgencia] = useState({});
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState("");
  const [loadingDatos, setLoadingDatos] = useState(true);
  const fileInputRef = useRef(null);

  const toggleFuente = (key) => {
    setFuentesSel(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const [datosPorAgenciaMesAnterior, setDatosPorAgenciaMesAnterior] = useState({});
  const [prevMonthKey, setPrevMonthKey] = useState("");

  useEffect(() => {
    (async () => {
      setLoadingDatos(true);
      const prevKey = getPreviousMonthKey(monthKey);
      setPrevMonthKey(prevKey);
      const [raw, rawPrev] = await Promise.all([
        fbGet(`${FUENTES_LEADS_PATH}/${monthKey}`),
        fbGet(`${FUENTES_LEADS_PATH}/${prevKey}`),
      ]);
      // Firebase guarda con claves encodeadas (encodeKey) — remapear a nombres originales
      const remapAgencias = (obj) => {
        if (!obj || typeof obj !== "object") return {};
        const result = {};
        AGENCIAS.forEach(ag => {
          const encoded = encodeKey(ag);
          // Buscar tanto por nombre original como por nombre encodeado
          result[ag] = obj[ag] ?? obj[encoded] ?? null;
        });
        return result;
      };
      setDatosPorAgencia(remapAgencias(raw));
      setDatosPorAgenciaMesAnterior(remapAgencias(rawPrev));
      setLoadingDatos(false);
    })();
  }, [monthKey]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCargando(true);
    setErrorCarga("");
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const registros = parseFuentesLeadsWorkbook(wb);
      if (registros.length === 0) {
        setErrorCarga("No se encontraron leads en este archivo. Verifica que sea el reporte correcto.");
        setCargando(false);
        return;
      }
      const agregado = agregarFuentesLeads(registros);
      const limpiarClaves = (obj) => {
        const limpio = {};
        Object.entries(obj ?? {}).forEach(([k, v]) => {
          const c = String(k).replace(/[.$#[\]/+\s]/g, "_").replace(/_+/g,"_").trim() || "x";
          limpio[c] = (limpio[c] ?? 0) + (Number(v) || 0);
        });
        return limpio;
      };
      // Guardamos solo lo necesario para las gráficas — sin porAsesor (muy complejo) ni registros (muy grande)
      const paraFirebase = {
        total: Number(agregado.total) || 0,
        porFuente: limpiarClaves(agregado.porFuente),
        porEstatus: limpiarClaves(agregado.porEstatus),
        porTemperatura: limpiarClaves(agregado.porTemperatura),
        porProducto: limpiarClaves(agregado.porProducto),
        porSubcampania: limpiarClaves(agregado.porSubcampania),
      };
      await fbSet(`${FUENTES_LEADS_PATH}/${monthKey}/${encodeKey(agenciaSel)}`, paraFirebase);
      setDatosPorAgencia(prev => ({ ...prev, [agenciaSel]: { ...paraFirebase, registros, porAsesor: agregado.porAsesor } }));
      // El total de leads del reporte alimenta automáticamente la primera etapa del Funnel.
      if (onFunnelFieldChange) {
        onFunnelFieldChange(agenciaSel, "leads", agregado.total);
        // "Asignado" en el reporte = leads ya asignados formalmente a un asesor
        const asignadosDelReporte = agregado.porEstatus["Asignado"] ?? 0;
        if (asignadosDelReporte > 0) onFunnelFieldChange(agenciaSel, "asignados", asignadosDelReporte);
      }
    } catch (err) {
      setErrorCarga("No se pudo leer el archivo. Verifica que sea un Excel válido del reporte de Fuentes.");
    } finally {
      setCargando(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const todosLosRegistros = (() => {
    if (agenciaSel !== "TODAS") return datosPorAgencia[agenciaSel]?.registros ?? [];
    const agenciasConDatos = AGENCIAS.filter(ag => datosPorAgencia[ag]);
    return agenciasConDatos.flatMap(ag => (datosPorAgencia[ag]?.registros ?? []).map(r => ({ ...r, _agencia: ag })));
  })();

  // Si no hay registros individuales (cargado desde Firebase sin registros),
  // construimos datos directamente desde los agregados guardados
  const datosDesdeAgregados = (() => {
    const todasLasAg = agenciaSel === "TODAS" ? AGENCIAS : [agenciaSel];
    const hayAgregados = todasLasAg.some(ag => datosPorAgencia[ag]?.porFuente);
    if (!hayAgregados) return null;
    // Combinar los agregados de las agencias seleccionadas
    const merged = {
      total: 0, porFuente: {}, porEstatus: {}, porTemperatura: {},
      porProducto: {}, porAsesor: {}, porSubcampania: {}, registros: []
    };
    todasLasAg.forEach(ag => {
      const d = datosPorAgencia[ag];
      if (!d) return;
      merged.total += d.total ?? 0;
      ['porFuente','porEstatus','porTemperatura','porProducto','porSubcampania'].forEach(key => {
        Object.entries(d[key] ?? {}).forEach(([k,v]) => {
          merged[key][k] = (merged[key][k] ?? 0) + v;
        });
      });
    });
    return merged;
  })();

  const todasFuentesSeleccionadas = fuentesSel.length === FUENTES_LEAD.length;
  const registrosFiltrados = todasFuentesSeleccionadas
    ? todosLosRegistros
    : todosLosRegistros.filter(r => fuentesSel.includes(r.fuente));

  const datos = (() => {
    // Si hay registros en memoria, recalcular desde ellos (más preciso, filtra por fuente)
    if (registrosFiltrados.length > 0) {
      const agregado = agregarFuentesLeads(registrosFiltrados);
      // Rescatar porSubcampania guardado si el recálculo lo pierde
      if (Object.keys(agregado.porSubcampania).length === 0) {
        const todasLasAg = agenciaSel === "TODAS" ? AGENCIAS : [agenciaSel];
        const subcampMerged = {};
        todasLasAg.forEach(ag => {
          Object.entries(datosPorAgencia[ag]?.porSubcampania ?? {}).forEach(([k,v]) => {
            subcampMerged[k] = (subcampMerged[k] ?? 0) + v;
          });
        });
        if (Object.keys(subcampMerged).length > 0) agregado.porSubcampania = subcampMerged;
      }
      return agregado;
    }
    // Si no hay registros (cargado desde Firebase sin el array), usar los agregados directos
    if (datosDesdeAgregados && datosDesdeAgregados.total > 0) return datosDesdeAgregados;
    return null;
  })();

  // Consolidado mes anterior para comparación
  const datosPrev = (() => {
    const todasLasAg = agenciaSel === "TODAS" ? AGENCIAS : [agenciaSel];
    // Intentar desde registros individuales primero
    const registrosPrev = [];
    todasLasAg.forEach(ag => {
      const raw = datosPorAgenciaMesAnterior[ag];
      if (raw?.registros && Array.isArray(raw.registros)) registrosPrev.push(...raw.registros);
      else if (raw && Array.isArray(raw)) registrosPrev.push(...raw);
    });
    if (registrosPrev.length > 0) return agregarFuentesLeads(registrosPrev);
    // Fallback: usar agregados guardados directamente
    const merged = { total: 0, porFuente: {}, porEstatus: {}, porTemperatura: {}, porProducto: {}, porSubcampania: {} };
    let tieneAlgo = false;
    todasLasAg.forEach(ag => {
      const d = datosPorAgenciaMesAnterior[ag];
      if (!d) return;
      tieneAlgo = true;
      merged.total += d.total ?? 0;
      ['porFuente','porEstatus','porTemperatura','porProducto','porSubcampania'].forEach(key => {
        Object.entries(d[key] ?? {}).forEach(([k,v]) => { merged[key][k] = (merged[key][k] ?? 0) + v; });
      });
    });
    return tieneAlgo ? merged : null;
  })();

  // Helper: variación % vs mes anterior con badge visual
  const varBadge = (actual, anterior) => {
    if (anterior == null || anterior === 0) return null;
    const diff = ((actual - anterior) / anterior * 100);
    const color = diff > 0 ? "#4ade80" : diff < 0 ? "#ff4444" : "#64748b";
    const texto = `${diff > 0 ? "+" : ""}${diff.toFixed(0)}% vs mes ant.`;
    return (
      <span style={{
        fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10,
        background: `${color}22`, color, border: `1px solid ${color}55`,
        marginLeft: 8, whiteSpace: "nowrap",
      }}>{texto}</span>
    );
  };

  const datosFuentePie = datos ? FUENTES_LEAD.map(f => ({ label: f.label, value: datos.porFuente[f.key] ?? 0 })) : [];
  const coloresFuente = FUENTES_LEAD.map(f => f.color);

  const datosEstatusPie = datos ? Object.entries(datos.porEstatus).map(([label, value]) => ({ label, value })) : [];
  const coloresEstatus = datosEstatusPie.map(d => COLORES_ESTATUS[d.label] || "#64748b");

  const datosTemperaturaPie = datos ? Object.entries(datos.porTemperatura).map(([label, value]) => ({ label, value })) : [];
  const coloresTemperatura = datosTemperaturaPie.map(d => COLORES_TEMPERATURA[d.label] || "#64748b");

  // Top Productos: mostramos los 7 más frecuentes + "Otros" con el resto,
  // así el total del pastel siempre cuadra con el total real de leads del reporte.
  const datosProductoPie = (() => {
    if (!datos) return [];
    const sorted = Object.entries(datos.porProducto).sort((a, b) => b[1] - a[1]);
    const top7 = sorted.slice(0, 7).map(([label, value]) => ({ label, value }));
    const otrosTotal = sorted.slice(7).reduce((s, [, v]) => s + v, 0);
    if (otrosTotal > 0) top7.push({ label: "Otros", value: otrosTotal });
    return top7;
  })();
  const coloresProducto = ["#3b9eea", "#D4AF37", "#4ade80", "#c084fc", "#fb923c", "#f472b6", "#60a5fa", "#fbbf24"];

  const ventasTotal = datos ? ((datos.porEstatus["1 Ventas"] ?? 0) + (datos.porEstatus["2 Ventas"] ?? 0)) : 0;
  const tasaCierre = datos && datos.total > 0 ? (ventasTotal / datos.total * 100) : null;

  // ── Funnel manual por agencia ────────────────────────────────────────────
  const agenciasFunnel = agenciaSel === "TODAS" ? AGENCIAS : [agenciaSel];
  const funnelConsolidado = funnelAgenciaBlank();
  agenciasFunnel.forEach(ag => {
    const row = funnelData[ag] ?? funnelAgenciaBlank();
    ETAPAS_FUNNEL.forEach(et => { funnelConsolidado[et.key] += row[et.key] ?? 0; });
  });

  // Leads: si hay fuentes filtradas usamos el total del reporte filtrado (datos.total),
  // que ya está calculado solo con los registros de las fuentes seleccionadas.
  // Si no hay reporte cargado, caemos al total guardado en Firebase.
  const leadsParaFunnel = (!todasFuentesSeleccionadas && datos)
    ? datos.total
    : funnelConsolidado.leads;

  const etapasData = ETAPAS_FUNNEL.map(et => ({
    label: et.label,
    valor: et.key === "leads" ? leadsParaFunnel : funnelConsolidado[et.key],
    objetivoPct: et.objetivo !== null ? Math.round(et.objetivo * 100) : null,
  }));
  const tasaCierreFunnel = leadsParaFunnel > 0 ? (funnelConsolidado.ventas / leadsParaFunnel * 100) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <SectionHeader title={`FUNNEL — ${getMonthLabel(monthKey).toUpperCase()}`} icon="🪜" />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <button onClick={() => setAgenciaSel("TODAS")} style={{
            background: agenciaSel === "TODAS" ? "#D4AF37" : "#0f2239",
            color: agenciaSel === "TODAS" ? "#0a1628" : "#94a3b8",
            border: `1px solid ${agenciaSel === "TODAS" ? "#D4AF37" : "#1e3a5f"}`,
            borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer"
          }}>
            🌐 TODAS LAS AGENCIAS {AGENCIAS.filter(ag => datosPorAgencia[ag]).length > 0
              ? `(${AGENCIAS.reduce((s, ag) => s + (datosPorAgencia[ag]?.total ?? 0), 0)})`
              : ""}
          </button>
          {AGENCIAS.map(ag => (
            <button key={ag} onClick={() => setAgenciaSel(ag)} style={{
              background: agenciaSel === ag ? "#3b9eea" : "#0f2239",
              color: agenciaSel === ag ? "#0a1628" : "#94a3b8",
              border: `1px solid ${agenciaSel === ag ? "#3b9eea" : "#1e3a5f"}`,
              borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer"
            }}>{ag}{datosPorAgencia[ag] ? ` (${datosPorAgencia[ag].total})` : ""}</button>
          ))}
        </div>

        {agenciaSel !== "TODAS" && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFile} style={{ display: "none" }} id="file-fuentes-leads" />
            <label htmlFor="file-fuentes-leads" style={{
              background: cargando ? "#1e3a5f" : "#D4AF37", color: cargando ? "#64748b" : "#0a1628",
              border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 12.5, fontWeight: 700,
              cursor: cargando ? "default" : "pointer", display: "inline-block"
            }}>
              {cargando ? "Procesando…" : `📤 Subir reporte de ${agenciaSel} (.xlsx)`}
            </label>
            <span style={{ color: "#64748b", fontSize: 11.5 }}>
              Reporte de Fuentes de la plataforma — alimenta automáticamente el total de Leads del Funnel.
            </span>
          </div>
        )}
        {agenciaSel === "TODAS" && (
          <div style={{ color: "#3b9eea", fontSize: 11.5, marginBottom: 16, background: "#3b9eea11", border: "1px solid #3b9eea33", borderRadius: 6, padding: "6px 10px" }}>
            Vista global — suma de las 5 agencias. Para cargar un archivo o capturar el Funnel, selecciona la agencia específica.
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: .8 }}>FUENTES (selecciona una o varias — filtra las gráficas de abajo)</p>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {FUENTES_LEAD.map(f => (
              <label key={f.key} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: fuentesSel.includes(f.key) ? "#f1f5f9" : "#64748b", fontSize: 12.5 }}>
                <input type="checkbox" checked={fuentesSel.includes(f.key)} onChange={() => toggleFuente(f.key)} />
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: f.color, display: "inline-block" }} />
                {f.label}
              </label>
            ))}
          </div>
          {fuentesSel.length === 0 && (
            <div style={{ color: "#f87171", fontSize: 11.5, marginTop: 6 }}>Selecciona al menos una fuente para ver resultados.</div>
          )}
        </div>

        {errorCarga && (
          <div style={{ background: "#dc262622", border: "1px solid #f87171", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 13, marginBottom: 14 }}>
            {errorCarga}
          </div>
        )}

        {loadingDatos ? (
          <div style={{ color: "#64748b", fontSize: 13, textAlign: "center", padding: "20px 0" }}>Cargando…</div>
        ) : !datos ? (
          <div style={{ color: "#475569", fontSize: 12.5, textAlign: "center", padding: "30px 0" }}>
            Todavía no se ha cargado el reporte de {agenciaSel} para {getMonthLabel(monthKey)}.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
            <div style={{ background: "#0f2239", border: "1px solid #1e3a5f", borderTop: "3px solid #D4AF37", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700, letterSpacing: .8 }}>TOTAL LEADS{!todasFuentesSeleccionadas ? " (FILTRADO)" : ""}</div>
              <div style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 800 }}>{datos.total}</div>
            </div>
            <div style={{ background: "#0f2239", border: "1px solid #1e3a5f", borderTop: "3px solid #4ade80", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700, letterSpacing: .8 }}>VENTAS CERRADAS (FUNNEL)</div>
              <div style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 800 }}>{funnelConsolidado.ventas}</div>
            </div>
            <div style={{ background: "#0f2239", border: "1px solid #1e3a5f", borderTop: "3px solid #60a5fa", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700, letterSpacing: .8 }}>TASA DE CIERRE (FUNNEL)</div>
              <div style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 800 }}>{funnelConsolidado.leads > 0 ? `${(funnelConsolidado.ventas / funnelConsolidado.leads * 100).toFixed(1)}%` : "—"}</div>
            </div>
            <div style={{ background: "#0f2239", border: "1px solid #1e3a5f", borderTop: "3px solid #f87171", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700, letterSpacing: .8 }}>SIN ATENDER</div>
              <div style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 800 }}>{datos.porEstatus["Sin Atender"] ?? 0}</div>
            </div>
          </div>
        )}
      </Card>

      {datos && (
        <>
          {/* Aviso si no hay datos del mes anterior para comparar */}
          {!datosPrev && prevMonthKey && (
            <div style={{ background: "#3b9eea11", border: "1px solid #3b9eea33", borderRadius: 8, padding: "10px 14px", color: "#64748b", fontSize: 12 }}>
              💡 No hay reporte de <b style={{ color: "#3b9eea" }}>{getMonthLabel(prevMonthKey)}</b> cargado — sube el Excel de ese mes para ver las variaciones.
            </div>
          )}
          <Card>
            <SectionHeader title="DISTRIBUCIÓN POR FUENTE" icon="🥧" />
            <PieChartLeyenda
              datos={datosFuentePie}
              colores={coloresFuente}
              prevDatos={datosPrev ? Object.fromEntries(FUENTES_LEAD.map(f => [f.label, datosPrev.porFuente[f.key] ?? 0])) : null}
            />
          </Card>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 320 }}>
              <Card>
                <SectionHeader title="EMBUDO POR ESTATUS (REPORTE)" icon="🥧" />
                <PieChartLeyenda
                  datos={datosEstatusPie}
                  colores={coloresEstatus}
                  size={150}
                  prevDatos={datosPrev ? datosPrev.porEstatus : null}
                />
              </Card>
            </div>
            <div style={{ flex: 1, minWidth: 320 }}>
              <Card>
                <SectionHeader title="TEMPERATURA DEL LEAD" icon="🥧" />
                <PieChartLeyenda
                  datos={datosTemperaturaPie}
                  colores={coloresTemperatura}
                  size={150}
                  prevDatos={datosPrev ? datosPrev.porTemperatura : null}
                />
              </Card>
            </div>
          </div>

          <Card>
            <SectionHeader title="TOP PRODUCTOS DE INTERÉS" icon="🥧" />
            <PieChartLeyenda
              datos={datosProductoPie}
              colores={coloresProducto}
              prevDatos={datosPrev ? datosPrev.porProducto : null}
            />
          </Card>

          {/* ── Subcampaña ──────────────────────────────────────────────────── */}
          {datos.porSubcampania && Object.keys(datos.porSubcampania).length > 0 && (() => {
            const subcampPie = Object.entries(datos.porSubcampania)
              .sort((a, b) => b[1] - a[1])
              .map(([label, value]) => ({ label, value }));
            const coloresSub = ["#3b9eea","#D4AF37","#4ade80","#c084fc","#fb923c","#f472b6","#60a5fa","#fbbf24","#94a3b8","#34d399"];
            return (
              <Card>
                <SectionHeader title="DISTRIBUCIÓN POR SUBCAMPAÑA" icon="🎯" />
                <PieChartLeyenda
                  datos={subcampPie}
                  colores={coloresSub}
                  prevDatos={datosPrev?.porSubcampania ?? null}
                />
              </Card>
            );
          })()}
        </>
      )}

      {/* ── Captura manual del Funnel de Ventas ──────────────────────────────── */}
      <Card>
        <SectionHeader title={`CAPTURA DEL FUNNEL — ${agenciaSel === "TODAS" ? "TODAS LAS AGENCIAS" : agenciaSel}`} icon="✍️" />
        {saveStatus && (
          <div style={{
            background: saveStatus === "guardado" ? "#14532d" : saveStatus === "error" ? "#7f1d1d" : "#1e3a5f",
            border: `1px solid ${saveStatus === "guardado" ? "#4ade80" : saveStatus === "error" ? "#ef4444" : "#fbbf24"}`,
            borderRadius: 8, padding: "10px 16px", marginBottom: 14,
            color: saveStatus === "guardado" ? "#4ade80" : saveStatus === "error" ? "#ef4444" : "#fbbf24",
            fontSize: 13, fontWeight: 700,
          }}>
            {saveStatus === "guardando" && `⏳ Guardando datos de ${getMonthLabel(monthKey)}…`}
            {saveStatus === "guardado" && `✅ Datos guardados correctamente en ${getMonthLabel(monthKey)}`}
            {saveStatus === "error" && "❌ Error al guardar. Verifica tu conexión e intenta de nuevo."}
          </div>
        )}
        {agenciaSel === "TODAS" ? (
          <div style={{ color: "#475569", fontSize: 12.5, textAlign: "center", padding: "10px 0 18px" }}>
            Selecciona una agencia específica arriba para capturar sus valores del Funnel.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
            {ETAPAS_FUNNEL.map(et => (
              <div key={et.key} style={{ background: "#0f2239", border: "1px solid #1e3a5f", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ color: "#64748b", fontSize: 10.5, fontWeight: 700, letterSpacing: .6, marginBottom: 6 }}>
                  {et.label.toUpperCase()}{et.key === "leads" ? (todasFuentesSeleccionadas ? " (auto)" : " (filtrado)") : ""}
                </div>
                <NumInput
                  value={et.key === "leads" ? leadsParaFunnel : (funnelData[agenciaSel] ?? funnelAgenciaBlank())[et.key]}
                  onChange={v => {
                    if (onFunnelFieldChange) onFunnelFieldChange(agenciaSel, et.key, v);
                  }}
                  width={70}
                  disabled={et.key === "leads"}
                />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Embudo visual + cuadro de Asignados ──────────────────────────────── */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 300 }}>
          <Card>
            <SectionHeader title={`EMBUDO DE VENTAS — ${agenciaSel === "TODAS" ? "TODAS LAS AGENCIAS" : agenciaSel}`} icon="🪜" />
            <FunnelEtapas etapasData={etapasData} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 12, borderTop: "1px solid #1e3a5f" }}>
              <span style={{ color: "#94a3b8", fontSize: 11.5 }}>Tasa de cierre global (Ventas ÷ Leads)</span>
              <span style={{ color: "#D4AF37", fontSize: 16, fontWeight: 800 }}>{tasaCierreFunnel !== null ? `${tasaCierreFunnel.toFixed(1)}%` : "—"}</span>
            </div>
          </Card>
        </div>

        <div style={{ width: 220, flexShrink: 0 }}>
          <Card>
            <SectionHeader title="ASIGNADOS" icon="📋" />
            <div style={{ color: "#64748b", fontSize: 11.5, marginBottom: 14, lineHeight: 1.5 }}>
              Leads formalmente asignados a un asesor. Captura manual por agencia.
            </div>
            {agenciaSel === "TODAS" ? (
              <>
                {AGENCIAS.map(ag => (
                  <div key={ag} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ color: "#94a3b8", fontSize: 12 }}>{ag}</span>
                    <NumInput
                      value={(funnelData[ag] ?? funnelAgenciaBlank()).asignados}
                      onChange={v => onFunnelFieldChange(ag, "asignados", v)}
                      width={65}
                    />
                  </div>
                ))}
                <div style={{ borderTop: "1px solid #1e3a5f", paddingTop: 8, marginTop: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#D4AF37", fontSize: 12, fontWeight: 700 }}>TOTAL</span>
                  <span style={{ color: "#D4AF37", fontSize: 16, fontWeight: 800 }}>
                    {AGENCIAS.reduce((s, ag) => s + ((funnelData[ag] ?? funnelAgenciaBlank()).asignados), 0)}
                  </span>
                </div>
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, paddingTop: 8 }}>
                <NumInput
                  value={(funnelData[agenciaSel] ?? funnelAgenciaBlank()).asignados}
                  onChange={v => onFunnelFieldChange(agenciaSel, "asignados", v)}
                  width={80}
                />
                <div style={{ color: "#64748b", fontSize: 11 }}>
                  {funnelConsolidado.leads > 0
                    ? `${((((funnelData[agenciaSel] ?? funnelAgenciaBlank()).asignados) / leadsParaFunnel) * 100).toFixed(0)}% de leads asignados`
                    : "—"}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}


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
    const altas = r.altas ?? 0;
    const plantillaFinal = (r.plantillaInicial ?? 0) + altas - (r.bajas ?? 0);
    const pctRot = r.plantillaInicial > 0 ? ((r.bajas / r.plantillaInicial) * 100).toFixed(1) : "N/D";
    lineas.push(`${ag}: plantilla inicial ${r.plantillaInicial ?? 0}, altas ${altas}, bajas ${r.bajas ?? 0}, plantilla final ${plantillaFinal} → rotación ${pctRot}% (objetivo ≤ ${r.objetivo ?? 0}%, con excepción de cumplimiento si solo hubo 1 baja)`);
  });

  lineas.push("\n--- VAN / VAU ---");
  AGENCIAS.forEach(ag => {
    const v = data.van[ag] ?? {};
    lineas.push(`${ag}: VAN real ${v.real ?? 0} / objetivo ${v.objetivo ?? 0} · VAU: ${data.vau[ag] ? "Cumple" : "No cumple"}`);
  });

  return lineas.join("\n");
}

function buildResumenFunnelParaIA(funnelData) {
  const lineas = [];
  lineas.push("\n--- FUNNEL DE VENTAS (por agencia, acumulado del mes) ---");
  AGENCIAS.forEach(ag => {
    const f = funnelData[ag] ?? funnelAgenciaBlank();
    const pct = (num, den) => den > 0 ? ((num / den) * 100).toFixed(0) : "N/D";
    lineas.push(`${ag}: leads ${f.leads}, contactados ${f.contactados} (${pct(f.contactados, f.leads)}%), citas agendadas ${f.citasAgendadas} (${pct(f.citasAgendadas, f.contactados)}%), citas asistidas ${f.citasAsistidas} (${pct(f.citasAsistidas, f.citasAgendadas)}%), demos agendadas ${f.demosAgendadas} (${pct(f.demosAgendadas, f.citasAsistidas)}%), demos asistidas ${f.demosAsistidas} (${pct(f.demosAsistidas, f.demosAgendadas)}%), ventas ${f.ventas} (${pct(f.ventas, f.demosAsistidas)}%)`);
  });
  lineas.push("\nObjetivos del funnel: % Contactados ≥60%, % Citas Agendadas ≥60%, % Citas Asistidas ≥60%, % Demos Agendadas ≥60%, % Demos Asistidas ≥50%, % Ventas ≥80%.");
  return lineas.join("\n");
}

// ── Componente reutilizable: botón + resultado de análisis IA ─────────────────
function AnalisisIABlock({ titulo, subtitulo, loadingLabel, buildPrompt }) {
  const [resultado, setResultado] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generar = async () => {
    setLoading(true); setError(""); setResultado("");
    try {
      const prompt = buildPrompt();
      const response = await fetch("/api/analisis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error || "Error generando análisis."); return; }
      setResultado(data.text || "No se recibió respuesta.");
    } catch { setError("Error de conexión con la IA."); }
    finally { setLoading(false); }
  };

  return (
    <Card>
      <SectionHeader title={titulo} icon="🧠" />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <button onClick={generar} disabled={loading} style={{
          background: loading ? "#1e3a5f" : "#D4AF37",
          color: loading ? "#64748b" : "#0a1628",
          border: "none", borderRadius: 8, padding: "10px 20px",
          fontSize: 13, fontWeight: 700, cursor: loading ? "default" : "pointer"
        }}>
          {loading ? loadingLabel : subtitulo}
        </button>
        {resultado && !loading && (
          <button onClick={() => setResultado("")} style={{
            background: "transparent", border: "1px solid #2a3f5f",
            color: "#64748b", borderRadius: 6, padding: "8px 14px",
            fontSize: 12, cursor: "pointer"
          }}>✕ Limpiar</button>
        )}
      </div>
      {error && (
        <div style={{ background: "#dc262622", border: "1px solid #f87171", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 13, marginBottom: 14 }}>
          {error}
        </div>
      )}
      {loading && (
        <div style={{ color: "#94a3b8", fontSize: 13, padding: "20px 0", textAlign: "center" }}>
          Procesando con IA — esto toma unos segundos…
        </div>
      )}
      {!loading && resultado && (
        <div style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", borderRadius: 8, padding: "18px 20px", maxHeight: "70vh", overflowY: "auto" }}>
          {renderMarkdownGlobal(resultado)}
        </div>
      )}
      {!loading && !resultado && !error && (
        <div style={{ color: "#475569", fontSize: 12.5, textAlign: "center", padding: "20px 0" }}>
          Da clic en el botón para generar el análisis con IA.
        </div>
      )}
    </Card>
  );
}

// ── SECCIÓN: Productividad Asesores ──────────────────────────────────────────
const VENTAS_HIST_PATH = "ventasHistoricas"; // ventasHistoricas/registros = array

// Catálogo de asesores: clave → { nombre, agencia }
// GRY y GRYO se unifican como GRYO; RFX y RFXV se unifican como RFXV
const CATALOGO_ASESORES = {
  "AAHR":  { nombre: "Abraham Aristeo",       agencia: "TUXTLA" },
  "ACOA":  { nombre: "Alexander Ocampo",       agencia: "COMITÁN" },
  "AFMZ":  { nombre: "Angel Fabián",           agencia: "SAN CRISTÓBAL" },
  "AGH":   { nombre: "Anuar Gutiérrez",        agencia: "TAPACHULA" },
  "AMDC":  { nombre: "Angélica Marieli",       agencia: "OCOSINGO" },
  "CGG":   { nombre: "Cristina Gómez",         agencia: "TUXTLA" },
  "CJCP":  { nombre: "Cristian Jacobo",        agencia: "TAPACHULA" },
  "CJGV":  { nombre: "Cristian Javier",        agencia: "SAN CRISTÓBAL" },
  "COTM":  { nombre: "Carlos Omar",            agencia: "SAN CRISTÓBAL" },
  "DADN":  { nombre: "Daniel Domínguez",       agencia: "SAN CRISTÓBAL" },
  "EJMR":  { nombre: "Erick Mendiola",         agencia: "TUXTLA" },
  "GAML":  { nombre: "Guillermo Alejandro",    agencia: "TUXTLA" },
  "GCHG":  { nombre: "Gabriel del Carmen",     agencia: "SAN CRISTÓBAL" },
  "GDLV":  { nombre: "Gabriel de León",        agencia: "TAPACHULA" },
  "GRY":   { nombre: "Gilberto Ruíz",          agencia: "OCOSINGO" }, // unificar con GRYO
  "GRYO":  { nombre: "Gilberto Ruíz",          agencia: "OCOSINGO" },
  "HDD":   { nombre: "Henry Díaz",             agencia: "TUXTLA" },
  "JAJA":  { nombre: "Jorge Águeda",           agencia: "TAPACHULA" },
  "JCPL":  { nombre: "Juan Carlos Laguna",     agencia: "TAPACHULA" },
  "JEGR":  { nombre: "Jonatan Elmar",          agencia: "TUXTLA" },
  "JICC":  { nombre: "José Iván",              agencia: "TUXTLA" },
  "LGLL":  { nombre: "Luis Liévano",           agencia: "SAN CRISTÓBAL" },
  "LGTA":  { nombre: "Laura Torres",           agencia: "OCOSINGO" },
  "LMGA":  { nombre: "Lourdes Gómez",         agencia: "SAN CRISTÓBAL" },
  "MAMT":  { nombre: "María de los Ángeles",   agencia: "SAN CRISTÓBAL" },
  "MAVM":  { nombre: "Miguel Ángel",           agencia: "TAPACHULA" },
  "MEHL":  { nombre: "Manuel Hernández",       agencia: "TAPACHULA" },
  "MEMA":  { nombre: "Mauricio Enrique",       agencia: "COMITÁN" },
  "MIRA":  { nombre: "María Isabel",           agencia: "TUXTLA" },
  "MLC":   { nombre: "Mauricio López",         agencia: "TAPACHULA" },
  "MLGV":  { nombre: "Maura Gómez",            agencia: "SAN CRISTÓBAL" },
  "NTZ":   { nombre: "Nehemias Toledo",        agencia: "TUXTLA" },
  "OAGL":  { nombre: "Oliver Alexander",       agencia: "TAPACHULA" },
  "PAAR":  { nombre: "Pablo Arturo",           agencia: "COMITÁN" },
  "PEHA":  { nombre: "Paulina Hirashi",        agencia: "TUXTLA" },
  "PHR":   { nombre: "Pablo Hernández",        agencia: "TAPACHULA" },
  "PRAG":  { nombre: "Pablo Raúl",             agencia: "TUXTLA" },
  "RACL":  { nombre: "Raúl Antonio",           agencia: "TAPACHULA" },
  "REPM":  { nombre: "Romero Emilio",          agencia: "TUXTLA" },
  "RFX":   { nombre: "Rafael Frías",           agencia: "TUXTLA" }, // unificar con RFXV
  "RFXV":  { nombre: "Rafael Frías",           agencia: "TUXTLA" },
  "RJMR":  { nombre: "Rolando de Jesús",       agencia: "OCOSINGO" },
  "SIZR":  { nombre: "Sharon Zúñiga",          agencia: "COMITÁN" },
  "VACH":  { nombre: "Víctor Adrián",          agencia: "TUXTLA" },
  "VCSC":  { nombre: "Ventas Casa",            agencia: "TUXTLA" },
  "VMBV":  { nombre: "Víctor Berzunza",        agencia: "TUXTLA" },
  "VMML":  { nombre: "Vanesa Morales",         agencia: "TUXTLA" },
  "YYOV":  { nombre: "Yesica Yaneth",          agencia: "COMITÁN" },
};

// Claves que se unifican con otra (se consolidan sus ventas)
const UNIFICAR_CLAVE = { "GRY": "GRYO", "RFX": "RFXV" };

function normalizarClave(clave) {
  const c = clave.trim().toUpperCase();
  return UNIFICAR_CLAVE[c] || c;
}

function nombreAsesor(clave) {
  const c = normalizarClave(clave);
  return CATALOGO_ASESORES[c]?.nombre || clave;
}

function agenciaAsesor(clave) {
  const c = normalizarClave(clave);
  return CATALOGO_ASESORES[c]?.agencia || "—";
}

function modeloCortoVentas(nombre) {
  const n = (nombre || "").toUpperCase();
  for (const [k, l] of [
    ["ALSVIN PLUS","Alsvin Plus"],["ALSVIN","Alsvin"],
    ["CS35 MAX LUXURY","CS35 Max Luxury"],["CS35 MAX","CS35 Max"],
    ["CS35 PLUS","CS35 Plus"],["CS35","CS35"],
    ["CS55 PLUS IDD LUXURY","CS55 IDD Luxury"],["CS55 PLUS IDD","CS55 IDD"],
    ["CS55 PLUS","CS55 Plus"],["CS55","CS55"],
    ["CS75 PRO LUXURY","CS75 Pro Luxury"],["CS75 PRO","CS75 Pro"],
    ["CS75 PLUS","CS75 Plus"],["CS75","CS75"],["CS95","CS95"],
    ["EADO PLUS LUXURY","Eado Plus Luxury"],["EADO PLUS","Eado Plus"],["EADO","Eado"],
    ["HONOR","Honor S VAN"],["HUNTER E","Hunter E"],
    ["HUNTER PLUS","Hunter Plus"],["HUNTER WORK","Hunter Work"],
    ["HUNTER CHASIS","Hunter Chasis"],["HUNTER","Hunter"],
    ["NEW STAR TRUCK CAJA","Star Truck Caja"],["NEW STAR TRUCK","Star Truck DC"],
    ["S05","S05 REEV"],["S07","S07 REEV"],["UNI-K","UNI-K"],
  ]) {
    if (n.includes(k)) return l;
  }
  return nombre?.slice(0, 18) || "—";
}

function parseVentasWorkbook(workbook) {
  const ws = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, cellDates: true });
  const ventas = [];
  const toFloat = (v) => { try { return v ? parseFloat(v) || 0 : 0; } catch { return 0; } };

  for (const row of rows.slice(7)) {
    const en = row[1];
    const tieneAsterisco = en != null && String(en).trim() === "*";

    // Preparar campos para poder validar la fila aunque le falte el asterisco.
    const fechaRaw = row[11];
    let fecha = null;
    if (fechaRaw instanceof Date) fecha = fechaRaw.toISOString().slice(0, 10);
    else if (typeof fechaRaw === "string" && fechaRaw.includes("-")) fecha = fechaRaw.slice(0, 10);
    const claveRaw = String(row[0] || "").trim();
    const costoNum = toFloat(row[25]);
    const modeloRaw = String(row[3] || "").trim();

    // El reporte a veces NO marca el asterisco en ventas de cierre de mes recién capturadas,
    // aunque la venta sí existe (tiene clave de asesor, fecha, costo y modelo).
    // Aceptamos la fila si tiene asterisco O si cumple todos los datos de una venta real.
    // Así evitamos contar subtotales/encabezados (que no tienen costo ni fecha) y a la vez
    // no perdemos ventas legítimas sin marcar.
    const esVentaValidaSinAsterisco =
      claveRaw !== "" && fecha !== null && costoNum > 0 && modeloRaw !== "";

    if (!tieneAsterisco && !esVentaValidaSinAsterisco) continue;

    const mes = fecha ? fecha.slice(0, 7) : null;
    const clave = normalizarClave(claveRaw);
    ventas.push({
      clave,
      nombre: nombreAsesor(claveRaw),
      agencia: agenciaAsesor(claveRaw),
      fecha,
      mes,
      modelo: modeloCortoVentas(modeloRaw),
      modeloRaw,
      ventaUnidad: toFloat(row[18]),
      costo: costoNum,
      utilidad: toFloat(row[30]),
      utilPct: toFloat(row[31]),
      condicion: String(row[17] || "").trim(),
    });
  }
  return ventas;
}

// Mapea la "Condición" del Excel al plan de pago del dashboard (claves de PLANES).
function condicionAPlan(cond) {
  const c = (cond || "").toUpperCase().trim();
  if (c.includes("BANCOMER") || c.includes("BBVA")) return "BBVA";
  if (c.includes("BANORTE")) return "BANORTE";
  if (c.includes("BANJERCI") || c.includes("BANJÉRCITO") || c.includes("BANJERCITO")) return "BANJÉRCITO";
  if (c.includes("SANTANDE")) return "SANTANDER";
  if (c.includes("SCOTIABA")) return "SCOTIABANK";
  if (c.includes("CI BANCO") || c.includes("CIBANCO")) return "CI BANCO";
  if (c.includes("KUNA")) return "KUNA";
  if (c.includes("CONTADO")) return "CONTADO";
  // "VENDO FA" (Vendo Factura) = CAFI, la financiera de casa.
  if (c.includes("VENDO FA") || c.includes("CAFI")) return "CAFI";
  return null; // condición no reconocida
}

// Mapea el nombre de unidad del Excel a la LÍNEA base del dashboard (claves de LINEAS_PRODUCTO).
// Agrupa variantes: "Alsvin Plus" → ALSVIN, "CS35 Max" → CS35, etc.
function modeloALineaBase(nombre) {
  const n = (nombre || "").toUpperCase().trim();
  const reglas = [
    ["CS55 PLUS IDD", "CS55 IDD"], ["CS55 IDD", "CS55 IDD"],
    ["EADO PLUS IDD", "EADO IDD"], ["EADO IDD", "EADO IDD"],
    ["CS75 PRO", "CS75 PRO"], ["CS75", "CS75 PRO"],
    ["EADO PLUS", "EADO PLUS"], ["EADO", "EADO PLUS"],
    ["ALSVIN", "ALSVIN"],
    ["CS35", "CS35"],
    ["CS95", "CS95"],
    ["CS55", "CS55"],
    ["HONOR", "HONOR"],
    ["HUNTER WORK", "HUNTER WORK"],
    ["HUNTER CHASIS", "HUNTER CHASIS"],
    ["HUNTER E", "HUNTER E"],
    ["HUNTER PLUS", "HUNTER PLUS"], ["HUNTER", "HUNTER PLUS"],
    ["NEW STAR TRUCK", "STAR TRUCK"], ["STAR TRUCK", "STAR TRUCK"],
    ["UNI-K", "UNIK"], ["UNIK", "UNIK"],
    ["S05", "S05 REEV"],
    ["S07 BEV", "S07 BEV"], ["S07", "S07 REEV"],
    ["G318", "G318"],
  ];
  for (const [k, linea] of reglas) {
    if (n.includes(k)) return linea;
  }
  return null;
}

// Toma las ventas parseadas y las agrupa por MES → { agencia → {facturado, planesPago, lineasProducto} }.
// Esto alimenta la automatización del panel Operativo por fecha de facturación.
function agregarVentasPorMes(ventas) {
  const porMes = {};
  ventas.forEach(v => {
    if (!v.mes || v.agencia === "—") return;
    if (!porMes[v.mes]) porMes[v.mes] = {};
    const mesObj = porMes[v.mes];
    if (!mesObj[v.agencia]) {
      mesObj[v.agencia] = {
        facturado: 0,
        planesPago: Object.fromEntries(PLANES.map(p => [p.key, 0])),
        lineasProducto: Object.fromEntries(LINEAS_PRODUCTO.map(l => [l.key, 0])),
        diario: new Array(31).fill(0), // conteo de ventas por día del mes (índice 0 = día 1)
      };
    }
    const ag = mesObj[v.agencia];
    ag.facturado += 1;
    // Registrar el día de facturación para el comparativo "a la misma fecha".
    if (v.fecha && v.fecha.length >= 10) {
      const dia = parseInt(v.fecha.slice(8, 10), 10);
      if (dia >= 1 && dia <= 31) ag.diario[dia - 1] += 1;
    }
    const plan = condicionAPlan(v.condicion);
    if (plan && ag.planesPago[plan] !== undefined) ag.planesPago[plan] += 1;
    // La línea se remapea desde el nombre original de unidad, no desde el modelo corto.
    const linea = modeloALineaBase(v.modeloRaw || v.modelo);
    if (linea && ag.lineasProducto[linea] !== undefined) ag.lineasProducto[linea] += 1;
  });
  return porMes;
}

// Calcula el último trimestre completo relativo a la fecha de corte del reporte
function ultimoTrimestre(ventas) {
  const meses = ventas.map(v => v.mes).filter(Boolean).sort();
  if (!meses.length) return [];
  const ultimoMes = meses[meses.length - 1];
  const [y, m] = ultimoMes.split("-").map(Number);
  const meses3 = [];
  for (let i = 2; i >= 0; i--) {
    let mm = m - i;
    let yy = y;
    if (mm <= 0) { mm += 12; yy -= 1; }
    meses3.push(`${yy}-${String(mm).padStart(2, "0")}`);
  }
  return meses3;
}

function ProductividadAsesoresSection() {
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState("");
  const [loadingDatos, setLoadingDatos] = useState(true);
  const [fechaCarga, setFechaCarga] = useState(null);
  const [filtroAgencia, setFiltroAgencia] = useState("TODAS");
  const [filtroMes, setFiltroMes] = useState("TRIMESTRE");
  const [ordenPor, setOrdenPor] = useState("ventas"); // ventas | utilidad | promedio
  const fileInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      setLoadingDatos(true);
      const raw = await fbGet(VENTAS_HIST_PATH);
      if (raw && Array.isArray(raw.registros)) {
        setVentas(raw.registros);
        setFechaCarga(raw.fechaCarga || null);
      }
      setLoadingDatos(false);
    })();
  }, []);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCargando(true); setErrorCarga("");
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: true });
      const registros = parseVentasWorkbook(wb);
      if (registros.length === 0) {
        setErrorCarga("No se encontraron ventas. Verifica que sea el reporte 'Hoja de Costos y Utilidad'.");
        setCargando(false); return;
      }
      const payload = { registros, fechaCarga: new Date().toISOString() };
      await fbSet(VENTAS_HIST_PATH, payload);
      setVentas(registros);
      setFechaCarga(payload.fechaCarga);
    } catch (err) {
      console.error(err);
      setErrorCarga("No se pudo leer el archivo.");
    } finally {
      setCargando(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const mesesDisponibles = [...new Set(ventas.map(v => v.mes).filter(Boolean))].sort().reverse();
  const trimestre = ultimoTrimestre(ventas);

  // Filtrar por mes o trimestre
  const ventasFiltradas = ventas.filter(v => {
    if (filtroAgencia !== "TODAS" && v.agencia !== filtroAgencia) return false;
    if (filtroMes === "TRIMESTRE") return trimestre.includes(v.mes);
    if (filtroMes === "TODO") return true;
    return v.mes === filtroMes;
  });

  // Agrupar por asesor
  const porAsesor = {};
  ventasFiltradas.forEach(v => {
    if (!porAsesor[v.clave]) {
      porAsesor[v.clave] = {
        clave: v.clave, nombre: v.nombre, agencia: v.agencia,
        ventas: 0, utilidadTotal: 0, ventaTotal: 0, modelos: {},
        porMes: {},
      };
    }
    const a = porAsesor[v.clave];
    a.ventas++;
    a.utilidadTotal += v.utilidad;
    a.ventaTotal += v.ventaUnidad;
    a.modelos[v.modelo] = (a.modelos[v.modelo] || 0) + 1;
    a.porMes[v.mes] = (a.porMes[v.mes] || 0) + 1;
  });

  const ranking = Object.values(porAsesor)
    .filter(a => a.ventas > 0)
    .sort((a, b) => {
      if (ordenPor === "ventas") return b.ventas - a.ventas;
      if (ordenPor === "utilidad") return b.utilidadTotal - a.utilidadTotal;
      return (b.ventaTotal / b.ventas) - (a.ventaTotal / a.ventas);
    });

  // Top modelos del período filtrado
  const topModelos = {};
  ventasFiltradas.forEach(v => { topModelos[v.modelo] = (topModelos[v.modelo] || 0) + 1; });
  const topModelosArr = Object.entries(topModelos).sort((a, b) => b[1] - a[1]);

  // Ventas por modelo en el trimestre (para referencia de compra en Inventario)
  const ventasTrimPorModelo = {};
  ventas.filter(v => trimestre.includes(v.mes)).forEach(v => {
    ventasTrimPorModelo[v.modelo] = (ventasTrimPorModelo[v.modelo] || 0) + 1;
  });

  const fmt$ = (n) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(n);
  const mesesFiltro = filtroMes === "TRIMESTRE" ? trimestre : filtroMes === "TODO" ? [] : [filtroMes];

  if (loadingDatos) return <Card><div style={{ color: "#64748b", textAlign: "center", padding: "40px 0" }}>Cargando historial de ventas…</div></Card>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Cabecera ─────────────────────────────────────────────────────────── */}
      <Card>
        <SectionHeader title="PRODUCTIVIDAD DE ASESORES — HISTORIAL DE VENTAS" icon="🏆" />
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFile} style={{ display: "none" }} id="file-ventas-hist" />
            <label htmlFor="file-ventas-hist" style={{
              background: cargando ? "#1e3a5f" : "#D4AF37", color: cargando ? "#64748b" : "#0a1628",
              border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 12.5, fontWeight: 700,
              cursor: cargando ? "default" : "pointer", display: "inline-block"
            }}>
              {cargando ? "Procesando…" : "📤 Subir reporte de ventas (.xlsx)"}
            </label>
            {fechaCarga && (
              <div style={{ color: "#475569", fontSize: 11, marginTop: 5 }}>
                Última carga: {new Date(fechaCarga).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })} · {ventas.length} ventas
              </div>
            )}
          </div>
          {trimestre.length > 0 && (
            <div style={{ background: "#3b9eea11", border: "1px solid #3b9eea33", borderRadius: 8, padding: "8px 14px", fontSize: 12 }}>
              <span style={{ color: "#64748b" }}>Último trimestre: </span>
              <span style={{ color: "#3b9eea", fontWeight: 700 }}>{trimestre.join(" · ")}</span>
              <span style={{ color: "#64748b" }}> · </span>
              <span style={{ color: "#4ade80", fontWeight: 700 }}>{ventas.filter(v => trimestre.includes(v.mes)).length} ventas</span>
            </div>
          )}
        </div>
        {errorCarga && (
          <div style={{ background: "#dc262622", border: "1px solid #f87171", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 13, marginTop: 12 }}>
            {errorCarga}
          </div>
        )}
      </Card>

      {ventas.length === 0 ? (
        <Card>
          <div style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: "40px 0" }}>
            Sube el reporte "Hoja de Costos y Utilidad Autos" para ver la productividad de asesores.
          </div>
        </Card>
      ) : (
        <>
          {/* ── KPIs globales ────────────────────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
            {[
              { label: "TOTAL VENTAS PERÍODO", value: ventasFiltradas.length, color: "#D4AF37" },
              { label: "ASESORES ACTIVOS",      value: ranking.length,         color: "#3b9eea" },
              { label: "PROMEDIO POR ASESOR",   value: ranking.length > 0 ? (ventasFiltradas.length / ranking.length).toFixed(1) : "—", color: "#4ade80" },
              { label: "UTILIDAD TOTAL",        value: fmt$(ventasFiltradas.reduce((s, v) => s + v.utilidad, 0)), color: "#c084fc" },
              { label: "VENTA TOTAL",           value: fmt$(ventasFiltradas.reduce((s, v) => s + v.ventaUnidad, 0)), color: "#60a5fa" },
            ].map(k => (
              <div key={k.label} style={{ background: "#0f2239", border: "1px solid #1e3a5f", borderTop: `3px solid ${k.color}`, borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700, letterSpacing: .8 }}>{k.label}</div>
                <div style={{ color: "#f1f5f9", fontSize: typeof k.value === "string" && k.value.length > 8 ? 15 : 22, fontWeight: 800, marginTop: 4 }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* ── Filtros ──────────────────────────────────────────────────────── */}
          <Card>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
              <div>
                <div style={{ color: "#64748b", fontSize: 10.5, fontWeight: 700, marginBottom: 6 }}>PERÍODO</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {[
                    { key: "TRIMESTRE", label: `Último trimestre (${trimestre.length > 0 ? trimestre[0].slice(5) + "–" + trimestre[2].slice(5) : "—"})` },
                    { key: "TODO", label: "Todo el histórico" },
                    ...mesesDisponibles.slice(0, 6).map(m => ({ key: m, label: getMonthLabel(m) })),
                  ].map(op => (
                    <button key={op.key} onClick={() => setFiltroMes(op.key)} style={{
                      background: filtroMes === op.key ? "#D4AF37" : "#0f2239",
                      color: filtroMes === op.key ? "#0a1628" : "#94a3b8",
                      border: `1px solid ${filtroMes === op.key ? "#D4AF37" : "#1e3a5f"}`,
                      borderRadius: 6, padding: "5px 11px", fontSize: 11.5, fontWeight: 700, cursor: "pointer"
                    }}>{op.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ color: "#64748b", fontSize: 10.5, fontWeight: 700, marginBottom: 6 }}>AGENCIA</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {["TODAS", ...AGENCIAS].map(ag => (
                    <button key={ag} onClick={() => setFiltroAgencia(ag)} style={{
                      background: filtroAgencia === ag ? "#3b9eea" : "#0f2239",
                      color: filtroAgencia === ag ? "#0a1628" : "#94a3b8",
                      border: `1px solid ${filtroAgencia === ag ? "#3b9eea" : "#1e3a5f"}`,
                      borderRadius: 6, padding: "5px 11px", fontSize: 11.5, fontWeight: 700, cursor: "pointer"
                    }}>{ag}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ color: "#64748b", fontSize: 10.5, fontWeight: 700, marginBottom: 6 }}>ORDENAR POR</div>
                <div style={{ display: "flex", gap: 5 }}>
                  {[
                    { key: "ventas", label: "# Ventas" },
                    { key: "utilidad", label: "Utilidad $" },
                    { key: "promedio", label: "Venta promedio" },
                  ].map(op => (
                    <button key={op.key} onClick={() => setOrdenPor(op.key)} style={{
                      background: ordenPor === op.key ? "#c084fc" : "#0f2239",
                      color: ordenPor === op.key ? "#0a1628" : "#94a3b8",
                      border: `1px solid ${ordenPor === op.key ? "#c084fc" : "#1e3a5f"}`,
                      borderRadius: 6, padding: "5px 11px", fontSize: 11.5, fontWeight: 700, cursor: "pointer"
                    }}>{op.label}</button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* ── Ranking de asesores ──────────────────────────────────────────── */}
          <Card>
            <SectionHeader title={`RANKING DE ASESORES — ${filtroMes === "TRIMESTRE" ? `Último trimestre (${trimestre.join(" · ")})` : filtroMes === "TODO" ? "Todo el histórico" : getMonthLabel(filtroMes).toUpperCase()}`} icon="🏅" />
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                <thead>
                  <tr style={{ color: "#64748b", fontSize: 11, borderBottom: "1px solid #1e3a5f" }}>
                    <th style={{ textAlign: "center", padding: "6px 8px" }}>#</th>
                    <th style={{ textAlign: "left", padding: "6px 8px" }}>ASESOR</th>
                    <th style={{ textAlign: "left", padding: "6px 8px" }}>AGENCIA</th>
                    <th style={{ textAlign: "right", padding: "6px 8px" }}>VENTAS</th>
                    {mesesFiltro.length > 1 && mesesFiltro.map(m => (
                      <th key={m} style={{ textAlign: "center", padding: "6px 8px", color: "#475569" }}>{m.slice(5)}</th>
                    ))}
                    <th style={{ textAlign: "right", padding: "6px 8px" }}>VENTA TOTAL</th>
                    <th style={{ textAlign: "right", padding: "6px 8px" }}>VENTA PROM.</th>
                    <th style={{ textAlign: "right", padding: "6px 8px" }}>UTILIDAD</th>
                    <th style={{ textAlign: "left", padding: "6px 8px" }}>MODELO TOP</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((a, idx) => {
                    const medalColores = ["#D4AF37", "#94a3b8", "#c084fc"];
                    const medal = idx < 3 ? ["🥇","🥈","🥉"][idx] : null;
                    const modeloTop = Object.entries(a.modelos).sort((x, y) => y[1] - x[1])[0];
                    return (
                      <tr key={a.clave} style={{ borderBottom: "1px solid #1e3a5f", background: idx === 0 ? "#D4AF3708" : "transparent" }}>
                        <td style={{ textAlign: "center", padding: "7px 8px", fontSize: 15 }}>
                          {medal || <span style={{ color: "#475569", fontSize: 12 }}>{idx + 1}</span>}
                        </td>
                        <td style={{ padding: "7px 8px" }}>
                          <div style={{ color: "#f1f5f9", fontWeight: 700 }}>{a.nombre}</div>
                          <div style={{ color: "#475569", fontSize: 10.5 }}>{a.clave}</div>
                        </td>
                        <td style={{ padding: "7px 8px", color: "#94a3b8", fontSize: 12 }}>{a.agencia}</td>
                        <td style={{ padding: "7px 8px", textAlign: "right" }}>
                          <span style={{ color: "#D4AF37", fontWeight: 800, fontSize: 16 }}>{a.ventas}</span>
                        </td>
                        {mesesFiltro.length > 1 && mesesFiltro.map(m => (
                          <td key={m} style={{ textAlign: "center", padding: "7px 8px", color: a.porMes[m] ? "#3b9eea" : "#1e3a5f", fontWeight: a.porMes[m] ? 700 : 400 }}>
                            {a.porMes[m] || "—"}
                          </td>
                        ))}
                        <td style={{ padding: "7px 8px", textAlign: "right", color: "#cbd5e1" }}>{fmt$(a.ventaTotal)}</td>
                        <td style={{ padding: "7px 8px", textAlign: "right", color: "#94a3b8" }}>{fmt$(a.ventaTotal / a.ventas)}</td>
                        <td style={{ padding: "7px 8px", textAlign: "right", color: a.utilidadTotal > 0 ? "#4ade80" : "#f87171", fontWeight: 700 }}>
                          {fmt$(a.utilidadTotal)}
                        </td>
                        <td style={{ padding: "7px 8px", color: "#64748b", fontSize: 11.5 }}>
                          {modeloTop ? `${modeloTop[0]} (${modeloTop[1]})` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* ── Evolución mensual (últimos 12 meses) ────────────────────────── */}
          <Card>
            <SectionHeader title="EVOLUCIÓN MENSUAL — VENTAS POR ASESOR" icon="📉" />
            <div style={{ color: "#475569", fontSize: 11.5, marginBottom: 14 }}>
              Últimos 12 meses con datos. Cada número = ventas en ese mes.
            </div>
            {(() => {
              const ultimos12 = mesesDisponibles.slice(0, 12).reverse();
              const asesoresActivos = Object.values(porAsesor)
                .filter(a => filtroAgencia === "TODAS" || a.agencia === filtroAgencia)
                .sort((a, b) => b.ventas - a.ventas)
                .slice(0, 15);
              // Recalcular ventas por mes sin filtro de período (solo agencia)
              const ventasPorMes = {};
              ventas.filter(v => filtroAgencia === "TODAS" || v.agencia === filtroAgencia)
                .forEach(v => {
                  if (!ventasPorMes[v.clave]) ventasPorMes[v.clave] = {};
                  ventasPorMes[v.clave][v.mes] = (ventasPorMes[v.clave][v.mes] || 0) + 1;
                });
              return (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
                    <thead>
                      <tr style={{ color: "#64748b", fontSize: 10.5, borderBottom: "1px solid #1e3a5f" }}>
                        <th style={{ textAlign: "left", padding: "5px 8px", minWidth: 160 }}>ASESOR</th>
                        {ultimos12.map(m => (
                          <th key={m} style={{ textAlign: "center", padding: "5px 6px", minWidth: 36 }}>
                            {m.slice(5)}
                          </th>
                        ))}
                        <th style={{ textAlign: "right", padding: "5px 8px" }}>TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {asesoresActivos.map(a => {
                        const mesesAsesor = ventasPorMes[a.clave] || {};
                        const totalPeriodo = ultimos12.reduce((s, m) => s + (mesesAsesor[m] || 0), 0);
                        const maxMes = Math.max(1, ...ultimos12.map(m => mesesAsesor[m] || 0));
                        return (
                          <tr key={a.clave} style={{ borderBottom: "1px solid #0f2239" }}>
                            <td style={{ padding: "5px 8px" }}>
                              <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 12 }}>{a.nombre}</div>
                              <div style={{ color: "#475569", fontSize: 10 }}>{a.agencia}</div>
                            </td>
                            {ultimos12.map(m => {
                              const v = mesesAsesor[m] || 0;
                              const intensidad = maxMes > 0 ? v / maxMes : 0;
                              const bg = v > 0 ? `rgba(59,158,234,${0.15 + intensidad * 0.7})` : "transparent";
                              return (
                                <td key={m} style={{ textAlign: "center", padding: "5px 6px", background: bg, borderRadius: 4 }}>
                                  <span style={{ color: v > 0 ? "#f1f5f9" : "#1e3a5f", fontWeight: v > 0 ? 700 : 400 }}>
                                    {v || "·"}
                                  </span>
                                </td>
                              );
                            })}
                            <td style={{ textAlign: "right", padding: "5px 8px", color: "#D4AF37", fontWeight: 700 }}>{totalPeriodo}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </Card>

          {/* ── Top modelos del período ──────────────────────────────────────── */}
          <Card>
            <SectionHeader title="TOP MODELOS VENDIDOS — PERÍODO SELECCIONADO" icon="🥧" />
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
              <PieChartLeyenda
                datos={topModelosArr.slice(0, 8).map(([label, value]) => ({ label, value }))}
                colores={["#3b9eea","#D4AF37","#4ade80","#c084fc","#fb923c","#f472b6","#60a5fa","#fbbf24"]}
                size={180}
              />
              <div style={{ flex: 1, minWidth: 280 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ color: "#64748b", fontSize: 11, borderBottom: "1px solid #1e3a5f" }}>
                      <th style={{ textAlign: "left", padding: "5px 8px" }}>MODELO</th>
                      <th style={{ textAlign: "center", padding: "5px 8px" }}>UNIDADES</th>
                      <th style={{ textAlign: "right", padding: "5px 8px" }}>% DEL PERÍODO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topModelosArr.map(([modelo, count]) => (
                      <tr key={modelo} style={{ borderBottom: "1px solid #0f2239" }}>
                        <td style={{ padding: "5px 8px", color: "#f1f5f9" }}>{modelo}</td>
                        <td style={{ textAlign: "center", padding: "5px 8px", color: "#D4AF37", fontWeight: 700 }}>{count}</td>
                        <td style={{ textAlign: "right", padding: "5px 8px", color: "#64748b" }}>
                          {ventasFiltradas.length > 0 ? `${(count / ventasFiltradas.length * 100).toFixed(1)}%` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          {/* ── Referencia de compra (ventas último trimestre por modelo) ─────── */}
          <Card>
            <SectionHeader title="VENTAS ÚLTIMO TRIMESTRE POR MODELO — REFERENCIA PARA COMPRA" icon="📦" />
            <div style={{ color: "#3b9eea", fontSize: 11.5, marginBottom: 12, background: "#3b9eea11", border: "1px solid #3b9eea33", borderRadius: 6, padding: "8px 12px" }}>
              Estos datos se usan automáticamente en la pestaña de Inventario para calcular el stock ideal (1.5 meses de venta).
              Período: <b>{trimestre.join(" → ")}</b>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {Object.entries(ventasTrimPorModelo)
                .sort((a, b) => b[1] - a[1])
                .map(([modelo, count]) => (
                  <div key={modelo} style={{ background: "#0f2239", border: "1px solid #1e3a5f", borderRadius: 8, padding: "10px 14px", minWidth: 140 }}>
                    <div style={{ color: "#64748b", fontSize: 10.5, fontWeight: 700, marginBottom: 4 }}>{modelo}</div>
                    <div style={{ color: "#D4AF37", fontSize: 20, fontWeight: 800 }}>{count}</div>
                    <div style={{ color: "#475569", fontSize: 10.5 }}>
                      {(count / 3).toFixed(1)}/mes → ideal {Math.ceil(count / 3 * 1.5)} uds.
                    </div>
                  </div>
                ))}
            </div>
          </Card>

          {/* ── Análisis IA de Productividad ─────────────────────────────────── */}
          <AnalisisIABlock
            titulo="ANÁLISIS DE PRODUCTIVIDAD CON IA"
            subtitulo="🧠 Generar análisis de asesores"
            loadingLabel="Analizando productividad…"
            buildPrompt={() => {
              const lineas = [];
              lineas.push(`Eres el director comercial de CHESA Changan, grupo de 5 agencias en Chiapas.`);
              lineas.push(`Analiza la productividad de los asesores y genera recomendaciones de coaching y gestión.\n`);
              lineas.push(`PERÍODO ANALIZADO: ${filtroMes === "TRIMESTRE" ? `Último trimestre (${trimestre.join(" → ")})` : filtroMes === "TODO" ? "Todo el histórico (may 2024 – jun 2026)" : getMonthLabel(filtroMes)}`);
              lineas.push(`AGENCIA FILTRO: ${filtroAgencia}\n`);
              lineas.push(`RESUMEN PERÍODO:`);
              lineas.push(`- Total ventas: ${ventasFiltradas.length}`);
              lineas.push(`- Asesores activos: ${ranking.length}`);
              lineas.push(`- Promedio por asesor: ${ranking.length > 0 ? (ventasFiltradas.length/ranking.length).toFixed(1) : "—"} ventas`);
              lineas.push(`- Utilidad total: $${Math.round(ventasFiltradas.reduce((s,v)=>s+v.utilidad,0)).toLocaleString("es-MX")}`);
              lineas.push(`- Venta total: $${Math.round(ventasFiltradas.reduce((s,v)=>s+v.ventaUnidad,0)).toLocaleString("es-MX")}\n`);
              lineas.push(`RANKING COMPLETO DE ASESORES:`);
              ranking.forEach((a, idx) => {
                const modeloTop = Object.entries(a.modelos).sort((x,y)=>y[1]-x[1])[0];
                const promedio = a.ventaTotal/a.ventas;
                const utilPct = a.ventaTotal > 0 ? (a.utilidadTotal/a.ventaTotal*100).toFixed(1) : "0";
                lineas.push(`  ${idx+1}. ${a.nombre} (${a.agencia}): ${a.ventas} ventas | util $${Math.round(a.utilidadTotal).toLocaleString("es-MX")} (${utilPct}%) | venta prom $${Math.round(promedio).toLocaleString("es-MX")} | top: ${modeloTop?.[0] || "—"} (${modeloTop?.[1] || 0})`);
                if (trimestre.length > 1) {
                  const porMesStr = trimestre.map(m => `${m.slice(5)}:${a.porMes[m]||0}`).join(", ");
                  lineas.push(`     Evolución: ${porMesStr}`);
                }
              });
              lineas.push(`\nTOP MODELOS VENDIDOS:`);
              topModelosArr.forEach(([m, c]) => lineas.push(`  - ${m}: ${c} unidades (${ventasFiltradas.length>0?(c/ventasFiltradas.length*100).toFixed(1):0}%)`));
              lineas.push(`\nPREGUNTAS A RESPONDER:`);
              lineas.push(`1. ¿Cuáles son los 3 asesores con mejor desempeño y qué prácticas deberían replicarse?`);
              lineas.push(`2. ¿Qué asesores muestran señales de alerta (caída sostenida, resultados muy por debajo de la media) y qué acción tomar?`);
              lineas.push(`3. ¿Hay alguna agencia con un patrón de productividad preocupante vs las otras?`);
              lineas.push(`4. ¿Qué modelo están vendiendo más los asesores top y qué podría explicarlo?`);
              lineas.push(`5. Recomienda 2-3 acciones concretas de coaching para el equipo este mes.`);
              lineas.push(`Responde en markdown, directo y ejecutivo. Usa los nombres completos de los asesores, no las claves.`);
              return lineas.join("\n");
            }}
          />
        </>
      )}
    </div>
  );
}

const INVENTARIO_PATH = "inventario"; // inventario/unidades = array de objetos

// Mapea la ubicación física del Excel a una de las 5 agencias
function mapearUbicacionAgencia(ubic) {
  const u = (ubic || "").toLowerCase().trim();
  if (u.includes("tapachula")) return "TAPACHULA";
  if (u.includes("cristobal") || u.includes("cristóbal")) return "SAN CRISTÓBAL";
  if (u.includes("ocosingo")) return "OCOSINGO";
  if (u.includes("comitan") || u.includes("comitán")) return "COMITÁN";
  if (u.includes("tuxtla") || u.includes("agencia") || u.includes("patio")) return "TUXTLA";
  return "TUXTLA"; // default
}

// Extrae el nombre corto del modelo (primeras 2-3 palabras para mostrar en tabla)
function nombreCortoModelo(nombreCompleto) {
  if (!nombreCompleto) return "—";
  const n = nombreCompleto.trim();
  // Detectar línea por palabras clave al inicio
  const lineas = [
    { key: "alsvin plus", label: "Alsvin Plus" },
    { key: "alsvin", label: "Alsvin" },
    { key: "cs35 max luxury", label: "CS35 Max Luxury" },
    { key: "cs35 max", label: "CS35 Max" },
    { key: "cs35 plus", label: "CS35 Plus" },
    { key: "cs55 plus idd luxury", label: "CS55 IDD Luxury" },
    { key: "cs55 plus idd", label: "CS55 IDD" },
    { key: "cs55 plus", label: "CS55 Plus" },
    { key: "cs75 pro luxury", label: "CS75 Pro Luxury" },
    { key: "cs75 pro", label: "CS75 Pro" },
    { key: "cs75 plus", label: "CS75 Plus" },
    { key: "cs95", label: "CS95" },
    { key: "eado plus luxury", label: "Eado Plus Luxury" },
    { key: "eado plus", label: "Eado Plus" },
    { key: "honor", label: "Honor S VAN" },
    { key: "hunter e", label: "Hunter E" },
    { key: "hunter plus", label: "Hunter Plus" },
    { key: "hunter work", label: "Hunter Work" },
    { key: "hunter chasis", label: "Hunter Chasis" },
    { key: "new star truck caja", label: "Star Truck Caja" },
    { key: "new star truck", label: "Star Truck DC" },
    { key: "s05", label: "S05 REEV" },
    { key: "s07", label: "S07 REEV" },
    { key: "uni-k", label: "UNI-K" },
  ];
  const lower = n.toLowerCase();
  for (const l of lineas) {
    if (lower.startsWith(l.key)) return l.label;
  }
  return n.split(" ").slice(0, 3).join(" ");
}

function parseInventarioWorkbook(workbook) {
  const ws = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  const hoy = new Date();
  const unidades = [];
  for (let i = 7; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[7]) continue; // necesita nombre de modelo
    const costoFactura = typeof r[25] === "number" ? r[25] : 0;
    if (costoFactura === 0) continue;
    const diasExcel = typeof r[6] === "number" ? r[6] : 0;
    const arribo = r[19] ? new Date(r[19]) : null;
    const diasCalculados = arribo ? Math.floor((hoy - arribo) / (1000 * 60 * 60 * 24)) : diasExcel;
    const dias = diasCalculados > 0 ? diasCalculados : diasExcel;
    const noInv = r[4] ? String(r[4]).replace(/^'/, "").trim() : "—";
    const exterior = r[3] ? String(r[3]).trim() : "—";
    const numSerie = r[17] ? String(r[17]).trim() : "—";
    const danio = r[22] ? String(r[22]).trim() : null;
    const ubicRaw = r[20] ? String(r[20]).trim() : "";
    unidades.push({
      noInv,
      nombreCompleto: String(r[7]).trim(),
      modelo: nombreCortoModelo(String(r[7])),
      anio: r[8] || "—",
      color: exterior,
      numSerie,
      dias,
      costoFactura,
      agencia: mapearUbicacionAgencia(ubicRaw),
      ubicFisica: ubicRaw,
      danio,
    });
  }
  return unidades;
}

function nivelRiesgo(dias) {
  if (dias > 120) return "rojo";
  if (dias > 90) return "naranja";
  if (dias > 60) return "amarillo";
  return "verde";
}

const RIESGO = {
  verde:    { color: "#4ade80", bg: "#14532d22", label: "OK",       border: "#4ade80" },
  amarillo: { color: "#fbbf24", bg: "#78350f22", label: "Atención", border: "#fbbf24" },
  naranja:  { color: "#f97316", bg: "#7c2d1222", label: "Urgente",  border: "#f97316" },
  rojo:     { color: "#ef4444", bg: "#7f1d1d33", label: "Crítico",  border: "#ef4444" },
};

function costoPlanPiso(costoFactura, dias, tiie, spread) {
  const tasa = (tiie + spread) / 100;
  return costoFactura * tasa / 365 * dias;
}

function InventarioSection() {
  const [unidades, setUnidades] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState("");
  const [loadingDatos, setLoadingDatos] = useState(true);
  const [fechaCarga, setFechaCarga] = useState(null);

  // Parámetros de plan piso — editables en UI
  const [tiie, setTiie] = useState(8.5);
  const [spread, setSpread] = useState(2.0);
  const [ventasTrim, setVentasTrim] = useState({}); // { modeloKey: número }

  // Filtros
  const [filtroAgencia, setFiltroAgencia] = useState("TODAS");
  const [filtroModelo, setFiltroModelo] = useState("TODOS");
  const [filtroRiesgo, setFiltroRiesgo] = useState("TODOS");

  const fileInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      setLoadingDatos(true);

      // 1. Cargar inventario
      const raw = await fbGet(INVENTARIO_PATH);
      if (raw && raw.unidades && Array.isArray(raw.unidades)) {
        setUnidades(raw.unidades);
        setFechaCarga(raw.fechaCarga || null);
        if (raw.tiie) setTiie(raw.tiie);
        if (raw.spread) setSpread(raw.spread);
      }

      // 2. Calcular ventasTrim desde el historial de ventas (Productividad)
      //    Esto sincroniza automáticamente sin captura manual.
      const rawVentas = await fbGet(VENTAS_HIST_PATH);
      if (rawVentas && Array.isArray(rawVentas.registros) && rawVentas.registros.length > 0) {
        const registros = rawVentas.registros;
        // Obtener el último trimestre
        const meses = [...new Set(registros.map(v => v.mes).filter(Boolean))].sort();
        const ultimoMes = meses[meses.length - 1];
        if (ultimoMes) {
          const [y, m] = ultimoMes.split("-").map(Number);
          const trim = [];
          for (let i = 2; i >= 0; i--) {
            let mm = m - i; let yy = y;
            if (mm <= 0) { mm += 12; yy -= 1; }
            trim.push(`${yy}-${String(mm).padStart(2, "0")}`);
          }
          // Contar ventas por modelo en ese trimestre
          const conteo = {};
          registros.filter(v => trim.includes(v.mes)).forEach(v => {
            const k = v.modelo.replace(/[^a-zA-Z0-9]/g, "_");
            conteo[k] = (conteo[k] || 0) + 1;
          });
          // Usar los datos calculados (si ya había manuales guardados, los sobreescribe con los reales)
          setVentasTrim(conteo);
          // Guardar en Firebase para que Inventario los tenga siempre actualizados
          if (raw) await fbSet(`${INVENTARIO_PATH}/ventasTrim`, conteo);
        }
      } else if (raw?.ventasTrim) {
        // Si no hay historial de ventas, usar lo guardado manualmente
        setVentasTrim(raw.ventasTrim);
      }

      setLoadingDatos(false);
    })();
  }, []);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCargando(true);
    setErrorCarga("");
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: true });
      const parsed = parseInventarioWorkbook(wb);
      if (parsed.length === 0) {
        setErrorCarga("No se encontraron unidades en este archivo. Verifica que sea el reporte de Existencia por Antigüedad.");
        setCargando(false);
        return;
      }
      const payload = {
        unidades: parsed,
        fechaCarga: new Date().toISOString(),
        tiie,
        spread,
      };
      await fbSet(INVENTARIO_PATH, payload);
      setUnidades(parsed);
      setFechaCarga(payload.fechaCarga);
    } catch (err) {
      console.error(err);
      setErrorCarga("No se pudo leer el archivo. Verifica que sea un Excel válido del sistema de inventario.");
    } finally {
      setCargando(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const guardarTasas = async () => {
    if (unidades.length > 0) {
      await fbSet(INVENTARIO_PATH, { unidades, fechaCarga, tiie, spread, ventasTrim });
    }
  };

  // Modelos únicos para filtro
  const modelosUnicos = ["TODOS", ...Array.from(new Set(unidades.map(u => u.modelo))).sort()];

  // Filtrado
  const unidadesFiltradas = unidades.filter(u => {
    if (filtroAgencia !== "TODAS" && u.agencia !== filtroAgencia) return false;
    if (filtroModelo !== "TODOS" && u.modelo !== filtroModelo) return false;
    if (filtroRiesgo !== "TODOS" && nivelRiesgo(u.dias) !== filtroRiesgo) return false;
    return true;
  }).sort((a, b) => b.dias - a.dias);

  // KPIs globales (sobre todas las unidades sin filtro)
  const totalUnidades = unidades.length;
  const totalCosto = unidades.reduce((s, u) => s + u.costoFactura, 0);
  const totalPlanPiso = unidades.reduce((s, u) => s + costoPlanPiso(u.costoFactura, u.dias, tiie, spread), 0);
  const diasPromedio = unidades.length > 0 ? Math.round(unidades.reduce((s, u) => s + u.dias, 0) / unidades.length) : 0;
  const conteoRiesgo = { verde: 0, amarillo: 0, naranja: 0, rojo: 0 };
  unidades.forEach(u => { conteoRiesgo[nivelRiesgo(u.dias)]++; });

  // Agrupación por modelo para compra mensual
  const porModelo = {};
  unidades.forEach(u => {
    if (!porModelo[u.modelo]) porModelo[u.modelo] = { modelo: u.modelo, cantidad: 0, costoTotal: 0, diasProm: 0, diasSum: 0 };
    porModelo[u.modelo].cantidad++;
    porModelo[u.modelo].costoTotal += u.costoFactura;
    porModelo[u.modelo].diasSum += u.dias;
  });
  Object.values(porModelo).forEach(m => { m.diasProm = Math.round(m.diasSum / m.cantidad); });
  const modelosOrdenados = Object.values(porModelo).sort((a, b) => b.cantidad - a.cantidad);

  const fmt = (n) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(n);

  if (loadingDatos) return <Card><div style={{ color: "#64748b", fontSize: 13, textAlign: "center", padding: "40px 0" }}>Cargando inventario…</div></Card>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Cabecera: subida + tasas ──────────────────────────────────────────── */}
      <Card>
        <SectionHeader title="INVENTARIO — EXISTENCIA POR ANTIGÜEDAD" icon="🚗" />
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-end" }}>
          {/* Subida de Excel */}
          <div>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFile} style={{ display: "none" }} id="file-inventario" />
            <label htmlFor="file-inventario" style={{
              background: cargando ? "#1e3a5f" : "#D4AF37", color: cargando ? "#64748b" : "#0a1628",
              border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 12.5, fontWeight: 700,
              cursor: cargando ? "default" : "pointer", display: "inline-block"
            }}>
              {cargando ? "Procesando…" : "📤 Subir inventario actualizado (.xlsx)"}
            </label>
            {fechaCarga && (
              <div style={{ color: "#475569", fontSize: 11, marginTop: 6 }}>
                Última carga: {new Date(fechaCarga).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </div>
            )}
          </div>

          {/* Tasas plan piso */}
          <div style={{ background: "#0f2239", border: "1px solid #1e3a5f", borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 700 }}>PLAN PISO: TIIE</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <NumInput value={tiie} onChange={v => setTiie(v)} step={0.25} min={0} width={65} />
              <span style={{ color: "#64748b", fontSize: 13 }}>%</span>
            </div>
            <span style={{ color: "#64748b", fontSize: 13 }}>+</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <NumInput value={spread} onChange={v => setSpread(v)} step={0.25} min={0} width={55} />
              <span style={{ color: "#64748b", fontSize: 13 }}>%</span>
            </div>
            <span style={{ color: "#3b9eea", fontSize: 12, fontWeight: 700 }}>= {(tiie + spread).toFixed(2)}% anual</span>
            <button onClick={guardarTasas} style={{ background: "#3b9eea22", border: "1px solid #3b9eea", color: "#3b9eea", borderRadius: 6, padding: "5px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
              Guardar tasas
            </button>
          </div>
        </div>
        {errorCarga && (
          <div style={{ background: "#dc262622", border: "1px solid #f87171", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 13, marginTop: 12 }}>
            {errorCarga}
          </div>
        )}
      </Card>

      {unidades.length === 0 ? (
        <Card>
          <div style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: "40px 0" }}>
            Sube el reporte de "Existencia Total por Antigüedad" para visualizar el inventario.
          </div>
        </Card>
      ) : (
        <>
          {/* ── KPIs globales ──────────────────────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
            {[
              { label: "TOTAL UNIDADES",    value: totalUnidades,           sub: "en inventario",          color: "#3b9eea" },
              { label: "VALOR INVENTARIO",  value: fmt(totalCosto),         sub: "costo factura total",    color: "#D4AF37" },
              { label: "COSTO PLAN PISO",   value: fmt(totalPlanPiso),      sub: `TIIE ${tiie}% + ${spread}% acumulado`, color: "#f97316" },
              { label: "DÍAS PROMEDIO",     value: `${diasPromedio} días`,  sub: "antigüedad promedio",    color: "#c084fc" },
              { label: "🟡 ATENCIÓN",       value: conteoRiesgo.amarillo,   sub: "61–90 días",             color: "#fbbf24" },
              { label: "🟠 URGENTE",        value: conteoRiesgo.naranja,    sub: "91–120 días",            color: "#f97316" },
              { label: "🔴 CRÍTICO",        value: conteoRiesgo.rojo,       sub: "más de 120 días",        color: "#ef4444" },
            ].map(k => (
              <div key={k.label} style={{ background: "#0f2239", border: "1px solid #1e3a5f", borderTop: `3px solid ${k.color}`, borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700, letterSpacing: .8 }}>{k.label}</div>
                <div style={{ color: "#f1f5f9", fontSize: k.value.toString().length > 8 ? 16 : 22, fontWeight: 800, lineHeight: 1.2, marginTop: 4 }}>{k.value}</div>
                <div style={{ color: "#475569", fontSize: 11, marginTop: 3 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Filtros ────────────────────────────────────────────────────────── */}
          <Card>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
              <div>
                <div style={{ color: "#64748b", fontSize: 10.5, fontWeight: 700, marginBottom: 5 }}>AGENCIA</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["TODAS", ...AGENCIAS].map(ag => (
                    <button key={ag} onClick={() => setFiltroAgencia(ag)} style={{
                      background: filtroAgencia === ag ? "#3b9eea" : "#0f2239",
                      color: filtroAgencia === ag ? "#0a1628" : "#94a3b8",
                      border: `1px solid ${filtroAgencia === ag ? "#3b9eea" : "#1e3a5f"}`,
                      borderRadius: 6, padding: "5px 11px", fontSize: 11.5, fontWeight: 700, cursor: "pointer"
                    }}>{ag}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ color: "#64748b", fontSize: 10.5, fontWeight: 700, marginBottom: 5 }}>NIVEL DE RIESGO</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[
                    { key: "TODOS", label: "Todos", color: "#94a3b8" },
                    { key: "amarillo", label: "🟡 Atención", color: "#fbbf24" },
                    { key: "naranja",  label: "🟠 Urgente",  color: "#f97316" },
                    { key: "rojo",     label: "🔴 Crítico",  color: "#ef4444" },
                    { key: "verde",    label: "✅ OK",        color: "#4ade80" },
                  ].map(r => (
                    <button key={r.key} onClick={() => setFiltroRiesgo(r.key)} style={{
                      background: filtroRiesgo === r.key ? `${r.color}33` : "#0f2239",
                      color: filtroRiesgo === r.key ? r.color : "#94a3b8",
                      border: `1px solid ${filtroRiesgo === r.key ? r.color : "#1e3a5f"}`,
                      borderRadius: 6, padding: "5px 11px", fontSize: 11.5, fontWeight: 700, cursor: "pointer"
                    }}>{r.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ color: "#64748b", fontSize: 10.5, fontWeight: 700, marginBottom: 5 }}>MODELO</div>
                <select value={filtroModelo} onChange={e => setFiltroModelo(e.target.value)} style={{
                  background: "#0f2239", border: "1px solid #1e3a5f", color: "#f1f5f9",
                  borderRadius: 6, padding: "6px 10px", fontSize: 12
                }}>
                  {modelosUnicos.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div style={{ marginLeft: "auto", color: "#475569", fontSize: 12 }}>
                Mostrando <b style={{ color: "#f1f5f9" }}>{unidadesFiltradas.length}</b> de {totalUnidades} unidades
              </div>
            </div>
          </Card>

          {/* ── Tabla de inventario ────────────────────────────────────────────── */}
          <Card>
            <SectionHeader title={`DETALLE DE UNIDADES — ${filtroAgencia}`} icon="📋" />
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                <thead>
                  <tr style={{ color: "#64748b", fontSize: 11, borderBottom: "1px solid #1e3a5f" }}>
                    <th style={{ textAlign: "left", padding: "6px 8px" }}>NIVEL</th>
                    <th style={{ textAlign: "left", padding: "6px 8px" }}>MODELO</th>
                    <th style={{ textAlign: "left", padding: "6px 8px" }}>COLOR</th>
                    <th style={{ textAlign: "left", padding: "6px 8px" }}>NO. INV.</th>
                    <th style={{ textAlign: "left", padding: "6px 8px" }}>AGENCIA</th>
                    <th style={{ textAlign: "right", padding: "6px 8px" }}>DÍAS</th>
                    <th style={{ textAlign: "right", padding: "6px 8px" }}>COSTO FACTURA</th>
                    <th style={{ textAlign: "right", padding: "6px 8px" }}>COSTO PLAN PISO</th>
                    <th style={{ textAlign: "left", padding: "6px 8px" }}>DAÑO</th>
                  </tr>
                </thead>
                <tbody>
                  {unidadesFiltradas.map((u, idx) => {
                    const nivel = nivelRiesgo(u.dias);
                    const r = RIESGO[nivel];
                    const planPiso = costoPlanPiso(u.costoFactura, u.dias, tiie, spread);
                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid #1e3a5f", background: nivel !== "verde" ? r.bg : "transparent" }}>
                        <td style={{ padding: "7px 8px" }}>
                          <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700, background: `${r.color}22`, color: r.color, border: `1px solid ${r.color}`, whiteSpace: "nowrap" }}>
                            {r.label}
                          </span>
                        </td>
                        <td style={{ padding: "7px 8px", color: "#f1f5f9", fontWeight: 600 }}>{u.modelo}</td>
                        <td style={{ padding: "7px 8px", color: "#94a3b8" }}>{u.color}</td>
                        <td style={{ padding: "7px 8px", color: "#64748b", fontSize: 11 }}>{u.noInv}</td>
                        <td style={{ padding: "7px 8px", color: "#94a3b8" }}>{u.agencia}</td>
                        <td style={{ padding: "7px 8px", textAlign: "right", fontWeight: 700, color: r.color }}>{u.dias}</td>
                        <td style={{ padding: "7px 8px", textAlign: "right", color: "#cbd5e1" }}>{fmt(u.costoFactura)}</td>
                        <td style={{ padding: "7px 8px", textAlign: "right", color: nivel === "rojo" ? "#ef4444" : nivel === "naranja" ? "#f97316" : "#D4AF37", fontWeight: 700 }}>
                          {fmt(planPiso)}
                        </td>
                        <td style={{ padding: "7px 8px", color: u.danio ? "#f87171" : "#1e3a5f", fontSize: 11 }}>
                          {u.danio || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: "2px solid #D4AF3755" }}>
                    <td colSpan={6} style={{ padding: "8px 8px", color: "#D4AF37", fontWeight: 700, fontSize: 12 }}>
                      SUBTOTAL FILTRADO ({unidadesFiltradas.length} unidades)
                    </td>
                    <td style={{ padding: "8px 8px", textAlign: "right", color: "#D4AF37", fontWeight: 700 }}>
                      {fmt(unidadesFiltradas.reduce((s, u) => s + u.costoFactura, 0))}
                    </td>
                    <td style={{ padding: "8px 8px", textAlign: "right", color: "#f97316", fontWeight: 700 }}>
                      {fmt(unidadesFiltradas.reduce((s, u) => s + costoPlanPiso(u.costoFactura, u.dias, tiie, spread), 0))}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          {/* ── Resumen por modelo (referencia compra mensual) ─────────────────── */}
          <Card>
            <SectionHeader title="INVENTARIO POR MODELO — REFERENCIA DE COMPRA" icon="📦" />
            <div style={{ color: "#475569", fontSize: 11.5, marginBottom: 14, background: "#4ade8011", border: "1px solid #4ade8033", borderRadius: 6, padding: "8px 12px" }}>
              ✅ <b style={{ color: "#4ade80" }}>Sincronizado automáticamente</b> desde la pestaña de Productividad Asesores.
              Las ventas del último trimestre se calculan del historial cargado allá.
              Objetivo: mantener <b style={{ color: "#3b9eea" }}>1.5 meses de venta</b> por modelo.
              Si no has subido el reporte de ventas aún, puedes capturar manualmente en la columna "VENTAS TRIM."
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                <thead>
                  <tr style={{ color: "#64748b", fontSize: 11, borderBottom: "1px solid #1e3a5f" }}>
                    <th style={{ textAlign: "left", padding: "6px 8px" }}>MODELO</th>
                    <th style={{ textAlign: "right", padding: "6px 8px" }}>STOCK ACTUAL</th>
                    <th style={{ textAlign: "right", padding: "6px 8px" }}>DÍAS PROM.</th>
                    <th style={{ textAlign: "right", padding: "6px 8px" }}>COSTO TOTAL</th>
                    <th style={{ textAlign: "right", padding: "6px 8px" }}>PLAN PISO ACUM.</th>
                    <th style={{ textAlign: "right", padding: "6px 8px", color: "#3b9eea" }}>VENTAS TRIM. (cap.)</th>
                    <th style={{ textAlign: "right", padding: "6px 8px", color: "#3b9eea" }}>STOCK IDEAL (1.5m)</th>
                    <th style={{ textAlign: "right", padding: "6px 8px" }}>DIFERENCIA</th>
                  </tr>
                </thead>
                <tbody>
                  {modelosOrdenados.map((m, idx) => {
                    const modeloKey = m.modelo.replace(/[^a-zA-Z0-9]/g, "_");
                    const planPisoModelo = unidades
                      .filter(u => u.modelo === m.modelo)
                      .reduce((s, u) => s + costoPlanPiso(u.costoFactura, u.dias, tiie, spread), 0);
                    const vTrim = ventasTrim[modeloKey] ?? 0;
                    const ventasMensuales = vTrim / 3;
                    const stockIdeal = ventasMensuales > 0 ? Math.ceil(ventasMensuales * 1.5) : null;
                    const diferencia = stockIdeal !== null ? m.cantidad - stockIdeal : null;
                    return (
                      <tr key={m.modelo} style={{ borderBottom: "1px solid #1e3a5f" }}>
                        <td style={{ padding: "7px 8px", color: "#f1f5f9", fontWeight: 600 }}>{m.modelo}</td>
                        <td style={{ padding: "7px 8px", textAlign: "right", color: "#D4AF37", fontWeight: 700 }}>{m.cantidad}</td>
                        <td style={{ padding: "7px 8px", textAlign: "right", color: nivelRiesgo(m.diasProm) === "rojo" ? "#ef4444" : nivelRiesgo(m.diasProm) === "naranja" ? "#f97316" : "#94a3b8" }}>
                          {m.diasProm}
                        </td>
                        <td style={{ padding: "7px 8px", textAlign: "right", color: "#cbd5e1" }}>{fmt(m.costoTotal)}</td>
                        <td style={{ padding: "7px 8px", textAlign: "right", color: "#f97316" }}>{fmt(planPisoModelo)}</td>
                        <td style={{ padding: "7px 8px", textAlign: "right" }}>
                          <VentasTriInput
                            value={vTrim}
                            onChange={async (v) => {
                              const updated = { ...ventasTrim, [modeloKey]: v };
                              setVentasTrim(updated);
                              await fbSet(`${INVENTARIO_PATH}/ventasTrim`, updated);
                            }}
                          />
                        </td>
                        <td style={{ padding: "7px 8px", textAlign: "right", color: "#3b9eea", fontWeight: 700 }}>
                          {stockIdeal !== null ? stockIdeal : "—"}
                        </td>
                        <td style={{ padding: "7px 8px", textAlign: "right", fontWeight: 700 }}>
                          {diferencia !== null ? (
                            <span style={{ color: diferencia > 0 ? "#f97316" : diferencia < 0 ? "#4ade80" : "#64748b" }}>
                              {diferencia > 0 ? `+${diferencia} excedente` : diferencia < 0 ? `${Math.abs(diferencia)} faltante` : "OK"}
                            </span>
                          ) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ color: "#475569", fontSize: 11, marginTop: 10 }}>
              🟠 Excedente = tienes más stock del necesario · 🟢 Faltante = necesitas pedir más unidades
            </div>
          </Card>
          {/* ── Análisis IA de Inventario ─────────────────────────────────── */}
          <AnalisisIABlock
            titulo="ANÁLISIS DE INVENTARIO CON IA"
            subtitulo="🧠 Generar análisis de inventario"
            loadingLabel="Analizando inventario…"
            buildPrompt={() => {
              const hoy = new Date();
              const criticas = unidades.filter(u => nivelRiesgo(u.dias) === "rojo");
              const urgentes = unidades.filter(u => nivelRiesgo(u.dias) === "naranja");
              const conDanio = unidades.filter(u => u.danio);
              const totalPP = unidades.reduce((s, u) => s + costoPlanPiso(u.costoFactura, u.dias, tiie, spread), 0);
              const fmt = (n) => `$${Math.round(n).toLocaleString("es-MX")}`;
              const porAgencia = {};
              AGENCIAS.forEach(ag => {
                const uds = unidades.filter(u => u.agencia === ag);
                porAgencia[ag] = {
                  total: uds.length,
                  criticas: uds.filter(u => nivelRiesgo(u.dias) === "rojo").length,
                  costoTotal: uds.reduce((s, u) => s + u.costoFactura, 0),
                  planPiso: uds.reduce((s, u) => s + costoPlanPiso(u.costoFactura, u.dias, tiie, spread), 0),
                };
              });
              const lineas = [];
              lineas.push(`Eres el asesor financiero y comercial de CHESA Changan, grupo de 5 agencias en Chiapas.`);
              lineas.push(`Analiza el estado del inventario y genera recomendaciones ejecutivas concretas.\n`);
              lineas.push(`PARÁMETROS: TIIE ${tiie}% + spread ${spread}% = ${(tiie+spread).toFixed(2)}% anual para plan piso`);
              lineas.push(`FECHA DE ANÁLISIS: ${hoy.toLocaleDateString("es-MX")}\n`);
              lineas.push(`RESUMEN GLOBAL:`);
              lineas.push(`- Total unidades: ${unidades.length}`);
              lineas.push(`- Valor total inventario: ${fmt(unidades.reduce((s,u)=>s+u.costoFactura,0))}`);
              lineas.push(`- Costo plan piso acumulado: ${fmt(totalPP)}`);
              lineas.push(`- Días promedio en inventario: ${Math.round(unidades.reduce((s,u)=>s+u.dias,0)/unidades.length)}`);
              lineas.push(`- Unidades críticas (>120 días): ${criticas.length}`);
              lineas.push(`- Unidades urgentes (91-120 días): ${urgentes.length}`);
              lineas.push(`- Unidades con daño reportado: ${conDanio.length}\n`);
              lineas.push(`POR AGENCIA:`);
              Object.entries(porAgencia).forEach(([ag, d]) => {
                lineas.push(`  ${ag}: ${d.total} uds, ${d.criticas} críticas, costo ${fmt(d.costoTotal)}, plan piso acum. ${fmt(d.planPiso)}`);
              });
              lineas.push(`\nUNIDADES CRÍTICAS (>120 días, ordenadas por antigüedad):`);
              criticas.sort((a,b)=>b.dias-a.dias).slice(0,15).forEach(u => {
                lineas.push(`  - ${u.modelo} | ${u.color} | ${u.dias} días | ${fmt(u.costoFactura)} | Plan piso: ${fmt(costoPlanPiso(u.costoFactura,u.dias,tiie,spread))} | ${u.agencia}${u.danio ? ` | DAÑO: ${u.danio}` : ""}`);
              });
              lineas.push(`\nUNIDADES CON DAÑO PENDIENTE:`);
              conDanio.forEach(u => {
                lineas.push(`  - ${u.modelo} | ${u.dias} días | ${u.agencia} | ${u.danio}`);
              });
              lineas.push(`\nSTOCK VS DEMANDA (último trimestre):`);
              modelosOrdenados.forEach(m => {
                const modeloKey = m.modelo.replace(/[^a-zA-Z0-9]/g,"_");
                const vTrim = ventasTrim[modeloKey] ?? 0;
                const ideal = vTrim > 0 ? Math.ceil(vTrim/3*1.5) : null;
                const dif = ideal !== null ? m.cantidad - ideal : null;
                const estado = dif === null ? "sin referencia" : dif > 3 ? `EXCEDENTE +${dif}` : dif < -1 ? `FALTANTE ${dif}` : "OK";
                lineas.push(`  ${m.modelo}: stock ${m.cantidad} uds (${m.diasProm} días prom) | ventas trim ${vTrim} | ideal ${ideal ?? "—"} | ${estado}`);
              });
              lineas.push(`\nPREGUNTAS A RESPONDER:`);
              lineas.push(`1. ¿Cuáles son las 3 acciones más urgentes para reducir el costo financiero esta semana?`);
              lineas.push(`2. ¿Qué modelos tienen riesgo real de depreciación o pérdida y qué hacer con ellos?`);
              lineas.push(`3. ¿Qué comprar en la próxima orden y qué modelos evitar?`);
              lineas.push(`4. ¿Hay alguna agencia con un problema de inventario específico que requiera atención inmediata?`);
              lineas.push(`Responde en formato markdown, directo y ejecutivo. Sin relleno.`);
              return lineas.join("\n");
            }}
          />
        </>
      )}
    </div>
  );
}

// Input simple para ventas del trimestre en la tabla de compra mensual
function VentasTriInput({ value, onChange }) {
  const [local, setLocal] = useState(String(value || 0));
  useEffect(() => setLocal(String(value || 0)), [value]);
  return (
    <input
      type="number" min={0} value={local}
      onChange={e => setLocal(e.target.value)}
      onBlur={() => { const n = Number(local); if (!isNaN(n)) onChange(n); }}
      onKeyDown={e => { if (e.key === "Enter") { const n = Number(local); if (!isNaN(n)) onChange(n); } }}
      style={{ width: 65, background: "#0d1b2e", border: "1px solid #3b9eea", color: "#3b9eea", borderRadius: 4, padding: "2px 6px", fontSize: 12, textAlign: "center", outline: "none" }}
    />
  );
}


// Calcula el valor agregado (un solo número) de un indicador a partir del objeto "data" de un mes.
function computeIndicadorValue(indicador, data, agencia) {
  const agencias = agencia === "TOTAL" ? AGENCIAS : [agencia];
  switch (indicador) {
    case "ventas": {
      return agencias.reduce((s, a) => s + (data.ventasJunioInterno?.[a]?.facturado ?? 0), 0);
    }
    case "ssi": {
      const vals = agencias.map(a => data.ssi?.[a]?.ssi ?? 0).filter(v => v > 0);
      return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
    }
    case "csi": {
      const vals = agencias.map(a => data.csi?.[a]?.csi ?? 0).filter(v => v > 0);
      return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
    }
    case "ms": {
      const totalVentas = agencias.reduce((s, a) => s + (data.msMayo?.[a]?.real ?? 0), 0);
      const totalTiv = agencias.reduce((s, a) => s + (data.msMayo?.[a]?.tiv ?? 0), 0);
      return totalTiv > 0 ? (totalVentas / totalTiv) * 100 : 0;
    }
    default:
      return 0;
  }
}

const INDICADORES_TENDENCIA = [
  { key: "ventas", label: "Ventas",   suffix: "", agenciasValidas: AGENCIAS },
  { key: "ssi",     label: "SSI",      suffix: "%", agenciasValidas: ["TUXTLA", "TAPACHULA", "OCOSINGO"] },
  { key: "csi",     label: "CSI",      suffix: "%", agenciasValidas: ["TUXTLA", "TAPACHULA"] },
  { key: "ms",      label: "Market Share (%)", suffix: "%", agenciasValidas: AGENCIAS },
];

function LineChart({ series, width = 760, height = 220, suffix = "" }) {
  // series: [{ label, color, points: [{x: label, y: number}] }]
  const allY = series.flatMap(s => s.points.map(p => p.y));
  const maxY = Math.max(1, ...allY);
  const minY = Math.min(0, ...allY);
  const padding = { top: 24, right: 16, bottom: 28, left: 40 };
  const w = width - padding.left - padding.right;
  const h = height - padding.top - padding.bottom;
  const n = series[0]?.points.length ?? 0;
  const xStep = n > 1 ? w / (n - 1) : 0;
  const yScale = (val) => padding.top + h - ((val - minY) / (maxY - minY || 1)) * h;
  const xScale = (i) => padding.left + i * xStep;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ maxWidth: width }}>
      {/* Líneas guía horizontales */}
      {[0, 0.25, 0.5, 0.75, 1].map(f => {
        const y = padding.top + h * f;
        const val = maxY - (maxY - minY) * f;
        return (
          <g key={f}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#1e3a5f" strokeWidth="1" />
            <text x={padding.left - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#64748b">{val.toFixed(0)}{suffix}</text>
          </g>
        );
      })}
      {/* Etiquetas de eje X (cada 2 puntos para no saturar) */}
      {series[0]?.points.map((p, i) => (
        (i % Math.ceil(n / 8 || 1) === 0) && (
          <text key={i} x={xScale(i)} y={height - 8} textAnchor="middle" fontSize="9" fill="#64748b">{p.x}</text>
        )
      ))}
      {/* Líneas de cada serie, con el valor numérico visible sobre cada punto */}
      {series.map((s, si) => {
        const pathD = s.points.map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(p.y)}`).join(" ");
        // Si hay más de una serie, alternamos el offset vertical de las etiquetas para que no se encimen.
        const labelOffsetY = series.length > 1 ? (si === 0 ? -10 : 16) : -10;
        return (
          <g key={si}>
            <path d={pathD} fill="none" stroke={s.color} strokeWidth="2.5" />
            {s.points.map((p, i) => (
              <g key={i}>
                <circle cx={xScale(i)} cy={yScale(p.y)} r="3" fill={s.color}>
                  <title>{`${s.label} — ${p.x}: ${p.y.toFixed(1)}${suffix}`}</title>
                </circle>
                <text
                  x={xScale(i)}
                  y={yScale(p.y) + labelOffsetY}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="700"
                  fill={s.color}
                >
                  {p.y.toFixed(suffix === "%" ? 1 : 0)}{suffix}
                </text>
              </g>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

// ── SECCIÓN: Market Share ADACH ──────────────────────────────────────────────
const ADACH_PATH = "adachReportes"; // adachReportes/{mesKey} = { datos, analisis, fechaCarga }

// Prompt para que la IA extraiga datos estructurados del PDF de ADACH
function buildPromptExtraccionADACH(mesLabel) {
  return `Eres un extractor de datos estructurados. Se te proporciona el reporte mensual de ADACH (Asociación de Distribuidores de Automóviles de Chiapas) correspondiente a ${mesLabel}.

Extrae EXACTAMENTE los siguientes datos del PDF y responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown, sin explicaciones:

{
  "mes": "YYYY-MM",
  "mercadoTotal": <número de unidades vendidas en el mes>,
  "mercadoTotalAnterior": <número de unidades mismo mes año anterior>,
  "variacionVsMesAnterior": <porcentaje de variación vs mes anterior (número, puede ser negativo)>,
  "variacionVsAnioAnterior": <porcentaje vs mismo mes año anterior (número)>,
  "proyeccionCierreAnio": <número proyectado de unidades al cierre del año>,
  "tendenciaAnio": <porcentaje de tendencia al cierre (número, puede ser negativo)>,
  "changanUnidades": <unidades vendidas por Changan en el mes>,
  "changanShare": <porcentaje de market share de Changan (número)>,
  "marcasEmergentesTotal": <total unidades segmento marcas emergentes/chinas>,
  "marcasEmergentesShare": <porcentaje del mercado total (número)>,
  "topMarcas": [
    {"marca": "NISSAN", "unidades": <número>, "share": <número>},
    {"marca": "VOLKSWAGEN", "unidades": <número>, "share": <número>},
    {"marca": "GM", "unidades": <número>, "share": <número>},
    {"marca": "TOYOTA", "unidades": <número>, "share": <número>},
    {"marca": "STELLANTIS", "unidades": <número>, "share": <número>}
  ],
  "competidoresChinos": [
    {"marca": "MG", "unidades": <número>},
    {"marca": "JAC", "unidades": <número>},
    {"marca": "CHIREY", "unidades": <número>},
    {"marca": "JETOUR", "unidades": <número>},
    {"marca": "CHANGAN", "unidades": <número>},
    {"marca": "GWM", "unidades": <número>}
  ],
  "ventasPorCiudad": [
    {"ciudad": "Tuxtla", "unidades": <número>, "pct": <número>},
    {"ciudad": "Tapachula", "unidades": <número>, "pct": <número>},
    {"ciudad": "San Cristóbal", "unidades": <número>, "pct": <número>},
    {"ciudad": "Comitán", "unidades": <número>, "pct": <número>},
    {"ciudad": "Ocosingo", "unidades": <número>, "pct": <número>}
  ]
}

Si algún dato no aparece en el PDF, usa null. No uses comas en los números. No incluyas texto fuera del JSON.`;
}

function buildPromptAnalisisADACH(datos, mesLabel) {
  return `${CONTEXTO_CHESA}

Eres el asesor comercial de CHESA Changan. Analiza los siguientes datos del mercado automotriz de Chiapas correspondientes a ${mesLabel} (Fuente: ADACH) y genera un análisis ejecutivo conciso para el Director de Marca.

DATOS DEL MERCADO:
- Mercado total Chiapas: ${datos.mercadoTotal} unidades (${datos.variacionVsAnioAnterior >= 0 ? '+' : ''}${datos.variacionVsAnioAnterior}% vs mismo mes año anterior)
- Proyección cierre 2026: ${datos.proyeccionCierreAnio} unidades (tendencia ${datos.tendenciaAnio >= 0 ? '+' : ''}${datos.tendenciaAnio}%)
- Changan/CHESA: ${datos.changanUnidades} unidades (${datos.changanShare}% del mercado total)
- Segmento emergentes: ${datos.marcasEmergentesTotal} unidades (${datos.marcasEmergentesShare}% del mercado)
- Competidores chinos directos: ${datos.competidoresChinos?.map(c => `${c.marca}: ${c.unidades}`).join(', ')}

Responde con markdown. Sé directo y ejecutivo. Estructura:
## Posición de CHESA en el mercado
## Contexto competitivo
## Lo que esto implica para CHESA este mes
(máximo 3 párrafos cortos en total)`;
}

// Prompt para que la IA extraiga datos estructurados del PDF nacional AMIA/INEGI
function buildPromptExtraccionNacional(mesLabel, mesNum) {
  const mesNombre = MES_NOMBRES[mesNum - 1];
  return `Eres un extractor de datos estructurados. Se te proporciona el reporte mensual de ventas de vehículos ligeros a nivel NACIONAL de México (Fuente: INEGI RAIAVL + AMIA/AMDA) correspondiente a ${mesLabel}.

Extrae EXACTAMENTE los siguientes datos del PDF y responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin markdown, sin explicaciones. El campo "${mesNombre}" en cada marca representa las ventas del mes de ${mesNombre}:

{
  "mercadoTotal": <unidades vendidas a nivel nacional en el mes de ${mesNombre}>,
  "mercadoTotalMesAnterior": <unidades del mes inmediato anterior, o null>,
  "variacionVs2025": <porcentaje de variación del mes vs mismo mes año anterior (número, puede ser negativo)>,
  "acumuladoAnio": <unidades acumuladas enero a ${mesNombre} 2026>,
  "acumuladoAnio2025": <unidades acumuladas enero a ${mesNombre} 2025, o null>,
  "variacionAcumulada": <porcentaje del acumulado 2026 vs 2025 (número)>,
  "changan": {
    "${mesNombre}": <ventas de Changan en el mes>,
    "acumulado": <ventas acumuladas de Changan ene-${mesNombre} 2026>,
    "variacion": <porcentaje del mes vs mismo mes 2025 (número)>,
    "variacionAcum": <porcentaje del acumulado vs 2025 (número)>
  },
  "topMarcas": [
    {"marca": "Nissan", "${mesNombre}": <número>, "acumulado": <número>, "share": <porcentaje del acumulado, número>}
  ],
  "fuente": "INEGI RAIAVL + AMIA/AMDA · ${mesLabel}"
}

INSTRUCCIONES IMPORTANTES:
- En "topMarcas" incluye TODAS las marcas principales que aparezcan en el reporte (Nissan, General Motors, Volkswagen, Toyota, KIA, Mazda, Stellantis, MG Motor, Hyundai, Ford, Changan, JAC, Geely, Renault y cualquier otra relevante).
- IMPORTANTE: cada objeto de marca DEBE usar la clave literal "${mesNombre}" para las ventas del mes (no "mes" ni "ventas").
- Incluye siempre a Changan tanto en el objeto "changan" como dentro de "topMarcas".
- Si algún dato no aparece, usa null. No uses comas en los números. No incluyas texto fuera del JSON.`;
}

// Prompt para el análisis narrativo del mercado nacional (contexto para CHESA)
function buildPromptAnalisisNacional(datos, mesLabel, mesNombre) {
  const val = (o) => o?.mes ?? o?.[mesNombre] ?? o?.junio ?? null;
  const topStr = (datos.topMarcas || [])
    .slice()
    .sort((a, b) => (val(b) ?? 0) - (val(a) ?? 0))
    .slice(0, 12)
    .map(m => `${m.marca}: ${val(m)} en el mes, ${m.acumulado ?? "N/D"} acum (${m.share != null ? m.share + "%" : "N/D"})`)
    .join("\n");

  return `${CONTEXTO_CHESA}

Eres el asesor comercial de CHESA Changan. Analiza los siguientes datos del mercado automotriz NACIONAL de México correspondientes a ${mesLabel} (Fuente: INEGI RAIAVL + AMIA/AMDA) y genera un análisis ejecutivo conciso para el Director de Marca, siempre conectándolo con lo que significa para CHESA (único distribuidor Changan en Chiapas).

DATOS DEL MERCADO NACIONAL:
- Mercado total nacional: ${datos.mercadoTotal} unidades en el mes (${datos.variacionVs2025 >= 0 ? '+' : ''}${datos.variacionVs2025}% vs mismo mes año anterior)
- Acumulado del año: ${datos.acumuladoAnio} unidades (${datos.variacionAcumulada >= 0 ? '+' : ''}${datos.variacionAcumulada}% vs año anterior)
- Changan nacional: ${val(datos.changan)} unidades en el mes (${datos.changan?.variacion >= 0 ? '+' : ''}${datos.changan?.variacion}% vs año ant.), ${datos.changan?.acumulado} acumulado (${datos.changan?.variacionAcum >= 0 ? '+' : ''}${datos.changan?.variacionAcum}% vs año ant.)

RANKING DE MARCAS (mes):
${topStr}

Responde con markdown. Sé directo y ejecutivo. Estructura:
## Cómo va Changan a nivel nacional
## Qué está pasando en el mercado
## Qué significa para CHESA en Chiapas
(máximo 3 párrafos cortos en total, conectando siempre la tendencia nacional de Changan con la operación local de CHESA)`;
}

// Datos nacionales AMIA/INEGI hardcodeados — se actualizan manualmente cada mes
// Fuente: RAIAVL INEGI + AMIA/AMDA reporte mensual
const DATOS_NACIONALES = {
  "2026-06": {
    mercadoTotal: 126778,
    mercadoTotalMesAnterior: 127107,
    variacionVs2025: 7.6,
    acumuladoAnio: 754394,
    acumuladoAnio2025: 716299,
    variacionAcumulada: 5.3,
    changan: { junio: 2008, acumulado: 11325, variacion: 25.4, variacionAcum: 56.8 },
    topMarcas: [
      { marca: "Nissan",         junio: 19279, acumulado: 127099, share: 16.8 },
      { marca: "General Motors", junio: 14904, acumulado: 96941,  share: 12.9 },
      { marca: "Volkswagen",     junio: 14038, acumulado: 82612,  share: 11.0 },
      { marca: "Toyota",         junio: 10662, acumulado: 62129,  share: 8.2  },
      { marca: "KIA",            junio: 9506,  acumulado: 54852,  share: 7.3  },
      { marca: "Mazda",          junio: 9328,  acumulado: 52010,  share: 6.9  },
      { marca: "Stellantis",     junio: 8055,  acumulado: 48748,  share: 6.5  },
      { marca: "MG Motor",       junio: 4873,  acumulado: 27800,  share: 3.7  },
      { marca: "Hyundai",        junio: 4980,  acumulado: 26434,  share: 3.5  },
      { marca: "Ford",           junio: 4600,  acumulado: 25019,  share: 3.3  },
      { marca: "Changan",        junio: 2008,  acumulado: 11325,  share: 1.5  },
      { marca: "JAC",            junio: 2001,  acumulado: 11468,  share: 1.5  },
      { marca: "Geely",          junio: 4103,  acumulado: 23121,  share: 3.1  },
      { marca: "Renault",        junio: 3976,  acumulado: 17316,  share: 2.3  },
    ],
    fuente: "INEGI RAIAVL + AMIA/AMDA · 2 de julio de 2026",
  },
};

const NACIONAL_PATH = "mercadoNacional"; // mercadoNacional/{mesKey}

function MercadoADACHSection({ monthKey }) {
  const [cargando, setCargando] = useState(false);
  const [loadingDatos, setLoadingDatos] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [reportesMes, setReportesMes] = useState({}); // { mesKey: { datos, analisis, fechaCarga } }
  const [mesVista, setMesVista] = useState(null);
  const [vistaActiva, setVistaActiva] = useState("chiapas"); // chiapas | nacional
  const fileInputRef = useRef(null);
  const fileInputNacionalRef = useRef(null);
  const [cargandoNacional, setCargandoNacional] = useState(false);
  const [errorCargaNacional, setErrorCargaNacional] = useState("");
  const [mesNacionalSel, setMesNacionalSel] = useState(null); // mes elegido para ver en la vista nacional

  useEffect(() => {
    (async () => {
      setLoadingDatos(true);
      const raw = await fbGet(ADACH_PATH);
      if (raw && typeof raw === "object") {
        setReportesMes(raw);
        // Seleccionar el mes más reciente disponible
        const meses = Object.keys(raw).sort().reverse();
        if (meses.length > 0) setMesVista(meses[0]);
      }
      setLoadingDatos(false);
    })();
  }, []);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorCarga("Por favor sube un archivo PDF del reporte ADACH.");
      return;
    }
    setCargando(true); setErrorCarga("");
    try {
      // Leer PDF como base64
      const base64 = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result.split(",")[1]);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });

      // Determinar mes del reporte desde el nombre del archivo o fecha actual
      const mesKey = monthKey; // usar el mes seleccionado en el dashboard
      const mesLabel = getMonthLabel(mesKey);

      // Paso 1: Extraer datos estructurados
      const extractResponse = await fetch("/api/analisis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: buildPromptExtraccionADACH(mesLabel),
          pdf: base64,
        }),
      });
      const extractData = await extractResponse.json();
      if (!extractResponse.ok) throw new Error(extractData.error || "Error al extraer datos");

      // Parsear JSON del texto de respuesta
      let texto = extractData.text || "";
      texto = texto.replace(/```json|```/g, "").trim();
      const datos = JSON.parse(texto);

      // Paso 2: Generar análisis narrativo
      const analisisResponse = await fetch("/api/analisis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: buildPromptAnalisisADACH(datos, mesLabel) }),
      });
      const analisisData = await analisisResponse.json();
      const analisis = analisisData.text || "";

      // Guardar en Firebase
      const payload = { datos, analisis, fechaCarga: new Date().toISOString() };
      await fbSet(`${ADACH_PATH}/${mesKey}`, payload);
      setReportesMes(prev => ({ ...prev, [mesKey]: payload }));
      setMesVista(mesKey);
    } catch (err) {
      console.error(err);
      setErrorCarga(`Error procesando el PDF: ${err.message}. Verifica que sea un reporte ADACH válido.`);
    } finally {
      setCargando(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Carga del PDF nacional AMIA/INEGI ──────────────────────────────────────
  const handleFileNacional = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorCargaNacional("Por favor sube un archivo PDF del reporte nacional (AMIA/INEGI).");
      return;
    }
    setCargandoNacional(true); setErrorCargaNacional("");
    try {
      const base64 = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result.split(",")[1]);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });

      const mesKey = monthKey; // usa el mes seleccionado arriba en el dashboard
      const mesLabel = getMonthLabel(mesKey);
      const mesNum = getMonthNumFromKey(mesKey);
      const mesNombre = MES_NOMBRES[mesNum - 1];

      const extractResponse = await fetch("/api/analisis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: buildPromptExtraccionNacional(mesLabel, mesNum),
          pdf: base64,
        }),
      });
      const extractData = await extractResponse.json();
      if (!extractResponse.ok) throw new Error(extractData.error || "Error al extraer datos");

      let texto = extractData.text || "";
      texto = texto.replace(/```json|```/g, "").trim();
      const datosNac = JSON.parse(texto);

      // Normalizar la clave del mes a "mes" genérico, para que la UI funcione
      // con cualquier mes (no solo junio). Conservamos también la clave original.
      if (datosNac.changan) {
        datosNac.changan.mes = datosNac.changan[mesNombre] ?? datosNac.changan.mes ?? datosNac.changan.junio ?? null;
      }
      if (Array.isArray(datosNac.topMarcas)) {
        datosNac.topMarcas.forEach(m => {
          m.mes = m[mesNombre] ?? m.mes ?? m.junio ?? null;
        });
      }
      if (!datosNac.fuente) datosNac.fuente = `INEGI RAIAVL + AMIA/AMDA · ${mesLabel}`;

      // Paso 2: generar análisis narrativo y guardarlo dentro del mismo objeto.
      try {
        const analisisResponse = await fetch("/api/analisis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: buildPromptAnalisisNacional(datosNac, mesLabel, mesNombre) }),
        });
        const analisisData = await analisisResponse.json();
        if (analisisResponse.ok) {
          datosNac._analisis = analisisData.text || "";
          datosNac._analisisFecha = new Date().toISOString();
        }
      } catch (errAnalisis) {
        console.error("No se pudo generar el análisis nacional:", errAnalisis);
        // El análisis es opcional: si falla, se guardan los datos igual.
      }

      await fbSet(`${NACIONAL_PATH}/${mesKey}`, datosNac);
      setDatosNacionales(prev => ({ ...prev, [mesKey]: datosNac }));
      setMesNacionalSel(mesKey);
    } catch (err) {
      console.error(err);
      setErrorCargaNacional(`Error procesando el PDF nacional: ${err.message}. Verifica que sea un reporte AMIA/INEGI válido.`);
    } finally {
      setCargandoNacional(false);
      if (fileInputNacionalRef.current) fileInputNacionalRef.current.value = "";
    }
  };

  const mesesDisponibles = Object.keys(reportesMes).sort().reverse();
  const reporte = mesVista ? reportesMes[mesVista] : null;
  const datos = reporte?.datos;

  const fmt = (n) => n != null ? Number(n).toLocaleString("es-MX") : "—";
  const fmtPct = (n, signo = true) => n != null ? `${signo && n > 0 ? "+" : ""}${Number(n).toFixed(1)}%` : "—";
  const colorVar = (n) => n == null ? "#64748b" : n >= 0 ? "#4ade80" : "#ef4444";

  // Colores para gráfica de competidores
  const COLORES_MARCAS = {
    CHANGAN: "#D4AF37", MG: "#3b9eea", JAC: "#c084fc",
    CHIREY: "#fb923c", JETOUR: "#4ade80", GWM: "#f472b6",
  };

  // Datos nacionales: primero busca en Firebase, luego en el objeto hardcodeado
  const [datosNacionales, setDatosNacionales] = useState(DATOS_NACIONALES);
  useEffect(() => {
    (async () => {
      const raw = await fbGet(NACIONAL_PATH);
      if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
        setDatosNacionales(prev => ({ ...DATOS_NACIONALES, ...raw }));
      }
    })();
  }, []);

  if (loadingDatos) return <Card><div style={{ color: "#64748b", textAlign: "center", padding: "40px 0" }}>Cargando datos…</div></Card>;

  // ── Vista Nacional ────────────────────────────────────────────────────────
  const mesesNacional = Object.keys(datosNacionales).sort().reverse();
  const mesNacVista = mesNacionalSel && datosNacionales[mesNacionalSel]
    ? mesNacionalSel
    : (mesesNacional[0] || "2026-06");
  const dnac = datosNacionales[mesNacVista];

  // Etiquetas dinámicas según el mes en vista (ya no hardcodeado a junio)
  const nacMesNum = getMonthNumFromKey(mesNacVista);
  const nacMesNombre = MES_NOMBRES[nacMesNum - 1] || "";
  const nacMesAbrev = nacMesNombre.slice(0, 3);
  const nacMesCap = nacMesNombre.charAt(0).toUpperCase() + nacMesNombre.slice(1);
  const nacAnio = getYearFromKey(mesNacVista);
  const nacAnioPrev = String(parseInt(nacAnio, 10) - 1);
  // Lee el valor del mes de una marca/objeto, tolerando la clave nombrada o la genérica "mes",
  // y "junio" para los datos hardcodeados originales.
  const valMes = (obj) => obj?.mes ?? obj?.[nacMesNombre] ?? obj?.junio ?? null;

  const VistaAnualNacional = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── Cabecera: carga de PDF nacional + selector de mes ──────────────── */}
      <Card>
        <SectionHeader title="MERCADO AUTOMOTRIZ NACIONAL — REPORTE AMIA/INEGI" icon="🇲🇽" />
        <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <input ref={fileInputNacionalRef} type="file" accept=".pdf" onChange={handleFileNacional} style={{ display: "none" }} id="file-nacional" />
            <label htmlFor="file-nacional" style={{
              background: cargandoNacional ? "#1e3a5f" : "#D4AF37", color: cargandoNacional ? "#64748b" : "#0a1628",
              border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700,
              cursor: cargandoNacional ? "default" : "pointer", display: "inline-block"
            }}>
              {cargandoNacional ? "📊 Procesando PDF con IA…" : "📤 Subir reporte nacional (.pdf)"}
            </label>
            <div style={{ color: "#475569", fontSize: 11, marginTop: 6 }}>
              La IA extraerá automáticamente los datos del mes seleccionado arriba ({getMonthLabel(monthKey)})
            </div>
          </div>

          {mesesNacional.length > 0 && (
            <div>
              <div style={{ color: "#64748b", fontSize: 10.5, fontWeight: 700, marginBottom: 6 }}>MES EN VISTA</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {mesesNacional.map(m => (
                  <button key={m} onClick={() => setMesNacionalSel(m)} style={{
                    background: mesNacVista === m ? "#3b9eea" : "#0f2239",
                    color: mesNacVista === m ? "#0a1628" : "#94a3b8",
                    border: `1px solid ${mesNacVista === m ? "#3b9eea" : "#1e3a5f"}`,
                    borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer"
                  }}>{getMonthLabel(m)}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {errorCargaNacional && (
          <div style={{ background: "#dc262622", border: "1px solid #f87171", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 13, marginTop: 12 }}>
            {errorCargaNacional}
          </div>
        )}
        {cargandoNacional && (
          <div style={{ background: "#3b9eea11", border: "1px solid #3b9eea33", borderRadius: 8, padding: "12px 16px", marginTop: 12, color: "#94a3b8", fontSize: 13 }}>
            🧠 La IA está leyendo el PDF y extrayendo las ventas por marca… esto toma ~15-20 segundos.
          </div>
        )}
      </Card>

      <Card>
        <SectionHeader title={`MERCADO NACIONAL — ${nacMesCap.toUpperCase()} ${nacAnio}`} icon="🇲🇽" />
        <div style={{ color: "#475569", fontSize: 11, marginBottom: 14 }}>
          Fuente: {dnac?.fuente || "INEGI RAIAVL + AMIA/AMDA"}
        </div>

        {/* KPIs nacionales */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: 12, marginBottom: 20 }}>
          {[
            { label: `VENTAS ${nacMesCap.toUpperCase()} ${nacAnio}`, value: fmt(dnac?.mercadoTotal), sub: `${fmtPct(dnac?.variacionVs2025)} vs ${nacMesAbrev} ${nacAnioPrev}`, color: "#3b9eea", varN: dnac?.variacionVs2025 },
            { label: `ACUMULADO ENE-${nacMesAbrev.toUpperCase()} ${nacAnio}`, value: fmt(dnac?.acumuladoAnio), sub: `${fmtPct(dnac?.variacionAcumulada)} vs ${nacAnioPrev}`, color: "#4ade80", varN: dnac?.variacionAcumulada },
            { label: `CHANGAN — ${nacMesCap.toUpperCase()}`, value: fmt(valMes(dnac?.changan)), sub: `${fmtPct(dnac?.changan?.variacion)} vs ${nacMesAbrev} ${nacAnioPrev}`, color: "#D4AF37", varN: dnac?.changan?.variacion },
            { label: "CHANGAN — ACUMULADO", value: fmt(dnac?.changan?.acumulado), sub: `${fmtPct(dnac?.changan?.variacionAcum)} vs ${nacAnioPrev}`, color: "#D4AF37", varN: dnac?.changan?.variacionAcum },
          ].map(k => (
            <div key={k.label} style={{ background: "#0f2239", border: "1px solid #1e3a5f", borderTop: `3px solid ${k.color}`, borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700, letterSpacing: .8 }}>{k.label}</div>
              <div style={{ color: "#f1f5f9", fontSize: 20, fontWeight: 900, marginTop: 4 }}>{k.value}</div>
              <div style={{ color: colorVar(k.varN), fontSize: 11, marginTop: 3, fontWeight: 700 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabla marcas nacionales */}
        <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 10, letterSpacing: .8 }}>TOP MARCAS — VENTAS NACIONALES {nacMesCap.toUpperCase()} {nacAnio} VS {nacAnioPrev}</p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr style={{ color: "#64748b", fontSize: 11, borderBottom: "1px solid #1e3a5f" }}>
                <th style={{ textAlign: "left", padding: "6px 8px" }}>MARCA</th>
                <th style={{ textAlign: "right", padding: "6px 8px" }}>{nacMesAbrev.toUpperCase()} {nacAnio}</th>
                <th style={{ textAlign: "right", padding: "6px 8px" }}>ACUM. ENE-{nacMesAbrev.toUpperCase()}</th>
                <th style={{ textAlign: "right", padding: "6px 8px" }}>SHARE ENE-{nacMesAbrev.toUpperCase()}</th>
              </tr>
            </thead>
            <tbody>
              {(dnac?.topMarcas || []).slice().sort((a, b) => (valMes(b) ?? 0) - (valMes(a) ?? 0)).map((m, i) => {
                const esChangan = m.marca === "Changan";
                return (
                  <tr key={m.marca} style={{ borderBottom: "1px solid #1e3a5f", background: esChangan ? "#D4AF3708" : "transparent" }}>
                    <td style={{ padding: "7px 8px", color: esChangan ? "#D4AF37" : "#f1f5f9", fontWeight: esChangan ? 800 : 600 }}>
                      {i + 1}. {m.marca} {esChangan ? "★" : ""}
                    </td>
                    <td style={{ textAlign: "right", padding: "7px 8px", color: esChangan ? "#D4AF37" : "#cbd5e1", fontWeight: esChangan ? 700 : 400 }}>
                      {fmt(valMes(m))}
                    </td>
                    <td style={{ textAlign: "right", padding: "7px 8px", color: "#94a3b8" }}>{fmt(m.acumulado)}</td>
                    <td style={{ textAlign: "right", padding: "7px 8px", color: esChangan ? "#D4AF37" : "#64748b", fontWeight: esChangan ? 700 : 400 }}>
                      {m.share ? `${m.share.toFixed(1)}%` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Contexto Changan nacional */}
        <div style={{ marginTop: 16, background: "#D4AF3711", border: "1px solid #D4AF3733", borderRadius: 8, padding: "12px 16px" }}>
          <div style={{ color: "#D4AF37", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>★ CHANGAN EN EL MERCADO NACIONAL</div>
          <div style={{ color: "#cbd5e1", fontSize: 12.5, lineHeight: 1.7 }}>
            En {nacMesNombre} {nacAnio}, Changan vendió <b style={{ color: "#D4AF37" }}>{fmt(valMes(dnac?.changan))} unidades</b> a nivel nacional ({fmtPct(dnac?.changan?.variacion)} vs {nacMesAbrev} {nacAnioPrev}),
            acumulando <b style={{ color: "#D4AF37" }}>{fmt(dnac?.changan?.acumulado)} unidades</b> en el año ({fmtPct(dnac?.changan?.variacionAcum)} vs {nacAnioPrev}).
            El mercado total de {nacMesNombre} fue <b style={{ color: "#3b9eea" }}>{fmt(dnac?.mercadoTotal)} unidades</b> ({fmtPct(dnac?.variacionVs2025)} vs {nacMesAbrev} {nacAnioPrev}),
            con un acumulado de <b style={{ color: "#3b9eea" }}>{fmt(dnac?.acumuladoAnio)} unidades</b> ({fmtPct(dnac?.variacionAcumulada)} vs {nacAnioPrev}).
            CHESA representa el <b style={{ color: "#D4AF37" }}>100% de las ventas Changan en Chiapas</b>.
          </div>
        </div>
      </Card>

      {/* ── Análisis narrativo nacional ──────────────────────────────────── */}
      {dnac?._analisis && (
        <Card>
          <SectionHeader title="ANÁLISIS NACIONAL — CONTEXTO PARA CHESA" icon="🧠" />
          <div style={{ color: "#475569", fontSize: 11, marginBottom: 14 }}>
            Generado por IA · Fuente: Reporte AMIA/INEGI {getMonthLabel(mesNacVista)}
            {dnac._analisisFecha ? ` · Cargado: ${new Date(dnac._analisisFecha).toLocaleDateString("es-MX")}` : ""}
          </div>
          <div style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", borderRadius: 8, padding: "18px 20px" }}>
            {renderMarkdownGlobal(dnac._analisis)}
          </div>
        </Card>
      )}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Selector de vista ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 8 }}>
        {[
          { key: "chiapas",  label: "🗺️ Mercado Chiapas (ADACH)" },
          { key: "nacional", label: "🇲🇽 Mercado Nacional (AMIA/INEGI)" },
        ].map(v => (
          <button key={v.key} onClick={() => setVistaActiva(v.key)} style={{
            background: vistaActiva === v.key ? "#D4AF37" : "#0f2239",
            color: vistaActiva === v.key ? "#0a1628" : "#94a3b8",
            border: `1px solid ${vistaActiva === v.key ? "#D4AF37" : "#1e3a5f"}`,
            borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer"
          }}>{v.label}</button>
        ))}
      </div>

      {vistaActiva === "nacional" ? <VistaAnualNacional /> : (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── Cabecera ADACH ───────────────────────────────────────────────────── */}
      <Card>
        <SectionHeader title="MERCADO AUTOMOTRIZ CHIAPAS — REPORTE ADACH" icon="🗺️" />
        <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFile} style={{ display: "none" }} id="file-adach" />
            <label htmlFor="file-adach" style={{
              background: cargando ? "#1e3a5f" : "#D4AF37", color: cargando ? "#64748b" : "#0a1628",
              border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700,
              cursor: cargando ? "default" : "pointer", display: "inline-block"
            }}>
              {cargando ? "📊 Procesando PDF con IA…" : "📤 Subir reporte ADACH (.pdf)"}
            </label>
            <div style={{ color: "#475569", fontSize: 11, marginTop: 6 }}>
              La IA extraerá automáticamente los datos del mes seleccionado arriba ({getMonthLabel(monthKey)})
            </div>
          </div>

          {/* Selector de mes disponible */}
          {mesesDisponibles.length > 0 && (
            <div>
              <div style={{ color: "#64748b", fontSize: 10.5, fontWeight: 700, marginBottom: 6 }}>MES EN VISTA</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {mesesDisponibles.map(m => (
                  <button key={m} onClick={() => setMesVista(m)} style={{
                    background: mesVista === m ? "#3b9eea" : "#0f2239",
                    color: mesVista === m ? "#0a1628" : "#94a3b8",
                    border: `1px solid ${mesVista === m ? "#3b9eea" : "#1e3a5f"}`,
                    borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer"
                  }}>{getMonthLabel(m)}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {errorCarga && (
          <div style={{ background: "#dc262622", border: "1px solid #f87171", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 13, marginTop: 12 }}>
            {errorCarga}
          </div>
        )}
        {cargando && (
          <div style={{ background: "#3b9eea11", border: "1px solid #3b9eea33", borderRadius: 8, padding: "12px 16px", marginTop: 12, color: "#94a3b8", fontSize: 13 }}>
            🧠 La IA está leyendo el PDF, extrayendo datos y generando el análisis competitivo… esto toma ~15-20 segundos.
          </div>
        )}
      </Card>

      {!datos && !cargando && (
        <Card>
          <div style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: "40px 0" }}>
            Sube el reporte mensual de ADACH para visualizar los indicadores del mercado automotriz de Chiapas.
          </div>
        </Card>
      )}

      {datos && (
        <>
          {/* ── KPIs del mercado ─────────────────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: 12 }}>
            {[
              { label: "MERCADO TOTAL CHIAPAS", value: fmt(datos.mercadoTotal), sub: `${fmtPct(datos.variacionVsAnioAnterior)} vs año ant.`, color: "#3b9eea", varN: datos.variacionVsAnioAnterior },
              { label: "PROYECCIÓN CIERRE 2026", value: fmt(datos.proyeccionCierreAnio), sub: `tendencia ${fmtPct(datos.tendenciaAnio)}`, color: datos.tendenciaAnio >= 0 ? "#4ade80" : "#fbbf24", varN: datos.tendenciaAnio },
              { label: "CHANGAN / CHESA", value: `${fmt(datos.changanUnidades)} uds`, sub: `${fmtPct(datos.changanShare, false)} del mercado total`, color: "#D4AF37", varN: null },
              { label: "SEGMENTO EMERGENTES", value: `${fmt(datos.marcasEmergentesTotal)} uds`, sub: `${fmtPct(datos.marcasEmergentesShare, false)} del mercado`, color: "#c084fc", varN: null },
            ].map(k => (
              <div key={k.label} style={{ background: "#0f2239", border: "1px solid #1e3a5f", borderTop: `3px solid ${k.color}`, borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700, letterSpacing: .8 }}>{k.label}</div>
                <div style={{ color: "#f1f5f9", fontSize: 20, fontWeight: 900, marginTop: 4 }}>{k.value}</div>
                <div style={{ color: colorVar(k.varN), fontSize: 11, marginTop: 3, fontWeight: k.varN != null ? 700 : 400 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>

            {/* ── Competidores chinos ──────────────────────────────────────────── */}
            {datos.competidoresChinos?.length > 0 && (
              <Card style={{ flex: 1, minWidth: 300 }}>
                <SectionHeader title="CHANGAN VS COMPETENCIA CHINA — CHIAPAS" icon="🏁" />
                <div style={{ color: "#475569", fontSize: 11.5, marginBottom: 16 }}>
                  Ventas del mes en Chiapas. Changan = 100% CHESA.
                </div>
                {(() => {
                  const maxUds = Math.max(1, ...datos.competidoresChinos.map(c => c.unidades || 0));
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {[...datos.competidoresChinos]
                        .filter(c => c.unidades != null)
                        .sort((a, b) => b.unidades - a.unidades)
                        .map(c => {
                          const color = COLORES_MARCAS[c.marca] || "#64748b";
                          const esChangan = c.marca === "CHANGAN";
                          const pct = (c.unidades / maxUds * 100).toFixed(0);
                          return (
                            <div key={c.marca}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                <span style={{ color: esChangan ? "#D4AF37" : "#f1f5f9", fontSize: 13, fontWeight: esChangan ? 800 : 600 }}>
                                  {c.marca} {esChangan ? "★" : ""}
                                </span>
                                <span style={{ color, fontSize: 13, fontWeight: 700 }}>{fmt(c.unidades)} uds</span>
                              </div>
                              <div style={{ background: "#0d1b2e", borderRadius: 4, height: 10, overflow: "hidden" }}>
                                <div style={{
                                  width: `${pct}%`, height: "100%", background: color, borderRadius: 4,
                                  boxShadow: esChangan ? `0 0 8px ${color}66` : "none"
                                }} />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  );
                })()}
              </Card>
            )}

            {/* ── Top marcas mercado total ─────────────────────────────────────── */}
            {datos.topMarcas?.length > 0 && (
              <Card style={{ flex: 1, minWidth: 280 }}>
                <SectionHeader title="TOP MARCAS — MERCADO TOTAL CHIAPAS" icon="🏆" />
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ color: "#64748b", fontSize: 11, borderBottom: "1px solid #1e3a5f" }}>
                      <th style={{ textAlign: "left", padding: "5px 8px" }}>MARCA</th>
                      <th style={{ textAlign: "right", padding: "5px 8px" }}>UNIDADES</th>
                      <th style={{ textAlign: "right", padding: "5px 8px" }}>SHARE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.topMarcas.filter(m => m.unidades != null).map((m, i) => (
                      <tr key={m.marca} style={{ borderBottom: "1px solid #0f2239" }}>
                        <td style={{ padding: "6px 8px", color: "#f1f5f9", fontWeight: 600 }}>
                          {i + 1}. {m.marca}
                        </td>
                        <td style={{ textAlign: "right", padding: "6px 8px", color: "#cbd5e1" }}>{fmt(m.unidades)}</td>
                        <td style={{ textAlign: "right", padding: "6px 8px", color: "#D4AF37", fontWeight: 700 }}>{fmtPct(m.share, false)}</td>
                      </tr>
                    ))}
                    {/* Changan comparativo */}
                    <tr style={{ borderTop: "2px solid #D4AF3755", background: "#D4AF3708" }}>
                      <td style={{ padding: "6px 8px", color: "#D4AF37", fontWeight: 800 }}>★ CHANGAN (CHESA)</td>
                      <td style={{ textAlign: "right", padding: "6px 8px", color: "#D4AF37", fontWeight: 700 }}>{fmt(datos.changanUnidades)}</td>
                      <td style={{ textAlign: "right", padding: "6px 8px", color: "#D4AF37", fontWeight: 700 }}>{fmtPct(datos.changanShare, false)}</td>
                    </tr>
                  </tbody>
                </table>
              </Card>
            )}
          </div>

          {/* ── Distribución por ciudad ──────────────────────────────────────── */}
          {datos.ventasPorCiudad?.length > 0 && (
            <Card>
              <SectionHeader title="VENTAS POR CIUDAD — MERCADO TOTAL" icon="🗺️" />
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {datos.ventasPorCiudad.filter(c => c.unidades != null && c.unidades > 0).map(c => {
                  const maxUds = Math.max(1, ...datos.ventasPorCiudad.filter(x => x.unidades).map(x => x.unidades));
                  const barW = (c.unidades / maxUds * 100).toFixed(0);
                  return (
                    <div key={c.ciudad} style={{ flex: 1, minWidth: 140, background: "#0f2239", border: "1px solid #1e3a5f", borderRadius: 8, padding: "12px 14px" }}>
                      <div style={{ color: "#64748b", fontSize: 10.5, fontWeight: 700, marginBottom: 6 }}>{c.ciudad.toUpperCase()}</div>
                      <div style={{ color: "#f1f5f9", fontSize: 20, fontWeight: 900 }}>{fmt(c.unidades)}</div>
                      <div style={{ color: "#3b9eea", fontSize: 11, fontWeight: 700, marginBottom: 8 }}>{fmtPct(c.pct, false)} del mercado</div>
                      <div style={{ background: "#0d1b2e", borderRadius: 3, height: 6 }}>
                        <div style={{ width: `${barW}%`, height: "100%", background: "#3b9eea", borderRadius: 3 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* ── Análisis narrativo ───────────────────────────────────────────── */}
          {reporte?.analisis && (
            <Card>
              <SectionHeader title="ANÁLISIS COMPETITIVO — CONTEXTO PARA CHESA" icon="🧠" />
              <div style={{ color: "#475569", fontSize: 11, marginBottom: 14 }}>
                Generado por IA · Fuente: Reporte ADACH {getMonthLabel(mesVista)} · Cargado: {reporte.fechaCarga ? new Date(reporte.fechaCarga).toLocaleDateString("es-MX") : "—"}
              </div>
              <div style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", borderRadius: 8, padding: "18px 20px" }}>
                {renderMarkdownGlobal(reporte.analisis)}
              </div>
            </Card>
          )}

          {/* ── Evolución histórica si hay múltiples meses ───────────────────── */}
          {mesesDisponibles.length > 1 && (
            <Card>
              <SectionHeader title="EVOLUCIÓN HISTÓRICA — CHIAPAS" icon="📉" />
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ color: "#64748b", fontSize: 11, borderBottom: "1px solid #1e3a5f" }}>
                      <th style={{ textAlign: "left", padding: "6px 8px" }}>MES</th>
                      <th style={{ textAlign: "right", padding: "6px 8px" }}>MERCADO TOTAL</th>
                      <th style={{ textAlign: "right", padding: "6px 8px" }}>VAR. A/A</th>
                      <th style={{ textAlign: "right", padding: "6px 8px" }}>CHANGAN (CHESA)</th>
                      <th style={{ textAlign: "right", padding: "6px 8px" }}>SHARE CHANGAN</th>
                      <th style={{ textAlign: "right", padding: "6px 8px" }}>EMERGENTES</th>
                      <th style={{ textAlign: "right", padding: "6px 8px" }}>PROY. CIERRE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mesesDisponibles.map(m => {
                      const d = reportesMes[m]?.datos;
                      if (!d) return null;
                      return (
                        <tr key={m} style={{ borderBottom: "1px solid #1e3a5f", background: m === mesVista ? "#3b9eea08" : "transparent" }}>
                          <td style={{ padding: "7px 8px", color: m === mesVista ? "#3b9eea" : "#f1f5f9", fontWeight: 700 }}>
                            {getMonthLabel(m)}
                          </td>
                          <td style={{ textAlign: "right", padding: "7px 8px", color: "#cbd5e1" }}>{fmt(d.mercadoTotal)}</td>
                          <td style={{ textAlign: "right", padding: "7px 8px", color: colorVar(d.variacionVsAnioAnterior), fontWeight: 700 }}>
                            {fmtPct(d.variacionVsAnioAnterior)}
                          </td>
                          <td style={{ textAlign: "right", padding: "7px 8px", color: "#D4AF37", fontWeight: 700 }}>{fmt(d.changanUnidades)}</td>
                          <td style={{ textAlign: "right", padding: "7px 8px", color: "#94a3b8" }}>{fmtPct(d.changanShare, false)}</td>
                          <td style={{ textAlign: "right", padding: "7px 8px", color: "#c084fc" }}>{fmt(d.marcasEmergentesTotal)}</td>
                          <td style={{ textAlign: "right", padding: "7px 8px", color: colorVar(d.tendenciaAnio) }}>
                            {fmt(d.proyeccionCierreAnio)} ({fmtPct(d.tendenciaAnio)})
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
    )}
    </div>
  );
}

// ── SECCIÓN: Tendencias ───────────────────────────────────────────────────────
function TendenciasSection({ currentMonthKey }) {
  const [indicador, setIndicador] = useState("ventas");
  const [agenciaSel, setAgenciaSel] = useState("TOTAL");
  const [compararAnioAnterior, setCompararAnioAnterior] = useState(false);
  const [loading, setLoading] = useState(true);
  const [serieActual, setSerieActual] = useState([]);
  const [serieAnterior, setSerieAnterior] = useState([]);

  const anioActual = getYearFromKey(currentMonthKey);
  const mesActualNum = getMonthNumFromKey(currentMonthKey);
  const indActual = INDICADORES_TENDENCIA.find(i => i.key === indicador);

  // Si el indicador actual no permite la agencia seleccionada (ej. CSI en Comitán), regresa a TOTAL.
  useEffect(() => {
    if (agenciaSel !== "TOTAL" && !indActual.agenciasValidas.includes(agenciaSel)) {
      setAgenciaSel("TOTAL");
    }
  }, [indicador]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // Meses del año en curso, de enero hasta el mes operativo actual
      const mesesAnioActual = [];
      for (let m = 1; m <= mesActualNum; m++) {
        mesesAnioActual.push(`${anioActual}-${String(m).padStart(2, "0")}`);
      }
      const datosActual = await Promise.all(mesesAnioActual.map(async mk => {
        const raw = await fbGet(`datos/${mk}`);
        const merged = {};
        Object.keys(initialData).forEach(section => {
          merged[section] = decodeFirebaseData(raw?.[section], initialData[section]);
        });
        return { mes: MES_NOMBRES[getMonthNumFromKey(mk) - 1].slice(0, 3), value: computeIndicadorValue(indicador, merged, agenciaSel) };
      }));
      setSerieActual(datosActual.map(d => ({ x: d.mes, y: d.value })));

      if (compararAnioAnterior) {
        const anioAnterior = String(parseInt(anioActual, 10) - 1);
        const mesesAnioAnterior = [];
        for (let m = 1; m <= mesActualNum; m++) {
          mesesAnioAnterior.push(`${anioAnterior}-${String(m).padStart(2, "0")}`);
        }
        const datosAnterior = await Promise.all(mesesAnioAnterior.map(async mk => {
          const raw = await fbGet(`datos/${mk}`);
          const merged = {};
          Object.keys(initialData).forEach(section => {
            merged[section] = decodeFirebaseData(raw?.[section], initialData[section]);
          });
          return { mes: MES_NOMBRES[getMonthNumFromKey(mk) - 1].slice(0, 3), value: computeIndicadorValue(indicador, merged, agenciaSel) };
        }));
        setSerieAnterior(datosAnterior.map(d => ({ x: d.mes, y: d.value })));
      } else {
        setSerieAnterior([]);
      }
      setLoading(false);
    })();
  }, [indicador, agenciaSel, compararAnioAnterior, currentMonthKey]);

  const ind = INDICADORES_TENDENCIA.find(i => i.key === indicador);
  const series = [
    { label: `${anioActual}`, color: "#D4AF37", points: serieActual },
    ...(compararAnioAnterior && serieAnterior.length ? [{ label: `${parseInt(anioActual,10)-1}`, color: "#60a5fa", points: serieAnterior }] : []),
  ];

  const opcionesAgencia = ["TOTAL", ...indActual.agenciasValidas];

  return (
    <Card>
      <SectionHeader title={`TENDENCIAS — ${ind.label.toUpperCase()}`} icon="📉" />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
        {INDICADORES_TENDENCIA.map(i => (
          <button key={i.key} onClick={() => setIndicador(i.key)} style={{
            background: indicador === i.key ? "#D4AF37" : "#0f2239",
            color: indicador === i.key ? "#0a1628" : "#94a3b8",
            border: `1px solid ${indicador === i.key ? "#D4AF37" : "#1e3a5f"}`,
            borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer"
          }}>
            {i.label}
          </button>
        ))}
        <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#94a3b8", fontSize: 12, marginLeft: "auto", cursor: "pointer" }}>
          <input type="checkbox" checked={compararAnioAnterior} onChange={e => setCompararAnioAnterior(e.target.checked)} />
          Comparar vs año anterior
        </label>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {opcionesAgencia.map(ag => (
          <button key={ag} onClick={() => setAgenciaSel(ag)} style={{
            background: agenciaSel === ag ? "#3b9eea" : "#0f2239",
            color: agenciaSel === ag ? "#0a1628" : "#94a3b8",
            border: `1px solid ${agenciaSel === ag ? "#3b9eea" : "#1e3a5f"}`,
            borderRadius: 6, padding: "5px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer"
          }}>
            {ag}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: "#64748b", fontSize: 13, textAlign: "center", padding: "30px 0" }}>Cargando histórico…</div>
      ) : (
        <>
          <LineChart series={series} suffix={ind.suffix} />
          <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
            {series.map(s => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94a3b8" }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: s.color }} />
                {s.label}
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}


// ── Resumen histórico condensado (para Alertas y Chat) ────────────────────────
// A diferencia de buildResumenParaIA (detalle de UN mes), esta función recorre
// TODOS los meses cargados y arma una línea de tendencia compacta por indicador.
async function buildResumenHistorico(hastaMonthKey) {
  const meses = getAllMonthsRange(hastaMonthKey);
  const filas = [];

  for (const mk of meses) {
    const raw = await fbGet(`datos/${mk}`);
    if (!raw || typeof raw !== "object" || Object.keys(raw).length === 0) continue;
    const merged = {};
    Object.keys(initialData).forEach(section => {
      merged[section] = decodeFirebaseData(raw[section], initialData[section]);
    });

    const ventasTotal = AGENCIAS.reduce((s, a) => s + (merged.ventasJunioInterno[a]?.facturado ?? 0), 0);
    const objTotal = AGENCIAS.reduce((s, a) => s + (merged.ventasJunioInterno[a]?.objetivo ?? 0), 0);
    const wsTotal = AGENCIAS.reduce((s, a) => s + (merged.ws[a]?.real ?? 0), 0);
    const vanTotal = AGENCIAS.reduce((s, a) => s + (merged.van[a]?.real ?? 0), 0);
    const isiProm = (() => {
      const vals = AGENCIAS.map(a => merged.isi[a]?.real ?? 0).filter(v => v > 0);
      return vals.length ? (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) : "N/D";
    })();
    const auditProm = (() => {
      const vals = AGENCIAS.map(a => merged.auditoria[a] ?? 0).filter(v => v > 0);
      return vals.length ? (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) : "N/D";
    })();
    const msTotal = (() => {
      const v = AGENCIAS.reduce((s, a) => s + (merged.msMayo[a]?.real ?? 0), 0);
      const t = AGENCIAS.reduce((s, a) => s + (merged.msMayo[a]?.tiv ?? 0), 0);
      return t > 0 ? ((v / t) * 100).toFixed(1) : "N/D";
    })();
    const rotacionAlertas = AGENCIAS.filter(a => {
      const r = merged.rotacion[a] ?? {};
      if (!r.plantillaInicial) return false;
      const pct = (r.bajas / r.plantillaInicial) * 100;
      return pct > r.objetivo && r.bajas > 1;
    });
    const ventasPorAgencia = AGENCIAS.map(a => {
      const r = merged.ventasJunioInterno[a] ?? {};
      return `${a}:${r.facturado ?? 0}/${r.objetivo ?? 0}`;
    }).join(", ");

    filas.push(
      `${mk} — Ventas: ${ventasTotal}/${objTotal} unid. (${ventasPorAgencia}) | WS: ${wsTotal} | VAN: ${vanTotal} | ISI prom: ${isiProm}% | Auditoría prom: ${auditProm} | MS: ${msTotal}%` +
      (rotacionAlertas.length ? ` | ⚠ Rotación alta sin excepción en: ${rotacionAlertas.join(", ")}` : "")
    );
  }

  return filas.join("\n");
}

// Render simple de markdown (encabezados, negritas, listas) sin librerías externas — reutilizable.
function renderMarkdownGlobal(md) {
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
}

// ── SECCIÓN: Satisfacción Cliente (encuestas 24 hrs) ──────────────────────────
const SATISFACCION_PATH_PREFIX = "satisfaccionCliente"; // satisfaccionCliente/{monthKey}/{tipo: ventas|servicio}

// Busca una columna por coincidencia parcial (insensible a mayúsculas/acentos simples),
// porque los encabezados del Excel son largos y varían entre hojas/teléfono/whatsapp.
function findColumn(columns, keywords) {
  const norm = s => (s || "").toString().toLowerCase()
    .replace(/[áàä]/g, "a").replace(/[éèë]/g, "e").replace(/[íìï]/g, "i")
    .replace(/[óòö]/g, "o").replace(/[úùü]/g, "u");
  for (const col of columns) {
    const c = norm(col);
    if (keywords.every(k => c.includes(norm(k)))) return col;
  }
  return null;
}

function parseEncuestaWorkbook(workbook, tipoReporte) {
  // tipoReporte: "ventas" | "servicio" — solo afecta etiquetas, el parseo es genérico.
  const registros = [];
  workbook.SheetNames.forEach(sheetName => {
    const ws = workbook.Sheets[sheetName];
    // Encabezados reales están en la fila 2 (índice 1) en estos reportes.
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
    if (rows.length < 3) return;
    const headers = rows[1];
    const colEstatus   = findColumn(headers, ["ESTATUS", "INTENTO"]);
    const colAsesor    = findColumn(headers, ["NOMBRE", "ASESOR"]);
    const colSucursal  = findColumn(headers, ["SUCURSAL"]);
    const colCalif     = headers.find(h => (h || "").toString().toLowerCase().includes("escala") && (h || "").toString().toLowerCase().includes("calific"));
    const colQueja      = findColumn(headers, ["MOTIVO", "QUEJA"]) || findColumn(headers, ["FALLA"]);
    const colFaltaPara10 = findColumn(headers, ["FALTA", "10"]);
    const colComentario  = findColumn(headers, ["COMENTARIO"]);

    const idx = (col) => col ? headers.indexOf(col) : -1;
    const iEstatus = idx(colEstatus), iAsesor = idx(colAsesor), iSucursal = idx(colSucursal);
    const iCalif = idx(colCalif), iQueja = idx(colQueja), iFalta = idx(colFaltaPara10), iComentario = idx(colComentario);

    for (let r = 2; r < rows.length; r++) {
      const row = rows[r];
      if (!row || iEstatus < 0) continue;
      const estatus = (row[iEstatus] || "").toString().toUpperCase().trim();
      if (estatus !== "CONTACTADO") continue; // solo encuestas realmente respondidas

      const califRaw = iCalif >= 0 ? row[iCalif] : null;
      const califNum = typeof califRaw === "number" ? califRaw : parseFloat(califRaw);
      const tieneCalificacion = !isNaN(califNum) && califRaw !== null && califRaw !== "";

      registros.push({
        asesor: (row[iAsesor] || "Sin asesor").toString().trim(),
        sucursal: (row[iSucursal] || "").toString().trim().toUpperCase(),
        canal: sheetName.toUpperCase().includes("WHATSAPP") ? "WHATSAPP" : "TELEFONICO",
        calificacion: tieneCalificacion ? califNum : null,
        queja: iQueja >= 0 && row[iQueja] ? row[iQueja].toString().trim() : "",
        faltaPara10: iFalta >= 0 && row[iFalta] ? row[iFalta].toString().trim() : "",
        comentario: iComentario >= 0 && row[iComentario] ? row[iComentario].toString().trim() : "",
      });
    }
  });
  return registros;
}

// Parser específico para el Reporte 24 HRS Prospección.
// Procesa las 4 hojas (Agencia Tele, Digital Tele, Agencia WhatsApp, Digital WhatsApp)
// y consolida los registros CONTACTADO con calificación.
function parseProspeccionWorkbook(workbook) {
  const registros = [];

  workbook.SheetNames.forEach(sheetName => {
    const ws = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
    if (rows.length < 3) return;

    // Detectar canal por nombre de hoja
    const canal = sheetName.toUpperCase().includes("WHAT") ? "WhatsApp" : "Telefónico";
    const origen = sheetName.toUpperCase().includes("DIGITAL") ? "Digital" : "Agencia";

    // Fila 2 (índice 1) = encabezados
    const headers = rows[1] || [];

    // Mapeo de columnas por contenido del encabezado
    const findCol = (keywords) => headers.findIndex(h =>
      h && keywords.every(k => String(h).toLowerCase().includes(k.toLowerCase()))
    );

    const iAsesor    = findCol(["NOMBRE DEL ASESOR"]);
    const iSucursal  = findCol(["SUCURSAL"]);
    const iVehiculo  = findCol(["VEHICULO"]);
    const iEstatus   = findCol(["ESTATUS DEL INTENTO"]);
    const iCalif     = findCol(["escala del 0 al 10"]);
    const iQueja     = findCol(["Motivo de la queja"]);
    const iFalta     = findCol(["hace falta"]);
    const iComentario = findCol(["Algún comentario"]);
    const iProspecto = findCol(["NOMBRE DEL PROSPECTO"]);
    const iAtencion  = findCol(["atención adecuada"]);

    for (let r = 2; r < rows.length; r++) {
      const row = rows[r];
      if (!row) continue;

      const estatus = String(row[iEstatus] || "").trim().toUpperCase();
      if (estatus !== "CONTACTADO") continue;

      const califRaw = iCalif >= 0 ? row[iCalif] : null;
      const califStr = String(califRaw || "").trim();
      const califNum = califStr !== "" && !isNaN(Number(califStr)) ? Number(califStr) : null;

      // Solo incluir si tiene calificación numérica (registros reales de encuesta completada)
      // O si es WhatsApp donde la calificación puede estar vacía pero sí hay comentario
      const tieneEncuesta = califNum !== null ||
        (row[iQueja] && String(row[iQueja]).trim().length > 2) ||
        (row[iComentario] && String(row[iComentario]).trim().length > 5);

      if (!tieneEncuesta) continue;

      registros.push({
        asesor:      iAsesor >= 0 && row[iAsesor] ? String(row[iAsesor]).trim() : "Sin asignar",
        sucursal:    iSucursal >= 0 && row[iSucursal] ? String(row[iSucursal]).trim() : "",
        vehiculo:    iVehiculo >= 0 && row[iVehiculo] ? String(row[iVehiculo]).trim() : "",
        prospecto:   iProspecto >= 0 && row[iProspecto] ? String(row[iProspecto]).trim() : "",
        canal,
        origen,
        calificacion: califNum,
        atencionAdecuada: iAtencion >= 0 && row[iAtencion] ? String(row[iAtencion]).trim() : "",
        queja:       iQueja >= 0 && row[iQueja] ? String(row[iQueja]).trim() : "",
        faltaPara10: iFalta >= 0 && row[iFalta] ? String(row[iFalta]).trim() : "",
        comentario:  iComentario >= 0 && row[iComentario] ? String(row[iComentario]).trim() : "",
      });
    }
  });

  return registros;
}

function SatisfaccionClienteSection({ monthKey }) {
  const [tipoActivo, setTipoActivo] = useState("ventas"); // ventas | servicio | prospeccion
  const [agenciaSel, setAgenciaSel] = useState("TOTAL");
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState("");
  const [datosVentas, setDatosVentas] = useState(null);
  const [datosServicio, setDatosServicio] = useState(null);
  const [datosProspeccion, setDatosProspeccion] = useState(null);
  const [loadingDatos, setLoadingDatos] = useState(true);
  const [analisisIA, setAnalisisIA] = useState("");
  const [loadingIA, setLoadingIA] = useState(false);
  const [errorIA, setErrorIA] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      setLoadingDatos(true);
      const v = await fbGet(`${SATISFACCION_PATH_PREFIX}/${monthKey}/ventas`);
      const s = await fbGet(`${SATISFACCION_PATH_PREFIX}/${monthKey}/servicio`);
      const p = await fbGet(`${SATISFACCION_PATH_PREFIX}/${monthKey}/prospeccion`);
      setDatosVentas(Array.isArray(v) ? v : (v ? Object.values(v) : null));
      setDatosServicio(Array.isArray(s) ? s : (s ? Object.values(s) : null));
      setDatosProspeccion(Array.isArray(p) ? p : (p ? Object.values(p) : null));
      setAnalisisIA("");
      setLoadingDatos(false);
    })();
  }, [monthKey]);

  const handleFile = async (e, tipo) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCargando(true);
    setErrorCarga("");
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      let registros;
      if (tipo === "prospeccion") {
        registros = parseProspeccionWorkbook(wb);
      } else {
        registros = parseEncuestaWorkbook(wb, tipo);
      }
      if (registros.length === 0) {
        setErrorCarga("No se encontraron registros CONTACTADO en este archivo. Verifica que sea el reporte correcto.");
        setCargando(false);
        return;
      }
      await fbSet(`${SATISFACCION_PATH_PREFIX}/${monthKey}/${tipo}`, registros);
      if (tipo === "ventas") setDatosVentas(registros);
      else if (tipo === "servicio") setDatosServicio(registros);
      else setDatosProspeccion(registros);
      setAnalisisIA("");
    } catch (err) {
      console.error(err);
      setErrorCarga("No se pudo leer el archivo. Verifica que sea un Excel válido del reporte.");
    } finally {
      setCargando(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const datosCompletos = tipoActivo === "ventas" ? datosVentas : tipoActivo === "servicio" ? datosServicio : datosProspeccion;

  // Lista de sucursales presentes en los datos cargados, para armar el selector dinámicamente.
  const sucursalesDisponibles = (() => {
    if (!datosCompletos) return [];
    return Array.from(new Set(datosCompletos.map(r => r.sucursal).filter(Boolean))).sort();
  })();

  const datos = (() => {
    if (!datosCompletos) return null;
    if (agenciaSel === "TOTAL") return datosCompletos;
    return datosCompletos.filter(r => r.sucursal === agenciaSel);
  })();

  // Resetea el filtro de agencia si cambia de tipo (ventas/servicio) y la sucursal ya no existe en ese conjunto.
  useEffect(() => {
    if (agenciaSel !== "TOTAL" && datosCompletos && !sucursalesDisponibles.includes(agenciaSel)) {
      setAgenciaSel("TOTAL");
    }
  }, [tipoActivo, datosCompletos]);

  // ── Indicadores por asesor ──────────────────────────────────────────────────
  const QUEJA_VACIA = new Set(["", "—", "sin comentarios", "sin comentario", "sin comentarios.", "sin comentario."]);

  const tieneQueja = (r) => {
    const q = (r.queja || "").trim().toLowerCase();
    return q.length > 0 && !QUEJA_VACIA.has(q);
  };

  const porAsesor = (() => {
    if (!datos) return [];
    const map = {};
    datos.forEach(r => {
      if (!map[r.asesor]) map[r.asesor] = { asesor: r.asesor, sucursal: r.sucursal, canal: r.canal || "", calificaciones: [], conComentario: 0, conQueja: 0, total: 0 };
      map[r.asesor].total++;
      if (r.calificacion !== null && r.calificacion !== undefined) map[r.asesor].calificaciones.push(r.calificacion);
      if (r.comentario && !QUEJA_VACIA.has(r.comentario.toLowerCase())) map[r.asesor].conComentario++;
      if (tieneQueja(r)) map[r.asesor].conQueja++;
    });
    return Object.values(map)
      .map(a => ({ ...a, promedio: a.calificaciones.length ? a.calificaciones.reduce((s, v) => s + v, 0) / a.calificaciones.length : null }))
      .sort((a, b) => (b.promedio ?? -1) - (a.promedio ?? -1));
  })();

  const promedioGeneral = (() => {
    if (!datos) return null;
    const vals = datos.map(r => r.calificacion).filter(v => v !== null && v !== undefined);
    return vals.length ? (vals.reduce((s, v) => s + v, 0) / vals.length) : null;
  })();

  // ── Tasa de quejas y semáforo de riesgo ───────────────────────────────────────
  const totalQuejas = datos ? datos.filter(tieneQueja).length : 0;
  const tasaQuejas = datos && datos.length > 0 ? (totalQuejas / datos.length) * 100 : null;
  const nivelRiesgo = tasaQuejas === null ? null : tasaQuejas >= 15 ? "alto" : tasaQuejas >= 5 ? "medio" : "bajo";
  const RIESGO_COLOR = { alto: "#f87171", medio: "#D4AF37", bajo: "#4ade80" };
  const RIESGO_EMOJI = { alto: "🔴", medio: "🟡", bajo: "🟢" };
  const RIESGO_LABEL = { alto: "Riesgo alto", medio: "Riesgo medio", bajo: "Riesgo bajo" };

  // ── Categorías de queja más frecuentes (sin IA, conteo directo) ───────────────
  const categoriasQueja = (() => {
    if (!datos) return [];
    const map = {};
    datos.forEach(r => {
      if (!tieneQueja(r)) return;
      const cat = r.queja.trim();
      map[cat] = (map[cat] || 0) + 1;
    });
    return Object.entries(map)
      .map(([categoria, count]) => ({ categoria, count }))
      .sort((a, b) => b.count - a.count);
  })();

  // Semáforo de riesgo por agencia (siempre sobre el conjunto completo, no el ya filtrado, para comparar entre plazas)
  const riesgoPorAgencia = (() => {
    if (!datosCompletos) return [];
    const map = {};
    datosCompletos.forEach(r => {
      if (!r.sucursal) return;
      if (!map[r.sucursal]) map[r.sucursal] = { total: 0, quejas: 0 };
      map[r.sucursal].total++;
      if (tieneQueja(r)) map[r.sucursal].quejas++;
    });
    return Object.entries(map).map(([sucursal, v]) => {
      const tasa = v.total > 0 ? (v.quejas / v.total) * 100 : 0;
      const nivel = tasa >= 15 ? "alto" : tasa >= 5 ? "medio" : "bajo";
      return { sucursal, total: v.total, quejas: v.quejas, tasa, nivel };
    }).sort((a, b) => b.tasa - a.tasa);
  })();

  const generarAnalisisIA = async () => {
    if (!datos || datos.length === 0) return;
    setLoadingIA(true);
    setErrorIA("");
    setAnalisisIA("");
    try {
      const lineas = datos.map(r =>
        `- Asesor: ${r.asesor} | Sucursal: ${r.sucursal} | Canal: ${r.canal} | Calificación: ${r.calificacion ?? "N/D"} | Motivo de queja: ${r.queja || "—"} | Qué faltó para el 10: ${r.faltaPara10 || "—"} | Comentario: ${r.comentario || "—"}`
      ).join("\n");

      const prompt = `Eres un director comercial con 20 años de experiencia en grupos automotrices, especializado en experiencia del cliente. Analiza estas encuestas de satisfacción de ${tipoActivo === "ventas" ? "VENTAS (24 hrs después de la entrega)" : "SERVICIO (24 hrs después de la entrega del taller)"} de CHESA Changan, correspondientes a ${getMonthLabel(monthKey)}.

Cada línea es una encuesta real respondida por un cliente. Analiza TODO el conjunto y entrega:

1. **Principales elogios** — los comentarios positivos más repetidos, agrupados por tema (ej. "trato del asesor", "rapidez en la entrega"), citando cuántas veces aparece cada patrón
2. **Principales insatisfacciones** — las quejas y comentarios negativos más repetidos, agrupados por tema, citando cuántas veces aparece cada patrón
3. **Asesores a destacar** — quiénes reciben elogios consistentes
4. **Asesores que requieren atención** — quiénes acumulan quejas o calificaciones bajas, y por qué razón específica según los comentarios
5. **Recomendación accionable** — 2-3 acciones concretas para el siguiente mes basadas en los patrones encontrados

Sé directo y específico, usa los nombres reales. Si los datos son insuficientes para alguna sección, dilo brevemente. Formato markdown con encabezados.

ENCUESTAS:
${lineas}`;

      const response = await fetch("/api/analisis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const responseData = await response.json();
      if (!response.ok) {
        setErrorIA(responseData.error || "Ocurrió un error generando el análisis.");
        return;
      }
      setAnalisisIA(responseData.text || "No se recibió respuesta.");
    } catch (e) {
      setErrorIA("Ocurrió un error de conexión. Intenta de nuevo.");
    } finally {
      setLoadingIA(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <SectionHeader title={`SATISFACCIÓN CLIENTE — ENCUESTAS 24 HRS — ${getMonthLabel(monthKey).toUpperCase()}`} icon="📋" />
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          <button onClick={() => setTipoActivo("ventas")} style={{
            background: tipoActivo === "ventas" ? "#3b9eea" : "#0f2239",
            color: tipoActivo === "ventas" ? "#0a1628" : "#94a3b8",
            border: `1px solid ${tipoActivo === "ventas" ? "#3b9eea" : "#1e3a5f"}`,
            borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer"
          }}>🚗 Ventas</button>
          <button onClick={() => setTipoActivo("servicio")} style={{
            background: tipoActivo === "servicio" ? "#3b9eea" : "#0f2239",
            color: tipoActivo === "servicio" ? "#0a1628" : "#94a3b8",
            border: `1px solid ${tipoActivo === "servicio" ? "#3b9eea" : "#1e3a5f"}`,
            borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer"
          }}>🔧 Servicio</button>
          <button onClick={() => setTipoActivo("prospeccion")} style={{
            background: tipoActivo === "prospeccion" ? "#3b9eea" : "#0f2239",
            color: tipoActivo === "prospeccion" ? "#0a1628" : "#94a3b8",
            border: `1px solid ${tipoActivo === "prospeccion" ? "#3b9eea" : "#1e3a5f"}`,
            borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer"
          }}>📞 Prospección</button>
        </div>

        {sucursalesDisponibles.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {["TOTAL", ...sucursalesDisponibles].map(ag => (
              <button key={ag} onClick={() => setAgenciaSel(ag)} style={{
                background: agenciaSel === ag ? "#3b9eea" : "#0f2239",
                color: agenciaSel === ag ? "#0a1628" : "#94a3b8",
                border: `1px solid ${agenciaSel === ag ? "#3b9eea" : "#1e3a5f"}`,
                borderRadius: 6, padding: "5px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer"
              }}>
                {ag}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <input
            ref={fileInputRef} type="file" accept=".xlsx,.xls"
            onChange={e => handleFile(e, tipoActivo)}
            style={{ display: "none" }}
            id={`file-${tipoActivo}`}
          />
          <label htmlFor={`file-${tipoActivo}`} style={{
            background: cargando ? "#1e3a5f" : "#D4AF37", color: cargando ? "#64748b" : "#0a1628",
            border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 12.5, fontWeight: 700,
            cursor: cargando ? "default" : "pointer", display: "inline-block"
          }}>
            {cargando ? "Procesando…" : `📤 Subir reporte de ${tipoActivo === "ventas" ? "Ventas" : tipoActivo === "servicio" ? "Servicio" : "Prospección"} (.xlsx)`}
          </label>
          <span style={{ color: "#64748b", fontSize: 11.5 }}>
            {tipoActivo === "prospeccion"
              ? "Reporte 24 HRS Prospección — se procesan todas las hojas (Agencia Tele + WhatsApp)."
              : `Este archivo se guardará como el histórico de ${getMonthLabel(monthKey)}. Solo se guardan los registros con estatus CONTACTADO.`}
          </span>
        </div>

        {errorCarga && (
          <div style={{ background: "#dc262622", border: "1px solid #f87171", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 13, marginBottom: 14 }}>
            {errorCarga}
          </div>
        )}

        {loadingDatos ? (
          <div style={{ color: "#64748b", fontSize: 13, textAlign: "center", padding: "20px 0" }}>Cargando…</div>
        ) : !datos ? (
          <div style={{ color: "#475569", fontSize: 12.5, textAlign: "center", padding: "30px 0" }}>
            Todavía no se ha cargado el reporte de {tipoActivo === "ventas" ? "Ventas" : tipoActivo === "servicio" ? "Servicio" : "Prospección"} para {getMonthLabel(monthKey)}.
          </div>
        ) : (
          <>
            {/* KPIs — con indicadores extra para Prospección */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 18 }}>
              <div style={{ background: "#0f2239", border: "1px solid #1e3a5f", borderTop: "3px solid #D4AF37", borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700, letterSpacing: .8 }}>{tipoActivo === "prospeccion" ? "PROSPECTOS CONTACTADOS" : "ENCUESTAS RESPONDIDAS"}</div>
                <div style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 800 }}>{datos.length}</div>
              </div>
              <div style={{ background: "#0f2239", border: "1px solid #1e3a5f", borderTop: "3px solid #4ade80", borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700, letterSpacing: .8 }}>CALIFICACIÓN PROMEDIO</div>
                <div style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 800 }}>{promedioGeneral !== null ? promedioGeneral.toFixed(1) : "—"}</div>
              </div>
              <div style={{ background: "#0f2239", border: "1px solid #1e3a5f", borderTop: "3px solid #60a5fa", borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700, letterSpacing: .8 }}>ASESORES EVALUADOS</div>
                <div style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 800 }}>{porAsesor.length}</div>
              </div>
              <div style={{ background: "#0f2239", border: "1px solid #1e3a5f", borderTop: `3px solid ${nivelRiesgo ? RIESGO_COLOR[nivelRiesgo] : "#1e3a5f"}`, borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700, letterSpacing: .8 }}>TASA DE QUEJAS</div>
                <div style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 800 }}>{tasaQuejas !== null ? `${tasaQuejas.toFixed(1)}%` : "—"}</div>
                <div style={{ color: "#475569", fontSize: 11, marginTop: 3 }}>{totalQuejas} de {datos.length} encuestas</div>
              </div>
              <div style={{ background: "#0f2239", border: `1px solid ${nivelRiesgo ? RIESGO_COLOR[nivelRiesgo] : "#1e3a5f"}55`, borderTop: `3px solid ${nivelRiesgo ? RIESGO_COLOR[nivelRiesgo] : "#1e3a5f"}`, borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700, letterSpacing: .8 }}>NIVEL DE RIESGO</div>
                <div style={{ color: nivelRiesgo ? RIESGO_COLOR[nivelRiesgo] : "#f1f5f9", fontSize: 18, fontWeight: 800 }}>
                  {nivelRiesgo ? `${RIESGO_EMOJI[nivelRiesgo]} ${RIESGO_LABEL[nivelRiesgo]}` : "—"}
                </div>
              </div>
              {/* KPIs extra para Prospección: desglose por canal */}
              {tipoActivo === "prospeccion" && (() => {
                const porCanal = {};
                datos.forEach(r => {
                  const k = r.canal || "Sin canal";
                  if (!porCanal[k]) porCanal[k] = { count: 0, califs: [] };
                  porCanal[k].count++;
                  if (r.calificacion !== null) porCanal[k].califs.push(r.calificacion);
                });
                return Object.entries(porCanal).map(([canal, d]) => {
                  const prom = d.califs.length > 0 ? (d.califs.reduce((s,v)=>s+v,0)/d.califs.length).toFixed(1) : "—";
                  const color = canal === "WhatsApp" ? "#4ade80" : "#c084fc";
                  return (
                    <div key={canal} style={{ background: "#0f2239", border: "1px solid #1e3a5f", borderTop: `3px solid ${color}`, borderRadius: 8, padding: "12px 14px" }}>
                      <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700, letterSpacing: .8 }}>{canal.toUpperCase()}</div>
                      <div style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 800 }}>{d.count}</div>
                      <div style={{ color: "#475569", fontSize: 11, marginTop: 3 }}>prom. {prom}</div>
                    </div>
                  );
                });
              })()}
            </div>

            <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: .8 }}>
              {tipoActivo === "prospeccion" ? "CALIFICACIÓN POR ASESOR (PROSPECTOS CONTACTADOS)" : "CALIFICACIÓN POR ASESOR"}
            </p>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ color: "#64748b", fontSize: 11 }}>
                  <th style={{ textAlign: "left", paddingBottom: 6 }}>ASESOR</th>
                  <th style={{ textAlign: "center" }}>SUCURSAL</th>
                  {tipoActivo === "prospeccion" && <th style={{ textAlign: "center" }}>CANAL</th>}
                  <th style={{ textAlign: "center" }}>{tipoActivo === "prospeccion" ? "PROSPECTOS" : "ENCUESTAS"}</th>
                  <th style={{ textAlign: "center" }}>QUEJAS</th>
                  <th style={{ textAlign: "center" }}>PROMEDIO</th>
                </tr>
              </thead>
              <tbody>
                {porAsesor.map(a => (
                  <tr key={a.asesor} style={{ borderTop: "1px solid #1e3a5f" }}>
                    <td style={{ padding: "6px 0", color: "#cbd5e1", fontSize: 12 }}>{a.asesor}</td>
                    <td style={{ textAlign: "center", color: "#64748b", fontSize: 12 }}>{a.sucursal}</td>
                    {tipoActivo === "prospeccion" && (
                      <td style={{ textAlign: "center", color: "#64748b", fontSize: 11 }}>{a.canal || "—"}</td>
                    )}
                    <td style={{ textAlign: "center", color: "#cbd5e1" }}>{a.total}</td>
                    <td style={{ textAlign: "center", color: a.conQueja > 0 ? "#f87171" : "#475569", fontWeight: a.conQueja > 0 ? 700 : 400 }}>{a.conQueja}</td>
                    <td style={{ textAlign: "center", fontWeight: 700, color: a.promedio === null ? "#475569" : a.promedio >= 9 ? "#4ade80" : a.promedio >= 7 ? "#D4AF37" : "#f87171" }}>
                      {a.promedio !== null ? a.promedio.toFixed(1) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </Card>

      {datos && datos.length > 0 && (
        <Card>
          <SectionHeader title="QUEJAS — CATEGORÍAS Y RIESGO POR AGENCIA" icon="🚩" />
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: .8 }}>
                MOTIVOS DE QUEJA MÁS FRECUENTES {agenciaSel !== "TOTAL" ? `— ${agenciaSel}` : ""}
              </p>
              {categoriasQueja.length === 0 ? (
                <div style={{ color: "#475569", fontSize: 12.5, padding: "16px 0" }}>Sin quejas registradas en este conjunto.</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ color: "#64748b", fontSize: 11 }}>
                      <th style={{ textAlign: "left", paddingBottom: 6 }}>MOTIVO</th>
                      <th style={{ textAlign: "center" }}>CASOS</th>
                      <th style={{ textAlign: "right" }}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoriasQueja.map(c => (
                      <tr key={c.categoria} style={{ borderTop: "1px solid #1e3a5f" }}>
                        <td style={{ padding: "6px 0", color: "#cbd5e1", fontSize: 12 }}>{c.categoria}</td>
                        <td style={{ textAlign: "center", color: "#f87171", fontWeight: 700 }}>{c.count}</td>
                        <td style={{ textAlign: "right", color: "#64748b" }}>{((c.count / totalQuejas) * 100).toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {riesgoPorAgencia.length > 1 && (
              <div style={{ flex: 1, minWidth: 280 }}>
                <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: .8 }}>SEMÁFORO DE RIESGO POR AGENCIA</p>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ color: "#64748b", fontSize: 11 }}>
                      <th style={{ textAlign: "left", paddingBottom: 6 }}>AGENCIA</th>
                      <th style={{ textAlign: "center" }}>ENCUESTAS</th>
                      <th style={{ textAlign: "center" }}>QUEJAS</th>
                      <th style={{ textAlign: "center" }}>TASA</th>
                      <th style={{ textAlign: "center" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {riesgoPorAgencia.map(r => (
                      <tr key={r.sucursal} style={{ borderTop: "1px solid #1e3a5f" }}>
                        <td style={{ padding: "6px 0", color: "#cbd5e1", fontSize: 12 }}>{r.sucursal}</td>
                        <td style={{ textAlign: "center", color: "#cbd5e1" }}>{r.total}</td>
                        <td style={{ textAlign: "center", color: "#f87171" }}>{r.quejas}</td>
                        <td style={{ textAlign: "center", fontWeight: 700, color: RIESGO_COLOR[r.nivel] }}>{r.tasa.toFixed(1)}%</td>
                        <td style={{ textAlign: "center" }}>{RIESGO_EMOJI[r.nivel]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div style={{ color: "#475569", fontSize: 10.5, marginTop: 12, textAlign: "center" }}>
            Riesgo: 🟢 menor a 5% de quejas · 🟡 entre 5% y 15% · 🔴 mayor a 15%
          </div>
        </Card>
      )}

      {datos && datos.length > 0 && (
        <Card>
          <SectionHeader title="ANÁLISIS DE COMENTARIOS — CRITERIO EXPERTO" icon="🧠" />
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
            <button
              onClick={generarAnalisisIA}
              disabled={loadingIA}
              style={{
                background: loadingIA ? "#1e3a5f" : "#D4AF37", color: loadingIA ? "#64748b" : "#0a1628",
                border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700,
                cursor: loadingIA ? "default" : "pointer"
              }}
            >
              {loadingIA ? "Analizando comentarios…" : "🧠 Analizar elogios e insatisfacciones"}
            </button>
            <span style={{ color: "#64748b", fontSize: 11.5 }}>
              Lee todos los comentarios y calificaciones de {tipoActivo === "ventas" ? "Ventas" : "Servicio"} para identificar patrones por asesor.
            </span>
          </div>

          {errorIA && (
            <div style={{ background: "#dc262622", border: "1px solid #f87171", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 13, marginBottom: 14 }}>
              {errorIA}
            </div>
          )}

          {loadingIA && (
            <div style={{ color: "#94a3b8", fontSize: 13, padding: "20px 0", textAlign: "center" }}>
              Analizando {datos.length} encuestas…
            </div>
          )}

          {!loadingIA && analisisIA && (
            <div style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", borderRadius: 8, padding: "18px 20px", maxHeight: "70vh", overflowY: "auto" }}>
              {renderMarkdownGlobal(analisisIA)}
            </div>
          )}

          {!loadingIA && !analisisIA && !errorIA && (
            <div style={{ color: "#475569", fontSize: 12.5, textAlign: "center", padding: "30px 0" }}>
              Da clic en el botón para identificar los elogios e insatisfacciones más repetidos.
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ── SECCIÓN: Demos (encuesta pública de pruebas de manejo) ───────────────────
function GestionAsesoresDemo({ catalogoAsesores, onAddAsesor, onRemoveAsesor }) {
  const [agenciaSel, setAgenciaSel] = useState(AGENCIAS[0]);
  const [nombreNuevo, setNombreNuevo] = useState("");

  const asesoresAgencia = catalogoAsesores[agenciaSel] ?? {};
  const ids = Object.keys(asesoresAgencia);

  const agregar = () => {
    const nombre = nombreNuevo.trim();
    if (!nombre) return;
    onAddAsesor(agenciaSel, nombre);
    setNombreNuevo("");
  };

  return (
    <Card>
      <SectionHeader title="ASESORES PARA LA ENCUESTA DE DEMO" icon="🧑‍💼" />
      <div style={{ color: "#64748b", fontSize: 11.5, marginBottom: 14 }}>
        Esta lista alimenta el selector de asesor en la encuesta pública que responde el cliente tras la prueba de manejo. Agrega o da de baja asesores según vayan cambiando.
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {AGENCIAS.map(ag => (
          <button key={ag} onClick={() => setAgenciaSel(ag)} style={{
            background: agenciaSel === ag ? "#3b9eea" : "#0f2239",
            color: agenciaSel === ag ? "#0a1628" : "#94a3b8",
            border: `1px solid ${agenciaSel === ag ? "#3b9eea" : "#1e3a5f"}`,
            borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer"
          }}>{ag} ({Object.keys(catalogoAsesores[ag] ?? {}).length})</button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          value={nombreNuevo}
          onChange={e => setNombreNuevo(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") agregar(); }}
          placeholder={`Nombre del nuevo asesor en ${agenciaSel}…`}
          style={{ flex: 1, minWidth: 220, background: "#0d1b2e", border: "1px solid #2a3f5f", color: "#f1f5f9", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none" }}
        />
        <button onClick={agregar} style={{ background: "#D4AF37", color: "#0a1628", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
          + Agregar
        </button>
      </div>
      {ids.length === 0 ? (
        <div style={{ color: "#475569", fontSize: 12.5, textAlign: "center", padding: "14px 0" }}>Sin asesores registrados en {agenciaSel} todavía.</div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {ids.map(id => (
            <div key={id} style={{ display: "flex", alignItems: "center", gap: 8, background: "#0f2239", border: "1px solid #1e3a5f", borderRadius: 20, padding: "5px 8px 5px 14px" }}>
              <span style={{ color: "#cbd5e1", fontSize: 12.5 }}>{asesoresAgencia[id]}</span>
              <button onClick={() => onRemoveAsesor(agenciaSel, id)} title="Dar de baja" style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 13, fontWeight: 700, padding: "2px 4px" }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function DemosSection({ monthKey }) {
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agenciaSel, setAgenciaSel] = useState("TOTAL");
  const [analisisIA, setAnalisisIA] = useState("");
  const [loadingIA, setLoadingIA] = useState(false);
  const [errorIA, setErrorIA] = useState("");
  const [catalogoAsesores, setCatalogoAsesores] = useState({});

  useEffect(() => {
    (async () => {
      setLoading(true);
      const raw = await fbGet(`${ENCUESTA_DEMO_PATH_PREFIX}/${monthKey}`);
      const lista = Array.isArray(raw) ? raw : (raw ? Object.values(raw) : []);
      setDatos(lista);
      setAnalisisIA("");
      setLoading(false);
    })();
  }, [monthKey]);

  useEffect(() => {
    (async () => {
      const raw = await fbGet(ASESORES_CATALOGO_PATH);
      const merged = {};
      AGENCIAS.forEach(ag => { merged[ag] = raw?.[ag] ?? {}; });
      setCatalogoAsesores(merged);
    })();
  }, []);

  const onAddAsesorCatalogo = (agencia, nombre) => {
    setCatalogoAsesores(prev => {
      const id = genAsesorId();
      const next = { ...prev, [agencia]: { ...(prev[agencia] ?? {}), [id]: nombre } };
      fbSet(`${ASESORES_CATALOGO_PATH}/${agencia}/${id}`, nombre);
      return next;
    });
  };

  const onRemoveAsesorCatalogo = (agencia, id) => {
    setCatalogoAsesores(prev => {
      const agObj = { ...(prev[agencia] ?? {}) };
      delete agObj[id];
      const next = { ...prev, [agencia]: agObj };
      fetch(`${FIREBASE_URL}/${ASESORES_CATALOGO_PATH}/${agencia}/${id}.json`, { method: "DELETE" }).catch(() => {});
      return next;
    });
  };

  const linkEncuesta = typeof window !== "undefined" ? `${window.location.origin}/encuesta-demo` : "/encuesta-demo";
  const [copiado, setCopiado] = useState(false);
  const copiarLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(linkEncuesta);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  const datosFiltrados = (() => {
    if (!datos) return [];
    if (agenciaSel === "TOTAL") return datos;
    return datos.filter(r => r.agencia === agenciaSel);
  })();

  const promedioGeneral = (() => {
    const vals = datosFiltrados.map(r => r.calificacion).filter(v => v !== null && v !== undefined);
    return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
  })();

  // % de prospectos a quienes el asesor SÍ compartió las ofertas del mes.
  // Solo cuenta respuestas explícitas (Sí/No); ignora "No recuerdo" y encuestas viejas sin el campo.
  const ofertasStats = (() => {
    const conRespuesta = datosFiltrados.filter(r => r.ofertas === "Sí" || r.ofertas === "No");
    const siOfertas = datosFiltrados.filter(r => r.ofertas === "Sí").length;
    const pct = conRespuesta.length > 0 ? (siOfertas / conRespuesta.length) * 100 : null;
    return { siOfertas, base: conRespuesta.length, pct };
  })();

  const porMunicipio = (() => {
    const map = {};
    datosFiltrados.forEach(r => {
      const key = (r.municipio || "Sin especificar").trim();
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([municipio, count]) => ({ municipio, count })).sort((a, b) => b.count - a.count);
  })();

  // % por línea de vehículo probada (pie chart)
  const porLineaPie = (() => {
    const map = {};
    datosFiltrados.forEach(r => {
      const key = (r.version || "Sin especificar").trim();
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  })();
  const coloresLinea = LINEAS_PRODUCTO.reduce((acc, l) => { acc[l.key] = l.color; return acc; }, {});
  const coloresPorLinea = porLineaPie.map(d => coloresLinea[d.label] || "#64748b");

  const porAsesor = (() => {
    const map = {};
    datosFiltrados.forEach(r => {
      const key = r.asesorNombre || "Sin asesor";
      if (!map[key]) map[key] = { asesor: key, agencia: r.agencia, calificaciones: [], total: 0 };
      map[key].total++;
      if (r.calificacion !== null && r.calificacion !== undefined) map[key].calificaciones.push(r.calificacion);
    });
    return Object.values(map)
      .map(a => ({ ...a, promedio: a.calificaciones.length ? a.calificaciones.reduce((s, v) => s + v, 0) / a.calificaciones.length : null }))
      .sort((a, b) => (b.promedio ?? -1) - (a.promedio ?? -1));
  })();

  const generarAnalisisIA = async () => {
    if (datosFiltrados.length === 0) return;
    setLoadingIA(true);
    setErrorIA("");
    setAnalisisIA("");
    try {
      const lineas = datosFiltrados.map(r =>
        `- Agencia: ${r.agencia} | Asesor: ${r.asesorNombre} | Versión probada: ${r.version || "—"} | Calificación: ${r.calificacion} | ¿Le compartieron ofertas del mes?: ${r.ofertas || "Sin dato"} | Municipio: ${r.municipio} | Le gustó: ${r.legusto || "—"} | No le gustó: ${r.nolegusto || "—"} | Comentario: ${r.comentario || "—"}`
      ).join("\n");

      const prompt = `Eres un director de marketing y comercial con 20 años de experiencia en grupos automotrices. Analiza estas encuestas de satisfacción de PRUEBAS DE MANEJO (demos) de prospectos de CHESA Changan, correspondientes a ${getMonthLabel(monthKey)}.

Cada línea es una respuesta real de un prospecto justo después de su prueba de manejo. Analiza el conjunto y entrega:

1. **Patrones de producto** — qué les gusta y qué no les gusta del vehículo, agrupado por tema
2. **Zonas con mayor interés** — qué municipios/colonias generan más pruebas de manejo, y qué tan bien calificada queda la experiencia ahí (para enfocar inversión publicitaria)
3. **Calidad de la experiencia por agencia/asesor** — quién está dejando mejor o peor impresión en la demo
4. **Comunicación de ofertas** — qué tan seguido el asesor compartió las grandes ofertas del mes (campo "¿Le compartieron ofertas del mes?"). Señala asesores o agencias donde esto se está omitiendo, porque es una fuga directa de ventas: un prospecto que no conoce la promoción difícilmente cierra.
5. **Recomendación de marketing** — 2-3 acciones concretas sobre dónde invertir más presupuesto publicitario y qué mensajes de producto resaltar, basado en los patrones reales encontrados

Sé directo y específico. Si los datos son insuficientes para alguna sección, dilo brevemente. Formato markdown con encabezados.

ENCUESTAS:
${lineas}`;

      const response = await fetch("/api/analisis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const responseData = await response.json();
      if (!response.ok) {
        setErrorIA(responseData.error || "Ocurrió un error generando el análisis.");
        return;
      }
      setAnalisisIA(responseData.text || "No se recibió respuesta.");
    } catch (e) {
      setErrorIA("Ocurrió un error de conexión. Intenta de nuevo.");
    } finally {
      setLoadingIA(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <SectionHeader title={`DEMOS — PRUEBAS DE MANEJO — ${getMonthLabel(monthKey).toUpperCase()}`} icon="🎯" />
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 18, background: "#0f2239", border: "1px solid #1e3a5f", borderRadius: 8, padding: "10px 14px" }}>
          <span style={{ color: "#94a3b8", fontSize: 12 }}>Comparte este link con los prospectos al finalizar su prueba de manejo:</span>
          <code style={{ color: "#3b9eea", fontSize: 12, background: "#0a1830", padding: "3px 8px", borderRadius: 4 }}>{linkEncuesta}</code>
          <button onClick={copiarLink} style={{
            background: copiado ? "#4ade80" : "#3b9eea", color: "#0a1628", border: "none",
            borderRadius: 6, padding: "5px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer"
          }}>{copiado ? "✓ Copiado" : "Copiar link"}</button>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          {["TOTAL", ...AGENCIAS].map(ag => (
            <button key={ag} onClick={() => setAgenciaSel(ag)} style={{
              background: agenciaSel === ag ? "#3b9eea" : "#0f2239",
              color: agenciaSel === ag ? "#0a1628" : "#94a3b8",
              border: `1px solid ${agenciaSel === ag ? "#3b9eea" : "#1e3a5f"}`,
              borderRadius: 6, padding: "5px 12px", fontSize: 11.5, fontWeight: 700, cursor: "pointer"
            }}>{ag}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ color: "#64748b", fontSize: 13, textAlign: "center", padding: "20px 0" }}>Cargando…</div>
        ) : datosFiltrados.length === 0 ? (
          <div style={{ color: "#475569", fontSize: 12.5, textAlign: "center", padding: "30px 0" }}>
            Todavía no hay respuestas de la encuesta de demo para {getMonthLabel(monthKey)}{agenciaSel !== "TOTAL" ? ` en ${agenciaSel}` : ""}.
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 18 }}>
              <div style={{ background: "#0f2239", border: "1px solid #1e3a5f", borderTop: "3px solid #D4AF37", borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700, letterSpacing: .8 }}>DEMOS REGISTRADAS</div>
                <div style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 800 }}>{datosFiltrados.length}</div>
              </div>
              <div style={{ background: "#0f2239", border: "1px solid #1e3a5f", borderTop: "3px solid #4ade80", borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700, letterSpacing: .8 }}>CALIFICACIÓN PROMEDIO</div>
                <div style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 800 }}>{promedioGeneral !== null ? promedioGeneral.toFixed(1) : "—"}</div>
              </div>
              <div style={{ background: "#0f2239", border: "1px solid #1e3a5f", borderTop: "3px solid #60a5fa", borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700, letterSpacing: .8 }}>MUNICIPIOS/ZONAS DISTINTAS</div>
                <div style={{ color: "#f1f5f9", fontSize: 22, fontWeight: 800 }}>{porMunicipio.length}</div>
              </div>
              <div style={{ background: "#0f2239", border: "1px solid #1e3a5f", borderTop: `3px solid ${ofertasStats.pct === null ? "#1e3a5f" : ofertasStats.pct >= 80 ? "#4ade80" : ofertasStats.pct >= 50 ? "#D4AF37" : "#f87171"}`, borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700, letterSpacing: .8 }}>LES COMPARTIERON OFERTAS</div>
                <div style={{ color: ofertasStats.pct === null ? "#f1f5f9" : ofertasStats.pct >= 80 ? "#4ade80" : ofertasStats.pct >= 50 ? "#D4AF37" : "#f87171", fontSize: 22, fontWeight: 800 }}>
                  {ofertasStats.pct !== null ? `${ofertasStats.pct.toFixed(0)}%` : "—"}
                </div>
                <div style={{ color: "#475569", fontSize: 11, marginTop: 3 }}>{ofertasStats.siOfertas} de {ofertasStats.base} respuestas</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 280 }}>
                <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: .8 }}>RANKING DE MUNICIPIOS / ZONAS</p>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ color: "#64748b", fontSize: 11 }}>
                      <th style={{ textAlign: "left", paddingBottom: 6 }}>MUNICIPIO / COLONIA</th>
                      <th style={{ textAlign: "center" }}>DEMOS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {porMunicipio.map(m => (
                      <tr key={m.municipio} style={{ borderTop: "1px solid #1e3a5f" }}>
                        <td style={{ padding: "6px 0", color: "#cbd5e1", fontSize: 12 }}>{m.municipio}</td>
                        <td style={{ textAlign: "center", color: "#D4AF37", fontWeight: 700 }}>{m.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ flex: 1, minWidth: 280 }}>
                <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 8, letterSpacing: .8 }}>CALIFICACIÓN POR ASESOR</p>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ color: "#64748b", fontSize: 11 }}>
                      <th style={{ textAlign: "left", paddingBottom: 6 }}>ASESOR</th>
                      <th style={{ textAlign: "center" }}>DEMOS</th>
                      <th style={{ textAlign: "center" }}>PROMEDIO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {porAsesor.map(a => (
                      <tr key={a.asesor} style={{ borderTop: "1px solid #1e3a5f" }}>
                        <td style={{ padding: "6px 0", color: "#cbd5e1", fontSize: 12 }}>{a.asesor}</td>
                        <td style={{ textAlign: "center", color: "#cbd5e1" }}>{a.total}</td>
                        <td style={{ textAlign: "center", fontWeight: 700, color: a.promedio === null ? "#475569" : a.promedio >= 9 ? "#4ade80" : a.promedio >= 7 ? "#D4AF37" : "#f87171" }}>
                          {a.promedio !== null ? a.promedio.toFixed(1) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </Card>

      {datosFiltrados.length > 0 && (
        <Card>
          <SectionHeader title="% DE PRUEBAS POR LÍNEA DE VEHÍCULO" icon="🥧" />
          <PieChartLeyenda datos={porLineaPie} colores={coloresPorLinea} />
        </Card>
      )}

      {datosFiltrados.length > 0 && (
        <Card>
          <SectionHeader title="COMENTARIOS DE LAS ENCUESTAS" icon="💬" />
          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: "60vh", overflowY: "auto" }}>
            {[...datosFiltrados].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).map((r, i) => (
              <div key={i} style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "baseline" }}>
                    <span style={{ color: "#f1f5f9", fontSize: 13, fontWeight: 700 }}>{r.asesorNombre || "Sin asesor"}</span>
                    <span style={{ color: "#64748b", fontSize: 11.5 }}>{r.agencia}</span>
                    <span style={{ color: "#64748b", fontSize: 11.5 }}>{r.version || "—"}</span>
                    <span style={{ color: "#64748b", fontSize: 11 }}>
                      {r.fecha ? new Date(r.fecha).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </span>
                    {r.ofertas && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
                        background: r.ofertas === "Sí" ? "#4ade8022" : r.ofertas === "No" ? "#f8717122" : "#64748b22",
                        color: r.ofertas === "Sí" ? "#4ade80" : r.ofertas === "No" ? "#f87171" : "#94a3b8",
                        border: `1px solid ${r.ofertas === "Sí" ? "#4ade80" : r.ofertas === "No" ? "#f87171" : "#64748b"}55`,
                        whiteSpace: "nowrap"
                      }}>
                        🏷️ Ofertas: {r.ofertas}
                      </span>
                    )}
                  </div>
                  <span style={{ fontWeight: 800, fontSize: 14, color: r.calificacion >= 9 ? "#4ade80" : r.calificacion >= 7 ? "#D4AF37" : "#f87171" }}>
                    {r.calificacion}/10
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12.5 }}>
                  <div><span style={{ color: "#64748b" }}>📍 {r.municipio}{r.colonia ? `, ${r.colonia}` : ""}</span></div>
                  {r.legusto && <div><span style={{ color: "#4ade80", fontWeight: 700 }}>👍 </span><span style={{ color: "#cbd5e1" }}>{r.legusto}</span></div>}
                  {r.nolegusto && <div><span style={{ color: "#f87171", fontWeight: 700 }}>👎 </span><span style={{ color: "#cbd5e1" }}>{r.nolegusto}</span></div>}
                  {r.comentario && <div><span style={{ color: "#3b9eea", fontWeight: 700 }}>💬 </span><span style={{ color: "#cbd5e1" }}>{r.comentario}</span></div>}
                  {!r.legusto && !r.nolegusto && !r.comentario && <div style={{ color: "#475569" }}>Sin comentarios adicionales.</div>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {datosFiltrados.length > 0 && (
        <Card>
          <SectionHeader title="ANÁLISIS DE PRODUCTO Y ZONAS — CRITERIO EXPERTO" icon="🧠" />
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
            <button
              onClick={generarAnalisisIA}
              disabled={loadingIA}
              style={{
                background: loadingIA ? "#1e3a5f" : "#D4AF37", color: loadingIA ? "#64748b" : "#0a1628",
                border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700,
                cursor: loadingIA ? "default" : "pointer"
              }}
            >
              {loadingIA ? "Analizando…" : "🧠 Analizar producto y zonas de oportunidad"}
            </button>
            <span style={{ color: "#64748b", fontSize: 11.5 }}>
              Identifica qué gusta del vehículo, qué zonas generan más interés, y dónde enfocar inversión publicitaria.
            </span>
          </div>

          {errorIA && (
            <div style={{ background: "#dc262622", border: "1px solid #f87171", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 13, marginBottom: 14 }}>
              {errorIA}
            </div>
          )}

          {loadingIA && (
            <div style={{ color: "#94a3b8", fontSize: 13, padding: "20px 0", textAlign: "center" }}>Analizando {datosFiltrados.length} respuestas…</div>
          )}

          {!loadingIA && analisisIA && (
            <div style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", borderRadius: 8, padding: "18px 20px", maxHeight: "70vh", overflowY: "auto" }}>
              {renderMarkdownGlobal(analisisIA)}
            </div>
          )}

          {!loadingIA && !analisisIA && !errorIA && (
            <div style={{ color: "#475569", fontSize: 12.5, textAlign: "center", padding: "30px 0" }}>
              Da clic en el botón para identificar patrones de producto y zonas de oportunidad.
            </div>
          )}
        </Card>
      )}

      <GestionAsesoresDemo catalogoAsesores={catalogoAsesores} onAddAsesor={onAddAsesorCatalogo} onRemoveAsesor={onRemoveAsesorCatalogo} />
    </div>
  );
}

function AnalisisSection({ data, monthKey, funnelData }) {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState("");
  const [error, setError] = useState("");

  const generarAnalisis = async () => {
    setLoading(true);
    setError("");
    setResultado("");
    try {
      const resumen = buildResumenParaIA(data, monthKey) + "\n" + buildResumenFunnelParaIA(funnelData);
      const prompt = `${CONTEXTO_CHESA}

Eres un consultor experto en gestión de dealerships automotrices. Analiza el corte de indicadores de ${getMonthLabel(monthKey)} y entrega:

1. **Diagnóstico general** (3-5 puntos clave respetando las prioridades reales del negocio)
2. **Plan de acción inmediato** (acciones concretas esta semana, priorizadas, con responsable sugerido)
3. **Alertas críticas** (indicadores que requieren atención urgente del Director de Marca)

Sé directo y orientado a la acción. Usa los nombres reales de las agencias. Formato markdown.

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
  const renderMarkdown = renderMarkdownGlobal;

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

// ── SECCIÓN: Alertas (proactivo, usa histórico completo) ──────────────────────
function AlertasSection({ monthKey }) {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState("");
  const [error, setError] = useState("");
  const [yaRevisado, setYaRevisado] = useState(false);

  const revisarAlertas = async () => {
    setLoading(true);
    setError("");
    setResultado("");
    try {
      const historico = await buildResumenHistorico(monthKey);
      const prompt = `${CONTEXTO_CHESA}

Eres el director comercial asesorando a CHESA. Revisa el histórico completo y detecta:

1. **Tendencias de riesgo sostenidas** (3+ meses cayendo en algún indicador)
2. **Comparativos relevantes** vs año anterior o promedio histórico
3. **Señales tempranas** que un director con experiencia notaría antes de que sean crisis

Recuerda las prioridades del negocio: no señales WS como alerta urgente si el sobreinventario es la causa. Sí señala si BBVA pierde participación o si leads críticos no se contactan a tiempo.

Si NO hay nada urgente, dilo claramente. Si SÍ hay alertas, máximo 5, ordenadas por urgencia. Formato markdown.

HISTÓRICO MES A MES:
${historico}`;

      const response = await fetch("/api/analisis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const responseData = await response.json();
      if (!response.ok) {
        setError(responseData.error || "Ocurrió un error revisando las alertas.");
        return;
      }
      setResultado(responseData.text || "No se recibió respuesta.");
      setYaRevisado(true);
    } catch (e) {
      setError("Ocurrió un error revisando las alertas. Verifica tu conexión e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ borderColor: yaRevisado && !loading ? "#1e3a5f" : undefined }}>
      <SectionHeader title="ALERTAS — REVISIÓN CON CRITERIO EXPERTO" icon="🚨" />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <button
          onClick={revisarAlertas}
          disabled={loading}
          style={{
            background: loading ? "#1e3a5f" : "#D4AF37",
            color: loading ? "#64748b" : "#0a1628",
            border: "none", borderRadius: 8, padding: "10px 20px",
            fontSize: 13, fontWeight: 700, cursor: loading ? "default" : "pointer"
          }}
        >
          {loading ? "Revisando histórico completo…" : "🔍 Revisar Alertas"}
        </button>
        <span style={{ color: "#64748b", fontSize: 11.5 }}>
          Analiza todo el histórico cargado (desde el inicio de operaciones) buscando tendencias de riesgo, no solo el mes actual.
        </span>
      </div>

      {error && (
        <div style={{ background: "#dc262622", border: "1px solid #f87171", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 13, marginBottom: 14 }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ color: "#94a3b8", fontSize: 13, padding: "20px 0", textAlign: "center" }}>
          Revisando el histórico completo de las 5 agencias… esto puede tardar unos segundos.
        </div>
      )}

      {!loading && resultado && (
        <div style={{ background: "#0d1b2e", border: "1px solid #1e3a5f", borderRadius: 8, padding: "18px 20px", maxHeight: "70vh", overflowY: "auto" }}>
          {renderMarkdownGlobal(resultado)}
        </div>
      )}

      {!loading && !resultado && !error && (
        <div style={{ color: "#475569", fontSize: 12.5, textAlign: "center", padding: "30px 0" }}>
          Da clic en el botón para revisar el histórico completo y detectar alertas urgentes.
        </div>
      )}
    </Card>
  );
}

// ── SECCIÓN: Chat libre (reactivo, con contexto del negocio) ──────────────────
function ChatSection({ data, monthKey, funnelData }) {
  const [mensajes, setMensajes] = useState([]); // [{role, content}]
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [contextoListo, setContextoListo] = useState(false);
  const contextoRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [mensajes, loading]);

  const prepararContexto = async () => {
    if (contextoRef.current) return contextoRef.current;
    const historico = await buildResumenHistorico(monthKey);
    const detalleMesActual = buildResumenParaIA(data, monthKey) + "\n" + buildResumenFunnelParaIA(funnelData);
    const contexto = `${CONTEXTO_CHESA}

Eres el director comercial asesorando a Javier García, Director de Marca de CHESA. Responde con criterio de experto que conoce las prioridades reales del negocio: directo, concreto, usando nombres reales de agencias y números reales. Si la pregunta requiere cálculo o comparación, hazlo explícito. Si no tienes el dato, dilo claramente.

HISTÓRICO MES A MES:
${historico}

DETALLE DEL MES ACTUAL (${getMonthLabel(monthKey)}):
${detalleMesActual}`;
    contextoRef.current = contexto;
    setContextoListo(true);
    return contexto;
  };

  const enviarMensaje = async () => {
    const texto = input.trim();
    if (!texto || loading) return;
    setInput("");
    setError("");
    const nuevosMensajes = [...mensajes, { role: "user", content: texto }];
    setMensajes(nuevosMensajes);
    setLoading(true);
    try {
      const contexto = await prepararContexto();
      const apiMessages = [
        { role: "user", content: contexto },
        { role: "assistant", content: "Entendido. Tengo el contexto completo del negocio. ¿En qué te puedo ayudar?" },
        ...nuevosMensajes,
      ];
      const response = await fetch("/api/analisis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });
      const responseData = await response.json();
      if (!response.ok) {
        setError(responseData.error || "Ocurrió un error.");
        setLoading(false);
        return;
      }
      setMensajes(prev => [...prev, { role: "assistant", content: responseData.text || "No se recibió respuesta." }]);
    } catch (e) {
      setError("Ocurrió un error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <SectionHeader title="PREGÚNTALE AL DIRECTOR COMERCIAL" icon="💬" />
      <div ref={scrollRef} style={{
        background: "#0d1b2e", border: "1px solid #1e3a5f", borderRadius: 8,
        padding: "16px 18px", height: "50vh", overflowY: "auto", marginBottom: 12,
        display: "flex", flexDirection: "column", gap: 14
      }}>
        {mensajes.length === 0 && (
          <div style={{ color: "#475569", fontSize: 12.5, textAlign: "center", margin: "auto 0" }}>
            Pregunta lo que quieras sobre el negocio: comparativos entre agencias, por qué bajó o subió algún indicador, qué agencia necesita más atención, etc.
            <br /><br />
            Ejemplos: <i>"¿Por qué bajó Tapachula en mayo?"</i> · <i>"Compara Comitán vs Ocosingo en rotación"</i> · <i>"¿Qué agencia necesita más atención este mes?"</i>
          </div>
        )}
        {mensajes.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "85%",
            background: m.role === "user" ? "#D4AF3722" : "#0f2239",
            border: `1px solid ${m.role === "user" ? "#D4AF37" : "#1e3a5f"}`,
            borderRadius: 10, padding: "10px 14px"
          }}>
            {m.role === "user"
              ? <span style={{ color: "#f1f5f9", fontSize: 13 }}>{m.content}</span>
              : <div>{renderMarkdownGlobal(m.content)}</div>}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: "flex-start", color: "#64748b", fontSize: 12.5 }}>Pensando…</div>
        )}
      </div>

      {error && (
        <div style={{ background: "#dc262622", border: "1px solid #f87171", borderRadius: 8, padding: "8px 12px", color: "#f87171", fontSize: 12.5, marginBottom: 10 }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviarMensaje(); } }}
          placeholder="Escribe tu pregunta…"
          disabled={loading}
          style={{
            flex: 1, background: "#0d1b2e", border: "1px solid #2a3f5f", color: "#f1f5f9",
            borderRadius: 8, padding: "10px 14px", fontSize: 13, outline: "none"
          }}
        />
        <button
          onClick={enviarMensaje}
          disabled={loading || !input.trim()}
          style={{
            background: (loading || !input.trim()) ? "#1e3a5f" : "#D4AF37",
            color: (loading || !input.trim()) ? "#64748b" : "#0a1628",
            border: "none", borderRadius: 8, padding: "10px 20px",
            fontSize: 13, fontWeight: 700, cursor: (loading || !input.trim()) ? "default" : "pointer"
          }}
        >
          Enviar
        </button>
      </div>
      <div style={{ color: "#475569", fontSize: 10.5, marginTop: 8, textAlign: "center" }}>
        El contexto incluye el histórico completo desde el inicio de operaciones y el detalle del mes en vista ({getMonthLabel(monthKey)}).
      </div>
    </Card>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
// ── VISTA EJECUTIVA — Briefing inteligente al iniciar ────────────────────────
function VistaEjecutiva({ data, monthKey, funnelData, onIrADetalle }) {
  const [briefing, setBriefing] = useState(null);   // { texto, generadoEn }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";

  const generarBriefing = async () => {
    setLoading(true); setError(""); setBriefing(null);
    try {
      const resumenMes = buildResumenParaIA(data, monthKey);
      const resumenFunnel = buildResumenFunnelParaIA(funnelData);

      // Todas las lecturas Firebase en paralelo
      const [rawInv, rawSatV, rawSatS, rawSatP, rawDemos, rawVentasHist, rawAdach] = await Promise.all([
        fbGet("inventario"),
        fbGet(`${SATISFACCION_PATH_PREFIX}/${monthKey}/ventas`),
        fbGet(`${SATISFACCION_PATH_PREFIX}/${monthKey}/servicio`),
        fbGet(`${SATISFACCION_PATH_PREFIX}/${monthKey}/prospeccion`),
        fbGet(`encuestasDemo/${monthKey}`),
        fbGet(VENTAS_HIST_PATH),
        fbGet(ADACH_PATH),
      ]);

      // Inventario
      let resumenInventario = "";
      if (rawInv?.unidades?.length > 0) {
        const criticas = rawInv.unidades.filter(u => u.dias > 120).length;
        const urgentes = rawInv.unidades.filter(u => u.dias > 90 && u.dias <= 120).length;
        const totalPP = rawInv.unidades.reduce((s, u) => {
          const tasa = ((rawInv.tiie || 8.5) + (rawInv.spread || 2)) / 100;
          return s + u.costoFactura * tasa / 365 * u.dias;
        }, 0);
        resumenInventario = `\nINVENTARIO (${rawInv.unidades.length} unidades):
- Críticas (>120 días): ${criticas} | Urgentes (91-120 días): ${urgentes}
- Costo plan piso acumulado: $${Math.round(totalPP).toLocaleString("es-MX")}`;
      }

      // Satisfacción cliente
      const procesarEncuestas = (raw, tipo) => {
        const arr = Array.isArray(raw) ? raw : (raw ? Object.values(raw) : []);
        if (!arr.length) return null;
        const califs = arr.map(r => r.calificacion).filter(v => v != null);
        const prom = califs.length ? (califs.reduce((s,v)=>s+v,0)/califs.length).toFixed(1) : "—";
        const conQueja = arr.filter(r => r.queja && r.queja.trim().length > 3 &&
          !["sin comentarios","sin comentario",""].includes(r.queja.trim().toLowerCase())).length;
        return `${tipo}: ${arr.length} encuestas, promedio ${prom}/10, quejas: ${conQueja}`;
      };
      const lineasSat = [
        procesarEncuestas(rawSatV, "Ventas"),
        procesarEncuestas(rawSatS, "Servicio"),
        procesarEncuestas(rawSatP, "Prospección"),
      ].filter(Boolean);
      const resumenSatisfaccion = lineasSat.length > 0
        ? `\nSATISFACCIÓN CLIENTE — ${getMonthLabel(monthKey)}:\n` + lineasSat.map(l => `- ${l}`).join("\n") : "";

      // Demos
      let resumenDemos = "";
      if (rawDemos) {
        const demos = Array.isArray(rawDemos) ? rawDemos : Object.values(rawDemos);
        if (demos.length > 0) {
          const califs = demos.map(d => d.calificacion).filter(v => v != null);
          const prom = califs.length ? (califs.reduce((s,v)=>s+v,0)/califs.length).toFixed(1) : "—";
          const modelos = {};
          demos.forEach(d => { if (d.version) modelos[d.version] = (modelos[d.version]||0)+1; });
          const topModelo = Object.entries(modelos).sort((a,b)=>b[1]-a[1])[0];
          resumenDemos = `\nDEMOS — ${getMonthLabel(monthKey)}: ${demos.length} encuestas, promedio ${prom}/10, modelo más demostrado: ${topModelo ? `${topModelo[0]} (${topModelo[1]})` : "—"}`;
        }
      }

      // Productividad asesores
      let resumenProductividad = "";
      if (rawVentasHist?.registros?.length > 0) {
        const registros = rawVentasHist.registros;
        const meses = [...new Set(registros.map(v => v.mes).filter(Boolean))].sort();
        const ultimoMes = meses[meses.length - 1];
        if (ultimoMes) {
          const [y, m] = ultimoMes.split("-").map(Number);
          const trim = [];
          for (let i = 2; i >= 0; i--) {
            let mm = m - i; let yy = y;
            if (mm <= 0) { mm += 12; yy -= 1; }
            trim.push(`${yy}-${String(mm).padStart(2,"0")}`);
          }
          const ventasTrim = registros.filter(v => trim.includes(v.mes));
          const porAsesor = {};
          ventasTrim.forEach(v => {
            const key = v.nombre || v.clave || "Sin nombre";
            if (!porAsesor[key]) porAsesor[key] = 0;
            porAsesor[key]++;
          });
          const ranking = Object.entries(porAsesor).sort((a,b)=>b[1]-a[1]).slice(0,5);
          resumenProductividad = `\nPRODUCTIVIDAD ASESORES (${trim[0]} → ${trim[2]}): ${ventasTrim.length} ventas totales, ${(ventasTrim.length/3).toFixed(1)}/mes promedio. Top 5: ${ranking.map(([n,c])=>`${n}(${c})`).join(", ")}`;
        }
      }

      // Mercado ADACH
      let resumenMercado = "";
      if (rawAdach && typeof rawAdach === "object") {
        const mesesAdach = Object.keys(rawAdach).sort().reverse();
        if (mesesAdach.length > 0) {
          const d = rawAdach[mesesAdach[0]]?.datos;
          if (d) {
            const competidores = d.competidoresChinos?.map(c => `${c.marca}:${c.unidades}`).join(", ") || "—";
            resumenMercado = `\nMERCADO CHIAPAS (${getMonthLabel(mesesAdach[0])} ADACH): mercado total ${d.mercadoTotal} uds (${d.variacionVsAnioAnterior>=0?"+":""}${d.variacionVsAnioAnterior}% vs año ant.), CHESA ${d.changanUnidades} uds (${d.changanShare}% MS), segmento emergentes ${d.marcasEmergentesTotal} uds. Competidores chinos: ${competidores}`;
          }
        }
      }

      const hoy = new Date().toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      const prompt = `${CONTEXTO_CHESA}

Hoy es ${hoy}. Eres el asesor de confianza de Javier García, Director de Marca de CHESA. Ya analizaste todos los datos. Tu trabajo NO es reportar métricas — es decirle QUÉ DECIDIR hoy.

Principio rector: "se mide mucho, pero se decide poco". No describas el estado del negocio; traduce los datos en decisiones. Cada punto que menciones debe responder implícitamente: qué significa, qué hacer, y qué se pierde si no se actúa.

FORMATO OBLIGATORIO (respétalo al pie de la letra, sé breve):

## Lo esencial hoy
Una sola frase (máximo 2 líneas) con el titular del día: lo más importante que Javier debe saber ahora mismo.

## Decisiones que requieren tu atención
Máximo 3 decisiones (idealmente 2). Para CADA una, exactamente 3 renglones con este formato:
**[Título de la decisión en 4-6 palabras]**
→ Qué pasa: [el dato duro, un número concreto, una frase]
→ Qué decidir: [la acción concreta, con responsable si aplica]
→ Riesgo de no actuar: [qué se pierde en $ o unidades o ventas si no se hace]

## Si todo lo demás va bien
Una línea mencionando lo que está en orden y no requiere decisión hoy (para que no pierda tiempo ahí).

REGLAS ESTRICTAS:
- Segunda persona ("tienes", "te conviene"). Números reales, nunca genéricos.
- Prioriza por impacto en las prioridades reales del negocio (cierre de ventas, contactación de leads, inventario crítico, BBVA, satisfacción). No inventes urgencias donde no las hay.
- Si un dato no amerita decisión, NO lo menciones. Silencio es mejor que ruido.
- Prohibido: párrafos largos, listas de métricas, explicaciones de qué es cada indicador. Solo decisiones.
- Markdown: solo negritas y encabezados ##. Nada más.

DATOS OPERATIVOS:
${resumenMes}

FUNNEL:
${resumenFunnel}
${resumenInventario}
${resumenSatisfaccion}
${resumenDemos}
${resumenProductividad}
${resumenMercado}`;

      const response = await fetch("/api/analisis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const responseData = await response.json();
      if (!response.ok) { setError(responseData.error || "Error generando el briefing."); return; }
      setBriefing({
        texto: responseData.text || "No se recibió respuesta.",
        generadoEn: new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }),
      });
    } catch (e) {
      console.error(e);
      setError("Error de conexión. Verifica tu conexión a internet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 860, margin: "0 auto" }}>

      {/* ── Saludo ───────────────────────────────────────────────────────── */}
      <div>
        <div style={{ color: "#64748b", fontSize: 12, fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>
          {new Date().toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" }).toUpperCase()}
        </div>
        <h1 style={{
          color: "#f1f5f9", fontSize: 32, fontWeight: 900,
          fontFamily: "Georgia, serif", margin: 0, lineHeight: 1.2
        }}>
          {saludo}, Javier.
        </h1>
        <p style={{ color: "#64748b", fontSize: 14, marginTop: 8 }}>
          {briefing
            ? `Generado hoy a las ${briefing.generadoEn} · ${getMonthLabel(monthKey)}`
            : `Convierte los datos de ${getMonthLabel(monthKey)} en las decisiones de hoy.`}
        </p>
      </div>

      {/* ── Botón de generación ──────────────────────────────────────────── */}
      {!briefing && !loading && (
        <div style={{
          background: "#0f2239", border: "1px solid #1e3a5f",
          borderLeft: "4px solid #D4AF37",
          borderRadius: 12, padding: "24px 28px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 16,
        }}>
          <div>
            <div style={{ color: "#D4AF37", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
              ⚡ Tus decisiones del día
            </div>
            <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.6, maxWidth: 480 }}>
              No es un reporte más. Cruza todos tus indicadores y te devuelve solo lo que exige una decisión hoy: qué pasa, qué hacer, y qué pierdes si no actúas.
            </div>
          </div>
          <button onClick={generarBriefing} style={{
            background: "#D4AF37", color: "#0a1628",
            border: "none", borderRadius: 10,
            padding: "14px 28px", fontSize: 14, fontWeight: 800,
            cursor: "pointer", whiteSpace: "nowrap",
            boxShadow: "0 4px 20px rgba(212,175,55,0.3)",
          }}>
            Ver mis decisiones de hoy
          </button>
        </div>
      )}

      {/* ── Estado de carga ──────────────────────────────────────────────── */}
      {loading && (
        <div style={{
          background: "#0f2239", border: "1px solid #1e3a5f",
          borderRadius: 12, padding: "40px 28px", textAlign: "center",
        }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>🧠</div>
          <div style={{ color: "#f1f5f9", fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
            Cruzando tus datos para encontrar las decisiones…
          </div>
          <div style={{ color: "#64748b", fontSize: 13 }}>
            Operativo, funnel, inventario, satisfacción, demos, productividad y mercado. Esto toma ~20-30 segundos.
          </div>
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <div style={{
          background: "#dc262622", border: "1px solid #f87171",
          borderRadius: 10, padding: "14px 18px", color: "#f87171", fontSize: 13,
        }}>
          {error}
          <button onClick={generarBriefing} style={{
            background: "none", border: "1px solid #f87171", color: "#f87171",
            borderRadius: 6, padding: "4px 12px", fontSize: 12, cursor: "pointer", marginLeft: 12
          }}>Reintentar</button>
        </div>
      )}

      {/* ── Briefing ─────────────────────────────────────────────────────── */}
      {briefing && (
        <>
          <div style={{
            background: "#0d1b2e",
            border: "1px solid #1e3a5f",
            borderTop: "3px solid #D4AF37",
            borderRadius: 12,
            padding: "28px 32px",
            lineHeight: 1.8,
          }}>
            {renderMarkdownGlobal(briefing.texto)}
          </div>

          {/* ── Acciones rápidas post-briefing ───────────────────────────── */}
          <div style={{
            display: "flex", gap: 10, flexWrap: "wrap",
            padding: "4px 0",
          }}>
            <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, width: "100%", marginBottom: 2 }}>
              IR A:
            </div>
            {[
              { icon: "📊", label: "Operativo", tab: "operativo" },
              { icon: "🪜", label: "Funnel", tab: "funnel" },
              { icon: "🏆", label: "Productividad", tab: "productividad" },
              { icon: "📦", label: "Inventario", tab: "inventario" },
              { icon: "🧠", label: "Análisis IA", tab: "analisis" },
              { icon: "💬", label: "Director Comercial", tab: "chat" },
            ].map(s => (
              <button key={s.tab} onClick={() => onIrADetalle(s.tab)} style={{
                background: "#0f2239", border: "1px solid #1e3a5f",
                color: "#94a3b8", borderRadius: 8,
                padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor="#3b9eea"; e.currentTarget.style.color="#f1f5f9"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor="#1e3a5f"; e.currentTarget.style.color="#94a3b8"; }}
              >
                {s.icon} {s.label}
              </button>
            ))}
            <button onClick={generarBriefing} style={{
              background: "transparent", border: "1px solid #475569",
              color: "#475569", borderRadius: 8,
              padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer",
              marginLeft: "auto",
            }}>
              ↺ Regenerar
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── SECCIÓN: Ritmo de ventas facturadas (comparativos) ────────────────────────
// Compara el facturado del mes en vista contra el mes anterior y contra el mismo
// mes del año pasado. Lee el facturado que ya está en Firebase (alimentado por el
// reporte de ventas), así siempre está actualizado sin re-subir nada.
function RitmoVentasSection({ monthKey }) {
  const [loading, setLoading] = useState(true);
  const [tot, setTot] = useState({ actual: 0, prev: 0, anio: 0, porAgencia: [], prevKey: "", anioKey: "" });
  const [diaCorte, setDiaCorte] = useState(31);
  const [esParcial, setEsParcial] = useState(false);
  const [sinRitmo, setSinRitmo] = useState(false);
  const [prevSinDato, setPrevSinDato] = useState(false);
  const [anioSinDato, setAnioSinDato] = useState(false);

  const mesAnioAnterior = (mk) => {
    const [y, m] = mk.split("-");
    return `${parseInt(y, 10) - 1}-${m}`;
  };

  // Normaliza el arreglo diario (Firebase puede devolver objeto disperso en vez de array).
  const toArr31 = (v) => {
    if (Array.isArray(v)) return v;
    if (v && typeof v === "object") {
      const arr = new Array(31).fill(0);
      Object.entries(v).forEach(([k, val]) => { const i = parseInt(k, 10); if (i >= 0 && i < 31) arr[i] = val || 0; });
      return arr;
    }
    return new Array(31).fill(0);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const prevKey = getPreviousMonthKey(monthKey);
      const anioKey = mesAnioAnterior(monthKey);

      // Si el mes en vista es el mes calendario en curso, cortamos al día de hoy.
      // Si es un mes ya cerrado, usamos el mes completo (día 31).
      const hoy = new Date();
      const esMesEnCurso = monthKey === getMonthKey(hoy);
      const corte = esMesEnCurso ? hoy.getDate() : 31;

      const [ritA, ritP, ritY, rawA, rawP, rawY] = await Promise.all([
        fbGet(`ventasRitmo/${monthKey}`),
        fbGet(`ventasRitmo/${prevKey}`),
        fbGet(`ventasRitmo/${anioKey}`),
        fbGet(`datos/${monthKey}`),
        fbGet(`datos/${prevKey}`),
        fbGet(`datos/${anioKey}`),
      ]);
      if (cancelled) return;

      // Facturado por agencia hasta el día "corte", usando el desglose diario.
      // IMPORTANTE: en modo "a la misma fecha" (mes en curso), NO caemos al total
      // mensual si falta el desglose diario — eso compararía días contra mes completo
      // y daría variaciones falsas. Devolvemos null para marcar "sin dato comparable".
      const facturadoAg = (rit, raw, ag, D, permitirTotalMensual) => {
        const arr = rit ? toArr31(rit[encodeKey(ag)] ?? rit[ag]) : null;
        if (arr) return arr.slice(0, D).reduce((a, b) => a + (b || 0), 0);
        if (!permitirTotalMensual) return null; // sin desglose diario y no se permite fallback
        const merged = decodeFirebaseData(raw?.ventasJunioInterno, initialData.ventasJunioInterno);
        return merged?.[ag]?.facturado ?? 0;
      };
      // El mes actual siempre tiene desglose (se acaba de importar). Los de referencia
      // solo permiten fallback al total mensual cuando NO estamos cortando por fecha.
      const permitirFallback = !esMesEnCurso;
      const totalDe = (rit, raw, D, permitir) => AGENCIAS.reduce((s, ag) => {
        const v = facturadoAg(rit, raw, ag, D, permitir);
        return s + (v ?? 0);
      }, 0);
      // ¿El periodo de referencia tiene desglose diario para poder comparar a la misma fecha?
      const tieneRitmo = (rit) => !!rit;

      const porAgencia = AGENCIAS.map(ag => ({
        ag,
        actual: facturadoAg(ritA, rawA, ag, corte, true) ?? 0,
        prev: facturadoAg(ritP, rawP, ag, corte, permitirFallback),
        anio: facturadoAg(ritY, rawY, ag, corte, permitirFallback),
      }));

      setDiaCorte(corte);
      setEsParcial(esMesEnCurso);
      // Avisamos si falta desglose para el comparativo justo (mes actual, o meses de referencia).
      setSinRitmo(esMesEnCurso && (!ritA || !ritP || !ritY));
      setPrevSinDato(esMesEnCurso && !ritP);
      setAnioSinDato(esMesEnCurso && !ritY);
      setTot({
        actual: totalDe(ritA, rawA, corte, true),
        prev: tieneRitmo(ritP) || permitirFallback ? totalDe(ritP, rawP, corte, permitirFallback) : null,
        anio: tieneRitmo(ritY) || permitirFallback ? totalDe(ritY, rawY, corte, permitirFallback) : null,
        porAgencia, prevKey, anioKey,
      });
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [monthKey]);

  // Δ y % de variación entre dos valores. Si el valor de referencia es null
  // (no hay desglose diario para comparar a la misma fecha), devolvemos sinDato.
  const delta = (a, b) => {
    if (b === null || b === undefined) return { sinDato: true };
    if (b === 0) return { diff: a, pct: a === 0 ? 0 : null };
    return { diff: a - b, pct: ((a - b) / b) * 100 };
  };

  const dPrev = delta(tot.actual, tot.prev);
  const dAnio = delta(tot.actual, tot.anio);

  // Tarjeta de comparación reutilizable
  const CompCard = ({ titulo, refValor, refLabel, d }) => {
    if (d.sinDato) {
      return (
        <div style={{ flex: 1, minWidth: 200, background: "#0f2239", border: "1px solid #1e3a5f", borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ color: "#64748b", fontSize: 10.5, fontWeight: 700, letterSpacing: .6, marginBottom: 8 }}>{titulo}</div>
          <div style={{ color: "#64748b", fontSize: 15, fontWeight: 700 }}>Sin dato comparable</div>
          <div style={{ color: "#475569", fontSize: 11, marginTop: 6, lineHeight: 1.4 }}>
            Sube el reporte de ventas para tener el detalle diario de {refLabel} y comparar a la misma fecha.
          </div>
        </div>
      );
    }
    const sube = d.diff > 0, baja = d.diff < 0;
    const color = sube ? "#4ade80" : baja ? "#f87171" : "#64748b";
    const flecha = sube ? "▲" : baja ? "▼" : "—";
    return (
      <div style={{ flex: 1, minWidth: 200, background: "#0f2239", border: "1px solid #1e3a5f", borderRadius: 10, padding: "14px 16px" }}>
        <div style={{ color: "#64748b", fontSize: 10.5, fontWeight: 700, letterSpacing: .6, marginBottom: 8 }}>{titulo}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ color, fontSize: 26, fontWeight: 900 }}>
            {flecha} {d.diff > 0 ? "+" : ""}{d.diff}
          </span>
          {d.pct !== null && (
            <span style={{ color, fontSize: 14, fontWeight: 700 }}>
              {d.pct > 0 ? "+" : ""}{d.pct.toFixed(0)}%
            </span>
          )}
        </div>
        <div style={{ color: "#475569", fontSize: 11.5, marginTop: 6 }}>
          {refLabel}: <b style={{ color: "#94a3b8" }}>{refValor}</b> unidades
        </div>
      </div>
    );
  };

  return (
    <Card>
      <SectionHeader title={`RITMO DE VENTAS FACTURADAS — ${getMonthLabel(monthKey).toUpperCase()}`} icon="🚀" />
      {loading ? (
        <div style={{ color: "#64748b", fontSize: 13, textAlign: "center", padding: "24px 0" }}>Calculando ritmo…</div>
      ) : (
        <>
          {esParcial && (
            <div style={{ background: "#60a5fa11", border: "1px solid #60a5fa33", borderRadius: 8, padding: "8px 14px", color: "#60a5fa", fontSize: 12, marginBottom: 14, fontWeight: 700 }}>
              📅 Comparación justa: todos los periodos cortados al <b>día {diaCorte}</b> del mes (mismo periodo contra mismo periodo).
            </div>
          )}
          {sinRitmo && (
            <div style={{ background: "#D4AF3711", border: "1px solid #D4AF3733", borderRadius: 8, padding: "8px 14px", color: "#D4AF37", fontSize: 12, marginBottom: 14 }}>
              💡 Para comparar a la misma fecha necesito el detalle diario de {prevSinDato && anioSinDato ? "los meses de referencia" : prevSinDato ? getMonthLabel(tot.prevKey) : getMonthLabel(tot.anioKey)}. Sube un reporte de ventas que incluya el histórico (mayo 2024 a la fecha) y se generará automáticamente.
            </div>
          )}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "stretch", marginBottom: 16 }}>
            {/* Facturado del mes actual */}
            <div style={{ flex: 1, minWidth: 200, background: "#0d1b2e", border: "1px solid #D4AF3755", borderTop: "3px solid #D4AF37", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ color: "#64748b", fontSize: 10.5, fontWeight: 700, letterSpacing: .6, marginBottom: 8 }}>
                {esParcial ? `FACTURADO AL DÍA ${diaCorte}` : "FACTURADO DEL MES"}
              </div>
              <div style={{ color: "#D4AF37", fontSize: 34, fontWeight: 900, lineHeight: 1 }}>{tot.actual}</div>
              <div style={{ color: "#475569", fontSize: 11.5, marginTop: 6 }}>unidades · 5 agencias</div>
            </div>
            <CompCard titulo="VS MES ANTERIOR" refValor={tot.prev} refLabel={getMonthLabel(tot.prevKey)} d={dPrev} />
            <CompCard titulo="VS MISMO MES AÑO PASADO" refValor={tot.anio} refLabel={getMonthLabel(tot.anioKey)} d={dAnio} />
          </div>

          {/* Desglose por agencia */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color: "#64748b", fontSize: 11 }}>
                <th style={{ textAlign: "left", paddingBottom: 6 }}>AGENCIA</th>
                <th style={{ textAlign: "center" }}>ESTE MES</th>
                <th style={{ textAlign: "center" }}>MES ANT.</th>
                <th style={{ textAlign: "center" }}>vs MES ANT.</th>
                <th style={{ textAlign: "center" }}>AÑO PAS.</th>
                <th style={{ textAlign: "center" }}>vs AÑO PAS.</th>
              </tr>
            </thead>
            <tbody>
              {tot.porAgencia.map(r => {
                const dp = delta(r.actual, r.prev);
                const da = delta(r.actual, r.anio);
                const chip = (d) => {
                  if (d.sinDato) return <span style={{ color: "#475569", fontSize: 11.5 }}>—</span>;
                  const color = d.diff > 0 ? "#4ade80" : d.diff < 0 ? "#f87171" : "#64748b";
                  const flecha = d.diff > 0 ? "▲" : d.diff < 0 ? "▼" : "—";
                  return (
                    <span style={{ color, fontWeight: 700, fontSize: 12 }}>
                      {flecha} {d.diff > 0 ? "+" : ""}{d.diff}
                      {d.pct !== null && <span style={{ fontSize: 10.5 }}> ({d.pct > 0 ? "+" : ""}{d.pct.toFixed(0)}%)</span>}
                    </span>
                  );
                };
                return (
                  <tr key={r.ag} style={{ borderTop: "1px solid #1e3a5f" }}>
                    <td style={{ padding: "6px 0", color: "#cbd5e1", fontSize: 12 }}>{r.ag}</td>
                    <td style={{ textAlign: "center", color: "#D4AF37", fontWeight: 700 }}>{r.actual}</td>
                    <td style={{ textAlign: "center", color: "#64748b" }}>{r.prev === null ? "—" : r.prev}</td>
                    <td style={{ textAlign: "center" }}>{chip(dp)}</td>
                    <td style={{ textAlign: "center", color: "#64748b" }}>{r.anio === null ? "—" : r.anio}</td>
                    <td style={{ textAlign: "center" }}>{chip(da)}</td>
                  </tr>
                );
              })}
              <tr style={{ borderTop: "2px solid #D4AF3755" }}>
                <td style={{ color: "#D4AF37", fontWeight: 700, padding: "6px 0", fontSize: 12 }}>TOTAL</td>
                <td style={{ textAlign: "center", color: "#D4AF37", fontWeight: 800 }}>{tot.actual}</td>
                <td style={{ textAlign: "center", color: "#94a3b8", fontWeight: 700 }}>{tot.prev === null ? "—" : tot.prev}</td>
                <td style={{ textAlign: "center", color: dPrev.sinDato ? "#475569" : dPrev.diff > 0 ? "#4ade80" : dPrev.diff < 0 ? "#f87171" : "#64748b", fontWeight: 800, fontSize: 12 }}>
                  {dPrev.sinDato ? "—" : `${dPrev.diff > 0 ? "▲ +" : dPrev.diff < 0 ? "▼ " : "— "}${dPrev.diff}`}
                </td>
                <td style={{ textAlign: "center", color: "#94a3b8", fontWeight: 700 }}>{tot.anio === null ? "—" : tot.anio}</td>
                <td style={{ textAlign: "center", color: dAnio.sinDato ? "#475569" : dAnio.diff > 0 ? "#4ade80" : dAnio.diff < 0 ? "#f87171" : "#64748b", fontWeight: 800, fontSize: 12 }}>
                  {dAnio.sinDato ? "—" : `${dAnio.diff > 0 ? "▲ +" : dAnio.diff < 0 ? "▼ " : "— "}${dAnio.diff}`}
                </td>
              </tr>
            </tbody>
          </table>
          <div style={{ color: "#475569", fontSize: 10.5, marginTop: 10, textAlign: "center" }}>
            {esParcial
              ? `Comparación a la misma fecha: ${getMonthLabel(monthKey)} al día ${diaCorte} vs ${getMonthLabel(tot.prevKey)} y ${getMonthLabel(tot.anioKey)}, también al día ${diaCorte}.`
              : `Compara el mes completo de ${getMonthLabel(monthKey)} contra ${getMonthLabel(tot.prevKey)} y ${getMonthLabel(tot.anioKey)}.`}
          </div>
        </>
      )}
    </Card>
  );
}

function Dashboard({ userRole, userAgencia, userEmail }) {
  const [tab, setTab] = useState("resumen"); // resumen | operativo | funnel | ...
  const [data, setData] = useState(initialData);
  const [funnelData, setFunnelData] = useState(initialFunnel);
  const [status, setStatus] = useState("conectando"); // conectando | ok | error
  const [lastSaved, setLastSaved] = useState(null);
  const saveTimer = useRef(null);
  const isSavingRef = useRef(false);
  const funnelSaveTimer = useRef(null);
  const isSavingFunnelRef = useRef(false);

  const currentMonthKey = getOperativeMonthKey();
  const [viewMonth, setViewMonth] = useState(currentMonthKey); // mes que se está viendo
  const [vistaAnualActiva, setVistaAnualActiva] = useState(false); // true cuando se elige "Año completo"
  const [availableMonths, setAvailableMonths] = useState([currentMonthKey]);
  const isHistorico = viewMonth !== currentMonthKey;
  const isReadOnly = false; // los meses históricos ahora también son editables (captura retroactiva)
  const viewMonthRef = useRef(viewMonth);
  useEffect(() => { viewMonthRef.current = viewMonth; }, [viewMonth]);

  // ── Cargar el Funnel del mes en vista desde Firebase ───────────────────────
  useEffect(() => {
    let cancelled = false;
    const mesACagar = viewMonth;

    (async () => {
      const raw = await fbGet(`${FUNNEL_PATH}/${mesACagar}`);
      if (cancelled) return;
      if (raw && typeof raw === "object") {
        const merged = {};
        AGENCIAS.forEach(ag => {
          merged[ag] = raw[ag] && typeof raw[ag] === "object"
            ? { ...funnelAgenciaBlank(), ...raw[ag] }
            : funnelAgenciaBlank();
        });
        setFunnelData(merged);
      } else {
        setFunnelData(JSON.parse(JSON.stringify(initialFunnel)));
      }
    })();

    const poll = setInterval(async () => {
      if (isSavingFunnelRef.current || cancelled) return;
      const raw = await fbGet(`${FUNNEL_PATH}/${mesACagar}`);
      if (cancelled || isSavingFunnelRef.current) return;
      if (raw && typeof raw === "object") {
        const merged = {};
        AGENCIAS.forEach(ag => {
          merged[ag] = raw[ag] && typeof raw[ag] === "object"
            ? { ...funnelAgenciaBlank(), ...raw[ag] }
            : funnelAgenciaBlank();
        });
        setFunnelData(merged);
      }
    }, 20000);

    return () => { cancelled = true; clearInterval(poll); };
  }, [viewMonth]);

  const [funnelSaveStatus, setFunnelSaveStatus] = useState(""); // "" | "guardando" | "guardado" | "error"
  const funnelSaveStatusTimer = useRef(null);

  const scheduleSaveFunnel = (next, targetMonth) => {
    if (funnelSaveTimer.current) clearTimeout(funnelSaveTimer.current);
    const mesDestino = targetMonth || viewMonthRef.current;
    isSavingFunnelRef.current = true;
    setFunnelSaveStatus("guardando");
    funnelSaveTimer.current = setTimeout(async () => {
      try {
        await fbSet(`${FUNNEL_PATH}/${mesDestino}`, next);
        setFunnelSaveStatus("guardado");
        if (funnelSaveStatusTimer.current) clearTimeout(funnelSaveStatusTimer.current);
        funnelSaveStatusTimer.current = setTimeout(() => setFunnelSaveStatus(""), 3000);
      } catch(e) {
        console.error("Error guardando funnel:", e);
        setFunnelSaveStatus("error");
      } finally {
        setTimeout(() => { isSavingFunnelRef.current = false; }, 5000);
      }
    }, 600);
  };

  const onFunnelFieldChange = (agencia, campo, val) => {
    // Capturar el mes AHORA antes de cualquier async
    const mesDestino = viewMonthRef.current;
    setFunnelData(prev => {
      const agPrev = prev[agencia] ?? funnelAgenciaBlank();
      const next = { ...prev, [agencia]: { ...agPrev, [campo]: val } };
      // Guardar inmediatamente con debounce
      scheduleSaveFunnel(next, mesDestino);
      return next;
    });
  };



  // ── Lista de meses disponibles: desde mayo 2024 hasta el mes operativo actual ─
  useEffect(() => {
    setAvailableMonths(getAllMonthsRange(currentMonthKey).reverse()); // más reciente primero
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
      if (viewMonthRef.current !== currentMonthKey) return; // no refrescar si está viendo histórico
      if (isSavingRef.current) return; // no refrescar si hay un guardado en curso
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
      if (raw && typeof raw === "object" && Object.keys(raw).length > 0) {
        const merged = {};
        Object.keys(initialData).forEach(section => {
          merged[section] = decodeFirebaseData(raw[section], initialData[section]);
        });
        setData(merged);
      } else {
        // Mes histórico nunca capturado: arranca en blanco, listo para captura retroactiva.
        setData(JSON.parse(JSON.stringify(initialData)));
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

  // ── Importación automática del reporte de ventas ─────────────────────────────
  const [importandoVentas, setImportandoVentas] = useState(false);
  const [importResultado, setImportResultado] = useState(null); // { meses, total } | { error }
  const ventasFileRef = useRef(null);

  const handleImportarVentas = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportandoVentas(true);
    setImportResultado(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: true });
      const ventas = parseVentasWorkbook(wb);
      if (ventas.length === 0) {
        setImportResultado({ error: "No se encontraron ventas. Verifica que sea el reporte 'Hoja de Costos y Utilidad'." });
        setImportandoVentas(false);
        if (ventasFileRef.current) ventasFileRef.current.value = "";
        return;
      }
      const porMes = agregarVentasPorMes(ventas);
      const meses = Object.keys(porMes).sort();

      // Para cada mes, hacemos merge sobre lo que ya existe en Firebase:
      // sobreescribimos SOLO ventasJunioInterno.facturado, planesPago y lineasProducto.
      // Conservamos objetivos y todos los demás indicadores capturados a mano.
      let mesesActualizados = 0;
      for (const mk of meses) {
        const rawExistente = await fbGet(`datos/${mk}`);
        let base;
        if (rawExistente && typeof rawExistente === "object" && Object.keys(rawExistente).length > 0) {
          base = {};
          Object.keys(initialData).forEach(section => {
            base[section] = decodeFirebaseData(rawExistente[section], initialData[section]);
          });
        } else {
          base = JSON.parse(JSON.stringify(initialData));
        }

        AGENCIAS.forEach(ag => {
          const datosAg = porMes[mk][ag];
          if (datosAg) {
            // El facturado (unidades vendidas) es el mismo para ambos bloques:
            // solo cambia el objetivo contra el que se compara (interno vs Changan MX).
            base.ventasJunioInterno[ag] = {
              ...base.ventasJunioInterno[ag],
              facturado: datosAg.facturado,
            };
            base.ventasJunioMexico[ag] = {
              ...base.ventasJunioMexico[ag],
              facturado: datosAg.facturado,
            };
            // Planes y líneas: reemplazo completo con lo del reporte
            base.planesPago[ag] = { ...datosAg.planesPago };
            base.lineasProducto[ag] = { ...datosAg.lineasProducto };
          } else {
            // Agencia sin ventas ese mes: facturado en 0, planes y líneas en cero
            base.ventasJunioInterno[ag] = { ...base.ventasJunioInterno[ag], facturado: 0 };
            base.ventasJunioMexico[ag] = { ...base.ventasJunioMexico[ag], facturado: 0 };
            base.planesPago[ag] = Object.fromEntries(PLANES.map(p => [p.key, 0]));
            base.lineasProducto[ag] = Object.fromEntries(LINEAS_PRODUCTO.map(l => [l.key, 0]));
          }
        });

        await fbSet(`datos/${mk}`, buildFirebaseSafeData(base));

        // Guardar el desglose DIARIO por agencia para el comparativo "a la misma fecha".
        const ritmoMes = {};
        AGENCIAS.forEach(ag => {
          ritmoMes[encodeKey(ag)] = porMes[mk][ag]?.diario ?? new Array(31).fill(0);
        });
        await fbSet(`ventasRitmo/${mk}`, ritmoMes);

        mesesActualizados++;

        // Si el mes procesado es el que se está viendo ahora, refrescar la vista.
        if (mk === viewMonthRef.current) setData(base);

        // Asegurar que el mes aparezca en el índice de meses disponibles.
        setAvailableMonths(prev => Array.from(new Set([...prev, mk])).sort().reverse());
      }

      const totalVentas = meses.reduce((s, mk) =>
        s + AGENCIAS.reduce((sa, ag) => sa + (porMes[mk][ag]?.facturado ?? 0), 0), 0);
      setImportResultado({ meses: mesesActualizados, total: totalVentas, rango: `${meses[0]} → ${meses[meses.length - 1]}` });
    } catch (err) {
      console.error(err);
      setImportResultado({ error: "No se pudo procesar el archivo. Verifica que sea un Excel válido del reporte de ventas." });
    } finally {
      setImportandoVentas(false);
      if (ventasFileRef.current) ventasFileRef.current.value = "";
    }
  };

  // ── Guardar a Firebase con debounce 800ms ────────────────────────────────────
  const scheduleSave = (newData, targetMonth) => {
    setStatus("guardando");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const mesDestino = targetMonth || viewMonth;
    isSavingRef.current = true;
    saveTimer.current = setTimeout(async () => {
      try {
        await fbSet(`datos/${mesDestino}`, buildFirebaseSafeData(newData));
        setStatus("ok");
        setLastSaved(new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      } catch {
        setStatus("error");
      } finally {
        isSavingRef.current = false;
      }
    }, 150);
  };

  // ── Handlers centralizados ───────────────────────────────────────────────────
  const onFieldChange = (section, ag, field, val) => {
    const mesAlEditar = viewMonth;
    setData(prev => {
      const next = {
        ...prev,
        [section]: {
          ...prev[section],
          [ag]: { ...prev[section][ag], [field]: val }
        }
      };
      scheduleSave(next, mesAlEditar);
      return next;
    });
  };

  const onSimpleChange = (section, ag, val) => {
    const mesAlEditar = viewMonth;
    setData(prev => {
      const next = { ...prev, [section]: { ...prev[section], [ag]: val } };
      scheduleSave(next, mesAlEditar);
      return next;
    });
  };

  const onToggleVau = (ag) => {
    const mesAlEditar = viewMonth;
    setData(prev => {
      const next = { ...prev, vau: { ...prev.vau, [ag]: !prev.vau[ag] } };
      scheduleSave(next, mesAlEditar);
      return next;
    });
  };

  const onLineaChange = (ag, linea, val) => {
    const mesAlEditar = viewMonth;
    setData(prev => {
      const next = {
        ...prev,
        lineasProducto: {
          ...prev.lineasProducto,
          [ag]: { ...prev.lineasProducto[ag], [linea]: val }
        }
      };
      scheduleSave(next, mesAlEditar);
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
        borderBottom: "3px solid #3b9eea",
        padding: "18px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8
      }}>
        <div>
          <div style={{ color: "#3b9eea", fontSize: 11, fontWeight: 700, letterSpacing: 3 }}>FORESIGHT</div>
          <h1 style={{ margin: "2px 0 0", fontSize: 23, fontWeight: 700, color: "#f1f5f9", fontFamily: "Georgia, 'Times New Roman', serif" }}>
            Foresight Auto Intelligence
          </h1>
          <div style={{ color: "#64748b", fontSize: 11, marginTop: 3 }}>
            CHANGAN · CHESA — {getMonthLabel(viewMonth).charAt(0).toUpperCase() + getMonthLabel(viewMonth).slice(1)}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#cbd5e1", fontSize: 11.5, fontWeight: 600 }}>{userEmail}</div>
            <div style={{ color: "#64748b", fontSize: 10 }}>
              {userRole === "director" ? "Director de Marca" : `Gerente — ${userAgencia}`}
            </div>
          </div>
          <button
            onClick={() => signOut(auth)}
            title="Cerrar sesión"
            style={{
              background: "transparent", border: "1px solid #2a3f5f", color: "#94a3b8",
              borderRadius: 6, padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer"
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      <div style={{
        padding: "10px 28px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
        background: "#0a1830", borderBottom: "1px solid #1e3a5f"
      }}>
        {(() => {
            const years = Array.from(new Set(availableMonths.map(getYearFromKey))).sort().reverse();
            const viewYear = getYearFromKey(viewMonth);
            const monthsOfYear = availableMonths
              .filter(mk => getYearFromKey(mk) === viewYear)
              .sort(); // ascendente dentro del año
            return (
              <>
                <select
                  value={viewYear}
                  onChange={e => {
                    const y = e.target.value;
                    const candidatos = availableMonths.filter(mk => getYearFromKey(mk) === y).sort().reverse();
                    if (candidatos.length) setViewMonth(candidatos[0]);
                  }}
                  style={{
                    background: "#0d1b2e", border: "1px solid #2a3f5f", color: "#D4AF37",
                    borderRadius: 6, padding: "6px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer"
                  }}
                >
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select
                  value={vistaAnualActiva ? "ANUAL" : viewMonth}
                  onChange={e => {
                    if (e.target.value === "ANUAL") {
                      setVistaAnualActiva(true);
                    } else {
                      setVistaAnualActiva(false);
                      setViewMonth(e.target.value);
                    }
                  }}
                  style={{
                    background: "#0d1b2e", border: "1px solid #2a3f5f", color: "#D4AF37",
                    borderRadius: 6, padding: "6px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer"
                  }}
                >
                  <option value="ANUAL">🗓️ Año completo</option>
                  {monthsOfYear.map(mk => (
                    <option key={mk} value={mk}>
                      {MES_NOMBRES[getMonthNumFromKey(mk) - 1].charAt(0).toUpperCase() + MES_NOMBRES[getMonthNumFromKey(mk) - 1].slice(1)}
                      {mk === currentMonthKey ? " (actual)" : ""}
                    </option>
                  ))}
                </select>
              </>
            );
          })()}
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setTab("resumen")} style={{
              background: tab === "resumen" ? "#D4AF37" : "transparent",
              color: tab === "resumen" ? "#0a1628" : "#D4AF37",
              border: "1px solid #D4AF37", borderRadius: 6, padding: "6px 14px",
              fontSize: 12, fontWeight: 700, cursor: "pointer"
            }}>⚡ Resumen Ejecutivo</button>
            <button onClick={() => setTab("operativo")} style={{
              background: tab === "operativo" ? "#5eead4" : "transparent",
              color: tab === "operativo" ? "#0a1628" : "#94a3b8",
              border: "1px solid #5eead4", borderRadius: 6, padding: "6px 14px",
              fontSize: 12, fontWeight: 700, cursor: "pointer"
            }}>📊 Operativo</button>
            <button onClick={() => setTab("funnel")} style={{
              background: tab === "funnel" ? "#5eead4" : "transparent",
              color: tab === "funnel" ? "#0a1628" : "#94a3b8",
              border: "1px solid #5eead4", borderRadius: 6, padding: "6px 14px",
              fontSize: 12, fontWeight: 700, cursor: "pointer"
            }}>🪜 Funnel</button>
            <button onClick={() => setTab("satisfaccionCliente")} style={{
              background: tab === "satisfaccionCliente" ? "#5eead4" : "transparent",
              color: tab === "satisfaccionCliente" ? "#0a1628" : "#94a3b8",
              border: "1px solid #5eead4", borderRadius: 6, padding: "6px 14px",
              fontSize: 12, fontWeight: 700, cursor: "pointer"
            }}>📋 Satisfacción Cliente</button>
            <button onClick={() => setTab("demos")} style={{
              background: tab === "demos" ? "#5eead4" : "transparent",
              color: tab === "demos" ? "#0a1628" : "#94a3b8",
              border: "1px solid #5eead4", borderRadius: 6, padding: "6px 14px",
              fontSize: 12, fontWeight: 700, cursor: "pointer"
            }}>🎯 Demos</button>
            <button onClick={() => setTab("productividad")} style={{
              background: tab === "productividad" ? "#5eead4" : "transparent",
              color: tab === "productividad" ? "#0a1628" : "#94a3b8",
              border: "1px solid #5eead4", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer"
            }}>🏆 Productividad</button>
            <button onClick={() => setTab("inventario")} style={{
              background: tab === "inventario" ? "#5eead4" : "transparent",
              color: tab === "inventario" ? "#0a1628" : "#94a3b8",
              border: "1px solid #5eead4", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer"
            }}>📦 Inventario</button>
            <button onClick={() => setTab("marketShare")} style={{
              background: tab === "marketShare" ? "#5eead4" : "transparent",
              color: tab === "marketShare" ? "#0a1628" : "#94a3b8",
              border: "1px solid #5eead4", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer"
            }}>📈 Mercado Automotriz</button>
            <button onClick={() => setTab("tendencias")} style={{
              background: tab === "tendencias" ? "#5eead4" : "transparent",
              color: tab === "tendencias" ? "#0a1628" : "#94a3b8",
              border: "1px solid #5eead4", borderRadius: 6, padding: "6px 14px",
              fontSize: 12, fontWeight: 700, cursor: "pointer"
            }}>📉 Tendencias</button>
            <button onClick={() => setTab("analisis")} style={{
              background: tab === "analisis" ? "#5eead4" : "transparent",
              color: tab === "analisis" ? "#0a1628" : "#94a3b8",
              border: "1px solid #5eead4", borderRadius: 6, padding: "6px 14px",
              fontSize: 12, fontWeight: 700, cursor: "pointer"
            }}>🧠 Análisis IA</button>
            <button onClick={() => setTab("alertas")} style={{
              background: tab === "alertas" ? "#5eead4" : "transparent",
              color: tab === "alertas" ? "#0a1628" : "#94a3b8",
              border: "1px solid #5eead4", borderRadius: 6, padding: "6px 14px",
              fontSize: 12, fontWeight: 700, cursor: "pointer"
            }}>🚨 Alertas</button>
            <button onClick={() => setTab("chat")} style={{
              background: tab === "chat" ? "#5eead4" : "transparent",
              color: tab === "chat" ? "#0a1628" : "#94a3b8",
              border: "1px solid #5eead4", borderRadius: 6, padding: "6px 14px",
              fontSize: 12, fontWeight: 700, cursor: "pointer"
            }}>💬 Director Comercial</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isHistorico ? (
              <>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#60a5fa", boxShadow: "0 0 6px #60a5fa" }} />
                <span style={{ color: "#60a5fa", fontSize: 12, fontWeight: 600 }}>{statusLabel} (histórico)</span>
              </>
            ) : (
              <>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
                <span style={{ color: statusColor, fontSize: 12, fontWeight: 600 }}>{statusLabel}</span>
              </>
            )}
          </div>
      </div>

      {isHistorico && (
        <div style={{ background: "#60a5fa22", borderBottom: "1px solid #60a5fa", padding: "8px 28px", textAlign: "center", fontSize: 12.5, color: "#60a5fa" }}>
          Estás viendo y editando el histórico de <b>{getMonthLabel(viewMonth)}</b> — útil para captura retroactiva.{" "}
          <button onClick={() => setViewMonth(currentMonthKey)} style={{
            background: "none", border: "none", color: "#60a5fa", textDecoration: "underline", cursor: "pointer", fontSize: 12.5, fontWeight: 700
          }}>
            Volver al mes actual
          </button>
        </div>
      )}

      <div style={{ padding: "20px 24px", maxWidth: 1400, margin: "0 auto" }}>
        {tab === "resumen" ? (
          <VistaEjecutiva data={data} monthKey={viewMonth} funnelData={funnelData} onIrADetalle={setTab} />
        ) : tab === "operativo" ? (
          <>
            {!vistaAnualActiva && <KpiBar data={data} monthKey={viewMonth} />}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {vistaAnualActiva ? (
                <VistaAnualSection anio={getYearFromKey(viewMonth)} />
              ) : (
                <>
                  {/* ── Importación automática del reporte de ventas ─────────── */}
                  <Card style={{ borderLeft: "4px solid #D4AF37" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 260 }}>
                        <div style={{ color: "#D4AF37", fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                          ⚡ Automatizar ventas, planes y línea
                        </div>
                        <div style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.5 }}>
                          Sube el reporte "Hoja de Costos y Utilidad" y se llenan automáticamente el facturado, el tipo de plan y la línea de producto de cada mes, según su fecha de facturación. Los objetivos y demás indicadores no se tocan.
                        </div>
                      </div>
                      <div>
                        <input ref={ventasFileRef} type="file" accept=".xlsx,.xls" onChange={handleImportarVentas} style={{ display: "none" }} id="file-importar-ventas" />
                        <label htmlFor="file-importar-ventas" style={{
                          background: importandoVentas ? "#1e3a5f" : "#D4AF37", color: importandoVentas ? "#64748b" : "#0a1628",
                          border: "none", borderRadius: 8, padding: "11px 22px", fontSize: 13, fontWeight: 700,
                          cursor: importandoVentas ? "default" : "pointer", display: "inline-block", whiteSpace: "nowrap"
                        }}>
                          {importandoVentas ? "Procesando…" : "📤 Subir reporte de ventas"}
                        </label>
                      </div>
                    </div>
                    {importandoVentas && (
                      <div style={{ color: "#94a3b8", fontSize: 12.5, marginTop: 12 }}>
                        Procesando y distribuyendo las ventas por mes y agencia… no cierres esta pestaña.
                      </div>
                    )}
                    {importResultado?.error && (
                      <div style={{ background: "#dc262622", border: "1px solid #f87171", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 13, marginTop: 12 }}>
                        {importResultado.error}
                      </div>
                    )}
                    {importResultado && !importResultado.error && (
                      <div style={{ background: "#14532d22", border: "1px solid #4ade80", borderRadius: 8, padding: "10px 14px", color: "#4ade80", fontSize: 13, marginTop: 12 }}>
                        ✅ Listo: {importResultado.total} ventas distribuidas en {importResultado.meses} meses ({importResultado.rango}). El mes en vista ya se actualizó.
                      </div>
                    )}
                  </Card>

                  <RitmoVentasSection monthKey={viewMonth} />

                  <VentasSection data={data} onFieldChange={onFieldChange} monthKey={viewMonth} />
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
                      <VanVauSection data={data} onFieldChange={onFieldChange} onToggleVau={onToggleVau} monthKey={viewMonth} />
                    </div>
                  </div>
                  <SatisfaccionSection data={data} onFieldChange={onFieldChange} monthKey={viewMonth} />
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 280 }}>
                      <MarketShareSection data={data} onFieldChange={onFieldChange} monthKey={viewMonth} />
                    </div>
                    <div style={{ flex: 1, minWidth: 280 }}>
                      <RotacionSection data={data} onFieldChange={onFieldChange} />
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        ) : tab === "funnel" ? (
          <FunnelSection monthKey={viewMonth} funnelData={funnelData} onFunnelFieldChange={onFunnelFieldChange} saveStatus={funnelSaveStatus} />
        ) : tab === "productividad" ? (
          <ProductividadAsesoresSection />
        ) : tab === "inventario" ? (
          <InventarioSection />
        ) : tab === "marketShare" ? (
          <MercadoADACHSection monthKey={viewMonth} />
        ) : tab === "tendencias" ? (
          <TendenciasSection currentMonthKey={currentMonthKey} />
        ) : tab === "analisis" ? (
          <AnalisisSection data={data} monthKey={viewMonth} funnelData={funnelData} />
        ) : tab === "alertas" ? (
          <AlertasSection monthKey={currentMonthKey} />
        ) : tab === "chat" ? (
          <ChatSection data={data} monthKey={viewMonth} funnelData={funnelData} />
        ) : tab === "satisfaccionCliente" ? (
          <SatisfaccionClienteSection monthKey={viewMonth} />
        ) : (
          <DemosSection monthKey={viewMonth} />
        )}
        {!vistaAnualActiva && (
          <div style={{ textAlign: "center", color: "#1e3a5f", fontSize: 11, marginTop: 24 }}>
            Los cambios se sincronizan automáticamente con Firebase · Actualización cada 15 seg
          </div>
        )}
      </div>
    </div>
  );
}

// ── ROOT REAL — controla sesión y decide Login vs Dashboard ───────────────────
export default function App() {
  // Ruta pública de la encuesta de demo — no requiere sesión, se revisa antes que nada.
  if (typeof window !== "undefined" && window.location.pathname.replace(/\/$/, "") === "/encuesta-demo") {
    return <EncuestaDemoPublica />;
  }

  const [authState, setAuthState] = useState("cargando"); // cargando | sinSesion | conSesion
  const [userInfo, setUserInfo] = useState(null); // { email, role, agencia }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        const { role, agencia } = getRoleForEmail(user.email);
        setUserInfo({ email: user.email, role, agencia });
        setAuthState("conSesion");
      } else {
        setUserInfo(null);
        setAuthState("sinSesion");
      }
    });
    return () => unsub();
  }, []);

  if (authState === "cargando") {
    return (
      <div style={{ minHeight: "100vh", background: "#070f1a", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontFamily: "'Inter', 'Segoe UI', sans-serif", fontSize: 13 }}>
        Cargando…
      </div>
    );
  }

  if (authState === "sinSesion") {
    return <LoginScreen />;
  }

  return (
    <Dashboard
      userRole={userInfo.role}
      userAgencia={userInfo.agencia}
      userEmail={userInfo.email}
    />
  );
}
