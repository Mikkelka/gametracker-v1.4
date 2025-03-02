// dragAndDrop.js
import { render } from "../components/ui.js";
import { updateGameOrder } from "../services/storage.js";

let isDragging = false;
let scrollInterval;
let draggedElement = null;
let appInstance = null;

export function initDragAndDrop(app) {
  // Gem reference til app objektet
  appInstance = app;
  
  // Brug event delegation for drag events
  const listsContainer = document.getElementById("listsContainer");
  
  // Lyt efter events på containeren i stedet for på hvert element
  listsContainer.addEventListener("dragstart", handleDragStart);
  document.addEventListener("dragend", handleDragEnd);
  document.addEventListener("dragover", handleDragOver);
  document.addEventListener("dragleave", handleDragLeave);
  document.addEventListener("drop", handleDrop);

  // Tilføj autoscroll-zoner
  setupAutoScrollZones();

  // Opdateret scrolling håndtering
  listsContainer.addEventListener("wheel", handleScroll, { passive: false });
}

function setupAutoScrollZones() {
  const body = document.body;
  
  // Fjern eksisterende zoner, hvis de findes
  const existingZones = document.querySelectorAll('.autoscroll-zone');
  existingZones.forEach(zone => zone.remove());
  
  // Opret nye zoner
  const topZone = document.createElement("div");
  topZone.className = "autoscroll-zone autoscroll-zone-top";
  const bottomZone = document.createElement("div");
  bottomZone.className = "autoscroll-zone autoscroll-zone-bottom";
  
  body.appendChild(topZone);
  body.appendChild(bottomZone);
}

function handleDragStart(e) {
  // Find det nærmeste card element
  const card = e.target.closest('.card');
  if (!card) return;
  
  e.dataTransfer.setData("text/plain", card.dataset.id);
  card.style.opacity = "0.5";
  isDragging = true;
  draggedElement = card;
  
  document
    .querySelectorAll(".autoscroll-zone")
    .forEach((zone) => zone.classList.add("active"));
}

function handleDragEnd(e) {
  // Brug event delegation - tjek om vi har et draget element
  if (draggedElement) {
    draggedElement.style.opacity = "1";
    draggedElement = null;
    isDragging = false;
    deactivateScrollZones();
  }
}

function handleDragOver(e) {
  if (!isDragging) return;
  
  e.preventDefault();
  const draggedOverItem = e.target.closest(".card");
  
  // Reset borders på alle kort først
  document.querySelectorAll('.card').forEach(card => {
    if (card !== draggedOverItem) {
      card.style.borderTop = "";
      card.style.borderBottom = "";
    }
  });
  
  if (draggedOverItem && draggedOverItem !== draggedElement) {
    const bounding = draggedOverItem.getBoundingClientRect();
    const offset = bounding.y + bounding.height / 2;
    if (e.clientY - offset > 0) {
      draggedOverItem.style.borderBottom = "solid 2px #000";
      draggedOverItem.style.borderTop = "";
    } else {
      draggedOverItem.style.borderTop = "solid 2px #000";
      draggedOverItem.style.borderBottom = "";
    }
  }

  // Tjek for autoscroll
  handleAutoScroll(e);
}

function handleAutoScroll(e) {
  const topZone = document.querySelector(".autoscroll-zone-top");
  const bottomZone = document.querySelector(".autoscroll-zone-bottom");

  if (!topZone || !bottomZone) return;

  if (e.clientY < topZone.offsetHeight) {
    startScrolling("up");
  } else if (e.clientY > window.innerHeight - bottomZone.offsetHeight) {
    startScrolling("down");
  } else {
    stopScrolling();
  }
}

function handleDragLeave(e) {
  const draggedOverItem = e.target.closest(".card");
  if (draggedOverItem) {
    draggedOverItem.style.borderTop = "";
    draggedOverItem.style.borderBottom = "";
  }
}

