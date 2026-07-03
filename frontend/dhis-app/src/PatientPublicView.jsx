import { useEffect, useState } from "react";
import axios from "axios";
import { AlertCircle, Loader2, ShieldCheck } from "lucide-react";

const API = "https://dhis-backend.onrender.com";

// Public, no-login page — reached by scanning a patient's QR code.
// Shows just enough info to be useful in a hospital / emergency setting.
export default function PatientPublicView({ uid }) {
  const [patient, setPatient] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/patient/${uid}`);
        if (!res.data.success) {
          setError(res.data.message || "Patient not found.");
        } else {
          setPatient(res.data.patient);
          const rx = await axios.get(`${API}/patient/${uid}/prescriptions`);
          setPrescriptions(rx.data || []);
        }
      } catch (e) {
        setError("Could not load patient record. Please check your connection.");
      }
      setLoading(false);
    })();
  }, [uid]);

  const wrapStyle = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0d1526 0%, #1a2236 50%, #0d1f3c 100%)",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    padding: 24, fontFamily: "system-ui, sans-serif",
  };

  const cardStyle = {
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(16px)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 20,
    padding: "32px 30px",
    width: "100%",
    maxWidth: 500,
  };

  if (loading) return (
    <div style={wrapStyle}>
      <Loader2 size={28} color="#378ADD" style={{ animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={wrapStyle}>
      <div style={{ ...cardStyle, textAlign: "center", color: "#fca5a5" }}>
        <AlertCircle size={28} style={{ marginBottom: 10 }} />
        <div>{error}</div>
      </div>
    </div>
  );

  return (
    <div style={wrapStyle}>
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, color: "#6ee7b7", fontSize: 12, fontWeight: 700 }}>
          <ShieldCheck size={16} /> DHIS — Emergency Health Record
        </div>

        <div style={{ color: "#fff", fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{patient.full_name}</div>
        <div style={{ color: "#8ba8c8", fontSize: 12, marginBottom: 20 }}>Patient ID: {patient.uid}</div>

        <div style={{ display: "grid", gridTemplateColumns: "130px 15px 1fr", rowGap: 12, fontSize: 14, color: "#fff", lineHeight: 1.5 }}>
          <strong>Age</strong><span>:</span><span>{patient.age}</span>
          <strong>Gender</strong><span>:</span><span>{patient.gender}</span>
          <strong>Blood Group</strong><span>:</span><span style={{ color: "#f472b6", fontWeight: 700 }}>{patient.blood_group || "—"}</span>
          <strong>Mobile</strong><span>:</span><span>{patient.mobile}</span>
          <strong>District</strong><span>:</span><span>{patient.districts?.name || "—"}</span>
          <strong>Address</strong><span>:</span><span>{patient.address}</span>
          {patient.allergies && (<><strong>Allergies</strong><span>:</span><span style={{ color: "#fca5a5" }}>{patient.allergies}</span></>)}
          {patient.conditions && (<><strong>Conditions</strong><span>:</span><span style={{ color: "#fca5a5" }}>{patient.conditions}</span></>)}
        </div>

        <hr style={{ margin: "20px 0", opacity: 0.15 }} />

        <div style={{ color: "#1D9E75", fontWeight: 700, fontSize: 14, marginBottom: 10 }}>📄 Prescriptions / Reports</div>
        {prescriptions.length === 0 ? (
          <div style={{ color: "#8ba8c8", fontSize: 13 }}>No documents uploaded yet</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {prescriptions.map((p) => (
              <a key={p.id} href={p.file_url} target="_blank" rel="noreferrer"
                style={{ color: "#93c5fd", fontSize: 13, textDecoration: "none" }}>
                📄 {p.file_name}
              </a>
            ))}
          </div>
        )}

        <div style={{ marginTop: 20, fontSize: 11, color: "#5b8fc9", textAlign: "center" }}>
          This page is publicly accessible via QR scan for emergency reference.
        </div>
      </div>
    </div>
  );
}
