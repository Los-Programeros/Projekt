import { useUserStore } from "@/store/useUserStore";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Button,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function FaceRegister() {
  const { username, email, password } = useLocalSearchParams<{
    username: string;
    email: string;
    password: string;
  }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<any>(null);
  const router = useRouter();
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  const toastPosition = Platform.OS === "ios" ? "top" : "bottom";

  const directions = ["straight", "right", "up", "left", "down"];
  const [currentStep, setCurrentStep] = useState(0);
  const [images, setImages] = useState<string[]>([]);

  const captureAndRegister = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.3,
      });

      if (!photo.base64) throw new Error("Failed to capture image.");

      setImages((prev) => [...prev, photo.base64]);

      Toast.show({
        type: "success",
        text1: `Captured: ${directions[currentStep]}`,
        position: toastPosition,
      });

      if (currentStep < directions.length - 1) {
        setCurrentStep((prev) => prev + 1);
      } else {
        const response = await fetch(`${apiUrl}/users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            email,
            password,
            images,
          }),
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

        router.replace("/profile");
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err.message || "Something went wrong.",
        position: toastPosition,
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
        <View style={styles.directionContainer}>
          <Text style={styles.directionText}>
            Please look {directions[currentStep]}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={captureAndRegister}>
            <Text style={styles.text}>
              {currentStep < directions.length - 1 ? "Capture" : "Finish"}
            </Text>
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
  directionContainer: {
    position: "absolute",
    top: 40,
    width: "100%",
    alignItems: "center",
  },
  directionText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
    backgroundColor: "#00000080",
    padding: 10,
    borderRadius: 8,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
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
