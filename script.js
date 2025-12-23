// ============================================
// UTILITAIRES
// ============================================

/**
 * Mélange un tableau aléatoirement (algorithme Fisher-Yates)
 * @param {Array} array - Le tableau à mélanger
 * @returns {Array} Le tableau mélangé
 */
function shuffleArray(array) {
  const shuffled = [...array]; // Copie pour ne pas modifier l'original
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ============================================
// DONNÉES DU QUIZ
// ============================================

const quizData = [
  {
    question: "Des makers utilisent les fablabs pour créer des prothèses ou aides techniques.",
    correct: true
  },
  {
    question: "Des fablabs organisent des ateliers intergénérationnels.",
    correct: true
  },
  {
    question: "Des enfants apprennent à coder ou modéliser en fablab.",
    correct: true
  },
  {
    question: "Certains fablabs sont accessibles aux personnes en situation de handicap.",
    correct: true
  },
  {
    question: "Il existe des fablabs dans des bibliothèques, des écoles et des centres sociaux.",
    correct: true
  },
  {
    question: "Des fablabs ont été créés à l'initiative de citoyens.",
    correct: true
  },
  {
    question: "Des fablabs participent à des projets de recherche scientifique.",
    correct: true
  },
  {
    question: "Des fablabs organisent des hackathons citoyens.",
    correct: true
  },
  {
    question: "Certains fablabs ont des règles de sécurité strictes.",
    correct: true
  },
  {
    question: "Des fablabs utilisent des logiciels libres pour la modélisation.",
    correct: true
  },
  {
    question: "Tous les fablabs sont ouverts 24h/24 et 7j/7.",
    correct: false
  },
  {
    question: "On peut utiliser toutes les machines sans aucune formation.",
    correct: false
  },
  {
    question: "Tous les projets réalisés en fablab sont automatiquement open source.",
    correct: false
  },
  {
    question: "Les fablabs sont toujours gratuits pour tout le monde.",
    correct: false
  },
  {
    question: "Il n'y a jamais de règles dans un fablab.",
    correct: false
  },
  {
    question: "Les fablabs sont réservés aux ingénieurs et techniciens.",
    correct: false
  },
  {
    question: "On peut y fabriquer une voiture en une journée.",
    correct: false
  },
  {
    question: "Les fablabs ne servent qu'à imprimer des gadgets.",
    correct: false
  },
  {
    question: "Il n'y a pas besoin de respecter les règles de sécurité.",
    correct: false
  },
  {
    question: "Les fablabs sont des magasins de bricolage.",
    correct: false
  }
];

// ============================================
// VARIABLES GLOBALES
// ============================================

const shuffledQuizData = shuffleArray(quizData);
const userAnswers = new Array(shuffledQuizData.length).fill(undefined);

// Éléments DOM
const quizContainer = document.getElementById('quiz-container');
const submitBtn = document.getElementById('submit-btn');
const resultDiv = document.getElementById('result');
const shareButtons = document.getElementById('share-buttons');
const shareFB = document.getElementById('share-fb');
const fabCInfo = document.getElementById('fab-c-info');
const agrilabInfo = document.getElementById('agrilab-info');
const restartBtn = document.getElementById('restart-btn');

// ============================================
// FONCTIONS PRINCIPALES
// ============================================

/**
 * Crée et affiche une question
 * @param {number} index - L'index de la question à afficher
 */
function createQuestion(index) {
  const q = shuffledQuizData[index];
  const questionDiv = document.createElement('div');
  questionDiv.className = 'question';
  questionDiv.setAttribute('data-question-index', index);
  
  questionDiv.innerHTML = `
    <h3>Question ${index + 1} / ${shuffledQuizData.length}</h3>
    <p>${escapeHtml(q.question)}</p>
    <div class="options">
      <button class="option-btn" data-answer="true" aria-label="Répondre Vrai">Vrai</button>
      <button class="option-btn" data-answer="false" aria-label="Répondre Faux">Faux</button>
    </div>
  `;
  
  quizContainer.appendChild(questionDiv);
  
  // Ajouter les écouteurs d'événements
  const buttons = questionDiv.querySelectorAll('.option-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => handleAnswerClick(btn, buttons, index));
  });
}

/**
 * Gère le clic sur une réponse
 * @param {HTMLElement} clickedBtn - Le bouton cliqué
 * @param {NodeList} allButtons - Tous les boutons de la question
 * @param {number} index - L'index de la question
 */
function handleAnswerClick(clickedBtn, allButtons, index) {
  // Retirer la sélection précédente
  allButtons.forEach(b => b.classList.remove('selected'));
  
  // Sélectionner le nouveau bouton
  clickedBtn.classList.add('selected');
  
  // Enregistrer la réponse
  userAnswers[index] = clickedBtn.dataset.answer === 'true';
  
  // Vérifier si toutes les questions ont été répondues
  checkAllAnswered();
}

/**
 * Vérifie si toutes les questions ont été répondues
 */
function checkAllAnswered() {
  const allAnswered = userAnswers.every(answer => answer !== undefined);
  submitBtn.disabled = !allAnswered;
  
  // Accessibilité : informer l'utilisateur
  if (allAnswered) {
    submitBtn.setAttribute('aria-label', 'Valider mes réponses - Toutes les questions ont été répondues');
  } else {
    const remaining = userAnswers.filter(a => a === undefined).length;
    submitBtn.setAttribute('aria-label', `Valider mes réponses - ${remaining} question(s) restante(s)`);
  }
}

