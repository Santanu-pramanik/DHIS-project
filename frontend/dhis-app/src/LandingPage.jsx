import { FaGithub, FaLinkedin } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  LayoutDashboard,
  ShieldCheck,
  ArrowRight,
  MapPin,
  AlertTriangle,
  Stethoscope,
} from "lucide-react";
const WB_PATH =
  "M502,99 L499,115 L524,149 L517,195 L533,194 L527,202 L540,220 L502,248 L500,258 L492,258 L481,282 L513,315 L516,338 L498,333 L479,351 L491,371 L487,379 L479,378 L494,407 L498,431 L488,442 L499,448 L500,464 L482,467 L487,493 L467,515 L476,522 L459,524 L460,533 L451,531 L451,542 L443,548 L419,541 L425,563 L405,566 L406,576 L376,564 L362,572 L366,582 L360,593 L319,601 L301,629 L284,622 L282,610 L268,608 L266,621 L246,624 L240,654 L253,669 L266,667 L292,690 L331,693 L320,697 L318,717 L326,727 L341,730 L350,746 L367,752 L362,764 L373,770 L380,786 L359,793 L358,804 L395,816 L399,841 L408,842 L417,828 L424,829 L431,850 L451,854 L458,874 L481,869 L515,847 L530,817 L528,830 L535,827 L547,804 L542,791 L550,803 L542,824 L551,848 L547,864 L556,878 L563,877 L571,860 L575,873 L582,869 L587,835 L593,842 L585,877 L599,874 L607,834 L599,821 L603,813 L604,824 L615,819 L614,873 L626,873 L625,862 L636,878 L634,849 L641,866 L654,870 L664,864 L650,830 L659,824 L654,803 L660,795 L640,737 L642,699 L629,681 L629,667 L644,649 L610,644 L618,610 L610,612 L588,591 L589,563 L609,554 L612,544 L604,527 L607,504 L555,490 L533,476 L515,453 L533,427 L534,414 L553,426 L555,415 L563,413 L570,377 L626,382 L637,362 L616,353 L610,331 L596,339 L581,335 L542,294 L524,297 L519,280 L531,266 L530,248 L549,239 L562,218 L571,218 L565,203 L547,200 L555,181 L560,194 L591,212 L588,231 L606,224 L613,234 L616,226 L638,232 L640,225 L621,213 L627,203 L642,212 L654,248 L676,263 L685,259 L703,269 L714,254 L707,241 L714,241 L713,233 L721,237 L722,223 L737,208 L738,165 L723,159 L709,163 L710,154 L688,152 L676,143 L645,152 L633,136 L622,136 L618,127 L612,131 L611,111 L588,102 L569,102 L554,116 L537,110 L521,114 Z";

const DISTRICTS = [
  { name: "Darjeeling", x: 98, y: 16, cases: 412, level: "low" },
  { name: "Alipurduar", x: 148, y: 26, cases: 308, level: "low" },
  { name: "Cooch Behar", x: 144, y: 40, cases: 540, level: "med" },
  { name: "Jalpaiguri", x: 116, y: 32, cases: 671, level: "med" },
  { name: "Malda", x: 94, y: 92, cases: 1240, level: "high" },
  { name: "Murshidabad", x: 99, y: 124, cases: 980, level: "med" },
  { name: "Birbhum", x: 72, y: 136, cases: 530, level: "med" },
  { name: "Bardhaman", x: 74, y: 156, cases: 1480, level: "high" },
  { name: "Nadia", x: 108, y: 156, cases: 1120, level: "high" },
  { name: "Purulia", x: 24, y: 158, cases: 290, level: "low" },
  { name: "Bankura", x: 51, y: 162, cases: 610, level: "med" },
  { name: "Hooghly", x: 88, y: 176, cases: 870, level: "med" },
  { name: "North 24 Parganas", x: 112, y: 184, cases: 2150, level: "high" },
  { name: "Kolkata", x: 102, y: 189, cases: 3120, level: "high" },
  { name: "Howrah", x: 96, y: 190, cases: 1640, level: "high" },
  { name: "West Midnapore", x: 60, y: 196, cases: 520, level: "med" },
  { name: "East Midnapore", x: 76, y: 214, cases: 740, level: "med" },
  { name: "South 24 Parganas", x: 104, y: 216, cases: 1980, level: "high" },
];

