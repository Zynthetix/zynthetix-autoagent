import { Channel, invoke } from '@tauri-apps/api/core';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { useEffect, useRef, useState } from 'react';

interface Props {
  id: string;
  index: number;
  cwd?: string;
  isActive: boolean;
  onClick: () => void;
}

export default function TerminalCell({
  id,
  index,
  cwd,
  isActive,
  onClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const isDisposedRef = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    if (termRef.current) return;

    isDisposedRef.current = false;

    const term = new Terminal({
      fontFamily: '"SF Mono", "Cascadia Code", "Fira Code", monospace',
      fontSize: 13,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'block',
      allowProposedApi: true,
      allowTransparency: true,
      scrollback: 10000,
      disableStdin: false,
      rightClickSelectsWord: true,
      theme: {
        background: 'transparent',
        foreground: '#e2e8f0',
        cursor: '#7c3aed',
        selectionBackground: 'rgba(124,58,237,0.3)',
        black: '#1e1e2e',
        brightBlack: '#45475a',
        red: '#f38ba8',
        brightRed: '#f38ba8',
        green: '#a6e3a1',
        brightGreen: '#a6e3a1',
        yellow: '#f9e2af',
        brightYellow: '#f9e2af',
        blue: '#89b4fa',
        brightBlue: '#89b4fa',
        magenta: '#cba6f7',
        brightMagenta: '#cba6f7',
        cyan: '#89dceb',
        brightCyan: '#89dceb',
        white: '#cdd6f4',
        brightWhite: '#ffffff',
      },
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(containerRef.current);

    termRef.current = term;
    fitRef.current = fit;

    let ptyCreated = false;
    let createTimer: ReturnType<typeof setTimeout> | null = null;
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    let lastPtyCols = 0;
    let lastPtyRows = 0;

    // Direct IPC channel for PTY data — bypasses the global event system.
    // Tauri Channels are purpose-built for streaming child-process output:
    // fast, ordered delivery without the per-message JS eval overhead of events.
    const dataChannel = new Channel<string>();
    dataChannel.onmessage = (data) => {
      if (!isDisposedRef.current) term.write(data);
    };

    term.onData((data) => {
      invoke('write_pty', { id, data });
    });

    const attemptCreate = () => {
      fit.fit();
      const cols = term.cols;
      const rows = term.rows;
      if (cols <= 0 || rows <= 0) {
        createTimer = setTimeout(attemptCreate, 100);
        return;
      }
      lastPtyCols = cols;
      lastPtyRows = rows;
      invoke('create_pty', {
        id,
        cols,
        rows,
        cwd: cwd ?? null,
        onData: dataChannel,
      }).then(() => {
        if (isDisposedRef.current) return;
        ptyCreated = true;
        setReady(true);
      });
    };
    createTimer = setTimeout(attemptCreate, 200);

    const resizeObs = new ResizeObserver(() => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        fit.fit();
        const snap = { cols: term.cols, rows: term.rows };

        requestAnimationFrame(() => {
          fit.fit();
          const cols = term.cols;
          const rows = term.rows;
          if (
            ptyCreated &&
            cols > 0 &&
            rows > 0 &&
            cols === snap.cols &&
            rows === snap.rows &&
            (cols !== lastPtyCols || rows !== lastPtyRows)
          ) {
            lastPtyCols = cols;
            lastPtyRows = rows;
            invoke('resize_pty', { id, cols, rows });
          }
        });
      }, 600);
    });
    resizeObs.observe(containerRef.current);

    return () => {
      isDisposedRef.current = true;
      termRef.current = null;
      fitRef.current = null;
      if (createTimer) clearTimeout(createTimer);
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeObs.disconnect();
      invoke('close_pty', { id });
      term.dispose();
    };
  }, [id, cwd]);

  return (
    <div
      onClick={onClick}
      className={`group relative flex-1 min-w-0 min-h-0 rounded-lg overflow-hidden cursor-pointer transition-all duration-150
        ${
          isActive
            ? 'ring-2 ring-violet-500 shadow-[0_0_20px_rgba(124,58,237,0.3)]'
            : 'ring-1 ring-white/10 hover:ring-white/20'
        }
        bg-black/40 backdrop-blur-sm`}
    >
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center text-white/30 text-sm">
          Starting shell…
        </div>
      )}
      <div
        className={`absolute top-1.5 right-1.5 z-10 flex items-center justify-center
        w-5 h-5 rounded text-[10px] font-mono font-semibold leading-none select-none
        transition-opacity duration-300 pointer-events-none
        ${isActive ? 'opacity-60' : 'opacity-20 group-hover:opacity-40'}
        bg-black/50 text-white/90 backdrop-blur-sm`}
      >
        {index + 1}
      </div>
      <div ref={containerRef} className="w-full h-full p-1" />
    </div>
  );
}
