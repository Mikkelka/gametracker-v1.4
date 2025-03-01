// ui.js
import { Platforms } from "./platforms.js";
import { Settings } from "./settings.js";

// Cache af seneste renderede spil, grupperet efter liste
let previousGamesState = {
  upcoming: [],
  willplay: [],
  playing: [],
  completed: [],
  paused: [],
  dropped: []
};

// Cache af DOM-referencer
const domCache = {
  lists: {}
};

export function render(games, lists) {
  const app = document.getElementById("app");
  const listIndicator = document.getElementById("listIndicator");
  const listsContainer = document.getElementById("listsContainer");
  
  // Opdater indikator-dots først
  updateListIndicator(listIndicator, lists);
  
  // Initialiser DOM cache for lister, hvis det er første render
  if (Object.keys(domCache.lists).length === 0) {
    initializeDomCache(listsContainer);
  }
  
  // Gruppér spil efter status for lettere sammenligning
  const currentGamesByStatus = groupGamesByStatus(games);
  
  // Render hver liste, men kun hvis der er ændringer
  lists.forEach(({ id, name }) => {
    // Tjek om listen skal vises baseret på indstillinger
    if (
      (id === "upcoming" && !Settings.showUpcoming) ||
      (id === "paused" && !Settings.showPaused) ||
      (id === "dropped" && !Settings.showDropped)
    ) {
      // Skjul listen hvis den er synlig, men skal skjules
      if (domCache.lists[id] && domCache.lists[id].element.parentNode) {
        listsContainer.removeChild(domCache.lists[id].element);
      }
      return;
    }
    
    const currentGamesInList = currentGamesByStatus[id] || [];
    const previousGamesInList = previousGamesState[id] || [];
    
    // Tjek om der er ændringer i listen
    if (hasListChanged(currentGamesInList, previousGamesInList)) {
      updateList(id, name, currentGamesInList, listsContainer);
      // Opdater cache for denne liste
      previousGamesState[id] = JSON.parse(JSON.stringify(currentGamesInList));
    }
  });
  
  // Tilføj scroll event listener til at opdatere indikator
  if (!listsContainer.hasScrollListener) {
    listsContainer.addEventListener("scroll", updateIndicator);
    listsContainer.hasScrollListener = true;
  }
  
  // Opdater søgning hvis søgeværktøjet er initialiseret
  if (window.searchUtils && typeof window.searchUtils.updateSearch === 'function') {
    window.searchUtils.updateSearch();
  }
}

function updateListIndicator(listIndicator, lists) {
  // Kun opdater indikator, hvis antal lister har ændret sig
  const visibleLists = lists.filter(list => 
    !(list.id === "upcoming" && !Settings.showUpcoming) &&
    !(list.id === "paused" && !Settings.showPaused) &&
    !(list.id === "dropped" && !Settings.showDropped)
  );
  
  if (listIndicator.children.length !== visibleLists.length) {
    listIndicator.innerHTML = "";
    visibleLists.forEach((_, index) => {
      const dot = document.createElement("div");
      dot.className = "indicator-dot";
      if (index === 0) dot.classList.add("active");
      listIndicator.appendChild(dot);
    });
  }
}

function initializeDomCache(listsContainer) {
  // Opret DOM-cache for senere opdateringer
  Array.from(listsContainer.children).forEach(list => {
    const id = list.id;
    domCache.lists[id] = {
      element: list,
      cards: {}
    };
    
    // Cache kort i denne liste
    Array.from(list.querySelectorAll('.card')).forEach(card => {
      const gameId = card.dataset.id;
      domCache.lists[id].cards[gameId] = card;
    });
  });
}

function groupGamesByStatus(games) {
  // Gruppér spil efter status og sortér efter rækkefølge
  const grouped = {};
  games.forEach(game => {
    if (!grouped[game.status]) {
      grouped[game.status] = [];
    }
    grouped[game.status].push(game);
  });
  
  // Sortér hver gruppe efter rækkefølge
  Object.keys(grouped).forEach(status => {
    grouped[status].sort((a, b) => {
      const orderA = Number(a.order) || 0;
      const orderB = Number(b.order) || 0;
      return orderA - orderB;
    });
  });
  
  return grouped;
}

function hasListChanged(currentGames, previousGames) {
  // Sammenlign antal spil
  if (currentGames.length !== previousGames.length) {
    return true;
  }
  
  // Sammenlign spil IDs og rækkefølge
  for (let i = 0; i < currentGames.length; i++) {
    const current = currentGames[i];
    const previous = previousGames[i];
    
    if (current.id !== previous.id || 
        current.order !== previous.order || 
        current.favorite !== previous.favorite ||
        current.platform !== previous.platform ||
        current.platformColor !== previous.platformColor ||
        current.completionDate !== previous.completionDate) {
      return true;
    }
  }
  
  return false;
}

