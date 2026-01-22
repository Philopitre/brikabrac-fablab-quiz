// app.js (module entry)
import { createInitialState, loadStateSilently } from "./state.js";
import { createRenderer } from "./render.js";
import { TOTAL_QUESTIONS, MAX_GAMES } from "./questions.js";

document.addEventListener("DOMContentLoaded", () => {
  const QUESTIONS_PER_GAME = 5;

  // ✅ Version affichée dans le bloc "À propos"
  // Mets ici la version que tu veux montrer (ex: 3.0.0)
  const APP_VERSION = "3.0.0";

  const $statsRoot = document.getElementById("stats-root");
  const $contentRoot = document.getElementById("content-root");

  if (!$statsRoot || !$contentRoot) {
    alert("Erreur : éléments HTML manquants (stats-root / content-root).");
    return;
  }

  // State central
  let state = createInitialState();

  // Restore silencieux (pas de popup)
  const restored = loadStateSilently();
  if (restored) state = restored;

  const renderer = createRenderer({
    QUESTIONS_PER_GAME,
    TOTAL_QUESTIONS,
    MAX_GAMES,
    $statsRoot,
    $contentRoot,
    getState: () => state,
    setState: (next) => { state = next; },

    // ✅ NEW
    APP_VERSION
  });

  renderer.render();
});
  
