import { View, Text, FlatList, Pressable } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { Stack } from "expo-router";

import { getSeanceId } from "@/services/api";

import { SeanceResponse } from "@/types/api";

import { styles } from "@/lib/styles";
import ViewChrono from "@/components/viewChrono";
import LoadingAnim from "@/components/LoadingAnim";

export default function Result() {
  const [seance, setSeance] = useState<SeanceResponse>();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const { id } = useLocalSearchParams<{ id: string }>();

  const initPage = () => {
    let cancelled = false;

    async function fetchSeance() {
      try {
        const data = await getSeanceId(id);
        if (!cancelled) {
          setSeance(data);
          setLoading(false);
        }
      } catch (e) {
        console.log("Erreur du fetch API/SEANCE/[id]", e);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSeance();

    return () => {
      cancelled = true;
    };
  };

  useEffect(() => {
    initPage();
  }, []);

  const handleCloseError = () => {
    setError(false);
    setLoading(true);
    initPage();
  };

  if (error)
    return (
      <View>
        <View>
          <Text style={styles.text}>Oups une erreur !</Text>
          <Pressable onPress={handleCloseError}>
            <Text style={styles.btnSelect}>Réessayer</Text>
          </Pressable>
        </View>
      </View>
    );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Result",
          headerTitleStyle: { fontFamily: "Orbitron-Medium" },
        }}
      />
      {loading ? (
        <View>
          <LoadingAnim />
        </View>
      ) : (
        <View style={styles.containerResult}>
          <FlatList
            data={seance?.timerRunners}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.containerFlatListResultPage}>
                <Text style={[styles.text, { marginRight: 20 }]}>
                  N°{item.numberRunner}
                </Text>
                <ViewChrono second={item.duration / 1000} size={20} />
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
}
