import { useState } from "react";
import axios from "axios";
import "./Login.css";

function Login({ setUser }) {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // 📩 SEND OTP
  const sendOtp = async () => {
    // UPDATED: Allow + and check for proper length (e.g., +91 + 10 digits = 13)
    if (mobile.length < 10) {
      return alert("Enter a valid mobile number with country code (e.g., +91...)");
    }

    try {
      setLoading(true);

      // Ensure the request goes to the full backend URL if proxy isn't set
      await axios.post("http://localhost:5000/api/auth/send-otp", { mobile });

      alert("OTP sent successfully ✅");
      setStep(2);
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to send OTP ❌");
    } finally {
      setLoading(false);
    }
  };

  // ✅ VERIFY OTP
  const verifyOtp = async () => {
    if (!otp) return alert("Enter OTP");

    try {
      setLoading(true);

      const res = await axios.post("http://localhost:5000/api/auth/verify-otp", {
        mobile,
        otp,
      });

      // Fixed: Storing as string or object correctly
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setUser(res.data.user);
    } catch (err) {
      alert(err.response?.data?.msg || "Invalid OTP ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card login-container">
      <h2>📱 Login with OTP</h2>

      {step === 1 && (
        <>
          <input
            type="text"
            placeholder="Enter Mobile (e.g. +918260392803)"
            value={mobile}
            maxLength={13} // UPDATED: Increased for country code
            onChange={(e) => {
              // UPDATED: Allow '+' and numbers only
              const value = e.target.value;
              if (value === "" || /^\+?[0-9]*$/.test(value)) {
                setMobile(value);
              }
            }}
          />

          <button onClick={sendOtp} disabled={loading}>
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            maxLength={6}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          />

          <button onClick={verifyOtp} disabled={loading}>
            {loading ? "Verifying..." : "Verify OTP"}
          </button>

          <p
            style={{
              marginTop: "10px",
              cursor: "pointer",
              color: "#4f46e5",
              fontWeight: "500",
            }}
            onClick={sendOtp}
          >
            Resend OTP
          </p>
        </>
      )}
    </div>
  );
}

export default Login;