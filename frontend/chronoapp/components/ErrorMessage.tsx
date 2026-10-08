import { View, Text } from "react-native";
import { styles } from "@/lib/styles";
import { IconSymbol } from "./ui/IconSymbol";

type props = {
  detailSend: string;
};

export default function ErrorMessage(detailSend: props) {
  return (
    <View style={{ width: "100%", alignItems: "center" }}>
      <Text style={[styles.text, { marginBottom: 10 }]}>Oups...</Text>
      <IconSymbol name={"warninglight.fill"} />
      <Text style={[styles.text, { marginTop: 10, fontSize: 10 }]}>
        {detailSend.detailSend}
      </Text>
    </View>
  );
}
