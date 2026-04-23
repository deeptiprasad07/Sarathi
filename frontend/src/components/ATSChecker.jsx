import axios from "axios";
import { useState, useRef } from "react";
import { checkATS } from "../services/api";
import jsPDF from "jspdf";
 // 🔥 File upload ke li

export default function ATSChecker() {
  const [resume, setResume] = useState("");
  const [job, setJob] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // handleCheck function ke andar prompt ko update karein
const handleCheck = async () => {
  if (!resume || !job) return alert("Please fill both fields");
  setLoading(true);
  
  // 🔥 AI ko specific advice ke liye instruction dena
  const customPrompt = `Analyze this resume for the role of ${job}. 
  1. Give an ATS Score out of 100.
  2. List 5 missing keywords or skills that should be added.
  3. Give a 2-line suggestion to improve the summary.
  Resume: ${resume}`;

  try {
    const data = await checkATS({ resume: customPrompt, job }); // Humne prompt hi resume field mein bhej diya
    setResult(data);
  } catch (error) {
    alert("Error checking ATS.");
  } finally {
    setLoading(false);
  }
};

  // 🔥 PDF Download Logic
  const downloadPDF = () => {
    if (!result) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("ATS Analysis Report", 20, 20);
    doc.setFontSize(10);
    const splitText = doc.splitTextToSize(result, 180);
    doc.text(splitText, 20, 40);
    doc.save("ATS_Report.pdf");
  };

  const handleFileUpload = async (e) => {
  try {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await axios.post(
      "http://localhost:5000/api/upload",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    setResume(res.data.text);
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.msg || "File upload failed");
  }
};

  return (
    <div className="card">
      <h3>ATS Checker</h3>
      
      {/* Resume Input with working Upload Icon */}
      <div style={{ position: "relative", width: "100%" }}>
        <textarea 
          placeholder="Paste resume text here..." 
          value={resume}
          onChange={(e) => setResume(e.target.value)} 
          style={{ paddingBottom: "50px", minHeight: "150px", width: "100%" }}
        />
        
        {/* 🔥 Upload Button inside Textarea Corner */}
        <div 
          onClick={() => fileInputRef.current.click()}
          style={{
            position: "absolute",
            right: "10px",
            bottom: "10px",
            cursor: "pointer",
            background: "var(--tab-active)",
            color: "black",
            padding: "5px 12px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            zIndex: 10,
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
          }}
        >
          📎 Upload File
        </div>

        <input 
          type="file" 
          hidden 
          ref={fileInputRef} 
          accept=".txt,.md,.rtf"
          onChange={handleFileUpload} 
        />
      </div>

      <input 
        placeholder="Target Job Role (e.g. Frontend Engineer)" 
        value={job}
        onChange={(e) => setJob(e.target.value)} 
      />
      
      <button onClick={handleCheck} disabled={loading} style={{ width: "100%" }}>
        {loading ? "Analyzing..." : "Check ATS Score"}
      </button>

      {/* Output Window with Download Button */}
      <div className="tool-output-box">
        <div className="tool-output-header">
          <span>ATS Score & Analysis Report</span>
          {result && (
            <button 
              onClick={downloadPDF} 
              style={{ 
                marginTop: 0, 
                padding: "5px 12px", 
                fontSize: "12px", 
                background: "#22c55e", 
                color: "white",
                fontWeight: "bold" 
              }}
            >
              📥 Download PDF
            </button>
          )}
        </div>
        <div className="tool-output-content" style={{ whiteSpace: "pre-wrap" }}>
          {result || "Analysis report will appear here..."}
        </div>
      </div>
    </div>
  );
}