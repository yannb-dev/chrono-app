import { View, Text } from "react-native";
import { styles } from "@/lib/styles";

type ViewChronoProps = { second: number };

export default function ViewChrono({ second }: ViewChronoProps) {
  const hh = Math.floor(second / 3600);
  const mm = Math.floor((second % 3600) / 60);
  const ss = Math.floor(second % 60);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <View>
      <Text
        style={styles.textChrono}
      >{`${pad(hh)}:${pad(mm)}:${pad(ss)}`}</Text>
    </View>
  );
}
