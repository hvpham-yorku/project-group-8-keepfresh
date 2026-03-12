const DEV_HOST = process.env.NEXT_PUBLIC_DEV_HOST;
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (DEV_HOST ? `http://${DEV_HOST}:8000` : "http://localhost:8000");
export const APP_BASE =
  process.env.NEXT_PUBLIC_APP_URL ||
  (DEV_HOST ? `http://${DEV_HOST}:3000` : typeof window !== "undefined" ? window.location.origin : "");
