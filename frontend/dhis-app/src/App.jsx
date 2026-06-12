import { useState, useEffect } from "react"
import axios from "axios"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts"
import {
  LayoutDashboard, ShieldCheck, LogOut, Plus, Pencil, Trash2,
  CheckCircle, XCircle, AlertTriangle, ChevronDown
} from "lucide-react"

const API = "https://dhis-backend.onrender.com"
const COLORS = ["#378ADD","#1D9E75","#EF9F27","#D85A30","#7F77DD","#993556","#639922","#BA7517","#D4537E","#0F6E56","#E24B4A","#533AB7"]
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"]
const CATEGORIES = ["Infectious Disease","Orthopedic","Ophthalmology"]
const SESSION_KEY = "dhis_admin_session"
const MAX_YEAR = 2026

// ── helpers ──────────────────────────────────────────────────────────────────

function getSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)) } catch { return null }
}
function setSession(val) {
  if (val) sessionStorage.setItem(SESSION_KEY, JSON.stringify(val))
  else sessionStorage.removeItem(SESSION_KEY)
}

// ── sub-components ────────────────────────────────────────────────────────────

function KPI({ label, value, color = "#1a2236", sub }) {
  return (
    <div style={{ background:"#fff", borderRadius:14, padding:"20px 24px", boxShadow:"0 2px 8px rgba(0,0,0,0.07)", flex:1, minWidth:180 }}>
      <div style={{ fontSize:11, color:"#888", marginBottom:6, textTransform:"uppercase", letterSpacing:.6 }}>{label}</div>
      <div style={{ fontSize:26, fontWeight:700, color }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:"#aaa", marginTop:4 }}>{sub}</div>}
    </div>
  )
}

function Alert({ type, message }) {
  const styles = {
    success: { bg:"#f0fdf4", color:"#15803d", Icon: CheckCircle },
    error:   { bg:"#fef2f2", color:"#b91c1c", Icon: XCircle },
    warning: { bg:"#fffbeb", color:"#92400e", Icon: AlertTriangle },
  }
  const { bg, color, Icon } = styles[type] || styles.error
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:14, padding:"12px 18px", borderRadius:10, background:bg, color, fontSize:14, fontWeight:500 }}>
      <Icon size={16} />
      {message}
    </div>
  )
}

