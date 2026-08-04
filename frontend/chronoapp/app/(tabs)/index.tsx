import { FlatList, Image, StyleSheet, Text, View } from "react-native";

const valueTab = [
  { name: "blue", number: 1 },
  { name: "red", number: 2 },
  { name: "green", number: 3 },
  { name: "yellow", number: 4 },
  { name: "purple", number: 5 },
  { name: "orange", number: 6 },
  { name: "pink", number: 7 },
  { name: "black", number: 8 },
  { name: "white", number: 9 },
  { name: "gray", number: 10 },
  { name: "brown", number: 11 },
  { name: "cyan", number: 12 },
  { name: "magenta", number: 13 },
  { name: "lime", number: 14 },
  { name: "indigo", number: 15 },
  { name: "teal", number: 16 },
  { name: "gold", number: 17 },
  { name: "silver", number: 18 },
  { name: "coral", number: 19 },
  { name: "navy", number: 20 },
];

export default function HomeScreen() {
  return (
    <View style={{ flex: 1, width: "100%", alignItems: "center" }}>
      <Text style={styles.title}>Mon premier écran React Native</Text>
      <Image
        source={require("../../assets/image/wolf.png")}
        style={styles.logo}
      ></Image>
      <FlatList
        data={valueTab}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <View
            style={{
              height: 100,
              width: 200,
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: item.name,
            }}
          >
            <Text>{item.number}</Text>
          </View>
        )}
      ></FlatList>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    color: "gray",
    textAlign: "left",
    margin: 15,
  },

  logo: {
    width: 70,
    height: 70,
    marginBottom: 20,
  },
});
