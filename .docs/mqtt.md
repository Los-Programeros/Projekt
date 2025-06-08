# Mosquitto Broker (Jožef)

Uporabil sem obstoječo Docker sliko, katero sem prenesel iz DockerHub-a in določil lastno konfiguracijo. Nastavil sem, da uporablja websockets na portu 1883.

```
persistence true
persistence_location /mosquitto/data/
log_dest file /mosquitto/log/mosquitto.log
listener 1883 0.0.0.0
allow_anonymous true
protocol websockets
```