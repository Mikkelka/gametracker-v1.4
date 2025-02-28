// storage.js
const COLLECTION_NAME = "games";
let cachedGames = null;
let hasUnsyncedChanges = false;
let debounceTimer = null;
let batchOperations = [];
const BATCH_LIMIT = 500;
const DEBOUNCE_DELAY = 5000; // 5 seconds

let syncCallback = null;
let unsubscribe = null;

export async function loadGames() {
  const user = window.auth.currentUser;
  if (!user) {
    console.error("No user logged in");
    return [];
  }

  if (cachedGames) {
    console.log("Returning cached games");
    return cachedGames;
  }

  try {
    const snapshot = await window.db
      .collection(COLLECTION_NAME)
      .where("userId", "==", user.uid)
      .get();

    cachedGames = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort games by status and then by order
    cachedGames.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status.localeCompare(b.status);
      }
      return (a.order || 0) - (b.order || 0);
    });

    // Set up real-time listener
    if (!unsubscribe) {
      unsubscribe = window.db
        .collection(COLLECTION_NAME)
        .where("userId", "==", user.uid)
        .onSnapshot((snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added" || change.type === "modified") {
              const index = cachedGames.findIndex(
                (g) => g.id === change.doc.id
              );
              const updatedGame = { id: change.doc.id, ...change.doc.data() };
              if (index > -1) {
                cachedGames[index] = updatedGame;
              } else {
                cachedGames.push(updatedGame);
              }
            } else if (change.type === "removed") {
              cachedGames = cachedGames.filter((g) => g.id !== change.doc.id);
            }
          });
          cachedGames.sort((a, b) => {
            if (a.status !== b.status) {
              return a.status.localeCompare(b.status);
            }
            return (a.order || 0) - (b.order || 0);
          });
          if (syncCallback) syncCallback(cachedGames);
        });
    }

    return cachedGames;
  } catch (error) {
    console.error("Error loading games:", error);
    return [];
  }
}

async function saveGames(games) {
  const batch = window.db.batch();
  games.forEach((game) => {
    const ref = window.db.collection(COLLECTION_NAME).doc(game.id);
    batch.set(ref, game);
  });
  await batch.commit();
}

export async function saveGame(game) {
  const user = window.auth.currentUser;
  if (!user) {
    console.error("No user logged in");
    return null;
  }

  game.userId = user.uid;
  if (!game.id) {
    game.id = window.db.collection(COLLECTION_NAME).doc().id;
  }
  game.order = Number(game.order) || 0;

  const operation = {
    type: "set",
    ref: window.db.collection(COLLECTION_NAME).doc(game.id),
    data: game,
  };
  batchOperations.push(operation);

  hasUnsyncedChanges = true;
  console.log("Game saved, calling debouncedSync");
  debouncedSync();

  return game;
}

export async function deleteGame(gameId) {
  const user = window.auth.currentUser;
  if (!user) {
    console.error("No user logged in");
    return;
  }

  const operation = {
    type: "delete",
    ref: window.db.collection(COLLECTION_NAME).doc(gameId),
  };
  batchOperations.push(operation);

  hasUnsyncedChanges = true;
  console.log("Game deleted, calling debouncedSync");
  debouncedSync();
}

export async function updateGameOrder(changedGames) {
  const user = window.auth.currentUser;
  if (!user) {
    console.error("No user logged in");
    return;
  }

  changedGames.forEach((game) => {
    const operation = {
      type: "update",
      ref: window.db.collection(COLLECTION_NAME).doc(game.id),
      data: { order: Number(game.order) || 0, status: game.status },
    };
    batchOperations.push(operation);
  });

  hasUnsyncedChanges = true;

  debouncedSync();
}

export function debouncedSync() {
  console.log("debouncedSync called");

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  console.log(
    `Setting new debounce timer for ${DEBOUNCE_DELAY / 1000} seconds`
  );
  debounceTimer = setTimeout(async () => {
    console.log("Debounce timer triggered");
    if (hasUnsyncedChanges) {
      await syncWithFirebase();
    } else {
      console.log("No unsynced changes detected");
    }
  }, DEBOUNCE_DELAY);
}

export async function syncWithFirebase() {
  const user = window.auth.currentUser;
  if (!user) {
    console.error("No user logged in");
    return;
  }

  console.log(
    `Starting synchronization. Total operations to sync: ${batchOperations.length}`
  );

  while (batchOperations.length > 0) {
    const batch = window.db.batch();
    const currentBatch = batchOperations.splice(0, BATCH_LIMIT);

    let setOps = 0,
      updateOps = 0,
      deleteOps = 0;

    currentBatch.forEach((operation) => {
      switch (operation.type) {
        case "set":
          batch.set(operation.ref, operation.data);
          setOps++;
          break;
        case "update":
          batch.update(operation.ref, operation.data);
          updateOps++;
          break;
        case "delete":
          batch.delete(operation.ref);
          deleteOps++;
          break;
      }
    });

    console.log(
      `Batch breakdown: Set: ${setOps}, Update: ${updateOps}, Delete: ${deleteOps}`
    );

    try {
      await batch.commit();
    } catch (error) {
      console.error(`Error committing batch:`, error);
    }
  }

  hasUnsyncedChanges = false;
  console.log("Synchronization completed");

  // Reload and repair games after sync
  await loadGames();
  console.log("Games reloaded and repaired after sync");

  showSyncPopup();
}

function showSyncPopup() {
  const popup = document.getElementById("syncPopup");
  if (popup) {
    popup.classList.add("show");
    setTimeout(() => {
      popup.classList.remove("show");
    }, 3000); // Popup disappears after 3 seconds
  } else {
    console.error("Sync popup element not found");
  }
}

export function checkForUnsyncedChanges() {
  return hasUnsyncedChanges;
}

export async function updateGamePlatformColor(platformName, newColor) {
  const user = window.auth.currentUser;
  if (!user) {
    console.error("No user logged in");
    return;
  }

  const games = await loadGames();
  const updatedGames = games.map((game) => {
    if (game.platform === platformName) {
      return { ...game, platformColor: newColor };
    }
    return game;
  });

  const changedGames = updatedGames.filter(
    (game) => game.platform === platformName
  );

  changedGames.forEach((game) => {
    const operation = {
      type: "update",
      ref: window.db.collection(COLLECTION_NAME).doc(game.id),
      data: { platformColor: newColor },
    };
    batchOperations.push(operation);
  });

  if (changedGames.length > 0) {
    hasUnsyncedChanges = true;
    console.log("Game platform color updated, calling debouncedSync");
    debouncedSync();
  }

  return updatedGames;
}

export function setSyncCallback(callback) {
  syncCallback = callback;
}

export function clearCache() {
  cachedGames = null;
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}
