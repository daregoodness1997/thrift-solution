import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles, RefreshCw, AlertTriangle, ShieldCheck, ChevronRight } from "lucide-react";
import { Message } from "../types";

export default function WaveAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am WaveAI, your Flutterwave US Global Expansion specialist. Ask me anything about accepting card/mobile payments, triggering mass payouts to Africa, exchange rates, or our US state licensing!"
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen]);

  // Handle message sending
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMessage: Message = { role: "user", content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);
    setErrorStatus(null);

    try {
      const chatHistory = [...messages, userMessage];
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ messages: chatHistory })
      });

      if (!response.ok) {
        throw new Error("Failed to receive server response");
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.content }]);
    } catch (err: any) {
      console.error("AI assistant error:", err);
      // Fallback response for missing API Key or Offline state
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            content: "I'm currently operating in offline demonstration mode because the Gemini API connection is finalizing, but I can still tell you that Flutterwave US is fully regulated, licensed as a money transmitter, processes in 150+ currencies, and handles payouts to Safaricom M-Pesa or African bank accounts instantly!"
          }
        ]);
      }, 1000);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    handleSendMessage(question);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Floating Chat Window */}
      {isOpen && (
        <div className="bg-white w-[350px] sm:w-[380px] h-[500px] rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden mb-4 animate-scale-up text-brand-dark">
          
          {/* Header */}
          <div className="bg-brand-dark text-white p-4 flex justify-between items-center text-left">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-brand-dark animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold tracking-tight">WaveAI Expansion Assistant</h4>
                <div className="flex items-center gap-1 mt-0.5 text-[9px] text-gray-400 font-mono">
                  <ShieldCheck className="w-3 h-3 text-green-400" /> Powered by Gemini
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-slate-800 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-gray-50/50 no-scrollbar text-left text-xs">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`p-3.5 rounded-2xl max-w-[80%] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-brand-accent text-white rounded-tr-none"
                    : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-400 px-4 py-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions Tray (Only visible when user hasn't asked complex queries yet) */}
          {messages.length === 1 && (
            <div className="px-4 py-2 bg-white border-t border-gray-100 text-left">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Common Topics</span>
              <div className="flex flex-col gap-1.5">
                {[
                  "Explain Flutterwave's US licensing",
                  "Payout delivery speed to Kenya/Nigeria",
                  "Popular African payment methods"
                ].map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickQuestion(q)}
                    className="w-full text-left text-[11px] font-medium text-brand-dark hover:text-brand-accent hover:bg-orange-50/40 p-2 rounded-xl border border-gray-100 transition-colors flex items-center justify-between"
                  >
                    <span>{q}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputMessage);
            }}
            className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about payments & payouts..."
              className="flex-grow bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-brand-dark focus:outline-none focus:border-brand-primary"
            />
            <button
              type="submit"
              className="bg-brand-dark hover:bg-brand-accent p-2.5 rounded-xl text-white transition-all flex items-center justify-center shadow shadow-brand-dark/10"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>
      )}

      {/* Circle Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-brand-dark hover:bg-brand-accent text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 relative group"
        title="Chat with WaveAI"
      >
        {/* Glow effect */}
        <span className="absolute -inset-0.5 bg-gradient-to-r from-brand-accent to-brand-primary rounded-full blur opacity-30 group-hover:opacity-60 transition-opacity"></span>
        
        {isOpen ? (
          <X className="w-6 h-6 relative z-10" />
        ) : (
          <>
            <MessageSquare className="w-6 h-6 relative z-10" />
            <span className="text-xs font-bold font-display px-1 relative z-10 hidden sm:inline">WaveAI Expert</span>
          </>
        )}
      </button>

    </div>
  );
}
