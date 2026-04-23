const express = require("express");
const router = express.Router();
const twilio = require("twilio");
const db = require("../config/db"); // MySQL Connection pool

// Twilio Client Initialization
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
const verifyService = process.env.TWILIO_VERIFY_SERVICE;

// 📲 SEND OTP
router.post("/send-otp", async (req, res) => {
  let { mobile } = req.body;

  if (!mobile) return res.status(400).json({ msg: "Mobile number required" });

  // 🛠️ AUTO-FIX: Twilio requires country code (e.g., +91 for India)
  // Agar user ne '+' nahi lagaya, toh hum manually '+91' add kar denge
  if (!mobile.startsWith("+")) {
    mobile = "+91" + mobile;
  }

  console.log(`⏳ Attempting to send OTP to: ${mobile}`);

  try {
    // Twilio Verify API call
    await client.verify.v2
      .services(verifyService)
      .verifications.create({ to: mobile, channel: "sms" });

    res.json({ msg: "OTP sent successfully to " + mobile });
  } catch (err) {
    console.error("❌ Twilio Error:", err.message);
    res.status(500).json({ msg: "Failed to send OTP", error: err.message });
  }
});

// ✅ VERIFY OTP & LOGIN/REGISTER
router.post("/verify-otp", async (req, res) => {
  let { mobile, otp } = req.body;

  if (!mobile || !otp) return res.status(400).json({ msg: "Mobile and OTP required" });

  // Validation: Ensure country code is present for verification check
  if (!mobile.startsWith("+")) {
    mobile = "+91" + mobile;
  }

  try {
    // 1. Verify OTP with Twilio
    const verification = await client.verify.v2
      .services(verifyService)
      .verificationChecks.create({ to: mobile, code: otp });

    if (verification.status === "approved") {
      console.log(`✅ OTP Approved for ${mobile}`);

      // 2. MySQL: Check if user exists
      const [rows] = await db.execute("SELECT * FROM users WHERE mobile = ?", [mobile]);

      if (rows.length === 0) {
        // 3. Register new user if not found
        console.log("🆕 Registering new user in MySQL...");
        await db.execute("INSERT INTO users (mobile) VALUES (?)", [mobile]);
      }

      return res.json({
        msg: "Login successful",
        user: { mobile },
      });

    } else {
      res.status(400).json({ msg: "Invalid OTP" });
    }
  } catch (err) {
    console.error("❌ Verification Error:", err.message);
    res.status(500).json({ msg: "Verification failed", error: err.message });
  }
});

module.exports = router;