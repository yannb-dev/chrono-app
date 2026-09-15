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
import { extractErrorMessage, HttpError, NetworkError } from "@/lib/errors";

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
  const [error, setError] = useState(false);
  const [detailError, setDetailError] = useState("");
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
        if (err instanceof HttpError) {
          setDetailError(extractErrorMessage(err.body));
        } else if (err instanceof NetworkError) {
          setDetailError(err.message);
        } else {
          setDetailError("Une erreur inattendue est survenue");
        }

        console.error("Erreur du fetch api/timerrunner", err);
        setError(true);
        const timeoutId = setTimeout(() => {
          setError(false);
        }, 3000);
      }
    }
  };

  const handleEnded = async (id: string) => {
    const data = {
      state: "Finish",
    };

    const safePatch = PatchChronoSchema.safeParse(data);

    if (safePatch.success) {
      try {
        const response = await patchSeance(safePatch.data, id);

        router.push("/");
      } catch (err) {
        if (err instanceof HttpError) {
          setDetailError(extractErrorMessage(err.body));
        } else if (err instanceof NetworkError) {
          setDetailError(err.message);
        } else {
          setDetailError(
            "Une erreur inattendue est survenue ! Le chronomètre est il actif ?",
          );
        }

        console.error("Erreur du fetch api/seance", err);
        setError(true);
      }
    } else {
      setDetailError("Erreur des valeurs d'entrée");
      setError(true);
      console.error("Erreur de validation des données fetch api/seance");
    }
  };

  if (error)
    return (
      <View style={styles.container}>
        <View style={styles.containerError}>
          <Text style={styles.text}>Oups, une erreur !</Text>
          <Text style={styles.text}>{detailError}</Text>
          <Pressable onPress={() => setError(false)}>
            <Text style={styles.text}>Réessayer</Text>
          </Pressable>
        </View>
      </View>
    );

  return (
    <View style={styles.container}>
      <View style={styles.containerBtnRunner}>
        {seance && (
          <FlatList
            data={arrayNumber}
            numColumns={5}
            keyExtractor={(item) => item.number.toString()}
            renderItem={({ item }) => (
              <Pressable
                testID={`btn-endRunner-${item.number}`}
                accessibilityRole="button"
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
          testID="btn-ended"
          style={styles.btnSelect}
          onPress={() => handleEnded(seance.id)}
        >
          <Text>Save</Text>
        </Pressable>
      </View>
    </View>
  );
}
