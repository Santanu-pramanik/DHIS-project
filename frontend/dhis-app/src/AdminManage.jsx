import { useState, useEffect, Fragment } from "react"
import axios from "axios"
import {
  Plus, Pencil, Trash2, X, Check, Building2, Stethoscope, MapPin, Users, RefreshCw,
} from "lucide-react"

const th = { textAlign: "left", padding: "8px 10px", fontSize: 11, color: "#8ba8c8", fontWeight: 700, textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.1)" }
const td = { padding: "8px 10px", fontSize: 13, color: "#e5e7eb", borderBottom: "1px solid rgba(255,255,255,0.06)" }
const inputSm = { padding: "6px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 13, width: "100%", boxSizing: "border-box" }
const btnGhost = { padding: "5px 9px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "#8ba8c8", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }
const btnPrimary = { padding: "9px 16px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #378ADD, #1D9E75)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }
const panelStyle = { background: "rgba(255,255,255,0.02)", borderRadius: 16, padding: "24px 28px", border: "1px solid rgba(255,255,255,0.25)", marginBottom: 24 }

export default function AdminManage({ API }) {
  const [subTab, setSubTab] = useState("hospitals")

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[
          ["hospitals", "Hospitals", Building2],
          ["doctors", "Doctors", Stethoscope],
          ["districts", "Districts", MapPin],
          ["patients", "Patients", Users],
        ].map(([key, label, Icon]) => (
          <button key={key} onClick={() => setSubTab(key)}
            style={{
              padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              border: subTab === key ? "1px solid #1D9E75" : "1px solid rgba(255,255,255,0.1)",
              background: subTab === key ? "rgba(29,158,117,0.15)" : "transparent",
              color: subTab === key ? "#6ee7b7" : "#8ba8c8",
            }}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {subTab === "hospitals" && <HospitalsPanel API={API} />}
      {subTab === "doctors" && <DoctorsPanel API={API} />}
      {subTab === "districts" && <DistrictsPanel API={API} />}
      {subTab === "patients" && <PatientsPanel API={API} />}
    </div>
  )
}

// ───────────────────────── Hospitals ─────────────────────────
function HospitalsPanel({ API }) {
  const [hospitals, setHospitals] = useState([])
  const [districts, setDistricts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [adding, setAdding] = useState(false)
  const [newForm, setNewForm] = useState({ hospital_name: "", district_id: "", address: "", total_doctors: 0, available_doctors: 0 })
  const [expanded, setExpanded] = useState(null)

  const load = async () => {
    setLoading(true)
    const [h, d] = await Promise.all([
      axios.get(`${API}/admin/hospitals`),
      axios.get(`${API}/districts`),
    ])
    setHospitals(h.data || [])
    setDistricts(d.data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const startEdit = (h) => { setEditId(h.id); setEditForm({ ...h }) }
  const saveEdit = async () => {
    await axios.put(`${API}/admin/hospitals/${editId}`, editForm)
    setEditId(null); load()
  }
  const remove = async (id) => {
    if (!confirm("Delete this hospital? This cannot be undone.")) return
    await axios.delete(`${API}/admin/hospitals/${id}`)
    load()
  }
  const addHospital = async () => {
    if (!newForm.hospital_name || !newForm.district_id) return
    await axios.post(`${API}/admin/hospitals`, newForm)
    setNewForm({ hospital_name: "", district_id: "", address: "", total_doctors: 0, available_doctors: 0 })
    setAdding(false); load()
  }

  return (
    <div style={panelStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Hospitals</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={btnGhost} onClick={load}><RefreshCw size={12} /> Refresh</button>
          <button style={btnPrimary} onClick={() => setAdding(a => !a)}><Plus size={14} /> Add Hospital</button>
        </div>
      </div>

      {adding && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18, padding: 14, background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
          <input style={inputSm} placeholder="Hospital name" value={newForm.hospital_name} onChange={e => setNewForm(f => ({ ...f, hospital_name: e.target.value }))} />
          <select style={inputSm} value={newForm.district_id} onChange={e => setNewForm(f => ({ ...f, district_id: e.target.value }))}>
            <option value="">-- District --</option>
            {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <input style={{ ...inputSm, gridColumn: "1 / -1" }} placeholder="Address" value={newForm.address} onChange={e => setNewForm(f => ({ ...f, address: e.target.value }))} />
          <input style={inputSm} type="number" placeholder="Total doctors" value={newForm.total_doctors} onChange={e => setNewForm(f => ({ ...f, total_doctors: e.target.value }))} />
          <input style={inputSm} type="number" placeholder="Available doctors" value={newForm.available_doctors} onChange={e => setNewForm(f => ({ ...f, available_doctors: e.target.value }))} />
          <button style={{ ...btnPrimary, gridColumn: "1 / -1", justifyContent: "center" }} onClick={addHospital}>Save Hospital</button>
        </div>
      )}

      {loading ? <div style={{ color: "#8ba8c8" }}>Loading...</div> : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>
            <th style={th}>Name</th><th style={th}>District</th><th style={th}>Address</th>
            <th style={th}>Doctors</th><th style={th}></th>
          </tr></thead>
          <tbody>
            {hospitals.map(h => (
              <Fragment key={h.id}>
                <tr>
                  {editId === h.id ? (
                    <>
                      <td style={td}><input style={inputSm} value={editForm.hospital_name} onChange={e => setEditForm(f => ({ ...f, hospital_name: e.target.value }))} /></td>
                      <td style={td}>
                        <select style={inputSm} value={editForm.district_id} onChange={e => setEditForm(f => ({ ...f, district_id: e.target.value }))}>
                          {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </td>
                      <td style={td}><input style={inputSm} value={editForm.address || ""} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} /></td>
                      <td style={td}>
                        <input style={{ ...inputSm, width: 55, display: "inline-block" }} type="number" value={editForm.total_doctors} onChange={e => setEditForm(f => ({ ...f, total_doctors: e.target.value }))} />
                        {" / "}
                        <input style={{ ...inputSm, width: 55, display: "inline-block" }} type="number" value={editForm.available_doctors} onChange={e => setEditForm(f => ({ ...f, available_doctors: e.target.value }))} />
                      </td>
                      <td style={td}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button style={btnGhost} onClick={saveEdit}><Check size={12} /></button>
                          <button style={btnGhost} onClick={() => setEditId(null)}><X size={12} /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={td}>{h.hospital_name}</td>
                      <td style={td}>{h.districts?.name || "—"}</td>
                      <td style={td}>{h.address || "—"}</td>
                      <td style={td}>{h.available_doctors}/{h.total_doctors}</td>
                      <td style={td}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button style={btnGhost} onClick={() => setExpanded(expanded === h.id ? null : h.id)}>Departments</button>
                          <button style={btnGhost} onClick={() => startEdit(h)}><Pencil size={12} /></button>
                          <button style={{ ...btnGhost, color: "#fca5a5", borderColor: "rgba(239,68,68,0.3)" }} onClick={() => remove(h.id)}><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
                {expanded === h.id && (
                  <tr key={`${h.id}-dept`}>
                    <td colSpan={5} style={{ ...td, background: "rgba(255,255,255,0.02)" }}>
                      <DepartmentsInline API={API} hospitalId={h.id} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function DepartmentsInline({ API, hospitalId }) {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newDept, setNewDept] = useState({ department_name: "", total_beds: 0, available_beds: 0 })
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({})

  const load = async () => {
    setLoading(true)
    const res = await axios.get(`${API}/hospital/${hospitalId}/details`)
    setDepartments(res.data.departments || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [hospitalId])

  const addDept = async () => {
    if (!newDept.department_name) return
    await axios.post(`${API}/admin/departments`, { ...newDept, hospital_id: hospitalId })
    setNewDept({ department_name: "", total_beds: 0, available_beds: 0 })
    setAdding(false); load()
  }
  const startEdit = (d) => { setEditId(d.id); setEditForm({ ...d }) }
  const saveEdit = async () => {
    await axios.put(`${API}/admin/departments/${editId}`, editForm)
    setEditId(null); load()
  }
  const remove = async (id) => {
    if (!confirm("Delete this department?")) return
    await axios.delete(`${API}/admin/departments/${id}`)
    load()
  }

  if (loading) return <div style={{ color: "#8ba8c8", fontSize: 12 }}>Loading departments...</div>

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: "#a78bfa", fontWeight: 700 }}>Departments & Beds</div>
        <button style={btnGhost} onClick={() => setAdding(a => !a)}><Plus size={12} /> Add Department</button>
      </div>

      {adding && (
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input style={inputSm} placeholder="Department name" value={newDept.department_name} onChange={e => setNewDept(f => ({ ...f, department_name: e.target.value }))} />
          <input style={{ ...inputSm, width: 90 }} type="number" placeholder="Total beds" value={newDept.total_beds} onChange={e => setNewDept(f => ({ ...f, total_beds: e.target.value }))} />
          <input style={{ ...inputSm, width: 90 }} type="number" placeholder="Avail. beds" value={newDept.available_beds} onChange={e => setNewDept(f => ({ ...f, available_beds: e.target.value }))} />
          <button style={btnGhost} onClick={addDept}><Check size={12} /></button>
        </div>
      )}

      {departments.length === 0 ? <div style={{ fontSize: 12, color: "#8ba8c8" }}>No departments yet.</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {departments.map(d => (
            <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
              {editId === d.id ? (
                <>
                  <input style={inputSm} value={editForm.department_name} onChange={e => setEditForm(f => ({ ...f, department_name: e.target.value }))} />
                  <input style={{ ...inputSm, width: 70 }} type="number" value={editForm.total_beds} onChange={e => setEditForm(f => ({ ...f, total_beds: e.target.value }))} />
                  <input style={{ ...inputSm, width: 70 }} type="number" value={editForm.available_beds} onChange={e => setEditForm(f => ({ ...f, available_beds: e.target.value }))} />
                  <button style={btnGhost} onClick={saveEdit}><Check size={12} /></button>
                  <button style={btnGhost} onClick={() => setEditId(null)}><X size={12} /></button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1, color: "#e5e7eb" }}>{d.department_name}</span>
                  <span style={{ color: "#8ba8c8" }}>{d.available_beds}/{d.total_beds} beds</span>
                  <button style={btnGhost} onClick={() => startEdit(d)}><Pencil size={11} /></button>
                  <button style={{ ...btnGhost, color: "#fca5a5", borderColor: "rgba(239,68,68,0.3)" }} onClick={() => remove(d.id)}><Trash2 size={11} /></button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ───────────────────────── Doctors ─────────────────────────
function DoctorsPanel({ API }) {
  const [doctors, setDoctors] = useState([])
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newForm, setNewForm] = useState({ name: "", specialization: "", hospital_id: "" })
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [newCreds, setNewCreds] = useState(null)
  const [resetCreds, setResetCreds] = useState(null)

  const load = async () => {
    setLoading(true)
    const [dRes, hRes] = await Promise.all([
      axios.get(`${API}/admin/doctors`),
      axios.get(`${API}/admin/hospitals`),
    ])
    setDoctors(dRes.data || []); setHospitals(hRes.data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const addDoctor = async () => {
    if (!newForm.name || !newForm.hospital_id) return
    const res = await axios.post(`${API}/admin/doctors`, newForm)
    setNewCreds({ unique_id: res.data.doctor.unique_id, password: res.data.doctor._plaintext_password })
    setNewForm({ name: "", specialization: "", hospital_id: "" })
    setAdding(false); load()
  }
  const startEdit = (d) => { setEditId(d.id); setEditForm({ ...d }) }
  const saveEdit = async () => {
    await axios.put(`${API}/admin/doctors/${editId}`, editForm)
    setEditId(null); load()
  }
  const remove = async (id) => {
    if (!confirm("Delete this doctor? Their login will stop working.")) return
    await axios.delete(`${API}/admin/doctors/${id}`)
    load()
  }
  const resetPassword = async (id) => {
    const res = await axios.post(`${API}/admin/doctors/${id}/reset-password`)
    setResetCreds({ id, password: res.data.password })
  }

  return (
    <div style={panelStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Doctors</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={btnGhost} onClick={load}><RefreshCw size={12} /> Refresh</button>
          <button style={btnPrimary} onClick={() => setAdding(a => !a)}><Plus size={14} /> Add Doctor</button>
        </div>
      </div>

      {newCreds && (
        <div style={{ marginBottom: 16, padding: 14, borderRadius: 10, background: "rgba(29,158,117,0.1)", border: "1px solid rgba(29,158,117,0.4)", fontSize: 13, color: "#6ee7b7" }}>
          Doctor created! Share these login details — shown only once:
          <div style={{ marginTop: 6, fontFamily: "monospace", fontSize: 14 }}>ID: {newCreds.unique_id} · Password: {newCreds.password}</div>
          <button style={{ ...btnGhost, marginTop: 8 }} onClick={() => setNewCreds(null)}>Dismiss</button>
        </div>
      )}
      {resetCreds && (
        <div style={{ marginBottom: 16, padding: 14, borderRadius: 10, background: "rgba(55,138,221,0.1)", border: "1px solid rgba(55,138,221,0.4)", fontSize: 13, color: "#93c5fd" }}>
          Password reset! New password: <strong>{resetCreds.password}</strong>
          <button style={{ ...btnGhost, marginLeft: 10 }} onClick={() => setResetCreds(null)}>Dismiss</button>
        </div>
      )}

      {adding && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 18, padding: 14, background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
          <input style={inputSm} placeholder="Doctor name (e.g. Dr. Amit Roy)" value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} />
          <input style={inputSm} placeholder="Specialization" value={newForm.specialization} onChange={e => setNewForm(f => ({ ...f, specialization: e.target.value }))} />
          <select style={inputSm} value={newForm.hospital_id} onChange={e => setNewForm(f => ({ ...f, hospital_id: e.target.value }))}>
            <option value="">-- Hospital --</option>
            {hospitals.map(h => <option key={h.id} value={h.id}>{h.hospital_name}</option>)}
          </select>
          <button style={{ ...btnPrimary, gridColumn: "1 / -1", justifyContent: "center" }} onClick={addDoctor}>Save Doctor (auto-generates login)</button>
        </div>
      )}

      {loading ? <div style={{ color: "#8ba8c8" }}>Loading...</div> : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>
            <th style={th}>Name</th><th style={th}>Specialization</th><th style={th}>Hospital</th>
            <th style={th}>Login ID</th><th style={th}></th>
          </tr></thead>
          <tbody>
            {doctors.map(d => (
              <tr key={d.id}>
                {editId === d.id ? (
                  <>
                    <td style={td}><input style={inputSm} value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} /></td>
                    <td style={td}><input style={inputSm} value={editForm.specialization || ""} onChange={e => setEditForm(f => ({ ...f, specialization: e.target.value }))} /></td>
                    <td style={td}>
                      <select style={inputSm} value={editForm.hospital_id} onChange={e => setEditForm(f => ({ ...f, hospital_id: e.target.value }))}>
                        {hospitals.map(h => <option key={h.id} value={h.id}>{h.hospital_name}</option>)}
                      </select>
                    </td>
                    <td style={td}>{d.unique_id}</td>
                    <td style={td}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button style={btnGhost} onClick={saveEdit}><Check size={12} /></button>
                        <button style={btnGhost} onClick={() => setEditId(null)}><X size={12} /></button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={td}>{d.name}</td>
                    <td style={td}>{d.specialization || "—"}</td>
                    <td style={td}>{d.hospitals?.hospital_name || "—"}</td>
                    <td style={td}>{d.unique_id || "—"}</td>
                    <td style={td}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button style={btnGhost} onClick={() => resetPassword(d.id)}>Reset PW</button>
                        <button style={btnGhost} onClick={() => startEdit(d)}><Pencil size={12} /></button>
                        <button style={{ ...btnGhost, color: "#fca5a5", borderColor: "rgba(239,68,68,0.3)" }} onClick={() => remove(d.id)}><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ───────────────────────── Districts ─────────────────────────
function DistrictsPanel({ API }) {
  const [districts, setDistricts] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newForm, setNewForm] = useState({ name: "", population: "", latitude: "", longitude: "" })
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({})

  const load = async () => {
    setLoading(true)
    const res = await axios.get(`${API}/districts`)
    setDistricts(res.data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const addDistrict = async () => {
    if (!newForm.name) return
    await axios.post(`${API}/admin/districts`, newForm)
    setNewForm({ name: "", population: "", latitude: "", longitude: "" })
    setAdding(false); load()
  }
  const startEdit = (d) => { setEditId(d.id); setEditForm({ ...d }) }
  const saveEdit = async () => {
    await axios.put(`${API}/admin/districts/${editId}`, editForm)
    setEditId(null); load()
  }
  const remove = async (id) => {
    if (!confirm("Delete this district? Hospitals/patients linked to it may be affected.")) return
    await axios.delete(`${API}/admin/districts/${id}`)
    load()
  }

  return (
    <div style={panelStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Districts</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={btnGhost} onClick={load}><RefreshCw size={12} /> Refresh</button>
          <button style={btnPrimary} onClick={() => setAdding(a => !a)}><Plus size={14} /> Add District</button>
        </div>
      </div>

      {adding && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 18, padding: 14, background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
          <input style={inputSm} placeholder="Name" value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} />
          <input style={inputSm} type="number" placeholder="Population" value={newForm.population} onChange={e => setNewForm(f => ({ ...f, population: e.target.value }))} />
          <input style={inputSm} type="number" step="any" placeholder="Latitude" value={newForm.latitude} onChange={e => setNewForm(f => ({ ...f, latitude: e.target.value }))} />
          <input style={inputSm} type="number" step="any" placeholder="Longitude" value={newForm.longitude} onChange={e => setNewForm(f => ({ ...f, longitude: e.target.value }))} />
          <button style={{ ...btnPrimary, gridColumn: "1 / -1", justifyContent: "center" }} onClick={addDistrict}>Save District</button>
        </div>
      )}

      {loading ? <div style={{ color: "#8ba8c8" }}>Loading...</div> : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>
            <th style={th}>Name</th><th style={th}>Population</th><th style={th}>Lat</th><th style={th}>Lng</th><th style={th}></th>
          </tr></thead>
          <tbody>
            {districts.map(d => (
              <tr key={d.id}>
                {editId === d.id ? (
                  <>
                    <td style={td}><input style={inputSm} value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} /></td>
                    <td style={td}><input style={inputSm} type="number" value={editForm.population || ""} onChange={e => setEditForm(f => ({ ...f, population: e.target.value }))} /></td>
                    <td style={td}><input style={inputSm} type="number" step="any" value={editForm.latitude || ""} onChange={e => setEditForm(f => ({ ...f, latitude: e.target.value }))} /></td>
                    <td style={td}><input style={inputSm} type="number" step="any" value={editForm.longitude || ""} onChange={e => setEditForm(f => ({ ...f, longitude: e.target.value }))} /></td>
                    <td style={td}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button style={btnGhost} onClick={saveEdit}><Check size={12} /></button>
                        <button style={btnGhost} onClick={() => setEditId(null)}><X size={12} /></button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={td}>{d.name}</td>
                    <td style={td}>{d.population?.toLocaleString() || "—"}</td>
                    <td style={td}>{d.latitude ?? "—"}</td>
                    <td style={td}>{d.longitude ?? "—"}</td>
                    <td style={td}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button style={btnGhost} onClick={() => startEdit(d)}><Pencil size={12} /></button>
                        <button style={{ ...btnGhost, color: "#fca5a5", borderColor: "rgba(239,68,68,0.3)" }} onClick={() => remove(d.id)}><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ───────────────────────── Patients ─────────────────────────
function PatientsPanel({ API }) {
  const [patients, setPatients] = useState([])
  const [districts, setDistricts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [search, setSearch] = useState("")

  const load = async () => {
    setLoading(true)
    const [pRes, dRes] = await Promise.all([
      axios.get(`${API}/admin/patients`),
      axios.get(`${API}/districts`),
    ])
    setPatients(pRes.data || []); setDistricts(dRes.data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const startEdit = (p) => { setEditId(p.uid); setEditForm({ ...p, district_id: p.district_id || "" }) }
  const saveEdit = async () => {
    await axios.put(`${API}/admin/patients/${editId}`, editForm)
    setEditId(null); load()
  }
  const remove = async (uid) => {
    if (!confirm(`Delete patient ${uid}? This cannot be undone.`)) return
    await axios.delete(`${API}/admin/patients/${uid}`)
    load()
  }

  const filtered = patients.filter(p =>
    !search || p.full_name?.toLowerCase().includes(search.toLowerCase()) || p.uid?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={panelStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Patients</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input style={{ ...inputSm, width: 200 }} placeholder="Search name or ID..." value={search} onChange={e => setSearch(e.target.value)} />
          <button style={btnGhost} onClick={load}><RefreshCw size={12} /> Refresh</button>
        </div>
      </div>

      {loading ? <div style={{ color: "#8ba8c8" }}>Loading...</div> : (
        <div style={{ maxHeight: 480, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>
            <th style={th}>ID</th><th style={th}>Name</th><th style={th}>Age/Gender</th>
            <th style={th}>Blood</th><th style={th}>Mobile</th><th style={th}>District</th><th style={th}></th>
          </tr></thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.uid}>
                {editId === p.uid ? (
                  <>
                    <td style={td}>{p.uid}</td>
                    <td style={td}><input style={inputSm} value={editForm.full_name} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} /></td>
                    <td style={td}>
                      <input style={{ ...inputSm, width: 50, display: "inline-block" }} type="number" value={editForm.age} onChange={e => setEditForm(f => ({ ...f, age: e.target.value }))} />
                      <select style={{ ...inputSm, width: 80, display: "inline-block", marginLeft: 4 }} value={editForm.gender} onChange={e => setEditForm(f => ({ ...f, gender: e.target.value }))}>
                        <option>Male</option><option>Female</option><option>Other</option>
                      </select>
                    </td>
                    <td style={td}>
                      <select style={inputSm} value={editForm.blood_group || ""} onChange={e => setEditForm(f => ({ ...f, blood_group: e.target.value }))}>
                        {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(bg => <option key={bg}>{bg}</option>)}
                      </select>
                    </td>
                    <td style={td}><input style={inputSm} value={editForm.mobile} onChange={e => setEditForm(f => ({ ...f, mobile: e.target.value }))} /></td>
                    <td style={td}>
                      <select style={inputSm} value={editForm.district_id} onChange={e => setEditForm(f => ({ ...f, district_id: e.target.value }))}>
                        <option value="">—</option>
                        {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </td>
                    <td style={td}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button style={btnGhost} onClick={saveEdit}><Check size={12} /></button>
                        <button style={btnGhost} onClick={() => setEditId(null)}><X size={12} /></button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={td}>{p.uid}</td>
                    <td style={td}>{p.full_name}</td>
                    <td style={td}>{p.age} / {p.gender}</td>
                    <td style={td}>{p.blood_group || "—"}</td>
                    <td style={td}>{p.mobile}</td>
                    <td style={td}>{p.districts?.name || "—"}</td>
                    <td style={td}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button style={btnGhost} onClick={() => startEdit(p)}><Pencil size={12} /></button>
                        <button style={{ ...btnGhost, color: "#fca5a5", borderColor: "rgba(239,68,68,0.3)" }} onClick={() => remove(p.uid)}><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  )
}
