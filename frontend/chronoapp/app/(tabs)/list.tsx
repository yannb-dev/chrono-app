import { View, Text, Pressable, FlatList } from "react-native";
import { styles } from "@/lib/styles";

import { router } from "expo-router";

import { getSeance } from "@/services/api";
import { deleteManySeance } from "@/services/api";

import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import { SeanceResponse } from "@/types/api";

export default function DetailScreen() {
  const [list, setList] = useState<SeanceResponse[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
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
    }, []),
  );

  const handleRedirectSeance = (seance: SeanceResponse) => {
    if (seance.state === "Finish") {
      router.push({
        pathname: `/result/[id]`,
        params: { id: seance.id },
      });
    } else {
      router.push({
        pathname: `/run/[id]`,
        params: { id: seance.id },
      });
    }
  };

  const handleDelete = async () => {
    try {
      const response = await deleteManySeance();

      if (response) {
        setList([]);
      }
    } catch (err) {
      console.error("Erreur du fetch DELETE api/seance", err);
      setError(true);
    }
  };

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.titlePage}>Liste des courses</Text>
        <Pressable style={styles.btnPressed} onPress={handleDelete}>
          <Text>Delete</Text>
        </Pressable>
      </View>

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
                  onPress={() => handleRedirectSeance(item)}
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
                  <Text>{item.state}</Text>
                </Pressable>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
}
