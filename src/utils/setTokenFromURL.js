// utils/setTokenFromURL.js
export function setTokenCookieFromURL() {
  const url = new URL(window.location.href);
  const token = url.searchParams.get("token");

  if (token) {
    // Set cookie for 7 days (not HTTP-only because frontend sets it)
    document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; secure; SameSite=Lax`;

    // Remove token from URL and reload
    url.searchParams.delete("token");
    window.history.replaceState({}, document.title, url.pathname);
  }
}
