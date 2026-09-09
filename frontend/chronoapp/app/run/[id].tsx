import { useEffect, useState, useRef } from "react";
import { View, Text, Pressable } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";

import { styles } from "@/lib/styles";

import { getSeanceId } from "@/services/api";
import { patchSeance } from "@/services/api";
import { patchTimerPause } from "@/services/api";
import { deleteTimerPause } from "@/services/api";
import { postTimerPause } from "@/services/api";
import { deleteAllTimerRunner } from "@/services/api";

import { PatchChronoSchema } from "@/lib/schema/patchChronoSchema";
import { EndedPausedSchema } from "@/lib/schema/endedSchema";
import { PausedChronoSchema } from "@/lib/schema/pausedSchema";

import { SeanceResponse } from "@/types/api";
import { TimerPause } from "@/types/api";

import ViewChrono from "@/components/viewChrono";
import { IconSymbol } from "@/components/ui/IconSymbol";
import BtnAndList from "@/components/BtnAndList";

export default function RunPage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [errorFetch, setErrorFetch] = useState(false);
  const [loading, setLoading] = useState(false);

  const [seanceGet, setSeanceGet] = useState<SeanceResponse>();

  const [stateChrono, setStateChrono] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const [timerPauseInProgress, setTimerPauseInProgress] =
    useState<TimerPause | null>(null);
  const [viewPaused, setViewPaused] = useState(false);
  const timerPausesLocal = useRef<TimerPause[]>([]);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [reset, setReset] = useState(false);

  // Chargement de la seance depuis id via URL ===============================================
  useEffect(() => {
    let cancelled = false;

    async function fetchSeance() {
      try {
        const data = await getSeanceId(id);

        if (!data) {
          setErrorFetch(true);
          return;
        }

        if (!cancelled) {
          if (data?.startedAt) {
            const pausedInProgress = data.timerpauses.filter(
              (item) => !item.endedAt,
            );

            const pausedEnded = data.timerpauses.filter((item) => item.endedAt);

            if (pausedInProgress.length > 0) {
              timerPausesLocal.current = pausedEnded;
              setViewPaused(true);
              setTimerPauseInProgress(pausedInProgress[0]);
            } else {
              timerPausesLocal.current = pausedEnded;
              handleStartChrono(data.startedAt);
            }
          }

          setSeanceGet(data);
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

  // ========== Gestion de setInterval et des pauses localement pour l'affichage,

  const handleStartChrono = (start: Date) => {
    setStateChrono(true);
    setViewPaused(false);

    intervalRef.current = setInterval(() => {
      const startedAt = new Date(start).getTime();

      const totalPause = timerPausesLocal.current.reduce((totalpause, item) => {
        return item.pauseDurationMs
          ? totalpause + Number(item.pauseDurationMs)
          : totalpause;
      }, 0);

      setElapsed(
        Math.floor((Date.now() - startedAt - Number(totalPause)) / 1000),
      );
    }, 1000);
  };

  // ========== Gestion du button [play] soit pour le démarrage, soit pour mettre fin à la pause

  const handlePlay = async () => {
    // répond à la question, il y a t'il une pause en cours ou non ?

    if (!timerPauseInProgress) {
      if (stateChrono) return;

      const data = {
        startedAt: new Date(),
        state: "InProgress",
      };

      const safeData = PatchChronoSchema.safeParse(data);

      if (safeData.success && seanceGet) {
        try {
          const response = await patchSeance(safeData.data, seanceGet.id);

          if (response.startedAt) {
            setSeanceGet(response);
            setReset(false);
            handleStartChrono(response.startedAt);
          }
        } catch (err) {
          console.error("Erreur du fetch api/seance", err);
          setErrorFetch(true);
        }
      }
    } else {
      const data = {
        endedAt: new Date(),
      };

      const safeData = EndedPausedSchema.safeParse(data);

      if (safeData.success) {
        try {
          const response = await patchTimerPause(
            safeData.data,
            timerPauseInProgress.id,
          );

          if (response.endedAt && seanceGet?.startedAt) {
            setTimerPauseInProgress(null);

            timerPausesLocal.current = [...timerPausesLocal.current, response];

            setReset(false);
            handleStartChrono(seanceGet.startedAt);
          }
        } catch (err) {
          console.error("Erreur du fetch api/seance", err);
          setErrorFetch(true);
        }
      }
    }
  };

  //========== Remise à zero du chronomètre et du startedAt de "seance" + suppression de l'ensemble des timerPause
  const handleReset = async () => {
    if (!seanceGet) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setStateChrono(false);
    setTimerPauseInProgress(null);

    const data = {
      startedAt: null,
      state: "NoStart",
    };

    const safePatch = PatchChronoSchema.safeParse(data);

    if (safePatch.success) {
      try {
        const responseTimerPause = await deleteTimerPause(seanceGet.id);
        const responseTimerRunner = await deleteAllTimerRunner(seanceGet.id);
        const responseSeance = await patchSeance(safePatch.data, seanceGet.id);

        if (responseTimerPause && responseSeance && responseTimerRunner) {
          setElapsed(0);
          setReset(true);
        }
      } catch (err) {
        console.error("Erreur du fetch API/TIMERPAUSE", err);
        setErrorFetch(true);
      }
    } else {
      console.error("Erreur de validation des données api/seance");
    }
  };

  // ========== Démarrage d'un timerPause en BDD avec pause du chronomètre
  const handlePause = async () => {
    if (!seanceGet) return;

    if (intervalRef.current) clearInterval(intervalRef.current);
    setStateChrono(false);
    // setDisabledPause(true);

    const data = {
      pausedAt: new Date(),
      seanceId: seanceGet.id,
    };

    const safeData = PausedChronoSchema.safeParse(data);

    if (safeData.success && seanceGet) {
      try {
        const response = await postTimerPause(safeData.data);
        setTimerPauseInProgress(response);
      } catch (err) {
        console.error("Erreur du fetch API/SEANCE", err);
        setErrorFetch(true);
      }
    }
  };

  // =========== Remise à zéro forcé de l'interval au montage

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (errorFetch)
    return (
      <View style={styles.container}>
        <View style={styles.containerError}>
          <Text style={styles.text}>Oups, une erreur !</Text>
          <Pressable onPress={() => setErrorFetch(false)}>
            <Text style={styles.text}>Réessayer</Text>
          </Pressable>
        </View>
      </View>
    );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Chronomètre",
          headerTitleStyle: { fontFamily: "Orbitron-Medium" },
        }}
      />
      <View style={styles.containerChrono}>
        <View style={styles.boxChrono}>
          <View style={styles.time}>
            {viewPaused ? (
              <Text style={styles.text}>Pause</Text>
            ) : (
              <ViewChrono second={elapsed} size={34} />
            )}
          </View>
          {seanceGet && (
            <View style={styles.containerBtnChrono}>
              <Pressable
                style={[
                  styles.btnChrono,
                  {
                    backgroundColor: stateChrono
                      ? "rgb(176, 171, 171)"
                      : "rgb(139,241,77)",
                  },
                ]}
                onPress={handlePlay}
                disabled={stateChrono}
              >
                <IconSymbol name={"play"} />
              </Pressable>
              <Pressable
                style={[
                  styles.btnChrono,
                  {
                    backgroundColor: !stateChrono
                      ? "rgb(176, 171, 171)"
                      : "rgb(139,241,77)",
                  },
                ]}
                onPress={handlePause}
                disabled={!stateChrono}
              >
                <IconSymbol name={"pause"} />
              </Pressable>
              <Pressable
                style={[
                  styles.btnChrono,
                  {
                    backgroundColor: !stateChrono
                      ? "rgb(176, 171, 171)"
                      : "rgb(139,241,77)",
                  },
                ]}
                disabled={!stateChrono}
                onPress={handleReset}
              >
                <IconSymbol name={"repeat.circle.fill"} />
              </Pressable>
            </View>
          )}
        </View>
      </View>
      {seanceGet && <BtnAndList seance={seanceGet} reset={reset} />}
    </View>
  );
}