/**
 * Affiche les résultats du quiz
 */
function showResults() {
  let score = 0;
  
  // Parcourir toutes les questions pour afficher les résultats
  const questions = quizContainer.querySelectorAll('.question');
  questions.forEach((qDiv, i) => {
    const userAnswer = userAnswers[i];
    const correctAnswer = shuffledQuizData[i].correct;
    const buttons = qDiv.querySelectorAll('.option-btn');
    
    // Désactiver les boutons
    buttons.forEach(btn => btn.disabled = true);
    
    // Marquer la bonne réponse en vert
    const correctBtn = buttons[correctAnswer ? 0 : 1];
    correctBtn.classList.add('correct');
    correctBtn.setAttribute('aria-label', 'Bonne réponse');
    
    // Si l'utilisateur a bien répondu
    if (userAnswer === correctAnswer) {
      score++;
    } else {
      // Marquer la mauvaise réponse en rouge
      const wrongBtn = buttons[userAnswer ? 0 : 1];
      wrongBtn.classList.add('wrong');
      wrongBtn.setAttribute('aria-label', 'Mauvaise réponse');
    }
  });
  
  // Afficher le score
  const percentage = Math.round((score / shuffledQuizData.length) * 100);
  const emoji = percentage === 100 ? '🎉' : percentage >= 80 ? '👏' : percentage >= 60 ? '👍' : '💪';
  
  resultDiv.textContent = `${emoji} Vous avez ${score} bonne${score > 1 ? 's' : ''} réponse${score > 1 ? 's' : ''} sur ${shuffledQuizData.length} (${percentage}%)`;
  resultDiv.className = score === shuffledQuizData.length ? 'correct' : 'wrong';
  resultDiv.classList.remove('hidden');
  resultDiv.setAttribute('role', 'alert');
  resultDiv.setAttribute('aria-live', 'polite');
  
  // Masquer le bouton de validation
  submitBtn.style.display = 'none';
  
  // Afficher les éléments de fin
  shareButtons.classList.remove('hidden');
  fabCInfo.classList.remove('hidden');
  agrilabInfo.classList.remove('hidden');
  restartBtn.classList.remove('hidden');
  
  // Scroller vers les résultats
  resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  
  // Configurer le lien de partage Facebook
  setupFacebookShare(score, percentage);
}

/**
 * Configure le lien de partage Facebook
 * @param {number} score - Le score obtenu
 * @param {number} percentage - Le pourcentage de réussite
 */
function setupFacebookShare(score, percentage) {
  // URL à partager
  const shareUrl = window.location.href;
  
  // Créer l'URL de partage Facebook (méthode moderne)
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  
  shareFB.href = fbUrl;
  shareFB.setAttribute('target', '_blank');
  shareFB.setAttribute('rel', 'noopener noreferrer');
  
  // Alternative : ouvrir dans une popup
  shareFB.addEventListener('click', (e) => {
    e.preventDefault();
    const width = 600;
    const height = 400;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    
    window.open(
      fbUrl,
      'facebook-share',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
    );
  });
}

/**
 * Échappe les caractères HTML pour éviter les injections XSS
 * @param {string} text - Le texte à échapper
 * @returns {string} Le texte échappé
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Redémarre le quiz
 */
function restartQuiz() {
  // Option 1 : Rechargement complet (simple et fiable)
  location.reload();
  
  // Option 2 : Réinitialisation sans rechargement (plus fluide mais plus complexe)
  // Décommenter si vous préférez cette approche :
  /*
  quizContainer.innerHTML = '';
  userAnswers.fill(undefined);
  resultDiv.classList.add('hidden');
  shareButtons.classList.add('hidden');
  fabCInfo.classList.add('hidden');
  agrilabInfo.classList.add('hidden');
  restartBtn.classList.add('hidden');
  submitBtn.style.display = 'block';
  submitBtn.disabled = true;
  
  const newShuffled = shuffleArray(quizData);
  shuffledQuizData.length = 0;
  shuffledQuizData.push(...newShuffled);
  
  initQuiz();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  */
}

/**
 * Initialise le quiz
 */
function initQuiz() {
  // Créer toutes les questions
  shuffledQuizData.forEach((_, i) => createQuestion(i));
  
  // Configuration initiale du bouton de validation
  submitBtn.disabled = true;
  submitBtn.setAttribute('aria-label', `Valider mes réponses - ${shuffledQuizData.length} questions restantes`);
}

// ============================================
// ÉCOUTEURS D'ÉVÉNEMENTS
// ============================================

// Validation du quiz
submitBtn.addEventListener('click', showResults);

// Redémarrage du quiz
restartBtn.addEventListener('click', restartQuiz);

// Gestion du clavier (Enter/Space sur les boutons)
document.addEventListener('keydown', (e) => {
  if (e.target.classList.contains('option-btn') && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    e.target.click();
  }
});

// ============================================
// INITIALISATION
// ============================================

// Démarrer le quiz au chargement de la page
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initQuiz);
} else {
  initQuiz();
}

// Prévenir la perte accidentelle du quiz en cours
window.addEventListener('beforeunload', (e) => {
  if (userAnswers.some(a => a !== undefined) && !resultDiv.classList.contains('hidden') === false) {
    e.preventDefault();
    e.returnValue = '';
  }
});