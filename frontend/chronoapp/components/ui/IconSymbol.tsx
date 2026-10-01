import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import React from "react";
import { OpaqueColorValue, StyleProp, TextStyle } from "react-native";

type SFSymbolName = Extract<SymbolViewProps["name"], string>;
type MaterialIconName = React.ComponentProps<typeof MaterialIcons>["name"];

const MAPPING = {
  "list.bullet.circle.fill": "format-list-bulleted",
  "house.fill": "home",
  "door.french.open": "logout",
  "repeat.circle.fill": "replay",
  "play.fill": "play-arrow",
  "pause.fill": "pause",
  "delete.forward": "delete",
  "person.crop.circle": "account-circle",
} satisfies Partial<Record<SFSymbolName, MaterialIconName>>;

export type IconSymbolName = keyof typeof MAPPING;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color?: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name]}
      style={[{ textAlign: "center" }, style]}
    />
  );
}
