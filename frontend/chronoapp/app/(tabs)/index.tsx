import { View, Text, Pressable } from "react-native";
import { styles } from "@/lib/styles";
import { router } from "expo-router";

import { useAuth } from "@/context/AuthContext";

export default function HomeScreen() {
  const { token, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.titlePage}>Chronomètre de groupe</Text>
      <Pressable
        style={({ pressed }) => [
          styles.btnSelect,
          pressed && styles.btnPressed,
        ]}
        onPress={() =>
          router.push({
            pathname: "/formSeance/page",
          })
        }
      >
        <Text>Créer</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [
          styles.btnSelect,
          pressed && styles.btnPressed,
        ]}
        onPress={logout}
      >
        <Text>Se déconnecter</Text>
      </Pressable>
    </View>
  );
}
