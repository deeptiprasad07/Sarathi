import logo from "../src/assets/Logo.png";
import { useState, useEffect } from "react";
import Chat from "./components/Chat";
import ResumeBuilder from "./components/ResumeBuilder";
import ATSChecker from "./components/ATSChecker";
import Interview from "./components/Interview";
import Skills from "./components/Skills";
import Login from "./components/Login";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("chat");
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  // ✅ LOAD USER FROM LOCALSTORAGE (Fixed parsing)
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        // Agar user object hai toh parse karega, warna seedha set karega
        setUser(JSON.parse(savedUser));
      } catch (e) {
        setUser(savedUser);
      }
    }
  }, []);

  const toggleTheme = () => {
    document.body.classList.toggle("dark");
    setDarkMode(!darkMode);
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setShowMenu(false);
  };

  // 🔐 AGAR LOGIN NAHI HAI TOH SIRF LOGIN SCREEN DIKHAO
  if (!user) {
    return <Login setUser={setUser} />;
  }

  // User ka display name (mobile number) nikalne ke liye
  const userName = typeof user === 'object' ? user.mobile : user;

  return (
    <div className={darkMode ? "dark-app" : "light-app"}>
      {/* ================= NAVBAR ================= */}
      <nav className="navbar">
        <div className="nav-left"><img src={logo} alt="Sarathi AI" className="nav-logo"/><h2 className="app-title">SARATHI  Powered by AI <br></br>Driven By Your Dreams</h2></div>
        

        <div className="tabs">
          {["chat", "resume", "ats", "interview", "skills"].map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? "active" : ""}
              onClick={() => setActiveTab(tab)}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* RIGHT SIDE (Theme & Profile) */}
        <div className="nav-right">
          <button className="theme-toggle" onClick={toggleTheme}>
            {darkMode ? "☀️" : "🌙"}
          </button>

          {/* 👤 PROFILE DROPDOWN */}
          <div className="profile-container">
            <div
              className="profile-btn"
              onClick={() => setShowMenu(!showMenu)}
            >
              👤 {userName}
            </div>

            {showMenu && (
              <div className="dropdown-menu">
                <p>Hello, {userName} 👋</p>
                <hr />
                <button className="logout-btn" onClick={logout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ================= MAIN PAGE CONTENT ================= */}
      <main className="page-content">
        {activeTab === "chat" && <Chat />}
        {activeTab === "resume" && <ResumeBuilder />}
        {activeTab === "ats" && <ATSChecker />}
        {activeTab === "interview" && <Interview />}
        {activeTab === "skills" && <Skills />}
      </main>
    </div>
  );
}

export default App;