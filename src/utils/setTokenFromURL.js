// src/utils/setTokenFromURL.js

export function setTokenCookieFromURL() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (token) {
    document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Lax`; // 7 days
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}
