import { useState } from "react";
import { useAppStore, getLayout, LayoutId } from "../store";
import GridSelector from "./GridSelector";
import ShrinkWarningModal from "./ShrinkWarningModal";

interface Props {
  onCloseTerminals: (indices: number[]) => void;
}

export default function StatusBar({ onCloseTerminals }: Props) {
  const { projects, activeProjectId, setLayout } = useAppStore();
  const active = projects.find((p) => p.id === activeProjectId);
  const [pending, setPending] = useState<LayoutId | null>(null);

  if (!active) {
    return (
      <div className="flex items-center px-4 h-8 border-t border-white/5 bg-black/20 backdrop-blur-sm flex-shrink-0 text-xs text-white/20">
        Zynthetix AutoAgent v0.1
      </div>
    );
  }

  const currentLayout = getLayout(active.layoutId);

  function handleLayoutChange(id: LayoutId) {
    const next = getLayout(id);
    if (next.count < currentLayout.count) {
      setPending(id);
    } else {
      setLayout(active!.id, id);
    }
  }

  function confirmSwitch(indicesToClose: number[]) {
    if (!pending) return;
    onCloseTerminals(indicesToClose);
    setLayout(active!.id, pending);
    setPending(null);
  }

  return (
    <>
      {pending && (
        <ShrinkWarningModal
          fromCount={currentLayout.count}
          toCount={getLayout(pending).count}
          toLabel={getLayout(pending).label}
          onConfirm={confirmSwitch}
          onCancel={() => setPending(null)}
        />
      )}

      <div className="flex items-center justify-between px-4 h-8 border-t border-white/5 bg-black/20 backdrop-blur-sm flex-shrink-0 text-xs text-white/40">
        <div className="flex items-center gap-3">
          <span className="font-mono truncate max-w-[300px]">{active.path || "~"}</span>
          <span className="text-white/20">
            {currentLayout.label} · {currentLayout.count} terminal{currentLayout.count !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <GridSelector value={active.layoutId} onChange={handleLayoutChange} />
          <span className="text-white/20">Zynthetix AutoAgent v0.1</span>
        </div>
      </div>
    </>
  );
}
