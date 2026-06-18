import { useState, useEffect } from "react"
import axios from "axios"
import LandingPage from "./LandingPage"
import HospitalPage from "./HospitalPage"
import AIAssistant from "./AIAssistant"
import DoctorLogin from "./DoctorLogin"
import DoctorDashboard from "./DoctorDashboard"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts"
import {
  LayoutDashboard, ShieldCheck, LogOut, Plus, Trash2, Pencil,
  AlertCircle, CheckCircle2, Building2, Stethoscope, Activity,
Home, X, Save, Users, Globe, ExternalLink} 
from "lucide-react"

const API = "https://dhis-backend.onrender.com"
const COLORS = ["#378ADD","#1D9E75","#EF9F27","#D85A30","#7F77DD","#993556","#639922","#BA7517","#D4537E","#0F6E56","#E24B4A","#533AB7"]
const MAX_YEAR = 2026
const SESSION_KEY = "dhis_admin_session"
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "dhis2025"

const WB_PATH = "M290,58 L295,62 L300,68 L298,75 L302,80 L305,87 L302,93 L298,98 L300,105 L297,112 L293,118 L290,125 L292,132 L289,139 L285,145 L282,152 L278,158 L274,164 L270,170 L266,176 L261,181 L256,186 L250,190 L244,194 L238,198 L232,202 L226,205 L220,207 L214,208 L208,207 L202,205 L197,201 L192,197 L188,192 L184,186 L181,180 L179,174 L177,168 L176,162 L175,156 L175,150 L176,144 L177,138 L179,132 L181,126 L184,121 L187,115 L191,110 L195,105 L200,101 L205,97 L210,93 L215,89 L220,85 L225,81 L230,77 L235,73 L240,69 L245,65 L250,61 L255,58 L260,55 L265,53 L270,52 L275,52 L280,54 L285,56 Z"

const RLEGEND = ({ payload }) => (
  <div style={{ display:"flex", flexWrap:"wrap", gap:"8px 16px", justifyContent:"center", marginTop:12 }}>
    {payload.map((entry, i) => (
      <span key={i} style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:"#444" }}>
        <span style={{ width:12, height:12, borderRadius:2, background:entry.color, display:"inline-block", flexShrink:0 }}></span>
        <span style={{ fontWeight:600 }}>{entry.payload.name}</span>: {entry.payload.value?.toLocaleString()}
      </span>
    ))}
  </div>
)

