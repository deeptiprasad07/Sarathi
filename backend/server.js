const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const db = require("./config/db");
const { parse } = require("path/posix");

const app = express();
app.use(cors());
app.use(express.json());

/* ----------------- Upload Folder ----------------- */
const uploadDir = path.join(__dirname, "uploads/career_docs");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use("/uploads", express.static("uploads"));

/* ----------------- Multer Config ----------------- */
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed =
      file.mimetype === "application/pdf" ||
      file.mimetype === "text/plain" ||
      file.mimetype === "text/markdown" ||
      file.mimetype === "application/rtf" ||
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    allowed ? cb(null, true) : cb(new Error("Unsupported file type"), false);
  },
});

/* ----------------- Upload API ----------------- */
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    console.log("📄 File received:", req.file.originalname);
    console.log("📦 MIME:", req.file.mimetype);

    let extractedText = "";

    /* ---------- PDF ---------- */
if (req.file.mimetype === "application/pdf") {
  try {
    const data = await pdfParse(req.file.buffer);   // call pdfParse directly
    if (data.text && data.text.trim().length > 30) {
      extractedText = data.text;
    } else {
      extractedText =
        "⚠ Scanned PDF detected. Please upload a text-based PDF or DOCX.";
    }
  } catch (err) {
    console.error("❌ PDF parse error:", err.message);
    return res.status(500).json({ msg: "Invalid or corrupted PDF" });
  }
}

    /* ---------- DOCX ---------- */
    else if (
      req.file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      try {
        const result = await mammoth.extractRawText({ buffer: req.file.buffer });
        extractedText = result.value;
      } catch (err) {
        console.error("❌ DOCX parse error:", err.message);
        return res.status(500).json({ msg: "Error reading DOCX file" });
      }
    } else {
      extractedText = req.file.buffer.toString("utf-8");
    }

    /* ---------- CLEAN TEXT ---------- */
    extractedText = extractedText
      .replace(/\n/g, " ")
      .replace(/[^\x20-\x7E]/g, "");

    /* ---------- SAVE BACKUP ---------- */
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    const fileName = `${Date.now()}-${req.file.originalname}`;
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, req.file.buffer);

    res.json({ text: extractedText });
  } catch (error) {
    console.error("🔥 Upload API Crash:", error);
    res.status(500).json({ msg: "Server failed to process file" });
  }
});

/* ----------------- Save Roadmap ----------------- */
app.post("/api/save-roadmap", (req, res) => {
  const { role, content } = req.body;
  const sql = "INSERT INTO roadmaps (role, content) VALUES (?, ?)";

  db.query(sql, [role, content], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ msg: "Success" });
  });
});
app.post("/api/job-match", async (req, res) => {
  const { resume, jobDesc } = req.body;

  if (!resume || !jobDesc) {
    return res.status(400).json({ msg: "Missing data" });
  }

  // 🧠 Simple logic (replace later with AI)
  const match = Math.min(95, (resume.length + jobDesc.length) / 35);

  res.json({
    match: Math.round(match),
    missingSkills: ["Docker", "AWS", "CI/CD"],
    tips: ["Add more measurable achievements", "Use job keywords"]
  });
});


/* ----------------- Routes ----------------- */
app.use("/api", require("./routes/api"));
app.use("/api/auth", require("./routes/auth"));

/* ----------------- Global Error Safety ----------------- */
app.use((err, req, res, next) => {
  console.error("🔥 Global Error:", err.message);
  res.status(500).json({ msg: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
