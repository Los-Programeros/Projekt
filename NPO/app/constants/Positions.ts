import { Platform } from "react-native";

export const Positions = {
  toastPosition: Platform.OS === "ios" ? "bottom" : "bottom",
};
