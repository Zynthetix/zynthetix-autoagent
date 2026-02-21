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
    <div className="flex items-center gap-1 px-3 h-10 border-b border-white/8 bg-[#131315] flex-shrink-0">
      {projects.map((p) => (
        <div
          key={p.id}
          onClick={() => setActiveProject(p.id)}
          className={`group flex items-center gap-1.5 px-3 py-1 rounded-md text-sm cursor-pointer transition-colors select-none
            ${p.id === activeProjectId
              ? "bg-[#1e1e22] text-white border border-white/12"
              : "text-white/40 hover:bg-[#1a1a1d] hover:text-white/70 border border-transparent"
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
        className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-[#1a1a1d] text-white/30 hover:text-white/70 transition-colors text-lg leading-none"
        title="Open project (⌘T)"
      >
        +
      </button>
    </div>
  );
}
