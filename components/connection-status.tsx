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

/**
 * Paleta de cores para cada estado da conexão, com variantes light/dark.
 * Verde = estável, amarelo = atenção, vermelho = problema.
 * Definido fora do componente para não ser recriado a cada render.
 */
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

  /**
   * useSharedValue do Reanimated roda no thread de UI (não no JS thread),
   * garantindo animações suaves mesmo com o JS thread ocupado processando
   * eventos do WebSocket ou atualizações de estado.
   */
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    if (status === "reconnecting") {
      // withRepeat(-1, true): -1 = infinito, true = reversa (vai e volta)
      // Cria o efeito de pulsação: opacidade oscila entre 1 e 0.3.
      pulseOpacity.value = withRepeat(
        withTiming(0.3, { duration: 800 }),
        -1,
        true
      );
    } else {
      // Cancela a animação em loop antes de transicionar para o valor final,
      // evitando que a animação anterior interfira na nova transição.
      cancelAnimation(pulseOpacity);
      pulseOpacity.value = withTiming(1, { duration: 200 });
    }
  }, [status, pulseOpacity]);

  /**
   * useAnimatedStyle cria um estilo que é atualizado diretamente no thread
   * de UI toda vez que pulseOpacity muda, sem passar pelo React.
   */
  const dotStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const bgColor = isDark ? config.darkBgColor : config.bgColor;
  const textColor = isDark ? config.darkColor : config.color;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Animated.View é necessário para aplicar estilos animados —
          View comum não aceita valores do Reanimated. */}
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