function updateList(listId, listName, games, listsContainer) {
  let listElement;
  
  // Tjek om listen allerede eksisterer i DOM
  if (domCache.lists[listId] && domCache.lists[listId].element) {
    // Listen eksisterer, opdater indhold
    listElement = domCache.lists[listId].element;
    
    // Behold overskriften, men fjern resten
    const header = listElement.querySelector('h2');
    listElement.innerHTML = '';
    listElement.appendChild(header);
  } else {
    // Listen eksisterer ikke, opret den
    listElement = document.createElement("div");
    listElement.className = "list";
    listElement.id = listId;
    listElement.innerHTML = `<h2>${listName}</h2>`;
    
    // Opdater cache
    domCache.lists[listId] = {
      element: listElement,
      cards: {}
    };
    
    // Tilføj til DOM
    listsContainer.appendChild(listElement);
  }
  
  // Håndter tom liste
  if (games.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "empty-list-message";
    listElement.appendChild(emptyMessage);
    // Ryd kort-cache for denne liste
    domCache.lists[listId].cards = {};
    return;
  }
  
  // Brug et dokumentfragment til at reducere reflows
  const fragment = document.createDocumentFragment();
  
  // Tilføj kort til dokumentfragmentet
  games.forEach(game => {
    let cardElement;
    
    // Tjek om kortet allerede eksisterer i cachen
    if (domCache.lists[listId].cards[game.id]) {
      // Kortet eksisterer, opdater det hvis nødvendigt
      cardElement = domCache.lists[listId].cards[game.id];
      updateCardContent(cardElement, game);
    } else {
      // Kortet eksisterer ikke, opret det
      cardElement = createGameCard(game);
      domCache.lists[listId].cards[game.id] = cardElement;
    }
    
    fragment.appendChild(cardElement);
  });
  
  // Tilføj alle kort til listen
  listElement.appendChild(fragment);
  
  // Opdater cache
  const currentCardIds = games.map(game => game.id);
  const cachedCardIds = Object.keys(domCache.lists[listId].cards);
  
  // Fjern kort fra cachen, der ikke længere er i listen
  cachedCardIds.forEach(cardId => {
    if (!currentCardIds.includes(cardId)) {
      delete domCache.lists[listId].cards[cardId];
    }
  });
}

function updateCardContent(cardElement, game) {
  // Opdater kun de felter, der kan være ændret
  
  // Opdater favorit-status
  if (game.favorite) {
    cardElement.classList.add("favorite");
  } else {
    cardElement.classList.remove("favorite");
  }
  
  // Opdater title (sjældent ændret, men muligt)
  const titleElement = cardElement.querySelector('h3');
  if (titleElement.textContent !== game.title) {
    titleElement.textContent = game.title;
  }
  
  // Opdater platform
  const platformPill = cardElement.querySelector('.platform-pill');
  if (platformPill.textContent !== game.platform || 
      platformPill.style.backgroundColor !== game.platformColor) {
    platformPill.textContent = game.platform;
    platformPill.style.backgroundColor = game.platformColor;
    platformPill.dataset.platformName = game.platform;
  }
  
  // Opdater completion date
  const existingDateElement = cardElement.querySelector('.completion-date');
  if (game.completionDate) {
    if (existingDateElement) {
      if (existingDateElement.textContent !== game.completionDate) {
        existingDateElement.textContent = game.completionDate;
      }
    } else {
      const dateElement = document.createElement('span');
      dateElement.className = 'completion-date';
      dateElement.textContent = game.completionDate;
      cardElement.querySelector('.card-details').appendChild(dateElement);
    }
  } else if (existingDateElement) {
    // Fjern datoen hvis den ikke længere findes
    existingDateElement.remove();
  }
  
  // Opdater data-attributter
  cardElement.dataset.order = Number(game.order) || 0;
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

// Opdateret indikator funktion
function updateIndicator() {
  const listsContainer = document.getElementById("listsContainer");
  const indicators = document.querySelectorAll(".indicator-dot");
  
  if (!indicators.length) return;
  
  const scrollPosition = listsContainer.scrollLeft;
  const containerWidth = listsContainer.offsetWidth;
  
  const activeIndex = Math.round(scrollPosition / containerWidth);
  
  indicators.forEach((indicator, index) => {
    indicator.classList.toggle("active", index === activeIndex);
  });
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