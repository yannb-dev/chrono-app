import { useEffect, useState } from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { styles } from "@/lib/styles";
import { useLocalSearchParams, Stack } from "expo-router";

import { getSeanceId } from "@/services/api";
import { postTimerRunner } from "@/services/api";

import { TimerRunnerSchema } from "@/lib/schema/timerRunnerSchema";

import { TimerRunner } from "@/types/api";
import { SeanceResponse } from "@/types/api";

import Chrono from "@/components/chrono";
import ViewChrono from "@/components/viewChrono";

// Function pour convertir des secondes en hh:mm:ss

type List = {
  number: number;
  state: boolean;
  color: string;
};

export default function TestPage() {
  const [errorFetch, setErrorFetch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [seanceGet, setSeanceGet] = useState<SeanceResponse>();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [arrayResult, setArrayResult] = useState<TimerRunner[]>([]);
  const [arrayNumber, setArrayNumber] = useState<List[]>([]);

  // Chargement de la seance depuis id via URL ===============================================
  useEffect(() => {
    let cancelled = false;

    async function fetchSeance() {
      try {
        const data = await getSeanceId(id);
        const listNumber = Array.from(
          { length: Number(data.totalRunner) },
          (_, index) => ({
            number: index + 1,
            state: false,
            color: data.colorRunner,
          }),
        );
        if (!cancelled) {
          setSeanceGet(data);
          setArrayNumber(listNumber);
        }
      } catch (e) {
        console.log("Erreur du fetch API/SEANCE", e);
        if (!cancelled) setErrorFetch(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (id) fetchSeance();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Déclenchement de l'arrivée du coureur ===============================================

  const handleEndRunner = async (id: string, numberRunner: number) => {
    const data = {
      numberRunner: numberRunner,
      endedAt: new Date(),
      seanceId: id,
    };

    const safeData = TimerRunnerSchema.safeParse(data);

    if (safeData.success) {
      try {
        const timerRunner = await postTimerRunner(safeData.data);
        setArrayResult((prev) => [...prev, timerRunner]);

        const newArrayNumber = arrayNumber.map((item) =>
          item.number === timerRunner.numberRunner
            ? { ...item, state: true }
            : item,
        );
        setArrayNumber(newArrayNumber);
      } catch (err) {
        console.error("Erreur du fetch api/timerrunner", err);
        setErrorFetch(true);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Chronomètre" }} />
      {loading && <Text>Chargement...</Text>}
      {errorFetch && <Text>Erreur de chargement</Text>}
      {seanceGet && <Chrono seance={seanceGet} />}

      <View style={styles.containerBtnRunner}>
        {seanceGet && (
          <FlatList
            data={arrayNumber}
            numColumns={5}
            keyExtractor={(item) => item.number.toString()}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [
                  styles.btnRunner,
                  pressed && styles.btnPressed,
                  item.state
                    ? { backgroundColor: "gray" }
                    : { backgroundColor: item.color },
                ]}
                key={item.number}
                onPress={() => handleEndRunner(seanceGet?.id, item.number)}
              >
                <Text>{` ${item.number}`}</Text>
              </Pressable>
            )}
          />
        )}
      </View>
      <View style={styles.containerListChrono}>
        {arrayResult.length > 0 && (
          <FlatList
            data={arrayResult}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.list}>
                <Text>N°{item.numberRunner}</Text>
                <ViewChrono second={item.duration / 1000} />
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}
