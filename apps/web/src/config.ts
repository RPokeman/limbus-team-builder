// apps/web/src/config.ts
export const API_BASE =
  (import.meta as any).env?.VITE_API_BASE?.toString() || "/api";
