interface Props {
  fromCount: number;
  toCount: number;
  toLabel: string;
  onConfirm: () => void;
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative w-[340px] rounded-xl border border-white/10 bg-[#13131f]/90 backdrop-blur-xl shadow-2xl p-5 flex flex-col gap-4">
        {/* Icon */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <p className="text-white text-sm font-medium">Switch to {toLabel}?</p>
            <p className="text-white/40 text-xs mt-0.5">This will close {losing} terminal{losing !== 1 ? "s" : ""}</p>
          </div>
        </div>

        <p className="text-white/50 text-xs leading-relaxed">
          You currently have <span className="text-white/70">{fromCount} terminals</span> open.
          Switching to <span className="text-white/70">{toLabel}</span> will keep the first{" "}
          <span className="text-white/70">{toCount}</span> and permanently close{" "}
          <span className="text-amber-400">{losing}</span>. Any running processes in those terminals will be stopped.
        </p>

        <div className="flex gap-2 justify-end mt-1">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white/80 bg-white/5 hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 rounded-lg text-xs text-white bg-amber-600/80 hover:bg-amber-500/80 transition-all font-medium"
          >
            Close {losing} terminal{losing !== 1 ? "s" : ""} & switch
          </button>
        </div>
      </div>
    </div>
  );
}
