import App from "../app.js";

export const Settings = {
  showUpcoming: true,
  showPaused: true,
  showDropped: true,

  init() {
    this.loadSettings();
    this.addEventListeners();
    this.applySettingsToDOM(); // Vi tilføjer denne linje
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
    this.applySettingsToDOM(); // Anvend ændringer direkte på DOM
  },

  // Ny funktion til at anvende indstillinger direkte på DOM
  applySettingsToDOM() {
    const appElement = document.getElementById("app");
    
    // Fjern gamle klasser
    appElement.classList.remove("hide-upcoming", "hide-paused", "hide-dropped");
    
    // Tilføj nye klasser baseret på indstillinger
    if (!this.showUpcoming) appElement.classList.add("hide-upcoming");
    if (!this.showPaused) appElement.classList.add("hide-paused");
    if (!this.showDropped) appElement.classList.add("hide-dropped");
    
    // Opdater også indikator-prikker
    this.updateIndicatorDots();
  },
  
  // Ny funktion til at opdatere indikator-prikker baseret på synlige lister
  updateIndicatorDots() {
    const listIndicator = document.getElementById("listIndicator");
    if (!listIndicator) return;
    
    // Find alle synlige lister
    const visibleLists = Array.from(document.querySelectorAll('.list'))
      .filter(list => !list.closest('.hide-upcoming #upcoming, .hide-paused #paused, .hide-dropped #dropped'));
    
    // Opdater indicator dots
    listIndicator.innerHTML = "";
    visibleLists.forEach((_, index) => {
      const dot = document.createElement("div");
      dot.className = "indicator-dot";
      if (index === 0) dot.classList.add("active");
      listIndicator.appendChild(dot);
    });
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
      // Vi behøver ikke at kalde renderGames da CSS vil håndtere visningen
    });
  },

  closeSettingsModal() {
    document.getElementById("settingsModal").style.display = "none";
  },
};