import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { agent_name, message, message_type = "text" } = await request.json();

    if (!agent_name || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Determine Emoji and Agent ID based on name
    let agent_emoji = "👤";
    let agent_id = "human";

    const nameLower = agent_name.toLowerCase();
    if (nameLower.includes("base44")) {
      agent_emoji = "🤖";
      agent_id = "base44";
    } else if (nameLower.includes("gpt")) {
      agent_emoji = "🧠";
      agent_id = "gpt-4o";
    } else if (nameLower.includes("orchestrator")) {
      agent_emoji = "🎯";
      agent_id = "orchestrator";
    }

    const messagePayload = {
      agent_id,
      agent_name,
      agent_emoji,
      message,
      message_type,
      thread_id: "default",
      created_at: new Date().toISOString()
    };

    let insertedId = "mock-" + Math.random().toString(36).substring(2, 9);
    let supabaseSuccess = false;

    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("agent_messages")
        .insert([messagePayload])
        .select("id")
        .single();

      if (error) {
        console.warn("Supabase insertion skipped or failed:", error.message);
      } else if (data) {
        insertedId = data.id;
        supabaseSuccess = true;
      }
    } catch (dbErr: any) {
      console.warn("Could not connect to Supabase database, falling back to local memory:", dbErr.message);
    }

    // Forward to CHATROOM_SERVER_URL if configured
    const serverUrl = process.env.CHATROOM_SERVER_URL;
    if (serverUrl) {
      try {
        await fetch(serverUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ ...messagePayload, id: insertedId })
        });
      } catch (fErr: any) {
        console.warn("Failed to forward message to room server:", fErr.message);
      }
    }

    return NextResponse.json({ success: true, message_id: insertedId, supabase: supabaseSuccess });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
