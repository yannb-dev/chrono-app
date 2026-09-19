import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { AuthGate } from "@/components/AuthGate";
import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: "https://e5f23116913adac65a5ef4176fe51122@o4512107660771328.ingest.us.sentry.io/4512107677483008",

  tracesSampleRate: 1.0,
  // sendDefaultPii: true,

  // enableLogs: true,
  enableNativeCrashHandling: true,

  // replaysSessionSampleRate: 0.1,
  // replaysOnErrorSampleRate: 1,
  integrations: [
    // Sentry.mobileReplayIntegration(),
    // Sentry.feedbackIntegration(),
  ],
  debug: __DEV__,
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
