import { View } from "react-native";
import { Stack } from "expo-router";
import { styles } from "@/lib/styles";

import Form from "@/components/form";

export default function FormSeance() {
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Creating",
          headerTitleStyle: { fontFamily: "Orbitron-Medium" },
        }}
      />
      <View style={styles.containerSupForm}>
        <Form />
      </View>
    </View>
  );
}
