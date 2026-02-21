import { useState } from "react";
import TerminalCell from "./TerminalCell";
import { LayoutDef } from "../store";

interface Props {
  projectId: string;
  cwd?: string;
  layout: LayoutDef;
  closedIndices: Set<number>;
  onReopenTerminal?: (index: number) => void;
  onCloseTerminal?: (index: number) => void;
}

export default function TerminalGrid({ projectId, cwd, layout, closedIndices, onReopenTerminal, onCloseTerminal }: Props) {
  const [activeCell, setActiveCell] = useState(0);

  return (
    <div
      className="h-full min-h-0 p-2"
      style={{
        display: "grid",
        gridTemplateColumns: layout.cols,
        gridTemplateRows: layout.rows,
        gap: "8px",
      }}
    >
      {Array.from({ length: layout.count }, (_, i) => {
        if (closedIndices.has(i)) {
          return (
            <div key={`${projectId}-${i}`} className="flex flex-col min-w-0 min-h-0">
              <div className="text-[10px] text-white/25 font-mono px-1.5 pb-0.5 select-none">
                Terminal {i + 1}
              </div>
              <div
                onClick={() => onReopenTerminal?.(i)}
                className="flex-1 rounded-lg border border-dashed border-white/10 bg-[#0a0a0b] flex flex-col items-center justify-center text-white/20 text-xs cursor-pointer hover:border-white/20 hover:text-white/40 transition-colors"
              >
                <span>Terminal {i + 1} closed</span>
                <span className="text-[10px] mt-1 text-white/10">Click to reopen</span>
              </div>
            </div>
          );
        }
        return (
          <div key={`${projectId}-${i}`} className="flex flex-col min-w-0 min-h-0">
            <div className="flex items-center px-1.5 pb-0.5 select-none">
              <span className="text-[10px] text-white/25 font-mono flex-1">Terminal {i + 1}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onCloseTerminal?.(i); }}
                className="text-white/20 hover:text-red-400 text-xs leading-none transition-colors px-0.5"
                title="Close terminal"
              >
                ×
              </button>
            </div>
            <TerminalCell
              id={`${projectId}-${i}`}
              cwd={cwd}
              isActive={activeCell === i}
              onClick={() => setActiveCell(i)}
            />
          </div>
        );
      })}
    </div>
  );
}
