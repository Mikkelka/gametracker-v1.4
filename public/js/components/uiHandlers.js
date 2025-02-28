// uiHandlers.js
import { Platforms } from "./platforms.js";
import { exportGames, importGames } from "../utils/importExport.js";
import { showEditMenu, showPlatformTagMenu } from "./ui.js";
import { Settings } from "./settings.js";

export function initUIHandlers(app) {
  const addGameBtn = document.getElementById("addGameBtn");
  const addGameModal = document.getElementById("addGameModal");
  const platformBtn = document.getElementById("platformBtn");
  const platformModal = document.getElementById("platformModal");
  const closeButtons = document.querySelectorAll(".close");
  const addGameForm = document.getElementById("addGameForm");
  const exportBtn = document.getElementById("exportBtn");
  const importBtn = document.getElementById("importBtn");
  const importFile = document.getElementById("importFile");
  const editNameBtn = document.getElementById("editNameBtn");
  const editNameModal = document.getElementById("editNameModal");
  const editNameForm = document.getElementById("editNameForm");
  const dropdownBtn = document.getElementById("dropdownBtn");
  const dropdownContent = document.getElementById("dropdownContent");
  const logoutBtn = document.getElementById("logoutBtn");
  const settingsBtn = document.getElementById("settingsBtn");
  const settingsModal = document.getElementById("settingsModal");

  const modals = [addGameModal, platformModal, editNameModal, settingsModal];

  function closeAllModals() {
    modals.forEach((modal) => {
      modal.style.display = "none";
    });
  }

  function toggleModal(modalToToggle) {
    if (modalToToggle.style.display === "block") {
      modalToToggle.style.display = "none";
    } else {
      closeAllModals();
      modalToToggle.style.display = "block";
    }
  }

  addGameBtn.addEventListener("click", () => {
    toggleModal(addGameModal);
    const platformSelect = document.getElementById("gamePlatform");
    platformSelect.innerHTML = Platforms.getPlatformSelectOptions();
  });

  platformBtn.addEventListener("click", () => {
    toggleModal(platformModal);
    Platforms.renderPlatformList();
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      button.closest(".modal").style.display = "none";
    });
  });

  window.addEventListener("click", (event) => {
    if (event.target.classList.contains("modal")) {
      event.target.style.display = "none";
    }
    if (!event.target.matches(".dropbtn")) {
      dropdownContent.classList.remove("show");
    }
  });

  addGameForm.addEventListener("submit", handleAddGameSubmit);

  document.addEventListener("click", handleClick);

  exportBtn.addEventListener("click", exportGames);

  importBtn.addEventListener("click", () => {
    importFile.click();
  });

  importFile.addEventListener("change", async (e) => {
    if (e.target.files.length > 0) {
      await importGames(e.target.files[0]);
    }
  });

  editNameBtn.addEventListener("click", () => {
    toggleModal(editNameModal);
    document.getElementById("newName").value = app.userDisplayName;
  });

  editNameForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newName = document.getElementById("newName").value;
    await app.updateUserName(newName);
    editNameModal.style.display = "none";
  });

  dropdownBtn.addEventListener("click", () => {
    dropdownContent.classList.toggle("show");
  });

  logoutBtn.addEventListener("click", () => logout(app));

  function handleAddGameSubmit(e) {
    e.preventDefault();
    const title = document.getElementById("gameTitle").value;
    const platformId = document.getElementById("gamePlatform").value;
    if (title && platformId) {
      app.addGame(title, platformId);
      addGameModal.style.display = "none";
      e.target.reset();
    }
  }

  function handleClick(e) {
    if (e.target.classList.contains("edit-btn")) {
      const gameId = e.target.dataset.id;
      const rect = e.target.getBoundingClientRect();
      showEditMenu(gameId, rect.left, rect.bottom, app);
    } else if (e.target.classList.contains("platform-pill")) {
      const gameId = e.target.dataset.gameId;
      const platformName = e.target.dataset.platformName;
      const rect = e.target.getBoundingClientRect();
      showPlatformTagMenu(gameId, platformName, rect.left, rect.bottom, app);
    }
  }

  settingsBtn.addEventListener("click", () => {
    toggleModal(settingsModal);
    Settings.updateSettingsForm();
  });

  // Initialiser indstillinger
  Settings.init();
}

async function logout(app) {
  try {
    if (typeof app.syncWithFirebase === "function") {
      await app.syncWithFirebase();
    }
    await window.auth.signOut();
    window.location.href = "login.html";
  } catch (error) {
    console.error("Error signing out:", error);
  }
}
