// state.js
import { safeJsonParse } from "./utils.js";

const STORAGE_KEY = "fablab_quiz_state_v3";

export function createInitialState() {
  return {
    currentLevel: 1,
    maxUnlockedLevel: 1,

    // ✅ optionnel : prénom/nom/pseudo
    participantName: "",

    // ✅ évite de re-télécharger le même diplôme
    issuedCertificates: { 1: false, 2: false, 3: false, final: false },

    levelAnswered: [0, 0, 0, 0],
    levelCorrect: [0, 0, 0, 0],

    // { [index]: { attempts, correctAttempts, lastCorrect } }
    questionStats: {},

    // ✅ Mode "révision 100%" : après le niveau 3, repartir du niveau 1
    // et rejouer en priorité les questions ratées + jamais vues.
    revisionMode: false,

    // ✅ Affichage de la correction de la manche
    showRoundCorrection: false,

    currentQuestions: [],
    usedQuestionIndices: [],
    userAnswers: [],
    totalScore: 0,
    totalAnswered: 0,
    gamesPlayed: 0,
    showResults: false,
    gameHistory: []
  };
}

export function saveStateSilently(state) {
  try {
    const payload = { ...state, _savedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export function loadStateSilently() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const data = safeJsonParse(raw);
    if (!data || typeof data !== "object") return null;

    if (!Array.isArray(data.usedQuestionIndices)) return null;
    if (!Array.isArray(data.gameHistory)) return null;

    const clamp = (n) => Math.min(3, Math.max(1, n || 1));

    const currentLevel = clamp(data.currentLevel);
    const maxUnlockedLevel = clamp(data.maxUnlockedLevel);

    const levelAnswered =
      Array.isArray(data.levelAnswered) && data.levelAnswered.length >= 4
        ? data.levelAnswered.slice(0, 4).map(n => (typeof n === "number" ? n : 0))
        : [0, 0, 0, 0];

    const levelCorrect =
      Array.isArray(data.levelCorrect) && data.levelCorrect.length >= 4
        ? data.levelCorrect.slice(0, 4).map(n => (typeof n === "number" ? n : 0))
        : [0, 0, 0, 0];

    const questionStats =
      data.questionStats && typeof data.questionStats === "object" && !Array.isArray(data.questionStats)
        ? data.questionStats
        : {};

    const participantName = typeof data.participantName === "string" ? data.participantName : "";

    const issuedCertificates =
      data.issuedCertificates && typeof data.issuedCertificates === "object"
        ? {
            1: !!data.issuedCertificates[1],
            2: !!data.issuedCertificates[2],
            3: !!data.issuedCertificates[3],
            final: !!data.issuedCertificates.final
          }
        : { 1: false, 2: false, 3: false, final: false };

    const revisionMode = !!data.revisionMode;
    const showRoundCorrection = !!data.showRoundCorrection;

    return {
      currentLevel,
      maxUnlockedLevel,
      participantName,
      issuedCertificates,

      levelAnswered,
      levelCorrect,
      questionStats,

      currentQuestions: Array.isArray(data.currentQuestions) ? data.currentQuestions : [],
      usedQuestionIndices: data.usedQuestionIndices,
      userAnswers: Array.isArray(data.userAnswers) ? data.userAnswers : [],
      totalScore: typeof data.totalScore === "number" ? data.totalScore : 0,
      totalAnswered: typeof data.totalAnswered === "number" ? data.totalAnswered : 0,
      gamesPlayed: typeof data.gamesPlayed === "number" ? data.gamesPlayed : 0,
      showResults: !!data.showResults,
      revisionMode,
      showRoundCorrection,
      gameHistory: data.gameHistory
    };
  } catch {
    return null;
  }
}

export function clearSavedState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
