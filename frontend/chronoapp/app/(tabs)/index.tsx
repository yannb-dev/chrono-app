import { View, Text, Pressable } from "react-native";
import { StyleSheet } from "react-native";
import { router } from "expo-router";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configuration de la course</Text>
      <Pressable
        style={styles.btnNew}
        onPress={() =>
          router.push({
            pathname: "/formSeance/page",
          })
        }
      >
        <Text>Créer</Text>
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
    backgroundColor: "rgb(114, 46, 190)",
  },

  title: {
    fontFamily: "mono",
    fontSize: 24,
  },

  btnNew: {
    padding: 5,
    backgroundColor: "rgb(255,255,255)",
    borderRadius: 3,
    marginTop: 20,
  },
});
