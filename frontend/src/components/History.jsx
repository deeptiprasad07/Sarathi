export default function History({ setMessages }) {
  const history = JSON.parse(localStorage.getItem("chatHistory")) || [];

  return (
    <div className="history">
      <h3>History</h3>

      <button onClick={() => setMessages(history)}>Load</button>

      <button onClick={() => localStorage.removeItem("chatHistory")}>
        Clear
      </button>
    </div>
  );
}
