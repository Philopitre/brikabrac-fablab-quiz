// render.js
import { QUESTIONS } from "./questions.js";
import { shuffle, allAnswered } from "./utils.js";
import { saveStateSilently, clearSavedState, createInitialState } from "./state.js";
import { shareOnFacebook, copyLinkFeedback } from "./share.js";
import { generateCertificatePdf } from "./certificates.js";

const announceToScreenReader = (msg) => console.log("🔊", msg);

export function createRenderer({
  QUESTIONS_PER_GAME,
  TOTAL_QUESTIONS,
  MAX_GAMES,
  $statsRoot,
  $contentRoot,
  getState,
  setState
}) {
  const MIN_QUESTIONS_PER_LEVEL_TO_UNLOCK = 15;
  const UNLOCK_THRESHOLD = 0.8;

  function clampLevel(n) {
    return Math.min(3, Math.max(1, n || 1));
  }

  function levelLabel(level) {
    if (level === 1) return "Niveau 1";
    if (level === 2) return "Niveau 2";
    if (level === 3) return "Niveau 3";
    return `Niveau ${level}`;
  }

  function levelProgress(state, level) {
    const answered = state.levelAnswered?.[level] ?? 0;
    const correct = state.levelCorrect?.[level] ?? 0;
    const rate = answered > 0 ? Math.round((correct / answered) * 100) : 0;
    const remaining = Math.max(0, MIN_QUESTIONS_PER_LEVEL_TO_UNLOCK - answered);
    return { answered, correct, rate, remaining };
  }

  function canUnlock(state, level) {
    const p = levelProgress(state, level);
    if (p.answered < MIN_QUESTIONS_PER_LEVEL_TO_UNLOCK) return false;
    return (p.correct / p.answered) >= UNLOCK_THRESHOLD;
  }

  function scrollTopSmoothRobust() {
    if (document.activeElement && typeof document.activeElement.blur === "function") {
      document.activeElement.blur();
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const opts = { top: 0, left: 0, behavior: "smooth" };
        try { document.documentElement.scrollTo(opts); } catch {}
        try { document.body.scrollTo(opts); } catch {}
        try { window.scrollTo(opts); } catch {}
      });
    });
  }

  // ✅ scroll vers la correction (et pas en haut)
  function scrollToCorrection() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = document.getElementById("round-correction");
        if (!el) return;

        try {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        } catch {
          const y = el.getBoundingClientRect().top + window.scrollY - 12;
          try { window.scrollTo(0, y); } catch {}
        }
      });
    });
  }

  function computeGlobalProgress(state) {
    return ((state.usedQuestionIndices?.length || 0) / TOTAL_QUESTIONS) * 100;
  }

  function getQuestionStats(state) {
    return (state.questionStats && typeof state.questionStats === "object") ? state.questionStats : {};
  }

  function getUsedSet(state) {
    return new Set(state.usedQuestionIndices || []);
  }

  function getUnseenIndicesForLevel(state, level) {
    const usedSet = getUsedSet(state);
    return Array.from({ length: TOTAL_QUESTIONS }, (_, i) => i)
      .filter(i => QUESTIONS[i] && QUESTIONS[i].level === level)
      .filter(i => !usedSet.has(i));
  }

  function getIncorrectIndicesForLevel(state, level) {
    const qs = getQuestionStats(state);
    return Array.from({ length: TOTAL_QUESTIONS }, (_, i) => i)
      .filter(i => QUESTIONS[i] && QUESTIONS[i].level === level)
      .filter(i => {
        const s = qs[i];
        return s && s.attempts > 0 && s.lastCorrect === false;
      });
  }

  function countPendingForLevel(state, level) {
    const unseen = getUnseenIndicesForLevel(state, level);
    const incorrect = getIncorrectIndicesForLevel(state, level);
    const set = new Set([...unseen, ...incorrect]);
    return set.size;
  }

  function computeGlobalPending(state) {
    const usedSet = getUsedSet(state);
    const qs = getQuestionStats(state);

    const unseen = Array.from({ length: TOTAL_QUESTIONS }, (_, i) => i)
      .filter(i => QUESTIONS[i])
      .filter(i => !usedSet.has(i));

    const incorrect = Array.from({ length: TOTAL_QUESTIONS }, (_, i) => i)
      .filter(i => QUESTIONS[i])
      .filter(i => {
        const s = qs[i];
        return s && s.attempts > 0 && s.lastCorrect === false;
      });

    const unseenSet = new Set(unseen);
    const incorrectSet = new Set(incorrect);
    return {
      unseen: unseenSet.size,
      incorrect: incorrectSet.size,
      pending: new Set([...unseenSet, ...incorrectSet]).size
    };
  }

  function pickQuestionsForLevel(state, level, count) {
    const qs = getQuestionStats(state);

    const levelAll = Array.from({ length: TOTAL_QUESTIONS }, (_, i) => i)
      .filter(i => QUESTIONS[i] && QUESTIONS[i].level === level);

    const usedSet = new Set(state.usedQuestionIndices || []);

    const unseen = levelAll.filter(i => !usedSet.has(i));
    const incorrect = levelAll.filter(i => {
      const s = qs[i];
      return s && s.attempts > 0 && s.lastCorrect === false;
    });
    const other = levelAll.filter(i => !unseen.includes(i) && !incorrect.includes(i));

    const picked = [];
    const takeFrom = (arr) => {
      for (const idx of shuffle(arr)) {
        if (picked.length >= count) break;
        picked.push(idx);
      }
    };

    takeFrom(unseen);
    if (picked.length < count) takeFrom(incorrect);
    if (picked.length < count) takeFrom(other);

    return picked.slice(0, Math.min(count, levelAll.length));
  }

  function findNextPendingLevel(state, fromLevel) {
    for (let lvl = clampLevel(fromLevel); lvl <= 3; lvl++) {
      if (countPendingForLevel(state, lvl) > 0) return lvl;
    }
    // boucle depuis 1 si on est passé au-delà
    for (let lvl = 1; lvl <= 3; lvl++) {
      if (countPendingForLevel(state, lvl) > 0) return lvl;
    }
    return null;
  }

  function pickQuestionsForLevelRevision(state, level, count) {
    // Mode révision : uniquement les questions jamais vues + celles ratées.
    const unseen = getUnseenIndicesForLevel(state, level);
    const incorrect = getIncorrectIndicesForLevel(state, level);
    const pool = Array.from(new Set([...unseen, ...incorrect]));
    const picked = [];
    for (const idx of shuffle(pool)) {
      if (picked.length >= count) break;
      picked.push(idx);
    }
    return picked;
  }

  function ensureName() {
    const state = getState();
    const current = (state.participantName || "").trim();
    if (current.length) return current;

    const asked = window.prompt("Souhaites-tu indiquer un prénom / nom / pseudo pour ton diplôme ? (optionnel)");
    const name = (asked || "").trim();

    const next = { ...state, participantName: name };
    setState(next);
    saveStateSilently(next);
    return name;
  }

  function downloadCertificate({ level, isFinal, force = false }) {
    const state = getState();
    const issued = state.issuedCertificates || { 1: false, 2: false, 3: false, final: false };

    const already = isFinal ? !!issued.final : !!issued[level];
    if (already && !force) return;

    const name = ensureName();

    let total;
    let score;
    let percentage;

    if (isFinal) {
      // ✅ diplôme final = note globale (cumulée)
      total = typeof state.totalAnswered === "number" ? state.totalAnswered : 0;
      score = typeof state.totalScore === "number" ? state.totalScore : 0;
      percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    } else {
      const p = levelProgress(state, level);
      total = p.answered;
      score = p.correct;
      percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    }

    let payload;
    try {
      payload = generateCertificatePdf({
        participantName: name,
        level,
        score,
        total,
        percentage,
        isFinal,
        quizUrl: window.location.href.split("#")[0]
      });
    } catch (e) {
      alert(`Impossible de générer le diplôme : ${e.message || e}`);
      return;
    }

    const title = isFinal ? "Diplôme final" : `${levelLabel(level)} validé`;
    const label = already ? "re-télécharger" : "télécharger";
    const ok = window.confirm(`${title} 🎉\n\nVeux-tu ${label} ton diplôme PDF maintenant ?`);
    if (!ok) return;

    try {
      payload.doc.save(payload.fileName);

      const nextIssued = { ...issued };
      if (isFinal) nextIssued.final = true;
      else nextIssued[level] = true;

      const next = { ...getState(), issuedCertificates: nextIssued };
      setState(next);
      saveStateSilently(next);

      render();
    } catch (e) {
      alert(`Téléchargement impossible : ${e.message || e}`);
    }
  }

  function askDownloadCertificate({ level, isFinal }) {
    const state = getState();
    const issued = state.issuedCertificates || { 1: false, 2: false, 3: false, final: false };
    const already = isFinal ? !!issued.final : !!issued[level];
    if (already) return;

    downloadCertificate({ level, isFinal, force: true });
  }

  function startNewGame() {
    const state = getState();
    let currentLevel = clampLevel(state.currentLevel);
    const revisionMode = !!state.revisionMode;

    if (revisionMode) {
      const nextLvl = findNextPendingLevel(state, currentLevel);
      if (nextLvl === null) {
        // ✅ plus rien à réviser : sortie du mode révision
        const next = { ...state, revisionMode: false, showResults: true, currentQuestions: [], userAnswers: [] };
        setState(next);
        saveStateSilently(next);
        render();
        scrollTopSmoothRobust();
        announceToScreenReader("Révision terminée — 100% atteint sur les questions vues");
        return;
      }
      currentLevel = nextLvl;
    }

    const picked = revisionMode
      ? pickQuestionsForLevelRevision(state, currentLevel, QUESTIONS_PER_GAME)
      : pickQuestionsForLevel(state, currentLevel, QUESTIONS_PER_GAME);

    if (!picked || picked.length === 0) {
      const next = { ...state, currentQuestions: [], userAnswers: [], showResults: true };
      setState(next);
      saveStateSilently(next);
      render();
      scrollTopSmoothRobust();
      return;
    }

    const currentQuestions = picked.map(i => ({
      question: QUESTIONS[i].question,
      correct: QUESTIONS[i].correct,
      explanation: QUESTIONS[i].explanation,
      originalIndex: i,
      level: QUESTIONS[i].level
    }));

    const next = {
      ...state,
      currentLevel,
      currentQuestions,
      userAnswers: new Array(currentQuestions.length).fill(undefined),
      showResults: false
    };

    setState(next);
    saveStateSilently(next);
    render();
    scrollTopSmoothRobust();
    announceToScreenReader(`Nouvelle partie — ${levelLabel(currentLevel)} — ${currentQuestions.length} questions`);
  }

  function handleAnswer(questionIdx, answer) {
    const state = getState();
    const userAnswers = state.userAnswers.slice();
    userAnswers[questionIdx] = answer;

    const next = { ...state, userAnswers };
    setState(next);
    saveStateSilently(next);
    render();
  }

  function submitAnswers() {
    const state = getState();

    // ✅ garde-fou: impossible de valider si tout n'est pas répondu
    if (!allAnswered(state.userAnswers || [], (state.currentQuestions || []).length)) {
      alert("Réponds à chaque question avant de valider 🙂");
      return;
    }

    const currentLevel = clampLevel(state.currentLevel);

    let score = 0;
    for (let i = 0; i < state.currentQuestions.length; i++) {
      if (state.userAnswers[i] === state.currentQuestions[i].correct) score++;
    }
    const total = state.currentQuestions.length;
    const percentage = Math.round((score / total) * 100);

    const usedSet = new Set(state.usedQuestionIndices || []);
    state.currentQuestions.forEach(q => usedSet.add(q.originalIndex));
    const usedQuestionIndices = Array.from(usedSet);

    const gameHistory = (state.gameHistory || []).concat([{
      gameNumber: (state.gamesPlayed || 0) + 1,
      score,
      total,
      percentage,
      level: currentLevel
    }]);

    const levelAnswered = (Array.isArray(state.levelAnswered) && state.levelAnswered.length >= 4)
      ? state.levelAnswered.slice(0, 4)
      : [0, 0, 0, 0];

    const levelCorrect = (Array.isArray(state.levelCorrect) && state.levelCorrect.length >= 4)
      ? state.levelCorrect.slice(0, 4)
      : [0, 0, 0, 0];

    levelAnswered[currentLevel] += total;
    levelCorrect[currentLevel] += score;

    const prevQS = getQuestionStats(state);
    const questionStats = { ...prevQS };

    for (let i = 0; i < state.currentQuestions.length; i++) {
      const q = state.currentQuestions[i];
      const idx = q.originalIndex;
      const isCorrect = state.userAnswers[i] === q.correct;

      const prev = questionStats[idx] || { attempts: 0, correctAttempts: 0, lastCorrect: false };
      questionStats[idx] = {
        attempts: (prev.attempts || 0) + 1,
        correctAttempts: (prev.correctAttempts || 0) + (isCorrect ? 1 : 0),
        lastCorrect: isCorrect
      };
    }

    let maxUnlockedLevel = clampLevel(state.maxUnlockedLevel);
    let nextLevel = currentLevel;

    const stateForCheck = { ...state, levelAnswered, levelCorrect };
    const unlockedNow = (currentLevel < 3) && canUnlock(stateForCheck, currentLevel);

    if (unlockedNow) {
      maxUnlockedLevel = clampLevel(Math.max(maxUnlockedLevel, currentLevel + 1));
      nextLevel = clampLevel(currentLevel + 1);
    }

    const finalNow = (currentLevel === 3) && canUnlock(stateForCheck, 3);

    const next = {
      ...state,
      usedQuestionIndices,
      gameHistory,
      totalScore: (state.totalScore || 0) + score,
      totalAnswered: (state.totalAnswered || 0) + total,
      gamesPlayed: (state.gamesPlayed || 0) + 1,
      showResults: true,

      levelAnswered,
      levelCorrect,
      questionStats,

      currentLevel: nextLevel,
      maxUnlockedLevel,

      showRoundCorrection: false
    };

    setState(next);
    saveStateSilently(next);
    render();
    scrollTopSmoothRobust();
    announceToScreenReader(`Résultats : ${score}/${total} (${percentage}%)`);

    if (unlockedNow) askDownloadCertificate({ level: currentLevel, isFinal: false });

    // ✅ à la fin du niveau 3 : proposer diplôme N3 puis diplôme final
    if (finalNow) {
      setTimeout(() => askDownloadCertificate({ level: 3, isFinal: false }), 250);
      setTimeout(() => askDownloadCertificate({ level: 3, isFinal: true }), 650);
    }
  }

  function resetAll() {
    const ok = window.confirm("Voulez-vous vraiment réinitialiser toute votre progression ?");
    if (!ok) return;

    const next = createInitialState();
    setState(next);
    clearSavedState();
    render();
    scrollTopSmoothRobust();
  }

  function renderStats() {
    const state = getState();
    $statsRoot.innerHTML = "";
    if ((state.gamesPlayed || 0) <= 0) return;

    const percent = state.totalAnswered > 0 ? Math.round((state.totalScore / state.totalAnswered) * 100) : 0;
    const progress = computeGlobalProgress(state);

    const level = clampLevel(state.currentLevel);
    const maxUnlocked = clampLevel(state.maxUnlockedLevel);

    const p1 = levelProgress(state, 1);
    const p2 = levelProgress(state, 2);
    const p3 = levelProgress(state, 3);

    const wrapper = document.createElement("section");
    wrapper.className = "stats";
    wrapper.innerHTML = `
      <div class="statsRow">
        <div class="statBlock">
          <div class="statBig">🏆 <span>${state.totalScore} / ${state.totalAnswered}</span></div>
          <div class="statSmall">Score total cumulé (${percent}%)</div>
          <div class="statSmall">🎚️ ${levelLabel(level)} (débloqué : jusqu’à ${levelLabel(maxUnlocked)})</div>
        </div>
        <div class="statBlock" style="text-align:right;">
          <div class="statBig" style="justify-content:flex-end;">🎯 <span>Partie ${state.gamesPlayed}/${MAX_GAMES}</span></div>
          <div class="statSmall">${(state.usedQuestionIndices || []).length} / ${TOTAL_QUESTIONS} questions vues</div>
        </div>
      </div>

      <div class="infoBox" style="margin-top:10px;">
        <h3 style="margin:0 0 6px;">Progression par niveau</h3>
        <div style="font-size:.95rem; color:#4a5568;">
          <div>• Niveau 1 : ${p1.answered}/${MIN_QUESTIONS_PER_LEVEL_TO_UNLOCK} — ${p1.rate}%</div>
          <div>• Niveau 2 : ${p2.answered}/${MIN_QUESTIONS_PER_LEVEL_TO_UNLOCK} — ${p2.rate}%</div>
          <div>• Niveau 3 : ${p3.answered}/${MIN_QUESTIONS_PER_LEVEL_TO_UNLOCK} — ${p3.rate}%</div>
          <div style="margin-top:6px;"><b>Déblocage :</b> min. ${MIN_QUESTIONS_PER_LEVEL_TO_UNLOCK} questions + 80% de bonnes réponses.</div>
          <div style="margin-top:6px;"><b>Note :</b> si 80% n’est pas atteint, le quiz repose des questions — priorité aux ratées.</div>
        </div>
      </div>

      <div class="progressTrack" role="progressbar" aria-valuenow="${Math.round(progress)}" aria-valuemin="0" aria-valuemax="100">
        <div class="progressBar" style="width:${progress}%;"></div>
      </div>
    `;
    $statsRoot.appendChild(wrapper);
  }

  function renderStartScreen() {
    const state = getState();
    const wrap = document.createElement("div");
    wrap.className = "startScreen";

    const hasProgress = (state.usedQuestionIndices || []).length > 0 || (state.gamesPlayed || 0) > 0;

    wrap.innerHTML = `
      <div class="emoji">🚀</div>
      <h2>${hasProgress ? "Bienvenue de retour !" : "Prêt à commencer ?"}</h2>
      <p>Ton nom/pseudo (optionnel) : <b>${(state.participantName || "").trim() || "—"}</b></p>
      <button class="btn btnStart">${hasProgress ? "▶️ Continuer" : "🎯 Commencer le quiz"}</button>
      ${hasProgress ? `<div class="actionsRow" style="margin-top:10px;"><button class="btn btnGray" id="resetAllBtn">⟲ Réinitialiser tout</button></div>` : ""}
    `;

    wrap.querySelector(".btnStart").onclick = () => startNewGame();
    const resetBtn = wrap.querySelector("#resetAllBtn");
    if (resetBtn) resetBtn.onclick = () => resetAll();

    $contentRoot.appendChild(wrap);
  }

  function renderQuestions() {
    const state = getState();
    const container = document.createElement("div");

    state.currentQuestions.forEach((q, idx) => {
      const selected = state.userAnswers[idx];
      const card = document.createElement("div");
      card.className = "questionCard";
      card.innerHTML = `
        <h3 class="qTitle">${levelLabel(q.level)} — Question ${idx + 1} / ${state.currentQuestions.length}</h3>
        <p class="qText">${q.question}</p>
        <div class="answerRow">
          <button class="btn btnAnswer ${selected === true ? "selected" : ""}" data-q="${idx}" data-a="true">Vrai</button>
          <button class="btn btnAnswer ${selected === false ? "selected" : ""}" data-q="${idx}" data-a="false">Faux</button>
        </div>
      `;
      container.appendChild(card);
    });

    const submit = document.createElement("button");
    submit.className = "btn btnPrimary";
    submit.textContent = "Valider mes réponses";
    submit.disabled = !allAnswered(state.userAnswers, (state.currentQuestions || []).length);
    submit.setAttribute("aria-disabled", submit.disabled ? "true" : "false");
    submit.onclick = () => submitAnswers();
    container.appendChild(submit);

    container.addEventListener("click", (e) => {
      const t = e.target;
      if (!(t instanceof HTMLButtonElement)) return;
      if (!t.dataset.q || !t.dataset.a) return;
      handleAnswer(Number(t.dataset.q), t.dataset.a === "true");
    });

    $contentRoot.appendChild(container);
  }

  function renderDiplomasBox() {
    const state = getState();
    const issued = state.issuedCertificates || { 1: false, 2: false, 3: false, final: false };

    const eligible1 = canUnlock(state, 1);
    const eligible2 = canUnlock(state, 2);
    const eligible3 = canUnlock(state, 3);
    const eligibleFinal = eligible3;

    const items = [
      { key: 1, label: "Diplôme Niveau 1", eligible: eligible1, issued: !!issued[1], level: 1, isFinal: false },
      { key: 2, label: "Diplôme Niveau 2", eligible: eligible2, issued: !!issued[2], level: 2, isFinal: false },
      { key: 3, label: "Diplôme Niveau 3", eligible: eligible3, issued: !!issued[3], level: 3, isFinal: false },
      { key: "final", label: "Diplôme Final", eligible: eligibleFinal, issued: !!issued.final, level: 3, isFinal: true },
    ];

    const available = items.filter(it => it.eligible);
    if (available.length === 0) return null;

    const box = document.createElement("div");
    box.className = "infoBox";
    box.style.marginTop = "12px";

    const listHtml = available.map(it => {
      const btnLabel = it.issued ? "📄 Re-télécharger" : "🎓 Télécharger";
      const small = it.issued ? "Déjà délivré" : "Disponible";
      return `
        <div class="actionsRow" style="justify-content:space-between; gap:10px; margin:8px 0;">
          <div>
            <div style="font-weight:900;">${it.label}</div>
            <div style="color:#4a5568; font-size:.92rem;">${small}</div>
          </div>
          <button class="btn btnPrimary" data-cert="${it.key}">${btnLabel}</button>
        </div>
      `;
    }).join("");

    box.innerHTML = `
      <h3 style="margin:0 0 6px;">🎓 Mes diplômes</h3>
      <p style="margin:0 0 10px; color:#4a5568;">Télécharge tes diplômes quand tu veux. (Confirmation avant téléchargement.)</p>
      ${listHtml}
    `;

    box.addEventListener("click", (e) => {
      const t = e.target;
      if (!(t instanceof HTMLButtonElement)) return;
      const id = t.dataset.cert;
      if (!id) return;

      if (id === "final") {
        downloadCertificate({ level: 3, isFinal: true, force: true });
        return;
      }
      const lvl = clampLevel(Number(id));
      downloadCertificate({ level: lvl, isFinal: false, force: true });
    });

    return box;
  }

  function computeRoundScore(state) {
    const qs = state.currentQuestions || [];
    const ua = state.userAnswers || [];
    let ok = 0;
    qs.forEach((q, i) => {
      if (ua[i] === q.correct) ok++;
    });
    return { ok, total: qs.length, ko: Math.max(0, qs.length - ok) };
  }

  function renderRoundCorrectionBlock() {
    const state = getState();
    const qs = state.currentQuestions || [];
    const ua = state.userAnswers || [];
    if (!qs.length) return null;

    const wrap = document.createElement("div");
    wrap.id = "round-correction";
    wrap.className = "infoBox";
    wrap.style.marginTop = "12px";
    wrap.innerHTML = `<h3 style="margin:0 0 6px;">Correction</h3>`;

    const list = document.createElement("div");
    list.style.marginTop = "10px";

    qs.forEach((q, i) => {
      const user = ua[i];
      const isCorrect = user === q.correct;
      const userLabel = (user === true) ? "Vrai" : (user === false) ? "Faux" : "—";
      const correctLabel = q.correct ? "Vrai" : "Faux";

      const row = document.createElement("div");
      row.className = "questionCard";
      row.style.margin = "10px 0";
      row.style.borderLeft = isCorrect ? "6px solid var(--success)" : "6px solid var(--danger)";

      const expl = (q.explanation || "").trim();

      row.innerHTML = `
        <h3 class="qTitle">${isCorrect ? "✅ Bonne réponse" : "❌ Mauvaise réponse"} — Question ${i + 1}/${qs.length}</h3>
        <p class="qText">${q.question}</p>
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:6px;">
          <div style="padding:6px 10px; border-radius:10px; background:#f3f4f6;">
            Ta réponse : <b>${userLabel}</b>
          </div>
          <div style="padding:6px 10px; border-radius:10px; background:#f3f4f6;">
            Bonne réponse : <b>${correctLabel}</b>
          </div>
        </div>
        ${expl ? `<div class="infoBox" style="margin-top:10px;"><b>Explication :</b> ${expl}</div>` : ""}
      `;

      list.appendChild(row);
    });

    wrap.appendChild(list);
    return wrap;
  }

  function renderResults() {
    const state = getState();
    const container = document.createElement("div");

    const { ok, ko, total } = computeRoundScore(state);
    const pct = total > 0 ? Math.round((ok / total) * 100) : 0;

    const box = document.createElement("div");
    box.className = "infoBox";

    const isShown = !!state.showRoundCorrection;
    const toggleText = isShown ? "🙈 Masquer la correction" : "👀 Voir la correction";

    box.innerHTML = `
      <h3>Résultats</h3>
      <p style="margin:0;">Continue pour progresser. Si 80% n’est pas atteint, le quiz repose en priorité les questions ratées.</p>

      <div style="margin-top:10px; font-size:1.05rem;">
        <span style="font-weight:900;">Manche :</span> ${ok}/${total} (${pct}%)
      </div>
      <div style="margin-top:4px; font-size:1.05rem;">
        ✅ <b>${ok}</b> / ❌ <b>${ko}</b>
      </div>

      <div class="actionsRow" style="margin-top:12px;">
        <button class="btn btnPrimary" id="toggleCorrBtn">${toggleText}</button>
        <button class="btn btnGreen" id="contBtn">🔄 Continuer (5 questions)</button>
        <button class="btn btnGray" id="resetBtn">⟲ Réinitialiser tout</button>
      </div>
    `;

    box.querySelector("#contBtn").onclick = () => startNewGame();
    box.querySelector("#resetBtn").onclick = () => resetAll();

    box.querySelector("#toggleCorrBtn").onclick = () => {
      const s = getState();
      const willShow = !s.showRoundCorrection;

      const next = { ...s, showRoundCorrection: willShow };
      setState(next);
      saveStateSilently(next);
      render();

      if (willShow) scrollToCorrection();
    };

    container.appendChild(box);

    // ✅ correction + boutons en bas de correction
    if (state.showRoundCorrection) {
      const corr = renderRoundCorrectionBlock();
      if (corr) {
        container.appendChild(corr);

        const bottomActions = document.createElement("div");
        bottomActions.className = "actionsRow";
        bottomActions.style.marginTop = "12px";
        bottomActions.innerHTML = `
          <button class="btn btnGreen" id="contBtnBottom">🔄 Continuer (5 questions)</button>
          <button class="btn btnGray" id="resetBtnBottom">⟲ Réinitialiser tout</button>
        `;
        bottomActions.querySelector("#contBtnBottom").onclick = () => startNewGame();
        bottomActions.querySelector("#resetBtnBottom").onclick = () => resetAll();

        container.appendChild(bottomActions);
      }
    }

    const diplomas = renderDiplomasBox();
    if (diplomas) container.appendChild(diplomas);

    // ✅ Défi 100% : proposer de repartir du niveau 1 pour rejouer les ratées + jamais vues
    if (canUnlock(state, 3)) {
      const pending = computeGlobalPending(state);
      const challenge = document.createElement("div");
      challenge.className = "infoBox";
      challenge.style.marginTop = "12px";

      if (pending.pending > 0) {
        challenge.innerHTML = `
          <h3 style="margin:0 0 6px;">🎯 Défi 100%</h3>
          <p style="margin:0; color:#4a5568;">Tu as complété les 3 niveaux. Si tu veux viser le 100%, le quiz peut te reproposer uniquement les questions ratées et celles jamais vues.</p>
          <div style="margin-top:10px; font-size:1.05rem;">
            <div>❓ Jamais vues : <b>${pending.unseen}</b></div>
            <div>❌ À corriger : <b>${pending.incorrect}</b></div>
          </div>
          <div class="actionsRow" style="margin-top:12px;">
            <button class="btn btnGreen" id="startRevisionBtn">🔁 Repartir du niveau 1 (mode révision)</button>
          </div>
        `;
      } else {
        challenge.innerHTML = `
          <h3 style="margin:0 0 6px;">✅ Défi 100%</h3>
          <p style="margin:0; color:#4a5568;">Tout est vu et corrigé. Si tu veux, tu peux continuer à jouer pour t'entraîner.</p>
        `;
      }

      container.appendChild(challenge);

      const btn = challenge.querySelector("#startRevisionBtn");
      if (btn) {
        btn.onclick = () => {
          const s = getState();
          const next = { ...s, revisionMode: true, currentLevel: 1, showRoundCorrection: false };
          setState(next);
          saveStateSilently(next);
          startNewGame();
        };
      }
    }

    const shareBox = document.createElement("div");
    shareBox.className = "shareBox";
    shareBox.innerHTML = `
      <h3 style="margin:0 0 4px;">📣 Partager le quiz</h3>
      <p style="margin:0; color:#4a5568;">Partage Facebook ou copie du lien.</p>
    `;
    const shareRow = document.createElement("div");
    shareRow.className = "shareRow";
    const fbBtn = document.createElement("button");
    fbBtn.className = "btn btnPrimary shareBtn";
    fbBtn.innerHTML = "📘 Partager sur Facebook";
    const copyBtn = document.createElement("button");
    copyBtn.className = "btn btnPrimary shareBtn";
    copyBtn.innerHTML = "🔗 Copier le lien du quiz";
    fbBtn.onclick = () => shareOnFacebook(copyBtn);
    copyBtn.onclick = () => copyLinkFeedback(copyBtn);
    shareRow.appendChild(fbBtn);
    shareRow.appendChild(copyBtn);
    shareBox.appendChild(shareRow);

    container.appendChild(shareBox);

    $contentRoot.appendChild(container);
  }

  function render() {
    renderStats();
    $contentRoot.innerHTML = "";

    const state = getState();
    if (state.currentQuestions.length > 0 && !state.showResults) return renderQuestions();
    if (state.showResults) return renderResults();
    return renderStartScreen();
  }

  return { render };
}
