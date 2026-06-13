import { useEffect, useRef, useState } from "react";
import {
  Activity,
  LayoutDashboard,
  ShieldCheck,
  ArrowRight,
  MapPin,
  AlertTriangle,
} from "lucide-react";

const WB_PATH =
  "M502,99 L499,115 L524,149 L517,195 L533,194 L527,202 L540,220 L502,248 L500,258 L492,258 L481,282 L513,315 L516,338 L498,333 L479,351 L491,371 L487,379 L479,378 L494,407 L498,431 L488,442 L499,448 L500,464 L482,467 L487,493 L467,515 L476,522 L459,524 L460,533 L451,531 L451,542 L443,548 L419,541 L425,563 L405,566 L406,576 L376,564 L362,572 L366,582 L360,593 L319,601 L301,629 L284,622 L282,610 L268,608 L266,621 L246,624 L240,654 L253,669 L266,667 L292,690 L331,693 L320,697 L318,717 L326,727 L341,730 L350,746 L367,752 L362,764 L373,770 L380,786 L359,793 L358,804 L395,816 L399,841 L408,842 L417,828 L424,829 L431,850 L451,854 L458,874 L481,869 L515,847 L530,817 L528,830 L535,827 L547,804 L542,791 L550,803 L542,824 L551,848 L547,864 L556,878 L563,877 L571,860 L575,873 L582,869 L587,835 L593,842 L585,877 L599,874 L607,834 L599,821 L603,813 L604,824 L615,819 L614,873 L626,873 L625,862 L636,878 L634,849 L641,866 L654,870 L664,864 L650,830 L659,824 L654,803 L660,795 L640,737 L642,699 L629,681 L629,667 L644,649 L610,644 L618,610 L610,612 L588,591 L589,563 L609,554 L612,544 L604,527 L607,504 L555,490 L533,476 L515,453 L533,427 L534,414 L553,426 L555,415 L563,413 L570,377 L626,382 L637,362 L616,353 L610,331 L596,339 L581,335 L542,294 L524,297 L519,280 L531,266 L530,248 L549,239 L562,218 L571,218 L565,203 L547,200 L555,181 L560,194 L591,212 L588,231 L606,224 L613,234 L616,226 L638,232 L640,225 L621,213 L627,203 L642,212 L654,248 L676,263 L685,259 L703,269 L714,254 L707,241 L714,241 L713,233 L721,237 L722,223 L737,208 L738,165 L723,159 L709,163 L710,154 L688,152 L676,143 L645,152 L633,136 L622,136 L618,127 L612,131 L611,111 L588,102 L569,102 L554,116 L537,110 L521,114 Z";

// District anchor points, geographically positioned within the WB_PATH outline
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

// A few districts get a "live outbreak" badge — pulsing alert nodes
const OUTBREAK_DISTRICTS = [
  "Kolkata",
  "North 24 Parganas",
  "Malda",
  "Bardhaman",
];

