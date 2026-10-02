import { styles } from "@/lib/styles";
import { useState } from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import { router } from "expo-router";
import { HttpError, NetworkError, extractErrorMessage } from "@/lib/errors";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "@/context/AuthContext";

import { deleteUser } from "@/services/api";
import LoadingAnim from "@/components/LoadingAnim";
import ErrorMessage from "@/components/ErrorMessage";

export default function Account() {
  const { logout } = useAuth();
  const [confirmeDelete, setConfirmDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [error, setError] = useState(false);

  const handleDelete = async () => {
    setLoading(true);

    try {
      const deleteResponse = await deleteUser();

      if (deleteResponse) {
        await SecureStore.deleteItemAsync("accessToken");
        await logout();
      }
    } catch (err) {
      if (err instanceof HttpError) {
        if (err.status === 401) {
          await SecureStore.deleteItemAsync("accessToken");
          router.replace("/(auth)/login");
        }
        setDetailError(extractErrorMessage(err.body));
      } else if (err instanceof NetworkError) {
        setDetailError(err.message);
      } else {
        console.error("Erreur du fetch API/USER", err);
        setDetailError("Une erreur inattendue est survenue");
      }
      setError(true);
    } finally {
      setLoading(false);
    }
  };

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
            onPress={handleDelete}
          >
            <Text style={styles.text}>Valider</Text>
          </Pressable>
          <Pressable
            style={{ marginTop: 12 }}
            onPress={() => setConfirmDelete(false)}
          >
            <Text style={styles.text}>Retour</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (error)
    return (
      <View>
        <View>
          <ErrorMessage detailSend={detailError} />
          <Pressable onPress={() => setError(false)}>
            <Text style={styles.btnSelect}>Réessayer</Text>
          </Pressable>
        </View>
      </View>
    );

  return (
    <View>
      {loading ? (
        <LoadingAnim />
      ) : (
        <View style={[styles.container, { justifyContent: "center" }]}>
          <Text style={styles.text}>Suppresion du compte</Text>
          <View
            style={{
              height: 3,
              width: 30,
              backgroundColor: "black",
              margin: 20,
            }}
          ></View>
          <Text
            style={[
              styles.text,
              { fontSize: 12, marginBottom: 40, padding: 10 },
            ]}
          >
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
      )}
    </View>
  );
}
