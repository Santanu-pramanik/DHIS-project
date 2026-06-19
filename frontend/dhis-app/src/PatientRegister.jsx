import { useState } from "react";
import axios from "axios";
import { ArrowLeft, Phone, User, CheckCircle2, AlertCircle, ArrowRight, Loader2, Lock, Eye, EyeOff } from "lucide-react";

const API = "https://dhis-backend.onrender.com";

const DISTRICTS = [
  "Darjeeling","Alipurduar","Cooch Behar","Jalpaiguri","Malda",
  "Murshidabad","Birbhum","Bardhaman","Nadia","Purulia","Bankura",
  "Hooghly","North 24 Parganas","Kolkata","Howrah",
  "West Midnapore","East Midnapore","South 24 Parganas"
];

const BLOOD_GROUPS = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];

export default function PatientRegister({ onBack }) {
  const [mode, setMode] = useState("choice"); // choice → register / login
  const [step, setStep] = useState("form");   // form → dashboard
  const [patient, setPatient] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

  const [form, setForm] = useState({
    full_name: "", aadhar: "", age: "", gender: "Male",
    district: "", blood_group: "O+", mobile: "", 
    address: "", password: "", confirm_password: ""
  });

  const [loginForm, setLoginForm] = useState({ uid: "", password: "" });

  const showMsg = (text, type = "error") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 4000);
  };

  const handleRegister = async () => {
    if (!form.full_name.trim()) { showMsg("Please enter your full name."); return; }
    if (!form.mobile || !/^[6-9]\d{9}$/.test(form.mobile)) { showMsg("Enter a valid 10-digit mobile number."); return; }
    if (!form.aadhar || form.aadhar.length !== 4) { showMsg("Enter last 4 digits of Aadhaar."); return; }
    if (!form.age || form.age < 1 || form.age > 120) { showMsg("Enter a valid age."); return; }
    if (!form.address.trim()) { showMsg("Please enter your address."); return; }
    if (!form.district) { showMsg("Please select your district."); return; }
    if (form.password.length < 6) { showMsg("Password must be at least 6 characters."); return; }
    if (form.password !== form.confirm_password) { showMsg("Passwords do not match."); return; }

    setLoading(true);
    try {
      const res = await axios.post(`${API}/patient/register`, {
        full_name: form.full_name,
        aadhar_last4: form.aadhar,
        age: parseInt(form.age),
        gender: form.gender,
        blood_group: form.blood_group,
        mobile: form.mobile,
        address: form.address,
        district_name: form.district,
        password: form.password,
      });
      if (!res.data.success) { showMsg(res.data.message); setLoading(false); return; }
      setPatient(res.data.patient);
      setStep("dashboard");
    } catch (e) {
      showMsg(e.response?.data?.message || "Registration failed.");
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    if (!loginForm.uid.trim()) { showMsg("Please enter your Patient ID."); return; }
    if (!loginForm.password) { showMsg("Please enter your password."); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/patient/login`, {
        uid: loginForm.uid,
        password: loginForm.password,
      });
      if (!res.data.success) { showMsg(res.data.message); setLoading(false); return; }
      setPatient(res.data.patient);
      setStep("dashboard");
    } catch (e) {
      showMsg(e.response?.data?.message || "Login failed.");
    }
    setLoading(false);
  };

  const cardStyle = {
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 20,
    padding: "36px 40px",
    width: "100%",
    maxWidth: 480,
    position: "relative",
    overflow: "hidden",
  };

  const inputStyle = {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    color: "#8ba8c8", fontSize: 11, fontWeight: 600,
    letterSpacing: 0.5, display: "block", marginBottom: 6,
  };

  const primaryBtn = {
    width: "100%", padding: "13px 0", borderRadius: 12,
    border: "none", background: "linear-gradient(135deg, #378ADD, #1D9E75)",
    color: "#fff", fontSize: 15, fontWeight: 700,
    cursor: loading ? "not-allowed" : "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 8, opacity: loading ? 0.7 : 1,
  };

  const wrap = (children) => (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0d1526 0%, #1a2236 50%, #0d1f3c 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: 24, fontFamily: "system-ui, sans-serif", position: "relative",
    }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(55,138,221,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(55,138,221,0.04) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />
      <button onClick={onBack} style={{ position: "fixed", top: 24, left: 24, display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "#8ba8c8", cursor: "pointer", fontSize: 13, fontWeight: 600, zIndex: 10 }}>
        <ArrowLeft size={14} /> Home
      </button>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #1a2236; color: #fff; }
        input::placeholder { color: rgba(255,255,255,0.25); }
        input:focus, select:focus { border-color: rgba(55,138,221,0.5) !important; box-shadow: 0 0 0 3px rgba(55,138,221,0.1); }
      `}</style>
      {children}
    </div>
  );

  const MsgBox = () => msg.text ? (
    <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 10, background: msg.type === "success" ? "rgba(29,158,117,0.15)" : "rgba(226,75,74,0.15)", border: `1px solid ${msg.type === "success" ? "rgba(29,158,117,0.3)" : "rgba(226,75,74,0.3)"}`, color: msg.type === "success" ? "#6ee7b7" : "#fca5a5", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
      {msg.type === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />} {msg.text}
    </div>
  ) : null;

  // ── CHOICE ──
  if (mode === "choice" && step === "form") return wrap(
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, zIndex: 1, width: "100%", maxWidth: 480 }}>
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 6 }}>Patient Portal</div>
        <div style={{ color: "#5b8fc9", fontSize: 13 }}>DHIS — West Bengal Health System</div>
      </div>

      <div onClick={() => setMode("register")} style={{ ...cardStyle, cursor: "pointer", display: "flex", alignItems: "center", gap: 16 }}
        onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(55,138,221,0.4)"}
        onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #378ADD, #1D9E75)" }} />
        <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(55,138,221,0.15)", border: "1px solid rgba(55,138,221,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <User size={22} color="#378ADD" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 16, marginBottom: 4 }}>New Patient Registration</div>
          <div style={{ color: "#8ba8c8", fontSize: 12 }}>Register for the first time with your details</div>
        </div>
        <ArrowRight size={18} color="#5b8fc9" />
      </div>

      <div onClick={() => setMode("login")} style={{ ...cardStyle, cursor: "pointer", display: "flex", alignItems: "center", gap: 16 }}
        onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(29,158,117,0.4)"}
        onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #1D9E75, #378ADD)" }} />
        <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(29,158,117,0.15)", border: "1px solid rgba(29,158,117,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Lock size={22} color="#1D9E75" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Existing Patient Login</div>
          <div style={{ color: "#8ba8c8", fontSize: 12 }}>Login with your Patient ID and password</div>
        </div>
        <ArrowRight size={18} color="#5b8fc9" />
      </div>
    </div>
  );

  // ── LOGIN ──
  if (mode === "login" && step === "form") return wrap(
    <div style={{ ...cardStyle, zIndex: 1 }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #1D9E75, #378ADD)" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(29,158,117,0.15)", border: "1px solid rgba(29,158,117,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Lock size={22} color="#1D9E75" />
        </div>
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>Patient Login</div>
          <div style={{ color: "#5b8fc9", fontSize: 12 }}>DHIS — West Bengal</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
        <div>
          <label style={labelStyle}>PATIENT ID</label>
          <input value={loginForm.uid} onChange={e => setLoginForm({ ...loginForm, uid: e.target.value.toUpperCase() })} placeholder="e.g. DHIS-482931" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>PASSWORD</label>
          <div style={{ position: "relative" }}>
            <input type={showPass ? "text" : "password"} value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="Enter your password" style={{ ...inputStyle, paddingRight: 44 }} />
            <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#5b8fc9", cursor: "pointer" }}>
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </div>

      <button onClick={handleLogin} disabled={loading} style={{ ...primaryBtn, marginBottom: 12 }}>
        {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <><Lock size={15} /> Login</>}
      </button>

      <button onClick={() => setMode("choice")} style={{ background: "none", border: "none", color: "#5b8fc9", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
        <ArrowLeft size={13} /> Back
      </button>

      <MsgBox />
    </div>
  );

  // ── REGISTER ──
  if (mode === "register" && step === "form") return wrap(
    <div style={{ ...cardStyle, maxWidth: 520, zIndex: 1 }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #378ADD, #1D9E75)" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(55,138,221,0.15)", border: "1px solid rgba(55,138,221,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <User size={22} color="#378ADD" />
        </div>
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>New Registration</div>
          <div style={{ color: "#5b8fc9", fontSize: 12 }}>Fill in your details below</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        <div>
          <label style={labelStyle}>FULL NAME *</label>
          <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Enter your full name" style={inputStyle} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>MOBILE NUMBER *</label>
            <input value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })} placeholder="9876543210" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>AADHAAR LAST 4 *</label>
            <input value={form.aadhar} onChange={e => setForm({ ...form, aadhar: e.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="e.g. 3456" style={inputStyle} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>AGE *</label>
            <input type="number" min={1} max={120} value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} placeholder="Age" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>GENDER</label>
            <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} style={inputStyle}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>DISTRICT *</label>
            <select value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} style={inputStyle}>
              <option value="" disabled>Select District</option>
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>BLOOD GROUP</label>
            <select value={form.blood_group} onChange={e => setForm({ ...form, blood_group: e.target.value })} style={inputStyle}>
              {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>ADDRESS *</label>
          <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Village / Ward / Street" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>PASSWORD * (min 6 characters)</label>
          <div style={{ position: "relative" }}>
            <input type={showPass ? "text" : "password"} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Create a password" style={{ ...inputStyle, paddingRight: 44 }} />
            <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#5b8fc9", cursor: "pointer" }}>
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <label style={labelStyle}>CONFIRM PASSWORD *</label>
          <input type="password" value={form.confirm_password} onChange={e => setForm({ ...form, confirm_password: e.target.value })} placeholder="Re-enter password" style={inputStyle} />
        </div>
      </div>

      <button onClick={handleRegister} disabled={loading} style={{ ...primaryBtn, marginBottom: 12 }}>
        {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <><CheckCircle2 size={15} /> Complete Registration</>}
      </button>

      <button onClick={() => setMode("choice")} style={{ background: "none", border: "none", color: "#5b8fc9", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
        <ArrowLeft size={13} /> Back
      </button>

      <MsgBox />
    </div>
  );

  // ── DASHBOARD ──
  if (step === "dashboard" && patient) return wrap(
    <div style={{ ...cardStyle, maxWidth: 480, zIndex: 1 }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #378ADD, #1D9E75)" }} />

      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, rgba(55,138,221,0.3), rgba(29,158,117,0.3))", border: "2px solid rgba(55,138,221,0.4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 26, fontWeight: 700, color: "#fff" }}>
          {patient.full_name?.[0]?.toUpperCase() || "P"}
        </div>
        <div style={{ color: "#6ee7b7", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>✓ {mode === "login" ? "Logged In" : "Registered"} Successfully</div>
        <div style={{ color: "#fff", fontSize: 20, fontWeight: 700 }}>Welcome, {patient.full_name}!</div>
        <div style={{ marginTop: 8, padding: "6px 14px", borderRadius: 20, background: "rgba(55,138,221,0.15)", border: "1px solid rgba(55,138,221,0.3)", display: "inline-block" }}>
          <span style={{ color: "#8ba8c8", fontSize: 11 }}>Patient ID: </span>
          <span style={{ color: "#93c5fd", fontWeight: 700, fontSize: 13 }}>{patient.uid}</span>
        </div>
        <div style={{ color: "#ef4444", fontSize: 11, marginTop: 6 }}>⚠ Save this ID — you need it to login</div>
      </div>

      <div style={{ height: 1, background: "rgba(255,255,255,0.08)", marginBottom: 20 }} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[
          ["Age", `${patient.age} yrs`, "#378ADD"],
          ["Gender", patient.gender, "#1D9E75"],
          ["District", patient.districts?.name || "—", "#a78bfa"],
          ["Blood Group", patient.blood_group || "—", "#f472b6"],
        ].map(([label, value, color]) => (
          <div key={label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ color: "#8ba8c8", fontSize: 10, fontWeight: 600, letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
            <div style={{ color, fontSize: 14, fontWeight: 700 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 16px", borderRadius: 12, background: "rgba(29,158,117,0.1)", border: "1px solid rgba(29,158,117,0.25)", marginBottom: 20 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1D9E75" }} />
        <span style={{ color: "#6ee7b7", fontSize: 13, fontWeight: 600 }}>Active Patient — Registered in DHIS</span>
      </div>

      <button onClick={onBack} style={primaryBtn}>
        <ArrowLeft size={15} /> Return to Home
      </button>
    </div>
  );

  return null;
}