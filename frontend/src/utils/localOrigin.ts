const CANONICAL_LOCAL_HOST = "localhost";

export function redirectToCanonicalLocalOrigin() {
  if (window.location.hostname !== "127.0.0.1") {
    return false;
  }

  const nextUrl = new URL(window.location.href);
  nextUrl.hostname = CANONICAL_LOCAL_HOST;
  window.location.replace(nextUrl.toString());
  return true;
}
