use parking_lot::Mutex;
use portable_pty::{native_pty_system, CommandBuilder, PtyPair, PtySize};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::Arc;
use tauri::ipc::Channel;

const CI_ENV_DENYLIST: &[&str] = &[
    "CI",
    "CONTINUOUS_INTEGRATION",
    "BUILD_NUMBER",
    "RUN_ID",
    "CI_NAME",
    "GITHUB_ACTIONS",
    "GITLAB_CI",
    "CIRCLECI",
    "TRAVIS",
    "APPVEYOR",
    "BUILDKITE",
    "DRONE",
    "SEMAPHORE",
    "TF_BUILD",
    "TEAMCITY_VERSION",
    "JENKINS_URL",
    "HUDSON_URL",
    "BITBUCKET_COMMIT",
    "CODEBUILD_BUILD_ARN",
    "SYSTEM_TEAMFOUNDATIONCOLLECTIONURI",
];

const IDE_ENV_PREFIX_DENYLIST: &[&str] = &["VSCODE_", "ELECTRON_", "GITHUB_CODESPACES_"];

struct PtySession {
    writer: Box<dyn Write + Send>,
    pair: PtyPair,
    cols: u16,
    rows: u16,
}

type SessionMap = Arc<Mutex<HashMap<String, PtySession>>>;

pub struct PtyManager {
    sessions: SessionMap,
}

