import { useState } from "react"
import axios from "axios"
import { KeyRound, CheckCircle2, AlertCircle } from "lucide-react"

export default function AdminChangePassword({ API }) {
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [msg, setMsg] = useState({ text: "", type: "" })
  const [submitting, setSubmitting] = useState(false)

  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: 8, boxSizing: "border-box",
    border: "1.5px solid #e5e7eb", fontSize: 14, marginTop: 6,
  }

  const handleSubmit = async () => {
    setMsg({ text: "", type: "" })
    if (!oldPassword || !newPassword || !confirmPassword) {
      setMsg({ text: "Please fill in all fields.", type: "error" }); return
    }
    if (newPassword !== confirmPassword) {
      setMsg({ text: "New passwords do not match.", type: "error" }); return
    }
    setSubmitting(true)
    try {
      const res = await axios.post(`${API}/admin/change-password`, {
        old_password: oldPassword, new_password: newPassword,
      })
      if (res.data.success) {
        setMsg({ text: "Password updated successfully.", type: "success" })
        setOldPassword(""); setNewPassword(""); setConfirmPassword("")
      } else {
        setMsg({ text: res.data.message || "Could not update password.", type: "error" })
      }
    } catch {
      setMsg({ text: "Could not reach the server. Please try again.", type: "error" })
    }
    setSubmitting(false)
  }

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)", borderRadius: 16, padding: "28px 32px",
      border: "1px solid rgba(255,255,255,0.25)", maxWidth: 420,
    }}>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: "#ffffff", display: "flex", alignItems: "center", gap: 8 }}>
        <KeyRound size={18} color="#378ADD" /> Change Admin Password
      </div>

      <label style={{ fontSize: 12, color: "#8ba8c8", fontWeight: 600 }}>Current Password</label>
      <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} style={inputStyle} />

      <label style={{ fontSize: 12, color: "#8ba8c8", fontWeight: 600, display: "block", marginTop: 16 }}>New Password</label>
      <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} />

      <label style={{ fontSize: 12, color: "#8ba8c8", fontWeight: 600, display: "block", marginTop: 16 }}>Confirm New Password</label>
      <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} />

      {msg.text && (
        <div style={{
          marginTop: 16, padding: "10px 14px", borderRadius: 8, fontSize: 13,
          display: "flex", alignItems: "center", gap: 8,
          background: msg.type === "success" ? "rgba(29,158,117,0.15)" : "rgba(239,68,68,0.1)",
          color: msg.type === "success" ? "#6ee7b7" : "#fca5a5",
          border: `1px solid ${msg.type === "success" ? "rgba(29,158,117,0.4)" : "rgba(239,68,68,0.3)"}`,
        }}>
          {msg.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {msg.text}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        style={{
          marginTop: 20, width: "100%", padding: "12px", borderRadius: 10, border: "none",
          background: "linear-gradient(135deg, #378ADD, #1D9E75)", color: "#fff",
          fontSize: 14, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer",
        }}
      >
        {submitting ? "Updating..." : "Update Password"}
      </button>
    </div>
  )
}
