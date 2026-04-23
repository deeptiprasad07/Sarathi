import axios from "axios";

// ✅ FIXED: Connect to Backend running on Port 5000
const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

// 1. CHAT API
export const askCareerQuestion = async (question) => {
  try {
    const res = await api.post("/chat", { message: question });
    return res.data.reply;
  } catch (error) {
    console.error("Chat API Error:", error);
    return "Error: Backend not connected. Check if 'node server.js' is running on Port 5000.";
  }
};

// 2. RESUME API
export const generateResume = async (data) => {
  try {
    const res = await api.post("/generate-resume", { data });
    return res.data.resume;
  } catch (error) {
    console.error("Resume Error:", error);
    return null;
  }
};

// 3. ATS CHECK API
export const checkATS = async ({ resume, job }) => {
  try {
    const res = await api.post("/ats-check", { resume, job });
    return res.data.result;
  } catch (error) {
    console.error("ATS Error:", error);
    return null;
  }
};

// 4. SKILLS API
export const getSkills = async (role) => {
  try {
    const res = await api.post("/skills", { role });
    return res.data.skills;
  } catch (error) {
    console.error("Skills Error:", error);
    return null;
  }
};

// 5. INTERVIEW API
export const getInterviewQuestions = async ({ role, level }) => {
  try {
    const res = await api.post("/interview", { role, level });
    return res.data.questions;
  } catch (error) {
    console.error("Interview Error:", error);
    return null;
  }
};
  export const generatePortfolio = async (data) => {
  const res = await axios.post("/api/generate-portfolio", data);
  return res.data;
};
/* ================= JOB MATCH ================= */
export const getJobMatch = async (resume, jobDesc) => {
  const res = await fetch("/api/job-match", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume, jobDesc }),
  });

  return res.json();
};

/* ================= IMPROVE RESUME ================= */
export const improveResume = async (resume, jobDesc) => {
  const res = await fetch("/api/improve-resume", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume, jobDesc }),
  });

  return res.json();
};
