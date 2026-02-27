import { Platform } from "react-native";

/**
 * Em dispositivos Android físicos e no emulador, "localhost" aponta para
 * o próprio dispositivo, não para a máquina host. O endereço especial
 * 10.0.2.2 é um alias que o emulador AVD mapeia para 127.0.0.1 do host.
 * Em dispositivos físicos, substitua pelo IP local da máquina de desenvolvimento
 * (ex: "192.168.1.10").
 */
const LOCALHOST = Platform.select({
  android: "10.0.2.2",
  default: "localhost",
});

const PORT = 3001;

export const API_BASE_URL = `http://${LOCALHOST}:${PORT}`;
export const WS_URL = `ws://${LOCALHOST}:${PORT}`;
