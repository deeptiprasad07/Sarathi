import { useState } from "react";
import { getSkills } from "../services/api";

export default function Skills() {
  const [role, setRole] = useState("");
  const [mySkills, setMySkills] = useState(""); 
  const [skills, setSkills] = useState("");
  const [percent, setPercent] = useState(0); // 🔥 Match percentage ke liye state
  const [loading, setLoading] = useState(false);

  // --- 1. Basic Skill Suggestions (Purana Feature) ---
  const handleGet = async () => {
    if (!role) return alert("Enter role");
    setLoading(true);
    setPercent(0); // Reset bar
    try {
      const data = await getSkills(role);
      setSkills(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  // --- 2. Advanced Skill Gap Analysis (With Progress Bar) ---
  const handleAnalysis = async () => {
    if (!role || !mySkills) return alert("Please enter both Role and Your Skills");
    setLoading(true);
    setPercent(0); // Reset bar animation se pehle
    
    // AI instruction for matching logic
    const prompt = `I want to be a ${role}. My current skills are: ${mySkills}. 
    1. List missing critical skills.
    2. Give a percentage match score (Format: MATCH_SCORE: [number]%).
    3. Suggest top 3 resources to learn missing skills.`;

    try {
      const data = await getSkills(prompt);
      setSkills(data);

      // 🔥 Response se percentage nikaalne ka logic
      const match = data.match(/MATCH_SCORE:\s*(\d+)/);
      if (match) {
        setPercent(parseInt(match[1]));
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div className="card">
      <h3>Skill Development & Analysis</h3>
      
      {/* Role Input */}
      <input 
        placeholder="Target Job Role (e.g. Frontend Developer)" 
        value={role} 
        onChange={(e) => setRole(e.target.value)} 
      />

      {/* User's Skills Input */}
      <textarea 
        placeholder="Enter your current skills (e.g. HTML, CSS, React)" 
        value={mySkills}
        onChange={(e) => setMySkills(e.target.value)}
        style={{
          width: "100%", 
          minHeight: "80px", 
          marginTop: "10px", 
          padding: "10px",
          borderRadius: "8px",
          background: "rgba(255,255,255,0.2)", 
          color: "var(--text)"
        }}
      />

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
        <button onClick={handleGet} disabled={loading} style={{ flex: 1 }}>
          {loading ? "..." : "Get Required Skills"}
        </button>
        
        <button 
          onClick={handleAnalysis} 
          disabled={loading} 
          style={{ flex: 1, background: "#6366f1", color: "white" }}
        >
          {loading ? "..." : "Analyze Skill Gap"}
        </button>
      </div>

      {/* 🔥 PROGRESS BAR (Visual Analysis) */}
      {percent > 0 && (
        <div style={{ marginTop: "20px", textAlign: "left" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{fontWeight: "bold", fontSize: "14px"}}>Skill Readiness:</span>
            <span style={{fontWeight: "bold", color: "#6366f1"}}>{percent}% Match</span>
          </div>
          <div style={{ width: "100%", background: "rgba(0,0,0,0.1)", borderRadius: "10px", height: "12px", overflow: "hidden" }}>
            <div 
              style={{ 
                width: `${percent}%`, 
                height: "100%", 
                background: "linear-gradient(90deg, #6366f1, #22c55e)", 
                transition: "width 1.5s ease-in-out" 
              }} 
            />
          </div>
          <p style={{fontSize: "12px", marginTop: "6px", opacity: 0.8}}>
            Gap detected: <strong>{100 - percent}%</strong>. Check the report below to bridge it!
          </p>
        </div>
      )}

      {/* Output Window */}
      <div className="tool-output-box" style={{ marginTop: "20px" }}>
        <div className="tool-output-header">Skill Analysis Report</div>
        <div className="tool-output-content" style={{ whiteSpace: "pre-wrap" }}>
          {skills || "Your personalized report will appear here..."}
        </div>
      </div>
    </div>
  );
}