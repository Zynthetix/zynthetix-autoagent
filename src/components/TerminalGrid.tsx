import { useState } from "react";
import TerminalCell from "./TerminalCell";
import { LayoutDef } from "../store";

interface Props {
  projectId: string;
  cwd?: string;
  layout: LayoutDef;
  closedIndices: Set<number>;
}

export default function TerminalGrid({ projectId, cwd, layout, closedIndices }: Props) {
  const [activeCell, setActiveCell] = useState(0);

  return (
    <div
      className="flex-1 min-h-0 p-2"
      style={{
        display: "grid",
        gridTemplateColumns: layout.cols,
        gridTemplateRows: layout.rows,
        gap: "6px",
      }}
    >
      {Array.from({ length: layout.count }, (_, i) => {
        // If this slot was explicitly closed, render an empty placeholder
        if (closedIndices.has(i)) {
          return (
            <div
              key={`${projectId}-${i}`}
              className="rounded-lg border border-dashed border-white/10 bg-black/20 flex items-center justify-center text-white/20 text-xs"
            >
              Terminal {i + 1} closed
            </div>
          );
        }
        return (
          <TerminalCell
            key={`${projectId}-${i}`}
            id={`${projectId}-${i}`}
            index={i}
            cwd={cwd}
            isActive={activeCell === i}
            onClick={() => setActiveCell(i)}
          />
        );
      })}
    </div>
  );
}
