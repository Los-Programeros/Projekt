import { useUserStore } from "@/store/useUserStore";
import {
  CameraCapturedPicture,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Button, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";

export default function FaceLogin() {
  const { username, password } = useLocalSearchParams<{
    username: string;
    password: string;
  }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<any>(null);
  const router = useRouter();

  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  const captureAndVerify = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);

    try {
      const photo: CameraCapturedPicture =
        await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.3,
        });

      const imageBase64 = photo.base64;

      const loginRes = await fetch(`${apiUrl}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, image: imageBase64 }),
        credentials: "include",
      });

      if (!loginRes.ok) {
        const errText = await loginRes.text();
        throw new Error("Invalid credentials or face mismatch: " + errText);
      }

      const user = await loginRes.json();

      useUserStore.getState().setUser(user);

      Toast.show({
        type: "success",
        text1: "Login successful",
        text2: `Welcome back, ${user.username || "user"}!`,
      });

      router.replace("/profile");
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Login failed",
        text2: err.message,
      });
    } finally {
      setIsCapturing(false);
    }
  };

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="Grant permission" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={"front"}
        ref={cameraRef}
        enableTorch={false}
      >
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={captureAndVerify}>
            <Text style={styles.text}>Capture</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
  },
  button: {
    padding: 10,
    backgroundColor: "#00000080",
    borderRadius: 8,
  },
  text: {
    fontSize: 18,
    color: "white",
  },
});
