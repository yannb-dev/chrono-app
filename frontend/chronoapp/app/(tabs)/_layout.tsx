import { Tabs } from "expo-router";
import React from "react";

export default function TabLayout() {
  // <Tabs> = permet de créer une navbar
  // Tabs.screen assure le lien entre le btn du navbar et la page via name="accueil" et le nom de fichier accueil.tsx
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
        }}
      />
    </Tabs>
  );
}
