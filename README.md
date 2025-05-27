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