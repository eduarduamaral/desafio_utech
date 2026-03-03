import AsyncStorage from "@react-native-async-storage/async-storage";
import { Order } from "@/types/order";

const ORDERS_CACHE_KEY = "@orders_cache";

export async function loadOrdersCache(): Promise<Order[] | null> {
  try {
    const raw = await AsyncStorage.getItem(ORDERS_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Order[];
  } catch {
    return null;
  }
}

export async function saveOrdersCache(orders: Order[]): Promise<void> {
  try {
    await AsyncStorage.setItem(ORDERS_CACHE_KEY, JSON.stringify(orders));
  } catch {
    // Falha silenciosa — cache é best-effort, não crítico
  }
}
