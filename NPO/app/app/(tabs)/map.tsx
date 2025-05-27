import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { mqttInit, sendMessage } from "@/lib/mqttService";
import { useUserStore } from "@/store/useUserStore";
import { Landmark, MqttMessage } from "@/types";
import * as Location from "expo-location";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

// Helper function to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

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
  const [distanceM, setDistanceM] = useState(0);
  const [etaMin, setEtaMin] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [hasReachedDestination, setHasReachedDestination] = useState(false);

  const mapRef = useRef<MapView>(null);
  const ARRIVAL_THRESHOLD = 20;

  useEffect(() => {
    mqttInit((msg) => {
      console.log("Received MQTT message:", msg);
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
          mayShowUserSettingsDialog: true,
        },
        (location) => {
          const coords = location.coords;
          setLoc(coords);

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
    if (loc && dest && !hasReachedDestination) {
      const distanceToDestination = calculateDistance(
        loc.latitude,
        loc.longitude,
        dest.latitude,
        dest.longitude
      );

      if (distanceToDestination <= ARRIVAL_THRESHOLD) {
        setHasReachedDestination(true);
        setShowCongratulations(true);
      }
    }
  }, [loc, dest, hasReachedDestination]);

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

  useEffect(() => {
    if (mapRef.current && loc) {
      mapRef.current.animateCamera({
        center: {
          latitude: loc.latitude,
          longitude: loc.longitude,
        },
        heading: loc.heading || 0,
        pitch: 45,
        zoom: 17,
      });
    }
  }, [loc]);

  if (loading || !loc || !dest) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  return (
    <>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: loc.latitude,
          longitude: loc.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation={true}
        followsUserLocation={true}
      >
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
        <ThemedText style={{ color: Colors.white }}>
          Distance: {(distanceM / 1000).toFixed(2)} km
        </ThemedText>
        <ThemedText style={{ color: Colors.white }}>
          ETA: {etaMin.toFixed(1)} min
        </ThemedText>
        <ThemedText style={{ color: Colors.white }}>
          Speed: {((loc.speed ?? 0) * 3.6).toFixed(1)} km/h
        </ThemedText>
        {hasReachedDestination && (
          <ThemedText
            style={{ color: Colors.primary, fontWeight: "bold", marginTop: 8 }}
          >
            🎉 Destination Reached! 🎉
          </ThemedText>
        )}
        <ThemedView style={{ marginTop: 8 }}>
          <Button
            title="Start Navigation"
            color={Colors.primary}
            onPress={() => {
              if (mapRef.current && loc) {
                mapRef.current.animateCamera({
                  center: {
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                  },
                  heading: loc.heading || 0,
                  pitch: 60,
                  zoom: 18,
                });
              }
            }}
          />
        </ThemedView>
      </ThemedView>

      <TouchableOpacity
        style={styles.recenterButton}
        onPress={() => {
          if (mapRef.current && loc) {
            mapRef.current.animateToRegion({
              latitude: loc.latitude,
              longitude: loc.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
          }
        }}
      >
        <Text style={styles.buttonText}>📍</Text>
      </TouchableOpacity>

      {/* Congratulations Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showCongratulations}
        onRequestClose={() => setShowCongratulations(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.congratsTitle}>🎉 Congratulations! 🎉</Text>
            <Text style={styles.congratsMessage}>
              You have successfully reached your destination!
            </Text>
            <Text style={styles.congratsSubtext}>
              Great job completing your journey!
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCongratulations(false)}
            >
              <Text style={styles.closeButtonText}>Awesome!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1, marginTop: 100 },
  info: {
    position: "absolute",
    bottom: 32,
    left: 16,
    right: 16,
    backgroundColor: Colors.dark.background,
    color: Colors.white,
    padding: 12,
    borderRadius: 8,
    elevation: 3,
  },
  recenterButton: {
    position: "absolute",
    top: 160,
    right: 12,
    backgroundColor: Colors.white,
    padding: 10,
    borderRadius: 30,
    elevation: 4,
  },
  buttonText: {
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    margin: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  congratsTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.primary,
    marginBottom: 15,
    textAlign: "center",
  },
  congratsMessage: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 10,
    color: "#333",
  },
  congratsSubtext: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 25,
    color: "#666",
  },
  closeButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
