# History Run - Los Programeros - Projekt pri R-IT 2025

# Dokumentacija aplikacije

## Kako deluje?

1. **Odpri aplikacijo** in se registriraj z uporabniškim imenom, geslom in e-pošto. 
   Slikaj se 5x za 2FA, kar bo natreniralo model za tvoj obraz.  
   Če si že registriran, se samo prijavi z uporabniškim imenom, geslom in se slikaj za avtentikacijo.

2. Spodaj v orodni vrstici klikni na **Run** in izberi, kam bi rad tekel.

3. Če ti je lokacija všeč, klikni na **Začni aktivnost** in teci!

4. Ko prispeš na lokacijo, se tvoja športna aktivnost shrani.

# Tehnična dokumentacija

## Namestitev

### Avtomatska

Namestitev in posodobitev potekata avtomatsko prek GitHub Actions, ko se koda prenese v main vejo.

### Ročna

Strežnik se lahko postavi tudi ročno:  
1. Prenesi projekt iz Githuba.
2. Razpakiraj slike iz negatives.zip, ki se nahaja v ORV/app/data v mapo negatives, ki se nahaja v istem direktoriju.
3. V bash lupini zaženi `server-setup.sh` za nastavitev okolja.
4. Opcijsko: zaženi `server-clean.sh` za čiščenje okolja.

## Docker zabojniki, ki tečejo ob vzpostavitvi

- **MongoDB** (`27017`)
- **Mosquitto Broker** (`1883`)
- **2FA Model** (`5000`) – API za preverjanje dvostopenjske avtentikacije.
- **MQTT Backend** – Posreduje sporočila iz Mosquitto brokerja v Node.js strežnik.
- **Node.js Strežnik** (`3000`)

Vsi zabojniki so povezani znotraj enega omrežja imenovanega `backend-net`

## Struktura projekta

Projekt je zgrajen v treh večjih mapah, ki so povezane z vsakim predmetom. V vsaki mapi se nahajajo mapice ki so zapisane spodaj in opisane v linkih:

### 1. NPO (namenska programska oprema)
- [App](.docs/appNPO.md)
- [Mosquitto Broker](.docs/mqtt.md)

### 2. ORV (osnove računalniškega vida)
- [App](.docs/appORV.md)
- [Augmentacija](.docs/augmentacija.md)
- [Model Training](.docs/model-training.md)

### 3. RAIN (razvoj aplikacij za internet)
- [Mongo](.docs/mongo.md)
- [MQTT Backend](.docs/mqtt-backend.md)
- [Node Backend](.docs/node-backend.md)
- [Web Scraper](.docs/web-scraper.md)

### Dodatno: 4. Sistemska administracija

#### Uporaba Dockerja

Jan - kontejnerizacija `Node strežnika`  
Jožef - kontejnerizacija `mqtt-backenda`  
Gal - kontejnerizacija `modela`

#### CI/CD cevovod 

Jan - avtomatski test za MQTT  
Jožef - [avtomatski deployment](.docs/deployment.md), avtomatski test za MongoDB    
Gal - avtomatski test za Node