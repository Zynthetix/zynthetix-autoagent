import { open } from "@tauri-apps/plugin-dialog";
import { useAppStore, LayoutId } from "../store";
import { nanoid } from "../utils";

export default function ProjectTabs() {
  const { projects, activeProjectId, addProject, removeProject, setActiveProject } =
    useAppStore();

  async function handleAddProject() {
    const selected = await open({ directory: true, multiple: false });
    if (!selected || typeof selected !== "string") return;
    const name = selected.split("/").pop() ?? selected;
    addProject({ id: nanoid(), name, path: selected, layoutId: "side-by-side" as LayoutId });
  }

  return (
    <div className="flex items-center gap-1 px-3 h-10 border-b border-white/5 bg-black/20 backdrop-blur-sm flex-shrink-0">
      {projects.map((p) => (
        <div
          key={p.id}
          onClick={() => setActiveProject(p.id)}
          className={`group flex items-center gap-1.5 px-3 py-1 rounded-md text-sm cursor-pointer transition-all select-none
            ${p.id === activeProjectId
              ? "bg-violet-600/30 text-white border border-violet-500/40"
              : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 border border-transparent"
            }`}
        >
          <span className="max-w-[120px] truncate">{p.name}</span>
          <button
            onClick={(e) => { e.stopPropagation(); removeProject(p.id); }}
            className="opacity-0 group-hover:opacity-60 hover:!opacity-100 text-white/60 hover:text-red-400 transition-opacity text-xs leading-none"
          >
            ×
          </button>
        </div>
      ))}
      <button
        onClick={handleAddProject}
        className="flex items-center justify-center w-7 h-7 rounded-md bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/80 transition-all text-lg leading-none"
        title="Open project (⌘T)"
      >
        +
      </button>
    </div>
  );
}
