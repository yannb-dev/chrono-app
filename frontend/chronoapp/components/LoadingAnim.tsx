import { styles } from "@/lib/styles";

import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useEffect } from "react";

export default function LoadingAnim() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1000,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.containerSupLoading}>
      <Animated.View style={[styles.containerLoading, animatedStyle]}>
        <View style={styles.pointLoading}></View>
        <View style={styles.pointLoading}></View>
      </Animated.View>
    </View>
  );
}
