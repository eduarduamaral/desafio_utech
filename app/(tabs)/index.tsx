import { useCallback, useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ConnectionStatusBadge } from "@/components/connection-status";
import { EmptyState } from "@/components/empty-state";
import { OrderCard } from "@/components/order-card";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useOrders } from "@/hooks/use-orders";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Order } from "@/types/order";

export default function OrdersScreen() {
  const {
    orders,
    isLoading,
    isRefreshing,
    error,
    connectionStatus,
    loadOrders,
    onRefresh,
  } = useOrders();

  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, "tint");
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const sortedOrders = useMemo(() => {
    const active = orders.filter((o) => o.status !== "cancelled");
    const cancelled = orders.filter((o) => o.status === "cancelled");
    return [...active, ...cancelled];
  }, [orders]);

  const renderItem = useCallback(
    ({ item }: { item: Order }) => <OrderCard order={item} isDark={isDark} />,
    [isDark],
  );

  const keyExtractor = useCallback((item: Order) => item.id, []);

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={tintColor} />
        <ThemedText style={styles.loadingText}>
          Carregando pedidos...
        </ThemedText>
      </ThemedView>
    );
  }

  if (error && orders.length === 0) {
    return (
      <ThemedView style={[styles.centered, { paddingTop: insets.top }]}>
        <ThemedText style={styles.errorTitle}>Algo deu errado...</ThemedText>
        <ThemedText style={styles.errorMessage}>{error}</ThemedText>
        <Pressable
          style={[styles.retryButton, { backgroundColor: tintColor }]}
          onPress={loadOrders}
        >
          <ThemedText style={styles.retryText}>Tentar novamente</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <ThemedText type="title" style={styles.title}>
          Pedidos
        </ThemedText>
        <ConnectionStatusBadge status={connectionStatus} isDark={isDark} />
      </View>

      {error && (
        <View style={[styles.errorBanner, isDark && styles.errorBannerDark]}>
          <ThemedText
            style={[
              styles.errorBannerText,
              isDark && styles.errorBannerTextDark,
            ]}
          >
            Atualização falhou. Puxe para recarregar.
          </ThemedText>
        </View>
      )}

      <FlatList
        data={sortedOrders}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.list}
        refreshing={isRefreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={EmptyState}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          orders.length > 0 ? (
            <ThemedText style={styles.countText}>
              {orders.length} pedido{orders.length !== 1 ? "s" : ""}
            </ThemedText>
          ) : null
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
  },
  countText: {
    fontSize: 13,
    opacity: 0.5,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  list: {
    paddingBottom: 24,
  },
  loadingText: {
    fontSize: 15,
    opacity: 0.6,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  errorMessage: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  errorBanner: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  errorBannerDark: {
    backgroundColor: "#7F1D1D",
  },
  errorBannerText: {
    color: "#991B1B",
    fontSize: 13,
    textAlign: "center",
  },
  errorBannerTextDark: {
    color: "#F87171",
  },
});
