// React Native (Expo)
import { useForm, Controller, Field, FieldErrors } from "react-hook-form";
import { View, TextInput, Text, StyleSheet, Pressable } from "react-native";
import { styles } from "@/lib/styles";
import { zodResolver } from "@hookform/resolvers/zod";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";

import { postSeance } from "@/services/api";

import { FormSchema } from "@/lib/schema/formSchema";
import { useState } from "react";

export default function Form() {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errorForm, setErrorForm] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(FormSchema),
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
        setLoading(false);
        setErrorForm(false);
      }
    } catch (err) {
      console.error("Erreur du fetch depuis form", err);
      setError(true);
      setLoading(false);
    }
  };

  const onInvalid = (errors: FieldErrors<FormSchema>) => {
    console.log(errors);
    setErrorForm(true);
  };

  return (
    <View>
      {!loading ? (
        <View>
          <Controller
            control={control}
            name="totalRunner"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.inputRunner}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="0"
                defaultValue={value}
              />
            )}
          />
          {errors.totalRunner && <Text>{errors.totalRunner.message}</Text>}
          <Controller
            control={control}
            name="colorRunner"
            render={({ field: { onChange, value } }) => (
              <Picker
                style={styles.inputRunner}
                selectedValue={value}
                onValueChange={(itemValue) => onChange(itemValue)}
              >
                <Picker.Item label="Select" value={"null"} />
                <Picker.Item label="Bleu" value="rgb(39, 91, 245)" />
                <Picker.Item label="Rouge" value="rgb(245, 2, 55)" />
                <Picker.Item label="Vert" value="rgb(15, 184, 68)" />
                <Picker.Item label="Jaune" value="rgb(240, 245, 2)" />
              </Picker>
            )}
          />
          {errorForm && <Text>Erreur de valeur à la saisie</Text>}
          <Pressable
            style={({ pressed }) => [
              styles.btnSelect,
              pressed && styles.btnPressed,
            ]}
            onPress={handleSubmit(onSubmit, onInvalid)}
          >
            <Text>Créer</Text>
          </Pressable>
          {error && <Text>Erreur de soumission</Text>}
        </View>
      ) : (
        <View>
          <Text>Chargement ...</Text>
        </View>
      )}
    </View>
  );
}
