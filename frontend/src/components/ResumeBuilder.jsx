import { useState, useRef } from "react";
import {
  generateResume,
  generatePortfolio,
  getJobMatch,
  improveResume
} from "../services/api";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function ResumeBuilder() {
  const resumeRef = useRef();
  const [selectedTheme, setSelectedTheme] = useState("classic");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    linkedin: "",
    github: "",
    skills: "",
    experience: ""
  });

  const [resume, setResume] = useState("");
  const [loading, setLoading] = useState(false);
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [jobDesc, setJobDesc] = useState("");
  const [jobMatch, setJobMatch] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [improveLoading, setImproveLoading] = useState(false);

  /* ================= API HANDLERS ================= */
  const handleGenerate = async () => {
    if (!form.name) return alert("Enter name");
    setLoading(true);
    const result = await generateResume(form);
    setResume(result);
    setLoading(false);
  };

  const handlePortfolio = async () => {
    setPortfolioLoading(true);
    const data = await generatePortfolio(form);
    setPortfolioUrl(data.url);
    setPortfolioLoading(false);
  };

  const handleJobMatch = async () => {
    setMatchLoading(true);
    const data = await getJobMatch(resume, jobDesc);
    setJobMatch(data);
    setMatchLoading(false);
  };

  const handleImprove = async () => {
    setImproveLoading(true);
    const data = await improveResume(resume, jobDesc);
    setResume(data.improved);
    setImproveLoading(false);
  };

  /* ================= DOWNLOAD PDF (CLEAN FILTER) ================= */
  const downloadPDF = async () => {
    const element = resumeRef.current;
    
    // Scale 3 ensures high resolution for printing
    const canvas = await html2canvas(element, { 
      scale: 3, 
      useCORS: true,
      backgroundColor: "#ffffff", // Forces a white background even in dark mode
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = 210;
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${form.name.replace(/\s+/g, '_')}_Resume.pdf`);
  };

  /* ================= SMART CONTENT FILTER ================= */
  const formatResume = () => {
    const lines = resume.split("\n");
    
    return lines.map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return null; // Filters out empty blank lines

      // Detect Section Header (All Caps)
      const isHeader = trimmed.toUpperCase() === trimmed && trimmed.length < 50 && trimmed.length > 2;

      if (isHeader) {
        // HIDE EMPTY SECTIONS: Check if there is any content before the next header
        let hasContentUnderneath = false;
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j].trim();
          if (nextLine === "") continue;
          if (nextLine.toUpperCase() === nextLine) break; // Reached another header
          hasContentUnderneath = true; 
          break;
        }

        if (!hasContentUnderneath) return null; // Delete the header if section is empty
        return <h3 key={i} className="section-header">{trimmed}</h3>;
      }

      return <p key={i} className="content-text">{trimmed}</p>;
    });
  };

  const getThemeClass = () => {
    if (selectedTheme === "modern") return "resume-modern";
    if (selectedTheme === "ats") return "resume-ats";
    return "resume-classic";
  };

  return (
    <div className="card">
      <h3>AI Resume Builder</h3>
      
      <div className="resume-input-grid">
        <input placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/>
        <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}/>
        <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}/>
        <input placeholder="LinkedIn" value={form.linkedin} onChange={e => setForm({ ...form, linkedin: e.target.value })}/>
        <input placeholder="GitHub" value={form.github} onChange={e => setForm({ ...form, github: e.target.value })}/>
      </div>
      
      <textarea placeholder="Skills..." onChange={e => setForm({ ...form, skills: e.target.value })}/>
      <textarea placeholder="Experience..." onChange={e => setForm({ ...form, experience: e.target.value })}/>
      <textarea placeholder="Job Description..." onChange={e => setJobDesc(e.target.value)}/>

      <div className="btn-row">
        <button onClick={handleGenerate}>{loading ? "Generating..." : "Generate Resume"}</button>
        <button onClick={handlePortfolio}>🌐 Portfolio</button>
        <button onClick={handleJobMatch}>🎯 Job Match</button>
        <button onClick={handleImprove}>✨ Improve</button>
      </div>

      {resume && (
        <div className="resume-output-box">
          <div className="resume-output-header">
            <span>Template Selector</span>
            <div className="theme-buttons">
              <button className={selectedTheme === 'classic' ? 'btn-active' : ''} onClick={() => setSelectedTheme("classic")}>Classic</button>
              <button className={selectedTheme === 'modern' ? 'btn-active' : ''} onClick={() => setSelectedTheme("modern")}>Modern</button>
              <button className={selectedTheme === 'ats' ? 'btn-active' : ''} onClick={() => setSelectedTheme("ats")}>ATS</button>
              <button onClick={downloadPDF} className="download-btn">⬇ Download PDF</button>
            </div>
          </div>

          <div className="resume-preview-wrapper" style={{background: '#555', padding: '40px 0'}}>
            {/* THIS IS THE TARGET: Only content inside this div will be in the PDF */}
            <div 
              ref={resumeRef} 
              className={`resume-paper ${getThemeClass()}`}
              style={{ margin: '0 auto' }}
            >
              <div className="header-section">
                <h1>{form.name || "YOUR NAME"}</h1>
                <div className="contact-info">
                  {/* Smart Filters: Only render if data exists */}
                  {form.email && <span>{form.email}</span>}
                  {form.phone && <span> | {form.phone}</span>}
                  {form.linkedin && <span> | {form.linkedin}</span>}
                  {form.github && <span> | {form.github}</span>}
                </div>
              </div>
              <div className="body-section">
                {formatResume()}
              </div>
            </div>
          </div>
        </div>
      )}

      {portfolioUrl && (
        <div className="tool-output-box">
          <h3>🌐 AI Portfolio</h3>
          <iframe src={portfolioUrl} width="100%" height="500px" title="Portfolio" />
        </div>
      )}
    </div>
  );
}

export default ResumeBuilder;