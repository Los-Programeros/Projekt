# Dokumentacija projekta: Mobilna aplikacija z Expo in MQTT

## Pregled projekta

Projekt je razvit z uporabo **Expo** (React Native framework), ki omogoča hitro in enostavno razvojno okolje za mobilne aplikacije na Android in iOS platformah.

Glavna funkcionalnost aplikacije je zajemanje senzorskih podatkov in njihovo pošiljanje preko **MQTT protokola**. Aplikacija je razdeljena na več zaslonov (tabov):

* **Home** — začetni zaslon, kjer uporabnik vidi svojo statistiko (če je vpisan) in seznam znamenitosti
* **Run** — zaslon s seznamom vseh znamenitosti
* **Map** — prikaz lokacijskih podatkov na zemljevidu in vodenje uporabnika k izbrani znamenitosti
* **Profile** — uporabniški profil in uporabnikova statistika

---

## Tehnološki sklad

- **Expo** (~53.0.4) kot glavni razvojni okvir za React Native, omogoča hiter razvoj na iOS, Android in Web platformah.
- **expo-router** (~5.0.3) za upravljanje navigacije z datotečno strukturo (file-based routing).
- **React Navigation** (bottom-tabs, native, elements) za kompleksno navigacijo med tab-i.
- **MQTT protokol:**
  - Paket `mqtt` (^5.12.1) kot primarna knjižnica za povezovanje in komunikacijo z MQTT brokerjem.
  - Prav tako sta prisotna `paho-mqtt` in `react_native_mqtt` za alternativne možnosti MQTT (lahko se uporabijo glede na potrebo).
- **State management:**
  - Uporablja se `zustand` (^5.0.4) kot lahka in enostavna alternativa za globalno upravljanje stanja.
- **Expo API-ji za strojno opremo in funkcionalnosti:**
  - `expo-location` (~18.1.4) za zajem GPS lokacije.
  - `expo-camera` (~16.1.6) za uporabo kamere.
  - `expo-blur`, `expo-linear-gradient`, `expo-haptics`, `expo-status-bar`, `expo-splash-screen` in drugi Expo moduli za izboljšanje UX/UI.
- **UI in navigacija:**
  - `@expo/vector-icons` za ikone.
  - `react-native-maps` (1.20.1) za interaktivne zemljevide.
  - `react-native-gesture-handler` in `react-native-reanimated` za gladke animacije in geste.
  - `react-native-toast-message` za obvestila.
- **Ostalo:**
  - `@react-native-async-storage/async-storage` za trajno shranjevanje podatkov.
  - `typescript` (~5.8.3) za statično tipizacijo.
  - `eslint` za preverjanje kode.
    
---

## Struktura projekta

```plaintext
/HistoryRun
├── app
│   ├── (tabs)
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── map.tsx
│   │   ├── profile.tsx
│   │   └── run.ts
│   ├── _layout.tsx
│   ├── +not-found.tsx
│   ├── face-login.tsx
│   └── face-register.tsx
├── assets
│   ├── fonts
│   │   ├── Figtree-Regular.ttf
│   │   └── SpaceMono-Regular.ttf
│   ├── images
│   │   ├── monuments
│   │   │   └── default.png
│   │   ├── adaptive-icon.png
│   │   ├── favicon.png
│   │   └── ...
├── components
│   ├── ui
│   │   ├── AuthForm.tsx
│   │   ├── IconSymbol.ios.tsx
│   │   └── ...
│   ├── Collapsible.tsx
│   ├── ExternalLink.tsx
│   └── ...
├── constants
│   ├── Colors.ts
│   ├── Positions.ts
│   └── Spacing.ts
├── hooks
│   ├── useColorScheme.ts
│   ├── useColorScheme.web.ts
│   └── useThemeColor.ts
├── lib
│   └── mqttService.ts
├── scripts
│   └── reset-project.js
├── store
│   ├── useRunStore.ts
│   └── useUserStore.ts
├── .env
├── .gitignore
├── app.json
├── eslint.config.js
├── module.d.ts
├── package-lock.json
├── package.json
├── README.md
├── tsconfig.json
└── types.d.ts
```

---

---

## 🔨 Pregled del

