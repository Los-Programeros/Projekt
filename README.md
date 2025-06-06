# ZA UPORABNIKE
# 🏃‍♂️ HISTORY RUN

## Zakaj *History Run*?  
👟 Športanje in spoznavanje mesta hkrati – zabavno in poučno!

---

## Kako uporabljati?

1. **Odpri aplikacijo** in se registriraj z uporabniškim imenom, geslom in e-pošto. 📧  
   Poslikaj se za 2FA in že si prijavljen!  
   Če si že registriran, se samo prijavi z uporabniškim imenom, geslom in se poslikaj, da potrdimo tvojo identiteto. 📸

2. Spodaj v orodni vrstici klikni na **Run** 🏃‍♀️ in izberi, kam bi rad tekel.

3. Če ti je lokacija všeč, klikni na **Začni aktivnost** ▶️ in teci! 🗺️

4. Ko prispeš na lokacijo, se poslikaj, objavi na Instagramu 📲 in pošlji prijateljem! 🎉

---

## Kako se odjaviti?  
Klikni na gumbek **Logout** 🔒 v zgornjem desnem kotu zaslona.
---

**Ekipa History Run**  
👨‍💻 Jan, 🧔 Jože in 👦 Gal

# ZA DEVELOPERJE
# History Run - Los Programeros

## Storitve

- **MongoDB** (`27017`)
- **Mosquitto Broker** (`1883`)
- **2FA Model** (`5000`) – API za preverjanje dvostopenjske avtentikacije.
- **MQTT Backend** – Posreduje sporočila iz Mosquitto brokerja v Node.js strežnik.
- **Node.js Strežnik** (`3000`)

## Namestitev

Namestitev in posodobitev potekata avtomatsko prek GitHub Actions, ko se koda prenese v main vejo.

## Skripte

- `server-setup.sh` – nastavitev okolja.
- `server-clean.sh` – čiščenje okolja.

## Sturktura projekta

Projekt je zgrajen v treh večjih mapah, ki so povezane z vsakim predmetom. V vsaki mapi se nahajajo mapice ki so zapisane spodaj in opisane v linkih:

### 1. NPO (namenska programska oprema)
- [App](.docs/appNPO.md)
- [MQTT](.docs/mqtt.md)

### 2. ORV (osnove računalniškega vida)
- [App](.docs/appORV.md)
- [Augmentacija](.docs/augmentacija.md)
- [Model Training](.docs/model-training.md)

### 3. RAIN (razvoj aplikacij za internet)
- [Mongo](.docs/mongo.md)
- [MQTT Backend](.docs/mqtt-backend.md)
- [Node Backend](.docs/node-backend.md)
- [Web Scraper](.docs/web-scraper.md)