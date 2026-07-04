import { useState } from "react"
import { Building2, LogIn, Eye, EyeOff } from "lucide-react"
import axios from "axios"

const API = "https://dhis-backend.onrender.com"

export default function HospitalLogin({ onLoginSuccess, onBack }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Please enter both username and password")
      return
    }
    setLoading(true)
    setError("")
    try {
      const res = await axios.post(`${API}/hospital/login`, {
        username: username,
        password: password,
      })
      if (res.data.success) {
        onLoginSuccess(res.data.hospital)
      } else {
        setError(res.data.message)
      }
    } catch {
      setError("Connection error. Please try again.")
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0d1526 0%, #1a2236 50%, #0d1f3c 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{
        background: "rgba(26,34,54,0.95)",
        border: "1px solid rgba(55,138,221,0.3)",
        borderRadius: 20, padding: "48px 40px", width: 400,
        boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
      }}>
        {/* Icon */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, margin: "0 auto 16px",
            background: "linear-gradient(135deg, #378ADD, #1D9E75)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Building2 size={36} color="#fff" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>Hospital Login</div>
          <div style={{ fontSize: 13, color: "#5b8fc9", marginTop: 6 }}>
            DHIS — District Health Intelligence System
          </div>
        </div>

        {/* Form */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: "#8ba8c8", fontWeight: 600, display: "block", marginBottom: 8 }}>
            HOSPITAL USERNAME
          </label>
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="e.g. chinsurah_dh"
            style={{
              width: "100%", padding: "12px 16px", borderRadius: 10,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(55,138,221,0.3)",
              color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, color: "#8ba8c8", fontWeight: 600, display: "block", marginBottom: 8 }}>
            PASSWORD
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="Enter your password"
              style={{
                width: "100%", padding: "12px 44px 12px 16px", borderRadius: 10,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(55,138,221,0.3)",
                color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box",
              }}
            />
            <button onClick={() => setShowPass(!showPass)} style={{
              position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", color: "#5b8fc9",
            }}>
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 8, padding: "10px 14px", marginBottom: 16,
            color: "#fca5a5", fontSize: 13,
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%", padding: "14px", borderRadius: 12, border: "none",
            background: loading ? "rgba(55,138,221,0.4)" : "linear-gradient(135deg, #378ADD, #1D9E75)",
            color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <LogIn size={18} />
          {loading ? "Logging in..." : "Login"}
        </button>

        <button onClick={onBack} style={{
          width: "100%", marginTop: 12, padding: "12px", borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.1)", background: "transparent",
          color: "#8ba8c8", fontSize: 14, cursor: "pointer",
        }}>
          ← Back to Home
        </button>
      </div>
    </div>
  )
}
