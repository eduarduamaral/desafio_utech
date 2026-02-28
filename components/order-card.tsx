import React from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";
import { Order } from "@/types/order";
import { useThemeColor } from "@/hooks/use-theme-color";

/**
 * Mapeamento de status para cores, com variantes de light e dark mode.
 * Manter as cores no nível do módulo (fora do componente) evita que o
 * objeto seja recriado a cada render — ele é uma constante imutável.
 */
const STATUS_STYLES: Record<
  Order["status"],
  { label: string; color: string; bgColor: string; darkColor: string; darkBgColor: string }
> = {
  pending: {
    label: "Pendente",
    color: "#B45309",
    bgColor: "#FEF3C7",
    darkColor: "#FBBF24",
    darkBgColor: "#78350F",
  },
  completed: {
    label: "Concluído",
    color: "#065F46",
    bgColor: "#D1FAE5",
    darkColor: "#34D399",
    darkBgColor: "#064E3B",
  },
  cancelled: {
    label: "Cancelado",
    color: "#991B1B",
    bgColor: "#FEE2E2",
    darkColor: "#F87171",
    darkBgColor: "#7F1D1D",
  },
};

interface Props {
  order: Order;
  /**
   * Recebido da tela pai (que já detectou o tema) para evitar que cada
   * card chame useColorScheme individualmente — um hook a menos por item
   * em listas longas.
   */
  isDark: boolean;
}

/**
 * Card de pedido envolvido em React.memo para evitar re-renders
 * desnecessários. A FlatList re-renderiza os itens quando seus dados
 * mudam; com memo, apenas o card cujo `order` mudou de referência
 * será re-renderizado, e não todos os cards da lista.
 */
export const OrderCard = React.memo(function OrderCard({ order, isDark }: Props) {
  const statusConfig = STATUS_STYLES[order.status];
  // Cor da borda obtida do tema para adaptar ao dark mode automaticamente.
  const borderColor = useThemeColor({}, "icon");

  const badgeBg = isDark ? statusConfig.darkBgColor : statusConfig.bgColor;
  const badgeText = isDark ? statusConfig.darkColor : statusConfig.color;

  return (
    // "30" concatenado ao hex da cor cria uma opacidade de ~19% na borda,
    // resultando em uma separação sutil entre os cards.
    <ThemedView style={[styles.card, { borderColor: borderColor + "30" }]}>
      <View style={styles.header}>
        <ThemedText style={styles.customer}>{order.customer}</ThemedText>
        <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
          <ThemedText style={[styles.statusText, { color: badgeText }]}>
            {statusConfig.label}
          </ThemedText>
        </View>
      </View>

      <View style={styles.footer}>
        <ThemedText style={styles.orderId}>#{order.id}</ThemedText>
        {/* toFixed(2) garante sempre duas casas decimais (ex: $42.00) */}
        <ThemedText style={styles.amount}>
          ${order.amount.toFixed(2)}
        </ThemedText>
      </View>
    </ThemedView>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    // shadowColor/shadowOpacity/shadowRadius funcionam no iOS;
    // elevation é o equivalente no Android.
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  customer: {
    fontSize: 16,
    fontWeight: "600",
    // flex: 1 faz o nome ocupar o espaço disponível e truncar com reticências
    // se for muito longo, em vez de empurrar o badge para fora da tela.
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderId: {
    fontSize: 13,
    opacity: 0.5,
  },
  amount: {
    fontSize: 18,
    fontWeight: "700",
  },
});
