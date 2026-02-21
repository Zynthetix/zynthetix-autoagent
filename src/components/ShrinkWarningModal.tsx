import { useState } from "react";

interface Props {
  fromCount: number;
  toCount: number;
  toLabel: string;
  onConfirm: (indicesToClose: number[]) => void;
  onCancel: () => void;
}

export default function ShrinkWarningModal({
  fromCount,
  toCount,
  toLabel,
  onConfirm,
  onCancel,
}: Props) {
  const losing = fromCount - toCount;
  // Start with the last `losing` terminals pre-selected for closing
  const [toClose, setToClose] = useState<Set<number>>(
    () => new Set(Array.from({ length: losing }, (_, i) => fromCount - losing + i))
  );

  function toggle(i: number) {
    setToClose((prev) => {
      const next = new Set(prev);
      if (next.has(i)) {
        next.delete(i);
      } else if (next.size < losing) {
        next.add(i);
      }
      return next;
    });
  }

  const ready = toClose.size === losing;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />

      <div className="relative w-[380px] rounded-xl border border-white/10 bg-[#131315] shadow-xl p-5 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <p className="text-white text-sm font-medium">Switch to {toLabel}?</p>
            <p className="text-white/40 text-xs mt-0.5">
              Select <span className="text-amber-400 font-medium">{losing}</span> terminal{losing !== 1 ? "s" : ""} to close
            </p>
          </div>
        </div>

        {/* Terminal picker */}
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: fromCount }, (_, i) => {
            const closing = toClose.has(i);
            const maxReached = toClose.size >= losing && !closing;
            return (
              <button
                key={i}
                onClick={() => toggle(i)}
                disabled={maxReached}
                className={`relative flex flex-col items-center justify-center gap-1.5 rounded-lg border p-2.5 transition-colors
                  ${closing
                    ? "border-red-500/50 bg-red-500/10 text-red-400"
                    : maxReached
                      ? "border-white/5 bg-[#0a0a0b] text-white/20 cursor-not-allowed"
                      : "border-white/10 bg-[#0a0a0b] text-white/50 hover:border-white/20 hover:text-white/80 cursor-pointer"
                  }`}
              >
                {/* Mini terminal icon */}
                <div className={`w-6 h-4 rounded border text-[6px] font-mono leading-none flex items-center justify-center
                  ${closing ? "border-red-500/40 bg-red-900/20" : "border-white/15 bg-black/30"}`}>
                  {closing ? "×" : ">_"}
                </div>
                <span className="text-[10px] font-medium">Term {i + 1}</span>
                {closing && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Status hint */}
        <p className="text-white/30 text-[11px] text-center">
          {toClose.size < losing
            ? <span className="text-amber-400/70">Select {losing - toClose.size} more to close</span>
            : <span className="text-green-400/70">✓ {toCount} terminal{toCount !== 1 ? "s" : ""} will be kept, {losing} will be closed</span>
          }
        </p>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white/80 hover:bg-[#1a1a1d] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => ready && onConfirm([...toClose])}
            disabled={!ready}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${ready
                ? "bg-[#b45309] hover:bg-[#a34508] text-white cursor-pointer"
                : "bg-white/5 text-white/20 cursor-not-allowed"
              }`}
          >
            Close & switch
          </button>
        </div>
      </div>
    </div>
  );
}
