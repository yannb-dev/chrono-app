import { useState } from "react";
import { View, TextInput, Text, Pressable } from "react-native";
import { styles } from "@/lib/styles";
import { useAuth } from "@/context/AuthContext";
import { Stack } from "expo-router";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { router } from "expo-router";

import { postLogin } from "@/services/api";

import { LoginSchema } from "@/lib/schema/formLogin";

import { HttpError, NetworkError, extractErrorMessage } from "@/lib/errors";

import SvgComponent from "@/components/LogoApp";
import LoadingAnim from "@/components/LoadingAnim";

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [detailError, setDetailError] = useState("");

  const { login } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (valueForm: LoginSchema) => {
    setLoading(true);

    try {
      const response = await postLogin(valueForm);

      await login(response.token);

      router.push("/(tabs)");
    } catch (err) {
      if (err instanceof HttpError) {
        if (err.status === 429) {
          setDetailError(extractErrorMessage(err.body));
        } else {
          setDetailError(extractErrorMessage(err.body));
        }
      } else if (err instanceof NetworkError) {
        setDetailError(err.message);
      } else {
        console.error("Erreur du fetch API/LOGIN", err);
        setDetailError("Une erreur inattendue est survenue");
      }

      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (error)
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <View style={styles.containerError}>
          <Text style={styles.text}>Oups, une erreur !</Text>
          <Text style={styles.text}>{detailError}</Text>
          <Pressable style={styles.btnSelect} onPress={() => setError(false)}>
            <Text style={styles.text}>Réessayer</Text>
          </Pressable>
        </View>
      </View>
    );

  return (
    <View>
      <Stack.Screen options={{ headerShown: false }} />

      {!loading ? (
        <View style={styles.container}>
          <View style={styles.containerLogo}>
            <SvgComponent />
          </View>
          <View style={styles.containerInput}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur } }) => (
                <TextInput
                  placeholder="Email"
                  placeholderTextColor="#575656"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  style={styles.inputEmailLogin}
                />
              )}
            />
            {errors.email && (
              <Text style={[styles.text, { marginBottom: 30, color: "gray" }]}>
                {errors.email.message}
              </Text>
            )}
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur } }) => (
                <TextInput
                  placeholder="Mot de passe"
                  placeholderTextColor="#575656"
                  secureTextEntry
                  onBlur={onBlur}
                  onChangeText={onChange}
                  style={styles.inputEmailLogin}
                />
              )}
            />
            {errors.password && (
              <Text style={[styles.text, { marginBottom: 30, color: "gray" }]}>
                {errors.password.message}
              </Text>
            )}

            <Pressable
              style={({ pressed }) => [
                pressed && { transform: [{ scale: 1.2 }] },
              ]}
              onPress={() => router.push("/(auth)/register")}
            >
              <Text style={[styles.text, { marginTop: 30 }]}>S'inscrire</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                pressed && { transform: [{ scale: 1.2 }] },
              ]}
              onPress={() => router.push("/(auth)/passwordReset")}
            >
              <Text style={[styles.text, { marginTop: 20, fontSize: 10 }]}>
                Mot de passe oublié
              </Text>
            </Pressable>
          </View>
          <View style={styles.containerBtnLogin}>
            <Pressable
              style={({ pressed }) => [
                styles.btnSelect,
                pressed && styles.btnPressed,
              ]}
              onPress={handleSubmit(onSubmit)}
            >
              <Text style={styles.text}>Se connecter</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.container}>
          <LoadingAnim />
        </View>
      )}
    </View>
  );
}
