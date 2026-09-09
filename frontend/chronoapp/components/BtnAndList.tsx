import { View, FlatList, Pressable, Text } from "react-native";
import { useEffect, useState } from "react";

import { styles } from "@/lib/styles";

import { postTimerRunner } from "@/services/api";
import { patchSeance } from "@/services/api";
import { PatchChronoSchema } from "@/lib/schema/patchChronoSchema";
import { TimerRunnerSchema } from "@/lib/schema/timerRunnerSchema";

import { SeanceResponse } from "@/types/api";
import { TimerRunner } from "@/types/api";

import { router } from "expo-router";

import ViewChrono from "./viewChrono";

type List = {
  number: number;
  state: boolean;
  color: string;
};

type Seance = {
  seance: SeanceResponse;
  reset: Boolean;
};

export default function BtnAndList({ seance, reset }: Seance) {
  const [errorFetch, setErrorFetch] = useState(false);

  const [loading, setLoading] = useState(true);
  const [arrayResult, setArrayResult] = useState<TimerRunner[]>([]);
  const [arrayNumber, setArrayNumber] = useState<List[]>([]);

  // Déclenchement de l'arrivée du coureur ===============================================
  useEffect(() => {
    const listNumber = Array.from(
      { length: Number(seance.totalRunner) },
      (_, index) => ({
        number: index + 1,
        state: false,
        color: seance.colorRunner,
      }),
    );

    if (seance.timerRunners) {
      const finalArrayNumber =
        seance.timerRunners.length > 0
          ? listNumber.map((item) =>
              seance.timerRunners.find((e) => e.numberRunner === item.number)
                ? { ...item, state: true }
                : item,
            )
          : listNumber;

      setArrayNumber(finalArrayNumber);
    }

    setArrayResult(seance.timerRunners);
  }, []);

  useEffect(() => {
    if (reset) {
      const listNumber = Array.from(
        { length: Number(seance.totalRunner) },
        (_, index) => ({
          number: index + 1,
          state: false,
          color: seance.colorRunner,
        }),
      );

      setArrayNumber(listNumber);
      setArrayResult([]);
    }
  }, [reset]);

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

        setArrayNumber((prev) =>
          prev.map((item) =>
            item.number === timerRunner.numberRunner
              ? { ...item, state: true }
              : item,
          ),
        );
      } catch (err) {
        console.error("Erreur du fetch api/timerrunner", err);
        setErrorFetch(true);
        const timeoutId = setTimeout(() => {
          setErrorFetch(false);
        }, 3000);
      }
    }
  };

  // Changement du status de séance en "finish"

  const handleEnded = async (id: string) => {
    const data = {
      state: "Finish",
    };

    const safePatch = PatchChronoSchema.safeParse(data);

    if (safePatch.success) {
      try {
        const response = await patchSeance(safePatch.data, id);

        if (response) router.push("/");
      } catch (err) {
        console.error("Erreur du fetch api/seance", err);
        setErrorFetch(true);
      }
    } else {
      console.error("Erreur de validation des données fetch api/seance");
    }
  };
  return (
    <View style={styles.container}>
      <View style={styles.containerBtnRunner}>
        {seance && (
          // component avec btnRunner & ListResult
          <FlatList
            data={arrayNumber}
            numColumns={5}
            keyExtractor={(item) => item.number.toString()}
            renderItem={({ item }) => (
              <Pressable
                disabled={item.state}
                style={({ pressed }) => [
                  styles.btnRunner,
                  pressed && styles.btnPressed,
                  item.state
                    ? { backgroundColor: "rgb(212,212,212)" }
                    : { backgroundColor: item.color },
                ]}
                key={item.number}
                onPress={() => handleEndRunner(seance.id, item.number)}
              >
                <Text style={styles.textBtnRunner}>{` ${item.number}`}</Text>
              </Pressable>
            )}
          />
        )}
      </View>
      {errorFetch && (
        <View style={styles.containerErrorFetchBtnChrono}>
          <Text style={styles.textError}>Aucun chrono lancé</Text>
        </View>
      )}
      <View style={styles.containerListChrono}>
        {arrayResult.length > 0 && (
          <FlatList
            data={arrayResult}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.list}>
                <Text>N°{item.numberRunner}</Text>
                <ViewChrono second={item.duration / 1000} size={20} />
              </View>
            )}
          />
        )}
      </View>
      <View style={styles.containerBtnSave}>
        <Pressable
          style={styles.btnSelect}
          onPress={() => handleEnded(seance.id)}
        >
          <Text>Save</Text>
        </Pressable>
      </View>
    </View>
  );
}
