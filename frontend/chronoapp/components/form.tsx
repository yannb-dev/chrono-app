// React Native (Expo)
import { useForm, Controller, FieldErrors } from "react-hook-form";
import { View, Text, Pressable, FlatList } from "react-native";
import { styles } from "@/lib/styles";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";

import { postSeance } from "@/services/api";

import { FormSchema } from "@/lib/schema/formSchema";
import { useState } from "react";
import LoadingAnim from "./LoadingAnim";

export default function Form() {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messageError, setMessageError] = useState("");

  const arrayColor = [
    "rgb(39, 91, 245)",
    "rgb(245, 2, 55)",
    "rgb(15, 184, 68)",
    "rgb(240, 245, 2)",
  ];

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: { totalRunner: 20, colorRunner: "" },
  });

  const onSubmit = async (valueForm: FormSchema) => {
    setLoading(true);

    try {
      const response = await postSeance({
        totalRunner: valueForm.totalRunner,
        colorRunner: valueForm.colorRunner,
      });

      if (response) {
        router.push(`/run/${response.id}`);
      }
    } catch (err) {
      console.error("Erreur du fetch depuis form", err);
      setLoading(false);
      setMessageError(
        "Oups une erreur c'est produite lors de l'enregistrement",
      );
      setError(true);
    }
  };

  const onInvalid = (errors: FieldErrors<FormSchema>) => {
    console.log(errors);
    setMessageError(
      "Oups ! Une erreur c'est produite à la soumission du formulaire",
    );
    setError(true);
  };

  const handleRemoveMessageError = () => {
    setError(false);
    setMessageError("");
  };

  if (error)
    return (
      <View style={styles.containerError}>
        <Text style={styles.text}>{messageError}</Text>
        <Pressable style={styles.btnSelect} onPress={handleRemoveMessageError}>
          <Text style={styles.text}>Réessayer</Text>
        </Pressable>
      </View>
    );

  return (
    <View>
      {!loading ? (
        <View style={styles.containerSupForm}>
          <View style={styles.containerForm}>
            <View>
              <Controller
                control={control}
                name="totalRunner"
                render={({ field: { onChange, value } }) => (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 40,
                    }}
                  >
                    <Pressable
                      onPress={() =>
                        onChange(Math.max(1, Math.min(40, value - 1)))
                      }
                    >
                      <Text style={styles.btnChangeTotalRunner}>−</Text>
                    </Pressable>
                    <Text style={styles.textTotalRunner}>{value}</Text>
                    <Pressable
                      onPress={() =>
                        onChange(Math.max(1, Math.min(40, value + 1)))
                      }
                    >
                      <Text style={styles.btnChangeTotalRunner}>+</Text>
                    </Pressable>
                  </View>
                )}
              />
              {errors.totalRunner && (
                <Text
                  style={{
                    fontFamily: "Orbitron-Regular",
                    color: "rgb(240,76,139)",
                    fontWeight: 400,
                  }}
                >
                  {errors.totalRunner.message}
                </Text>
              )}
            </View>
            <View>
              <Controller
                control={control}
                name="colorRunner"
                render={({ field: { onChange, value } }) => (
                  <FlatList
                    data={arrayColor}
                    horizontal
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                      <Pressable
                        onPress={() => onChange(item)}
                        style={() => [
                          styles.selectColor,
                          {
                            backgroundColor: item,
                            borderWidth: value === item ? 3 : 0,
                          },
                        ]}
                      />
                    )}
                  />
                )}
              />
              {errors.colorRunner && (
                <Text
                  style={{
                    fontFamily: "Orbitron-Regular",
                    color: "rgb(240,76,139)",
                    fontWeight: 400,
                  }}
                >
                  {errors.colorRunner.message}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.containerValidForm}>
            <Pressable
              style={({ pressed }) => [
                styles.btnSelect,
                pressed && styles.btnPressed,
              ]}
              onPress={handleSubmit(onSubmit, onInvalid)}
            >
              <Text style={styles.text}>Créer</Text>
            </Pressable>
            {error && <Text>Erreur de soumission</Text>}
          </View>
        </View>
      ) : (
        <LoadingAnim />
      )}
    </View>
  );
}
