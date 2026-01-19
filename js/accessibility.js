// accessibility.js
/**
 * Annonce un message aux lecteurs d'écran sans perturber l'affichage visuel.
 * Utilisé pour donner un feedback vocal aux utilisateurs malvoyants/aveugles.
 * 
 * @param {string} message - Le message à annoncer au lecteur d'écran
 * 
 * @example
 * announceToScreenReader("Question 1 : réponse Vrai sélectionnée");
 */
export function announceToScreenReader(message) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  document.body.appendChild(announcement);
  
  // Nettoyage après 1 seconde (le lecteur d'écran a eu le temps de lire)
  setTimeout(() => announcement.remove(), 1000);
}