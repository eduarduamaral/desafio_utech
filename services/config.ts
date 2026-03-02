import { Platform } from "react-native";

// No Android emulator, localhost aponta para o próprio dispositivo.
// 10.0.2.2 é o alias do host no AVD.
// Em dispositivo físico, trocar pelo IP da máquina.
const LOCALHOST = Platform.select({
  android: "10.0.2.2",
  default: "localhost",
});

const PORT = 3001;

export const API_BASE_URL = `http://${LOCALHOST}:${PORT}`;
export const WS_URL = `ws://${LOCALHOST}:${PORT}`;
