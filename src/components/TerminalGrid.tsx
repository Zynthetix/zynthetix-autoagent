import { useState } from "react";
import TerminalCell from "./TerminalCell";
import { LayoutDef } from "../store";

interface Props {
  projectId: string;
  cwd?: string;
  layout: LayoutDef;
}

export default function TerminalGrid({ projectId, cwd, layout }: Props) {
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
      {Array.from({ length: layout.count }, (_, i) => (
        <TerminalCell
          key={`${projectId}-${i}`}
          id={`${projectId}-${i}`}
          cwd={cwd}
          isActive={activeCell === i}
          onClick={() => setActiveCell(i)}
        />
      ))}
    </div>
  );
}
