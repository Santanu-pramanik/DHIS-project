import { useEffect, useState } from "react"
import { Stethoscope, LogOut, CheckCircle2, Clock, Calendar, Building2 } from "lucide-react"
import axios from "axios"

const API = "https://dhis-backend.onrender.com"

export default function DoctorDashboard({ doctor, onLogout }) {
  const [attendance, setAttendance] = useState(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState("")
  const [todayAttendance, setTodayAttendance] = useState(null)

  useEffect(() => {
    checkTodayAttendance()
  }, [])

  const checkTodayAttendance = async () => {
    try {
      const res = await axios.get(`${API}/doctor/attendance/today/${doctor.id}`)
      if (res.data) setTodayAttendance(res.data)
    } catch {}
  }

  const markAttendance = async () => {
    setLoading(true)
    setMsg("")
    try {
      const res = await axios.post(`${API}/doctor/attendance`, {
        doctor_id: doctor.id,
        hospital_id: doctor.hospital_id,
      })
      if (res.data.success) {
        setTodayAttendance(res.data.attendance)
        setMsg("✅ Attendance marked successfully!")
      } else {
        setMsg("⚠️ " + res.data.message)
        setTodayAttendance(res.data.attendance)
      }
    } catch {
      setMsg("❌ Connection error. Please try again.")
    }
    setLoading(false)
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return ""
    const date = new Date(timestamp)
    return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
  }

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0d1526 0%, #1a2236 50%, #0d1f3c 100%)",
      fontFamily: "system-ui, sans-serif",
      padding: "40px 24px",
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      {/* Header */}
      <div style={{ width: "100%", maxWidth: 600, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #1D9E75, #378ADD)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Stethoscope size={20} color="#fff" />
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>DHIS</div>
            <div style={{ color: "#5b8fc9", fontSize: 10 }}>DOCTOR PORTAL</div>
          </div>
        </div>
        <button onClick={onLogout} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
          borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)",
          background: "rgba(239,68,68,0.1)", color: "#fca5a5", cursor: "pointer", fontSize: 13,
        }}>
          <LogOut size={14} /> Logout
        </button>
      </div>

      {/* Doctor Info Card */}
      <div style={{
        width: "100%", maxWidth: 600, background: "rgba(26,34,54,0.95)",
        border: "1px solid rgba(29,158,117,0.3)", borderRadius: 20,
        padding: "32px", marginBottom: 20,
        boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: "linear-gradient(135deg, #1D9E75, #378ADD)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, fontWeight: 800, color: "#fff",
          }}>
            {doctor.name?.charAt(3) || "D"}
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{doctor.name}</div>
            <div style={{ fontSize: 14, color: "#1D9E75", fontWeight: 600, marginTop: 2 }}>{doctor.specialization}</div>
            <div style={{ fontSize: 12, color: "#5b8fc9", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
              <Building2 size={12} /> ID: {doctor.unique_id}
            </div>
          </div>
        </div>

        {/* Date */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "12px 16px",
          background: "rgba(55,138,221,0.08)", borderRadius: 10, marginBottom: 24,
          border: "1px solid rgba(55,138,221,0.15)",
        }}>
          <Calendar size={16} color="#378ADD" />
          <span style={{ color: "#93c5fd", fontSize: 14 }}>{today}</span>
        </div>

        {/* Attendance Status */}
        {todayAttendance ? (
          <div style={{
            padding: "20px 24px", borderRadius: 14,
            background: "rgba(29,158,117,0.1)", border: "1px solid rgba(29,158,117,0.3)",
            display: "flex", alignItems: "center", gap: 16, marginBottom: 16,
          }}>
            <CheckCircle2 size={40} color="#1D9E75" />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#6ee7b7" }}>Attendance Marked ✅</div>
              <div style={{ fontSize: 13, color: "#5b8fc9", marginTop: 4, display: "flex", alignItems: "center", gap: 5 }}>
                <Clock size={13} /> Checked in at {formatTime(todayAttendance.marked_at)}
              </div>
              <div style={{ fontSize: 12, color: "#4b7a5e", marginTop: 2 }}>
                Status: <span style={{ color: "#1D9E75", fontWeight: 600, textTransform: "capitalize" }}>{todayAttendance.status}</span>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={markAttendance}
            disabled={loading}
            style={{
              width: "100%", padding: "16px", borderRadius: 12, border: "none",
              background: loading ? "rgba(29,158,117,0.4)" : "linear-gradient(135deg, #1D9E75, #378ADD)",
              color: "#fff", fontSize: 16, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              marginBottom: 16,
            }}
          >
            <CheckCircle2 size={20} />
            {loading ? "Marking..." : "Mark Today's Attendance"}
          </button>
        )}

        {msg && (
          <div style={{
            padding: "12px 16px", borderRadius: 10, fontSize: 14,
            background: msg.includes("✅") ? "rgba(29,158,117,0.1)" : "rgba(239,68,68,0.1)",
            color: msg.includes("✅") ? "#6ee7b7" : "#fca5a5",
            border: `1px solid ${msg.includes("✅") ? "rgba(29,158,117,0.3)" : "rgba(239,68,68,0.3)"}`,
          }}>
            {msg}
          </div>
        )}
      </div>
    </div>
  )
}