import { useState, useEffect } from "react"
import axios from "axios"
import { Stethoscope, CheckCircle2, XCircle, Clock, LogOut, Building2, Calendar } from "lucide-react"

const API = "https://dhis-backend.onrender.com"

export default function DoctorDashboard({ doctor, onLogout }) {
  const [status, setStatus] = useState("pending")
  const [markedAt, setMarkedAt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const today = new Date()
  const dateStr = today.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })

  useEffect(() => {
    axios.get(`${API}/doctor/${doctor.id}/attendance/today`)
      .then(r => { setStatus(r.data.status); setMarkedAt(r.data.marked_at); setLoading(false) })
      .catch(() => setLoading(false))
  }, [doctor.id])

  const mark = async (newStatus) => {
    setSubmitting(true)
    try {
      const res = await axios.post(`${API}/doctor/${doctor.id}/attendance/mark`, { status: newStatus })
      setStatus(res.data.status)
      setMarkedAt(res.data.marked_at)
    } catch {
      // silently ignore, button stays in previous state
    }
    setSubmitting(false)
  }

  const statusColor = status === "present" ? "#1D9E75" : status === "absent" ? "#e24b4a" : "#EF9F27"
  const statusBg = status === "present" ? "#f0fdf4" : status === "absent" ? "#fef2f2" : "#FFF7ED"

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "40px 48px", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", minWidth: 360, maxWidth: 440 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, #378ADD, #1D9E75)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Stethoscope size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "#1a2236" }}>{doctor.name}</div>
              <div style={{ fontSize: 12, color: "#888" }}>{doctor.specialization}</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Logout"
            style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: 8, cursor: "pointer", color: "#666" }}
          >
            <LogOut size={16} />
          </button>
        </div>

        <div style={{ fontSize: 13, color: "#666", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <Building2 size={14} /> {doctor.hospital_name}
        </div>
        <div style={{ fontSize: 13, color: "#666", display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
          <Calendar size={14} /> {dateStr}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 24, color: "#888" }}>Loading today's status...</div>
        ) : (
          <>
            <div style={{ background: statusBg, borderRadius: 12, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: statusColor, fontWeight: 700, fontSize: 15 }}>
                {status === "present" ? <CheckCircle2 size={18} /> : status === "absent" ? <XCircle size={18} /> : <Clock size={18} />}
                {status === "present" ? "Marked Present" : status === "absent" ? "Marked Absent" : "Not Marked Yet"}
              </div>
              {markedAt && (
                <div style={{ fontSize: 11, color: "#999" }}>
                  {new Date(markedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                </div>
              )}
            </div>

            <div style={{ fontSize: 13, color: "#555", marginBottom: 12, fontWeight: 600 }}>
              Are you attending {doctor.hospital_name} today?
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => mark("present")}
                disabled={submitting}
                style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: status === "present" ? "none" : "1.5px solid #1D9E75", background: status === "present" ? "#1D9E75" : "#fff", color: status === "present" ? "#fff" : "#1D9E75", fontWeight: 700, fontSize: 14, cursor: submitting ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <CheckCircle2 size={16} /> Present
              </button>
              <button
                onClick={() => mark("absent")}
                disabled={submitting}
                style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: status === "absent" ? "none" : "1.5px solid #e24b4a", background: status === "absent" ? "#e24b4a" : "#fff", color: status === "absent" ? "#fff" : "#e24b4a", fontWeight: 700, fontSize: 14, cursor: submitting ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <XCircle size={16} /> Absent
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
