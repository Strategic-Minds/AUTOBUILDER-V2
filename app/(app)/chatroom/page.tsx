"use client";

import * as React from "react";
import { Send, Sparkles, Circle, Users, MessageSquare } from "lucide-react";

interface Message {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_emoji: string;
  message: string;
  message_type: string;
  created_at: string;
  thread_id?: string;
}

interface Agent {
  id: string;
  name: string;
  emoji: string;
  role: string;
  status: "active" | "offline";
  colorClass: string;
}

const AGENTS: Agent[] = [
  { id: "base44", name: "Base44", emoji: "🤖", role: "Platform System", status: "active", colorClass: "text-purple-400" },
  { id: "gpt-4o", name: "GPT-4o", emoji: "🧠", role: "Reasoning Model", status: "active", colorClass: "text-green-400" },
  { id: "orchestrator", name: "Orchestrator", emoji: "🎯", role: "Task Coordinator", status: "active", colorClass: "text-amber-400" },
  { id: "human", name: "YOU (Human)", emoji: "👤", role: "Administrator", status: "active", colorClass: "text-blue-400" },
];

export default function ChatroomPage() {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [inputVal, setInputVal] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const [status, setStatus] = React.useState<"LIVE" | "DISCONNECTED">("LIVE");
  
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Poll messages every 2 seconds
  React.useEffect(() => {
    async function fetchMessages() {
      try {
        const res = await fetch("/api/chatroom/messages");
        if (res.ok) {
          const data = await res.json();
          // Sort ascending so newest messages are at the bottom
          const sorted = [...data].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          setMessages(sorted);
          setStatus("LIVE");
        } else {
          setStatus("DISCONNECTED");
        }
      } catch (err) {
        console.error("Failed to poll messages:", err);
        setStatus("DISCONNECTED");
      }
    }

    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom when message count changes
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!inputVal.trim() || isSending) return;

    const text = inputVal;
    setInputVal("");
    setIsSending(true);

    try {
      const res = await fetch("/api/chatroom/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agent_name: "YOU (Human)",
          message: text,
          message_type: "text",
        }),
      });

      if (res.ok) {
        // Optimistic update
        const rawRes = await res.json();
        const newMessage: Message = {
          id: rawRes.message_id || String(Math.random()),
          agent_id: "human",
          agent_name: "YOU (Human)",
          agent_emoji: "👤",
          message: text,
          message_type: "text",
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, newMessage]);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
    }
  }

  // Determine message classes based on sender
  function getBubbleClasses(agentId: string) {
    switch (agentId) {
      case "human":
        return "bg-blue-600 text-white ml-auto rounded-br-none";
      case "base44":
        return "bg-indigo-950/80 border border-indigo-500/30 text-indigo-100 rounded-bl-none";
      case "gpt-4o":
        return "bg-emerald-950/80 border border-emerald-500/30 text-emerald-100 rounded-bl-none";
      case "orchestrator":
        return "bg-amber-950/80 border border-amber-500/30 text-amber-100 rounded-bl-none";
      default:
        return "bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-bl-none";
    }
  }

  function getAgentNameColor(agentId: string) {
    switch (agentId) {
      case "human":
        return "text-blue-400";
      case "base44":
        return "text-purple-400 font-semibold";
      case "gpt-4o":
        return "text-emerald-400 font-semibold";
      case "orchestrator":
        return "text-amber-400 font-semibold";
      default:
        return "text-neutral-400";
    }
  }

  // Filter out latest messages that are 'thinking' type to show indicator
  const thinkingAgents = messages
    .filter((m) => m.message_type === "thinking" && (Date.now() - new Date(m.created_at).getTime() < 12000))
    .map((m) => m.agent_name);

  // Filter actual messages to render
  const chatMessages = messages.filter((m) => m.message_type !== "thinking");

  return (
    <div className="flex flex-1 h-full bg-black text-white">
      {/* Left panel: List of agents */}
      <div className="w-64 border-r border-neutral-900 bg-neutral-950/40 hidden md:flex flex-col shrink-0">
        <div className="p-4 border-b border-neutral-900 flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Agents in Room</span>
          <span className="flex items-center gap-1 text-[11px] bg-neutral-900 px-2 py-0.5 rounded-full text-neutral-300">
            <Users className="w-3 h-3 text-indigo-400" />
            {AGENTS.length}
          </span>
        </div>
        <div className="flex-1 p-2 space-y-1 overflow-y-auto">
          {AGENTS.map((agent) => (
            <div
              key={agent.id}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-neutral-900/40 transition-colors group cursor-default"
            >
              <div className="text-xl shrink-0">{agent.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-neutral-200 truncate group-hover:text-white transition-colors">
                  {agent.name}
                </div>
                <div className="text-[11px] text-neutral-500 truncate">{agent.role}</div>
              </div>
              <div className="relative shrink-0 flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Center chat feed */}
      <div className="flex-1 flex flex-col h-full bg-black">
        {/* Top header bar */}
        <div className="h-14 border-b border-neutral-900 px-6 flex items-center justify-between shrink-0 bg-neutral-950/20">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-sm tracking-wider uppercase text-neutral-200">Agent Chatroom</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-neutral-900/50 border border-neutral-800 px-2.5 py-1 rounded-full">
              <span className={`w-1.5 h-1.5 rounded-full ${status === "LIVE" ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" : "bg-rose-500"}`} />
              <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-wide">{status}</span>
            </div>
          </div>
        </div>

        {/* Message area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          {chatMessages.map((msg) => {
            const isHuman = msg.agent_id === "human";
            const formattedTime = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={msg.id} className={`flex gap-3 max-w-[85%] md:max-w-[70%] ${isHuman ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
                {/* Agent Emoji avatar */}
                <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-base shadow-sm shrink-0">
                  {msg.agent_emoji}
                </div>

                <div className="space-y-1">
                  {/* Meta */}
                  <div className={`flex items-center gap-2 text-[11px] ${isHuman ? "justify-end" : "justify-start"}`}>
                    <span className={getAgentNameColor(msg.agent_id)}>{msg.agent_name}</span>
                    <span className="text-neutral-500">{formattedTime}</span>
                  </div>

                  {/* Bubble */}
                  <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-md ${getBubbleClasses(msg.agent_id)}`}>
                    {msg.message}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing / Thinking Indicator */}
          {thinkingAgents.length > 0 && (
            <div className="flex gap-3 max-w-[70%] mr-auto items-center animate-pulse">
              <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-base shrink-0">
                🤖
              </div>
              <div className="space-y-1">
                <div className="text-[11px] text-purple-400 font-semibold">
                  {thinkingAgents.join(" & ")}
                </div>
                <div className="px-3 py-2 bg-indigo-950/40 border border-indigo-500/20 text-indigo-300 text-xs rounded-2xl rounded-bl-none flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  <span>Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom input bar */}
        <div className="p-4 border-t border-neutral-900 bg-neutral-950/40 shrink-0">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-2">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Type a message to the agent network..."
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={isSending || !inputVal.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white p-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/10 shrink-0 flex items-center justify-center cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
