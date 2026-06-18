import { useState } from "react"
import axios from "axios"
import { Stethoscope, AlertCircle, Lock, IdCard } from "lucide-react"

const API = "https://dhis-backend.onrender.com"

export default function DoctorLogin({ onLoginSuccess }) {
  const [uniqueId, setUniqueId] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!uniqueId.trim() || !password.trim()) {
      setError("Please enter both ID and password.")
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await axios.post(`${API}/doctor/login`, {
        unique_id: uniqueId.trim(),
        password
      })
      onLoginSuccess(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid ID or password.")
    }
    setLoading(false)
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "48px 56px", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", minWidth: 360, maxWidth: 400, textAlign: "center" }}>
        <Stethoscope size={48} color="#1D9E75" style={{ marginBottom: 12 }} />
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Doctor Login</div>
        <div style={{ fontSize: 13, color: "#888", marginBottom: 28 }}>
          Mark today's attendance with your doctor ID
        </div>

        <div style={{ textAlign: "left", marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: "#666", fontWeight: 600, display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
            <IdCard size={13} /> Doctor ID
          </label>
          <input
            type="text"
            placeholder="e.g. SSKM_AmitRoy"
            value={uniqueId}
            onChange={e => { setUniqueId(e.target.value); setError("") }}
            style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1.5px solid #ddd", fontSize: 15, outline: "none", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ textAlign: "left", marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: "#666", fontWeight: 600, display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
            <Lock size={13} /> Password
          </label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError("") }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1.5px solid #ddd", fontSize: 15, outline: "none", boxSizing: "border-box" }}
          />
        </div>

        {error && (
          <div style={{ color: "#e24b4a", fontSize: 13, marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ width: "100%", padding: "12px 0", borderRadius: 10, background: "#1D9E75", color: "#fff", border: "none", fontSize: 16, fontWeight: 700, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1, marginTop: 4 }}
        >
          {loading ? "Checking..." : "Login"}
        </button>
      </div>
    </div>
  )
}
