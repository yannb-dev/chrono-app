import { styles } from "@/lib/styles";
import { useState } from "react";
import { View, Text, Pressable, TextInput } from "react-native";

export default function Account() {
  const [confirmeDelete, setConfirmDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = () => {};

  if (confirmeDelete) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <View style={styles.containerError}>
          <Text style={styles.text}>
            Veuillez écrire "chronoapp" pour confirmer la suppression de votre
            compte.
          </Text>
          <TextInput
            placeholder="chronoapp"
            placeholderTextColor="#575656"
            value={confirmText}
            onChangeText={setConfirmText}
            style={styles.inputConfirmText}
          />
          <Pressable
            style={[
              styles.btnSelect,
              confirmText !== "chronoapp" && styles.btnPressed,
            ]}
            disabled={confirmText !== "chronoapp"}
            onPress={() => console.log("supprimer")}
          >
            <Text>Valider</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { justifyContent: "center" }]}>
      <Text style={styles.text}>Suppresion du compte</Text>
      <View
        style={{ height: 3, width: 30, backgroundColor: "black", margin: 20 }}
      ></View>
      <Text style={[styles.text, { fontSize: 12, marginBottom: 40 }]}>
        Vous souhaitez supprimer votre compte ? Cette action entrainera la
        suppresion de l'ensemble de vos données sans récupéraiton possible.
      </Text>
      <Pressable
        style={styles.btnSelect}
        onPress={() => setConfirmDelete(true)}
      >
        <Text style={styles.text}>Supprimer</Text>
      </Pressable>
    </View>
  );
}
