import { useState, useEffect } from "react"
import axios from "axios"
import westBengalImg from "./assets/west_bengal_img.png"
import {
  Building2, Phone, MapPin, Stethoscope, BedDouble,
  ChevronLeft, CheckCircle2, XCircle, ArrowRight, Clock
} from "lucide-react"

const API = "https://dhis-backend.onrender.com"
const COLORS = ["#378ADD","#1D9E75","#EF9F27","#D85A30","#7F77DD","#993556","#639922","#BA7517"]

export default function HospitalPage({ districtId, districtName, onBack }) {
  const [hospitals, setHospitals] = useState([])
  const [selectedHospital, setSelectedHospital] = useState(null)
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [attendanceMap, setAttendanceMap] = useState({})

  useEffect(() => {
    setLoading(true)
    axios.get(`${API}/hospitals/${districtId}`)
      .then(r => { setHospitals(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [districtId])

  const loadDetails = (hospital) => {
    setSelectedHospital(hospital)
    setDetailLoading(true)
    setDetails(null)
    setAttendanceMap({})

    axios.get(`${API}/hospital/${hospital.id}/details`)
      .then(r => { setDetails(r.data); setDetailLoading(false) })
      .catch(() => setDetailLoading(false))

    axios.get(`${API}/doctor/attendance/${hospital.id}`)
      .then(r => {
        const map = {}
        r.data.forEach(a => {
          map[a.doctor_id] = new Date(a.marked_at).toLocaleTimeString("en-IN", {
            hour: "2-digit", minute: "2-digit", hour12: true
          })
        })
        setAttendanceMap(map)
      })
      .catch(() => {})
  }

  const WB_PATH = "M290,58 L295,62 L300,68 L298,75 L302,80 L305,87 L302,93 L298,98 L300,105 L297,112 L293,118 L290,125 L292,132 L289,139 L285,145 L282,152 L278,158 L274,164 L270,170 L266,176 L261,181 L256,186 L250,190 L244,194 L238,198 L232,202 L226,205 L220,207 L214,208 L208,207 L202,205 L197,201 L192,197 L188,192 L184,186 L181,180 L179,174 L177,168 L176,162 L175,156 L175,150 L176,144 L177,138 L179,132 L181,126 L184,121 L187,115 L191,110 L195,105 L200,101 L205,97 L210,93 L215,89 L220,85 L225,81 L230,77 L235,73 L240,69 L245,65 L250,61 L255,58 L260,55 L265,53 L270,52 L275,52 L280,54 L285,56 Z"

  return (
    <div style={{ 
      padding:"28px 32px",
      maxWidth:"100%",
      minHeight:"100vh",
      backgroundImage:`
        linear-gradient(
          rgba(5,20,40,0.75),
          rgba(5,20,40,0.85)
        ),
        url(${westBengalImg})
      `,
      backgroundSize:"cover",
      backgroundPosition:"center",
      backgroundRepeat:"no-repeat",
      position:"relative"
    }}>

      {/* Watermark */}
      <div style={{ position:"fixed", right:"2%", top:"50%", transform:"translateY(-50%)", opacity:0.15, pointerEvents:"none", zIndex:0 }}>
        <svg width="500" height="600" viewBox="165 45 155 195">
          <path d={WB_PATH} fill="#1a5276" stroke="#1a5276" strokeWidth="1"/>
        </svg>
      </div>

      <div style={{ position:"relative", zIndex:1 }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
          <button onClick={onBack}
  style={{
    display:"flex",alignItems:"center",gap:8,padding:"10px 22px",borderRadius:10,background:"linear-gradient(135deg, #378ADD, #1D9E75)",
    color:"#fff",border:"none",cursor:"pointer",fontSize:14,fontWeight:600,boxShadow:"0 2px 8px rgba(55,138,221,0.3)"
  }}>
  <ChevronLeft size={16} /> Back to Dashboard
</button>
          <div style={{ fontSize:20, fontWeight:700, color:"#ffffff", display:"flex", alignItems:"center", gap:8 }}>
            <Building2 size={22} color="#378ADD" /> {districtName} — Hospital Details
          </div>
        </div>

        {loading && <div style={{ textAlign:"center", padding:60, color:"rgba(255,255,255,0.75)" }}>Loading hospitals...</div>}

        {/* Hospital List */}
        {!loading && !selectedHospital && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(320px, 1fr))", gap:16 }}>
            {hospitals.map((h, i) => (
              <div key={h.id}
                onClick={() => loadDetails(h)}
                style={{ background:"rgba(10,20,40,0.35)",borderRadius:16,padding:"24px 28px", backdropFilter:"blur(10px)",
                 boxShadow:"0 8px 25px rgba(0,0,0,0.25)",cursor:"pointer",transition:"transform .2s, box-shadow .2s",border:"1px solid rgba(255, 255, 255, 0.84)"
}}
                onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 8px 24px rgba(55,138,221,0.15)"; e.currentTarget.style.borderColor="#378ADD" }}
                onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,0.07)"; e.currentTarget.style.borderColor="rgba(255, 255, 255, 0.6)" }}>

                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
                  <div style={{ width:48, height:48, borderRadius:12, background:`linear-gradient(135deg, ${COLORS[i % COLORS.length]}, ${COLORS[(i+2) % COLORS.length]})`,
                    display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <Building2 size={22} color="#fff" />
                  </div>
                  <div>
                    <div style={{ fontSize:15, fontWeight:700, color:"#ffffff" }}>{h.hospital_name}</div>
                    {h.address && <div style={{ fontSize:12, color:"rgba(255,255,255,0.75)", display:"flex", alignItems:"center", gap:4, marginTop:2 }}>
                      <MapPin size={11} /> {h.address}
                    </div>}
                  </div>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
                  <div style={{background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:8,padding:"10px 12px",backdropFilter:"blur(6px)"}}>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.75)" }}>Total Doctors</div>
                    <div style={{ fontSize:20, fontWeight:700, color:"#378ADD" }}>{h.total_doctors}</div>
                  </div>
                  <div style={{background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:8,padding:"10px 12px",backdropFilter:"blur(6px)"}}>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.75)" }}>Available</div>
                    <div style={{ fontSize:20, fontWeight:700, color:"#1D9E75" }}>{h.available_doctors}</div>
                  </div>
                </div>

                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
                  {h.ambulance_number && (
                    <div style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", borderRadius:6, background:"rgba(255,255,255,0.04)",backdropFilter:"blur(6px)", fontSize:12, color:"#ff4545", fontWeight:600 }}>
                      <Phone size={12} /> Ambulance: {h.ambulance_number}
                    </div>
                  )}
                  {h.emergency_number && (
                    <div style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", background:"rgba(255, 255, 255, 0.04)",backdropFilter:"blur(6px)", fontSize:12, color:"#ff4545", fontWeight:600 }}>
                      <Phone size={12} /> Emergency: {h.emergency_number}
                    </div>
                  )}
                </div>

                <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", color:"#378ADD", fontSize:13, fontWeight:600 }}>
                  View Details <ArrowRight size={14} style={{ marginLeft:4 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Hospital Detail View */}
        {selectedHospital && (
          <div>
            <button onClick={() => { setSelectedHospital(null); setDetails(null); setAttendanceMap({}) }}
              style={{display:"flex",alignItems:"center",gap:8,padding:"10px 22px",borderRadius:10,marginBottom:20,
              background:"linear-gradient(135deg, #378ADD, #1D9E75)",color:"#fff",border:"none",cursor:"pointer",fontSize:14,fontWeight:600,boxShadow:"0 2px 8px rgba(55,138,221,0.3)"}}> Back to Hospitals
            </button>

            {/* Hospital header card */}
            <div style={{ background:"rgba(255,255,255,0.02)",backdropFilter:"blur(3px)",border:"1px solid rgba(255,255,255,0.25)",borderRadius:16,
             padding:"28px 32px",boxShadow:"0 8px 25px rgba(0,0,0,0.3)",marginBottom:20 }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:16, marginBottom:20 }}>
                <div style={{ width:60, height:60, borderRadius:14, background:"linear-gradient(135deg, #378ADD, #1D9E75)",
                  display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <Building2 size={28} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize:22, fontWeight:800, color:"#ffffff" }}>{selectedHospital.hospital_name}</div>
                  {selectedHospital.address && (
                    <div style={{ fontSize:13, color:"rgba(255,255,255,0.75)", display:"flex", alignItems:"center", gap:5, marginTop:4 }}>
                      <MapPin size={13} /> {selectedHospital.address}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                <div style={{ background:"rgba(55,138,221,0.02)",border:"1px solid rgba(255,255,255,0.2)", borderRadius:10, padding:"12px 20px", textAlign:"center" }}>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.75)", marginBottom:4 }}>TOTAL DOCTORS</div>
                  <div style={{ fontSize:26, fontWeight:700, color:"#378ADD" }}>{selectedHospital.total_doctors}</div>
                </div>
                <div style={{ background:"rgba(29,158,117,0.02)",border:"1px solid rgba(255,255,255,0.2)", borderRadius:10, padding:"12px 20px", textAlign:"center" }}>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.75)", marginBottom:4 }}>AVAILABLE</div>
                  <div style={{ fontSize:26, fontWeight:700, color:"#1D9E75" }}>{selectedHospital.available_doctors}</div>
                </div>
                {selectedHospital.ambulance_number && (
                  <div style={{ background:"rgba(239,68,68,0.02)",border:"1px solid rgba(255,255,255,0.2)", borderRadius:10, padding:"12px 20px", textAlign:"center" }}>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.75)", marginBottom:4 }}>AMBULANCE</div>
                    <div style={{ fontSize:18, fontWeight:700, color:"#b91c1c", display:"flex", alignItems:"center", gap:5 }}>
                      <Phone size={16} /> {selectedHospital.ambulance_number}
                    </div>
                  </div>
                )}
                {selectedHospital.emergency_number && (
                  <div style={{ background:"rgba(245,158,11,0.02)",border:"1px solid rgba(255,255,255,0.2)", borderRadius:10, padding:"12px 20px", textAlign:"center" }}>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.75)", marginBottom:4 }}>EMERGENCY</div>
                    <div style={{ fontSize:18, fontWeight:700, color:"#c2410c", display:"flex", alignItems:"center", gap:5 }}>
                      <Phone size={16} /> {selectedHospital.emergency_number}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {detailLoading && <div style={{ textAlign:"center", padding:40, color:"rgba(255,255,255,0.75)" }}>Loading details...</div>}

            {details && !detailLoading && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>

                {/* Departments */}
                <div style={{ background:"rgba(255,255,255,0.02)",backdropFilter:"blur(3px)",border:"1px solid rgba(255,255,255,0.25)",borderRadius:16,padding:"24px 28px",boxShadow:"0 8px 25px rgba(0,0,0,0.3)"}}>
                  <div style={{ fontSize:16, fontWeight:700, color:"#ffffff", marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
                    <BedDouble size={18} color="#378ADD" /> Departments ({details.departments.length})
                  </div>
                  {details.departments.length === 0 && (
                    <div style={{ color:"#aaa", fontSize:13 }}>No departments added yet.</div>
                  )}
                  {details.departments.map((dept, i) => (
                    <div key={dept.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                      padding:"12px 14px", borderRadius:10, marginBottom:8,
                      background:"rgba(255, 255, 255, 0.01)", border:"1px solid rgba(255,255,255,0.2)"}}>
                      <div>
                        <div style={{ fontSize:14, fontWeight:600, color:"#ffffff" }}>{dept.department_name}</div>
                        <div style={{ fontSize:12, color:"rgba(255,255,255,0.75)", marginTop:2 }}>
                          Beds: {dept.available_beds} available / {dept.total_beds} total
                        </div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:20, fontWeight:700, color: dept.available_beds > 0 ? "#29eeaf" : "#f54444" }}>
                          {dept.available_beds}
                        </div>
                        <div style={{ fontSize:10, color:"#aaa" }}>beds free</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Doctors */}
                <div style={{ background:"rgba(255,255,255,0.02)",backdropFilter:"blur(3px)",
                  border:"1px solid rgba(255,255,255,0.25)", borderRadius:16, padding:"24px 28px", boxShadow:"0 2px 12px rgba(0,0,0,0.07)" }}>
                  <div style={{ fontSize:16, fontWeight:700, color:"#ffffff", marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
                    <Stethoscope size={18} color="#1D9E75" /> Doctors ({details.doctors.length})
                  </div>
                  {details.doctors.length === 0 && (
                    <div style={{ color:"#aaa", fontSize:13 }}>No doctors added yet.</div>
                  )}
                  {details.doctors.map((doc) => {
                    const attendanceTime = attendanceMap[doc.id] || null
                    return (
                      <div key={doc.id} style={{ display:"flex", alignItems:"center", gap:12,
                        padding:"12px 14px", borderRadius:10, marginBottom:8,border:"1px solid rgba(255,255,255,0.2)",
                        background: doc.available ? "rgba(29,158,117,0.02)" : "rgba(239,68,68,0.02)" }}>

                        {/* Avatar */}
                        <div style={{ width:38, height:38, borderRadius:10,
                          background: doc.available ? "#1D9E75" : "#e24b4a",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          flexShrink:0, color:"#fff", fontSize:14, fontWeight:700 }}>
                          {doc.name.charAt(3)}
                        </div>

                        {/* Info */}
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:14, fontWeight:600, color:"#ffffff" }}>{doc.name}</div>
                          <div style={{ fontSize:12, color:"rgba(255,255,255,0.75)" }}>{doc.specialization}</div>
                          {/* Attendance badge */}
                          {attendanceTime && (
                            <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:4,
                              fontSize:11, color:"#378ADD", fontWeight:600 }}>
                              <Clock size={11} /> Present since {attendanceTime}
                            </div>
                          )}
                        </div>

                        {/* Available status */}
                        <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, fontWeight:600,
                          color: doc.available ? "#1D9E75" : "#e24b4a", flexShrink:0 }}>
                          {doc.available ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                          {doc.available ? "Available" : "Unavailable"}
                        </div>
                      </div>
                    )
                  })}
                </div>

              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
