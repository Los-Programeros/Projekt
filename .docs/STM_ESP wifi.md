# STM32F3 Discovery: WiFi Accelerometer Node

Ta projekt bere podatke iz vgrajenega pospeškometra (LSM303DLHC) na **STM32F3 Discovery** plošči in jih preko **ESP32** modula pošilja na oddaljen TCP strežnik (**test.py**) v realnem času.

## 🔌 Povezava Strojne Opreme (Wiring)

Za delovanje je potrebno povezati UART komunikacijo med STM32 in ESP modulom. Za pomoč si poglej folder **.pics**

| ESP32 pin| STM32 Pin | 
|:---| :--- | :--- | 
| **22** | **PA9** | 
| **19** | **PA10** | 
| **GND** | **GND** |
| **5V** | **5V** |

---

## 🚦 LED Status Indikatorji

Sistem uporablja krožne LED diode na Discovery plošči za diagnostiko. Če gre kaj narobe, poglej katera lučka sveti/utripa.

| LED Oznaka | Barva / Pozicija | Stanje: SVETI (ON) ✅ | Stanje: UTRIPA (BLINK) ❌ |
| :--- | :--- | :--- | :--- |
| **LD3** | 🔴 **Rdeča** (Sever) | **ESP OK**<br>Komunikacija z modulom deluje (AT ukazi). | / |
| **LD10** | 🔴 **Rdeča** (Jug) | / | **HW Napaka**<br>STM32 ne najde ESP modula. Preveri žice! |
| **LD5** | 🟠 **Oranžna** (Vzhod) | **WiFi Povezan**<br>Uspešno povezan na Hotspot. | **WiFi Napaka**<br>Neuspešna povezava (geslo, doseg, hotspot ugasnjen). |
| **LD7** | 🟢 **Zelena** (Jugovzhod)| **TCP Povezan**<br>Povezava s strežnikom vzpostavljena. | **TCP Napaka**<br>WiFi dela, a server ni dosegljiv (IP, Firewall). |
| **LD9** | 🔵 **Modra** (Jugozahod)| **Data Streaming**<br>Vsak utrip pomeni uspešno poslan paket. | / |

### Zaporedje zagona (Boot Sequence)
1.  **Vse LED OFF:** Sistem se inicializira (3s).
2.  **LD3 ON (Rdeča):** ESP je odziven.
3.  **LD5 ON (Oranžna):** WiFi povezan.
4.  **LD7 ON (Zelena):** Server povezan.
5.  **LD9 Utripa (Modra):** Podatki letijo.

---

## ⚙️ Konfiguracija (main.c)

Pred nalaganjem kode preveri naslednje vrstice v `main.c`:

```c
// Nastavitve WiFi omrežja (Hotspot)
#define WIFI_SSID "Jan's iPhone"   // Pazi na točno ime (apostrofi!)
#define WIFI_PASS "banana123"

// Nastavitve TCP Strežnika
#define TCP_HOST  "172.20.10.2"    // Preveri IP računalnika (ipconfig / ifconfig)
#define TCP_PORT  8080             // Port na katerem posluša skripta
```
