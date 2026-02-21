use parking_lot::Mutex;
use portable_pty::{native_pty_system, CommandBuilder, PtyPair, PtySize};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::Arc;
use tauri::{AppHandle, Emitter};

struct PtySession {
    writer: Box<dyn Write + Send>,
    pair: PtyPair,
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

#[tauri::command]
pub async fn create_pty(
    id: String,
    cols: u16,
    rows: u16,
    cwd: Option<String>,
    state: tauri::State<'_, PtyManager>,
    app: AppHandle,
) -> Result<(), String> {
    let pty_system = native_pty_system();
    let pair = pty_system
        .openpty(PtySize { rows, cols, pixel_width: 0, pixel_height: 0 })
        .map_err(|e| e.to_string())?;

    let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string());
    let mut cmd = CommandBuilder::new(&shell);
    cmd.env("TERM", "xterm-256color");
    cmd.env("COLORTERM", "truecolor");
    if let Some(dir) = cwd {
        cmd.cwd(dir);
    }

    pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;

    let mut reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;
    let writer = pair.master.take_writer().map_err(|e| e.to_string())?;

    let session_id = id.clone();
    let app_clone = app.clone();
    std::thread::spawn(move || {
        let mut buf = [0u8; 4096];
        loop {
            match reader.read(&mut buf) {
                Ok(0) | Err(_) => break,
                Ok(n) => {
                    let data = String::from_utf8_lossy(&buf[..n]).to_string();
                    let _ = app_clone.emit(&format!("pty_data_{}", session_id), data);
                }
            }
        }
        let _ = app_clone.emit(&format!("pty_exit_{}", session_id), ());
    });

    let session = PtySession { writer, pair };
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
    session.writer.write_all(data.as_bytes()).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn resize_pty(
    id: String,
    cols: u16,
    rows: u16,
    state: tauri::State<'_, PtyManager>,
) -> Result<(), String> {
    let sessions = state.sessions.lock();
    let session = sessions.get(&id).ok_or("Session not found")?;
    session
        .pair
        .master
        .resize(PtySize { rows, cols, pixel_width: 0, pixel_height: 0 })
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn close_pty(
    id: String,
    state: tauri::State<'_, PtyManager>,
) -> Result<(), String> {
    state.sessions.lock().remove(&id);
    Ok(())
}
