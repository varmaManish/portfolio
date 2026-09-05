// ============================================================
// THEME LOADER
// 1. Applies cached theme from localStorage instantly (no flash)
// 2. Fetches fresh theme from Firestore and updates cache
// ============================================================

(async function () {
  const STORAGE_KEY = 'mv_theme';

  // ── Step 1: Apply cached theme immediately ──
  // (This already runs via the inline <script> in each page's <head>,
  //  but we re-apply here in case localStorage was set after initial load)
  function applyVars(vars) {
    const root = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => {
      if (k.startsWith('--')) root.style.setProperty(k, v);
    });
  }

  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) {
    try { applyVars(JSON.parse(cached)); } catch (e) {}
  }

  // ── Step 2: Fetch from Firestore and refresh ──
  try {
    const doc = await db.collection('settings').doc('appearance').get();
    if (!doc.exists) {
      // No custom theme saved — clear any stale cache
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const vars = doc.data();
    applyVars(vars);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vars));
  } catch (e) {
    // Firebase not configured or network error — cached version stays applied
  }
})();
