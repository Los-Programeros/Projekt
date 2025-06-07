import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { sendMessage } from "@/lib/mqttService";
import { useRunStore } from "@/store/useRunStore";
import { useUserStore } from "@/store/useUserStore";
import { Landmark, MqttMessage } from "@/types";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export default function MapScreen() {
  const { landmarks } = useRunStore();
  const { landmark } = useLocalSearchParams<{ landmark: string }>();
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(
    null
  );
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
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [hasReachedDestination, setHasReachedDestination] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const mapRef = useRef<MapView>(null);
  const ARRIVAL_THRESHOLD = 20000000;

  const resetMapState = useCallback(() => {
    setRouteCoords([]);
    setDistanceM(0);
    setEtaMin(0);
    setShowCongratulations(false);
    setHasReachedDestination(false);
    setHasStarted(false);
    setLoadingRoute(false);
  }, []);

  useEffect(() => {
    let subscriber: Location.LocationSubscription;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required.");
        return;
      }

      const initialLocation = await Location.getCurrentPositionAsync({});
      setLoc(initialLocation.coords);
      setLoadingLocation(false);

      subscriber = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 500,
          distanceInterval: 0.5,
        },
        (location) => {
          const coords = location.coords;
          setLoc(coords);

          if (hasStarted && dest && !hasReachedDestination) {
            const mqttMessage: MqttMessage = {
              user: useUserStore.getState().user?._id,
              date: new Date().toISOString(),
              userActivity: useUserStore.getState().userActivity?._id,
              coordinates: `${coords.latitude},${coords.longitude}`,
              speed: coords.speed,
            };
            sendMessage(JSON.stringify(mqttMessage));
          }
        }
      );
    })();

    return () => subscriber?.remove();
  }, [hasStarted, dest]);

  useEffect(() => {
    if (landmark) {
      const lm: Landmark = JSON.parse(landmark);
      handleLandmarkSelection(lm);
    }
  }, [landmark]);

  const handleLandmarkSelection = (landmark: Landmark) => {
    if (hasStarted && !hasReachedDestination) {
      Alert.alert(
        "Run in progress",
        "Please cancel the current run before selecting a new destination",
        [{ text: "OK" }]
      );
      return;
    }

    setSelectedLandmark(landmark);
    const [lat, lon] = landmark.coordinates.split(",").map(Number);
    setDest({ latitude: lat, longitude: lon });
    if (hasReachedDestination) resetMapState();
  };

  useEffect(() => {
    const fetchRoute = async () => {
      if (!loc || !dest) return;

      setLoadingRoute(true);
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
          ([lon, lat]: [number, number]) => ({ latitude: lat, longitude: lon })
        );

        setRouteCoords(coords);
        setDistanceM(json.features[0].properties.summary.distance);
        setEtaMin(json.features[0].properties.summary.duration / 60);
      } catch (error) {
        console.error("Route error:", error);
        Alert.alert("Error", "Failed to fetch route. Please try again.");
      } finally {
        setLoadingRoute(false);
      }
    };

    if (dest) {
      fetchRoute();
    }
  }, [loc, dest]);

  useEffect(() => {
    if (loc && dest && hasStarted && !hasReachedDestination) {
      const distance = calculateDistance(
        loc.latitude,
        loc.longitude,
        dest.latitude,
        dest.longitude
      );

      if (distance <= ARRIVAL_THRESHOLD) {
        setHasReachedDestination(true);
        setShowCongratulations(true);
      }
    }
  }, [loc, dest, hasStarted, hasReachedDestination]);

  const startNavigation = () => {
    if (!selectedLandmark) return;

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
      setHasStarted(true);
    }
  };

  const cancelRun = () => {
    resetMapState();
    setSelectedLandmark(null);
    setShowCancelConfirm(false);
  };

  const startNewRun = () => {
    resetMapState();
    setSelectedLandmark(null);
    router.push("/run");
  };

  if (loadingLocation || !loc) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <ThemedText style={{ marginTop: 16 }}>
          Getting your location...
        </ThemedText>
      </View>
    );
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
        {landmarks.map((lm) => (
          <Marker
            key={lm._id}
            coordinate={{
              latitude: parseFloat(lm.coordinates.split(",")[0]),
              longitude: parseFloat(lm.coordinates.split(",")[1]),
            }}
            title={lm.name}
            description={lm.category}
            onPress={() => handleLandmarkSelection(lm)}
            pinColor={
              selectedLandmark?._id === lm._id
                ? Colors.primary
                : Colors.seconard
            }
            opacity={
              selectedLandmark && selectedLandmark._id !== lm._id ? 0.6 : 1
            }
          />
        ))}

        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={4}
            strokeColor={hasStarted ? Colors.primary : Colors.seconard}
          />
        )}
      </MapView>

      <ThemedView style={styles.info}>
        {selectedLandmark ? (
          <>
            <ThemedText style={styles.infoText}>
              Destination: {selectedLandmark.name}
            </ThemedText>
            <ThemedText style={styles.infoText}>
              Distance: {(distanceM / 1000).toFixed(2)} km
            </ThemedText>
            <ThemedText style={styles.infoText}>
              ETA: {etaMin.toFixed(1)} min
            </ThemedText>
            <ThemedText style={styles.infoText}>
              Speed: {((loc.speed ?? 0) * 3.6).toFixed(1)} km/h
            </ThemedText>

            {!hasStarted ? (
              <View style={styles.buttonRow}>
                <Button
                  title="Start Run"
                  color={Colors.primary}
                  onPress={startNavigation}
                  disabled={loadingRoute}
                />
                <View style={styles.buttonSpacer} />
                <Button
                  title="Change Destination"
                  color={Colors.seconard}
                  onPress={() => setSelectedLandmark(null)}
                  disabled={loadingRoute}
                />
              </View>
            ) : !hasReachedDestination ? (
              <View style={styles.buttonRow}>
                <Button
                  title="Cancel Run"
                  color={Colors.error}
                  onPress={() => setShowCancelConfirm(true)}
                />
              </View>
            ) : (
              <View style={styles.buttonRow}>
                <Button
                  title="Start New Run"
                  color={Colors.primary}
                  onPress={startNewRun}
                />
              </View>
            )}
          </>
        ) : (
          <>
            <ThemedText style={styles.infoText}>
              Select a landmark to start your run
            </ThemedText>
            <ThemedText style={[styles.infoText, { fontSize: 12 }]}>
              Tap any marker on the map
            </ThemedText>
          </>
        )}
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
              You've reached {selectedLandmark?.name}!
            </Text>
            <Text style={styles.congratsSubtext}>
              Total distance: {(distanceM / 1000).toFixed(2)} km
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCongratulations(false)}
            >
              <Text style={styles.closeButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showCancelConfirm}
        onRequestClose={() => setShowCancelConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.congratsTitle}>Cancel Run?</Text>
            <Text style={styles.congratsMessage}>
              Are you sure you want to cancel this run?
            </Text>
            <View style={styles.buttonRow}>
              <Button
                title="No, Continue"
                color={Colors.seconard}
                onPress={() => setShowCancelConfirm(false)}
              />
              <View style={styles.buttonSpacer} />
              <Button
                title="Yes, Cancel"
                color={Colors.error}
                onPress={cancelRun}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  info: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 100 : 16,
    left: 16,
    right: 16,
    backgroundColor: Colors.dark.background,
    padding: 16,
    borderRadius: 8,
    elevation: 3,
  },
  infoText: {
    color: Colors.white,
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 12,
    justifyContent: "space-between",
  },
  buttonSpacer: {
    width: 8,
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
    backgroundColor: Colors.light.background,
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    margin: 20,
    width: "80%",
  },
  congratsTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.primary,
    marginBottom: 12,
    textAlign: "center",
  },
  congratsMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 8,
    color: Colors.dark.text,
  },
  congratsSubtext: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    color: Colors.dark.text,
  },
  closeButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  closeButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
});
