import { View, Text, Pressable, FlatList } from "react-native";
import { styles } from "@/lib/styles";

import { router } from "expo-router";

import { getSeance } from "@/services/api";
import { useState, useEffect } from "react";

import { SeanceResponse } from "@/types/api";

export default function DetailScreen() {
  const [list, setList] = useState<SeanceResponse[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchSeance() {
      try {
        const data = await getSeance();
        if (!cancelled) setList(data);
      } catch (e) {
        console.log("Erreur du fetch API/SEANCE", e);
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
    <View style={styles.container}>
      <Text style={styles.titlePage}>Liste des courses</Text>
      {loading ? (
        <View>
          <Text>En cours de chargement</Text>
        </View>
      ) : (
        <View style={styles.containerListResult}>
          {list && (
            <FlatList
              data={list}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [
                    styles.btnCourse,
                    pressed && styles.btnPressed,
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: `/run/[id]`,
                      params: { id: item.id },
                    })
                  }
                >
                  <View
                    style={{
                      backgroundColor: `${item.colorRunner}`,
                      height: 20,
                      width: 20,
                      borderRadius: 10,
                    }}
                  ></View>
                  <Text>Nombre de coureur :{item.totalRunner}</Text>
                </Pressable>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
}
