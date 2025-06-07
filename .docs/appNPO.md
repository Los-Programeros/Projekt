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

## Opis ključnih komponent in funkcionalnosti

### App.tsx

* Nastavi **TabNavigator** kot glavno navigacijo.
* Zgradi globalni **AppContext** za upravljanje stanja (npr. MQTT povezava, uporabniški podatki).

### navigation/TabNavigator.tsx

* Definira tab navigacijo z 4 glavnimi zavihki:

  * **Home**
  * **Run**
  * **Map**
  * **Profile**
* Vsak tab je povezan s svojim zaslonom (`screens/*.tsx`).

### screens/Run.tsx

* Aktivira zajem senzorskih podatkov (pospeškomer, GPS).
* Uporablja `mqttClient.ts` za pošiljanje (publish) teh podatkov na Mosquitto broker.
* Prikazuje status povezave in število poslanih sporočil.

### services/mqttClient.ts

* Inicializira MQTT povezavo na določen broker (Mosquitto v Dockerju).
* Implementira metode za `publish` in `subscribe`.
* Poskrbi za ponovno povezavo ob izgubi signala.

### screens/Map.tsx

* Prikaže uporabnikovo lokacijo in lokacije iz podatkov, prejetih preko MQTT.
* Uporablja `react-native-maps` za vizualizacijo.

### context/AppContext.tsx

* Globalni React Context, ki hrani stanje povezave z MQTT, uporabniške podatke in zajete podatke.
* Omogoča deljenje stanja med različnimi tabi.

---

## Kako deluje MQTT povezava

1. **Mobilna naprava** se poveže na Mosquitto broker preko MQTT.
2. Pod zaslonom **Run** se sproži periodično pošiljanje senzorskih podatkov na MQTT temo (topic).
3. Drugi deli aplikacije (npr. **Map**) se lahko naročijo (subscribe) na MQTT teme in prikažejo prejete podatke.
4. Povezava se upravlja centralno v `mqttClient.ts`, ki poskrbi tudi za samodejno ponovno vzpostavitev povezave.

---

Če želiš, ti lahko pripravim tudi primer konkretne kode za `mqttClient.ts` ali za posamezne zaslone/tab-e. Ali želiš, da dokumentacijo še bolj razširim?
