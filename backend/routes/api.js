const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const db = require("../config/db"); // Database connection

console.log("Loaded Key:", process.env.OPENROUTER_API_KEY);

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:5000",
    "X-Title": "AI Career Assistant",
  },
});

// ================= 1. DATABASE SAVE (FIXED 1062 ERROR) =================
// Yeh route roadmap aur interview questions dono ko save karega
router.post("/save-roadmap", (req, res) => {
  const { role, content } = req.body;

  if (!role || !content) {
    return res.status(400).json({ error: "Role and content are required" });
  }

  // ON DUPLICATE KEY UPDATE: Agar role pehle se exist karta hai toh 1062 error nahi aayega,
  // balki purana content naye content se update ho jayega.
  const sql = `
    INSERT INTO roadmaps (ROLE, CONTENT) 
    VALUES (?, ?) 
    ON DUPLICATE KEY UPDATE CONTENT = VALUES(CONTENT)
  `;

  db.query(sql, [role, content], (err, result) => {
    if (err) {
      console.error("Database Error:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: "Success", details: result });
  });
});

// ================= 2. CHAT AI =================
router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: message }],
    });
    res.json({ reply: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Chat AI failed" });
  }
});

// ================= 3. RESUME GENERATOR =================
router.post("/generate-resume", async (req, res) => {
  try {
    const { data } = req.body;
    const prompt = `Create a professional ATS friendly resume using this data: ${JSON.stringify(data)}`;
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });
    res.json({ resume: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Resume generation failed" });
  }
});

// ================= 4. ATS CHECKER =================
router.post("/ats-check", async (req, res) => {
  try {
    const { resume } = req.body;
    const prompt = `Analyze this resume for ATS score. Give: ATS score %, Missing keywords, Improvements. Resume: ${resume}`;
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });
    res.json({ result: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "ATS check failed" });
  }
});

// ================= 5. SKILL SUGGESTION =================
router.post("/skills", async (req, res) => {
  try {
    const { role } = req.body;
    const prompt = `Suggest important technical and soft skills required for ${role}`;
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });
    res.json({ skills: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Skill suggestion failed" });
  }
});

// ================= 6. INTERVIEW QUESTIONS =================
router.post("/interview", async (req, res) => {
  try {
    const { role } = req.body;
    const prompt = `Generate top interview questions with answers for ${role}`;
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });
    res.json({ questions: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Interview questions failed" });
  }
});
//ask-career route for video mock interview

router.post("/ask-career", async (req, res) => {
  try {
    const { message, isFinal } = req.body;
    
    // System prompt ko interview recruiter ki tarah set kiya hai
    const systemPrompt = isFinal 
      ? "You are an interviewer. Provide a final score out of 10 and brief feedback. Use Indian English or a mix of Hindi and English (Hinglish)."
      : "You are a professional recruiter in India. Ask one short, technical interview question. You can ask in Indian English or Hindi if the user prefers.";

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
    });

    res.json({ reply: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "AI Interview failed" });
  }
});

// ================= 7. PORTFOLIO GENERATION =================
router.post("/generate-portfolio", async (req, res) => {
  try {
    const { name, skills, experience } = req.body;
    if (!name) return res.status(400).json({ msg: "Name is required" });

    const fileName = `${name.replace(/\s+/g, "_")}_portfolio.html`;
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${name} Portfolio</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <style>
        body{font-family:Arial;padding:40px;background:#f9fafb}
        h1{color:#4f46e5}
        .box{margin-bottom:25px}
      </style>
    </head>
    <body>
      <h1>${name}</h1>
      <div class="box">
        <h2>Skills</h2>
        <p>${skills}</p>
      </div>
      <div class="box">
        <h2>Experience</h2>
        <p>${experience}</p>
      </div>
    </body>
    </html>
    `;

    const filePath = `uploads/${fileName}`;
    require("fs").writeFileSync(filePath, html);

    res.json({ url: `http://localhost:5000/${filePath}` });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Portfolio generation failed" });
  }
});

module.exports = router;