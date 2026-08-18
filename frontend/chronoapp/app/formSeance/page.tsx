import { View, Text, TextInput } from "react-native";
import { Stack } from "expo-router";
import { StyleSheet } from "react-native";

import Form from "@/components/form";

export default function FormSeance() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Configuration" }} />
      <Text>Ajouter le nombre de coureur et la couleur des dossards</Text>
      <View style={styles.boxForm}>
        <Form />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: "100%",
    backgroundColor: "rgb(74, 72, 207)",
    justifyContent: "center",
    alignItems: "center",
  },

  boxForm: {
    width: "100%",
    alignItems: "center",
    marginTop: 30,
  },
});
