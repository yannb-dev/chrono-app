// context/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { setOnUnauthorized } from "@/lib/authEvents";
import { router } from "expo-router";

type AuthContextType = {
  token: string | null;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync("accessToken").then((t) => {
      setToken(t);
      setIsLoading(false);
    });
  }, []);

  const login = async (newToken: string) => {
    await SecureStore.setItemAsync("accessToken", newToken);
    setToken(newToken);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("accessToken");
    setToken(null);
  };

  useEffect(() => {
    setOnUnauthorized(() => {
      logout();
      router.replace("/(auth)/login");
    });

    return () => setOnUnauthorized(null);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un AuthProvider");
  return ctx;
}
