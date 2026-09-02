import { View, Text } from "react-native";
import { Stack } from "expo-router";
import { styles } from "@/lib/styles";

import Form from "@/components/form";

export default function FormSeance() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Configuration" }} />
      <Text style={styles.titlePage}>
        Ajouter le nombre de coureur et la couleur des dossards
      </Text>
      <View>
        <Form />
      </View>
    </View>
  );
}
