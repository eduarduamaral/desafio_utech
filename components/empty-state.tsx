import { StyleSheet, View } from "react-native";
import { ThemedText } from "./themed-text";
import { IconSymbol } from "./ui/icon-symbol";
import { useThemeColor } from "@/hooks/use-theme-color";

/**
 * Exibido quando a lista de pedidos está vazia após o carregamento.
 * Comunica ao usuário as duas formas de obter dados: ação manual
 * (pull-to-refresh) e automática (WebSocket em background).
 */
export function EmptyState() {
  // Reaproveita a cor de ícone do tema para manter consistência visual
  // sem hardcodar uma cor que não se adaptaria ao dark mode.
  const iconColor = useThemeColor({}, "icon");

  return (
    <View style={styles.container}>
      <IconSymbol name="doc.text" size={48} color={iconColor} />
      <ThemedText style={styles.title}>Nenhum pedido ainda</ThemedText>
      <ThemedText style={styles.subtitle}>
        Puxe para atualizar ou aguarde novos pedidos
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    // paddingVertical em vez de justifyContent: "center" sozinho para que
    // o conteúdo não fique colado ao topo quando a FlatList é pequena.
    paddingVertical: 80,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    opacity: 0.7,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.5,
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
