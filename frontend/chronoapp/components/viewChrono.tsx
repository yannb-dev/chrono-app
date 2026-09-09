import { View, Text } from "react-native";
import { styles } from "@/lib/styles";

type ViewChronoProps = { second: number; size: number };

export default function ViewChrono({ second, size }: ViewChronoProps) {
  const hh = Math.floor(second / 3600);
  const mm = Math.floor((second % 3600) / 60);
  const ss = Math.floor(second % 60);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <View>
      <Text
        style={[styles.textChrono, { fontSize: size }]}
      >{`${pad(hh)}:${pad(mm)}:${pad(ss)}`}</Text>
    </View>
  );
}
