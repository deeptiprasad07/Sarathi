import { useState, useRef } from "react";
import { getInterviewQuestions, askCareerQuestion } from "../services/api";
import axios from "axios"; 
import jsPDF from "jspdf"; 

export default function Interview() {
  const [role, setRole] = useState("");
  const [level, setLevel] = useState(""); 
  const [questions, setQuestions] = useState("");
  const [isMcq, setIsMcq] = useState(false);
  const [isRoadmap, setIsRoadmap] = useState(false); 
  const [loading, setLoading] = useState(false);
  
  const [isVideoMode, setIsVideoMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isCamOn, setIsCamOn] = useState(true);
  const videoRef = useRef(null);
  const streamRef = useRef(null); 

  const speak = (text) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN";
    utterance.rate = 0.9; // Thoda slow for clarity
    window.speechSynthesis.speak(utterance);
  };

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Camera access denied.");
    }
  };

  const stopInterview = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    window.speechSynthesis.cancel();
    setIsVideoMode(false);
    setIsListening(false);
    setQuestions("");
  };

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsCamOn(videoTrack.enabled);
    }
  };

  const saveToDB = async (content) => {
    if (!role) return;
    try {
      await axios.post("http://localhost:5000/api/save-roadmap", {
        role: role,
        content: content
      });
    } catch (e) {
      console.warn("DB Save background error - Check unique constraint on ROLE");
    }
  };

  const handleGenerate = async (type = "questions") => {
    if (!role) return alert("Please enter a job role");
    stopInterview(); 
    setLoading(true);
    
    let customRole = "";
    if (type === "roadmap") {
      setIsRoadmap(true);
      setIsMcq(false);
      customRole = `Create a detailed 7-day learning roadmap for a ${role} (${level || 'any'} level). Format Day 1 to Day 7.`;
    } else {
      setIsRoadmap(false);
      customRole = isMcq 
        ? `${role} for ${level || 'any'} level (Quiz format with 4 options)` 
        : `${role} for ${level || 'any'} level`;
    }
    
    try {
      const data = await getInterviewQuestions({ role: customRole, level });
      setQuestions(data);
      saveToDB(data); // Background save
    } catch (error) {
      alert("Error generating content.");
    } finally {
      setLoading(false);
    }
  };

 // --- 3. Video Mock Logic (Improved) ---
  const handleVideoInterview = async () => {
    if (!role) return alert("Please enter a job role");
    
    // UI reset aur loading state
    setIsVideoMode(true);
    setQuestions("AI Recruiter is joining...");
    
    try {
      await startVideo(); // Camera start
      
      // AI se pehla sawal mangna
      const response = await axios.post("http://localhost:5000/api/ask-career", {
        message: `Act as a recruiter. Ask me the first interview question for a ${role} position.`
      });
      
      const firstQuestion = response.data.reply;
      setQuestions(firstQuestion);
      speak(firstQuestion); // AI awaz mein bolega
      saveToDB(`INTERVIEW START: ${firstQuestion}`); // DB mein save
      
    } catch (e) {
      console.error("Video Interview Error:", e);
      alert("Could not start interview. Check if Backend is running.");
    }
  };

  const handleAnswer = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Your browser does not support voice input.");

    const recognition = new SpeechRecognition();
    recognition.lang = "hi-IN";
    recognition.continuous = false; // Ek bar mein ek answer

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = async (event) => {
      const answer = event.results[0][0].transcript;
      setIsListening(false);
      setQuestions("AI is analyzing your answer...");

      try {
        // Answer ko evaluate karna aur naya sawal puchna
        const response = await axios.post("http://localhost:5000/api/ask-career", {
          message: `Candidate answered: "${answer}" to the question: "${questions}". Briefly give feedback and ask the next question for ${role}.`
        });

        const nextStep = response.data.reply;
        setQuestions(nextStep);
        speak(nextStep);
        saveToDB(`INTERVIEW PROGRESS: ${nextStep}`); 
      } catch (e) {
        console.error("Error getting next question:", e);
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };

  const downloadPDF = () => {
    if (!questions) return;
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    let cursorY = 40; 

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(isRoadmap ? `7-Day Roadmap: ${role}` : `Interview Prep: ${role}`, margin, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const splitText = doc.splitTextToSize(questions, 170);

    splitText.forEach((line) => {
      if (cursorY > pageHeight - margin) {
        doc.addPage();
        cursorY = margin; 
      }
      doc.text(line, margin, cursorY);
      cursorY += 7; 
    });

    const fileName = `${isRoadmap ? "Roadmap" : "Interview"}_${role.replace(/\s+/g, "_")}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="card">
      <h3>Interview & Career Assistant</h3>
      <input placeholder="Job role" value={role} onChange={(e) => setRole(e.target.value)} disabled={isVideoMode} />
      <input placeholder="Level" value={level} onChange={(e) => setLevel(e.target.value)} disabled={isVideoMode} />

      <div className="nav-right" style={{ justifyContent: "center", marginTop: "10px", gap: "10px", flexWrap: "wrap" }}>
        {!isVideoMode ? (
          <>
            <button onClick={() => handleGenerate("questions")} disabled={loading}>Generate Q&A</button>
            <button onClick={() => handleGenerate("roadmap")} style={{ background: "#6366f1", color: "white" }}>🚀 7-Day Roadmap</button>
            <button onClick={handleVideoInterview} style={{ background: "#ef4444", color: "white" }}>📹 Video Mock</button>
            <button className={`mcq-btn ${isMcq ? 'active' : ''}`} onClick={() => setIsMcq(!isMcq)} style={{ background: isMcq ? "var(--tab-hover)" : "var(--tab-bg)" }}>
              {isMcq ? "📝 Quiz: ON" : "📝 Quiz: OFF"}
            </button>
          </>
        ) : (
          <button onClick={stopInterview} style={{ background: "#374151", color: "white", padding: "10px 20px" }}>❌ Exit Interview</button>
        )}
      </div>

      <div className="tool-output-box">
        <div className="tool-output-header" style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{isVideoMode ? "LIVE SESSION" : "OUTPUT WINDOW"}</span>
          {questions && !isVideoMode && <button onClick={downloadPDF} style={{ background: "#22c55e", color: "white" }}>📥 PDF</button>}
        </div>
        
        <div className="tool-output-content" style={{ whiteSpace: "pre-wrap" }}>
          {isVideoMode && (
            <div style={{ position: "relative" }}>
              <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", borderRadius: "10px", marginBottom: "10px", background: "#000", transform: "scaleX(-1)" }} />
              <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
                <button onClick={toggleCamera} style={{ flex: 1, background: isCamOn ? "#4b5563" : "#ef4444" }}>{isCamOn ? "📷 Cam ON" : "📷 Cam OFF"}</button>
                <button onClick={handleAnswer} disabled={isListening} style={{ flex: 2, background: isListening ? "red" : "#22c55e" }}>{isListening ? "🎙️ Listening..." : "🎤 Speak Answer"}</button>
              </div>
            </div>
          )}
          <p style={{ fontSize: isVideoMode ? "1.1rem" : "1rem", fontWeight: isVideoMode ? "bold" : "normal" }}>
            {questions || "Results will appear here..."}
          </p>
        </div>
      </div>
    </div>
  );
}