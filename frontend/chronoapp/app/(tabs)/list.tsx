import { View, Text, Pressable } from "react-native";
import { StyleSheet } from "react-native";
import { router } from "expo-router";

export default function DetailScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Page de détail</Text>
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/test/[id]",
            params: { id: "123" },
          })
        }
      >
        <Text>Affiche un ID</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgb(81, 161, 74)",
  },

  title: {
    fontFamily: "mono",
    fontSize: 24,
  },
});
