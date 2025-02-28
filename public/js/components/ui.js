// ui.js
import { Platforms } from "./platforms.js";
import { Settings } from "./settings.js";

export function render(games, lists) {
  const app = document.getElementById("app");
  const listIndicator = document.getElementById("listIndicator");
  const listsContainer = document.getElementById("listsContainer");

  listIndicator.innerHTML = "";
  listsContainer.innerHTML = "";

  // Create indicator dots only for visible lists
  lists.forEach((list, index) => {
    if (
      (list.id === "upcoming" && !Settings.showUpcoming) ||
      (list.id === "paused" && !Settings.showPaused) ||
      (list.id === "dropped" && !Settings.showDropped)
    ) {
      return; // Skip this list
    }
    const dot = document.createElement("div");
    dot.className = "indicator-dot";
    if (index === 0) dot.classList.add("active");
    listIndicator.appendChild(dot);
  });

  lists.forEach(({ id, name }) => {
    if (
      (id === "upcoming" && !Settings.showUpcoming) ||
      (id === "paused" && !Settings.showPaused) ||
      (id === "dropped" && !Settings.showDropped)
    ) {
      return; // Skip rendering this list
    }

    const listElement = document.createElement("div");
    listElement.className = "list";
    listElement.id = id;
    listElement.innerHTML = `<h2>${name}</h2>`;

    const listGames = games.filter((game) => game.status === id);

    // Sort games only by order, ensuring it's always a number
    listGames.sort((a, b) => {
      const orderA = Number(a.order) || 0;
      const orderB = Number(b.order) || 0;
      return orderA - orderB;
    });

    if (listGames.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "empty-list-message";
      // emptyMessage.textContent = "Ingen spil i denne liste";
      listElement.appendChild(emptyMessage);
    } else {
      listGames.forEach((game) => {
        listElement.appendChild(createGameCard(game));
      });
    }

    listsContainer.appendChild(listElement);
  });

  // Add scroll event listener to update indicator
  listsContainer.addEventListener("scroll", updateIndicator);

  if (window.searchUtils && typeof window.searchUtils.updateSearch === 'function') {
    window.searchUtils.updateSearch();
  }

}

function updateIndicator() {
  const listsContainer = document.getElementById("listsContainer");
  const indicators = document.querySelectorAll(".indicator-dot");
  const lists = document.querySelectorAll(".list");

  const scrollPosition = listsContainer.scrollLeft;
  const containerWidth = listsContainer.offsetWidth;

  const activeIndex = Math.round(scrollPosition / containerWidth);

  indicators.forEach((indicator, index) => {
    indicator.classList.toggle("active", index === activeIndex);
  });
}

function createGameCard(game) {
  const cardElement = document.createElement("div");
  cardElement.className = `card ${game.favorite ? "favorite" : ""}`;
  cardElement.draggable = true;

  cardElement.innerHTML = `
    <div class="card-header">
      <h3>${game.title}</h3>
      <button class="edit-btn" data-id="${game.id}">⋮</button>
    </div>
    <div class="card-details">
      <span class="platform-pill" style="background-color: ${
        game.platformColor
      }" data-platform-name="${game.platform}" data-game-id="${game.id}">${
    game.platform
  }</span>
      ${
        game.completionDate
          ? `<span class="completion-date">${game.completionDate}</span>`
          : ""
      }
    </div>
    <div class="move-arrows" style="display: none;">
      <button class="move-up" aria-label="Flyt op">⬆️</button>
      <button class="move-down" aria-label="Flyt ned">⬇️</button>
    </div>
  `;
  cardElement.dataset.id = game.id;
  cardElement.dataset.order = Number(game.order) || 0;
  return cardElement;
}

