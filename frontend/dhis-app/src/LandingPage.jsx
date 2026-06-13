import { useEffect, useRef, useState } from "react"
import { Activity, LayoutDashboard, ShieldCheck, ArrowRight, MapPin } from "lucide-react"

const WB_PATH = "M 220 80 L 240 75 L 265 82 L 280 95 L 290 115 L 285 135 L 295 150 L 305 165 L 300 185 L 288 200 L 275 210 L 260 220 L 245 235 L 230 245 L 215 250 L 200 248 L 185 240 L 175 228 L 168 215 L 162 200 L 158 185 L 160 170 L 155 158 L 148 145 L 150 130 L 158 118 L 168 105 L 180 95 L 195 85 Z"

const DISTRICTS = [
  { name:"Kolkata", x:230, y:210 },
  { name:"Howrah", x:210, y:205 },
  { name:"Darjeeling", x:248, y:88 },
  { name:"Bardhaman", x:205, y:165 },
  { name:"Midnapore", x:180, y:200 },
]

export default function LandingPage({ onNavigate }) {
  const [pulse, setPulse] = useState(0)
  const [hoveredDistrict, setHoveredDistrict] = useState(null)
  const [mapRotate, setMapRotate] = useState(0)
  const animRef = useRef()

  useEffect(() => {
    let frame = 0
    const animate = () => {
      frame++
      setPulse(Math.sin(frame * 0.03) * 4)
      setMapRotate(Math.sin(frame * 0.008) * 3)
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg, #0d1526 0%, #1a2236 50%, #0d1f3c 100%)", fontFamily:"system-ui,sans-serif", overflow:"hidden", position:"relative" }}>

      {/* Background grid */}
      <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(55,138,221,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(55,138,221,0.05) 1px, transparent 1px)", backgroundSize:"40px 40px", pointerEvents:"none" }} />

      {/* Glow effects */}
      <div style={{ position:"absolute", top:"-10%", right:"5%", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle, rgba(55,138,221,0.12) 0%, transparent 70%)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:"-10%", left:"5%", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle, rgba(29,158,117,0.10) 0%, transparent 70%)", pointerEvents:"none" }} />

      {/* Navbar */}
      <nav style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 48px", position:"relative", zIndex:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:38, height:38, borderRadius:10, background:"linear-gradient(135deg, #378ADD, #1D9E75)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Activity size={20} color="#fff" />
          </div>
          <div>
            <div style={{ color:"#fff", fontWeight:800, fontSize:15, letterSpacing:0.5 }}>DHIS</div>
            <div style={{ color:"#5b8fc9", fontSize:10, letterSpacing:1 }}>HEALTH INTELLIGENCE</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={() => onNavigate("dashboard")}
            style={{ padding:"9px 22px", borderRadius:10, border:"1px solid rgba(55,138,221,0.4)", background:"rgba(55,138,221,0.08)", color:"#93c5fd", cursor:"pointer", fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:6, transition:"all .2s" }}
            onMouseEnter={e => e.target.style.background="rgba(55,138,221,0.2)"}
            onMouseLeave={e => e.target.style.background="rgba(55,138,221,0.08)"}>
            <LayoutDashboard size={14} /> Dashboard
          </button>
          <button onClick={() => onNavigate("admin")}
            style={{ padding:"9px 22px", borderRadius:10, border:"none", background:"linear-gradient(135deg, #378ADD, #2563eb)", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
            <ShieldCheck size={14} /> Admin Panel
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"40px 48px 0", minHeight:"calc(100vh - 80px)", position:"relative", zIndex:5 }}>

        {/* Left content */}
        <div style={{ maxWidth:560, flex:1 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 14px", borderRadius:20, background:"rgba(55,138,221,0.12)", border:"1px solid rgba(55,138,221,0.25)", marginBottom:24 }}>
            <MapPin size={13} color="#378ADD" />
            <span style={{ color:"#93c5fd", fontSize:12, fontWeight:600 }}>West Bengal, India</span>
          </div>

          <h1 style={{ fontSize:52, fontWeight:800, color:"#fff", lineHeight:1.1, marginBottom:20 }}>
            District{" "}
            <span style={{ background:"linear-gradient(135deg, #378ADD, #1D9E75)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              Health
            </span>
            <br />Intelligence
            <br />System
          </h1>

          <p style={{ fontSize:16, color:"#8ba8c8", lineHeight:1.7, marginBottom:36, maxWidth:440 }}>
            Real-time district-level health data analytics for West Bengal. Monitor disease outbreaks, track hospital capacity, and optimize doctor deployment.
          </p>

          <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
            <button onClick={() => onNavigate("dashboard")}
              style={{ padding:"14px 32px", borderRadius:12, border:"none", background:"linear-gradient(135deg, #378ADD, #1D9E75)", color:"#fff", cursor:"pointer", fontSize:15, fontWeight:700, display:"flex", alignItems:"center", gap:8 }}>
              View Dashboard <ArrowRight size={16} />
            </button>
            <button onClick={() => onNavigate("admin")}
              style={{ padding:"14px 32px", borderRadius:12, border:"1px solid rgba(55,138,221,0.35)", background:"transparent", color:"#93c5fd", cursor:"pointer", fontSize:15, fontWeight:600 }}>
              Admin Login
            </button>
          </div>

          {/* Stats */}
          <div style={{ display:"flex", gap:32, marginTop:48 }}>
            {[["4+", "Districts"], ["20K+", "Cases Tracked"], ["18+", "Diseases"]].map(([v,l]) => (
              <div key={l}>
                <div style={{ fontSize:28, fontWeight:800, background:"linear-gradient(135deg, #378ADD, #1D9E75)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>{v}</div>
                <div style={{ fontSize:12, color:"#5b8fc9", marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right - Animated West Bengal Map */}
        <div style={{ flex:1, display:"flex", justifyContent:"center", alignItems:"center", position:"relative" }}>

          {/* Outer glow ring */}
          <div style={{ position:"absolute", width:420, height:420, borderRadius:"50%", border:"1px solid rgba(55,138,221,0.15)", animation:"none" }} />
          <div style={{ position:"absolute", width:340, height:340, borderRadius:"50%", border:"1px solid rgba(55,138,221,0.1)" }} />

          <svg width="460" height="480" viewBox="100 60 250 220"
            style={{ filter:"drop-shadow(0 0 30px rgba(55,138,221,0.3))", transform:`rotate(${mapRotate}deg)`, transition:"transform 0.1s ease" }}>

            {/* Map glow */}
            <defs>
              <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#378ADD" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#378ADD" stopOpacity="0" />
              </radialGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Background glow circle */}
            <ellipse cx="225" cy="170" rx="100" ry="110" fill="url(#mapGlow)" />

            {/* West Bengal map shape */}
            <path d={WB_PATH}
              fill="rgba(55,138,221,0.15)"
              stroke="#378ADD"
              strokeWidth="1.5"
              filter="url(#glow)" />

            {/* Animated fill pulse */}
            <path d={WB_PATH}
              fill="rgba(29,158,117,0.08)"
              stroke="rgba(29,158,117,0.6)"
              strokeWidth="0.8"
              strokeDasharray="4 3"
              style={{ transform:`scale(${1 + pulse * 0.001})`, transformOrigin:"225px 170px" }} />

            {/* District dots */}
            {DISTRICTS.map((d, i) => (
              <g key={d.name} onMouseEnter={() => setHoveredDistrict(d.name)} onMouseLeave={() => setHoveredDistrict(null)} style={{ cursor:"pointer" }}>
                {/* Pulse ring */}
                <circle cx={d.x} cy={d.y} r={hoveredDistrict === d.name ? 10 : 6 + Math.abs(Math.sin((pulse + i) * 0.5)) * 2}
                  fill="none" stroke="#378ADD" strokeWidth="1" opacity="0.4" />
                {/* Dot */}
                <circle cx={d.x} cy={d.y} r={3}
                  fill={hoveredDistrict === d.name ? "#1D9E75" : "#378ADD"}
                  filter="url(#glow)" />
                {/* Label */}
                {hoveredDistrict === d.name && (
                  <g>
                    <rect x={d.x + 6} y={d.y - 10} width={d.name.length * 6 + 10} height={18} rx="4" fill="rgba(26,34,54,0.9)" />
                    <text x={d.x + 11} y={d.y + 3} fill="#fff" fontSize="9" fontWeight="600">{d.name}</text>
                  </g>
                )}
              </g>
            ))}

            {/* Connecting lines between districts */}
            {DISTRICTS.map((d, i) => i < DISTRICTS.length - 1 && (
              <line key={i} x1={d.x} y1={d.y} x2={DISTRICTS[i+1].x} y2={DISTRICTS[i+1].y}
                stroke="rgba(55,138,221,0.2)" strokeWidth="0.8" strokeDasharray="3 4" />
            ))}

            {/* Title */}
            <text x="225" y="268" textAnchor="middle" fill="#5b8fc9" fontSize="9" fontWeight="600" letterSpacing="1">WEST BENGAL</text>
          </svg>

          {/* Floating info cards */}
          <div style={{ position:"absolute", top:"8%", right:"2%", background:"rgba(26,34,54,0.85)", backdropFilter:"blur(10px)", border:"1px solid rgba(55,138,221,0.2)", borderRadius:12, padding:"10px 14px", minWidth:130 }}>
            <div style={{ fontSize:10, color:"#5b8fc9", marginBottom:3 }}>ACTIVE DISTRICTS</div>
            <div style={{ fontSize:20, fontWeight:700, color:"#378ADD" }}>4</div>
          </div>
          <div style={{ position:"absolute", bottom:"18%", left:"2%", background:"rgba(26,34,54,0.85)", backdropFilter:"blur(10px)", border:"1px solid rgba(29,158,117,0.2)", borderRadius:12, padding:"10px 14px", minWidth:130 }}>
            <div style={{ fontSize:10, color:"#5b8fc9", marginBottom:3 }}>TOP DISEASE</div>
            <div style={{ fontSize:14, fontWeight:700, color:"#1D9E75" }}>Dengue</div>
          </div>
        </div>
      </div>
    </div>
  )
}
