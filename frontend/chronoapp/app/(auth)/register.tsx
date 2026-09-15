import { View, TextInput, Pressable, Text } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { Stack } from "expo-router";

import { postRegister } from "@/services/api";

import { HttpError, NetworkError, extractErrorMessage } from "@/lib/errors";

import { RegisterSchema } from "@/lib/schema/formRegister";

import { styles } from "@/lib/styles";

import SvgComponent from "@/components/LogoApp";
import LoadingAnim from "@/components/LoadingAnim";

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [messageConfirm, setMessageConfirm] = useState(false);
  const [error, setError] = useState(false);
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    if (!messageConfirm) return;
    const timeoutId = setTimeout(() => {
      router.push("/(auth)/login");
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [messageConfirm]);

  if (messageConfirm) {
    return (
      <View style={styles.containerSupRegister}>
        <Text style={styles.text}>Inscription validée !</Text>
      </View>
    );
  }

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(RegisterSchema),
  });

  const onSubmit = async (valueForm: RegisterSchema) => {
    setLoading(true);

    //----------------------
    try {
      await postRegister(valueForm);

      setMessageConfirm(true);
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

  if (error)
    return (
      <View style={styles.container}>
        <View style={styles.containerError}>
          <Text style={styles.text}>Oups, une erreur !</Text>
          <Text>{detailError}</Text>
          <Pressable onPress={() => setError(false)}>
            <Text style={styles.text}>Réessayer</Text>
          </Pressable>
        </View>
      </View>
    );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {loading ? (
        <LoadingAnim />
      ) : (
        <View style={styles.containerSupRegister}>
          <SvgComponent />
          <View style={styles.containerInput}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur } }) => (
                <TextInput
                  placeholder="Email"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  style={styles.inputEmailLogin}
                />
              )}
            />
            {errors.email && (
              <Text style={[styles.text, { marginBottom: 30, color: "gray" }]}>
                {errors.email?.message}
              </Text>
            )}
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur } }) => (
                <TextInput
                  placeholder="Mot de passe"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  secureTextEntry
                  style={styles.inputEmailLogin}
                />
              )}
            />
            {errors.password && (
              <Text style={[styles.text, { marginBottom: 30, color: "gray" }]}>
                {errors.password.message}
              </Text>
            )}
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur } }) => (
                <TextInput
                  placeholder="Confirmer le mot de passe"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  secureTextEntry
                  style={styles.inputEmailLogin}
                />
              )}
            />
            {errors.confirmPassword && (
              <Text style={[styles.text, { marginBottom: 30, color: "gray" }]}>
                {errors.confirmPassword.message}
              </Text>
            )}
          </View>
          <View style={styles.containerBtnLogin}>
            <Pressable
              style={({ pressed }) => [
                styles.btnSelect,
                pressed && styles.btnPressed,
              ]}
              onPress={handleSubmit(onSubmit)}
            >
              <Text style={styles.text}>S'inscrire</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
