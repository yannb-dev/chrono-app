import { View, Text, Pressable } from "react-native";
import { styles } from "@/lib/styles";
import { router } from "expo-router";
import * as Sentry from "@sentry/react-native";

import { IconSymbol } from "@/components/ui/IconSymbol";

import SvgComponent from "@/components/LogoApp";

import { useAuth } from "@/context/AuthContext";

export default function HomeScreen() {
  const { logout } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.containerLogout}>
        <Pressable onPress={logout}>
          <IconSymbol size={30} name={"door.french.open"} />
        </Pressable>
      </View>
      <View style={styles.containerLogoIndex}>
        <SvgComponent />
      </View>
      <View style={styles.containerBtnNew}>
        <Pressable
          style={({ pressed }) => [
            styles.btnSelect,
            pressed && styles.btnPressed,
          ]}
          onPress={() =>
            router.push({
              pathname: "/formSeance/page",
            })
          }
        >
          <Text style={styles.text}>New</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            Sentry.captureException(new Error("First error"));
          }}
        >
          <Text>Test Senty</Text>
        </Pressable>
      </View>
    </View>
  );
}
