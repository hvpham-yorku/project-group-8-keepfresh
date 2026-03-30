const DEV_HOST = process.env.NEXT_PUBLIC_DEV_HOST;
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (DEV_HOST ? `http://${DEV_HOST}:8000` : "http://localhost:8000");
export const APP_BASE =
  process.env.NEXT_PUBLIC_APP_URL ||
  (DEV_HOST ? `http://${DEV_HOST}:3000` : typeof window !== "undefined" ? window.location.origin : "");

/** Base URL for QR / phone upload links. Prefer NEXT_PUBLIC_APP_URL (production), then NEXT_PUBLIC_DEV_HOST for LAN dev. */
export function getQrAppBase(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) return appUrl;
  const dev = process.env.NEXT_PUBLIC_DEV_HOST?.trim();
  if (dev) {
    return `http://${dev}:3000`;
  }
  if (typeof window !== "undefined") {
    return APP_BASE || window.location.origin;
  }
  return APP_BASE || "";
}
