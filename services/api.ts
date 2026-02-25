import { Order } from "@/types/order";
import { API_BASE_URL } from "./config";

export async function fetchOrders(): Promise<Order[]> {
  const response = await fetch(`${API_BASE_URL}/orders`);

  if (!response.ok) {
    throw new Error(`Failed to fetch orders: ${response.status}`);
  }

  return response.json();
}
