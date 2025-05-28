import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import Toast, { BaseToast, ErrorToast } from "react-native-toast-message";

import TopBar from "@/components/TopBar";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { mqttInit } from "@/lib/mqttService";
import { useEffect } from "react";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    Figtree: require("../assets/fonts/Figtree-Regular.ttf"),
  });

  useEffect(() => {
    mqttInit((msg) => {
      console.log("Received MQTT message in HomeScreen:", msg);
    });
  }, []);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <TopBar />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
      <Toast
        position="bottom"
        config={{
          success: (props) => (
            <BaseToast
              {...props}
              style={{
                borderLeftColor: Colors.success,
                backgroundColor: "#1e293b",
              }}
              contentContainerStyle={{ paddingHorizontal: 15 }}
              text1Style={{
                fontSize: 16,
                fontWeight: "bold",
                color: "white",
              }}
              text2Style={{
                fontSize: 14,
                color: "white",
              }}
            />
          ),
          error: (props) => (
            <ErrorToast
              {...props}
              style={{
                borderLeftColor: Colors.error,
                backgroundColor: "#1e293b",
              }}
              text1Style={{
                fontSize: 16,
                fontWeight: "bold",
                color: "white",
              }}
              text2Style={{
                fontSize: 14,
                color: "white",
              }}
            />
          ),
        }}
      />
    </ThemeProvider>
  );
}
