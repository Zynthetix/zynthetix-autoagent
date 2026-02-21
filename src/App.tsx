import "./App.css";
import { useEffect } from "react";
import { useAppStore, getLayout, LayoutId } from "./store";
import ProjectTabs from "./components/ProjectTabs";
import TerminalGrid from "./components/TerminalGrid";
import StatusBar from "./components/StatusBar";

const WELCOME_PROJECT = {
  id: "default",
  name: "~",
  path: "",
  layoutId: "side-by-side" as LayoutId,
};

export default function App() {
  const { projects, activeProjectId, addProject } = useAppStore();

  useEffect(() => {
    if (projects.length === 0) {
      addProject(WELCOME_PROJECT);
    }
  }, []);

  const active = projects.find((p) => p.id === activeProjectId);

  return (
    <div className="flex flex-col h-full bg-[#0d0d14] text-white select-none">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-900/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-900/10 rounded-full blur-3xl" />
      </div>

      <ProjectTabs />

      <div className="flex flex-1 min-h-0 relative">
        {active ? (
          <TerminalGrid
            projectId={active.id}
            cwd={active.path || undefined}
            layout={getLayout(active.layoutId)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-white/20 text-sm">
            Click <kbd className="mx-1 px-1.5 py-0.5 rounded bg-white/10 text-white/40 text-xs font-mono">+</kbd> to open a project
          </div>
        )}
      </div>

      <StatusBar />
    </div>
  );
}