const OUTBREAK_DISTRICTS = ["Kolkata", "North 24 Parganas", "Malda", "Bardhaman"];

const LEVEL_COLOR = { low: "#378ADD", med: "#f4b740", high: "#ef4444" };

const TEAM = [
  {
    name: "Santanu Pramanik",
    role: "Project Lead",
    tags: ["Backend Dev", "Data Engineer"],
    color: "#378ADD",
    accent: "rgba(55,138,221,0.15)",
    border: "rgba(55,138,221,0.3)",
    initials: "SP",
    github: "https://github.com/Santanu-pramanik",
    linkedin: "https://www.linkedin.com/in/santanu-pramanik-290b66229",
    points: [
      { icon: "ti-server", text: "Backend architecture & API design" },
      { icon: "ti-database", text: "Database schema & Git management" },
      { icon: "ti-users", text: "Team coordination & error handling" },
    ],
  },
  {
    name: "Rohit Kumar Sahu",
    role: "Data Entry & Marketing",
    tags: ["Data Entry", "Marketing"],
    color: "#1D9E75",
    accent: "rgba(29,158,117,0.15)",
    border: "rgba(29,158,117,0.3)",
    initials: "RK",
    github: "https://github.com/rohit69-star",
    linkedin: "https://www.linkedin.com/in/rohit-kumar-sahu-23a7b7331",
    points: [
      { icon: "ti-table", text: "Health data entry & sourcing" },
      { icon: "ti-eye", text: "Website testing & QA" },
      { icon: "ti-speakerphone", text: "Marketing & data cleaning" },
    ],
  },
  {
    name: "Susmita Mandal",
    role: "Project Manager",
    tags: ["Frontend", "Management"],
    color: "#a78bfa",
    accent: "rgba(167,139,250,0.15)",
    border: "rgba(167,139,250,0.3)",
    initials: "SM",
    github: "https://github.com/Susmita75",
    linkedin: "https://www.linkedin.com/in/susmita-mandal-0aa079278/",
    points: [
      { icon: "ti-layout-dashboard", text: "Dashboard UI development" },
      { icon: "ti-device-desktop", text: "Project web page management" },
      { icon: "ti-trending-up", text: "Data-driven decision support" },
    ],
  },
  {
    name: "Priyanka Adak",
    role: "Frontend Developer",
    tags: ["Frontend", "Analysis"],
    color: "#f472b6",
    accent: "rgba(244,114,182,0.15)",
    border: "rgba(244,114,182,0.3)",
    initials: "PA",
    github: "https://github.com/Priyanka-Adak",
    linkedin: "https://www.linkedin.com/in/priyanka-adak-73abb2277",
    points: [
      { icon: "ti-palette", text: "Frontend UI & system management" },
      { icon: "ti-chart-pie", text: "Data analysis & interpretation" },
      { icon: "ti-file-analytics", text: "Schematic report generation" },
    ],
  },
];

