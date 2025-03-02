// uiHandlers.js
import { Platforms } from "./platforms.js";
import { exportGames, importGames } from "../utils/importExport.js";
import { showEditMenu, showPlatformTagMenu } from "./ui.js";
import { Settings } from "./settings.js";

// Gemmer app reference
let appInstance = null;

export function initUIHandlers(app) {
  // Gem app referencen
  appInstance = app;
  
  // Cache DOM-elementer
  const modals = {
    addGame: document.getElementById("addGameModal"),
    platform: document.getElementById("platformModal"),
    editName: document.getElementById("editNameModal"),
    settings: document.getElementById("settingsModal")
  };
  
  const buttons = {
    addGame: document.getElementById("addGameBtn"),
    platform: document.getElementById("platformBtn"),
    export: document.getElementById("exportBtn"),
    import: document.getElementById("importBtn"),
    importFile: document.getElementById("importFile"),
    editName: document.getElementById("editNameBtn"),
    dropdown: document.getElementById("dropdownBtn"),
    dropdownContent: document.getElementById("dropdownContent"),
    logout: document.getElementById("logoutBtn"),
    settings: document.getElementById("settingsBtn"),
    closeButtons: document.querySelectorAll(".close")
  };
  
  const forms = {
    addGame: document.getElementById("addGameForm"),
    editName: document.getElementById("editNameForm")
  };

  // Fælles modalfunktioner
  function closeAllModals() {
    Object.values(modals).forEach(modal => {
      if (modal) modal.style.display = "none";
    });
  }

  function toggleModal(modalToToggle) {
    if (!modalToToggle) return;
    
    if (modalToToggle.style.display === "block") {
      modalToToggle.style.display = "none";
    } else {
      closeAllModals();
      modalToToggle.style.display = "block";
      
      // Specialhåndtering for forskellige modals
      if (modalToToggle === modals.addGame) {
        const platformSelect = document.getElementById("gamePlatform");
        if (platformSelect) platformSelect.innerHTML = Platforms.getPlatformSelectOptions();
      } else if (modalToToggle === modals.platform) {
        Platforms.renderPlatformList();
      } else if (modalToToggle === modals.editName) {
        document.getElementById("newName").value = appInstance.userDisplayName || "";
      } else if (modalToToggle === modals.settings) {
        Settings.updateSettingsForm();
      }
    }
  }

  // Tilføj global event delegation på document
  document.addEventListener("click", async (e) => {
    // Håndter modale knapper
    if (e.target === buttons.addGame) {
      toggleModal(modals.addGame);
    } 
    else if (e.target === buttons.platform) {
      toggleModal(modals.platform);
    }
    else if (e.target === buttons.export) {
      await exportGames();
    }
    else if (e.target === buttons.import) {
      buttons.importFile.click();
    }
    else if (e.target === buttons.editName) {
      toggleModal(modals.editName);
    }
    else if (e.target === buttons.dropdown) {
      buttons.dropdownContent.classList.toggle("show");
    }
    else if (e.target === buttons.logout) {
      await logout();
    }
    else if (e.target === buttons.settings) {
      toggleModal(modals.settings);
    }
    // Håndter luk-knapper
    else if (e.target.classList.contains("close")) {
      const modal = e.target.closest(".modal");
      if (modal) modal.style.display = "none";
    }
    // Håndter klik på modal baggrund
    else if (e.target.classList.contains("modal")) {
      e.target.style.display = "none";
    }
    // Håndter dropdown lukning ved klik udenfor
    else if (!e.target.matches(".dropbtn")) {
      buttons.dropdownContent.classList.remove("show");
    }
  });

  // Formhåndtering
  if (forms.addGame) {
    forms.addGame.addEventListener("submit", handleAddGameSubmit);
  }
  
  if (forms.editName) {
    forms.editName.addEventListener("submit", async (e) => {
      e.preventDefault();
      const newName = document.getElementById("newName").value;
      if (appInstance && typeof appInstance.updateUserName === 'function') {
        await appInstance.updateUserName(newName);
        modals.editName.style.display = "none";
      }
    });
  }

  // Import file change event
  if (buttons.importFile) {
    buttons.importFile.addEventListener("change", async (e) => {
      if (e.target.files.length > 0) {
        await importGames(e.target.files[0]);
      }
    });
  }

  function handleAddGameSubmit(e) {
    e.preventDefault();
    const title = document.getElementById("gameTitle").value;
    const platformId = document.getElementById("gamePlatform").value;
    
    if (title && platformId && appInstance && typeof appInstance.addGame === 'function') {
      appInstance.addGame(title, platformId);
      modals.addGame.style.display = "none";
      e.target.reset();
    }
  }

  // Initialiser indstillinger
  Settings.init();
}

async function logout() {
  if (!appInstance) return;
  
  try {
    if (typeof appInstance.syncWithFirebase === "function") {
      await appInstance.syncWithFirebase();
    }
    await window.auth.signOut();
    window.location.href = "login.html";
  } catch (error) {
    console.error("Error signing out:", error);
  }
}