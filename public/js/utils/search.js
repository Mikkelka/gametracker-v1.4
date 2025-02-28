// search.js
export function initSearch(app) {
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const searchToggleBtn = document.getElementById('searchToggleBtn');
  const searchContainer = document.querySelector('.search-container');

  if (!searchInput || !clearSearchBtn) return;

  // Initial state
  let searchTerm = '';
  clearSearchBtn.style.display = 'none';

  // Favorit-søgeord (kan udvides for flere sprog eller synonymer)
  const favoriteKeywords = ['favorit', 'favorite', 'fav', 'stjerne', 'star'];

  // Event listeners
  searchInput.addEventListener('input', handleSearch);
  clearSearchBtn.addEventListener('click', clearSearch);

  // Tilføj søge-toggle funktionalitet for mobil
  if (searchToggleBtn) {
    searchToggleBtn.addEventListener('click', () => {
      searchContainer.classList.toggle('active');

      // Fokuser på søgefeltet når det vises
      if (searchContainer.classList.contains('active')) {
        searchInput.focus();
      }
    });
  }

  // Lyt efter klik udenfor søgecontaineren på mobil
  document.addEventListener('click', (e) => {
    // Hvis vi er på desktop eller søgecontaineren ikke er aktiv, gør intet
    if (window.innerWidth > 768 || !searchContainer.classList.contains('active')) {
      return;
    }

    // Hvis der klikkes udenfor søgecontaineren og ikke på toggle-knappen
    if (!searchContainer.contains(e.target) && e.target !== searchToggleBtn) {
      searchContainer.classList.remove('active');
    }
  });

  function handleSearch(e) {
    searchTerm = e.target.value.trim().toLowerCase();

    // Vis/skjul clear-knappen
    clearSearchBtn.style.display = searchTerm ? 'block' : 'none';

    // Filtrer kortene
    filterCards();
  }

  function clearSearch() {
    searchInput.value = '';
    searchTerm = '';
    clearSearchBtn.style.display = 'none';

    // Nulstil filtreringen
    filterCards();
  }

  function filterCards() {
    const cards = document.querySelectorAll('.card');
    const isFavoriteSearch = favoriteKeywords.some(keyword => searchTerm.includes(keyword));

    cards.forEach(card => {
      const title = card.querySelector('h3').textContent.toLowerCase();
      const platform = card.querySelector('.platform-pill').textContent.toLowerCase();
      const isFavorite = card.classList.contains('favorite');

      // Tjek om kortet matcher søgekriterier
      const matchesNormalSearch = !searchTerm || title.includes(searchTerm) || platform.includes(searchTerm);

      // Hvis søgningen indeholder 'favorit' eller lignende, og dette ikke er eneste søgeord
      const matchesCompoundFavoriteSearch = isFavoriteSearch &&
        searchTerm.length > favoriteKeywords.find(k => searchTerm.includes(k)).length &&
        isFavorite && (title.includes(searchTerm.replace(/favorit|favorite|fav|stjerne|star/g, '').trim()) ||
          platform.includes(searchTerm.replace(/favorit|favorite|fav|stjerne|star/g, '').trim()));

      // Hvis søgningen KUN er 'favorit' eller lignende
      const matchesPureFavoriteSearch = isFavoriteSearch &&
        !searchTerm.replace(/favorit|favorite|fav|stjerne|star/g, '').trim() &&
        isFavorite;

      // Samlet match
      const matchesSearch = matchesNormalSearch || matchesCompoundFavoriteSearch || matchesPureFavoriteSearch;

      // Hvis isFavoriteSearch er true, men kortet ikke er favorit, skal det kun vises hvis det matcher anden søgning
      const shouldShow = isFavoriteSearch ?
        (isFavorite ? matchesSearch : (matchesNormalSearch && !searchTerm.match(/^(favorit|favorite|fav|stjerne|star)$/i))) :
        matchesSearch;

      // Vis eller skjul kortet
      card.style.display = shouldShow ? 'block' : 'none';
    });

    // Opdater "Ingen spil" besked for hver liste
    updateEmptyListMessages();
  }

  function updateEmptyListMessages() {
    const lists = document.querySelectorAll('.list');
    const isFavoriteSearch = favoriteKeywords.some(keyword => searchTerm.includes(keyword));

    lists.forEach(list => {
      const visibleCards = Array.from(list.querySelectorAll('.card')).filter(card =>
        card.style.display !== 'none').length;
      const emptyMessage = list.querySelector('.empty-list-message');

      // Slet eksisterende besked hvis den findes
      if (emptyMessage) {
        emptyMessage.remove();
      }

      // Vis besked hvis ingen synlige kort OG søgning er aktiv
      if (visibleCards === 0 && searchTerm) {
        const noGamesMsg = document.createElement('p');
        noGamesMsg.className = 'empty-list-message';
        list.appendChild(noGamesMsg);
      }
    });
  }

  // Handle resize events to reset UI state if switching between mobile/desktop
  window.addEventListener('resize', () => {
    // If returning to desktop from mobile, ensure search is visible
    if (window.innerWidth > 768) {
      searchContainer.classList.remove('active'); // Remove mobile-specific class
    }
  });

  // Eksportér funktioner, så de kan kaldes når listerne opdateres
  return {
    clearSearch: () => {
      searchInput.value = '';
      searchTerm = '';
      clearSearchBtn.style.display = 'none';
      filterCards();
    },
    updateSearch: () => filterCards()
  };
}