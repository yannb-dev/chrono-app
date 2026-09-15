import { View, Text, Pressable, FlatList } from "react-native";
import { styles } from "@/lib/styles";

import { router } from "expo-router";

import { getSeance } from "@/services/api";
import { deleteManySeance } from "@/services/api";

import { HttpError, NetworkError, extractErrorMessage } from "@/lib/errors";

import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import { SeanceResponse } from "@/types/api";

import { IconSymbol } from "@/components/ui/IconSymbol";
import SvgComponent from "@/components/LogoApp";
import LoadingAnim from "@/components/LoadingAnim";

import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function DetailScreen() {
  const [list, setList] = useState<SeanceResponse[]>([]);
  const [error, setError] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [loading, setLoading] = useState(true);

  const initListPage = () => {
    let cancelled = false;

    async function fetchSeance() {
      try {
        const data = await getSeance();

        if (!cancelled) setList(data);
      } catch (err) {
        if (err instanceof HttpError) {
          setDetailError(extractErrorMessage(err.body));
        } else if (err instanceof NetworkError) {
          setDetailError(err.message);
        } else {
          console.error("Erreur du fetch API/REGISTER", err);
          setDetailError("Une erreur inattendue est survenue");
        }
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

  useFocusEffect(
    useCallback(() => {
      initListPage();
    }, []),
  );

  const handleCloseError = () => {
    setError(false);
    setLoading(true);
    initListPage();
  };

  if (error)
    return (
      <View>
        <View>
          <Text style={styles.text}>Oups une erreur !</Text>
          <Text style={styles.text}>{detailError}</Text>
          <Pressable onPress={handleCloseError}>
            <Text style={styles.btnSelect}>Réessayer</Text>
          </Pressable>
        </View>
      </View>
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
      if (err instanceof HttpError) {
        setDetailError(extractErrorMessage(err.body));
      } else if (err instanceof NetworkError) {
        setDetailError(err.message);
      } else {
        console.error("Erreur du fetch API/REGISTER", err);
        setDetailError("Une erreur inattendue est survenue");
      }
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <LoadingAnim />
      ) : (
        <View>
          <View style={styles.containerLogoDelete}>
            <View style={styles.containerLogoList}>
              <SvgComponent />
            </View>
            <View style={styles.containerDeleteList}>
              <Pressable testID="delete-seance" onPress={handleDelete}>
                <IconSymbol name={"delete.forward"} />
              </Pressable>
            </View>
          </View>
          <View>
            <View style={styles.containerListResult}>
              {list && (
                <FlatList
                  data={list}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <View style={{ width: "100%", alignItems: "center" }}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.containerListRun,
                          pressed && styles.btnPressed,
                        ]}
                        onPress={() => handleRedirectSeance(item)}
                      >
                        <View style={styles.containerListDate}>
                          <Text style={styles.text}>
                            {format(item.createdAt, "dd/MM/yyyy", {
                              locale: fr,
                            })}
                          </Text>
                        </View>
                        <View style={styles.containerListState}>
                          <View
                            style={[
                              styles.colorRun,
                              { backgroundColor: item.colorRunner },
                            ]}
                          ></View>
                          <View style={styles.stateResult}>
                            <View
                              style={[
                                styles.pointColorState,
                                {
                                  backgroundColor:
                                    item.state === "Finish" ? "green" : "red",
                                },
                              ]}
                            ></View>
                            <Text style={styles.text}>{item.state}</Text>
                          </View>
                        </View>
                      </Pressable>
                    </View>
                  )}
                />
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
