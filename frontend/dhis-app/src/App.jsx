import { useState, useEffect } from "react"
import axios from "axios"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts"

import logo from "./assets/logo.png"

const API = "https://dhis-backend.onrender.com"
const COLORS = ["#378ADD","#1D9E75","#EF9F27","#D85A30","#7F77DD","#993556","#639922","#BA7517","#D4537E","#0F6E56","#E24B4A","#533AB7"]
const ADMIN_PASSWORD = "dhis2026"

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
  const [districts, setDistricts] = useState([])
  const [selectedDistrict, setSelectedDistrict] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [adminLoggedIn, setAdminLoggedIn] = useState(false)
  const [pwInput, setPwInput] = useState("")
  const [pwError, setPwError] = useState("")
  const [form, setForm] = useState({ disease_type:"", case_count:"", month:"January", year:2025, category:"Infectious Disease" })
  const [msg, setMsg] = useState("")
  const [submitting, setSubmitting] = useState(false)

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
  }, [selectedDistrict])

  const handleLogin = () => {
    if (pwInput === ADMIN_PASSWORD) { setAdminLoggedIn(true); setPwError("") }
    else setPwError("Wrong password! Please try again.")
  }

  const handleSubmit = async () => {
    if (!form.disease_type || !form.case_count) { setMsg("Please fill all fields"); return }
    setSubmitting(true)
    try {
      await axios.post(`${API}/cases/add`, {
        ...form, case_count: parseInt(form.case_count),
        year: parseInt(form.year), district_id: selectedDistrict
      })
      setMsg("✓ Data added successfully!!")
      setForm({ disease_type:"", case_count:"", month:"January", year:2025, category:"Infectious Disease" })
      axios.get(`${API}/analysis/${selectedDistrict}`).then(r => setAnalysis(r.data))
    } catch { setMsg("Error occurred, please try again.") }
    setSubmitting(false)
  }

  const barData = analysis
    ? Object.entries(analysis.disease_breakdown)
        .sort((a,b) => b[1]-a[1])
        .map(([name, val]) => ({ name: name.trim(), cases: val }))
    : []
  const catData = analysis
    ? Object.entries(analysis.category_summary).map(([name, val]) => ({ name, value: val }))
    : []

  const navbar = (
    <div style={{ background:"#1a2236", padding:"0 32px", display:"flex", alignItems:"center", justifyContent:"space-between", height:90, position:"sticky", top:0, zIndex:100 , boxShadow:"0 2px 10px rgba(0,0,0,0.15)", position:"relative"}}>
      <span style={{ color:"#fff", fontWeight:700, fontSize:16 }}>
      <div style={{ display:"flex", alignItems:"center"}}>
        <img src={logo} alt="Logo" style={{ height:75, weight:75,objectFit:"contain"}} />
      </div>
      </span>
      <div style={{position:"absolute", left:"45%", transform:"translateX(-50%)", color:"#fff", fontSize:"36px", fontWeight:"800", letterSpacing:"3px", textTransform:"uppercase", fontFamily:"Poppins, sans-serif", textShadow:"0 0 10px rgba(55,138,221,0.6)"}}>
      District Health Intelligence System
      </div>
      <div style={{ display:"flex", gap:10, alignItems:"center" }}>
        {["dashboard","admin"].map(p => (
          <button key={p} onClick={() => setPage(p)}
            style={{ padding:"8px 22px", borderRadius:10, border:"none", cursor:"pointer", fontWeight:600, fontSize:14,transition:"all 0.3s",
              background: page===p ? "#378ADD" : "transparent", color: page===p ? "#fff" : "#aac4e0" }}>
            {p === "dashboard" ? "Dashboard" : "Admin Panel"}
          </button>
        ))}
      </div>
    </div>
  )

  const districtBar = (
    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
      <span style={{ fontSize:13, color:"#070000", fontWeight:600 }}>District:</span>
      <select value={selectedDistrict || ""} onChange={e => setSelectedDistrict(Number(e.target.value))}
        style={{ padding:"8px 16px", borderRadius:8, border:"1.5px solid #fbf6f6", fontSize:14, background:"#0a0101", cursor:"pointer", minWidth:160 }}>
        {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>
      {analysis && <span style={{ fontSize:13, color:"#888" }}>Total: <b>{analysis.total_cases?.toLocaleString()}</b> cases</span>}
    </div>
  )

  const kpi = (label, value, color="#1a2236", sub=null) => (
    <div style={{ background:"#fff", borderRadius:14, padding:"20px 24px", boxShadow:"0 2px 8px rgba(0,0,0,0.07)", flex:1, minWidth:180 }}>
      <div style={{ fontSize:12, color:"#888", marginBottom:6, textTransform:"uppercase", letterSpacing:.5 }}>{label}</div>
      <div style={{ fontSize:28, fontWeight:700, color }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:"#aaa", marginTop:4 }}>{sub}</div>}
    </div>
  )

  const dashboardPage = (
    <div style={{maxWidth:"100%", margin:"0 auto", padding:"28px 16px" }}>
      {districtBar}
      {loading && <div style={{ textAlign:"center", padding:80, color:"#888", fontSize:16 }}>⏳ Loading data...</div>}
      {analysis && !loading && (
        <>
          <div style={{ display:"flex", gap:14, marginBottom:24, flexWrap:"wrap" }}>
            {kpi("Total Cases", analysis.total_cases?.toLocaleString())}
            {kpi("Top Disease", analysis.top_disease, "#D85A30", `${barData[0]?.cases?.toLocaleString()} cases`)}
            {kpi("Total Hospitals", analysis.total_hospitals, "#1D9E75")}
            {kpi("Doctor Shortage", analysis.shortage > 0 ? `${analysis.shortage} short` : "Fully Staffed",
              analysis.shortage > 0 ? "#e24b4a" : "#1D9E75",
              `Required: ${analysis.required_doctors} | Available: ${analysis.available_doctors}`)}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, marginBottom:18 }}>
            <div style={{ background:"#fff", borderRadius:14, padding:"20px 24px", boxShadow:"0 2px 8px rgba(0,0,0,0.07)" }}>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:16, color:"#1a2236" }}>Disease Breakdown (Top 14)</div>
              <ResponsiveContainer width="100%" height={600}>
                <BarChart data={barData} layout="vertical" margin={{ left:10, right:60, top:4, bottom:4 }}>
  <XAxis type="number" tick={{ fontSize:11 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
  <YAxis dataKey="name" type="category" width={240} tick={{ fontSize:11 }} />
  <Tooltip
    cursor={{ fill:"rgba(55,138,221,0.08)" }}
    content={({ active, payload }) => {
      if (active && payload && payload.length) {
        return (
          <div style={{ background:"#1a2236", padding:"10px 16px", borderRadius:10, color:"#fff", boxShadow:"0 4px 12px rgba(0,0,0,0.3)" }}>
            <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{payload[0].payload.name}</div>
            <div style={{ fontSize:13, color:"#93c5fd" }}>Total Cases: {payload[0].value.toLocaleString()}</div>
          </div>
        )
      }
      return null
    }}
  />
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
  <Pie data={catData} dataKey="value" nameKey="name" 
    cx="50%" cy="50%" outerRadius={110}
    label={({ name, percent, midAngle, outerRadius, cx, cy }) => {
      const RADIAN = Math.PI / 180
      const radius = outerRadius + 40
      const x = cx + radius * Math.cos(-midAngle * RADIAN)
      const y = cy + radius * Math.sin(-midAngle * RADIAN)
      const icons = { "Infectious Disease":"🦟", "Orthopedic":"🦴", "Ophthalmology":"👁️" }
      const icon = icons[name] || "🏥"
      return (
        <text x={x} y={y} textAnchor={x > cx ? "start" : "end"} 
          dominantBaseline="central" fontSize={12} fontWeight={600} fill="#333">
          {`${icon} ${name} ${(percent*100).toFixed(0)}%`}
        </text>
      )
    }}
    labelLine={{ stroke:"#aaa", strokeWidth:1.5 }}>
    {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
  </Pie>
  <Tooltip cursor={{ fill: "rgba(0,0,0,0.05)" }} content={({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background:"#1a2236", padding:"8px 14px", borderRadius:8, color:"#fff", boxShadow:"0 2px 8px rgba(0,0,0,0.2)" }}>
        <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{payload[0].payload.name}</div>
        <div style={{ fontSize:13, color:"#93c5fd" }}>Cases: {payload[0].value.toLocaleString()}</div>
      </div>
    )
  }
  return null
}} />
</PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  )

  const loginPage = (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", minHeight:"80vh" }}>
      <div style={{ background:"#fff", borderRadius:20, padding:"48px 56px", boxShadow:"0 8px 32px rgba(0,0,0,0.12)", minWidth:360, textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:12 }}>🔒</div>
        <div style={{ fontSize:22, fontWeight:700, marginBottom:6 }}>Admin Login</div>
        <div style={{ fontSize:13, color:"#888", marginBottom:28 }}>Only authorized admin can access this panel</div>
        <input type="password" placeholder="Enter Password" value={pwInput}
          onChange={e => { setPwInput(e.target.value); setPwError("") }}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          style={{ width:"100%", padding:"12px 16px", borderRadius:10, border:"1.5px solid #ddd", fontSize:15, marginBottom:14, outline:"none", boxSizing:"border-box" }} />
        {pwError && <div style={{ color:"#e24b4a", fontSize:13, marginBottom:10 }}>{pwError}</div>}
        <button onClick={handleLogin}
          style={{ width:"100%", padding:"12px 0", borderRadius:10, background:"#378ADD", color:"#fff", border:"none", fontSize:16, fontWeight:700, cursor:"pointer" }}>
          Login
        </button>
      </div>
    </div>
  )

  const adminPage = (
    <div style={{ padding:"28px 32px", maxWidth:700 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:700, color:"#1a2236" }}>Admin Panel</div>
          <div style={{ fontSize:13, color:"#888", marginTop:2 }}>Add new health data to the database</div>
        </div>
        <button onClick={() => { setAdminLoggedIn(false); setPwInput("") }}
          style={{ padding:"8px 18px", borderRadius:8, background:"#fee2e2", color:"#b91c1c", border:"none", fontSize:13, cursor:"pointer", fontWeight:600 }}>
          Logout
        </button>
      </div>

      {districtBar}

      <div style={{ background:"#fff", borderRadius:16, padding:"28px 32px", boxShadow:"0 2px 12px rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize:16, fontWeight:700, marginBottom:22, color:"#1a2236" }}>Add New Disease Case</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          {[
            { label:"Disease Name *", key:"disease_type", type:"text", ph:"e.g. Dengue, Malaria" },
            { label:"Case Count *", key:"case_count", type:"number", ph:"e.g. 500" },
            { label:"Year", key:"year", type:"number", ph:"2025" }
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontSize:12, color:"#555", display:"block", marginBottom:5, fontWeight:600 }}>{f.label}</label>
              <input type={f.type} placeholder={f.ph} value={form[f.key]}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:"1.5px solid #e5e7eb", fontSize:14, boxSizing:"border-box" }} />
            </div>
          ))}
          <div>
            <label style={{ fontSize:12, color:"#555", display:"block", marginBottom:5, fontWeight:600 }}>Month</label>
            <select value={form.month} onChange={e => setForm({ ...form, month:e.target.value })}
              style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:"1.5px solid #e5e7eb", fontSize:14 }}>
              {["January","February","March","April","May","June","July","August","September","October","November","December"].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:12, color:"#555", display:"block", marginBottom:5, fontWeight:600 }}>Category</label>
            <select value={form.category} onChange={e => setForm({ ...form, category:e.target.value })}
              style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:"1.5px solid #e5e7eb", fontSize:14 }}>
              <option>Infectious Disease</option>
              <option>Orthopedic</option>
              <option>Ophthalmology</option>
            </select>
          </div>
        </div>
        <button onClick={handleSubmit} disabled={submitting}
          style={{ marginTop:22, padding:"12px 36px", borderRadius:10, background: submitting ? "#93c5fd":"#378ADD",
            color:"#fff", border:"none", fontSize:15, fontWeight:700, cursor:"pointer" }}>
          {submitting ? "Adding..." : "Add Case"}
        </button>
        {msg && (
          <div style={{ marginTop:14, padding:"12px 18px", borderRadius:10,
            background: msg.startsWith("✓") ? "#f0fdf4":"#fef2f2",
            color: msg.startsWith("✓") ? "#15803d":"#b91c1c", fontSize:14, fontWeight:500 }}>
            {msg}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily:"system-ui,sans-serif", minHeight:"100vh", background:"#f0f4f8" }}>
      {navbar}
      {page === "dashboard" && dashboardPage}
      {page === "admin" && !adminLoggedIn && loginPage}
      {page === "admin" && adminLoggedIn && adminPage}
    </div>
  )
}
