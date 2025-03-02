// app.js
import {
  loadGames,
  syncWithFirebase,
  saveGame,
  updateGamePlatformColor,
  debouncedSync,
  setSyncCallback,
  clearCache,
} from "./services/storage.js";
import { render, updatePlatformColors } from "./components/ui.js";
import { initDragAndDrop } from "./utils/dragAndDrop.js";
import { Platforms } from "./components/platforms.js";
import { initGameActions } from "./components/gameActions.js";
import { initUIHandlers } from "./components/uiHandlers.js";
import { UserManagement } from "./services/userManagement.js";
import { initScrollToTop } from "./utils/scroll-to-top.js";
import { Settings } from "./components/settings.js";
import { initSearch } from "./utils/search.js";

const App = {
  games: [],
  lists: [
    { id: "upcoming", name: "Ser frem til" },
    { id: "willplay", name: "Vil spille" },
    { id: "playing", name: "Spiller nu" },
    { id: "completed", name: "Gennemført" },
    { id: "paused", name: "På pause" },
    { id: "dropped", name: "Droppet" },
  ],
  currentUser: null,
  userDisplayName: null,
  isMoveModeActive: false,
  activeCardId: null,

  async init() {
    window.auth.onAuthStateChanged(async (user) => {
      if (user) {
        await this.initializeApp(user);
      } else {
        console.log("No user is logged in");
        clearCache(); // Clear cache on logout
        window.location.href = "login.html";
      }
    });
  },

  async initializeApp(user) {
    this.currentUser = user;

    // Initialize search
    window.searchUtils = initSearch(this);

    await UserManagement.createOrUpdateUser(user);
    this.userDisplayName = await UserManagement.getUserDisplayName(user.uid);
    this.updateUserNameDisplay();

    try {
      this.games = await loadGames();
      setSyncCallback(this.handleRealTimeUpdate.bind(this));
    } catch (error) {
      console.error("Error loading games:", error);
      this.games = [];
    }

    await Platforms.init(user);
    await Settings.init(); // Initialize settings

    initGameActions(this);
    initUIHandlers(this);
    this.renderGames(); // Use a new method to render games
    initDragAndDrop(this);
    initScrollToTop();
  },

  renderGames() {
    // Filter the lists based on settings
    const visibleLists = this.lists.filter(
      (list) =>
        !(list.id === "upcoming" && !Settings.showUpcoming) &&
        !(list.id === "paused" && !Settings.showPaused) &&
        !(list.id === "dropped" && !Settings.showDropped)
    );
    render(this.games, visibleLists, this); // Send app-objektet med til render
  },
  
  handleRealTimeUpdate(updatedGames) {
    this.games = updatedGames;
    this.renderGames();
  },

  async syncWithFirebase() {
    console.log("App.syncWithFirebase called");
    try {
      await syncWithFirebase();
      console.log("Sync with Firebase completed, reloading games");
      this.games = await loadGames();
      console.log(`Loaded ${this.games.length} games after sync`);
      render(this.games, this.lists);
      this.showSyncPopup();
    } catch (error) {
      console.error("Error syncing with Firebase:", error);
    }
  },

  updateUserNameDisplay() {
    const userNameDisplay = document.getElementById("userNameDisplay");
    if (userNameDisplay) {
      userNameDisplay.textContent = this.userDisplayName || "Gæst";
    }
  },

  async updateUserName(newName) {
    try {
      if (
        await UserManagement.updateUserDisplayName(
          this.currentUser.uid,
          newName
        )
      ) {
        this.userDisplayName = newName;
        this.updateUserNameDisplay();
      }
    } catch (error) {
      console.error("Error updating user name:", error);
    }
  },

  async updatePlatformColor(platformName, newColor) {
    try {
      this.games = await updateGamePlatformColor(platformName, newColor);
      updatePlatformColors(platformName, newColor);
      render(this.games, this.lists);
    } catch (error) {
      console.error("Error updating platform color:", error);
    }
  },

  async setTodayAsCompletionDate(gameId) {
    try {
      const game = this.games.find((g) => g.id == gameId);
      if (game) {
        const today = new Date();
        const formattedDate = `${today
          .getDate()
          .toString()
          .padStart(2, "0")}-${(today.getMonth() + 1)
          .toString()
          .padStart(2, "0")}-${today.getFullYear()}`;
        game.completionDate = formattedDate;
        game.status = "completed";
        await saveGame(game);
        this.games = await loadGames();
        render(this.games, this.lists);
        debouncedSync();
      }
    } catch (error) {
      console.error("Error setting completion date:", error);
    }
  },

  async changePlatform(gameId, newPlatformId) {
    try {
      const game = this.games.find((g) => g.id == gameId);
      const newPlatform = Platforms.list.find((p) => p.id === newPlatformId);
      if (game && newPlatform) {
        game.platform = newPlatform.name;
        game.platformColor = newPlatform.color;
        await saveGame(game);
        this.games = await loadGames();
        render(this.games, this.lists);
        debouncedSync();
      }
    } catch (error) {
      console.error("Error changing platform:", error);
    }
  },

  toggleMoveMode(cardId) {
    this.isMoveModeActive = !this.isMoveModeActive;
    this.activeCardId = this.isMoveModeActive ? cardId : null;

    document.querySelectorAll(".card .move-arrows").forEach((arrows) => {
      arrows.style.display = this.isMoveModeActive ? "flex" : "none";
    });

    if (this.isMoveModeActive) {
      document.addEventListener("click", this.handleMoveArrowClick.bind(this));
    } else {
      document.removeEventListener(
        "click",
        this.handleMoveArrowClick.bind(this)
      );
    }

    console.log(
      `Move mode ${
        this.isMoveModeActive ? "activated" : "deactivated"
      } for card ${this.activeCardId}`
    );
  },

  handleMoveArrowClick(event) {
    if (
      !event.target.classList.contains("move-up") &&
      !event.target.classList.contains("move-down")
    ) {
      return;
    }

    const direction = event.target.classList.contains("move-up")
      ? "up"
      : "down";
    const targetCard = event.target.closest(".card");
    const targetCardId = targetCard.dataset.id;

    console.log(
      `Attempting to move card ${this.activeCardId} ${direction} relative to ${targetCardId}`
    );

    if (!this.activeCardId) {
      console.error("No active card selected for moving");
      return;
    }

    this.moveCard(this.activeCardId, targetCardId, direction);
  },

  async moveCard(movedCardId, targetCardId, direction) {
    console.log(
      `moveCard called with movedCardId: ${movedCardId}, targetCardId: ${targetCardId}, direction: ${direction}`
    );

    const movedCardIndex = this.games.findIndex(
      (game) => game.id === movedCardId
    );
    const targetCardIndex = this.games.findIndex(
      (game) => game.id === targetCardId
    );

    console.log(
      `movedCardIndex: ${movedCardIndex}, targetCardIndex: ${targetCardIndex}`
    );

    if (movedCardIndex === -1 || targetCardIndex === -1) {
      console.error(
        `Kunne ikke finde et af kortene. movedCardId: ${movedCardId}, targetCardId: ${targetCardId}`
      );
      console.log("Current games:", this.games);
      return;
    }

    const movedCard = this.games[movedCardIndex];
    const targetCard = this.games[targetCardIndex];

    console.log(`Moving card: ${JSON.stringify(movedCard)}`);
    console.log(`Target card: ${JSON.stringify(targetCard)}`);

    // Fjern det flyttede kort fra sin nuværende position
    this.games.splice(movedCardIndex, 1);

    // Opdater status hvis kortet flyttes til en anden liste
    if (movedCard.status !== targetCard.status) {
      movedCard.status = targetCard.status;
      console.log(`Updated status of moved card to: ${movedCard.status}`);
    }

    // Bestem den nye position
    let newIndex;
    if (direction === "up") {
      newIndex =
        targetCardIndex > movedCardIndex
          ? targetCardIndex - 1
          : targetCardIndex;
    } else {
      newIndex =
        targetCardIndex < movedCardIndex
          ? targetCardIndex + 1
          : targetCardIndex;
    }

    console.log(`New index for moved card: ${newIndex}`);

    // Indsæt det flyttede kort på den nye position
    this.games.splice(newIndex, 0, movedCard);

    // Opdater 'order' for alle kort i den relevante liste
    const statusGames = this.games.filter(
      (game) => game.status === movedCard.status
    );
    statusGames.sort((a, b) => this.games.indexOf(a) - this.games.indexOf(b));

    let updatedGames = [];
    for (let i = 0; i < statusGames.length; i++) {
      if (statusGames[i].order !== i) {
        statusGames[i].order = i;
        updatedGames.push(statusGames[i]);
      }
    }

    console.log(`Number of games to update: ${updatedGames.length}`);

    // Gem kun de ændrede spil
    if (updatedGames.length > 0) {
      try {
        await Promise.all(updatedGames.map((game) => saveGame(game)));
        console.log(`Updated order for ${updatedGames.length} games`);
      } catch (error) {
        console.error("Error saving updated games:", error);
      }
    }

    render(this.games, this.lists);
    debouncedSync();

    // Deaktiver move-tilstand efter flytning
    this.toggleMoveMode(null);
  },

  showSyncPopup() {
    const popup = document.getElementById("syncPopup");
    if (popup) {
      popup.classList.add("show");
      setTimeout(() => {
        popup.classList.remove("show");
      }, 3000);
    } else {
      console.error("Sync popup element not found");
    }
  },
};

document.addEventListener("DOMContentLoaded", () => App.init());

export default App;
