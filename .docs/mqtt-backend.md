# MQTT backend (Jožef)

Python program prejema podatke od senzorjev in spremlja aktivnost uporabnikov. Povezuje se z MQTT brokerjem prek WebSocket protokola in pošilja podatke naprej v Node.js aplikacijo.

### Posredovanje podatkov

Vsi prejeti senzorski podatki iz Mosquitto brokerja se pošljejo na Node.js končno točko `/sensorData`.

### Štetje aktivnih naprav

Program sledi zadnji aktivnosti vsakega uporabnika in avtomatsko označuje uporabnike kot neaktivne, če 5 sekund ne pošljejo nobenih podatkov. Status aktivnosti se pošlje na Node.js API.