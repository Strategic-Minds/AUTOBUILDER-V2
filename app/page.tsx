import { Sidebar } from "@/components/layout/sidebar";
import { EditorCanvas } from "@/components/editor/editor-canvas";
import { AgentChat } from "@/components/agent/agent-chat";
import { EditorProvider } from "@/components/editor/editor-store";

export default function Page() {
  return (
    <EditorProvider>
      <div className="flex h-screen overflow-hidden bg-[var(--color-background)]">
        <Sidebar displayName="Jeremy" initials="JX" />
        <aside className="hidden lg:flex w-[360px] xl:w-[400px] shrink-0 border-r border-[var(--color-border)]">
          <AgentChat />
        </aside>
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <EditorCanvas />
        </main>
      </div>
    </EditorProvider>
  );
}
