import { useState } from "react"
import axios from "axios"
import {
  Bot, Send, Stethoscope, MessageSquare, X, Minimize2, Maximize2,
  AlertCircle, CheckCircle2, Loader, ChevronRight
} from "lucide-react"

const API = "https://dhis-backend.onrender.com"

export default function AIAssistant({ selectedDistrict, districtName, districts }) {
  const [activeTab, setActiveTab] = useState("chat")
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  // Chat state
  const [messages, setMessages] = useState([
    { role: "assistant", text: `Hello! I'm DHIS AI Assistant. I can answer questions about health data in ${districtName || "your district"}. Ask me anything!` }
  ])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)

  // Symptom checker state
  const [symptoms, setSymptoms] = useState("")
  const [symptomResult, setSymptomResult] = useState(null)
  const [symptomLoading, setSymptomLoading] = useState(false)

  const sendChat = async () => {
    if (!chatInput.trim()) return
    const userMsg = chatInput.trim()
    setChatInput("")
    setMessages(prev => [...prev, { role: "user", text: userMsg }])
    setChatLoading(true)

    try {
      const res = await axios.post(`${API}/ai/chat`, {
        question: userMsg,
        district_id: selectedDistrict,
        district_name: districtName
      })
      setMessages(prev => [...prev, { role: "assistant", text: res.data.response }])
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Sorry, I couldn't process your request. Please try again." }])
    }
    setChatLoading(false)
  }

  const checkSymptoms = async () => {
    if (!symptoms.trim()) return
    setSymptomLoading(true)
    setSymptomResult(null)
    try {
      const res = await axios.post(`${API}/ai/symptom-check`, {
        symptoms: symptoms,
        district: districtName
      })
      setSymptomResult(res.data.response)
    } catch {
      setSymptomResult("Sorry, couldn't analyze symptoms. Please try again.")
    }
    setSymptomLoading(false)
  }

  const quickQuestions = [
    "What is the top disease here?",
    "How many doctors are available?",
    "Which hospital should I go to?",
    "What are the disease trends?"
  ]

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)}
        style={{ position:"fixed", bottom:24, right:24, width:56, height:56, borderRadius:"50%",
          background:"linear-gradient(135deg, #378ADD, #1D9E75)", border:"none", cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:"0 4px 20px rgba(55,138,221,0.4)", zIndex:1000 }}>
        <Bot size={26} color="#fff" />
      </button>
    )
  }

  return (
    <div style={{ position:"fixed", bottom:24, right:24, width:380, zIndex:1000,
      borderRadius:20, overflow:"hidden", boxShadow:"0 8px 40px rgba(0,0,0,0.2)",
      border:"1px solid rgba(55,138,221,0.2)", background:"#fff" }}>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg, #1a2236, #2563eb)", padding:"14px 18px",
        display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:10, background:"rgba(255,255,255,0.15)",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Bot size={18} color="#fff" />
          </div>
          <div>
            <div style={{ color:"#fff", fontWeight:700, fontSize:14 }}>DHIS AI Assistant</div>
            <div style={{ color:"#93c5fd", fontSize:11 }}>{districtName} Health Data</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          <button onClick={() => setIsMinimized(!isMinimized)}
            style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:6, padding:"5px", cursor:"pointer", color:"#fff" }}>
            {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </button>
          <button onClick={() => setIsOpen(false)}
            style={{ background:"rgba(255,255,255,0.1)", border:"none", borderRadius:6, padding:"5px", cursor:"pointer", color:"#fff" }}>
            <X size={14} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Tabs */}
          <div style={{ display:"flex", background:"#f8fafc", borderBottom:"1px solid #e5e7eb" }}>
            <button onClick={() => setActiveTab("chat")}
              style={{ flex:1, padding:"10px", border:"none", cursor:"pointer", fontSize:13, fontWeight:600,
                background: activeTab==="chat" ? "#fff" : "transparent",
                color: activeTab==="chat" ? "#378ADD" : "#888",
                borderBottom: activeTab==="chat" ? "2px solid #378ADD" : "2px solid transparent",
                display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
              <MessageSquare size={14} /> Health Chat
            </button>
            <button onClick={() => setActiveTab("symptom")}
              style={{ flex:1, padding:"10px", border:"none", cursor:"pointer", fontSize:13, fontWeight:600,
                background: activeTab==="symptom" ? "#fff" : "transparent",
                color: activeTab==="symptom" ? "#1D9E75" : "#888",
                borderBottom: activeTab==="symptom" ? "2px solid #1D9E75" : "2px solid transparent",
                display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
              <Stethoscope size={14} /> Symptom Check
            </button>
          </div>

          {/* Chat Tab */}
          {activeTab === "chat" && (
            <div style={{ display:"flex", flexDirection:"column", height:400 }}>
              {/* Messages */}
              <div style={{ flex:1, overflowY:"auto", padding:"14px", display:"flex", flexDirection:"column", gap:10 }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ display:"flex", justifyContent: msg.role==="user" ? "flex-end" : "flex-start" }}>
                    {msg.role === "assistant" && (
                      <div style={{ width:26, height:26, borderRadius:8, background:"linear-gradient(135deg, #378ADD, #1D9E75)",
                        display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginRight:8, marginTop:2 }}>
                        <Bot size={13} color="#fff" />
                      </div>
                    )}
                    <div style={{ maxWidth:"75%", padding:"10px 14px", borderRadius: msg.role==="user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                      background: msg.role==="user" ? "linear-gradient(135deg, #378ADD, #2563eb)" : "#f1f5f9",
                      color: msg.role==="user" ? "#fff" : "#1a2236", fontSize:13, lineHeight:1.6 }}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:26, height:26, borderRadius:8, background:"linear-gradient(135deg, #378ADD, #1D9E75)",
                      display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Bot size={13} color="#fff" />
                    </div>
                    <div style={{ padding:"10px 14px", borderRadius:"14px 14px 14px 4px", background:"#f1f5f9",
                      display:"flex", alignItems:"center", gap:6, color:"#888", fontSize:13 }}>
                      <Loader size={13} style={{ animation:"spin 1s linear infinite" }} /> Thinking...
                    </div>
                  </div>
                )}
              </div>

              {/* Quick questions */}
              <div style={{ padding:"8px 14px", borderTop:"1px solid #f1f5f9", display:"flex", gap:6, flexWrap:"wrap" }}>
                {quickQuestions.map((q, i) => (
                  <button key={i} onClick={() => { setChatInput(q); }}
                    style={{ padding:"4px 10px", borderRadius:20, border:"1px solid #e5e7eb", background:"#f8fafc",
                      fontSize:11, color:"#555", cursor:"pointer", display:"flex", alignItems:"center", gap:3 }}>
                    <ChevronRight size={10} /> {q}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div style={{ padding:"12px 14px", borderTop:"1px solid #e5e7eb", display:"flex", gap:8 }}>
                <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendChat()}
                  placeholder="Ask about health data..."
                  style={{ flex:1, padding:"9px 12px", borderRadius:10, border:"1.5px solid #e5e7eb",
                    fontSize:13, outline:"none" }} />
                <button onClick={sendChat} disabled={chatLoading}
                  style={{ width:38, height:38, borderRadius:10, background:"#378ADD", border:"none",
                    cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Send size={15} color="#fff" />
                </button>
              </div>
            </div>
          )}

          {/* Symptom Tab */}
          {activeTab === "symptom" && (
            <div style={{ padding:16, height:400, overflowY:"auto" }}>
              <div style={{ fontSize:13, color:"#555", marginBottom:12, lineHeight:1.6 }}>
                Describe your symptoms and I'll suggest possible conditions and nearby hospitals.
              </div>

              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:12, color:"#555", fontWeight:600, display:"block", marginBottom:6 }}>
                  Your Symptoms
                </label>
                <textarea value={symptoms} onChange={e => setSymptoms(e.target.value)}
                  placeholder="e.g. fever, headache, body pain, rash..."
                  rows={3}
                  style={{ width:"100%", padding:"10px 12px", borderRadius:10, border:"1.5px solid #e5e7eb",
                    fontSize:13, resize:"none", outline:"none", boxSizing:"border-box" }} />
              </div>

              <button onClick={checkSymptoms} disabled={symptomLoading || !symptoms.trim()}
                style={{ width:"100%", padding:"10px", borderRadius:10,
                  background: symptomLoading ? "#93c5fd" : "linear-gradient(135deg, #1D9E75, #059669)",
                  color:"#fff", border:"none", cursor:"pointer", fontSize:14, fontWeight:600,
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:14 }}>
                {symptomLoading ? <><Loader size={15} /> Analyzing...</> : <><Stethoscope size={15} /> Check Symptoms</>}
              </button>

              {symptomResult && (
                <div style={{ background:"#f0fdf4", borderRadius:12, padding:"14px 16px",
                  border:"1px solid #bbf7d0" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10,
                    fontSize:13, fontWeight:700, color:"#15803d" }}>
                    <CheckCircle2 size={15} /> AI Analysis Result
                  </div>
                  <div style={{ fontSize:13, color:"#333", lineHeight:1.8, whiteSpace:"pre-line" }}>
                    {symptomResult}
                  </div>
                  <div style={{ marginTop:12, padding:"8px 12px", borderRadius:8, background:"#fef2f2",
                    border:"1px solid #fecaca", display:"flex", alignItems:"flex-start", gap:6 }}>
                    <AlertCircle size={13} color="#b91c1c" style={{ flexShrink:0, marginTop:1 }} />
                    <span style={{ fontSize:11, color:"#b91c1c", lineHeight:1.5 }}>
                      This is AI-generated advice only. Please consult a qualified doctor for proper diagnosis.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
