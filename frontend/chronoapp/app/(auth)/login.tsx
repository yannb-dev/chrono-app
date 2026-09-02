import { useState } from "react";
import {
  View,
  TextInput,
  Button,
  Text,
  StyleSheet,
  Pressable,
} from "react-native";
import { styles } from "@/lib/styles";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/config/api";
import { Stack } from "expo-router";

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
      <Stack.Screen options={{ title: "Connexion" }} />
      {!loading ? (
        <View style={styles.container}>
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            placeholder="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {error && <Text>{error}</Text>}
          <Pressable
            style={({ pressed }) => [
              styles.btnSelect,
              pressed && styles.btnPressed,
            ]}
            onPress={handleLogin}
          >
            <Text>Se connecter</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.container}>
          <Text>Chargement</Text>
        </View>
      )}
    </View>
  );
}
