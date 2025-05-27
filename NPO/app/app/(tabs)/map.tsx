import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { mqttInit, sendMessage } from "@/lib/mqttService";
import { useUserStore } from "@/store/useUserStore";
import { Landmark, MqttMessage } from "@/types";
import * as Location from "expo-location";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

export default function MapScreen() {
  const { landmark } = useLocalSearchParams<{ landmark: string }>();
  const [dest, setDest] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loc, setLoc] = useState<Location.LocationObjectCoords | null>(null);
  const [routeCoords, setRouteCoords] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [distanceM, setDistanceM] = useState(0);
  const [etaMin, setEtaMin] = useState(0);

  useEffect(() => {
    mqttInit((msg) => {
      console.log("Received MQTT message in HomeScreen:", msg);
    });
  }, []);

  useEffect(() => {
    let subscriber: Location.LocationSubscription;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required.");
        return;
      }

      subscriber = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 500,
          distanceInterval: 2,
        },
        (location) => {
          const coords = location.coords;
          setLoc(coords);

          console.log(useUserStore.getState().user?._id);

          const mqttMessage: MqttMessage = {
            user: useUserStore.getState().user?._id,
            date: new Date().toISOString(),
            userActivity: useUserStore.getState().userActivity?._id,
            coordinates: `${coords.latitude},${coords.longitude}`,
            speed: coords.speed,
          };

          sendMessage(JSON.stringify(mqttMessage));
        }
      );
    })();

    return () => {
      if (subscriber) {
        subscriber.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (landmark) {
      const lm: Landmark = JSON.parse(landmark);
      const [lat, lon] = lm.coordinates.split(",").map(Number);
      setDest({ latitude: lat, longitude: lon });
    }
  }, [landmark]);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!loc || !dest) return;

      try {
        const start: [number, number] = [loc.longitude, loc.latitude];
        const end: [number, number] = [dest.longitude, dest.latitude];

        const response = await fetch(
          "https://api.openrouteservice.org/v2/directions/foot-walking/geojson",
          {
            method: "POST",
            headers: {
              Authorization: process.env
                .EXPO_PUBLIC_OPENROUTE_API_KEY as string,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ coordinates: [start, end] }),
          }
        );

        const json = await response.json();

        const coords = json.features[0].geometry.coordinates.map(
          ([lon, lat]: [number, number]) => ({
            latitude: lat,
            longitude: lon,
          })
        );

        setRouteCoords(coords);
        setDistanceM(json.features[0].properties.summary.distance);
        setEtaMin(json.features[0].properties.summary.duration / 60);
      } catch (error) {
        console.error("ORS route error:", error);
        Alert.alert("Error", "Failed to fetch route.");
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [loc, dest]);

  if (loading || !loc || !dest) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  return (
    <>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: loc.latitude,
          longitude: loc.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        <Marker coordinate={loc} title="You are here" pinColor="blue" />
        <Marker coordinate={dest} title="Destination" pinColor="green" />
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={4}
            strokeColor="red"
          />
        )}
      </MapView>
      <ThemedView style={styles.info}>
        <ThemedText style={{ color: "black" }}>
          Distance: {(distanceM / 1000).toFixed(2)} km
        </ThemedText>
        <ThemedText style={{ color: "black" }}>
          Estimated time: {etaMin.toFixed(1)} min
        </ThemedText>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  info: {
    position: "absolute",
    bottom: 32,
    left: 16,
    right: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 12,
    borderRadius: 8,
  },
});
