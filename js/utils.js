// utils.js
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

export function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

// Robust guard: prevents validating if the answers array is the wrong size.
// expectedCount MUST be the number of questions currently displayed.
export function allAnswered(userAnswers, expectedCount) {
  if (!Array.isArray(userAnswers)) return false;
  if (typeof expectedCount !== "number" || expectedCount <= 0) return false;
  if (userAnswers.length !== expectedCount) return false;
  return userAnswers.every(v => v !== undefined && v !== null);
}
