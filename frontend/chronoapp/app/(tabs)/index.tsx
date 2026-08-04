import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

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
    <View style={styles.container}>
      <Text style={styles.title}>Mon premier écran React Native</Text>
      <Image
        source={require("../../assets/image/wolf.png")}
        style={styles.logo}
      />
      <ScrollView style={styles.scroll}>
        <View>
          <Text>
            Lorem ipsum, dolor sit amet consectetur adipisicing elit.
            Consectetur voluptatum sunt quaerat nam voluptatibus expedita soluta
            accusamus architecto, repellat velit aspernatur itaque officia
            dolore fuga fugiat eligendi similique ratione. Assumenda? Lorem
            ipsum dolor sit amet consectetur adipisicing elit. Illum, magnam ad
            dolorum nulla numquam tempora excepturi nobis fugiat quas,
            temporibus sed earum doloribus! Exercitationem adipisci, illum enim
            assumenda itaque quidem! Lorem ipsum dolor sit amet consectetur
            adipisicing elit. Laboriosam blanditiis sequi tenetur, possimus quo
            impedit necessitatibus distinctio nihil numquam beatae. Omnis quas
            minus explicabo sequi voluptatibus cupiditate impedit molestiae
            assumenda! Lorem ipsum dolor sit amet consectetur adipisicing elit.
            Omnis, eaque illum saepe asperiores deserunt voluptas illo nemo at
            eveniet itaque minus ipsa harum ab nam quo placeat. Accusamus, amet.
            Error.
          </Text>
        </View>
      </ScrollView>
      <FlatList
        style={styles.flat}
        data={valueTab}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <View
            style={[{ backgroundColor: item.name }, styles.containerFatList]}
          >
            <Text>{item.number}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
  },

  scroll: {
    height: 80,
  },
  flat: {
    width: "100%",
  },

  containerFatList: {
    height: 100,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

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