export default function App() {
  const [page, setPage] = useState("dashboard")
  const [currentPage, setCurrentPage] = useState("landing")
  const [districts, setDistricts] = useState([])
  const [selectedDistrict, setSelectedDistrict] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [adminLoggedIn, setAdminLoggedIn] = useState(false)
  const [doctorLoggedIn, setDoctorLoggedIn] = useState(false)
  const [loggedDoctor, setLoggedDoctor] = useState(null)
  const [pwInput, setPwInput] = useState("")
  const [pwError, setPwError] = useState("")
  const [existingDiseases, setExistingDiseases] = useState([])
  const [form, setForm] = useState({ disease_type:"", case_count:"", month:"January", year:2025, category:"Infectious Disease" })
  const [msg, setMsg] = useState({ text:"", type:"" })
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [allCases, setAllCases] = useState([])

  useEffect(() => {
    const session = sessionStorage.getItem(SESSION_KEY)
    if (session === "true") setAdminLoggedIn(true)
  }, [])

  useEffect(() => {
    axios.get(`${API}/districts`).then(r => {
      setDistricts(r.data)
      if (r.data.length > 0) setSelectedDistrict(r.data[0].id)
    })
  }, [])

  useEffect(() => {
    if (!selectedDistrict) return
    setLoading(true)
    setAnalysis(null)
    axios.get(`${API}/analysis/${selectedDistrict}`)
      .then(r => { setAnalysis(r.data); setLoading(false) })
      .catch(() => setLoading(false))
    axios.get(`${API}/cases/${selectedDistrict}`)
      .then(r => {
        setAllCases(r.data)
        const names = [...new Set(r.data.map(c => c.disease_type.trim().toLowerCase()))]
        setExistingDiseases(names)
      })
  }, [selectedDistrict])

  const handleLogin = () => {
    if (pwInput === ADMIN_PASSWORD) {
      setAdminLoggedIn(true)
      sessionStorage.setItem(SESSION_KEY, "true")
      setPwError("")
    } else {
      setPwError("Wrong password! Please try again.")
    }
  }

  const handleLogout = () => {
    setAdminLoggedIn(false)
    sessionStorage.removeItem(SESSION_KEY)
    setPwInput("")
  }

  const showMsg = (text, type="success") => {
    setMsg({ text, type })
    setTimeout(() => setMsg({ text:"", type:"" }), 4000)
  }

  const validateForm = (f) => {
    if (!f.disease_type.trim()) return "Disease name is required."
    if (!f.case_count || parseInt(f.case_count) <= 0) return "Case count must be a positive number."
    if (parseInt(f.year) > MAX_YEAR) return `Year cannot be beyond ${MAX_YEAR}.`
    if (parseInt(f.year) < 2000) return "Year must be after 2000."
    return null
  }

  const handleSubmit = async () => {
    const err = validateForm(form)
    if (err) { showMsg(err, "error"); return }
    const isDuplicate = existingDiseases.includes(form.disease_type.trim().toLowerCase())
    if (isDuplicate) {
      showMsg(`"${form.disease_type}" already exists for this district. Edit the existing entry instead.`, "error")
      return
    }
    setSubmitting(true)
    try {
      await axios.post(`${API}/cases/add`, {
        ...form, case_count: parseInt(form.case_count),
        year: parseInt(form.year), district_id: selectedDistrict
      })
      showMsg("Data added successfully!")
      setForm({ disease_type:"", case_count:"", month:"January", year:2025, category:"Infectious Disease" })
      refreshData()
    } catch { showMsg("Error occurred, please try again.", "error") }
    setSubmitting(false)
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/cases/${id}`)
      showMsg("Record deleted successfully!")
      setDeleteConfirm(null)
      refreshData()
    } catch { showMsg("Delete failed.", "error") }
  }

  const handleEdit = async (id) => {
    const err = validateForm(editForm)
    if (err) { showMsg(err, "error"); return }
    try {
      await axios.put(`${API}/cases/${id}`, {
        ...editForm, case_count: parseInt(editForm.case_count), year: parseInt(editForm.year)
      })
      showMsg("Record updated successfully!")
      setEditingId(null)
      refreshData()
    } catch { showMsg("Update failed.", "error") }
  }

  const refreshData = () => {
    axios.get(`${API}/analysis/${selectedDistrict}`).then(r => setAnalysis(r.data))
    axios.get(`${API}/cases/${selectedDistrict}`).then(r => {
      setAllCases(r.data)
      setExistingDiseases([...new Set(r.data.map(c => c.disease_type.trim().toLowerCase()))])
    })
  }

  const barData = analysis
    ? Object.entries(analysis.disease_breakdown).sort((a,b) => b[1]-a[1]).map(([name, val]) => ({ name, cases: val }))
    : []
  const catData = analysis
    ? Object.entries(analysis.category_summary).map(([name, val]) => ({ name, value: val }))
    : []

  const navbar = (
    <div style={{ background:"#1a2236", padding:"0 32px", display:"flex", alignItems:"center", justifyContent:"space-between", height:56, position:"sticky", top:0, zIndex:100 }}>
      <span style={{ color:"#fff", fontWeight:700, fontSize:16, display:"flex", alignItems:"center", gap:8 }}>
        <Activity size={20} color="#378ADD" /> DHIS — District Health Intelligence System
      </span>
      <div style={{ display:"flex", gap:6 }}>
        <button onClick={() => setCurrentPage("landing")}
          style={{ padding:"7px 22px", borderRadius:8, border:"none", cursor:"pointer", fontWeight:600, fontSize:13,
            background:"transparent", color:"#aac4e0", display:"flex", alignItems:"center", gap:6 }}>
          <Home size={15} /> Home
        </button>
        <button onClick={() => { setCurrentPage("app"); setPage("dashboard") }}
          style={{ padding:"7px 22px", borderRadius:8, border:"none", cursor:"pointer", fontWeight:600, fontSize:13,
            background: currentPage==="app" && page==="dashboard" ? "#378ADD" : "transparent",
            color: currentPage==="app" && page==="dashboard" ? "#fff" : "#aac4e0",
            display:"flex", alignItems:"center", gap:6 }}>
          <LayoutDashboard size={15} /> Dashboard
        </button>
        <button onClick={() => { setCurrentPage("app"); setPage("admin") }}
          style={{ padding:"7px 22px", borderRadius:8, border:"none", cursor:"pointer", fontWeight:600, fontSize:13,
            background: currentPage==="app" && page==="admin" ? "#378ADD" : "transparent",
            color: currentPage==="app" && page==="admin" ? "#fff" : "#aac4e0",
            display:"flex", alignItems:"center", gap:6 }}>
          <ShieldCheck size={15} /> Admin Panel
        </button>
        <button onClick={() => { setCurrentPage("app"); setPage("about") }}
          style={{ padding:"7px 22px", borderRadius:8, border:"none", cursor:"pointer", fontWeight:600, fontSize:13,
            background: currentPage==="app" && page==="about" ? "#378ADD" : "transparent",
            color: currentPage==="app" && page==="about" ? "#fff" : "#aac4e0",
            display:"flex", alignItems:"center", gap:6 }}>
          <Users size={15} /> About
        </button>
      </div>
    </div>
  )

  const districtBar = (
    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20, position:"sticky", top:56, background:"linear-gradient(135deg, #f0f4f8 0%, #e8f0f8 100%)", zIndex:50, padding:"12px 0" }}>
      <span style={{ fontSize:13, color:"#333", fontWeight:600 }}>District:</span>
      <select value={selectedDistrict || ""} onChange={e => setSelectedDistrict(Number(e.target.value))}
style={{ padding:"8px 16px", borderRadius:8, border:"1.5px solid #ccd6e0", fontSize:14, background:"#fff", color:"#1a2236", cursor:"pointer", minWidth:160 }}>        {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>
      {analysis && <span style={{ fontSize:13, color:"#555" }}>Total: <b style={{ color:"#1a2236" }}>{analysis.total_cases?.toLocaleString()}</b> cases</span>}
    </div>
  )

  const kpi = (label, value, color="#1a2236", sub=null, icon=null) => (
    <div style={{ background:"rgba(255,255,255,0.92)", borderRadius:14, padding:"20px 24px", boxShadow:"0 2px 8px rgba(0,0,0,0.07)", flex:1, minWidth:180, backdropFilter:"blur(4px)" }}>
      <div style={{ fontSize:12, color:"#888", marginBottom:6, textTransform:"uppercase", letterSpacing:.5, display:"flex", alignItems:"center", gap:5 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize:28, fontWeight:700, color }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:"#aaa", marginTop:4 }}>{sub}</div>}
    </div>
  )

  const dashboardPage = (
    <div style={{ padding:"28px 32px", maxWidth:"100%", margin:"0 auto", position:"relative", minHeight:"100vh",
      background:"linear-gradient(135deg, #f0f4f8 0%, #e8f0f8 100%)" }}>

      {/* West Bengal watermark */}
      <div style={{ position:"fixed", right:"2%", top:"50%", transform:"translateY(-50%)", opacity:0.06, pointerEvents:"none", zIndex:0 }}>
        <svg width="500" height="600" viewBox="165 45 155 195">
          <path d={WB_PATH} fill="#1a5276" stroke="#1a5276" strokeWidth="1"/>
          <text x="225" y="235" textAnchor="middle" fill="#1a5276" fontSize="12" fontWeight="700" letterSpacing="3">WEST BENGAL</text>
        </svg>
      </div>

      <div style={{ position:"relative", zIndex:1 }}>
        {districtBar}
        {loading && <div style={{ textAlign:"center", padding:80, color:"#888", fontSize:16 }}>Loading data...</div>}
        {analysis && !loading && (
          <>
            <div style={{ display:"flex", gap:14, marginBottom:24, flexWrap:"wrap" }}>
              {kpi("Total Cases", analysis.total_cases?.toLocaleString(), "#1a2236", null, <Activity size={13} />)}
              {kpi("Top Disease", analysis.top_disease, "#D85A30", `${analysis.top_count?.toLocaleString()} cases`, <AlertCircle size={13} />)}
              {kpi("Total Hospitals", analysis.total_hospitals, "#1D9E75", null, <Building2 size={13} />)}
              {kpi("Doctor Shortage",
                analysis.shortage > 0 ? `${analysis.shortage} short` : "Fully Staffed",
                analysis.shortage > 0 ? "#e24b4a" : "#1D9E75",
                `Required: ${analysis.required_doctors} | Available: ${analysis.available_doctors}`,
                <Stethoscope size={13} />)}
            </div>

            <div style={{ marginBottom:16 }}>
  <button onClick={() => setPage("hospitals")}
    style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 22px", borderRadius:10,
      background:"linear-gradient(135deg, #378ADD, #1D9E75)", color:"#fff", border:"none",
      cursor:"pointer", fontSize:14, fontWeight:600, boxShadow:"0 2px 8px rgba(55,138,221,0.3)" }}>
    <Building2 size={16} /> View District Hospital Details
  </button>
</div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, marginBottom:18 }}>
              <div style={{ background:"rgba(255,255,255,0.95)", borderRadius:14, padding:"20px 24px", boxShadow:"0 2px 8px rgba(0,0,0,0.07)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:"#1a2236" }}>Disease Breakdown</div>
                  <div style={{ fontSize:12, color:"#888" }}>Total: <b style={{ color:"#378ADD" }}>{barData.reduce((a,b) => a + b.cases, 0).toLocaleString()}</b> cases</div>
                </div>
                <ResponsiveContainer width="100%" height={Math.max(400, barData.length * 35)}>
                  <BarChart data={barData} layout="vertical" margin={{ left:10, right:60, top:4, bottom:4 }}>
                    <XAxis type="number" tick={{ fontSize:11 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
                    <YAxis dataKey="name" type="category" width={200} tick={{ fontSize:11 }} />
                    <Tooltip cursor={{ fill:"rgba(55,138,221,0.08)" }} content={({ active, payload }) => {
                      if (active && payload && payload.length) return (
                        <div style={{ background:"#1a2236", padding:"10px 16px", borderRadius:10, color:"#fff", boxShadow:"0 4px 12px rgba(0,0,0,0.3)" }}>
                          <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{payload[0].payload.name}</div>
                          <div style={{ fontSize:13, color:"#93c5fd" }}>Cases: {payload[0].value.toLocaleString()}</div>
                        </div>
                      )
                      return null
                    }} />
                    <Bar dataKey="cases" radius={[0,6,6,0]} label={{ position:"right", fontSize:11, formatter: v => v.toLocaleString() }}>
                      {barData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background:"rgba(255,255,255,0.95)", borderRadius:14, padding:"20px 24px", boxShadow:"0 2px 8px rgba(0,0,0,0.07)" }}>
                <div style={{ fontSize:15, fontWeight:700, marginBottom:16, color:"#1a2236" }}>Category Summary</div>
                <ResponsiveContainer width="100%" height={360}>
                  <PieChart>
                    <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110}
                      label={({ name, percent, midAngle, outerRadius, cx, cy }) => {
                        const RADIAN = Math.PI / 180
                        const radius = outerRadius + 40
                        const x = cx + radius * Math.cos(-midAngle * RADIAN)
                        const y = cy + radius * Math.sin(-midAngle * RADIAN)
                        return (
                          <text x={x} y={y} textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fontSize={12} fontWeight={600} fill="#333">
                            {`${name} ${(percent*100).toFixed(0)}%`}
                          </text>
                        )
                      }}
                      labelLine={{ stroke:"#aaa", strokeWidth:1.5 }}>
                      {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => v.toLocaleString()} />
                    <Legend content={<RLEGEND />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )

  const loginPage = (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", minHeight:"80vh" }}>
      <div style={{ background:"#fff", borderRadius:20, padding:"48px 56px", boxShadow:"0 8px 32px rgba(0,0,0,0.12)", minWidth:360, textAlign:"center" }}>
        <ShieldCheck size={48} color="#378ADD" style={{ marginBottom:12 }} />
        <div style={{ fontSize:22, fontWeight:700, marginBottom:6 }}>Admin Login</div>
        <div style={{ fontSize:13, color:"#888", marginBottom:28 }}>Only authorized admin can access this panel</div>
        <input type="password" placeholder="Enter Password" value={pwInput}
          onChange={e => { setPwInput(e.target.value); setPwError("") }}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          style={{ width:"100%", padding:"12px 16px", borderRadius:10, border:"1.5px solid #ddd", fontSize:15, marginBottom:14, outline:"none", boxSizing:"border-box" }} />
        {pwError && (
          <div style={{ color:"#e24b4a", fontSize:13, marginBottom:10, display:"flex", alignItems:"center", gap:5, justifyContent:"center" }}>
            <AlertCircle size={14} /> {pwError}
          </div>
        )}
        <button onClick={handleLogin}
          style={{ width:"100%", padding:"12px 0", borderRadius:10, background:"#378ADD", color:"#fff", border:"none", fontSize:16, fontWeight:700, cursor:"pointer" }}>
          Login
        </button>
      </div>
    </div>
  )

  const adminPage = (
    <div style={{ padding:"28px 32px", maxWidth:900 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:700, color:"#1a2236", display:"flex", alignItems:"center", gap:8 }}>
            <ShieldCheck size={22} color="#378ADD" /> Admin Panel
          </div>
          <div style={{ fontSize:13, color:"#888", marginTop:2 }}>Manage health data in the database</div>
        </div>
        <button onClick={handleLogout}
          style={{ padding:"8px 18px", borderRadius:8, background:"#fee2e2", color:"#b91c1c", border:"none", fontSize:13, cursor:"pointer", fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
          <LogOut size={14} /> Logout
        </button>
      </div>

      {districtBar}

      <div style={{ background:"#fff", borderRadius:16, padding:"28px 32px", boxShadow:"0 2px 12px rgba(0,0,0,0.08)", marginBottom:24 }}>
        <div style={{ fontSize:16, fontWeight:700, marginBottom:22, color:"#1a2236", display:"flex", alignItems:"center", gap:8 }}>
          <Plus size={18} color="#378ADD" /> Add New Disease Case
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <div>
            <label style={{ fontSize:12, color:"#555", display:"block", marginBottom:5, fontWeight:600 }}>Disease Name *</label>
            <input placeholder="e.g. Dengue, Malaria" value={form.disease_type}
              onChange={e => setForm({ ...form, disease_type: e.target.value })}
              style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:"1.5px solid #e5e7eb", fontSize:14, boxSizing:"border-box" }} />
            {form.disease_type && existingDiseases.includes(form.disease_type.trim().toLowerCase()) && (
              <div style={{ fontSize:12, color:"#e24b4a", marginTop:4, display:"flex", alignItems:"center", gap:4 }}>
                <AlertCircle size={12} /> This disease already exists for this district.
              </div>
            )}
            {form.disease_type && !existingDiseases.includes(form.disease_type.trim().toLowerCase()) && form.disease_type.length > 1 && (
              <div style={{ fontSize:12, color:"#1D9E75", marginTop:4, display:"flex", alignItems:"center", gap:4 }}>
                <CheckCircle2 size={12} /> Available to add.
              </div>
            )}
          </div>
          <div>
            <label style={{ fontSize:12, color:"#555", display:"block", marginBottom:5, fontWeight:600 }}>Case Count *</label>
            <input type="number" placeholder="e.g. 500" value={form.case_count}
              onChange={e => setForm({ ...form, case_count: e.target.value })}
              style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:"1.5px solid #e5e7eb", fontSize:14, boxSizing:"border-box" }} />
          </div>
          <div>
            <label style={{ fontSize:12, color:"#555", display:"block", marginBottom:5, fontWeight:600 }}>Category</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:"1.5px solid #e5e7eb", fontSize:14 }}>
              <option>Infectious Disease</option>
              <option>Orthopedic</option>
              <option>Ophthalmology</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize:12, color:"#555", display:"block", marginBottom:5, fontWeight:600 }}>Month</label>
            <select value={form.month} onChange={e => setForm({ ...form, month: e.target.value })}
              style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:"1.5px solid #e5e7eb", fontSize:14 }}>
              {["January","February","March","April","May","June","July","August","September","October","November","December"].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:12, color:"#555", display:"block", marginBottom:5, fontWeight:600 }}>Year (max {MAX_YEAR})</label>
            <input type="number" value={form.year} max={MAX_YEAR} min={2000}
              onChange={e => setForm({ ...form, year: e.target.value })}
              style={{ width:"100%", padding:"10px 12px", borderRadius:8, fontSize:14, boxSizing:"border-box",
                border: parseInt(form.year) > MAX_YEAR ? "1.5px solid #e24b4a" : "1.5px solid #e5e7eb" }} />
            {parseInt(form.year) > MAX_YEAR && (
              <div style={{ fontSize:12, color:"#e24b4a", marginTop:4, display:"flex", alignItems:"center", gap:4 }}>
                <AlertCircle size={12} /> Year cannot be beyond {MAX_YEAR}.
              </div>
            )}
          </div>
        </div>
        <button onClick={handleSubmit} disabled={submitting}
          style={{ marginTop:22, padding:"12px 36px", borderRadius:10, background: submitting ? "#93c5fd" : "#378ADD",
            color:"#fff", border:"none", fontSize:15, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
          <Plus size={16} /> {submitting ? "Adding..." : "Add Case"}
        </button>
        {msg.text && (
          <div style={{ marginTop:14, padding:"12px 18px", borderRadius:10, fontSize:14, fontWeight:500,
            background: msg.type === "success" ? "#f0fdf4" : "#fef2f2",
            color: msg.type === "success" ? "#15803d" : "#b91c1c",
            display:"flex", alignItems:"center", gap:8 }}>
            {msg.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {msg.text}
          </div>
        )}
      </div>

      <div style={{ background:"#fff", borderRadius:16, padding:"28px 32px", boxShadow:"0 2px 12px rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize:16, fontWeight:700, marginBottom:18, color:"#1a2236" }}>Existing Records</div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr style={{ background:"#f8fafc" }}>
                {["Disease","Category","Cases","Month","Year","Actions"].map(h => (
                  <th key={h} style={{ padding:"10px 14px", textAlign:"left", fontWeight:600, color:"#555", borderBottom:"1px solid #e5e7eb" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allCases.map(c => (
                <tr key={c.id} style={{ borderBottom:"1px solid #f1f5f9" }}>
                  {editingId === c.id ? (
                    <>
                      <td style={{ padding:"8px 14px" }}>
                        <input value={editForm.disease_type} onChange={e => setEditForm({...editForm, disease_type:e.target.value})}
                          style={{ width:"100%", padding:"6px 8px", borderRadius:6, border:"1px solid #ddd", fontSize:12 }} />
                      </td>
                      <td style={{ padding:"8px 14px" }}>
                        <select value={editForm.category} onChange={e => setEditForm({...editForm, category:e.target.value})}
                          style={{ padding:"6px 8px", borderRadius:6, border:"1px solid #ddd", fontSize:12 }}>
                          <option>Infectious Disease</option>
                          <option>Orthopedic</option>
                          <option>Ophthalmology</option>
                        </select>
                      </td>
                      <td style={{ padding:"8px 14px" }}>
                        <input type="number" value={editForm.case_count} onChange={e => setEditForm({...editForm, case_count:e.target.value})}
                          style={{ width:80, padding:"6px 8px", borderRadius:6, border:"1px solid #ddd", fontSize:12 }} />
                      </td>
                      <td style={{ padding:"8px 14px" }}>
                        <select value={editForm.month} onChange={e => setEditForm({...editForm, month:e.target.value})}
                          style={{ padding:"6px 8px", borderRadius:6, border:"1px solid #ddd", fontSize:12 }}>
                          {["January","February","March","April","May","June","July","August","September","October","November","December"].map(m => <option key={m}>{m}</option>)}
                        </select>
                      </td>
                      <td style={{ padding:"8px 14px" }}>
                        <input type="number" value={editForm.year} max={MAX_YEAR} onChange={e => setEditForm({...editForm, year:e.target.value})}
                          style={{ width:70, padding:"6px 8px", borderRadius:6, border:"1px solid #ddd", fontSize:12 }} />
                      </td>
                      <td style={{ padding:"8px 14px" }}>
                        <div style={{ display:"flex", gap:6 }}>
                          <button onClick={() => handleEdit(c.id)}
                            style={{ padding:"5px 10px", borderRadius:6, background:"#1D9E75", color:"#fff", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:4, fontSize:12 }}>
                            <Save size={12} /> Save
                          </button>
                          <button onClick={() => setEditingId(null)}
                            style={{ padding:"5px 10px", borderRadius:6, background:"#e5e7eb", color:"#555", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:4, fontSize:12 }}>
                            <X size={12} /> Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding:"10px 14px", fontWeight:500 }}>{c.disease_type}</td>
                      <td style={{ padding:"10px 14px" }}>
                        <span style={{ padding:"2px 8px", borderRadius:20, fontSize:11, fontWeight:600,
                          background: c.category === "Infectious Disease" ? "#EBF5FF" : c.category === "Orthopedic" ? "#FFF7E6" : "#F0FDF4",
                          color: c.category === "Infectious Disease" ? "#1565C0" : c.category === "Orthopedic" ? "#B45309" : "#15803d" }}>
                          {c.category}
                        </span>
                      </td>
                      <td style={{ padding:"10px 14px" }}>{c.case_count?.toLocaleString()}</td>
                      <td style={{ padding:"10px 14px", color:"#888" }}>{c.month}</td>
                      <td style={{ padding:"10px 14px", color:"#888" }}>{c.year}</td>
                      <td style={{ padding:"10px 14px" }}>
                        <div style={{ display:"flex", gap:6 }}>
                          <button onClick={() => { setEditingId(c.id); setEditForm({ disease_type:c.disease_type, category:c.category, case_count:c.case_count, month:c.month, year:c.year }) }}
                            style={{ padding:"5px 10px", borderRadius:6, background:"#EBF5FF", color:"#1565C0", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:4, fontSize:12 }}>
                            <Pencil size={12} /> Edit
                          </button>
                          {deleteConfirm === c.id ? (
                            <div style={{ display:"flex", gap:4 }}>
                              <button onClick={() => handleDelete(c.id)}
                                style={{ padding:"5px 10px", borderRadius:6, background:"#e24b4a", color:"#fff", border:"none", cursor:"pointer", fontSize:12 }}>Confirm</button>
                              <button onClick={() => setDeleteConfirm(null)}
                                style={{ padding:"5px 10px", borderRadius:6, background:"#e5e7eb", color:"#555", border:"none", cursor:"pointer", fontSize:12 }}>Cancel</button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirm(c.id)}
                              style={{ padding:"5px 10px", borderRadius:6, background:"#FEF2F2", color:"#b91c1c", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:4, fontSize:12 }}>
                              <Trash2 size={12} /> Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )


  const teamMembers = [
    {
      name: "Rahit Kumar Saha",
      role: "Data Engineer",
      desc: "Managing all data-centric operations including sourcing, cleaning, and analyzing health datasets to achieve project objectives.",
      github: "https://github.com",
      linkedin: "https://linkedin.com",
      initial: "R"
    },
    {
      name: "Santanu Pramanik",
      role: "Full Stack Developer",
      desc: "Manages the complete project and leads the backend development and architecture tasks.",
      github: "https://github.com/Santanu-pramanik",
      linkedin: "https://linkedin.com/in/santanu-pramanik",
      initial: "S"
    },
    {
      name: "Priyanka Ade",
      role: "Frontend Developer",
      desc: "Operates and manages the system's frontend, creates data analysis leads to interpret findings, and generates schematic reports.",
      github: "https://github.com",
      linkedin: "https://linkedin.com",
      initial: "P"
    },
    {
      name: "Sumita Mandal",
      role: "Project Manager",
      desc: "Manages all aspects of the project's web page and ensures data analysis to guide decisions.",
      github: "https://github.com",
      linkedin: "https://linkedin.com",
      initial: "M"
    }
  ]

  const aboutPage = (
    <div style={{ padding:"28px 32px", maxWidth:"100%", background:"linear-gradient(135deg, #f0f4f8 0%, #e8f0f8 100%)", minHeight:"100vh", position:"relative" }}>
      <div style={{ position:"fixed", right:"2%", top:"50%", transform:"translateY(-50%)", opacity:0.06, pointerEvents:"none", zIndex:0 }}>
        <svg width="500" height="600" viewBox="165 45 155 195">
          <path d={WB_PATH} fill="#1a5276" stroke="#1a5276" strokeWidth="1"/>
          <text x="225" y="235" textAnchor="middle" fill="#1a5276" fontSize="12" fontWeight="700" letterSpacing="3">WEST BENGAL</text>
        </svg>
      </div>
      <div style={{ position:"relative", zIndex:1 }}>
        {/* Project info */}
        <div style={{ background:"rgba(255,255,255,0.95)", borderRadius:16, padding:"32px 36px", boxShadow:"0 2px 12px rgba(0,0,0,0.07)", marginBottom:24 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
            <div style={{ width:52, height:52, borderRadius:14, background:"linear-gradient(135deg, #378ADD, #1D9E75)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Activity size={26} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize:22, fontWeight:800, color:"#1a2236" }}>District Health Intelligence System</div>
              <div style={{ fontSize:13, color:"#888", marginTop:2 }}>DHIS — Final Year Project | Abacus Institute of Engineering and Management</div>
            </div>
          </div>
          <p style={{ fontSize:14, color:"#555", lineHeight:1.8, maxWidth:700 }}>
            The District Health Intelligence System (DHIS) is a digital platform that collects and analyzes
            district-level health data to support informed decision-making and improve public health services
            across West Bengal. The system tracks disease outbreaks, hospital capacity, and doctor requirements
            in real-time.
          </p>
          <div style={{ display:"flex", gap:16, marginTop:20, flexWrap:"wrap" }}>
            {[
              { label:"Technology", value:"React + FastAPI + Supabase" },
              { label:"Region", value:"West Bengal, India" },
              { label:"Districts", value:"4 Active Districts" },
              { label:"Year", value:"2025-26" }
            ].map(item => (
              <div key={item.label} style={{ background:"#f8fafc", borderRadius:10, padding:"10px 16px", border:"1px solid #e5e7eb" }}>
                <div style={{ fontSize:11, color:"#888", marginBottom:3 }}>{item.label}</div>
                <div style={{ fontSize:13, fontWeight:600, color:"#1a2236" }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Team members */}
        <div style={{ fontSize:18, fontWeight:700, color:"#1a2236", marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
          <Users size={20} color="#378ADD" /> Our Team
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:16 }}>
          {teamMembers.map((member, i) => (
            <div key={i} style={{ background:"rgba(255,255,255,0.95)", borderRadius:16, padding:"24px 28px", boxShadow:"0 2px 12px rgba(0,0,0,0.07)", display:"flex", gap:18, alignItems:"flex-start" }}>
              <div style={{ width:52, height:52, borderRadius:14, background:`linear-gradient(135deg, ${COLORS[i]}, ${COLORS[(i+3)%COLORS.length]})`,
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:20, fontWeight:700, color:"#fff" }}>
                {member.initial}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:16, fontWeight:700, color:"#1a2236", marginBottom:2 }}>{member.name}</div>
                <div style={{ fontSize:12, color:"#378ADD", fontWeight:600, marginBottom:8 }}>{member.role}</div>
                <p style={{ fontSize:13, color:"#666", lineHeight:1.7, marginBottom:12 }}>{member.desc}</p>
                <div style={{ display:"flex", gap:8 }}>
                  <a href={member.github} target="_blank" rel="noopener noreferrer"
                    style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:6, background:"#f1f5f9", color:"#333", textDecoration:"none", fontSize:12, fontWeight:600 }}>
                    <ExternalLink size={13} /> GitHub
                  </a>
                  <a href={member.linkedin} target="_blank" rel="noopener noreferrer"
                    style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:6, background:"#EBF5FF", color:"#1565C0", textDecoration:"none", fontSize:12, fontWeight:600 }}>
                    <ExternalLink size={13} /> LinkedIn
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ textAlign:"center", marginTop:32, padding:"20px", color:"#aaa", fontSize:13 }}>
          Built with React, FastAPI & Supabase | Abacus Institute of Engineering and Management, Kolkata
        </div>
      </div>
    </div>
  )

if (currentPage === "landing") {
  return <LandingPage onNavigate={(p) => {
    if (p === "doctor") {
      setCurrentPage("doctor")
    } else {
      setCurrentPage("app"); setPage(p)
    }
  }} />
}

if (currentPage === "landing") {
  return <LandingPage onNavigate={(p) => {
    if (p === "doctor") {
      setCurrentPage("doctor")
    } else {
      setCurrentPage("app"); setPage(p)
    }
  }} />
}

if (currentPage === "doctor") {
  if (!doctorLoggedIn) {
    return <DoctorLogin
      onLoginSuccess={(doctor) => {
        setLoggedDoctor(doctor)
        setDoctorLoggedIn(true)
      }}
      onBack={() => setCurrentPage("landing")}
    />
  }
  return <DoctorDashboard
    doctor={loggedDoctor}
    onLogout={() => { setDoctorLoggedIn(false); setLoggedDoctor(null); setCurrentPage("landing") }}
  />
}
  return (
    <div style={{ fontFamily:"system-ui,sans-serif", minHeight:"100vh", background:"linear-gradient(135deg, #f0f4f8 0%, #e8f0f8 100%)" }}>
      {navbar}
      {page === "dashboard" && dashboardPage}
      {page === "admin" && !adminLoggedIn && loginPage}
      {page === "admin" && adminLoggedIn && adminPage}
      {page === "about" && aboutPage}
      {page === "hospitals" && (
  <HospitalPage
    districtId={selectedDistrict}
    districtName={districts.find(d => d.id === selectedDistrict)?.name || ""}
    onBack={() => setPage("dashboard")}
  />
)}
<AIAssistant 
  selectedDistrict={selectedDistrict}
  districtName={districts.find(d => d.id === selectedDistrict)?.name || ""}
  districts={districts}
/>
    </div>
  )
}
// APPEND - this won't work, need to regenerate
