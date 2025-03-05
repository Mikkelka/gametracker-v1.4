// dragAndDrop.js
import { render } from "../components/ui.js";
import { updateGameOrder, debouncedSync } from "../services/storage.js";

export function initDragAndDrop(app) {
  // Centrale variabler
  let isDragging = false;
  let draggedElement = null;
  let appInstance = null;
  
  // Optimeret scroll
  let scrollAnimation = null;
  let scrollDirection = null;
  let scrollSpeed = 0;
  
  // Konstanter for scroll-konfiguration
  const SCROLL_ZONE_SIZE = 80; // px
  const MAX_SCROLL_SPEED = 15; // px per frame
  const ACCELERATION = 1.05;
  
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

  function setupAutoScrollZones() {
    const body = document.body;
    
    // Fjern eksisterende zoner, hvis de findes
    const existingZones = document.querySelectorAll('.autoscroll-zone');
    existingZones.forEach(zone => zone.remove());
    
    // Opret nye zoner
    const topZone = document.createElement("div");
    topZone.className = "autoscroll-zone autoscroll-zone-top";
    topZone.style.height = `${SCROLL_ZONE_SIZE}px`;
    
    const bottomZone = document.createElement("div");
    bottomZone.className = "autoscroll-zone autoscroll-zone-bottom";
    bottomZone.style.height = `${SCROLL_ZONE_SIZE}px`;
    
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
        draggedOverItem.style.borderBottom = "solid 10px var(--button-bg)";
        draggedOverItem.style.borderTop = "";
      } else {
        draggedOverItem.style.borderTop = "solid 10px var(--button-bg)";
        draggedOverItem.style.borderBottom = "";
      }
    }

    // Forbedret autoscroll
    handleSmartAutoScroll(e);
  }

  function handleSmartAutoScroll(e) {
    const windowHeight = window.innerHeight;
    const topThreshold = SCROLL_ZONE_SIZE;
    const bottomThreshold = windowHeight - SCROLL_ZONE_SIZE;
    
    // Stop scrolling hvis vi er udenfor scroll-zonerne
    if (e.clientY > topThreshold && e.clientY < bottomThreshold) {
      stopScrolling();
      return;
    }
    
    // Beregn scrollhastighed baseret på afstand til skærmkant
    let newDirection = null;
    let distanceToEdge = 0;
    
    if (e.clientY <= topThreshold) {
      newDirection = "up";
      distanceToEdge = topThreshold - e.clientY;
    } else if (e.clientY >= bottomThreshold) {
      newDirection = "down";
      distanceToEdge = e.clientY - bottomThreshold;
    }
    
    // Beregn dynamisk scrollhastighed baseret på afstand
    const newSpeed = Math.min(
      Math.floor(distanceToEdge / (SCROLL_ZONE_SIZE / MAX_SCROLL_SPEED)), 
      MAX_SCROLL_SPEED
    );
    
    // Start eller opdater scroll animation
    if (!scrollAnimation || scrollDirection !== newDirection || Math.abs(scrollSpeed - newSpeed) > 3) {
      scrollDirection = newDirection;
      scrollSpeed = newSpeed;
      startSmoothScrolling();
    }
  }
  
  function startSmoothScrolling() {
    // Stop eksisterende animation først
    stopScrolling();
    
    if (!scrollDirection) return;
    
    let currentSpeed = 1;
    
    scrollAnimation = requestAnimationFrame(function scrollFrame() {
      // Acceleration op til maks hastighed
      if (currentSpeed < scrollSpeed) {
        currentSpeed = Math.min(currentSpeed * ACCELERATION, scrollSpeed);
      }
      
      // Udfør scrolling i den angivne retning
      if (scrollDirection === "up") {
        window.scrollBy(0, -currentSpeed);
      } else {
        window.scrollBy(0, currentSpeed);
      }
      
      // Fortsæt animationen hvis vi stadig scroller
      if (scrollDirection) {
        scrollAnimation = requestAnimationFrame(scrollFrame);
      }
    });
  }
  
  function stopScrolling() {
    if (scrollAnimation) {
      cancelAnimationFrame(scrollAnimation);
      scrollAnimation = null;
    }
    scrollDirection = null;
    scrollSpeed = 0;
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

    // Optimeret horisontal scroll-håndtering
    const isAtBottom = Math.abs(
      (listsContainer.scrollHeight - listsContainer.scrollTop) - 
      listsContainer.clientHeight
    ) < 5;
    
    const isAtTop = listsContainer.scrollTop < 5;

    // Hvis vi er på bunden eller toppen, og der er mere horisontal scroll tilgængeligt
    if ((isAtBottom && e.deltaY > 0) || (isAtTop && e.deltaY < 0)) {
      const canScrollLeft = listsContainer.scrollLeft > 0;
      const canScrollRight = listsContainer.scrollLeft < 
        listsContainer.scrollWidth - listsContainer.clientWidth - 5;

      if ((e.deltaY > 0 && canScrollRight) || (e.deltaY < 0 && canScrollLeft)) {
        e.preventDefault();
        // Smoothere scroll med en mere naturlig hastighed
        const scrollAmount = Math.min(Math.abs(e.deltaY), 100) * Math.sign(e.deltaY);
        listsContainer.scrollLeft += scrollAmount;
      }
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
      debouncedSync(); // Tilføjet debouncedSync her!
    }

    render(appInstance.games, appInstance.lists, appInstance);
  }
}