// gameActions.js
import { saveGame, deleteGame, debouncedSync } from "../services/storage.js";
import { render } from "./ui.js";
import { Platforms } from "./platforms.js";

export function initGameActions(app) {
  app.addGame = async function (title, platformId) {
    const platform = Platforms.list.find((p) => p.id === platformId);
    if (!platform) {
      console.error("Platform not found");
      return;
    }
    const maxOrder = Math.max(
      ...app.games
        .filter((g) => g.status === "willplay")
        .map((g) => g.order || 0),
      -1
    );
    const game = {
      title,
      platform: platform.name,
      platformColor: platform.color,
      status: "willplay",
      favorite: false,
      createdAt: Date.now(),
      order: maxOrder + 1,
    };
    const savedGame = await saveGame(game);
    app.games.push(savedGame);
    render(app.games, app.lists);
    debouncedSync();
  };

  app.moveGame = async function (gameId, newStatus) {
    const game = app.games.find((g) => g.id == gameId);
    if (game && game.status !== newStatus) {
      game.status = newStatus;

      const maxOrder = Math.max(
        ...app.games
          .filter((g) => g.status === newStatus)
          .map((g) => g.order || 0),
        -1
      );
      game.order = maxOrder + 1;

      await saveGame(game);
      app.games = app.games.map((g) => (g.id === gameId ? game : g));
      render(app.games, app.lists);
      debouncedSync();
    }
  };

  app.toggleFavorite = async function (gameId) {
    const game = app.games.find((g) => g.id == gameId);
    if (game) {
      game.favorite = !game.favorite;
      await saveGame(game);
      app.games = app.games.map((g) => (g.id === gameId ? game : g));
      render(app.games, app.lists);
      debouncedSync();
    }
  };

  app.setCompletionDate = async function (gameId, date) {
    const game = app.games.find((g) => g.id == gameId);
    if (game) {
      if (date && date.trim() !== "") {
        game.completionDate = date.trim();
      } else {
        delete game.completionDate;
      }

      await saveGame(game);
      app.games = app.games.map((g) => (g.id === gameId ? game : g));
      render(app.games, app.lists);
      debouncedSync();
    }
  };

  app.setTodayAsCompletionDate = async function (gameId) {
    const game = app.games.find((g) => g.id == gameId);
    if (game) {
      const today = new Date();
      const formattedDate = `${today.getDate().toString().padStart(2, "0")}-${(
        today.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}-${today.getFullYear()}`;
      game.completionDate = formattedDate;
      await saveGame(game);
      app.games = app.games.map((g) => (g.id === gameId ? game : g));
      render(app.games, app.lists);
      debouncedSync();
    }
  };

  app.deleteGame = async function (gameId) {
    console.log("Attempting to delete game with id:", gameId);
    await deleteGame(gameId);
    app.games = app.games.filter((g) => g.id !== gameId);
    console.log("Games reloaded, games count:", app.games.length);
    render(app.games, app.lists);
    debouncedSync();
  };

  app.changePlatform = async function (gameId, newPlatformId) {
    const game = app.games.find((g) => g.id == gameId);
    const newPlatform = Platforms.list.find((p) => p.id === newPlatformId);
    if (game && newPlatform) {
      game.platform = newPlatform.name;
      game.platformColor = newPlatform.color;
      await saveGame(game);
      app.games = app.games.map((g) => (g.id === gameId ? game : g));
      render(app.games, app.lists);
      debouncedSync();
    }
  };
}
