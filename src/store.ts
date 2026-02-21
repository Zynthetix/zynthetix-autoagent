import { create } from "zustand";
import { persist } from "zustand/middleware";

export type LayoutId =
  | "solo"
  | "side-by-side"
  | "stacked"
  | "cols-3"
  | "grid-2x2"
  | "grid-3x3"
  | "grid-4x4";

export interface LayoutDef {
  id: LayoutId;
  label: string;
  cols: string;   // CSS grid-template-columns
  rows: string;   // CSS grid-template-rows
  count: number;
}

export const LAYOUTS: LayoutDef[] = [
  { id: "solo",        label: "Solo",         cols: "1fr",            rows: "1fr",            count: 1  },
  { id: "side-by-side",label: "Side by Side", cols: "1fr 1fr",        rows: "1fr",            count: 2  },
  { id: "stacked",     label: "Stacked",      cols: "1fr",            rows: "1fr 1fr",        count: 2  },
  { id: "cols-3",      label: "3 Columns",    cols: "1fr 1fr 1fr",    rows: "1fr",            count: 3  },
  { id: "grid-2x2",   label: "2×2 Grid",     cols: "1fr 1fr",        rows: "1fr 1fr",        count: 4  },
  { id: "grid-3x3",   label: "3×3 Grid",     cols: "1fr 1fr 1fr",    rows: "1fr 1fr 1fr",    count: 9  },
  { id: "grid-4x4",   label: "4×4 Grid",     cols: "repeat(4, 1fr)", rows: "repeat(4, 1fr)", count: 16 },
];

export function getLayout(id: LayoutId): LayoutDef {
  return LAYOUTS.find((l) => l.id === id)!;
}

export interface Project {
  id: string;
  name: string;
  path: string;
  layoutId: LayoutId;
}

interface AppState {
  projects: Project[];
  activeProjectId: string | null;
  addProject: (project: Project) => void;
  removeProject: (id: string) => void;
  setActiveProject: (id: string) => void;
  setLayout: (projectId: string, layoutId: LayoutId) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      projects: [],
      activeProjectId: null,

      addProject: (project) =>
        set((s) => ({
          projects: [...s.projects, project],
          activeProjectId: s.activeProjectId ?? project.id,
        })),

      removeProject: (id) =>
        set((s) => {
          const remaining = s.projects.filter((p) => p.id !== id);
          return {
            projects: remaining,
            activeProjectId:
              s.activeProjectId === id
                ? (remaining[0]?.id ?? null)
                : s.activeProjectId,
          };
        }),

      setActiveProject: (id) => set({ activeProjectId: id }),

      setLayout: (projectId, layoutId) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId ? { ...p, layoutId } : p
          ),
        })),
    }),
    { name: "zynthetix-autoagent-projects" }
  )
);