impl PtyManager {
    pub fn new() -> Self {
        Self {
            sessions: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

/// Strip environment variables that trick spinner/prompt libraries into
/// disabling cursor-based redraws (CI flags, IDE hooks, etc.).
/// Uses a denylist so that tokens, API keys, and tool configs pass through.
fn sanitize_env(cmd: &mut CommandBuilder) {
    for key in CI_ENV_DENYLIST {
        cmd.env_remove(key);
    }

    for (key, _) in std::env::vars() {
        if IDE_ENV_PREFIX_DENYLIST
            .iter()
            .any(|prefix| key.starts_with(prefix))
        {
            cmd.env_remove(&key);
        }
    }

    cmd.env_remove("TERM_PROGRAM");
    cmd.env_remove("TERM_PROGRAM_VERSION");
    cmd.env_remove("VSCODE_IPC_HOOK_CLI");
    cmd.env_remove("GIT_ASKPASS");
    cmd.env_remove("SSH_ASKPASS");
}

/// Find the last byte offset that ends on a complete UTF-8 character boundary.
/// Prevents `String::from_utf8_lossy` from replacing trailing partial
/// multi-byte sequences with U+FFFD, which would corrupt line-width
/// calculations in cursor-based renderers like Ink.
fn utf8_boundary(data: &[u8]) -> usize {
    let len = data.len();
    if len == 0 {
        return 0;
    }
    // ASCII tail — everything is fine
    if data[len - 1] < 0x80 {
        return len;
    }
    // Walk backwards past continuation bytes (10xxxxxx)
    let mut i = len - 1;
    while i > 0 && data[i] & 0xC0 == 0x80 {
        i -= 1;
    }
    let leading = data[i];
    let expected = if leading < 0xC0 {
        1
    } else if leading < 0xE0 {
        2
    } else if leading < 0xF0 {
        3
    } else {
        4
    };
    if len - i >= expected {
        len
    } else {
        i
    }
}

#[tauri::command]
pub async fn create_pty(
    id: String,
    cols: u16,
    rows: u16,
    cwd: Option<String>,
    on_data: Channel<String>,
    state: tauri::State<'_, PtyManager>,
) -> Result<(), String> {
    if cols == 0 || rows == 0 {
        return Err(format!("Invalid PTY dimensions: {}x{}", cols, rows));
    }

    let pty_system = native_pty_system();
    let pair = pty_system
        .openpty(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| e.to_string())?;

    let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string());
    let mut cmd = CommandBuilder::new(&shell);
    cmd.arg("-l");

    sanitize_env(&mut cmd);

    cmd.env("SHELL", &shell);
    cmd.env("TERM", "xterm-256color");
    cmd.env("TERM_PROGRAM", "zynthetix-autoagent");
    cmd.env("COLORTERM", "truecolor");
    cmd.env("COLUMNS", cols.to_string());
    cmd.env("LINES", rows.to_string());
    cmd.env("FORCE_COLOR", "3");
    cmd.env("CLICOLOR_FORCE", "1");
    cmd.env("PROMPT_EOL_MARK", "");

    if let Some(dir) = cwd {
        cmd.cwd(dir);
    }

    pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;

    let mut reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;
    let writer = pair.master.take_writer().map_err(|e| e.to_string())?;

    // Two-thread pipeline: reader → mpsc → emitter → Channel.
    //
    // The reader grabs data from the PTY kernel buffer as fast as it arrives.
    // The emitter drains ALL pending chunks before sending a single IPC message,
    // ensuring multi-part ANSI sequences (cursor-up + erase + rewrite) reach
    // xterm.js in one write() call.
    //
    // UTF-8 boundary handling: we never split a multi-byte character across two
    // Channel messages, which would cause `from_utf8_lossy` to replace trailing
    // bytes with U+FFFD. That shifts the visible character widths, making Ink
    // miscalculate cursor-up line counts and produce duplicate lines.
    let (tx, rx) = std::sync::mpsc::channel::<Vec<u8>>();

    std::thread::spawn(move || {
        let mut buf = [0u8; 16384];
        loop {
            match reader.read(&mut buf) {
                Ok(0) | Err(_) => break,
                Ok(n) => {
                    if tx.send(buf[..n].to_vec()).is_err() {
                        break;
                    }
                }
            }
        }
    });

    std::thread::spawn(move || {
        let mut leftover: Vec<u8> = Vec::new();
        loop {
            let first = match rx.recv() {
                Ok(data) => data,
                Err(_) => {
                    if !leftover.is_empty() {
                        let data = String::from_utf8_lossy(&leftover).to_string();
                        let _ = on_data.send(data);
                    }
                    break;
                }
            };

            let mut batch = std::mem::take(&mut leftover);
            batch.extend(first);
            // Yield to let the reader push any remaining chunks from the same
            // burst of PTY output before we coalesce and send.
            std::thread::yield_now();
            while let Ok(more) = rx.try_recv() {
                batch.extend(more);
            }

            let boundary = utf8_boundary(&batch);
            if boundary < batch.len() {
                leftover = batch[boundary..].to_vec();
            }

            if boundary > 0 {
                let data = String::from_utf8_lossy(&batch[..boundary]).to_string();
                if on_data.send(data).is_err() {
                    break;
                }
            }
        }
    });

    let session = PtySession {
        writer,
        pair,
        cols,
        rows,
    };
    state.sessions.lock().insert(id, session);
    Ok(())
}

#[tauri::command]
pub async fn write_pty(
    id: String,
    data: String,
    state: tauri::State<'_, PtyManager>,
) -> Result<(), String> {
    let mut sessions = state.sessions.lock();
    let session = sessions.get_mut(&id).ok_or("Session not found")?;
    session
        .writer
        .write_all(data.as_bytes())
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn resize_pty(
    id: String,
    cols: u16,
    rows: u16,
    state: tauri::State<'_, PtyManager>,
) -> Result<(), String> {
    let mut sessions = state.sessions.lock();
    let session = sessions.get_mut(&id).ok_or("Session not found")?;
    if session.cols == cols && session.rows == rows {
        return Ok(());
    }
    session
        .pair
        .master
        .resize(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| e.to_string())?;
    session.cols = cols;
    session.rows = rows;
    Ok(())
}

#[tauri::command]
pub async fn close_pty(id: String, state: tauri::State<'_, PtyManager>) -> Result<(), String> {
    state.sessions.lock().remove(&id);
    Ok(())
}
