import React, { useState } from "react";
import {
  Sparkles, Send, Bot, User, X, AlertTriangle, ShieldCheck,
  CheckCircle2, RefreshCw, BookOpen, Flame, Cpu
} from "lucide-react";
import { aiService } from "../services/api";

export default function AICopilotModal({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! I am **AI MineSafe Copilot**, your expert assistant for the **AI-Powered Underground Mine Safety Monitoring and Rescue System** powered by Groq LPU on the Render backend.\n\nAsk me about hazard triggers, gas anomalies, affected worker safety, or rescue operation procedures.",
      source: "Groq AI Engine",
    },
  ]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const quickPrompts = [
    "Why is this mine high risk?",
    "What caused this alert?",
    "What hazards are active?",
    "Which workers are affected?",
    "What safety action is recommended?",
    "Summarize this emergency incident.",
    "Summarize this rescue operation.",
  ];

  const handleSend = async (userText) => {
    const textToSend = userText || query;
    if (!textToSend.trim() || loading) return;

    const newMessages = [...messages, { role: "user", content: textToSend }];
    setMessages(newMessages);
    setQuery("");
    setLoading(true);

    try {
      const history = newMessages.slice(1).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await aiService.askCopilot(textToSend, history);
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: res.data.answer,
          source: res.data.source || res.data.model || "Groq Cloud LPU",
        },
      ]);
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content:
            "I encountered a temporary connection issue reaching the Groq API. The deterministic safety rule engine remains active. Please try asking again.",
          source: "AI MineSafe Offline Safety Engine",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col h-[600px] overflow-hidden">
        {/* Header */}
        <div className="bg-[#1E5B3A] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-white/10 rounded-lg">
              <Bot className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm">AI MineSafe Copilot</h3>
                <span className="px-2 py-0.2 text-[10px] font-bold bg-amber-400 text-black rounded-full uppercase tracking-wider">
                  Groq LLM
                </span>
              </div>
              <p className="text-[11px] text-green-100">
                Underground Mine Safety Monitoring & Emergency Rescue Intelligence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Prompts Bar */}
        <div className="bg-gray-50 border-b border-gray-200 p-2.5 flex items-center gap-2 overflow-x-auto text-[11px] text-[#4B5563]">
          <span className="font-semibold text-gray-500 whitespace-nowrap pl-1">
            Safety Queries:
          </span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              disabled={loading}
              className="px-2.5 py-1 bg-white border border-gray-200 rounded-md hover:bg-green-50 hover:border-green-300 hover:text-[#1E5B3A] whitespace-nowrap transition cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8FAFC]">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {m.role !== "user" && (
                <div className="w-8 h-8 rounded-full bg-[#1E5B3A]/10 border border-[#1E5B3A]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-[#1E5B3A]" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                  m.role === "user"
                    ? "bg-[#1E5B3A] text-white rounded-br-none"
                    : "bg-white border border-gray-200 text-[#1F2937] shadow-xs rounded-bl-none"
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">
                  {m.content}
                </div>
                {m.source && (
                  <div
                    className={`mt-2 pt-1.5 border-t text-[10px] flex items-center justify-between ${
                      m.role === "user"
                        ? "border-white/20 text-white/70"
                        : "border-gray-100 text-gray-400"
                    }`}
                  >
                    <span>Engine: {m.source}</span>
                    <span>Backend Executed</span>
                  </div>
                )}
              </div>
              {m.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-[#1E5B3A]/10 border border-[#1E5B3A]/20 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-[#1E5B3A] animate-pulse" />
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-3 text-xs text-gray-500 flex items-center gap-2 shadow-xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#1E5B3A]" />
                <span>Groq LPU synthesizing statutory compliance guidance...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-gray-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask Groq Copilot about DGMS rules, methane limits, risk mitigation..."
              className="flex-1 px-3.5 py-2 text-xs border border-gray-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#1E5B3A] focus:border-[#1E5B3A]"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="btn-primary !px-4 !py-2 text-xs disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ask AI</span>
            </button>
          </form>
          <div className="mt-1.5 text-center text-[10px] text-gray-500">
            AI-Assisted Risk Assessment — AI supports safety personnel and does not make final emergency, regulatory or legal decisions.
          </div>
        </div>
      </div>
    </div>
  );
}
