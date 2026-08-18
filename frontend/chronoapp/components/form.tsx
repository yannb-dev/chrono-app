// React Native (Expo)
import { useForm, Controller } from "react-hook-form";
import { View, TextInput, Text, StyleSheet, Pressable } from "react-native";
import { zodResolver } from "@hookform/resolvers/zod";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";

import { FormSchema } from "@/lib/schema/formSchema";

export default function Form() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(FormSchema),
  });

  const onSubmit = async (valueForm) => {
    console.log(valueForm);

    // try {
    //   const response = await fetch("/api/seance", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ valueForm }),
    //   });
    //   const data = await response.json();

    //   if (data.ok) {
    //     router.push({
    //       pathname: "/run/[id]",
    //       params: data.id,
    //     });
    //   }
    // } catch (err) {
    //   console.error("Erreur du fetch SEANCE", err);
    // }
  };

  return (
    <View style={styles.boxForm}>
      <Controller
        control={control}
        name="nbrRunner"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={styles.inputNumber}
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="ajouter le nombre de coureur"
            defaultValue={value}
          />
        )}
      />
      {errors.nbrRunner && <Text>{errors.nbrRunner.message}</Text>}
      <Controller
        control={control}
        name="color"
        render={({ field: { onChange, value } }) => (
          <Picker
            selectedValue={value}
            onValueChange={(itemValue) => onChange(itemValue)}
          >
            <Picker.Item label="Bleu" value="rgb(39, 91, 245)" />
            <Picker.Item label="Rouge" value="rgb(245, 2, 55)" />
            <Picker.Item label="Vert" value="rgb(15, 184, 68)" />
            <Picker.Item label="Jaune" value="rgb(240, 245, 2)" />
          </Picker>
        )}
      />
      <Pressable style={styles.buttonOnSubmit} onPress={handleSubmit(onSubmit)}>
        <Text>Créer</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  boxForm: {
    width: "60%",
  },

  inputNumber: {
    padding: 4,
    backgroundColor: "rgb(234,234,234)",
    borderRadius: 4,
    width: "100%",
  },

  selectColor: {
    padding: 4,
    backgroundColor: "rgb(234,234,234)",
    borderRadius: 4,
  },

  buttonOnSubmit: {
    padding: 4,
    backgroundColor: "rgb(234,234,234)",
    borderRadius: 4,
    width: "20%",
  },
});
