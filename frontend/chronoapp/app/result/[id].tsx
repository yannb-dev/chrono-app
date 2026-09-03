import { View, Text, FlatList } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { Stack } from "expo-router";

import { getSeanceId } from "@/services/api";

import { SeanceResponse } from "@/types/api";

export default function Result() {
  const [seance, setSeance] = useState<SeanceResponse>();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const { id } = useLocalSearchParams<{ id: string }>();

  // constamment utilisé quand l'on souhaite charger des valeurs au montage du composant
  // attention pas de async sur la function
  useEffect(() => {
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
  }, []);

  return (
    <View>
      <Stack.Screen options={{ title: "Résultat" }} />
      {loading ? (
        <View>
          <Text>Chargement en cours</Text>
        </View>
      ) : (
        <View>
          <FlatList
            data={seance?.timerRunners}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View
                style={{
                  backgroundColor: "gray",
                  height: 20,
                  width: 20,
                  borderRadius: 10,
                }}
              >
                <Text>{item.duration}</Text>
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
}
