import React, { useState } from "react";
import { MessageCircle, X } from "lucide-react";

const DEFAULT_MESSAGES = [
  {
    from: "bot",
    text: "Hi 👋 I am your Smart Logistics Assistant. How can I help you?"
  }
];

const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(DEFAULT_MESSAGES);
  const [input, setInput] = useState("");

  const texts = [
    "Chat with us",
    "Need help?",
    "Track your shipment",
    "Ask our AI 🤖"
  ];

  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTextIndex(prev => (prev + 1) % texts.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    
    setMessages(prev => [
      ...prev,
      { from: "user", text: input }
    ]);

    const messageToSend = input;
    setInput("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/chatbot/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: messageToSend }),
        }
      );

      const data = await response.json();

     
      setMessages(prev => [
        ...prev,
        { from: "bot", text: data.reply, suggestions: data.suggestions }
      ]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { from: "bot", text: "Sorry, something went wrong." }
      ]);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => {
          if (!open) {
            setMessages(DEFAULT_MESSAGES);
            setInput("");
          }
          setOpen(!open);
        }}
        className="fixed bottom-6 right-6 bg-purple-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-purple-700 z-50 flex items-center gap-2 transition-all"
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
        {!open && (
          <span className="text-sm font-semibold whitespace-nowrap">
            {texts[currentTextIndex]}
          </span>
        )}
      </button>

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-20 right-6 w-80 bg-white rounded-xl shadow-xl border flex flex-col z-50">
          <div className="bg-purple-600 text-white p-3 rounded-t-xl font-semibold">
            Smart Logistics Chatbot
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-2 text-sm">
            {messages.map((msg, i) => (
              <div key={i}>
                {/* Message */}
                <div
                  className={`p-2 rounded-lg whitespace-pre-line max-w-[80%] ${
                    msg.from === "user"
                      ? "bg-purple-100 ml-auto text-right"
                      : "bg-gray-100"
                  }`}
                >
                  {msg.text}
                </div>

                {/* Suggestions (FIXED POSITION) */}
                {msg.suggestions && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {msg.suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setInput(s);
                          setTimeout(() => sendMessage(), 100);
                        }}
                        className="text-xs bg-purple-200 px-2 py-1 rounded"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-2 border-t flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border rounded-lg px-2 py-1 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && input.trim()) {
                  sendMessage();
                }
              }}
            />
            <button
              onClick={sendMessage}
              className="bg-purple-600 text-white px-3 rounded-lg text-sm"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;