function handleScroll(e) {
  const listsContainer = document.getElementById("listsContainer");

  // Tjek om vi er på bunden eller toppen af den vertikale scroll
  const isAtBottom =
    listsContainer.scrollHeight - listsContainer.scrollTop ===
    listsContainer.clientHeight;
  const isAtTop = listsContainer.scrollTop === 0;

  // Hvis vi er på bunden eller toppen, og der er mere horisontal scroll tilgængelig
  if ((isAtBottom && e.deltaY > 0) || (isAtTop && e.deltaY < 0)) {
    const canScrollLeft = listsContainer.scrollLeft > 0;
    const canScrollRight =
      listsContainer.scrollLeft 
      listsContainer.scrollWidth - listsContainer.clientWidth;

    if ((e.deltaY > 0 && canScrollRight) || (e.deltaY < 0 && canScrollLeft)) {
      e.preventDefault();
      listsContainer.scrollLeft += e.deltaY;
    }
  }
}

function startScrolling(direction) {
  if (scrollInterval) return;
  scrollInterval = setInterval(() => {
    if (direction === "up") {
      window.scrollBy(0, -10);
    } else {
      window.scrollBy(0, 10);
    }
  }, 20);
}

function stopScrolling() {
  if (scrollInterval) {
    clearInterval(scrollInterval);
    scrollInterval = null;
  }
}

function deactivateScrollZones() {
  document
    .querySelectorAll(".autoscroll-zone")
    .forEach((zone) => zone.classList.remove("active"));
  stopScrolling();
}

async function handleDrop(e) {
  if (!isDragging || !draggedElement) return;
  
  e.preventDefault();
  const gameId = e.dataTransfer.getData("text");
  
  if (!gameId || !appInstance) return;
  
  const dropTarget = e.target.closest(".card") || e.target.closest(".list");

  if (dropTarget) {
    const list = dropTarget.closest(".list");
    if (!list) return;
    
    const listTitle = list.querySelector("h2")?.textContent;
    if (!listTitle) return;
    
    const newStatus = appInstance.lists.find(
      (l) => l.name === listTitle
    )?.id;
    
    if (!newStatus) return;

    if (dropTarget.classList.contains("card")) {
      const bounding = dropTarget.getBoundingClientRect();
      const offset = bounding.y + bounding.height / 2;
      const insertBefore = e.clientY - offset > 0;

      if (insertBefore) {
        dropTarget.parentNode.insertBefore(
          draggedElement,
          dropTarget.nextSibling
        );
      } else {
        dropTarget.parentNode.insertBefore(draggedElement, dropTarget);
      }
    } else {
      list.appendChild(draggedElement);
    }

    await updateGameOrderAndStatus(list, newStatus);

    document.dispatchEvent(new CustomEvent("cardMoved"));
  }

  document.querySelectorAll(".card").forEach((card) => {
    card.style.borderTop = "";
    card.style.borderBottom = "";
  });

  deactivateScrollZones();
}

async function updateGameOrderAndStatus(list, newStatus) {
  if (!appInstance) return;
  
  const newOrder = Array.from(list.querySelectorAll(".card")).map(
    (card, index) => ({ id: card.dataset.id, order: index, status: newStatus })
  );

  let changedGames = [];

  appInstance.games = appInstance.games.map((game) => {
    const updatedGame = newOrder.find((item) => item.id === game.id);
    if (updatedGame) {
      if (
        game.status !== updatedGame.status ||
        game.order !== updatedGame.order
      ) {
        changedGames.push({ ...game, ...updatedGame });
        return { ...game, ...updatedGame };
      }
    }
    return game;
  });

  appInstance.games.sort((a, b) => {
    if (a.status !== b.status) {
      return (
        appInstance.lists.findIndex((list) => list.id === a.status) -
        appInstance.lists.findIndex((list) => list.id === b.status)
      );
    }
    return a.order - b.order;
  });

  if (changedGames.length > 0) {
    await updateGameOrder(changedGames);
  }

  render(appInstance.games, appInstance.lists, appInstance);
}