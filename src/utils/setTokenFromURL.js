// src/utils/setTokenFromURL.js
export function setTokenCookieFromURL() {
  const url = new URL(window.location.href);
  const token = url.searchParams.get("token");

  if (token) {
    // Store token in cookie (expires in 7 days)
    document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; Secure; SameSite=Lax`;

    // Remove token from URL
    url.searchParams.delete("token");
    window.history.replaceState({}, document.title, url.pathname + url.search);
  }
}
