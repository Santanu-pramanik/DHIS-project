import { useState, useEffect } from "react";
import axios from "axios";
import {
  LayoutDashboard, Map, Activity, Building2, Stethoscope, AlertTriangle,
  FileDown, ShieldCheck, LogIn,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";

const API = "https://dhis-backend.onrender.com";
const COLORS = ["#378ADD", "#1D9E75", "#EF9F27", "#D85A30", "#7F77DD", "#993556", "#639922", "#BA7517", "#D4537E", "#0F6E56"];
const OUTBREAK_THRESHOLD = 1000; // case count that triggers an "alert" for a disease in a district

const NAV = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "districts", label: "District Overview", icon: Map },
  { key: "surveillance", label: "Disease Surveillance", icon: Activity },
  { key: "hospitals", label: "Hospitals", icon: Building2 },
  { key: "doctors", label: "Doctors", icon: Stethoscope },
  { key: "alerts", label: "Alerts", icon: AlertTriangle },
  { key: "reports", label: "Reports", icon: FileDown },
];

export default function PublicDashboard({ onBack, onNavigate, surveillanceContent }) {
  const [tab, setTab] = useState("overview");
  const [districts, setDistricts] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [casesByDistrict, setCasesByDistrict] = useState({}); // { [id]: [cases...] }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [dRes, hRes, drRes] = await Promise.all([
          axios.get(`${API}/districts`),
          axios.get(`${API}/admin/hospitals`),
          axios.get(`${API}/admin/doctors`),
        ]);
        setDistricts(dRes.data || []);
        setHospitals(hRes.data || []);
        setDoctors(drRes.data || []);

        const casePairs = await Promise.all(
          (dRes.data || []).map(async (d) => {
            try {
              const res = await axios.get(`${API}/cases/${d.id}`);
              return [d.id, res.data || []];
            } catch {
              return [d.id, []];
            }
          })
        );
        setCasesByDistrict(Object.fromEntries(casePairs));
      } catch (e) {
        // leave lists empty on failure — panels below handle empty state
      }
      setLoading(false);
    })();
  }, []);

  const allCases = Object.values(casesByDistrict).flat();
  const totalCases = allCases.reduce((sum, c) => sum + (c.case_count || 0), 0);
  const diseaseTotals = {};
  allCases.forEach((c) => {
    const key = (c.disease_type || "Unknown").trim();
    diseaseTotals[key] = (diseaseTotals[key] || 0) + (c.case_count || 0);
  });
  const topDisease = Object.entries(diseaseTotals).sort((a, b) => b[1] - a[1])[0];

  const alerts = [];
  Object.entries(casesByDistrict).forEach(([distId, cases]) => {
    const distName = districts.find((d) => d.id === Number(distId))?.name || `District ${distId}`;
    cases.forEach((c) => {
      if ((c.case_count || 0) >= OUTBREAK_THRESHOLD) {
        alerts.push({ district: distName, disease: c.disease_type, count: c.case_count });
      }
    });
  });
  alerts.sort((a, b) => b.count - a.count);

  const districtTotals = districts.map((d) => ({
    ...d,
    total: (casesByDistrict[d.id] || []).reduce((s, c) => s + (c.case_count || 0), 0),
  })).sort((a, b) => b.total - a.total);

  const downloadReport = () => {
    const rows = [["District", "Total Cases", "Hospitals", "Doctors"]];
    districtTotals.forEach((d) => {
      const hCount = hospitals.filter((h) => h.district_id === d.id).length;
      const drCount = doctors.filter((dr) => dr.hospitals?.district_id === d.id || dr.district_id === d.id).length;
      rows.push([d.name, d.total, hCount, drCount]);
    });
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dhis_district_report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const wrapStyle = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0d1526 0%, #1a2236 55%, #0d1f3c 100%)",
    color: "#fff",
    fontFamily: "system-ui, sans-serif",
    display: "flex",
  };

  const sidebarStyle = {
    width: 240, flexShrink: 0, background: "rgba(255,255,255,0.03)",
    borderRight: "1px solid rgba(255,255,255,0.08)", padding: "22px 14px",
    position: "sticky", top: 0, height: "100vh", overflowY: "auto",
  };

  const cardStyle = {
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14, padding: 20,
  };

  const NavButton = ({ item }) => {
    const Icon = item.icon;
    const active = tab === item.key;
    return (
      <button
        onClick={() => setTab(item.key)}
        style={{
          display: "flex", alignItems: "center", gap: 10, width: "100%",
          padding: "10px 12px", borderRadius: 10, marginBottom: 4, border: "none",
          background: active ? "rgba(55,138,221,0.18)" : "transparent",
          color: active ? "#93c5fd" : "#8ba8c8", cursor: "pointer",
          fontSize: 13.5, fontWeight: active ? 700 : 500, textAlign: "left",
        }}
      >
        <Icon size={16} /> {item.label}
      </button>
    );
  };

  const StatCard = ({ label, value, accent }) => (
    <div style={{ ...cardStyle, flex: 1, minWidth: 160 }}>
      <div style={{ fontSize: 12, color: "#8ba8c8", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: accent || "#fff" }}>{value}</div>
    </div>
  );

  return (
    <div style={wrapStyle}>
      {/* SIDEBAR */}
      <div style={sidebarStyle}>

        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 4px", marginBottom: 22 }}>
          <Activity size={20} color="#1D9E75" />
          <div>
            <div style={{ fontWeight: 800, fontSize: 14 }}>DHIS</div>
            <div style={{ fontSize: 10, color: "#8ba8c8", letterSpacing: 0.5 }}>HEALTH INTELLIGENCE</div>
          </div>
        </div>

        {NAV.map((item) => <NavButton key={item.key} item={item} />)}

        <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "16px 4px" }} />

        <div style={{ padding: "0 4px", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 11, color: "#5b8fc9", fontWeight: 700, marginBottom: 4 }}>STAFF LOGIN</div>
          {[["admin", "Admin Panel", ShieldCheck], ["doctor", "Doctor Login", Stethoscope], ["hospital", "Hospital Login", Building2], ["patient", "Patient Portal", LogIn]].map(([key, label, Icon]) => (
            <button key={key} onClick={() => onNavigate(key)} style={{
              display: "flex", alignItems: "center", gap: 8, background: "none",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 10px",
              color: "#8ba8c8", cursor: "pointer", fontSize: 12.5,
            }}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, padding: "28px 32px", overflowX: "hidden" }}>
        {loading ? (
          <div style={{ color: "#8ba8c8" }}>Loading district health data…</div>
        ) : (
          <>
            {tab === "overview" && (
              <div>
                <h2 style={{ marginTop: 0 }}>Overview</h2>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
                  <StatCard label="Active Districts" value={districts.length} accent="#93c5fd" />
                  <StatCard label="Total Cases Tracked" value={totalCases.toLocaleString()} accent="#f472b6" />
                  <StatCard label="Hospitals" value={hospitals.length} accent="#6ee7b7" />
                  <StatCard label="Doctors Registered" value={doctors.length} accent="#fbbf24" />
                </div>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <div style={{ ...cardStyle, flex: 2, minWidth: 320 }}>
                    <div style={{ fontSize: 13, color: "#8ba8c8", marginBottom: 10 }}>
                      Top districts by case count
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={districtTotals.slice(0, 8)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                        <XAxis dataKey="name" tick={{ fill: "#8ba8c8", fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                        <YAxis tick={{ fill: "#8ba8c8", fontSize: 11 }} />
                        <Tooltip contentStyle={{ background: "#1a2236", border: "1px solid rgba(255,255,255,0.1)" }} />
                        <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                          {districtTotals.slice(0, 8).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ ...cardStyle, flex: 1, minWidth: 220 }}>
                    <div style={{ fontSize: 13, color: "#8ba8c8", marginBottom: 10 }}>Top disease overall</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#f472b6" }}>{topDisease?.[0] || "—"}</div>
                    <div style={{ color: "#8ba8c8", fontSize: 12, marginBottom: 16 }}>{topDisease?.[1]?.toLocaleString() || 0} cases</div>
                    <div style={{ fontSize: 13, color: "#8ba8c8", marginBottom: 8 }}>Live alerts</div>
                    {alerts.length === 0 ? (
                      <div style={{ fontSize: 12.5, color: "#6ee7b7" }}>No districts above the alert threshold.</div>
                    ) : alerts.slice(0, 3).map((a, i) => (
                      <div key={i} style={{ fontSize: 12.5, color: "#fca5a5", marginBottom: 4 }}>
                        ⚠ {a.disease} — {a.district} ({a.count.toLocaleString()})
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === "districts" && (
              <div>
                <h2 style={{ marginTop: 0 }}>District Overview</h2>
                <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "rgba(255,255,255,0.05)" }}>
                        {["District", "Total Cases", "Hospitals", "Rank"].map((h) => (
                          <th key={h} style={{ textAlign: "left", padding: "12px 16px", color: "#8ba8c8", fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {districtTotals.map((d, i) => (
                        <tr key={d.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                          <td style={{ padding: "10px 16px" }}>{d.name}</td>
                          <td style={{ padding: "10px 16px" }}>{d.total.toLocaleString()}</td>
                          <td style={{ padding: "10px 16px" }}>{hospitals.filter((h) => h.district_id === d.id).length}</td>
                          <td style={{ padding: "10px 16px", color: "#8ba8c8" }}>#{i + 1}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === "surveillance" && (
              <div style={{ margin: "-28px -32px" }}>
                {surveillanceContent ? surveillanceContent : (
                  <div style={{ padding: 32, color: "#8ba8c8" }}>Disease surveillance data is unavailable right now.</div>
                )}
              </div>
            )}

            {tab === "hospitals" && (
              <div>
                <h2 style={{ marginTop: 0 }}>Hospitals</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                  {hospitals.map((h) => (
                    <div key={h.id} style={cardStyle}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>{h.hospital_name}</div>
                      <div style={{ fontSize: 12, color: "#8ba8c8", marginBottom: 8 }}>{h.districts?.name}</div>
                      <div style={{ fontSize: 12, color: "#6ee7b7" }}>
                        {h.available_doctors ?? 0} / {h.total_doctors ?? 0} doctors available
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "doctors" && (
              <div>
                <h2 style={{ marginTop: 0 }}>Doctors</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                  {doctors.map((d) => (
                    <div key={d.id} style={cardStyle}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.name}</div>
                      <div style={{ fontSize: 12, color: "#93c5fd", marginBottom: 4 }}>{d.specialization}</div>
                      <div style={{ fontSize: 12, color: "#8ba8c8" }}>{d.hospitals?.hospital_name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "alerts" && (
              <div>
                <h2 style={{ marginTop: 0 }}>Alerts</h2>
                <div style={{ color: "#8ba8c8", fontSize: 12.5, marginBottom: 16 }}>
                  Districts where a single disease has crossed {OUTBREAK_THRESHOLD.toLocaleString()} reported cases.
                </div>
                {alerts.length === 0 ? (
                  <div style={{ ...cardStyle, color: "#6ee7b7" }}>✓ No active alerts right now.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {alerts.map((a, i) => (
                      <div key={i} style={{
                        ...cardStyle, borderColor: "rgba(239,68,68,0.35)",
                        background: "rgba(239,68,68,0.08)", display: "flex",
                        justifyContent: "space-between", alignItems: "center",
                      }}>
                        <div>
                          <div style={{ fontWeight: 700, color: "#fca5a5" }}>{a.disease} outbreak — {a.district}</div>
                          <div style={{ fontSize: 12, color: "#8ba8c8" }}>{a.count.toLocaleString()} reported cases</div>
                        </div>
                        <AlertTriangle size={20} color="#fca5a5" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "reports" && (
              <div>
                <h2 style={{ marginTop: 0 }}>Reports</h2>
                <div style={cardStyle}>
                  <div style={{ marginBottom: 14, color: "#8ba8c8", fontSize: 13 }}>
                    Download a district-wise summary (total cases, hospitals, doctors) as a CSV file.
                  </div>
                  <button onClick={downloadReport} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
                    borderRadius: 10, border: "none", cursor: "pointer",
                    background: "linear-gradient(135deg, #378ADD, #1D9E75)", color: "#fff",
                    fontSize: 13.5, fontWeight: 700,
                  }}>
                    <FileDown size={16} /> Download CSV Report
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
