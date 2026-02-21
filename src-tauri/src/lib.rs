mod pty;
use pty::{PtyManager, close_pty, create_pty, resize_pty, write_pty};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(PtyManager::new())
        .invoke_handler(tauri::generate_handler![
            create_pty,
            write_pty,
            resize_pty,
            close_pty
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
