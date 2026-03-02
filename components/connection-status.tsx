import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
} from "react-native-reanimated";
import { ThemedText } from "./themed-text";
import { ConnectionStatus as ConnectionStatusType } from "@/types/order";

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  darkColor: string;
  darkBgColor: string;
}

const STATUS_CONFIG: Record<ConnectionStatusType, StatusConfig> = {
  connected: {
    label: "Conectado",
    color: "#065F46",
    bgColor: "#D1FAE5",
    darkColor: "#34D399",
    darkBgColor: "#064E3B",
  },
  reconnecting: {
    label: "Reconectando...",
    color: "#92400E",
    bgColor: "#FEF3C7",
    darkColor: "#FBBF24",
    darkBgColor: "#78350F",
  },
  disconnected: {
    label: "Desconectado",
    color: "#991B1B",
    bgColor: "#FEE2E2",
    darkColor: "#F87171",
    darkBgColor: "#7F1D1D",
  },
};

interface Props {
  status: ConnectionStatusType;
  isDark: boolean;
}

export function ConnectionStatusBadge({ status, isDark }: Props) {
  const config = STATUS_CONFIG[status];
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    if (status === "reconnecting") {
      pulseOpacity.value = withRepeat(
        withTiming(0.3, { duration: 800 }),
        -1,
        true
      );
    } else {
      cancelAnimation(pulseOpacity);
      pulseOpacity.value = withTiming(1, { duration: 200 });
    }
  }, [status, pulseOpacity]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const bgColor = isDark ? config.darkBgColor : config.bgColor;
  const textColor = isDark ? config.darkColor : config.color;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Animated.View
        style={[styles.dot, { backgroundColor: textColor }, dotStyle]}
      />
      <ThemedText style={[styles.text, { color: textColor }]}>
        {config.label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontSize: 13,
    fontWeight: "600",
  },
});
