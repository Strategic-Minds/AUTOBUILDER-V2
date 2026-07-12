"use client";
import * as React from "react";
import { Send, Wifi, WifiOff, Users, Zap } from "lucide-react";

interface ChatMessage {
  id: string; agent_id: string; agent_name: string; agent_emoji: string;
  message: string; message_type: string; created_at: string;
}
interface Agent {
  agent_id: string; agent_name: string; agent_emoji: string;
  agent_type: string; status: string; capabilities: string[];
}
const AGENT_COLORS: Record<string,{bubble:string;name:string;border:string}> = {
  base44:       {bubble:"bg-indigo-600/20 border-indigo-500/30",name:"text-indigo-300",border:"border-indigo-500/50"},
  gpt4o:        {bubble:"bg-emerald-600/20 border-emerald-500/30",name:"text-emerald-300",border:"border-emerald-500/50"},
  orchestrator: {bubble:"bg-amber-600/20 border-amber-500/30",name:"text-amber-300",border:"border-amber-500/50"},
  human:        {bubble:"bg-blue-600/30 border-blue-500/40",name:"text-blue-300",border:"border-blue-500/50"},
};
const STATUS_DOT: Record<string,string> = {
  online:"bg-emerald-400",offline:"bg-zinc-600",busy:"bg-amber-400",thinking:"bg-indigo-400 animate-pulse"
};
function relTime(ts:string){
  const diff=Date.now()-new Date(ts).getTime();
  if(diff<60000) return "just now";
  if(diff<3600000) return Math.floor(diff/60000)+"m ago";
  return new Date(ts).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
}
export default function ChatroomPage(){
  const [messages,setMessages]=React.useState<ChatMessage[]>([]);
  const [agents,setAgents]=React.useState<Agent[]>([]);
  const [input,setInput]=React.useState("");
  const [sending,setSending]=React.useState(false);
  const [connected,setConnected]=React.useState(false);
  const bottomRef=React.useRef<HTMLDivElement>(null);

  const fetchMessages=React.useCallback(async()=>{
    try{const r=await fetch("/api/chatroom/messages");if(r.ok){const d=await r.json();setMessages(d.messages??[]);setConnected(true);}}
    catch{setConnected(false);}
  },[]);
  const fetchAgents=React.useCallback(async()=>{
    try{const r=await fetch("/api/chatroom/agents");if(r.ok){const d=await r.json();setAgents(d.agents??[]);}}catch{}
  },[]);

  React.useEffect(()=>{
    fetchMessages(); fetchAgents();
    const t=setInterval(fetchMessages,2000);
    return ()=>clearInterval(t);
  },[fetchMessages,fetchAgents]);

  React.useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[messages]);

  const send=async()=>{
    if(!input.trim()||sending)return; setSending(true);
    try{
      await fetch("/api/chatroom/send",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({agent_id:"human",agent_name:"Jeremy",agent_emoji:"👤",message:input.trim(),message_type:"chat"})});
      setInput(""); await fetchMessages();
    }finally{setSending(false);}
  };
  const handleKey=(e:React.KeyboardEvent<HTMLTextAreaElement>)=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}};

  const fallbackAgents:Agent[]=[
    {agent_id:"base44",agent_name:"Base44",agent_emoji:"🤖",agent_type:"ai",status:"online",capabilities:[]},
    {agent_id:"gpt4o",agent_name:"GPT-4o",agent_emoji:"🧠",agent_type:"ai",status:"offline",capabilities:[]},
    {agent_id:"orchestrator",agent_name:"Orchestrator",agent_emoji:"🎯",agent_type:"orchestrator",status:"online",capabilities:[]},
    {agent_id:"human",agent_name:"Jeremy",agent_emoji:"👤",agent_type:"human",status:"online",capabilities:[]},
  ];
  const displayAgents=agents.length>0?agents:fallbackAgents;

  return(
    <div className="flex h-full overflow-hidden" style={{background:"#080808"}}>
      {/* Agent sidebar */}
      <div className="w-52 shrink-0 flex flex-col" style={{borderRight:"1px solid rgba(255,255,255,0.06)"}}>
        <div className="px-4 py-3" style={{borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5" style={{color:"rgba(255,255,255,0.3)"}}/>
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{color:"rgba(255,255,255,0.4)"}}>Agents</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {displayAgents.map(a=>{
            const col=AGENT_COLORS[a.agent_id]??AGENT_COLORS.base44;
            return(
              <div key={a.agent_id} className="flex items-center gap-2.5 px-4 py-2.5">
                <div className="relative shrink-0">
                  <div className={`w-8 h-8 rounded-lg border ${col.border} flex items-center justify-center text-sm`} style={{background:"rgba(0,0,0,0.4)"}}>{a.agent_emoji}</div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${STATUS_DOT[a.status]??'bg-zinc-600'}`} style={{borderColor:"#080808"}}/>
                </div>
                <div>
                  <p className={`text-[12px] font-medium ${col.name}`}>{a.agent_name}</p>
                  <p className="text-[10px] capitalize" style={{color:"rgba(255,255,255,0.25)"}}>{a.status}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main chat */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0" style={{borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:"rgba(99,102,241,0.2)",border:"1px solid rgba(99,102,241,0.3)"}}>
              <Zap className="w-3.5 h-3.5 text-indigo-400"/>
            </div>
            <div>
              <h1 className="text-[13px] font-bold text-white">AGENT CHATROOM</h1>
              <p className="text-[10px]" style={{color:"rgba(255,255,255,0.3)"}}>Persistent multi-agent channel · Pub/Sub backbone</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${connected?"bg-emerald-400 animate-pulse":"bg-red-500"}`}/>
            <span className={`text-[11px] ${connected?"text-emerald-400":"text-red-400"}`}>{connected?"LIVE":"RECONNECTING"}</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.length===0&&(
            <div className="flex items-center justify-center h-32">
              <p className="text-[12px]" style={{color:"rgba(255,255,255,0.2)"}}>Initializing room...</p>
            </div>
          )}
          {messages.map(msg=>{
            const isHuman=msg.agent_id==="human";
            const isSystem=msg.message_type==="system";
            const col=AGENT_COLORS[msg.agent_id]??AGENT_COLORS.base44;
            if(isSystem){
              return(
                <div key={msg.id} className="flex justify-center">
                  <div className="px-3 py-1 rounded-full" style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)"}}>
                    <span className="text-[10px]" style={{color:"rgba(255,255,255,0.35)"}}>{msg.agent_emoji} {msg.message}</span>
                  </div>
                </div>
              );
            }
            return(
              <div key={msg.id} className={`flex gap-2.5 ${isHuman?"flex-row-reverse":""}`}>
                <div className={`w-7 h-7 rounded-lg border ${col.border} flex items-center justify-center text-xs shrink-0 mt-0.5`} style={{background:"rgba(0,0,0,0.5)"}}>{msg.agent_emoji}</div>
                <div className={`max-w-[70%] flex flex-col gap-0.5 ${isHuman?"items-end":""}`}>
                  <div className="flex items-center gap-1.5 px-0.5">
                    <span className={`text-[10px] font-semibold ${col.name}`}>{msg.agent_name}</span>
                    <span className="text-[9px]" style={{color:"rgba(255,255,255,0.2)"}}>{relTime(msg.created_at)}</span>
                  </div>
                  <div className={`rounded-xl px-3 py-2 border ${col.bubble}`}>
                    <p className="text-[12px] leading-relaxed whitespace-pre-wrap" style={{color:"rgba(255,255,255,0.88)"}}>{msg.message}</p>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef}/>
        </div>

        {/* Input */}
        <div className="p-4 shrink-0" style={{borderTop:"1px solid rgba(255,255,255,0.06)"}}>
          <div className="flex gap-2 items-end">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 mb-0.5" style={{background:"rgba(59,130,246,0.2)",border:"1px solid rgba(59,130,246,0.3)"}}>👤</div>
            <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey}
              placeholder="Message the agents... (Enter to send)" rows={2}
              className="flex-1 resize-none rounded-xl px-3 py-2.5 text-[12px] text-white focus:outline-none transition-all"
              style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"white"}}/>
            <button onClick={send} disabled={!input.trim()||sending}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors shrink-0 disabled:opacity-40"
              style={{background:"#3B82F6"}}>
              <Send className="w-3.5 h-3.5 text-white"/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
