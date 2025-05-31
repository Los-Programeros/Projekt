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
import { Positions } from "@/constants/Positions";
import { Button } from "@react-navigation/elements";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import Toast from "react-native-toast-message";

export function AuthForm() {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  const toastPosition: any = Positions.toastPosition;
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const onLogin = () => {
    if (!username || !password) {
      Toast.show({
        type: "error",
        text1: "Enter username and password",
        position: toastPosition,
      });
      return;
    }

    router.push({
      pathname: "/face-login",
      params: { username, password },
    });
  };

  const onRegister = () => {
    if (!username || !email || !password || !confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Please fill all fields",
        position: toastPosition,
      });
      return;
    }

    router.push({
      pathname: "/face-register",
      params: { username, email, password },
    });
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

              {mode === "register" && (
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
              )}

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

          {/* <ThemedView
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginVertical: 16,
              backgroundColor: "transparent",
            }}
          >
            <ThemedView
              style={{ flex: 1, height: 1, backgroundColor: Colors.white }}
            />

            <ThemedText
              style={{
                marginHorizontal: 8,
                color: Colors.white,
                backgroundColor: "transparent",
              }}
            >
              Or login with Face IDe
            </ThemedText>

            <ThemedView
              style={{ flex: 1, height: 1, backgroundColor: Colors.white }}
            />
          </ThemedView> */}

          {/* <Button
            variant="filled"
            color={Colors.primary}
            style={{ borderRadius: 16, paddingVertical: 16 }}
            onPress={onLoginWithFaceId}
          >
            Login with Face ID
          </Button> */}
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
