export const soundCommand = {
  description: "Toggles sound effects",
  execute: () => {
    if (window.SoundManager) {
      const enabled = window.SoundManager.toggle();
      const status = enabled ? "enabled" : "disabled";
      const statusBar = document.getElementById("system-status-bar");
      if (statusBar) {
        statusBar.innerText = `[SYSTEM] Sound effects ${status}`;
      }
    }
  },
};