export function showEditMenu(gameId, x, y, app) {
  const existingMenu = document.querySelector(".edit-menu");
  if (existingMenu) {
    existingMenu.remove();
  }

  const game = app.games.find((g) => g.id == gameId);
  const menu = document.createElement("div");
  menu.className = "edit-menu";
  menu.style.position = "absolute";

  // Get the card element
  const card = document.querySelector(`.card[data-id="${gameId}"]`);
  const cardRect = card.getBoundingClientRect();

  // Calculate position relative to the card
  menu.style.left = `${x - cardRect.left}px`;
  menu.style.top = `${y - cardRect.top}px`;

  menu.innerHTML = `
  <button class="favorite-btn" data-id="${gameId}">${
    game.favorite ? "Fjern favorit" : "Marker som favorit"
  }</button>
  <button class="edit-date-btn" data-id="${gameId}">Rediger dato</button>
  <button class="today-date-btn" data-id="${gameId}">Dagens dato</button>
  <button class="move-card-btn" data-id="${gameId}">Flyt kort</button>
  <button class="delete-btn" data-id="${gameId}">Slet</button>
`;

  // Append the menu to the card instead of the body
  card.appendChild(menu);

  addEditMenuListeners(menu, gameId, app);
}

function addEditMenuListeners(menu, gameId, app) {
  menu.querySelector(".favorite-btn").addEventListener("click", () => {
    app.toggleFavorite(gameId);
    menu.remove();
  });

  menu.querySelector(".edit-date-btn").addEventListener("click", () => {
    const game = app.games.find((g) => g.id == gameId);
    const currentDate = game.completionDate || "";
    const newDate = prompt(
      "Indtast gennemførelsesdato (DD-MM-ÅÅÅÅ):",
      currentDate
    );
    if (newDate !== null) {
      app.setCompletionDate(gameId, newDate);
    }
    menu.remove();
  });

  menu.querySelector(".move-card-btn").addEventListener("click", () => {
    app.toggleMoveMode(gameId);
    menu.remove();
  });

  menu.querySelector(".today-date-btn").addEventListener("click", () => {
    app.setTodayAsCompletionDate(gameId);
    menu.remove();
  });

  menu.querySelector(".delete-btn").addEventListener("click", () => {
    if (confirm("Er du sikker på, at du vil slette dette spil?")) {
      app.deleteGame(gameId);
    }
    menu.remove();
  });

  document.addEventListener("click", function closeMenu(e) {
    if (!menu.contains(e.target) && !e.target.classList.contains("edit-btn")) {
      menu.remove();
      document.removeEventListener("click", closeMenu);
    }
  });
}

export function showPlatformTagMenu(gameId, currentPlatform, x, y, app) {
  const existingMenu = document.querySelector(".platform-tag-menu");
  if (existingMenu) {
    existingMenu.remove();
  }

  const menu = document.createElement("div");
  menu.className = "platform-tag-menu";
  menu.style.position = "absolute";

  // Get the card element
  const card = document.querySelector(`.card[data-id="${gameId}"]`);
  const cardRect = card.getBoundingClientRect();

  // Calculate position relative to the card
  menu.style.left = `${x - cardRect.left}px`;
  menu.style.top = `${y - cardRect.top}px`;

  let menuContent = Platforms.list
    .map(
      (platform) =>
        `<button class="change-platform-btn" data-id="${gameId}" data-platform-id="${platform.id}">${platform.name}</button>`
    )
    .join("");

  menu.innerHTML = menuContent;

  // Append the menu to the card instead of the body
  card.appendChild(menu);

  addPlatformTagMenuListeners(menu, gameId, currentPlatform, app);
}

function addPlatformTagMenuListeners(menu, gameId, currentPlatform, app) {
  menu.querySelectorAll(".change-platform-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const newPlatformId = button.dataset.platformId;
      app.changePlatform(gameId, newPlatformId);
      menu.remove();
    });
  });

  document.addEventListener("click", function closeMenu(e) {
    if (
      !menu.contains(e.target) &&
      !e.target.classList.contains("platform-pill")
    ) {
      menu.remove();
      document.removeEventListener("click", closeMenu);
    }
  });
}

export function updatePlatformColors(platformName, newColor) {
  const platformPills = document.querySelectorAll(
    `.platform-pill[data-platform-name="${platformName}"]`
  );
  platformPills.forEach((pill) => {
    pill.style.backgroundColor = newColor;
  });
}
