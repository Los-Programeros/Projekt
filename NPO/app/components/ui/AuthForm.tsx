import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useUserStore } from "@/store/useUserStore";
import { Button } from "@react-navigation/elements";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import Toast from "react-native-toast-message";

export function AuthForm() {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  const toastPosition = Platform.OS === "ios" ? "top" : "bottom";
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const onLogin = async () => {
    if (!username || !password) {
      Toast.show({
        type: "error",
        text1: "Enter username and password",
        position: toastPosition,
      });
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Invalid username or password");
      }

      const user = await response.json();

      useUserStore.getState().setUser(user);

      Toast.show({
        type: "success",
        text1: "Login successful! Hello!",
        position: toastPosition,
      });

      router.replace("/profile");
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Login failed",
        text2: err.message || "An error occurred",
        position: toastPosition,
      });
    }
  };

  const onRegister = async () => {
    if (password !== confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Passwords do not match",
        position: toastPosition,
      });
      return;
    } else if (!username || !email || !password) {
      Toast.show({
        type: "error",
        text1: "Enter all fields",
        position: toastPosition,
      });
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Registration failed");
      }

      useUserStore.getState().setUser(responseData);

      Toast.show({
        type: "success",
        text1: "Registered successfully!",
        text2: responseData.message || "Welcome!",
        position: toastPosition,
      });
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Registration failed",
        text2: err.message || "An error occurred, please try again.",
        position: toastPosition,
      });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        <LinearGradient
          colors={["#151718", "#004E89"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <ThemedView style={styles.loginRegisterContainer}>
          <ThemedText
            type="title"
            style={{
              textAlign: "center",
              fontSize: 64,
              height: 64,
              paddingTop: 8,
            }}
          >
            {mode === "login" ? "Login" : "Register"}
          </ThemedText>
          <ThemedView style={styles.formContainer}>
            <ThemedView style={styles.formContainer_inputs}>
              <ThemedView style={styles.formContainer_inputs_inputGroup}>
                <ThemedText type="defaultSemiBold">Username</ThemedText>
                <TextInput
                  placeholder="Username"
                  value={username}
                  onChangeText={setUsername}
                  style={styles.mainInput}
                  autoCapitalize="none"
                  keyboardAppearance="light"
                />
              </ThemedView>

              <ThemedView style={styles.formContainer_inputs_inputGroup}>
                <ThemedText type="defaultSemiBold">Email</ThemedText>
                <TextInput
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  style={styles.mainInput}
                  autoCapitalize="none"
                  keyboardAppearance="light"
                  keyboardType="email-address"
                />
              </ThemedView>

              <ThemedView style={styles.formContainer_inputs_inputGroup}>
                <ThemedText type="defaultSemiBold">Password</ThemedText>
                <TextInput
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  style={styles.mainInput}
                />
              </ThemedView>

              {mode === "register" && (
                <ThemedView style={styles.formContainer_inputs_inputGroup}>
                  <ThemedText type="defaultSemiBold">
                    Repeat Password
                  </ThemedText>
                  <TextInput
                    placeholder="Repeat Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    style={styles.mainInput}
                  />
                </ThemedView>
              )}
            </ThemedView>

            <Button
              variant="filled"
              color={Colors.primary}
              style={{ borderRadius: 16, paddingVertical: 16 }}
              onPress={mode === "login" ? onLogin : onRegister}
            >
              {mode === "login" ? "Login" : "Register"}
            </Button>
          </ThemedView>
          <ThemedText
            style={{
              textAlign: "center",
              color: "white",
            }}
            type="defaultSemiBold"
            onPress={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <ThemedText style={{ color: Colors.primary }}>
                  Register
                </ThemedText>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <ThemedText style={{ color: Colors.primary }}>Login</ThemedText>
              </>
            )}
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  loginRegisterContainer: {
    width: "100%",
    backgroundColor: "transparent",
    gap: 32,
  },
  formContainer: {
    width: "100%",
    justifyContent: "center",
    gap: 32,
    backgroundColor: "transparent",
  },
  formContainer_inputs: {
    gap: 16,
    backgroundColor: "transparent",
  },
  formContainer_inputs_inputGroup: {
    gap: 4,
    backgroundColor: "transparent",
  },
  mainInput: {
    backgroundColor: Colors.white,
    borderColor: Colors.primary,
    color: Colors.light.text,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    width: "100%",
  },
});