// ── main ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage]               = useState("dashboard")
  const [districts, setDistricts]     = useState([])
  const [selectedDistrict, setSelectedDistrict] = useState(null)
  const [analysis, setAnalysis]       = useState(null)
  const [loading, setLoading]         = useState(false)
  const [adminLoggedIn, setAdminLoggedIn] = useState(!!getSession())
  const [pwInput, setPwInput]         = useState("")
  const [pwError, setPwError]         = useState("")

  // form state
  const emptyForm = { disease_type:"", case_count:"", month:"January", year:2026, category:"Infectious Disease" }
  const [form, setForm]       = useState(emptyForm)
  const [msg, setMsg]         = useState(null)          // { type, text }
  const [submitting, setSubmitting] = useState(false)

  // edit / delete state
  const [editTarget, setEditTarget]   = useState(null)  // { id, disease_type, case_count, month, year, category }
  const [deleteTarget, setDeleteTarget] = useState(null) // { id, disease_type }
  const [adminTab, setAdminTab]       = useState("add") // "add" | "manage"

  // existing diseases list (for duplicate check)
  const [existingDiseases, setExistingDiseases] = useState([])

  // ── data loading ────────────────────────────────────────────────────────────

  useEffect(() => {
    axios.get(`${API}/districts`).then(r => {
      setDistricts(r.data)
      if (r.data.length > 0) setSelectedDistrict(r.data[0].id)
    })
  }, [])

  const loadAnalysis = (distId) => {
    setLoading(true); setAnalysis(null)
    axios.get(`${API}/analysis/${distId}`)
      .then(r => { setAnalysis(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  const loadCases = (distId) => {
    axios.get(`${API}/cases?district_id=${distId}`)
      .then(r => setExistingDiseases(r.data.map(c => c.disease_type?.trim().toLowerCase())))
      .catch(() => {})
  }

  useEffect(() => {
    if (!selectedDistrict) return
    loadAnalysis(selectedDistrict)
    loadCases(selectedDistrict)
  }, [selectedDistrict])

  // ── auth ────────────────────────────────────────────────────────────────────

  const handleLogin = () => {
    const pw = import.meta.env.VITE_ADMIN_PASSWORD || "dhis2025"
    if (pwInput === pw) {
      setAdminLoggedIn(true)
      setSession({ loggedIn: true, at: Date.now() })
      setPwError("")
    } else {
      setPwError("Wrong password. Please try again.")
    }
  }

  const handleLogout = () => {
    setAdminLoggedIn(false)
    setSession(null)
    setPwInput("")
  }

  // ── validation ──────────────────────────────────────────────────────────────

  const validate = (f, isEdit = false) => {
    if (!f.disease_type.trim()) return { type:"error", text:"Disease name is required." }
    if (!isEdit && existingDiseases.includes(f.disease_type.trim().toLowerCase()))
      return { type:"warning", text:`"${f.disease_type.trim()}" already exists for this district.` }
    if (!f.case_count || isNaN(f.case_count) || Number(f.case_count) <= 0)
      return { type:"error", text:"Case count must be a positive number." }
    if (Number(f.year) > MAX_YEAR)
      return { type:"error", text:`Year cannot be beyond ${MAX_YEAR}.` }
    if (Number(f.year) < 2000)
      return { type:"error", text:"Year must be 2000 or later." }
    return null
  }

  // ── CRUD ────────────────────────────────────────────────────────────────────

  const handleAdd = async () => {
    const err = validate(form)
    if (err) { setMsg(err); return }
    setSubmitting(true)
    try {
      await axios.post(`${API}/cases/add`, {
        ...form, case_count: parseInt(form.case_count),
        year: parseInt(form.year), district_id: selectedDistrict
      })
      setMsg({ type:"success", text:"Case added successfully." })
      setForm(emptyForm)
      loadAnalysis(selectedDistrict)
      loadCases(selectedDistrict)
    } catch { setMsg({ type:"error", text:"Failed to add case. Please try again." }) }
    setSubmitting(false)
  }

  const handleEditSave = async () => {
    const err = validate(editTarget, true)
    if (err) { setMsg(err); return }
    setSubmitting(true)
    try {
      await axios.put(`${API}/cases/${editTarget.id}`, {
        ...editTarget,
        case_count: parseInt(editTarget.case_count),
        year: parseInt(editTarget.year)
      })
      setMsg({ type:"success", text:"Case updated successfully." })
      setEditTarget(null)
      loadAnalysis(selectedDistrict)
      loadCases(selectedDistrict)
    } catch { setMsg({ type:"error", text:"Failed to update. Please try again." }) }
    setSubmitting(false)
  }

  const handleDelete = async () => {
    setSubmitting(true)
    try {
      await axios.delete(`${API}/cases/${deleteTarget.id}`)
      setMsg({ type:"success", text:`"${deleteTarget.disease_type}" deleted.` })
      setDeleteTarget(null)
      loadAnalysis(selectedDistrict)
      loadCases(selectedDistrict)
    } catch { setMsg({ type:"error", text:"Failed to delete. Please try again." }) }
    setSubmitting(false)
  }

  // ── derived chart data ──────────────────────────────────────────────────────

  const barData = analysis
    ? Object.entries(analysis.disease_breakdown)
        .sort((a,b) => b[1]-a[1]).slice(0,14)
        .map(([name, val]) => ({ name: name.trim(), cases: val }))
    : []

  const catData = analysis
    ? Object.entries(analysis.category_summary).map(([name, val]) => ({ name, value: val }))
    : []

  // ── reusable field renderer ─────────────────────────────────────────────────

  const Field = ({ label, children }) => (
    <div>
      <label style={{ fontSize:12, color:"#555", display:"block", marginBottom:5, fontWeight:600 }}>{label}</label>
      {children}
    </div>
  )

  const inputStyle = { width:"100%", padding:"10px 12px", borderRadius:8, border:"1.5px solid #e5e7eb", fontSize:14, boxSizing:"border-box", outline:"none" }

  const FormFields = ({ data, onChange }) => (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
      <Field label="Disease Name *">
        <input style={inputStyle} placeholder="e.g. Dengue, Malaria"
          value={data.disease_type} onChange={e => onChange({ ...data, disease_type: e.target.value })} />
      </Field>
      <Field label="Case Count *">
        <input type="number" style={inputStyle} placeholder="e.g. 500"
          value={data.case_count} onChange={e => onChange({ ...data, case_count: e.target.value })} />
      </Field>
      <Field label={`Year (max ${MAX_YEAR})`}>
        <input type="number" style={inputStyle} placeholder="2025" min="2000" max={MAX_YEAR}
          value={data.year} onChange={e => onChange({ ...data, year: e.target.value })} />
      </Field>
      <Field label="Month">
        <select style={inputStyle} value={data.month} onChange={e => onChange({ ...data, month: e.target.value })}>
          {MONTHS.map(m => <option key={m}>{m}</option>)}
        </select>
      </Field>
      <Field label="Category">
        <select style={inputStyle} value={data.category} onChange={e => onChange({ ...data, category: e.target.value })}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </Field>
    </div>
  )

  // ── navbar ──────────────────────────────────────────────────────────────────

  const navbar = (
    <div style={{ background:"#1a2236", padding:"0 32px", display:"flex", alignItems:"center", justifyContent:"space-between", height:56, position:"sticky", top:0, zIndex:100 }}>
      <span style={{ color:"#fff", fontWeight:700, fontSize:15, display:"flex", alignItems:"center", gap:8 }}>
        <ShieldCheck size={18} color="#378ADD" /> DHIS — District Health Intelligence System
      </span>
      <div style={{ display:"flex", gap:6 }}>
        {[
          { key:"dashboard", label:"Dashboard", Icon: LayoutDashboard },
          { key:"admin",     label:"Admin Panel", Icon: ShieldCheck }
        ].map(({ key, label, Icon }) => (
          <button key={key} onClick={() => setPage(key)}
            style={{ padding:"7px 18px", borderRadius:8, border:"none", cursor:"pointer", fontWeight:600, fontSize:13,
              display:"flex", alignItems:"center", gap:6,
              background: page===key ? "#378ADD" : "transparent", color: page===key ? "#fff" : "#aac4e0" }}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>
    </div>
  )

  // ── district bar ────────────────────────────────────────────────────────────

  const districtBar = (
    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
      <span style={{ fontSize:13, color:"#444", fontWeight:600 }}>District:</span>
      <div style={{ position:"relative" }}>
        <select value={selectedDistrict || ""} onChange={e => setSelectedDistrict(Number(e.target.value))}
          style={{ padding:"8px 36px 8px 12px", borderRadius:8, border:"1.5px solid #e5e7eb", fontSize:14, background:"#fff", cursor:"pointer", minWidth:160, appearance:"none" }}>
          {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <ChevronDown size={14} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"#555" }} />
      </div>
      {analysis && <span style={{ fontSize:13, color:"#888" }}>Total: <b>{analysis.total_cases?.toLocaleString()}</b> cases</span>}
    </div>
  )

  // ── dashboard page ──────────────────────────────────────────────────────────

  const dashboardPage = (
    <div style={{ maxWidth:"100%", margin:"0 auto", padding:"28px 16px" }}>
      {districtBar}
      {loading && <div style={{ textAlign:"center", padding:80, color:"#888", fontSize:15 }}>Loading data...</div>}
      {analysis && !loading && (
        <>
          <div style={{ display:"flex", gap:14, marginBottom:24, flexWrap:"wrap" }}>
            <KPI label="Total Cases" value={analysis.total_cases?.toLocaleString()} />
            <KPI label="Top Disease" value={analysis.top_disease} color="#D85A30" sub={`${barData[0]?.cases?.toLocaleString()} cases`} />
            <KPI label="Total Hospitals" value={analysis.total_hospitals} color="#1D9E75" />
            <KPI label="Doctor Shortage"
              value={analysis.shortage > 0 ? `${analysis.shortage} short` : "Fully Staffed"}
              color={analysis.shortage > 0 ? "#e24b4a" : "#1D9E75"}
              sub={`Required: ${analysis.required_doctors} | Available: ${analysis.available_doctors}`} />
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, marginBottom:18 }}>
            <div style={{ background:"#fff", borderRadius:14, padding:"20px 24px", boxShadow:"0 2px 8px rgba(0,0,0,0.07)" }}>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:16, color:"#1a2236" }}>Disease Breakdown (Top 14)</div>
              <ResponsiveContainer width="100%" height={600}>
                <BarChart data={barData} layout="vertical" margin={{ left:10, right:60, top:4, bottom:4 }}>
                  <XAxis type="number" tick={{ fontSize:11 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
                  <YAxis dataKey="name" type="category" width={240} tick={{ fontSize:11 }} />
                  <Tooltip cursor={{ fill:"rgba(55,138,221,0.08)" }}
                    content={({ active, payload }) => active && payload?.length ? (
                      <div style={{ background:"#1a2236", padding:"10px 16px", borderRadius:10, color:"#fff", boxShadow:"0 4px 12px rgba(0,0,0,0.3)" }}>
                        <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{payload[0].payload.name}</div>
                        <div style={{ fontSize:13, color:"#93c5fd" }}>Total Cases: {payload[0].value.toLocaleString()}</div>
                      </div>
                    ) : null} />
                  <Bar dataKey="cases" radius={[0,6,6,0]} label={{ position:"right", fontSize:11, formatter: v => v.toLocaleString() }}>
                    {barData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background:"#fff", borderRadius:14, padding:"20px 24px", boxShadow:"0 2px 8px rgba(0,0,0,0.07)" }}>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:16, color:"#1a2236" }}>Category Summary</div>
              <ResponsiveContainer width="100%" height={420}>
                <PieChart>
                  <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110}
                    label={({ name, percent, midAngle, outerRadius, cx, cy }) => {
                      const R = Math.PI / 180
                      const r = outerRadius + 40
                      const x = cx + r * Math.cos(-midAngle * R)
                      const y = cy + r * Math.sin(-midAngle * R)
                      return (
                        <text x={x} y={y} textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fontSize={12} fontWeight={600} fill="#333">
                          {`${name} ${(percent*100).toFixed(0)}%`}
                        </text>
                      )
                    }}
                    labelLine={{ stroke:"#aaa", strokeWidth:1.5 }}>
                    {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={({ active, payload }) => active && payload?.length ? (
                    <div style={{ background:"#1a2236", padding:"8px 14px", borderRadius:8, color:"#fff" }}>
                      <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{payload[0].payload.name}</div>
                      <div style={{ fontSize:13, color:"#93c5fd" }}>Cases: {payload[0].value.toLocaleString()}</div>
                    </div>
                  ) : null} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  )

  // ── login page ──────────────────────────────────────────────────────────────

  const loginPage = (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", minHeight:"80vh" }}>
      <div style={{ background:"#fff", borderRadius:20, padding:"48px 56px", boxShadow:"0 8px 32px rgba(0,0,0,0.12)", minWidth:360, textAlign:"center" }}>
        <ShieldCheck size={44} color="#378ADD" style={{ marginBottom:12 }} />
        <div style={{ fontSize:22, fontWeight:700, marginBottom:6 }}>Admin Login</div>
        <div style={{ fontSize:13, color:"#888", marginBottom:28 }}>Only authorized admins can access this panel.</div>
        <input type="password" placeholder="Enter password" value={pwInput}
          onChange={e => { setPwInput(e.target.value); setPwError("") }}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          style={{ width:"100%", padding:"12px 16px", borderRadius:10, border:"1.5px solid #ddd", fontSize:15, marginBottom:14, outline:"none", boxSizing:"border-box" }} />
        {pwError && <div style={{ color:"#e24b4a", fontSize:13, marginBottom:10, display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}><XCircle size={14}/>{pwError}</div>}
        <button onClick={handleLogin}
          style={{ width:"100%", padding:"12px 0", borderRadius:10, background:"#378ADD", color:"#fff", border:"none", fontSize:16, fontWeight:700, cursor:"pointer" }}>
          Login
        </button>
      </div>
    </div>
  )

  // ── manage tab (list with edit/delete) ─────────────────────────────────────

  const [allCases, setAllCases] = useState([])
  useEffect(() => {
    if (!selectedDistrict) return
    axios.get(`${API}/cases?district_id=${selectedDistrict}`)
      .then(r => setAllCases(r.data))
      .catch(() => {})
  }, [selectedDistrict, msg])

  const manageTab = (
    <div>
      {allCases.length === 0
        ? <div style={{ color:"#888", fontSize:14, textAlign:"center", padding:40 }}>No cases found for this district.</div>
        : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ background:"#f8fafc", borderBottom:"2px solid #e5e7eb" }}>
                  {["Disease","Cases","Month","Year","Category","Actions"].map(h => (
                    <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontWeight:700, color:"#374151" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allCases.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom:"1px solid #f1f5f9", background: i%2===0?"#fff":"#fafafa" }}>
                    <td style={{ padding:"10px 14px", fontWeight:600 }}>{c.disease_type}</td>
                    <td style={{ padding:"10px 14px" }}>{c.case_count?.toLocaleString()}</td>
                    <td style={{ padding:"10px 14px" }}>{c.month}</td>
                    <td style={{ padding:"10px 14px" }}>{c.year}</td>
                    <td style={{ padding:"10px 14px" }}>{c.category}</td>
                    <td style={{ padding:"10px 14px", display:"flex", gap:8 }}>
                      <button onClick={() => { setEditTarget({ ...c }); setMsg(null) }}
                        style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 12px", borderRadius:7, border:"1.5px solid #378ADD", background:"#eff6ff", color:"#378ADD", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                        <Pencil size={12} /> Edit
                      </button>
                      <button onClick={() => setDeleteTarget({ id: c.id, disease_type: c.disease_type })}
                        style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 12px", borderRadius:7, border:"1.5px solid #e24b4a", background:"#fef2f2", color:"#e24b4a", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                        <Trash2 size={12} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }

      {/* Edit modal */}
      {editTarget && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}>
          <div style={{ background:"#fff", borderRadius:16, padding:"32px 36px", minWidth:480, boxShadow:"0 8px 32px rgba(0,0,0,0.18)" }}>
            <div style={{ fontSize:17, fontWeight:700, marginBottom:20, color:"#1a2236", display:"flex", alignItems:"center", gap:8 }}>
              <Pencil size={16}/> Edit Case
            </div>
            <FormFields data={editTarget} onChange={setEditTarget} />
            {msg && <Alert type={msg.type} message={msg.text} />}
            <div style={{ display:"flex", gap:10, marginTop:20 }}>
              <button onClick={handleEditSave} disabled={submitting}
                style={{ padding:"10px 28px", borderRadius:9, background: submitting?"#93c5fd":"#378ADD", color:"#fff", border:"none", fontWeight:700, cursor:"pointer" }}>
                {submitting ? "Saving..." : "Save Changes"}
              </button>
              <button onClick={() => { setEditTarget(null); setMsg(null) }}
                style={{ padding:"10px 20px", borderRadius:9, background:"#f1f5f9", color:"#374151", border:"none", fontWeight:600, cursor:"pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}>
          <div style={{ background:"#fff", borderRadius:16, padding:"32px 36px", minWidth:360, boxShadow:"0 8px 32px rgba(0,0,0,0.18)", textAlign:"center" }}>
            <Trash2 size={36} color="#e24b4a" style={{ marginBottom:12 }} />
            <div style={{ fontSize:16, fontWeight:700, marginBottom:8 }}>Delete Case</div>
            <div style={{ fontSize:14, color:"#555", marginBottom:24 }}>
              Are you sure you want to delete <b>"{deleteTarget.disease_type}"</b>? This cannot be undone.
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
              <button onClick={handleDelete} disabled={submitting}
                style={{ padding:"10px 24px", borderRadius:9, background:"#e24b4a", color:"#fff", border:"none", fontWeight:700, cursor:"pointer" }}>
                {submitting ? "Deleting..." : "Yes, Delete"}
              </button>
              <button onClick={() => setDeleteTarget(null)}
                style={{ padding:"10px 20px", borderRadius:9, background:"#f1f5f9", color:"#374151", border:"none", fontWeight:600, cursor:"pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // ── admin page ──────────────────────────────────────────────────────────────

  const adminPage = (
    <div style={{ padding:"28px 32px", maxWidth:800 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:700, color:"#1a2236" }}>Admin Panel</div>
          <div style={{ fontSize:13, color:"#888", marginTop:2 }}>Manage health data for each district</div>
        </div>
        <button onClick={handleLogout}
          style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 18px", borderRadius:8, background:"#fee2e2", color:"#b91c1c", border:"none", fontSize:13, cursor:"pointer", fontWeight:600 }}>
          <LogOut size={14}/> Logout
        </button>
      </div>

      {districtBar}

      {/* Tab switcher */}
      <div style={{ display:"flex", gap:4, marginBottom:20 }}>
        {[{ key:"add", label:"Add Case", Icon: Plus }, { key:"manage", label:"Manage Cases", Icon: Pencil }].map(({ key, label, Icon }) => (
          <button key={key} onClick={() => { setAdminTab(key); setMsg(null) }}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 20px", borderRadius:9, border:"none", fontWeight:600, fontSize:13, cursor:"pointer",
              background: adminTab===key ? "#378ADD" : "#e5e7eb", color: adminTab===key ? "#fff" : "#374151" }}>
            <Icon size={14}/>{label}
          </button>
        ))}
      </div>

      <div style={{ background:"#fff", borderRadius:16, padding:"28px 32px", boxShadow:"0 2px 12px rgba(0,0,0,0.08)" }}>
        {adminTab === "add" && (
          <>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:22, color:"#1a2236", display:"flex", alignItems:"center", gap:8 }}>
              <Plus size={16}/> Add New Disease Case
            </div>
            <FormFields data={form} onChange={setForm} />
            <button onClick={handleAdd} disabled={submitting}
              style={{ marginTop:22, display:"flex", alignItems:"center", gap:6, padding:"12px 36px", borderRadius:10, background: submitting?"#93c5fd":"#378ADD",
                color:"#fff", border:"none", fontSize:15, fontWeight:700, cursor:"pointer" }}>
              <Plus size={16}/>{submitting ? "Adding..." : "Add Case"}
            </button>
            {msg && <Alert type={msg.type} message={msg.text} />}
          </>
        )}

        {adminTab === "manage" && (
          <>
            <div style={{ fontSize:16, fontWeight:700, marginBottom:18, color:"#1a2236", display:"flex", alignItems:"center", gap:8 }}>
              <Pencil size={16}/> Manage Existing Cases
            </div>
            {msg && <Alert type={msg.type} message={msg.text} />}
            {manageTab}
          </>
        )}
      </div>
    </div>
  )

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily:"system-ui,sans-serif", minHeight:"100vh", background:"#f0f4f8" }}>
      {navbar}
      {page === "dashboard" && dashboardPage}
      {page === "admin" && !adminLoggedIn && loginPage}
      {page === "admin" && adminLoggedIn && adminPage}
    </div>
  )
}
