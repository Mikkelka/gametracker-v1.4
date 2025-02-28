// importExport.js

import { loadGames, syncWithFirebase, saveGame } from "../services/storage.js";

// Export game data to JSON
export async function exportGames() {
  const games = await loadGames();
  const jsonData = JSON.stringify(games, null, 2);
  const blob = new Blob([jsonData], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "gametrack_data.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Import game data from JSON
export async function importGames(file) {
  const reader = new FileReader();

  reader.onload = async (e) => {
    try {
      const importedGames = JSON.parse(e.target.result);
      const currentUser = window.auth.currentUser;

      if (!currentUser) {
        console.error("No user logged in");
        return;
      }

      // Add user-id to imported games
      const updatedGames = importedGames.map((game) => ({
        ...game,
        userId: currentUser.uid,
      }));

      // Save imported games to Firebase
      for (const game of updatedGames) {
        await saveGame(game);
      }

      // Synchronize with Firebase
      await syncWithFirebase();

      console.log("Import completed successfully");

      // Reload the page to reflect the new data
      location.reload();
    } catch (error) {
      console.error("Error importing games:", error);
    }
  };

  reader.readAsText(file);
}
