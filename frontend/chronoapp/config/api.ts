// config/api.ts
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (__DEV__ ? "http://localhost:3000/api" : undefined);

if (!API_BASE_URL) {
  throw new Error(
    "EXPO_PUBLIC_API_URL manquante — vérifie la config EAS (eas env:list)",
  );
}
