# Zynthetix AutoAgent

> **The cockpit for AI-assisted development.** Manage multiple AI agent terminal sessions in parallel — without the chaos.

![Version](https://img.shields.io/badge/version-0.2.1-violet) ![Platform](https://img.shields.io/badge/platform-macOS%2013%2B-black) ![License](https://img.shields.io/badge/license-MIT-green) ![Built with Tauri](https://img.shields.io/badge/built%20with-Tauri%20v2-24c8db)

---

## What is this?

Zynthetix AutoAgent is a free, open-source macOS desktop app for solo developers and indie hackers who run AI coding agents (Claude Code, Copilot CLI, Aider, GPT-Engineer, etc.) in parallel.

It is **not** an AI agent itself — it's the **cockpit** from which you manage them.

Think of it as **iTerm2 meets project management, purpose-built for AI-assisted development**.

```
┌──────────────────────────────────────────────────────┐
│  [Project A] [Project B] [+]                         │
├──────────────────────────────────────────────────────┤
│  ┌──────────────┬──────────────┐                     │
│  │  Terminal 1  │  Terminal 2  │  ← each running an  │
│  │  Claude Code │  Aider       │    AI agent         │
│  ├──────────────┼──────────────┤                     │
│  │  Terminal 3  │  Terminal 4  │                     │
│  │  Copilot CLI │  GPT-Eng     │                     │
│  └──────────────┴──────────────┘                     │
│  Layout: 2×2 Grid · 4 terminals   [Layout picker]    │
└──────────────────────────────────────────────────────┘
```

---

## Download & Install (macOS)

1. Go to [**Releases**](https://github.com/Zynthetix/zynthetix-autoagent/releases/latest)
2. Download [`Zynthetix.AutoAgent_0.2.1_aarch64.dmg`](https://github.com/Zynthetix/zynthetix-autoagent/releases/download/v0.2.1/Zynthetix.AutoAgent_0.2.1_aarch64.dmg) (Apple Silicon)
3. Open the `.dmg` → drag **Zynthetix AutoAgent.app** to `/Applications`

> **First launch:** macOS will block an unsigned app. Fix: **Right-click the app → Open** → click Open. You only need to do this once.

---

## Features (v0.2.1)

- **Zynthetix brand icon** — official Zynthetix logo as the app icon (all sizes, RGBA, ICNS, ICO)
- **Unified design system** — clean dark UI per the Zynthetix design system: `#0f0f10` background, Inter typography, 8px grid, subtle 1px borders, no glassmorphism or glow effects
- **Persistent project tabs** — open projects are remembered across app restarts
- **⌘1–9 keyboard shortcuts** — instantly switch between project tabs
- **Terminal grid layouts** — Solo, Side by Side, Stacked, 3 Columns, 2×2, 3×3, 4×4
- **Visual layout picker** — mini grid previews in the status bar with tooltips
- **Stable terminals** — switching layouts never kills running sessions; existing terminals stay intact
- **Smart shrink warning** — when reducing terminals, pick exactly *which ones* to close
- **Project tabs** — open multiple codebases, switch instantly
- **Real PTY sessions** — full xterm.js with 256-colour support, your default shell (`$SHELL`)
- **Dark-only UI** — restrained charcoal surfaces, muted violet accent, SF Mono terminals

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Tauri Window                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │  Project Tabs · [Project A] [Project B] [+]     │ │
│  ├─────────────────────────────────────────────────┤ │
│  │  ┌────────────────┬────────────────┐            │ │
│  │  │  TerminalCell  │  TerminalCell  │            │ │
│  │  │  xterm.js ←──Channel──→ PTY     │            │ │
│  │  ├────────────────┼────────────────┤            │ │
│  │  │  TerminalCell  │  TerminalCell  │            │ │
│  │  │  xterm.js ←──Channel──→ PTY     │            │ │
│  │  └────────────────┴────────────────┘            │ │
│  ├─────────────────────────────────────────────────┤ │
│  │  Status Bar · Layout picker                     │ │
│  └─────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
         │                          │
    React + TypeScript        Rust (Tauri v2)
    Tailwind CSS              portable-pty
    Zustand                   IPC Channels
```

### PTY Data Pipeline

Each terminal cell has a dedicated high-performance data pipeline:

1. **Rust reader thread** — pulls raw bytes from the PTY kernel buffer (16 KB reads)
2. **Rust emitter thread** — drains all pending chunks via an mpsc channel, coalescing them into a single batch with proper UTF-8 boundary handling
3. **Tauri IPC Channel** — delivers the batch directly to the JavaScript callback (not the global event system — Channels are purpose-built for streaming child process output)
4. **xterm.js `write()`** — processes the complete ANSI sequence in one call

This pipeline ensures multi-part ANSI sequences (cursor-up + erase + rewrite) always arrive as a single atomic write, which is critical for CLI tools that use spinner animations and progress indicators (Copilot CLI/Ink, Claude Code/@clack/prompts, etc.).

### Environment Sanitization

PTY sessions inherit the host environment but strip variables that confuse CLI tools:

- **CI flags** (`CI`, `GITHUB_ACTIONS`, `TRAVIS`, etc.) — prevents spinner libraries from disabling cursor-based redraws
- **IDE variables** (`VSCODE_*`, `ELECTRON_*`, `TERM_PROGRAM`) — prevents tools from detecting a parent IDE and using incompatible rendering modes
- **Explicit terminal identity** — sets `TERM=xterm-256color`, `COLORTERM=truecolor`, `FORCE_COLOR=3`, and `TERM_PROGRAM=zynthetix-autoagent`
- **SIGWINCH deduplication** — resize events are only sent when dimensions actually change, preventing spurious redraws

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| App shell | [Tauri v2](https://v2.tauri.app/) | Lightweight (~10 MB), native macOS integration, Rust backend |
| Frontend | React 19 + TypeScript | Largest ecosystem, great for AI-assisted development |
| Terminal emulator | [xterm.js v6](https://xtermjs.org/) | Industry standard (used by VS Code, Hyper, etc.) |
| Terminal backend | [`portable-pty`](https://docs.rs/portable-pty) | Spawn real zsh/bash sessions from Rust |
| IPC | Tauri Channels | Fast, ordered delivery designed for streaming child process output |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) | Rapid UI development, easy theming |
| State | [Zustand](https://github.com/pmndrs/zustand) | Lightweight, minimal boilerplate |

---

## Build from Source

**Prerequisites:** macOS 13+, [Rust stable](https://rustup.rs/), Node.js 18+

```bash
git clone https://github.com/Zynthetix/zynthetix-autoagent.git
cd zynthetix-autoagent
npm install
```

### Development (hot reload)

```bash
npm run tauri dev
```

### Production build

```bash
npm run tauri build -- --target aarch64-apple-darwin
```

Built artefacts:

```
src-tauri/target/aarch64-apple-darwin/release/bundle/
  ├── macos/Zynthetix AutoAgent.app
  └── dmg/Zynthetix AutoAgent_0.2.1_aarch64.dmg
```

---

## Updating the App

```bash
git pull
npm install              # only if dependencies changed
npm run tauri build -- --target aarch64-apple-darwin

# Quit the running app (Cmd+Q), then replace:
cp -R "src-tauri/target/aarch64-apple-darwin/release/bundle/macos/Zynthetix AutoAgent.app" /Applications/
```

Settings survive updates — stored in `~/Library/Application Support/com.zynthetix.autoagent/`.

---

## Project Structure

```
zynthetix-autoagent/
├── src/                        # React frontend
│   ├── main.tsx                # Entry point
│   ├── App.tsx                 # Root component (projects, layouts, grid)
│   ├── store.ts                # Zustand store (projects, layouts)
│   └── components/
│       ├── TerminalCell.tsx     # xterm.js terminal + PTY Channel
│       ├── TerminalGrid.tsx     # Grid layout renderer
│       ├── ProjectTabs.tsx      # Project tab bar
│       ├── StatusBar.tsx        # Bottom bar + layout picker
│       ├── GridSelector.tsx     # Layout selection popover
│       └── ShrinkWarningModal.tsx
├── src-tauri/                  # Rust backend
│   ├── src/
│   │   ├── lib.rs              # Tauri app setup + command registration
│   │   └── pty.rs              # PTY manager (create, write, resize, close)
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
└── README.md
```

---

## Roadmap

- **v0.1** — Terminal grid, named layouts, project tabs, PTY backend, IPC Channels
- **v0.2** — Zynthetix brand icon, unified design system (clean dark UI, Inter font, no glassmorphism), persistent project tabs, ⌘1–9 shortcuts
- **v0.3** — AI config sidebar (CLAUDE.md, plan.md, agent.md viewer)
- **v0.4** — Auto git worktree creation per terminal
- **v0.5** — Session persistence, keyboard shortcuts
- **v1.0** — Auto-updater, Homebrew cask, code signing

See the full roadmap in the [PRD](https://github.com/Zynthetix/zynthetix-autoagent/wiki) (coming soon).

---

## Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repo and create your branch from `main`
2. Run `npm install` and `npm run tauri dev` to start the development server
3. Make your changes and test thoroughly
4. Submit a pull request with a clear description

### Areas where help is appreciated

- Windows/Linux support (Tauri is cross-platform, but the PTY layer needs testing)
- Canvas/WebGL renderer addon for xterm.js v6 (currently using DOM renderer)
- Session persistence and restore
- Keyboard shortcut system
- AI config file sidebar

---

## License

[MIT](LICENSE) — free to use, modify, and distribute.

---

Built by [Zynthetix](https://github.com/Zynthetix)
