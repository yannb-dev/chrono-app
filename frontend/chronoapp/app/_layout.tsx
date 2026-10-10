import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { AuthGate } from "@/components/AuthGate";
import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DNS,

  tracesSampleRate: 0,
  // sendDefaultPii: true,

  enableLogs: !__DEV__,

  // replaysSessionSampleRate: 0.1,
  // replaysOnErrorSampleRate: 1,
  integrations: [
    // Sentry.mobileReplayIntegration(),
    // Sentry.feedbackIntegration(),
  ],
  debug: false,
  ignoreErrors: [
    "Network request failed", // perte de connexion, attendue sur mobile
    "AbortError",
  ],
  beforeBreadcrumb(breadcrumb) {
    if (breadcrumb.category === "console" && breadcrumb.level !== "error") {
      return null;
    }
    return breadcrumb;
  },
});

SplashScreen.preventAutoHideAsync();

export default Sentry.wrap(function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Orbitron-Regular": require("../assets/fonts/Orbitron-Regular.ttf"),
    "Orbitron-Medium": require("../assets/fonts/Orbitron-Medium.ttf"),
    "Orbitron-ExtraBold": require("../assets/fonts/Orbitron-ExtraBold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <AuthGate>
        <Stack>
          <Stack.Screen options={{ headerShown: false }} name="(tabs)" />
        </Stack>
      </AuthGate>
    </AuthProvider>
  );
});