export default function LandingPage({ onNavigate }) {
  const [pulse, setPulse] = useState(0);
  const [hoveredDistrict, setHoveredDistrict] = useState(null);
  const [float, setFloat] = useState({ x: 0, y: 0, r: 0 });
  const animRef = useRef();

  useEffect(() => {
    let frame = 0;
    const animate = () => {
      frame++;
      setPulse(Math.sin(frame * 0.005) * 6);
      setFloat({
        x: Math.sin(frame * 0.008) * 8,
        y: Math.cos(frame * 0.006) * 10,
        r: Math.sin(frame * 0.005) * 3.5,
      });
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        overflowY: "auto",
        overflowX: "hidden",
        background: "linear-gradient(135deg, #0d1526 0%, #1a2236 50%, #0d1f3c 100%)",
        fontFamily: "system-ui,sans-serif",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css');
        @keyframes dhis-ring-pulse {
          0%   { r: 4;  opacity: 0.55; }
          70%  { r: 13; opacity: 0; }
          100% { r: 13; opacity: 0; }
        }
        @keyframes dhis-outbreak-glow {
          0%, 100% { opacity: 0.35; r: 7; }
          50%      { opacity: 0.85; r: 11; }
        }
        @keyframes dhis-float {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-6px); }
        }
        @keyframes team-fade-in {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .dhis-district-node { transition: r 0.25s ease, fill 0.25s ease, filter 0.25s ease; }
        .dhis-district-group:hover .dhis-district-node { filter: brightness(1.4); }
        .dhis-card-float { animation: dhis-float 6s ease-in-out infinite; }
        .dhis-card-float.delay { animation-delay: 1.4s; }
        .team-card {
          animation: team-fade-in 0.6s ease both;
          position: relative;
          overflow: hidden;
        }
        .team-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 16px;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }
        .team-card:hover::before { opacity: 1; }
        .team-card:hover { transform: translateY(-6px); box-shadow: 0 16px 48px rgba(0,0,0,0.55), 0 0 24px rgba(55,138,221,0.12) !important; }
        .team-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .tag-pill {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.4px;
        }
        .avatar-ring {
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 18px;
          flex-shrink: 0;
        }
        .dot-bullet {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 6px;
        }
      `}</style>

      {/* Background grid */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(55,138,221,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(55,138,221,0.05) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" }} />

      {/* Glow effects */}
      <div style={{ position: "absolute", top: "-10%", right: "5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(55,138,221,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-10%", left: "5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(29,158,117,0.10) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Navbar */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 48px", position: "relative", zIndex: 10, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg, #378ADD, #1D9E75)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Activity size={20} color="#fff" />
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 15, letterSpacing: 0.5 }}>DHIS</div>
            <div style={{ color: "#5b8fc9", fontSize: 10, letterSpacing: 1 }}>HEALTH INTELLIGENCE</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => onNavigate("dashboard")} style={{ padding: "9px 22px", borderRadius: 10, border: "1px solid rgba(55,138,221,0.4)", background: "rgba(55,138,221,0.08)", color: "#93c5fd", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(55,138,221,0.2)")} onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(55,138,221,0.08)")}>
            <LayoutDashboard size={14} /> Dashboard
          </button>
          <button onClick={() => onNavigate("admin")} style={{ padding: "9px 22px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #378ADD, #2563eb)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            <ShieldCheck size={14} /> Admin Panel
          </button>
          <button onClick={() => onNavigate("doctor")} style={{ padding: "9px 22px", borderRadius: 10, border: "1px solid rgba(29,158,117,0.4)", background: "rgba(29,158,117,0.08)", color: "#6ee7b7", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(29,158,117,0.2)")} onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(29,158,117,0.08)")}>
            <Stethoscope size={14} /> Doctor Login
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 48px 24px", flex: 1, position: "relative", zIndex: 5, overflow: "hidden" }}>
        {/* Left content */}
        <div style={{ maxWidth: 560, flex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 20, background: "rgba(55,138,221,0.12)", border: "1px solid rgba(55,138,221,0.25)", marginBottom: 24 }}>
            <MapPin size={13} color="#378ADD" />
            <span style={{ color: "#93c5fd", fontSize: 12, fontWeight: 600 }}>West Bengal, India</span>
          </div>
          <h1 style={{ fontSize: 52, fontWeight: 800, color: "#fff", lineHeight: 1.1, marginBottom: 20 }}>
            District{" "}
            <span style={{ background: "linear-gradient(135deg, #378ADD, #1D9E75)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Health</span>
            <br />Intelligence<br />System
          </h1>
          <p style={{ fontSize: 16, color: "#8ba8c8", lineHeight: 1.7, marginBottom: 36, maxWidth: 440 }}>
            Real-time district-level health data analytics for West Bengal. Monitor disease outbreaks, track hospital capacity, and optimize doctor deployment.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button onClick={() => onNavigate("dashboard")} style={{ padding: "14px 32px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #378ADD, #1D9E75)", color: "#fff", cursor: "pointer", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
              View Dashboard <ArrowRight size={16} />
            </button>
            <button onClick={() => onNavigate("admin")} style={{ padding: "14px 32px", borderRadius: 12, border: "1px solid rgba(55,138,221,0.35)", background: "transparent", color: "#93c5fd", cursor: "pointer", fontSize: 15, fontWeight: 600 }}>
              Admin Login
            </button>
          </div>
          <div style={{ display: "flex", gap: 32, marginTop: 48 }}>
            {[["18", "Districts"], ["20K+", "Cases Tracked"], ["18+", "Diseases"]].map(([v, l]) => (
              <div key={l}>
                <div style={{ fontSize: 28, fontWeight: 800, background: "linear-gradient(135deg, #378ADD, #1D9E75)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{v}</div>
                <div style={{ fontSize: 12, color: "#5b8fc9", marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right - Animated West Bengal Map */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", position: "relative", height: "100%" }}>
          <div style={{ position: "absolute", width: 420, height: 420, borderRadius: "50%", border: "1px solid rgba(55,138,221,0.15)", transform: `scale(${1 + Math.abs(Math.sin(pulse * 0.7)) * 0.12})`, transition: "transform 0.3s ease-out" }} />
          <div style={{ position: "absolute", width: 340, height: 340, borderRadius: "50%", border: "1px solid rgba(55,138,221,0.1)", transform: `scale(${1 + Math.abs(Math.sin(pulse * 0.7)) * 0.12})`, transition: "transform 0.3s ease-out" }} />
          <svg width="420" height="550" viewBox="220 80 540 820" style={{ filter: "drop-shadow(0 0 30px rgba(55,138,221,0.3))", transform: `translate(${float.x}px, ${float.y}px) rotate(${float.r}deg)`, transition: "transform 0.08s linear", position: "relative" }}>
            <defs>
              <radialGradient id="mapGlow" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="#378ADD" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#378ADD" stopOpacity="0" />
              </radialGradient>
              <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <linearGradient id="wbFill" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#378ADD" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#1D9E75" stopOpacity="0.10" />
              </linearGradient>
            </defs>
            <ellipse cx="86" cy="116" rx="100" ry="125" fill="url(#mapGlow)" />
            <path d={WB_PATH} fill="url(#wbFill)" stroke="#378ADD" strokeWidth="1.4" filter="url(#glow)" />
            <path d={WB_PATH} fill="none" stroke="rgba(29,158,117,0.65)" strokeWidth="0.7" strokeDasharray="3 3" style={{ transform: `scale(${1 + pulse * 0.003})`, transformOrigin: "86px 116px", transition: "transform 0.8s ease-out" }} />
            <g>
              <circle cx="520" cy="300" r="6" fill="#ef4444" opacity="0.9"><animate attributeName="r" values="4;8;4" dur="2.5s" repeatCount="indefinite" /><animate attributeName="opacity" values="1;0.6;1" dur="2.5s" repeatCount="indefinite" /></circle>
              <circle cx="520" cy="300" r="8" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.5"><animate attributeName="r" values="6;14;6" dur="2.5s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.5;0;0.5" dur="2.5s" repeatCount="indefinite" /></circle>
            </g>
            <g>
              <circle cx="500" cy="480" r="6" fill="#ef4444" opacity="0.9"><animate attributeName="r" values="4;8;4" dur="2.5s" begin="0.6s" repeatCount="indefinite" /><animate attributeName="opacity" values="1;0.6;1" dur="2.5s" begin="0.6s" repeatCount="indefinite" /></circle>
              <circle cx="480" cy="480" r="8" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.5"><animate attributeName="r" values="6;14;6" dur="2.5s" begin="0.6s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.5;0;0.5" dur="2.5s" begin="0.6s" repeatCount="indefinite" /></circle>
            </g>
            <g>
              <circle cx="550" cy="350" r="5" fill="#378ADD" opacity="0.8"><animate attributeName="r" values="4;7;4" dur="3.5s" begin="0.3s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.7;1;0.7" dur="3.5s" begin="0.3s" repeatCount="indefinite" /></circle>
              <circle cx="350" cy="350" r="7" fill="none" stroke="#378ADD" strokeWidth="1.2" opacity="0.4"><animate attributeName="r" values="5;12;5" dur="3.5s" begin="0.3s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.4;0;0.4" dur="3.5s" begin="0.3s" repeatCount="indefinite" /></circle>
            </g>
            {DISTRICTS.map((d, i) => (<line key={`b-${i}`} x1={d.x} y1={d.y} x2={102} y2={189} stroke="rgba(55,138,221,0.10)" strokeWidth="0.5" />))}
            {DISTRICTS.map((d) => {
              const isHover = hoveredDistrict === d.name;
              const isOutbreak = OUTBREAK_DISTRICTS.includes(d.name);
              const color = LEVEL_COLOR[d.level];
              return (
                <g key={d.name} className="dhis-district-group" onMouseEnter={() => setHoveredDistrict(d.name)} onMouseLeave={() => setHoveredDistrict(null)} style={{ cursor: "pointer" }}>
                  <circle cx={d.x} cy={d.y} r="4" fill="none" stroke={color} strokeWidth="1" style={{ animation: `dhis-ring-pulse ${isOutbreak ? 1.6 : 2.6}s ease-out infinite`, animationDelay: `${(d.x % 5) * 0.3}s` }} />
                  {isOutbreak && (<circle cx={d.x} cy={d.y} r="9" fill={color} opacity="0.3" style={{ animation: "dhis-outbreak-glow 1.8s ease-in-out infinite" }} />)}
                  <circle className="dhis-district-node" cx={d.x} cy={d.y} r={isHover ? 5.5 : 3} fill={isHover ? "#1D9E75" : color} filter="url(#glow)" />
                  {isOutbreak && !isHover && (<circle cx={d.x + 4} cy={d.y - 4} r="1.6" fill="#ef4444" filter="url(#glow)" />)}
                  {isHover && (
                    <g style={{ transform: `translate(${d.x > 110 ? -(d.name.length * 5.4 + 16) : 8}px, -16px)`, transformOrigin: `${d.x}px ${d.y}px` }}>
                      <rect x={d.x} y={d.y - 10} width={d.name.length * 5.4 + 16} height={18} rx="4" fill="rgba(13,21,38,0.92)" stroke="rgba(55,138,221,0.3)" strokeWidth="0.5" />
                      <text x={d.x + 6} y={d.y + 3} fill="#fff" fontSize="8" fontWeight="700">{d.name}</text>
                      <text x={d.x + 6} y={d.y + 12} fill={color} fontSize="6.5" fontWeight="600">{d.cases.toLocaleString()} cases</text>
                    </g>
                  )}
                </g>
              );
            })}
            <text x="86" y="20" textAnchor="middle" fill="#5b8fc9" fontSize="8" fontWeight="700" letterSpacing="1.5" opacity="0.7">WEST BENGAL</text>
          </svg>

          {/* Floating info cards */}
          <div className="dhis-card-float" style={{ position: "absolute", top: "8%", right: "2%", background: "rgba(26,34,54,0.85)", backdropFilter: "blur(10px)", border: "1px solid rgba(55,138,221,0.2)", borderRadius: 12, padding: "10px 14px", minWidth: 140, transform: `translateY(${Math.sin(pulse * 0.8) * 6}px)`, transition: "transform 0.3s ease-out" }}>
            <div style={{ fontSize: 10, color: "#5b8fc9", marginBottom: 3 }}>ACTIVE DISTRICTS</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#378ADD" }}>{DISTRICTS.length}</div>
          </div>
          <div className="dhis-card-float delay" style={{ position: "absolute", bottom: "20%", left: "0%", background: "rgba(26,34,54,0.85)", backdropFilter: "blur(10px)", border: "1px solid rgba(29,158,117,0.2)", borderRadius: 12, padding: "10px 14px", minWidth: 140, transform: `translateY(${Math.sin(pulse * 0.6 + 2) * 8}px)`, transition: "transform 0.3s ease-out" }}>
            <div style={{ fontSize: 10, color: "#5b8fc9", marginBottom: 3 }}>TOP DISEASE</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1D9E75" }}>Dengue</div>
          </div>
          <div className="dhis-card-float" style={{ position: "absolute", bottom: "6%", right: "6%", background: "rgba(26,34,54,0.88)", backdropFilter: "blur(10px)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: "10px 14px", minWidth: 160, display: "flex", alignItems: "center", gap: 8, transform: `translateY(${Math.sin(pulse * 0.7 + 1) * 7}px)`, transition: "transform 0.3s ease-out" }}>
            <AlertTriangle size={16} color="#ef4444" />
            <div>
              <div style={{ fontSize: 10, color: "#5b8fc9", marginBottom: 2 }}>LIVE OUTBREAK ALERTS</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>{OUTBREAK_DISTRICTS.length} districts</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TEAM SECTION ── */}
      <div style={{ padding: "72px 48px 80px", position: "relative", zIndex: 5 }}>
        {/* Section header */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 20, background: "rgba(55,138,221,0.1)", border: "1px solid rgba(55,138,221,0.2)", marginBottom: 16 }}>
            <span style={{ color: "#93c5fd", fontSize: 11, fontWeight: 700, letterSpacing: 1.5 }}>THE PEOPLE BEHIND DHIS</span>
          </div>
          <h2 style={{ color: "#fff", fontSize: 38, fontWeight: 800, margin: "0 0 12px", letterSpacing: -0.5 }}>Meet Our Team</h2>
          <p style={{ color: "#8ba8c8", fontSize: 15, margin: 0 }}>District Health Intelligence System Development Team</p>
        </div>

        {/* Cards grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, maxWidth: 1120, margin: "0 auto" }}>
          {TEAM.map((member, idx) => (
            <div
              key={member.name}
              className="team-card"
              style={{
                background: "rgba(20,30,52,0.9)",
                border: `1px solid ${member.border}`,
                borderRadius: 16,
                padding: "24px",
                animationDelay: `${idx * 0.1}s`,
                boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 0px ${member.border}, inset 0 1px 0 rgba(255,255,255,0.04)`,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Top accent line */}
              <div style={{ height: 3, borderRadius: "4px 4px 0 0", background: `linear-gradient(90deg, ${member.color}, transparent)`, position: "absolute", top: 0, left: 0, right: 0 }} />

              {/* Avatar + name */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                <div className="avatar-ring" style={{ width: 52, height: 52, background: member.accent, border: `2px solid ${member.border}`, color: member.color }}>
                  {member.initials}
                </div>
                <div>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{member.name}</div>
                  <div style={{ color: member.color, fontSize: 12, fontWeight: 600 }}>{member.role}</div>
                </div>
              </div>

              {/* Tags */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
                {member.tags.map((tag) => (
                  <span key={tag} className="tag-pill" style={{ background: member.accent, color: member.color, border: `1px solid ${member.border}` }}>
                    {tag}
                  </span>
                ))}
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: `linear-gradient(90deg, ${member.border}, transparent)`, marginBottom: 16 }} />

              {/* Icon tag chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "0 0 20px" }}>
                {member.points.map((pt) => (
                  <span key={pt.text} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, background: member.accent, border: `1px solid ${member.border}`, color: "#cdd8e8", fontSize: 12, fontWeight: 500 }}>
                    <i className={`ti ${pt.icon}`} style={{ fontSize: 13, color: member.color }} aria-hidden="true" />
                    {pt.text}
                  </span>
                ))}
              </div>

              {/* Social links */}
              <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
                <a href={member.github} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#cdd8e8", textDecoration: "none", fontSize: 12, fontWeight: 600, transition: "all 0.2s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#cdd8e8"; }}>
                  <FaGithub size={14} /> GitHub
                </a>
                <a href={member.linkedin} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: "rgba(10,102,194,0.12)", border: "1px solid rgba(10,102,194,0.3)", color: "#60a5fa", textDecoration: "none", fontSize: 12, fontWeight: 600, transition: "all 0.2s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(10,102,194,0.25)"; e.currentTarget.style.color = "#93c5fd"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(10,102,194,0.12)"; e.currentTarget.style.color = "#60a5fa"; }}>
                  <FaLinkedin size={14} /> LinkedIn
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "25px 48px", borderTop: "1px solid rgba(55,138,221,0.15)", background: "rgba(13,21,38,0.95)", textAlign: "center" }}>
        <h3 style={{ color: "#fff", marginBottom: "10px", fontSize: "20px" }}>District Health Intelligence System (DHIS)</h3>
        <p style={{ color: "#8ba8c8", fontSize: "14px", marginBottom: "15px" }}>Real-time health monitoring and disease outbreak tracking system for West Bengal.</p>
        <p style={{ color: "#5b8fc9", fontSize: "12px", margin: 0 }}>© 2026 DHIS Project Team. All Rights Reserved.</p>
      </div>
    </div>
  );
}
