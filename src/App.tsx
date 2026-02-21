import "./App.css";
import { useEffect, useState, useCallback } from "react";
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
  const { projects, activeProjectId, addProject, setActiveProject } = useAppStore();
  // Track closed terminal indices per project
  const [closedMap, setClosedMap] = useState<Record<string, Set<number>>>({});

  useEffect(() => {
    if (projects.length === 0) addProject(WELCOME_PROJECT);
  }, []);

  // Cmd+1 through Cmd+9 — switch project tabs
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!e.metaKey) return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9) {
        const target = projects[num - 1];
        if (target) {
          e.preventDefault();
          setActiveProject(target.id);
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [projects, setActiveProject]);

  const handleCloseTerminals = useCallback((indices: number[]) => {
    if (!activeProjectId) return;
    setClosedMap((prev) => {
      const existing = prev[activeProjectId] ?? new Set<number>();
      const next = new Set([...existing, ...indices]);
      return { ...prev, [activeProjectId]: next };
    });
  }, [activeProjectId]);

  const handleClearClosedTerminals = useCallback(() => {
    if (!activeProjectId) return;
    setClosedMap((prev) => {
      const next = { ...prev };
      delete next[activeProjectId];
      return next;
    });
  }, [activeProjectId]);

  const handleReopenTerminal = useCallback((index: number) => {
    if (!activeProjectId) return;
    setClosedMap((prev) => {
      const existing = prev[activeProjectId];
      if (!existing) return prev;
      const next = new Set(existing);
      next.delete(index);
      const updated = { ...prev };
      if (next.size === 0) {
        delete updated[activeProjectId];
      } else {
        updated[activeProjectId] = next;
      }
      return updated;
    });
  }, [activeProjectId]);

  return (
    <div className="flex flex-col h-full bg-[#0f0f10] text-white select-none">
      <ProjectTabs />

      <div className="flex-1 min-h-0 relative">
        {projects.map((p) => {
          const isVisible = p.id === activeProjectId;
          const layout = getLayout(p.layoutId);
          const closed = closedMap[p.id] ?? new Set<number>();
          return (
            <div
              key={p.id}
              className={`absolute inset-0 ${isVisible ? 'z-10' : 'z-0 invisible pointer-events-none'}`}
            >
              <TerminalGrid
                projectId={p.id}
                cwd={p.path || undefined}
                layout={layout}
                closedIndices={closed}
                onReopenTerminal={handleReopenTerminal}
                onCloseTerminal={(i) =>
                  setClosedMap((prev) => {
                    const existing = prev[p.id] ?? new Set<number>();
                    const next = new Set([...existing, i]);
                    return { ...prev, [p.id]: next };
                  })
                }
              />
            </div>
          );
        })}
        {projects.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-white/20 text-sm">
            Click <kbd className="mx-1 px-1.5 py-0.5 rounded bg-white/10 text-white/40 text-xs font-mono">+</kbd> to open a project
          </div>
        )}
      </div>

      <StatusBar onCloseTerminals={handleCloseTerminals} onClearClosedTerminals={handleClearClosedTerminals} />
    </div>
  );
}
