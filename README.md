# Zynthetix AutoAgent

> **The cockpit for AI-assisted development.** Manage multiple AI agent terminal sessions in parallel — without the chaos.

![Version](https://img.shields.io/badge/version-0.1.0-violet) ![Platform](https://img.shields.io/badge/platform-macOS%2013%2B-black) ![License](https://img.shields.io/badge/license-MIT-green) ![Built with Tauri](https://img.shields.io/badge/built%20with-Tauri%20v2-24c8db)

---

## What is this?

Zynthetix AutoAgent is a free, open-source macOS desktop app for solo developers and indie hackers who run AI coding agents (Claude Code, Copilot CLI, Aider, GPT-Engineer, etc.) in parallel.

It is **not** an AI agent itself — it's the **cockpit** from which you manage them.

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
│  Layout: 2×2 Grid · 4 terminals   [Layout picker]   │
└──────────────────────────────────────────────────────┘
```

---

## Download & Install (macOS)

1. Go to [**Releases**](https://github.com/Zynthetix/zynthetix-autoagent/releases/latest)
2. Download `Zynthetix AutoAgent_0.1.0_aarch64.dmg`
3. Open the `.dmg` → drag **Zynthetix AutoAgent.app** to `/Applications`

> **First launch:** macOS will block an unsigned app. Fix: **Right-click the app → Open** → click Open. You only need to do this once.

---

## Features (v0.1.0)

- **Terminal grid layouts** — Solo, Side by Side, Stacked, 3 Columns, 2×2, 3×3, 4×4
- **Visual layout picker** — mini grid previews in the status bar with tooltips
- **Stable terminals** — switching layouts never kills running sessions; existing terminals stay intact
- **Smart shrink warning** — when reducing terminals, pick exactly *which ones* to close
- **Terminal number badges** — subtle top-right badge on each cell so you always know which is which
- **Project tabs** — open multiple codebases, switch instantly
- **Real PTY sessions** — full xterm.js with 256-colour support, your default shell (`$SHELL`)
- **Glassmorphism dark UI** — violet accents, SF Mono terminals, macOS-native feel

---

## Build from Source

**Prerequisites:** macOS 13+, [Rust stable](https://rustup.rs/), Node.js 18+

```bash
git clone https://github.com/Zynthetix/zynthetix-autoagent.git
cd zynthetix-autoagent
npm install
npm run tauri dev        # development with hot reload
npm run tauri build      # production — outputs .app + .dmg
```

Built DMG location:
```
src-tauri/target/release/bundle/dmg/Zynthetix AutoAgent_0.1.0_aarch64.dmg
```

---

## Updating the App

```bash
git pull
npm install              # only if dependencies changed
npm run tauri build

# Quit the running app (Cmd+Q), then replace:
cp -R "src-tauri/target/release/bundle/macos/Zynthetix AutoAgent.app" /Applications/
```

Settings survive updates — stored in `~/Library/Application Support/com.zynthetix.autoagent/`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| App shell | Tauri v2 (Rust, ~10MB binary) |
| Frontend | React + TypeScript + Tailwind CSS |
| Terminal emulator | xterm.js |
| Terminal backend | `portable-pty` (real PTY via Rust) |
| State | Zustand |
| Build | Vite + Tauri bundler |

---

## Roadmap

- **v0.1** ✅ Terminal grid, named layouts, project tabs, PTY backend
- **v0.2** — AI config sidebar (CLAUDE.md, plan.md, agent.md viewer)
- **v0.3** — Auto git worktree creation per terminal
- **v1.0** — Session persistence, keyboard shortcuts, auto-updater

---

## License

MIT — free to use, modify, and distribute.
