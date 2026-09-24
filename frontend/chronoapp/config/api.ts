// config/api.ts
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (__DEV__ ? process.env.EXPO_BASE_URL : undefined);

if (!API_BASE_URL) {
  throw new Error(
    "EXPO_PUBLIC_API_URL manquante — vérifie la config EAS (eas env:list)",
  );
}
