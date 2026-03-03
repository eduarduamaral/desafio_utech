import { ThemedText } from "@/components/themed-text";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

type Props = {
  visible: boolean;
};

const BANNER_HEIGHT = 40;

export function OfflineBanner({ visible }: Props) {
  const maxHeight = useSharedValue(0);

  useEffect(() => {
    maxHeight.value = withTiming(visible ? BANNER_HEIGHT : 0, {
      duration: 250,
    });
  }, [visible, maxHeight]);

  const animatedStyle = useAnimatedStyle(() => ({
    maxHeight: maxHeight.value,
    overflow: "hidden",
  }));

  return (
    <Animated.View style={animatedStyle}>
      <View style={styles.content}>
        <ThemedText style={styles.text}>Sem conexão com a internet</ThemedText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  content: {
    backgroundColor: "#B00020",
    height: BANNER_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
});
