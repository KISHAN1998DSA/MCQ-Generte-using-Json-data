export const STORAGE_KEYS = {
  theme: "mcq_theme",
  stats: "mcq_stats",
  bookmarks: "mcq_bookmarks",
  history: "mcq_history",
  session: "mcq_active_session",
  sessions: "mcq_sessions",
  lastSubject: "mcq_last_subject",
  lastSettings: "mcq_last_settings",
};

export const defaultStats = {
  attemptedQuestions: 0,
  correctAnswers: 0,
  wrongAnswers: 0,
  accuracy: 0,
};

export function getStorageItem(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function setStorageItem(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function appendHistory(entry) {
  const history = getStorageItem(STORAGE_KEYS.history, []);
  const nextHistory = [entry, ...history].slice(0, 12);
  setStorageItem(STORAGE_KEYS.history, nextHistory);
  return nextHistory;
}

export function saveSession(session) {
  const sessions = getStorageItem(STORAGE_KEYS.sessions, {});
  sessions[session.id] = session;
  setStorageItem(STORAGE_KEYS.sessions, sessions);
  setStorageItem(STORAGE_KEYS.session, session.id);
}

export function getSession(sessionId) {
  const sessions = getStorageItem(STORAGE_KEYS.sessions, {});
  return sessions[sessionId] || null;
}

export function clearActiveSession() {
  localStorage.removeItem(STORAGE_KEYS.session);
}

export function updateSession(sessionId, updater) {
  const sessions = getStorageItem(STORAGE_KEYS.sessions, {});
  const current = sessions[sessionId];
  if (!current) return null;
  const updated = updater(current);
  sessions[sessionId] = updated;
  setStorageItem(STORAGE_KEYS.sessions, sessions);
  return updated;
}

export function getBookmarks() {
  return getStorageItem(STORAGE_KEYS.bookmarks, []);
}

export function toggleBookmark(bookmark) {
  const existing = getBookmarks();
  const hasBookmark = existing.some(
    (item) => item.subjectId === bookmark.subjectId && item.questionId === bookmark.questionId
  );
  const nextBookmarks = hasBookmark
    ? existing.filter(
        (item) =>
          !(item.subjectId === bookmark.subjectId && item.questionId === bookmark.questionId)
      )
    : [bookmark, ...existing];
  setStorageItem(STORAGE_KEYS.bookmarks, nextBookmarks);
  return nextBookmarks;
}

export function updateStats(result) {
  const previous = getStorageItem(STORAGE_KEYS.stats, defaultStats);
  const attemptedQuestions = previous.attemptedQuestions + result.attempted;
  const correctAnswers = previous.correctAnswers + result.correct;
  const wrongAnswers = previous.wrongAnswers + result.wrong;
  const accuracy = attemptedQuestions
    ? Math.round((correctAnswers / attemptedQuestions) * 100)
    : 0;
  const nextStats = { attemptedQuestions, correctAnswers, wrongAnswers, accuracy };
  setStorageItem(STORAGE_KEYS.stats, nextStats);
  return nextStats;
}
