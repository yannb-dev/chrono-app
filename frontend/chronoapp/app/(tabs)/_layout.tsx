import { Tabs } from "expo-router";
import { IconSymbol } from "@/components/ui/IconSymbol";

export default function TabLayout() {
  // <Tabs> = permet de créer une navbar
  // Tabs.screen assure le lien entre le btn du navbar et la page via name="accueil" et le nom de fichier accueil.tsx
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#eb2550",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarShowLabel: false,
        tabBarStyle: { height: 90 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: () => <IconSymbol size={28} name={"house.fill"} />,
        }}
      />
      <Tabs.Screen
        name="list"
        options={{
          title: "Liste",
          tabBarIcon: () => <IconSymbol size={28} name={"paperplane.fill"} />,
        }}
      />
    </Tabs>
  );
}
