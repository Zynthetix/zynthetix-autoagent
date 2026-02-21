import { LAYOUTS, LayoutId } from "../store";

// Mini visual preview for each layout (4-cell canvas using CSS grid)
const PREVIEWS: Record<LayoutId, React.ReactNode> = {
  solo: (
    <div className="grid w-full h-full" style={{ gridTemplateColumns: "1fr", gridTemplateRows: "1fr", gap: "1px" }}>
      <div className="bg-current rounded-[1px]" />
    </div>
  ),
  "side-by-side": (
    <div className="grid w-full h-full" style={{ gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr", gap: "1px" }}>
      <div className="bg-current rounded-[1px]" /><div className="bg-current rounded-[1px]" />
    </div>
  ),
  stacked: (
    <div className="grid w-full h-full" style={{ gridTemplateColumns: "1fr", gridTemplateRows: "1fr 1fr", gap: "1px" }}>
      <div className="bg-current rounded-[1px]" /><div className="bg-current rounded-[1px]" />
    </div>
  ),
  "cols-3": (
    <div className="grid w-full h-full" style={{ gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "1fr", gap: "1px" }}>
      <div className="bg-current rounded-[1px]" /><div className="bg-current rounded-[1px]" /><div className="bg-current rounded-[1px]" />
    </div>
  ),
  "grid-2x2": (
    <div className="grid w-full h-full" style={{ gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: "1px" }}>
      {[...Array(4)].map((_, i) => <div key={i} className="bg-current rounded-[1px]" />)}
    </div>
  ),
  "grid-3x3": (
    <div className="grid w-full h-full" style={{ gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "1fr 1fr 1fr", gap: "1px" }}>
      {[...Array(9)].map((_, i) => <div key={i} className="bg-current rounded-[1px]" />)}
    </div>
  ),
  "grid-4x4": (
    <div className="grid w-full h-full" style={{ gridTemplateColumns: "repeat(4,1fr)", gridTemplateRows: "repeat(4,1fr)", gap: "1px" }}>
      {[...Array(16)].map((_, i) => <div key={i} className="bg-current rounded-[1px]" />)}
    </div>
  ),
};

interface Props {
  value: LayoutId;
  onChange: (id: LayoutId) => void;
}

export default function GridSelector({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-white/30 text-xs mr-1">Layout</span>
      {LAYOUTS.map((l) => {
        const isActive = value === l.id;
        return (
          <button
            key={l.id}
            onClick={() => onChange(l.id)}
            title={l.label}
            className={`relative w-7 h-7 p-1 rounded transition-all group
              ${isActive
                ? "bg-violet-600/40 text-violet-300 ring-1 ring-violet-500/60"
                : "bg-white/5 text-white/25 hover:bg-white/10 hover:text-white/60"
              }`}
          >
            {PREVIEWS[l.id]}
            {/* Tooltip */}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-1.5 py-0.5 rounded bg-black/80 text-white/80 text-[10px] whitespace-nowrap
              opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              {l.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
