import { useState } from "react";
import { View, TextInput, Text, Pressable } from "react-native";
import { styles } from "@/lib/styles";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/config/api";
import { Stack } from "expo-router";

import { router } from "expo-router";

import SvgComponent from "@/components/LogoApp";
import LoadingAnim from "@/components/LoadingAnim";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        setLoading(false);
        setError("Identifiants invalides");
        return;
      }

      const { token } = await res.json();
      await login(token); // le Context s'occupe de SecureStore + state
    } catch (err) {
      console.error(err);
      setError("Erreur réseau");
    }
  };

  return (
    <View>
      <Stack.Screen options={{ headerShown: false }} />

      {!loading ? (
        <View style={styles.container}>
          <View style={styles.containerLogo}>
            <SvgComponent />
          </View>
          <View style={styles.containerInput}>
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              style={styles.inputEmailLogin}
            />
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.inputPasswordLogin}
            />
            {error && (
              <Text style={[styles.text, { marginBottom: 30, color: "gray" }]}>
                {error}
              </Text>
            )}
            <Pressable
              style={({ pressed }) => [pressed && styles.btnPressed]}
              onPress={() => router.push("/(auth)/register")}
            >
              <Text style={styles.btnRegister}>S'inscrire</Text>
            </Pressable>
          </View>
          <View style={styles.containerBtnLogin}>
            <Pressable
              style={({ pressed }) => [
                styles.btnSelect,
                pressed && styles.btnPressed,
              ]}
              onPress={handleLogin}
            >
              <Text style={styles.text}>Se connecter</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.container}>
          <LoadingAnim />
        </View>
      )}
    </View>
  );
}
