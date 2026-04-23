import axios from "axios";
import { useState, useEffect, useRef } from "react";
import { askCareerQuestion } from "../services/api";
export default function Chat() {
  const [sessions, setSessions] = useState({});
  const [currentId, setCurrentId] = useState(null);
  const [message, setMessage] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fileRef = useRef();
  const inputRef = useRef(); 
  const chat = sessions[currentId] || [];

  // --- 1. LOAD VOICES ---
  useEffect(() => {
    const loadVoices = () => window.speechSynthesis.getVoices();
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // --- 2. LOAD SESSIONS ---
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("chat-sessions")) || {};
    if (Object.keys(saved).length === 0) {
      const id = Date.now().toString();
      saved[id] = [];
    }
    setSessions(saved);
    setCurrentId(Object.keys(saved)[0]);
  }, []);

  useEffect(() => {
    localStorage.setItem("chat-sessions", JSON.stringify(sessions));
  }, [sessions]);

  const updateSessions = (newChat) => {
    setSessions((prev) => ({ ...prev, [currentId]: newChat }));
  };

  const newChat = () => {
    const id = Date.now().toString();
    setSessions({ ...sessions, [id]: [] });
    setCurrentId(id);
    setShowMenu(false);
  };

  const clearAllHistory = () => {
    if (window.confirm("Delete all chat history?")) {
      const id = Date.now().toString();
      const reset = { [id]: [] };
      setSessions(reset);
      setCurrentId(id);
      setShowMenu(false);
    }
  };

  const deleteChat = (id) => {
    const updated = { ...sessions };
    delete updated[id];
    setSessions(updated);
    const remainingIds = Object.keys(updated);
    if (remainingIds.length > 0) setCurrentId(remainingIds[0]);
    else {
      const newId = Date.now().toString();
      updated[newId] = [];
      setSessions(updated);
      setCurrentId(newId);
    }
  };

  // --- 3. SPEAK FUNCTION ---
  const speak = (text) => {
    window.speechSynthesis.cancel(); 
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    window.speechSynthesis.speak(utterance);
  };

  // --- 4. SEND MESSAGE (Supports direct content injection) ---
  const sendMessage = async (textOverride = null) => {
    const textToSend = textOverride || message;
    if (!textToSend || !textToSend.trim()) return;

    // UI par hum content dikhayenge
    const updatedWithUser = [...chat, { role: "user", content: textToSend }];
    updateSessions(updatedWithUser);
    setMessage(""); 
    if(inputRef.current) inputRef.current.value = ""; 

    setIsLoading(true);
    try {
      const reply = await askCareerQuestion(textToSend);
      const finalChat = [...updatedWithUser, { role: "ai", content: reply }];
      updateSessions(finalChat);
      speak(reply); 
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 5. VOICE INPUT ---
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Please use Chrome.");

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN"; 
    recognition.interimResults = true; 
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      if(inputRef.current) inputRef.current.value = ""; 
      setMessage("");
    };
    
    recognition.onresult = (event) => {
      let currentTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      if (inputRef.current) inputRef.current.value = currentTranscript;
      setMessage(currentTranscript);

      if (event.results[0].isFinal) {
        recognition.stop();
        sendMessage(currentTranscript);
      }
    };

    recognition.onerror = (event) => {
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);
    try {
      recognition.start();
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  setIsLoading(true); // Thinking... start
  try {
    // 🔥 Backend se clean text mangvana
    const res = await axios.post(
  "http://localhost:5000/api/upload",
  formData,
  { headers: { "Content-Type": "multipart/form-data" } }
   );

    // AI ko PDF ka text samjhane ke liye prompt
    const fileInstruction = `User uploaded a document (${file.name}). Here is its content: \n\n ${res.data.text} \n\n Please analyze this and help the user.`;
    
    sendMessage(fileInstruction); // AI ko content bhejna
  } catch (err) { 
    console.error("Upload Error:", err);
    alert("Server error (500). Please restart backend and check 'pdf-parse' installation.");
  } finally {
    setIsLoading(false);
  }
};
  return (
    <div className="chat-container">
      <div className="chat-dropdown">
        <button onClick={() => setShowMenu(!showMenu)}>☰</button>
        {showMenu && (
          <div className="chat-menu">
            <button onClick={newChat}>➕ New Chat</button>
            <button style={{color: 'red'}} onClick={clearAllHistory}>🗑️ Clear All History</button>
            <hr />
            {Object.keys(sessions).map((id) => (
              <div key={id} className="chat-session">
                <span onClick={() => setCurrentId(id)}>Chat {id.slice(-4)}</span>
                <button onClick={() => deleteChat(id)}>🗑</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="chat-messages">
        {chat.map((c, i) => (
          <div key={i} className={c.role === "user" ? "user" : "ai"}>
            {c.content}
          </div>
        ))}
        {isLoading && <div className="ai">Thinking...</div>}
      </div>

      <div className="chat-input-area">
        <input type="file" hidden ref={fileRef} onChange={handleFileChange} />
        <span className="icon" onClick={() => fileRef.current.click()}>📎</span>

        <input
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isListening ? "Listening..." : "Ask AI..."}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />

        <span 
          className="icon" 
          onClick={isListening ? () => {} : startListening} 
          style={{ color: isListening ? "red" : "black", cursor: "pointer" }}
        >
          {isListening ? "🛑" : "🎤"}
        </span>

        <button onClick={() => sendMessage()}>➤</button>
      </div>
    </div>
  );
}