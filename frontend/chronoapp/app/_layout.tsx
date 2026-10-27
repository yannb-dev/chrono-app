import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { AuthGate } from "@/components/AuthGate";
import * as Sentry from "@sentry/react-native";

const SENSITIVE_HEADERS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
]);

function scrubHeaders(headers?: Record<string, unknown>) {
  if (!headers) return;
  for (const key of Object.keys(headers)) {
    if (SENSITIVE_HEADERS.has(key.toLowerCase())) {
      delete headers[key];
    }
  }
}

const TOKEN_REGEX =
  /(Bearer\s+)[A-Za-z0-9\-._~+/]+=*|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;

function scrubString(value?: string) {
  return value?.replace(TOKEN_REGEX, "[Filtered]");
}

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  sendDefaultPii: false,
  attachScreenshot: false,
  attachViewHierarchy: false,
  tracesSampleRate: 0.1,

  beforeSend(event) {
    if (event.user) {
      delete event.user.ip_address;
      delete event.user.email;
    }

    if (event.request) {
      scrubHeaders(event.request.headers);
      delete event.request.cookies;
      if (event.request.url) {
        event.request.url = event.request.url.split(/[?#]/)[0];
      }
      delete event.request.query_string;
    }

    event.message = scrubString(event.message);
    event.exception?.values?.forEach((ex) => {
      ex.value = scrubString(ex.value);
    });

    return event;
  },

  beforeBreadcrumb(breadcrumb) {
    if (breadcrumb.category === "fetch" || breadcrumb.category === "xhr") {
      if (breadcrumb.data) {
        scrubHeaders(breadcrumb.data.request_headers);
        scrubHeaders(breadcrumb.data.headers);
        if (typeof breadcrumb.data.url === "string") {
          breadcrumb.data.url = breadcrumb.data.url.split("?")[0];
        }
      }
    }

    if (breadcrumb.category === "console" && breadcrumb.level !== "error") {
      return null;
    }
    if (breadcrumb.category === "ui.input") return null;

    breadcrumb.message = scrubString(breadcrumb.message);
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
