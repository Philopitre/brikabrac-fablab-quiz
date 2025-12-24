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
    correct: true,
    explanation: "Beaucoup de fablabs collaborent avec des associations ou des hôpitaux pour fabriquer des prothèses low-cost, des aides à la mobilité ou des outils adaptés à des besoins spécifiques — souvent via l’impression 3D."
  },
  {
    question: "Des fablabs organisent des ateliers intergénérationnels.",
    correct: true,
    explanation: "C’est l’un des axes forts des fablabs : faire se rencontrer jeunes et aînés pour partager des savoirs, des compétences ou des projets — par exemple, un ado apprend à un senior à coder, ou l’inverse."
  },
  {
    question: "Des enfants apprennent à coder ou modéliser en fablab.",
    correct: true,
    explanation: "Beaucoup de fablabs proposent des ateliers pour les écoles primaires ou secondaires, avec des outils comme MakeCode, Tinkercad, ou des robots éducatifs (Micro:bit, Arduino, etc.)."
  },
  {
    question: "Certains fablabs sont accessibles aux personnes en situation de handicap.",
    correct: true,
    explanation: "Certains fablabs adaptent leurs espaces (accès PMR, outils ergonomiques, logiciels accessibles) ou organisent des ateliers dédiés pour favoriser l’inclusion."
  },
  {
    question: "Il existe des fablabs dans des bibliothèques, des écoles et des centres sociaux.",
    correct: true,
    explanation: "Les fablabs ne sont pas que dans des lieux techniques — ils s’installent aussi dans des lieux de vie, pour être accessibles à tous : bibliothèques, écoles, maisons de quartier, centres culturels…"
  },
  {
    question: "Des fablabs ont été créés à l'initiative de citoyens.",
    correct: true,
    explanation: "Beaucoup de fablabs sont nés d’un besoin local, initiés par des habitants, des associations ou des enseignants — pas par des institutions ou des entreprises."
  },
  {
    question: "Des fablabs participent à des projets de recherche scientifique.",
    correct: true,
    explanation: "Certains fablabs collaborent avec des universités ou des laboratoires pour des projets de prototypage, de mesures environnementales ou d’innovation sociale."
  },
  {
    question: "Des fablabs organisent des hackathons citoyens.",
    correct: true,
    explanation: "Ces événements rassemblent des citoyens, des makers, des designers et des élus pour co-créer des solutions à des problèmes locaux — ex. : améliorer un espace public, réduire les déchets, etc."
  },
  {
    question: "Certains fablabs ont des règles de sécurité strictes.",
    correct: true,
    explanation: "Surtout avec des machines comme les fraiseuses CNC, les lasers ou les imprimantes 3D — les règles (port de lunettes, formation obligatoire, supervision) sont essentielles pour éviter les accidents."
  },
  {
    question: "Des fablabs utilisent des logiciels libres pour la modélisation.",
    correct: true,
    explanation: "Beaucoup privilégient des outils libres comme FreeCAD, Blender, Inkscape ou Tinkercad — pour favoriser l’ouverture, le partage et l’apprentissage sans dépendance à des logiciels payants."
  },
  {
    question: "Tous les fablabs sont ouverts 24h/24 et 7j/7.",
    correct: false,
    explanation: "La plupart ont des horaires d’ouverture, souvent liés à la présence d’animateurs ou de bénévoles. Certains sont accessibles en accès libre, mais rarement 24h/24."
  },
  {
    question: "On peut utiliser toutes les machines sans aucune formation.",
    correct: false,
    explanation: "La formation est souvent obligatoire, surtout pour les machines dangereuses (laser, CNC, etc.). C’est une question de sécurité, mais aussi de respect des règles du fablab."
  },
  {
    question: "Tous les projets réalisés en fablab sont automatiquement open source.",
    correct: false,
    explanation: "C’est une valeur forte du mouvement, mais pas une obligation légale. Certains projets sont protégés par des brevets, d’autres sont partagés, d’autres restent privés."
  },
  {
    question: "Les fablabs sont toujours gratuits pour tout le monde.",
    correct: false,
    explanation: "Beaucoup sont payants ou demandent une adhésion (abonnement mensuel, tarif par heure, forfait). Certains sont gratuits pour les étudiants ou les associations, mais pas pour tous."
  },
  {
    question: "Il n'y a jamais de règles dans un fablab.",
    correct: false,
    explanation: "Au contraire, les règles sont essentielles : sécurité, réservation, nettoyage, respect des autres, usage des machines… Chaque fablab a sa charte."
  },
  {
    question: "Les fablabs sont réservés aux ingénieurs et techniciens.",
    correct: false,
    explanation: "Ils sont ouverts à tous : artistes, designers, étudiants, retraités, enfants, entrepreneurs… Le seul prérequis est la curiosité et l’envie d’apprendre."
  },
  {
    question: "On peut y fabriquer une voiture en une journée.",
    correct: false,
    explanation: "Les machines des fablabs (imprimantes 3D, fraiseuses, lasers) sont conçues pour des prototypes, des pièces, des objets — pas pour des véhicules complets. Une voiture demande des matériaux, des outils et des compétences bien au-delà du scope d’un fablab."
  },
  {
    question: "Les fablabs ne servent qu'à imprimer des gadgets.",
    correct: false,
    explanation: "Ils servent à bien plus : éducation, recherche, innovation sociale, prototypage, réparation, création artistique, développement de produits, etc. Les “gadgets” sont souvent juste le début."
  },
  {
    question: "Il n'y a pas besoin de respecter les règles de sécurité.",
    correct: false,
    explanation: "C’est l’inverse : les règles de sécurité sont primordiales, surtout avec des machines puissantes. Ignorer les règles peut entraîner des accidents, des dommages matériels ou la fermeture du fablab."
  },
  {
    question: "Les fablabs sont des magasins de bricolage.",
    correct: false,
    explanation: "Ce ne sont pas des lieux de vente, mais des lieux de création. On n’y achète pas d’outils — on les utilise, on apprend à les maîtriser, on crée avec."
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
    const explanation = shuffledQuizData[i].explanation;
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
    
    // Ajouter l'explication sous la question
    const explanationDiv = document.createElement('div');
    explanationDiv.className = 'explanation';
    explanationDiv.innerHTML = `<strong>Explication :</strong> ${escapeHtml(explanation)}`;
    qDiv.appendChild(explanationDiv);
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