import { View, Text, Pressable } from "react-native";
import { useState, useEffect, useRef } from "react";
import { styles } from "@/lib/styles";

import { PatchChronoSchema } from "@/lib/schema/patchChronoSchema";
import { PausedChronoSchema } from "@/lib/schema/pausedSchema";
import { EndedPausedSchema } from "@/lib/schema/endedSchema";

import { patchSeance } from "@/services/api";
import { postTimerPause } from "@/services/api";
import { patchTimerPause } from "@/services/api";
import { deleteTimerPause } from "@/services/api";

import { TimerPause } from "@/types/api";
import { SeanceResponse } from "@/types/api";

import ViewChrono from "./viewChrono";

type ChronoProps = { seance: SeanceResponse };

export default function Chrono({ seance }: ChronoProps) {
  const [errorFetch, setErrorFetch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stateChrono, setStateChrono] = useState(false);

  const [seanceGet, setSeanceGet] = useState<SeanceResponse>(seance);

  const [timerPauseInProgress, setTimerPauseInProgress] =
    useState<TimerPause | null>(null);

  const timerPausesLocal = useRef<TimerPause[]>([]);

  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  //========== Architecture générale ===========//

  // Initialise elapsed en fonction des valeurs présentes en BDD
  // 3 functions distinctes pour [play], [pause], [stop]
  // 1 sous function de [play] pour la gestion des pauses au sein du chrono

  //========== Au changement de "seance" calcul elapsed, prise en compte des pauses avec timerPause[]

  useEffect(() => {
    if (seance?.startedAt) {
      const startedAt = new Date(seance.startedAt).getTime();

      if (seance.timerpauses.length > 0) {
        const totalPause = seance.timerpauses.reduce((totalpause, item) => {
          return totalpause + (item.pauseDurationMs ?? 0);
        }, 0);

        setElapsed(Math.floor((Date.now() - startedAt - totalPause) / 1000));
      } else {
        setElapsed(Math.floor((Date.now() - startedAt) / 1000));
      }

      handlePlay();
    }
  }, [seance]);

  // ========== Gestion de setInterval et des pauses localement pour l'affichage,

  const handleStartChrono = (start: Date) => {
    setStateChrono(true);

    intervalRef.current = setInterval(() => {
      if (seanceGet?.startedAt) {
        const startedAt = new Date(seanceGet.startedAt).getTime();

        const totalPause = timerPausesLocal.current.reduce(
          (totalpause, item) => {
            return item.pauseDurationMs
              ? totalpause + Number(item.pauseDurationMs)
              : totalpause;
          },
          0,
        );

        setElapsed(
          Math.floor((Date.now() - startedAt - Number(totalPause)) / 1000),
        );
      } else {
        const startedAt = new Date(start).getTime();
        setElapsed(Math.floor((Date.now() - startedAt) / 1000));
      }
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

      if (safeData.success && seance) {
        try {
          const response = await patchSeance(safeData.data, seance.id);

          if (response.startedAt) {
            setSeanceGet(response);
            handleStartChrono(new Date(response.startedAt));
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

          if (response.endedAt) {
            setTimerPauseInProgress(null);

            timerPausesLocal.current = [...timerPausesLocal.current, response];

            handleStartChrono(new Date());
          }
        } catch (err) {
          console.error("Erreur du fetch api/seance", err);
          setErrorFetch(true);
        }
      }
    }
  };

  //========== Remise à zero du chronomètre et du startedAt de "seance" + suppression de l'ensemble des timerPause
  const handleStop = async () => {
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
        const responseTimerPause = await deleteTimerPause(seance.id);

        const responseSeance = await patchSeance(safePatch.data, seance.id);

        if (responseTimerPause && responseSeance) {
          setElapsed(0);
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
    if (intervalRef.current) clearInterval(intervalRef.current);
    setStateChrono(false);
    // setDisabledPause(true);

    const data = {
      pausedAt: new Date(),
      seanceId: seance.id,
    };

    const safeData = PausedChronoSchema.safeParse(data);

    if (safeData.success && seance) {
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

  return (
    <View>
      {loading && <Text>Chargement...</Text>}
      {errorFetch && <Text>Erreur de chargement</Text>}
      <View style={styles.containerChrono}>
        <ViewChrono second={elapsed} />
      </View>
      <View style={styles.containerBtnChrono}>
        <Pressable
          style={[
            styles.btnChrono,
            {
              backgroundColor: stateChrono
                ? "rgb(176, 171, 171)"
                : "rgb(70, 211, 10)",
            },
          ]}
          onPress={handlePlay}
          disabled={stateChrono}
        >
          <Text>Play</Text>
        </Pressable>
        <Pressable
          style={[
            styles.btnChrono,
            {
              backgroundColor: !stateChrono
                ? "rgb(176, 171, 171)"
                : "rgb(70, 211, 10)",
            },
          ]}
          onPress={handlePause}
          disabled={!stateChrono}
        >
          <Text>Pause</Text>
        </Pressable>
        <Pressable
          style={[
            styles.btnChrono,
            {
              backgroundColor: !stateChrono
                ? "rgb(176, 171, 171)"
                : "rgb(70, 211, 10)",
            },
          ]}
          disabled={!stateChrono}
          onPress={handleStop}
        >
          <Text>Stop</Text>
        </Pressable>
      </View>
    </View>
  );
}
