// js/components/settings.js
import App from "../app.js";

export const Settings = {
  showUpcoming: true,
  showPaused: true,
  showDropped: true,

  init() {
    this.loadSettings();
    this.addEventListeners();
  },

  loadSettings() {
    const savedSettings = localStorage.getItem("gameTrackSettings");
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      this.showUpcoming = parsedSettings.showUpcoming ?? true;
      this.showPaused = parsedSettings.showPaused ?? true;
      this.showDropped = parsedSettings.showDropped ?? true;
    }
    this.updateSettingsForm();
  },

  saveSettings() {
    localStorage.setItem(
      "gameTrackSettings",
      JSON.stringify({
        showUpcoming: this.showUpcoming,
        showPaused: this.showPaused,
        showDropped: this.showDropped,
      })
    );
  },

  updateSettingsForm() {
    document.getElementById("showUpcoming").checked = this.showUpcoming;
    document.getElementById("showPaused").checked = this.showPaused;
    document.getElementById("showDropped").checked = this.showDropped;
  },

  addEventListeners() {
    const settingsForm = document.getElementById("settingsForm");
    settingsForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.showUpcoming = document.getElementById("showUpcoming").checked;
      this.showPaused = document.getElementById("showPaused").checked;
      this.showDropped = document.getElementById("showDropped").checked;
      this.saveSettings();
      this.closeSettingsModal();
      App.renderGames(); // Re-render games with new settings
    });
  },

  closeSettingsModal() {
    document.getElementById("settingsModal").style.display = "none";
  },
};
