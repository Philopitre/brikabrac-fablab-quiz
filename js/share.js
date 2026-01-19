// share.js
// Partage EXCLUSIF sur Facebook + fallback copie du lien

/**
 * URL propre du quiz (sans hash)
 */
export function getShareUrl() {
  return window.location.href.split("#")[0];
}

/**
 * Copie du lien avec feedback visuel
 */
export function copyLinkFeedback(btn) {
  const url = getShareUrl();

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      const original = btn.innerHTML;
      btn.innerHTML = "✅ Lien copié";
      btn.style.background = "var(--success)";

      setTimeout(() => {
        btn.innerHTML = original;
        btn.style.background = "var(--primary)";
      }, 1800);
    }).catch(() => {
      alert(`Copiez ce lien pour partager le quiz :\n\n${url}`);
    });
  } else {
    alert(`Copiez ce lien pour partager le quiz :\n\n${url}`);
  }
}

/**
 * Partage Facebook uniquement
 * Si la pop-up est bloquée → copie du lien
 */
export function shareOnFacebook(copyBtn) {
  const url = getShareUrl();
  const fbShareUrl =
    "https://www.facebook.com/sharer/sharer.php?u=" +
    encodeURIComponent(url);

  // IMPORTANT : doit être déclenché directement sur un clic utilisateur
  const win = window.open(
    fbShareUrl,
    "_blank",
    "noopener,noreferrer,width=600,height=520"
  );

  // Pop-up bloquée → fallback copie
  if (!win) {
    copyLinkFeedback(copyBtn);
  }
}
