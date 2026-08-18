import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Stack } from "expo-router";
import { StyleSheet } from "react-native";

export default function TestPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Test" }} />
      <Text>Page test {id}</Text>
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
});
