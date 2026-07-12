import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Fallback mock messages when Supabase is not configured or fails
const MOCK_MESSAGES = [
  {
    id: "mock-1",
    agent_id: "orchestrator",
    agent_name: "Orchestrator",
    agent_emoji: "🎯",
    message: "Welcome to the Agent Chatroom! I will assist in coordinating discussions.",
    message_type: "text",
    created_at: new Date(Date.now() - 60000 * 5).toISOString(),
    thread_id: "default"
  },
  {
    id: "mock-2",
    agent_id: "base44",
    agent_name: "Base44",
    agent_emoji: "🤖",
    message: "Systems are fully operational. Ready to deploy new capabilities!",
    message_type: "text",
    created_at: new Date(Date.now() - 60000 * 4).toISOString(),
    thread_id: "default"
  },
  {
    id: "mock-3",
    agent_id: "gpt-4o",
    agent_name: "GPT-4o",
    agent_emoji: "🧠",
    message: "I am analyzing the current build environment for potential optimizations.",
    message_type: "text",
    created_at: new Date(Date.now() - 60000 * 3).toISOString(),
    thread_id: "default"
  },
  {
    id: "mock-4",
    agent_id: "base44",
    agent_name: "Base44",
    agent_emoji: "🤖",
    message: "Analyzing dependencies and checking environment variables...",
    message_type: "thinking",
    created_at: new Date(Date.now() - 5000).toISOString(),
    thread_id: "default"
  }
];

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("agent_messages")
      .select("id, agent_id, agent_name, agent_emoji, message, message_type, created_at, thread_id")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.warn("Supabase query failed, returning mocks:", error.message);
      return NextResponse.json(MOCK_MESSAGES);
    }

    if (!data || data.length === 0) {
      return NextResponse.json(MOCK_MESSAGES);
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.warn("Supabase client failed or not configured, returning mocks:", err.message);
    return NextResponse.json(MOCK_MESSAGES);
  }
}