### 1. Osnovna postavitev
- Uporabljena `expo-router` struktura.
- V mapi `(tabs)` ustvarjeni osnovni zasloni:
  - `index.tsx` – **Home**
  - `run.ts` – **Run**
  - `map.tsx` – **Map**
  - `profile.tsx` – **Profile**

### 2. Prijava in registracija
- Implementirana `face-login.tsx` in `face-register.tsx`.
- Osnovna avtentikacija s pomočjo Zustand (useUserStore).
- Obrazna avtentikacija za 2FA.

### 3. MQTT povezava
- Mosquitto broker teče v **Docker vsebniku**.
- `lib/mqttService.ts` vsebuje povezavo, `subscribe`, `publish`, reconnect logiko.
- Uporabljene knjižnice: `mqtt`, `paho-mqtt`.

### 4. Run zaslon
- Zajem podatkov iz GPS, pošiljanje preko MQTT.
- Podatki se pošiljajo vsakih nekaj sekund.
- Statistika poslanih sporočil.

### 5. Map zaslon
- Prikaz trenutne in drugih lokacij uporabnikov.
- Uporabljena `react-native-maps`.
- Prejem podatkov preko MQTT.

### 6. Profil in statistika
- Prikaz opravljenih tekov.
- Statistika: razdalje, trajanja, število znamenitosti.
- Možnost odjave.

---

### 🛰️ Kako deluje MQTT povezava

1. **Ustvarjanje MQTT "stor-a"** mqttService.ts
```TypeScript
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Client, Message } from "paho-mqtt";
import init from "react_native_mqtt";

let client: any;
let mqttendopoint: string = process.env.EXPO_PUBLIC_MQTT_BROKER_URL || "server";
let port: number = 1883;

export const mqttInit = (onMessage: (msg: any) => void) => {
  init({
    size: 10000,
    storageBackend: AsyncStorage,
    defaultExpires: 1000 * 3600 * 24,
    enableCache: true,
    reconnect: true,
    sync: {},
  });

  const clientId = "id_" + parseInt(String(Math.random() * 100000));
  client = new Client("server", 1883, "/mqtt");

  client.onConnectionLost = (res: any) => {
    console.log("Connection lost:", res.errorMessage, clientId);
  };

  client.onMessageArrived = (message: any) => {
    console.log("Message received:", message.payloadString);
    onMessage(message.payloadString);
  };

  client.connect({
    onSuccess: () => {
      console.log("Connected to MQTT broker");
      client.subscribe("historyrun/topic", { qos: 0 });
    },
    onFailure: (err: any) => {
      console.log("Failed to connect:", err);
    },
    useSSL: false,
  });
};

export const sendMessage = (messageText: string) => {
  const message = new Message(messageText);
  message.destinationName = "historyrun/topic";
  client.send(message);
};
```
2. **Mobilna naprava** se poveže na Mosquitto broker preko MQTT.
```TSX
useEffect(() => {
    mqttInit((msg) => {
      console.log("Received MQTT message in HomeScreen:", msg);
    });
  }, []);
```
3. Pod zaslonom **Map** se sproži periodično pošiljanje senzorskih podatkov na MQTT temo (topic), ko se zgodi premik uporabnika.
```TSX
if (hasStarted && dest) {
            const mqttMessage: MqttMessage = {
              user: useUserStore.getState().user?._id,
              date: new Date().toISOString(),
              userActivity: useUserStore.getState().userActivity?._id,
    coordinates: `${coords.latitude},${coords.longitude}`,
    speed: coords.speed,
  };
  sendMessage(JSON.stringify(mqttMessage));
}
```
5. Drugi deli aplikacije (npr. **Profile**) se lahko naročijo (subscribe) na MQTT teme in prikažejo prejete podatke.
6. Povezava se upravlja centralno v `mqttService.ts`, ki poskrbi tudi za samodejno ponovno vzpostavitev povezave.

---

## ✅ Zaključek

Aplikacija združuje sodobne mobilne tehnologije (Expo + MQTT) in omogoča razširljivo infrastrukturo za zbiranje in deljenje podatkov. Projekt je primeren za večje število uporabnikov in deluje kot osnova za aplikacije s področja športa, varnosti ali turističnega vodenja.
