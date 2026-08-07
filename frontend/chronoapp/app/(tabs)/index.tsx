import { View, Text } from "react-native";
import { StyleSheet } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Page d'accueil</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgb(114, 46, 190)",
  },

  title: {
    fontFamily: "mono",
    fontSize: 24,
  },
});
