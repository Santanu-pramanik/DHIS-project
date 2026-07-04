import { useState } from "react";
import axios from "axios";
import { Building2, LogOut, Search, Printer, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";

const API = "https://dhis-backend.onrender.com";

export default function HospitalDashboard({ hospital, onLogout }) {
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [appointment, setAppointment] = useState(null);
  const [patient, setPatient] = useState(null);

  const [doctorName, setDoctorName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [prescription, setPrescription] = useState(null); // final printable data

  const resetSearch = () => {
    setCode(""); setAppointment(null); setPatient(null);
    setVerifyError(""); setDoctorName(""); setPrescription(null);
  };

  const handleVerify = async () => {
    if (!code.trim()) { setVerifyError("Please enter the appointment code."); return; }
    setVerifying(true); setVerifyError("");
    try {
      const res = await axios.get(`${API}/appointment/verify/${code.trim().toUpperCase()}`, {
        params: { hospital_id: hospital.id },
      });
      if (!res.data.success) {
        setVerifyError(res.data.message || "Invalid code.");
        setAppointment(null); setPatient(null);
      } else {
        setAppointment(res.data.appointment);
        setPatient(res.data.patient);
        setDoctorName(res.data.appointment.doctor_name || "");
      }
    } catch (e) {
      setVerifyError(e.response?.data?.message || "Could not verify code. Please try again.");
    }
    setVerifying(false);
  };

  const handleGeneratePrescription = async () => {
    if (!doctorName.trim()) { setVerifyError("Please enter the doctor's name."); return; }
    setGenerating(true); setVerifyError("");
    try {
      const res = await axios.post(`${API}/appointment/${appointment.appointment_code}/complete`, {
        hospital_id: hospital.id,
        doctor_name: doctorName.trim(),
      });
      if (!res.data.success) {
        setVerifyError(res.data.message || "Could not generate prescription.");
      } else {
        setPrescription({
          appointment: res.data.appointment,
          patient: res.data.patient,
          hospital: res.data.hospital,
        });
      }
    } catch (e) {
      setVerifyError(e.response?.data?.message || "Could not generate prescription.");
    }
    setGenerating(false);
  };

  const wrapStyle = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0d1526 0%, #1a2236 50%, #0d1f3c 100%)",
    fontFamily: "system-ui, sans-serif",
    padding: "30px 20px",
  };

  const cardStyle = {
    maxWidth: 640, margin: "0 auto",
    background: "rgba(26,34,54,0.95)",
    border: "1px solid rgba(55,138,221,0.3)",
    borderRadius: 20, padding: "30px 28px",
  };

  const labelStyle = { fontSize: 12, color: "#8ba8c8", fontWeight: 600, display: "block", marginBottom: 8 };
  const inputStyle = {
    width: "100%", padding: "12px 16px", borderRadius: 10, boxSizing: "border-box",
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(55,138,221,0.3)",
    color: "#fff", fontSize: 14, outline: "none",
  };
  const primaryBtn = {
    width: "100%", padding: "13px", borderRadius: 12, border: "none",
    background: "linear-gradient(135deg, #378ADD, #1D9E75)",
    color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
  };

  // ── PRINTABLE PRESCRIPTION VIEW ──
  if (prescription) {
    const { appointment: apt, patient: pat, hospital: hosp } = prescription;
    const today = new Date().toLocaleDateString("en-GB");
    return (
      <div style={{ minHeight: "100vh", background: "#0d1526" }}>
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #rx-print, #rx-print * { visibility: visible; }
            #rx-print { position: absolute; top: 0; left: 0; width: 100%; }
            #rx-noprint { display: none !important; }
          }
        `}</style>

        <div id="rx-noprint" style={{ maxWidth: 640, margin: "20px auto", display: "flex", gap: 10 }}>
          <button onClick={() => window.print()} style={{ ...primaryBtn, flex: 1 }}>
            <Printer size={16} /> Print Prescription
          </button>
          <button onClick={resetSearch} style={{ ...primaryBtn, flex: 1, background: "rgba(255,255,255,0.08)" }}>
            <ArrowLeft size={16} /> New Patient
          </button>
        </div>

        <div id="rx-print" style={{
          maxWidth: 640, margin: "0 auto 40px", background: "#fff", color: "#111",
          padding: "40px 44px", borderRadius: 8, fontFamily: "Georgia, serif",
        }}>
          <div style={{ textAlign: "center", borderBottom: "3px double #333", paddingBottom: 14, marginBottom: 20 }}>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 0.5 }}>{hosp.hospital_name}</div>
            <div style={{ fontSize: 13, color: "#444", marginTop: 4 }}>{hosp.address || ""}</div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 20 }}>
            <div><strong>Doctor:</strong> {apt.verified_doctor_name}</div>
            <div><strong>Date:</strong> {today}</div>
          </div>

          <div style={{
            display: "grid", gridTemplateColumns: "140px 12px 1fr", rowGap: 8,
            fontSize: 14, marginBottom: 20, background: "#f7f7f7", padding: "14px 18px", borderRadius: 6,
          }}>
            <strong>Patient Name</strong><span>:</span><span>{pat.full_name}</span>
            <strong>Age / Gender</strong><span>:</span><span>{pat.age} / {pat.gender}</span>
            <strong>Patient ID</strong><span>:</span><span>{pat.uid}</span>
            <strong>Blood Group</strong><span>:</span><span>{pat.blood_group || "—"}</span>
            <strong>Department</strong><span>:</span><span>{apt.department}</span>
            <strong>Appointment Code</strong><span>:</span><span>{apt.appointment_code}</span>
          </div>

          <div style={{ fontSize: 22, fontWeight: 700, color: "#378ADD", marginBottom: 10 }}>℞</div>
          <div style={{ minHeight: 260, borderBottom: "1px solid #ccc" }} />

          <div style={{ marginTop: 30, textAlign: "right", fontSize: 13 }}>
            <div style={{ borderTop: "1px solid #333", display: "inline-block", paddingTop: 6, minWidth: 180 }}>
              Doctor's Signature
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── HOSPITAL DASHBOARD (code verify) ──
  return (
    <div style={wrapStyle}>
      <div style={{ maxWidth: 640, margin: "0 auto 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#fff" }}>
          <Building2 size={22} color="#378ADD" />
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{hospital.hospital_name}</div>
            <div style={{ fontSize: 12, color: "#8ba8c8" }}>Hospital Dashboard</div>
          </div>
        </div>
        <button onClick={onLogout} style={{
          background: "none", border: "1px solid rgba(255,255,255,0.15)", color: "#8ba8c8",
          borderRadius: 8, padding: "8px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
        }}>
          <LogOut size={14} /> Logout
        </button>
      </div>

      <div style={cardStyle}>
        <h3 style={{ color: "#fff", marginTop: 0 }}>🔎 Verify Appointment Code</h3>
        <label style={labelStyle}>APPOINTMENT CODE</label>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && handleVerify()}
            placeholder="e.g. A1B2C3"
            style={{ ...inputStyle, letterSpacing: 3, fontWeight: 700 }}
          />
          <button onClick={handleVerify} disabled={verifying} style={{ ...primaryBtn, width: "auto", padding: "0 20px" }}>
            <Search size={16} /> {verifying ? "..." : "Verify"}
          </button>
        </div>

        {verifyError && (
          <div style={{
            marginTop: 14, padding: "10px 14px", borderRadius: 8,
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            color: "#fca5a5", fontSize: 13, display: "flex", alignItems: "center", gap: 8,
          }}>
            <AlertCircle size={16} /> {verifyError}
          </div>
        )}

        {patient && appointment && (
          <div style={{ marginTop: 24 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8, color: "#6ee7b7",
              fontSize: 13, fontWeight: 700, marginBottom: 12,
            }}>
              <CheckCircle2 size={16} /> Code verified
            </div>

            <div style={{
              display: "grid", gridTemplateColumns: "130px 12px 1fr", rowGap: 10,
              fontSize: 14, color: "#fff", background: "rgba(255,255,255,0.04)",
              padding: "16px 18px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)",
            }}>
              <strong>Patient</strong><span>:</span><span>{patient.full_name}</span>
              <strong>Age / Gender</strong><span>:</span><span>{patient.age} / {patient.gender}</span>
              <strong>Blood Group</strong><span>:</span><span>{patient.blood_group || "—"}</span>
              <strong>Department</strong><span>:</span><span>{appointment.department}</span>
              <strong>Booked Doctor</strong><span>:</span><span>{appointment.doctor_name}</span>
              <strong>Date / Time</strong><span>:</span><span>{appointment.appointment_date} · {appointment.appointment_time}</span>
            </div>

            <div style={{ marginTop: 20 }}>
              <label style={labelStyle}>ATTENDING DOCTOR'S NAME (for prescription)</label>
              <input
                value={doctorName}
                onChange={e => setDoctorName(e.target.value)}
                placeholder="e.g. Dr. Amit Roy"
                style={inputStyle}
              />
            </div>

            <button
              onClick={handleGeneratePrescription}
              disabled={generating}
              style={{ ...primaryBtn, marginTop: 16 }}
            >
              <Printer size={16} /> {generating ? "Generating..." : "Generate & Print Prescription"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