const LEVEL_COLOR = {
  low: "#378ADD",
  med: "#f4b740",
  high: "#ef4444",
};

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
      // Slower floating animation
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
        background:
          "linear-gradient(135deg, #0d1526 0%, #1a2236 50%, #0d1f3c 100%)",
        fontFamily: "system-ui,sans-serif",
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Keyframes for hotspot pulse + outbreak glow */}
      <style>{`
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
        @keyframes red-beep {
          0%, 100% { 
            transform: scale(1); 
            opacity: 1; 
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
          }
          50% { 
            transform: scale(1.3); 
            opacity: 0.8;
            box-shadow: 0 0 20px 8px rgba(239, 68, 68, 0);
          }
        }
        @keyframes blue-pulse {
          0%, 100% { 
            transform: scale(1); 
            opacity: 0.6;
            box-shadow: 0 0 0 0 rgba(55, 138, 221, 0.7);
          }
          50% { 
            transform: scale(1.4); 
            opacity: 0.9;
            box-shadow: 0 0 25px 10px rgba(55, 138, 221, 0);
          }
        }
        .dhis-district-node { transition: r 0.25s ease, fill 0.25s ease, filter 0.25s ease; }
        .dhis-district-group:hover .dhis-district-node { filter: brightness(1.4); }
        .dhis-card-float { animation: dhis-float 6s ease-in-out infinite; }
        .dhis-card-float.delay { animation-delay: 1.4s; }
        .red-beep-dot {
          position: absolute;
          width: 12px;
          height: 12px;
          background: #ef4444;
          border-radius: 50%;
          animation: red-beep 2.5s ease-in-out infinite;
          z-index: 10;
        }
        .blue-pulse-dot {
          position: absolute;
          width: 10px;
          height: 10px;
          background: #378ADD;
          border-radius: 50%;
          animation: blue-pulse 3.5s ease-in-out infinite;
          z-index: 10;
        }
      `}</style>

      {/* Background grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(55,138,221,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(55,138,221,0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />

      {/* Glow effects */}
      <div
        style={{
          position: "absolute",
          top: "-10%",
          right: "5%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(55,138,221,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-10%",
          left: "5%",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(29,158,117,0.10) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Navbar */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 48px",
          position: "relative",
          zIndex: 10,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "linear-gradient(135deg, #378ADD, #1D9E75)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Activity size={20} color="#fff" />
          </div>
          <div>
            <div
              style={{
                color: "#fff",
                fontWeight: 800,
                fontSize: 15,
                letterSpacing: 0.5,
              }}
            >
              DHIS
            </div>
            <div style={{ color: "#5b8fc9", fontSize: 10, letterSpacing: 1 }}>
              HEALTH INTELLIGENCE
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => onNavigate("dashboard")}
            style={{
              padding: "9px 22px",
              borderRadius: 10,
              border: "1px solid rgba(55,138,221,0.4)",
              background: "rgba(55,138,221,0.08)",
              color: "#93c5fd",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all .2s",
            }}
            onMouseEnter={(e) =>
              (e.target.style.background = "rgba(55,138,221,0.2)")
            }
            onMouseLeave={(e) =>
              (e.target.style.background = "rgba(55,138,221,0.08)")
            }
          >
            <LayoutDashboard size={14} /> Dashboard
          </button>
          <button
            onClick={() => onNavigate("admin")}
            style={{
              padding: "9px 22px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #378ADD, #2563eb)",
              color: "#fff",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <ShieldCheck size={14} /> Admin Panel
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 48px 24px",
          flex: 1,
          position: "relative",
          zIndex: 5,
          overflow: "hidden",
        }}
      >
        {/* Left content */}
        <div style={{ maxWidth: 560, flex: 1 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 20,
              background: "rgba(55,138,221,0.12)",
              border: "1px solid rgba(55,138,221,0.25)",
              marginBottom: 24,
            }}
          >
            <MapPin size={13} color="#378ADD" />
            <span style={{ color: "#93c5fd", fontSize: 12, fontWeight: 600 }}>
              West Bengal, India
            </span>
          </div>

          <h1
            style={{
              fontSize: 52,
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.1,
              marginBottom: 20,
            }}
          >
            District{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #378ADD, #1D9E75)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Health
            </span>
            <br />
            Intelligence
            <br />
            System
          </h1>

          <p
            style={{
              fontSize: 16,
              color: "#8ba8c8",
              lineHeight: 1.7,
              marginBottom: 36,
              maxWidth: 440,
            }}
          >
            Real-time district-level health data analytics for West Bengal.
            Monitor disease outbreaks, track hospital capacity, and optimize
            doctor deployment.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              onClick={() => onNavigate("dashboard")}
              style={{
                padding: "14px 32px",
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg, #378ADD, #1D9E75)",
                color: "#fff",
                cursor: "pointer",
                fontSize: 15,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              View Dashboard <ArrowRight size={16} />
            </button>
            <button
              onClick={() => onNavigate("admin")}
              style={{
                padding: "14px 32px",
                borderRadius: 12,
                border: "1px solid rgba(55,138,221,0.35)",
                background: "transparent",
                color: "#93c5fd",
                cursor: "pointer",
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              Admin Login
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 32, marginTop: 48 }}>
            {[
              ["18", "Districts"],
              ["20K+", "Cases Tracked"],
              ["18+", "Diseases"],
            ].map(([v, l]) => (
              <div key={l}>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    background: "linear-gradient(135deg, #378ADD, #1D9E75)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {v}
                </div>
                <div style={{ fontSize: 12, color: "#5b8fc9", marginTop: 2 }}>
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right - Animated West Bengal Map */}
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
            height: "100%",
          }}
        >
          {/* Animated dots above the map */}
          {/* Red beeping dots (outbreak alerts) - Removed as they are now in SVG */}
          
          {/* Blue pulsing dots (monitoring stations) - Removed as they are now in SVG */}

          {/* Outer glow rings with pulsing animation */}
          <div
            style={{
              position: "absolute",
              width: 420,
              height: 420,
              borderRadius: "50%",
              border: "1px solid rgba(55,138,221,0.15)",
              transform: `scale(${1 + Math.abs(Math.sin(pulse * 0.7)) * 0.12})`,
              transition: "transform 0.3s ease-out",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 340,
              height: 340,
              borderRadius: "50%",
              border: "1px solid rgba(55,138,221,0.1)",
              transform: `scale(${1 + Math.abs(Math.sin(pulse * 0.7)) * 0.12})`,
              transition: "transform 0.3s ease-out",
            }}
          />

          <svg
            width="420"
            height="550"
            viewBox="220 80 540 820"
            style={{
              filter: "drop-shadow(0 0 30px rgba(55,138,221,0.3))",
              transform: `translate(${float.x}px, ${float.y}px) rotate(${float.r}deg)`,
              transition: "transform 0.08s linear",
              position: "relative",
            }}
          >
            <defs>
              <radialGradient id="mapGlow" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="#378ADD" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#378ADD" stopOpacity="0" />
              </radialGradient>
              <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="wbFill" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#378ADD" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#1D9E75" stopOpacity="0.10" />
              </linearGradient>
            </defs>

            {/* Background glow behind the map */}
            <ellipse cx="86" cy="116" rx="100" ry="125" fill="url(#mapGlow)" />

            {/* West Bengal state outline */}
            <path
              d={WB_PATH}
              fill="url(#wbFill)"
              stroke="#378ADD"
              strokeWidth="1.4"
              filter="url(#glow)"
            />

            {/* Animated dashed boundary overlay with breathing effect */}
            <path
              d={WB_PATH}
              fill="none"
              stroke="rgba(29,158,117,0.65)"
              strokeWidth="0.7"
              strokeDasharray="3 3"
              style={{
                transform: `scale(${1 + pulse * 0.003})`,
                transformOrigin: "86px 116px",
                transition: "transform 0.8s ease-out",
              }}
            />

            {/* Animated dots as SVG elements on the map */}
            {/* Red beeping dots (outbreak alerts) */}
            <g>
              <circle cx="520" cy="300" r="6" fill="#ef4444" opacity="0.9">
                <animate attributeName="r" values="4;8;4" dur="2.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.6;1" dur="2.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="520" cy="300" r="8" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.5">
                <animate attributeName="r" values="6;14;6" dur="2.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0;0.5" dur="2.5s" repeatCount="indefinite" />
              </circle>
            </g>
            <g>
              <circle cx="500" cy="480" r="6" fill="#ef4444" opacity="0.9">
                <animate attributeName="r" values="4;8;4" dur="2.5s" begin="0.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.6;1" dur="2.5s" begin="0.6s" repeatCount="indefinite" />
              </circle>
              <circle cx="480" cy="480" r="8" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.5">
                <animate attributeName="r" values="6;14;6" dur="2.5s" begin="0.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0;0.5" dur="2.5s" begin="0.6s" repeatCount="indefinite" />
              </circle>
            </g>

            {/* Blue pulsing dots (monitoring stations) */}
            <g>
              <circle cx="550" cy="350" r="5" fill="#378ADD" opacity="0.8">
                <animate attributeName="r" values="4;7;4" dur="3.5s" begin="0.3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.7;1;0.7" dur="3.5s" begin="0.3s" repeatCount="indefinite" />
              </circle>
              <circle cx="350" cy="350" r="7" fill="none" stroke="#378ADD" strokeWidth="1.2" opacity="0.4">
                <animate attributeName="r" values="5;12;5" dur="3.5s" begin="0.3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0;0.4" dur="3.5s" begin="0.3s" repeatCount="indefinite" />
              </circle>
            </g>
            <g>
              <circle cx="580" cy="530" r="5" fill="#378ADD" opacity="0.8">
                <animate attributeName="r" values="4;7;4" dur="3.5s" begin="1s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.7;1;0.7" dur="3.5s" begin="1s" repeatCount="indefinite" />
              </circle>
              <circle cx="380" cy="530" r="7" fill="none" stroke="#378ADD" strokeWidth="1.2" opacity="0.4">
                <animate attributeName="r" values="5;12;5" dur="3.5s" begin="1s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0;0.4" dur="3.5s" begin="1s" repeatCount="indefinite" />
              </circle>
            </g>
            <g>
              <circle cx="500" cy="720" r="5" fill="#378ADD" opacity="0.8">
                <animate attributeName="r" values="4;7;4" dur="3.5s" begin="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.7;1;0.7" dur="3.5s" begin="1.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="500" cy="620" r="7" fill="none" stroke="#378ADD" strokeWidth="1.2" opacity="0.4">
                <animate attributeName="r" values="5;12;5" dur="3.5s" begin="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0;0.4" dur="3.5s" begin="1.5s" repeatCount="indefinite" />
              </circle>
            </g>

            {/* Internal district boundary hints (subtle lines toward Kolkata hub) */}
            {DISTRICTS.map((d, i) => (
              <line
                key={`b-${i}`}
                x1={d.x}
                y1={d.y}
                x2={102}
                y2={189}
                stroke="rgba(55,138,221,0.10)"
                strokeWidth="0.5"
              />
            ))}

            {/* District nodes */}
            {DISTRICTS.map((d) => {
              const isHover = hoveredDistrict === d.name;
              const isOutbreak = OUTBREAK_DISTRICTS.includes(d.name);
              const color = LEVEL_COLOR[d.level];
              return (
                <g
                  key={d.name}
                  className="dhis-district-group"
                  onMouseEnter={() => setHoveredDistrict(d.name)}
                  onMouseLeave={() => setHoveredDistrict(null)}
                  style={{ cursor: "pointer" }}
                >
                  {/* Expanding pulse ring */}
                  <circle
                    cx={d.x}
                    cy={d.y}
                    r="4"
                    fill="none"
                    stroke={color}
                    strokeWidth="1"
                    style={{
                      animation: `dhis-ring-pulse ${isOutbreak ? 1.6 : 2.6}s ease-out infinite`,
                      animationDelay: `${(d.x % 5) * 0.3}s`,
                    }}
                  />

                  {/* Outbreak glow halo */}
                  {isOutbreak && (
                    <circle
                      cx={d.x}
                      cy={d.y}
                      r="9"
                      fill={color}
                      opacity="0.3"
                      style={{
                        animation:
                          "dhis-outbreak-glow 1.8s ease-in-out infinite",
                      }}
                    />
                  )}

                  {/* Core node */}
                  <circle
                    className="dhis-district-node"
                    cx={d.x}
                    cy={d.y}
                    r={isHover ? 5.5 : 3}
                    fill={isHover ? "#1D9E75" : color}
                    filter="url(#glow)"
                  />

                  {isOutbreak && !isHover && (
                    <circle
                      cx={d.x + 4}
                      cy={d.y - 4}
                      r="1.6"
                      fill="#ef4444"
                      filter="url(#glow)"
                    />
                  )}

                  {/* Hover label */}
                  {isHover && (
                    <g
                      style={{
                        transform: `translate(${d.x > 110 ? -(d.name.length * 5.4 + 16) : 8}px, -16px)`,
                        transformOrigin: `${d.x}px ${d.y}px`,
                      }}
                    >
                      <rect
                        x={d.x}
                        y={d.y - 10}
                        width={d.name.length * 5.4 + 16}
                        height={18}
                        rx="4"
                        fill="rgba(13,21,38,0.92)"
                        stroke="rgba(55,138,221,0.3)"
                        strokeWidth="0.5"
                      />
                      <text
                        x={d.x + 6}
                        y={d.y + 3}
                        fill="#fff"
                        fontSize="8"
                        fontWeight="700"
                      >
                        {d.name}
                      </text>
                      <text
                        x={d.x + 6}
                        y={d.y + 12}
                        fill={color}
                        fontSize="6.5"
                        fontWeight="600"
                      >
                        {d.cases.toLocaleString()} cases
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Title */}
            <text
              x="86"
              y="20"
              textAnchor="middle"
              fill="#5b8fc9"
              fontSize="8"
              fontWeight="700"
              letterSpacing="1.5"
              opacity="0.7"
            >
              WEST BENGAL
            </text>
          </svg>

          {/* Floating info cards with enhanced animation */}
          <div
            className="dhis-card-float"
            style={{
              position: "absolute",
              top: "8%",
              right: "2%",
              background: "rgba(26,34,54,0.85)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(55,138,221,0.2)",
              borderRadius: 12,
              padding: "10px 14px",
              minWidth: 140,
              transform: `translateY(${Math.sin(pulse * 0.8) * 6}px)`,
              transition: "transform 0.3s ease-out",
            }}
          >
            <div style={{ fontSize: 10, color: "#5b8fc9", marginBottom: 3 }}>
              ACTIVE DISTRICTS
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#378ADD" }}>
              {DISTRICTS.length}
            </div>
          </div>

          <div
            className="dhis-card-float delay"
            style={{
              position: "absolute",
              bottom: "20%",
              left: "0%",
              background: "rgba(26,34,54,0.85)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(29,158,117,0.2)",
              borderRadius: 12,
              padding: "10px 14px",
              minWidth: 140,
              transform: `translateY(${Math.sin(pulse * 0.6 + 2) * 8}px)`,
              transition: "transform 0.3s ease-out",
            }}
          >
            <div style={{ fontSize: 10, color: "#5b8fc9", marginBottom: 3 }}>
              TOP DISEASE
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1D9E75" }}>
              Dengue
            </div>
          </div>

          <div
            className="dhis-card-float"
            style={{
              position: "absolute",
              bottom: "6%",
              right: "6%",
              background: "rgba(26,34,54,0.88)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 12,
              padding: "10px 14px",
              minWidth: 160,
              display: "flex",
              alignItems: "center",
              gap: 8,
              transform: `translateY(${Math.sin(pulse * 0.7 + 1) * 7}px)`,
              transition: "transform 0.3s ease-out",
            }}
          >
            <AlertTriangle size={16} color="#ef4444" />
            <div>
              <div style={{ fontSize: 10, color: "#5b8fc9", marginBottom: 2 }}>
                LIVE OUTBREAK ALERTS
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>
                {OUTBREAK_DISTRICTS.length} districts
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Team Section */}
      <div style={{padding: "60px 48px", background: "rgba(255,255,255,0.02)", borderTop: "none",}}>
        <h2 style={{color: "#fff", textAlign: "center", fontSize: "36px", marginBottom: "10px",}}>
         Meet Our Team
        </h2>
        <p style={{textAlign: "center", color: "#8ba8c8", marginBottom: "40px",}}>
         District Health Intelligence System Development Team
        </p>
        <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px",}}>
    {/* Santanu */}
      <div
      style={{
        background: "rgba(26,34,54,0.85)",
        padding: "20px",
        borderRadius: "15px",
        textAlign: "center",
      }}
    >
      <h3 style={{ color: "#fff" }}>Santanu Pramanik</h3>
      <p style={{ color: "#378ADD" }}>Project Lead & Full Stack Developer</p>
      <ul>
        <li>Project Architecture</li>
        <li>Team Coordination</li>
        <li>System Integration</li>
        <li>API Development</li>
      </ul>
      <a
        href="https://github.com/Santanu-pramanik"
        target="_blank"
        rel="noreferrer"
        style={{ color: "#1D9E75" }}
      >
        GitHub Profile
      </a>
    </div>

    {/* Rohit */}
    <div
      style={{
        background: "rgba(26,34,54,0.85)",
        padding: "20px",
        borderRadius: "15px",
        textAlign: "center",
      }}
    >
      <h3 style={{ color: "#fff" }}>Rohit Kumar Sahu</h3>
      <p style={{ color: "#378ADD" }}>Backend Developer & Database Engineer</p>
        <ul>
        <li>FastAPI Backend</li>
        <li>Database Management</li>
        <li>Data Modeling</li>
      </ul>
      <a
        href="https://github.com/rohit69-star"
        target="_blank"
        rel="noreferrer"
        style={{ color: "#1D9E75" }}
      >
        GitHub Profile
      </a>
    </div>

    {/* Susmita */}
    <div
      style={{
        background: "rgba(26,34,54,0.85)",
        padding: "20px",
        borderRadius: "15px",
        textAlign: "center",
      }}
    >
      <h3 style={{ color: "#fff" }}>Susmita Mandal</h3>
      <p style={{ color: "#378ADD" }}>
        Frontend Developer & Data Analyst
      </p>
       <ul>
        <li>Dashboard UI Development</li>
        <li>Admin Panel Design</li>
        <li>Charts & Data Visualization</li>
        <li>GitHub Collaboration</li>
      </ul>
      <a
        href="https://github.com/Susmita75"
        target="_blank"
        rel="noreferrer"
        style={{ color: "#1D9E75" }}
      >
        GitHub Profile
      </a>
    </div>
    {/* Priyanka */}
    <div
      style={{
        background: "rgba(26,34,54,0.85)",
        padding: "20px",
        borderRadius: "15px",
        textAlign: "center",
      }}
    >
      <h3 style={{ color: "#fff" }}>Priyanka Adak</h3>
      <p style={{ color: "#378ADD" }}>UI/UX Designer & Frontend Developer</p>
       <ul>
        <li>User Interface Design</li>
        <li>User Experience Planning</li>
        <li>Frontend Components</li>
      </ul>
      <a
        href="https://github.com/Priyanka-Adak"
        target="_blank"
        rel="noreferrer"
        style={{ color: "#1D9E75" }}
      >
        GitHub Profile
      </a>
    </div>
  </div>
</div>
{/* Footer */}
<div
  style={{
    padding: "25px 48px",
    borderTop: "1px solid rgba(55,138,221,0.15)",
    background: "rgba(13,21,38,0.95)",
    textAlign: "center",
  }}
>
  <h3
    style={{
      color: "#fff",
      marginBottom: "10px",
      fontSize: "20px",
    }}
  >
    District Health Intelligence System (DHIS)
  </h3>

  <p
    style={{
      color: "#8ba8c8",
      fontSize: "14px",
      marginBottom: "15px",
    }}
  >
    Real-time health monitoring and disease outbreak tracking system for
    West Bengal.
  </p>

  <p
    style={{
      color: "#5b8fc9",
      fontSize: "12px",
      margin: 0,
    }}
  >
    © 2026 DHIS Project Team. All Rights Reserved.
  </p>
    </div>
    </div>
  );
}
