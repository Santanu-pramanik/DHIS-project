import { useState } from "react";
import axios from "axios";
import { ArrowLeft, Phone, Shield, User, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from "lucide-react";

const API = "https://dhis-backend.onrender.com";

const DISTRICTS = [
  "Darjeeling","Alipurduar","Cooch Behar","Jalpaiguri","Malda",
  "Murshidabad","Birbhum","Bardhaman","Nadia","Purulia","Bankura",
  "Hooghly","North 24 Parganas","Kolkata","Howrah",
  "West Midnapore","East Midnapore","South 24 Parganas"
];

const BLOOD_GROUPS = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];

export default function PatientRegister({ onBack }) {
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["","","","","",""]);
  const [patient, setPatient] = useState(null);
  const [form, setForm] = useState({
    name: "", age: "", gender: "Male",
    district: "", blood_group: "O+",
    aadhar: "", address: ""
  });
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [isRegistered, setIsRegistered] = useState(false);
  const [savedOtp, setSavedOtp] = useState("");

  const showMsg = (text, type = "error") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 4000);
  };

  const startResendTimer = () => {
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer(t => {
        if (t <= 1) { clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      showMsg("Please enter a valid 10-digit mobile number.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/patient/send-otp`, { mobile: phone });
      if (!res.data.success) {
        showMsg(res.data.message);
        setLoading(false);
        return;
      }
      setIsRegistered(res.data.is_registered);
      setStep("otp");
      startResendTimer();
      showMsg("OTP sent successfully!", "success");
    } catch (e) {
      showMsg(e.response?.data?.detail || "Failed to send OTP. Please try again.");
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    const otpStr = otp.join("");
    if (otpStr.length !== 6) { showMsg("Please enter the 6-digit OTP."); return; }
    setLoading(true);
    try {
      if (isRegistered) {
        const res = await axios.post(`${API}/patient/login`, { mobile: phone, otp: otpStr });
        if (!res.data.success) { showMsg(res.data.message); setLoading(false); return; }
        setPatient(res.data.patient);
        setStep("dashboard");
      } else {
        setSavedOtp(otpStr);
        setStep("details");
      }
    } catch (e) {
      showMsg(e.response?.data?.message || "Invalid OTP. Please try again.");
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!form.name.trim()) { showMsg("Please enter your full name."); return; }
    if (!form.age || form.age < 1 || form.age > 120) { showMsg("Please enter a valid age."); return; }
    if (!form.aadhar || form.aadhar.length !== 4) { showMsg("Please enter last 4 digits of Aadhaar."); return; }
    if (!form.address.trim()) { showMsg("Please enter your address."); return; }
    if (!form.district) { showMsg("Please select your district."); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/patient/register`, {
        mobile: phone,
        otp: savedOtp,
        full_name: form.name,
        aadhar_last4: form.aadhar,
        age: parseInt(form.age),
        gender: form.gender,
        address: form.address,
        district_name: form.district,
        blood_group: form.blood_group,
      });
      if (!res.data.success) { showMsg(res.data.message); setLoading(false); return; }
      setPatient(res.data.patient);
      setStep("dashboard");
      showMsg("Registration successful!", "success");
    } catch (e) {
      showMsg(e.response?.data?.message || "Registration failed. Please try again.");
    }
    setLoading(false);
  };

  const handleOtpInput = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const cardStyle = {
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 20,
    padding: "36px 40px",
    width: "100%",
    maxWidth: 440,
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
    color: "#8ba8c8",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 0.5,
    display: "block",
    marginBottom: 6,
  };

  const primaryBtn = {
    width: "100%",
    padding: "13px 0",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(135deg, #378ADD, #1D9E75)",
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    cursor: loading ? "not-allowed" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    opacity: loading ? 0.7 : 1,
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0d1526 0%, #1a2236 50%, #0d1f3c 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      fontFamily: "system-ui, sans-serif",
      position: "relative",
    }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(55,138,221,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(55,138,221,0.04) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />

      <button onClick={onBack} style={{ position: "fixed", top: 24, left: 24, display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "#8ba8c8", cursor: "pointer", fontSize: 13, fontWeight: 600, zIndex: 10 }}>
        <ArrowLeft size={14} /> Home
      </button>

      {/* Progress dots */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28, zIndex: 1 }}>
        {["phone","otp","details","dashboard"].map((s, i) => (
          <div key={s} style={{ width: step === s ? 24 : 8, height: 8, borderRadius: 4, background: ["phone","otp","details","dashboard"].indexOf(step) >= i ? "#378ADD" : "rgba(255,255,255,0.15)", transition: "all 0.3s" }} />
        ))}
      </div>

      {/* ── STEP: PHONE ── */}
      {step === "phone" && (
        <div style={{ ...cardStyle, zIndex: 1 }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #378ADD, #1D9E75)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(55,138,221,0.15)", border: "1px solid rgba(55,138,221,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Phone size={22} color="#378ADD" />
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>Patient Portal</div>
              <div style={{ color: "#5b8fc9", fontSize: 12 }}>DHIS — West Bengal</div>
            </div>
          </div>

          <p style={{ color: "#8ba8c8", fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
            Enter your mobile number. New users will be registered, existing users will be logged in directly.
          </p>

          <label style={labelStyle}>MOBILE NUMBER</label>
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <div style={{ padding: "11px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "#8ba8c8", fontSize: 14, whiteSpace: "nowrap" }}>🇮🇳 +91</div>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              onKeyDown={e => e.key === "Enter" && handleSendOtp()}
              placeholder="9876543210"
              style={{ ...inputStyle, flex: 1 }}
              maxLength={10}
            />
          </div>

          <button onClick={handleSendOtp} disabled={loading} style={primaryBtn}>
            {loading
              ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              : <><ArrowRight size={16} /> Send OTP</>}
          </button>

          {msg.text && (
            <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 10, background: msg.type === "success" ? "rgba(29,158,117,0.15)" : "rgba(226,75,74,0.15)", border: `1px solid ${msg.type === "success" ? "rgba(29,158,117,0.3)" : "rgba(226,75,74,0.3)"}`, color: msg.type === "success" ? "#6ee7b7" : "#fca5a5", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
              {msg.type === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />} {msg.text}
            </div>
          )}
        </div>
      )}

      {/* ── STEP: OTP ── */}
      {step === "otp" && (
        <div style={{ ...cardStyle, zIndex: 1 }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #378ADD, #1D9E75)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(55,138,221,0.15)", border: "1px solid rgba(55,138,221,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={22} color="#378ADD" />
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>OTP Verification</div>
              <div style={{ color: "#5b8fc9", fontSize: 12 }}>+91 {phone}</div>
            </div>
          </div>

          <p style={{ color: "#8ba8c8", fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
            A 6-digit OTP has been sent to +91 {phone}. Please enter it below.
          </p>

          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 24 }}>
            {otp.map((digit, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                value={digit}
                onChange={e => handleOtpInput(i, e.target.value)}
                onKeyDown={e => handleOtpKeyDown(i, e)}
                maxLength={1}
                style={{
                  width: 46, height: 54, textAlign: "center",
                  fontSize: 22, fontWeight: 700, borderRadius: 12,
                  border: digit ? "1.5px solid #378ADD" : "1px solid rgba(255,255,255,0.15)",
                  background: digit ? "rgba(55,138,221,0.12)" : "rgba(255,255,255,0.06)",
                  color: "#fff", outline: "none",
                }}
              />
            ))}
          </div>

          <button onClick={handleVerifyOtp} disabled={loading} style={{ ...primaryBtn, marginBottom: 14 }}>
            {loading
              ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              : <><Shield size={15} /> Verify OTP</>}
          </button>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button onClick={() => setStep("phone")} style={{ background: "none", border: "none", color: "#5b8fc9", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              <ArrowLeft size={13} /> Change Number
            </button>
            <button
              onClick={() => { setOtp(["","","","","",""]); handleSendOtp(); }}
              disabled={resendTimer > 0}
              style={{ background: "none", border: "none", color: resendTimer > 0 ? "#5b8fc9" : "#378ADD", fontSize: 13, cursor: resendTimer > 0 ? "default" : "pointer" }}>
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
            </button>
          </div>

          {msg.text && (
            <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 10, background: msg.type === "success" ? "rgba(29,158,117,0.15)" : "rgba(226,75,74,0.15)", border: `1px solid ${msg.type === "success" ? "rgba(29,158,117,0.3)" : "rgba(226,75,74,0.3)"}`, color: msg.type === "success" ? "#6ee7b7" : "#fca5a5", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
              {msg.type === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />} {msg.text}
            </div>
          )}
        </div>
      )}

      {/* ── STEP: DETAILS ── */}
      {step === "details" && (
        <div style={{ ...cardStyle, maxWidth: 500, zIndex: 1 }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #378ADD, #1D9E75)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <User size={22} color="#a78bfa" />
            </div>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>Complete Your Profile</div>
              <div style={{ color: "#5b8fc9", fontSize: 12 }}>New Patient Registration</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
            <div>
              <label style={labelStyle}>FULL NAME *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter your full name" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>AADHAAR LAST 4 DIGITS *</label>
              <input
                type="text"
                maxLength={4}
                value={form.aadhar}
                onChange={e => setForm({ ...form, aadhar: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                placeholder="e.g. 3456"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>ADDRESS *</label>
              <input
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                placeholder="Village / Ward / Street, District"
                style={inputStyle}
              />
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
                <label style={labelStyle}>DISTRICT</label>
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
          </div>

          <button onClick={handleRegister} disabled={loading} style={primaryBtn}>
            {loading
              ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              : <><CheckCircle2 size={15} /> Complete Registration</>}
          </button>

          {msg.text && (
            <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 10, background: msg.type === "success" ? "rgba(29,158,117,0.15)" : "rgba(226,75,74,0.15)", border: `1px solid ${msg.type === "success" ? "rgba(29,158,117,0.3)" : "rgba(226,75,74,0.3)"}`, color: msg.type === "success" ? "#6ee7b7" : "#fca5a5", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
              {msg.type === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />} {msg.text}
            </div>
          )}
        </div>
      )}

      {/* ── STEP: DASHBOARD ── */}
      {step === "dashboard" && patient && (
        <div style={{ ...cardStyle, maxWidth: 480, zIndex: 1 }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #378ADD, #1D9E75)" }} />

          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, rgba(55,138,221,0.3), rgba(29,158,117,0.3))", border: "2px solid rgba(55,138,221,0.4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 26, fontWeight: 700, color: "#fff" }}>
              {patient.full_name?.[0]?.toUpperCase() || "P"}
            </div>
            <div style={{ color: "#6ee7b7", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>✓ Logged In Successfully</div>
            <div style={{ color: "#fff", fontSize: 20, fontWeight: 700 }}>Welcome, {patient.full_name}!</div>
            <div style={{ color: "#5b8fc9", fontSize: 12, marginTop: 4 }}>Patient ID: {patient.uid}</div>
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
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        select option { background: #1a2236; color: #fff; }
        input::placeholder { color: rgba(255,255,255,0.25); }
        input:focus, select:focus { border-color: rgba(55,138,221,0.5) !important; box-shadow: 0 0 0 3px rgba(55,138,221,0.1); }
      `}</style>
    </div>
  );
}