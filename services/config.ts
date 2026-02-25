import { Platform } from "react-native";

const LOCALHOST = Platform.select({
  android: "10.0.2.2",
  default: "localhost",
});

const PORT = 3001;

export const API_BASE_URL = `http://${LOCALHOST}:${PORT}`;
export const WS_URL = `ws://${LOCALHOST}:${PORT}`;
