# MongoDB (Jožef)

Uporabil sem obstoječo MongoDB sliko iz Dockerhub-a in omogočil persistenčno shranjevanje. Drugače bi se ob prekinitvi izvajanja zabojnika izgubili vsi podatki v bazi.

```
docker run -d --name mongo-container --network backend-net -p 27017:27017 -v mongo-data:/data/db mongo
```