import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";

export default function TabLayout() {
  // <Tabs> = permet de créer une navbar
  // Tabs.screen assure le lien entre le btn du navbar et la page via name="accueil" et le nom de fichier accueil.tsx
  return View;
  // <Tabs
  //   screenOptions={{
  //     tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
  //     headerShown: false,
  //     tabBarButton: HapticTab,
  //   }}
  // >
  //   <Tabs.Screen
  //     name="index"
  //     options={{
  //       title: "Home",
  //       tabBarIcon: ({ color }) => (
  //         <IconSymbol size={14} name="house.fill" color={color} />
  //       ),
  //     }}
  //   />
  // </Tabs>
}
