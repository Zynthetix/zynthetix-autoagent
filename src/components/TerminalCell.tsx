import { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "@xterm/xterm/css/xterm.css";

interface Props {
  id: string;
  index: number;
  cwd?: string;
  isActive: boolean;
  onClick: () => void;
}

export default function TerminalCell({ id, index, cwd, isActive, onClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      fontFamily: '"SF Mono", "Cascadia Code", "Fira Code", monospace',
      fontSize: 13,
      lineHeight: 1.2,
      cursorBlink: true,
      theme: {
        background: "transparent",
        foreground: "#e2e8f0",
        cursor: "#7c3aed",
        selectionBackground: "rgba(124,58,237,0.3)",
        black: "#1e1e2e",
        brightBlack: "#45475a",
        red: "#f38ba8",
        brightRed: "#f38ba8",
        green: "#a6e3a1",
        brightGreen: "#a6e3a1",
        yellow: "#f9e2af",
        brightYellow: "#f9e2af",
        blue: "#89b4fa",
        brightBlue: "#89b4fa",
        magenta: "#cba6f7",
        brightMagenta: "#cba6f7",
        cyan: "#89dceb",
        brightCyan: "#89dceb",
        white: "#cdd6f4",
        brightWhite: "#ffffff",
      },
      allowTransparency: true,
      scrollback: 10000,
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(containerRef.current);
    fit.fit();

    termRef.current = term;
    fitRef.current = fit;

    invoke("create_pty", {
      id,
      cols: term.cols,
      rows: term.rows,
      cwd: cwd ?? null,
    }).then(() => setReady(true));

    const unlistenData = listen<string>(`pty_data_${id}`, (e) => {
      term.write(e.payload);
    });

    term.onData((data) => {
      invoke("write_pty", { id, data });
    });

    const resizeObs = new ResizeObserver(() => {
      fit.fit();
      invoke("resize_pty", { id, cols: term.cols, rows: term.rows });
    });
    resizeObs.observe(containerRef.current);

    return () => {
      unlistenData.then((fn) => fn());
      resizeObs.disconnect();
      invoke("close_pty", { id });
      term.dispose();
    };
  }, [id, cwd]);

  return (
    <div
      onClick={onClick}
      className={`group relative flex-1 min-w-0 min-h-0 rounded-lg overflow-hidden cursor-pointer transition-all duration-150
        ${isActive
          ? "ring-2 ring-violet-500 shadow-[0_0_20px_rgba(124,58,237,0.3)]"
          : "ring-1 ring-white/10 hover:ring-white/20"
        }
        bg-black/40 backdrop-blur-sm`}
    >
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center text-white/30 text-sm">
          Starting shell…
        </div>
      )}
      {/* Terminal number badge — subtle, top-left corner */}
      <div className={`absolute top-1.5 right-1.5 z-10 flex items-center justify-center
        w-5 h-5 rounded text-[10px] font-mono font-semibold leading-none select-none
        transition-opacity duration-300 pointer-events-none
        ${isActive ? "opacity-60" : "opacity-20 group-hover:opacity-40"}
        bg-black/50 text-white/90 backdrop-blur-sm`}
      >
        {index + 1}
      </div>
      <div ref={containerRef} className="w-full h-full p-1" />
    </div>
  );
}
