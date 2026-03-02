import React from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";
import { Order } from "@/types/order";
import { useThemeColor } from "@/hooks/use-theme-color";

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
  isDark: boolean;
}

export const OrderCard = React.memo(function OrderCard({ order, isDark }: Props) {
  const statusConfig = STATUS_STYLES[order.status];
  const borderColor = useThemeColor({}, "icon");

  const badgeBg = isDark ? statusConfig.darkBgColor : statusConfig.bgColor;
  const badgeText = isDark ? statusConfig.darkColor : statusConfig.color;

  return (
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
