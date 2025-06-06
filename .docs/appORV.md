# 📘 Dokumentacija – Član 3: Aplikacijski vmesnik za preverjanje identitete z obrazom

## 🧩 Opis

Ta del projekta vključuje implementacijo aplikacijskega vmesnika (API), ki omogoča integracijo modela za prepoznavo obraza v spletno in mobilno aplikacijo. Uporablja se tehnologija 2FA (dvofaktorska avtentikacija), kjer je drugi faktor verifikacija preko obraza.

API je razvit z uporabo ogrodja Flask in omogoča naslednje funkcionalnosti:

*  Nalaganje slik uporabnika,
*  Predobdelavo podatkov in organizacijo strukture datotek,
*  Treniranje modela za prepoznavo uporabnika,
*  Shranjevanje modela,
*  Preverjanje identitete uporabnika na podlagi naložene slike.

## 🛠️ Tehnologije in orodja

*  Python 3.10 (osnova aplikacije)
*  Flask (API framework)
*  TensorFlow + Keras (gradnja in treniranje modela)
*  Pillow (obdelava slik – `PIL`)
*  NumPy, scikit-learn (pomožne znanstvene knjižnice)
*  Docker (pakiranje celotne aplikacije)

## 📡 API endpointi

### 📥 POST `/train`

Trenira model za določenega uporabnika na podlagi naloženih slik.

#### 🧾 Parametri (form-data):

* `userId`: enolični ID uporabnika (npr. "uporabnik1")
* `images`: ena ali več slik obraza uporabnika

#### ✅ Odgovor:

```json
{
  "success": true,
  "model_path": "data/models/uporabnik1.keras"
}
```

### 🔍 POST `/predict`

Preveri identiteto uporabnika na podlagi ene slike.

#### 🧾 Parametri (form-data):

* `userId`: ID uporabnika
* `image`: ena slika obraza

#### ✅ Odgovor:

```json
{
  "success": true,
  "verified": true,
  "confidence": 0.93
}
```

## 🐳 Docker

Za poganjanje aplikacije z Dockerjem:

### 🧱 Dockerfile

```Dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
COPY ../augmentacija ./augmentacija

EXPOSE 5000
CMD ["python", "app.py"]
```

### 🛠️ setup.sh

```bash
#!/bin/bash

mkdir -p data/user_faces data/models

docker build -t model-image .
docker run -d --name model-container \
  -p 5000:5000 \
  --network backend-net \
  -v "$(pwd)/data/user_faces:/app/data/user_faces" \
  -v "$(pwd)/data/models:/app/data/models" \
  -v "$(pwd)/data/negatives:/app/data/negatives" \
  model-image
```

### 🧹 clean.sh

```bash
#!/bin/bash

docker container kill model-container
docker container rm model-container
```

## ▶️ Uporaba

1. Zaženite `setup.sh` za vzpostavitev okolja. 🛠️
2. Pošljite POST zahtevek na `/train` z ID-jem uporabnika in slikami obraza. 🧠
3. Po učenju lahko pošljete POST zahtevek na `/predict` za preverjanje uporabnika z novo sliko. 🔎

## 👤 Zadolžitve

**Član 3** – Priprava API-ja, Docker okolja in integracija s sistemom:

* 🧪 Vzpostavil REST API s pomočjo Flask
* 🔧 Implementiral endpointa `/train` in `/predict`
* 🧼 Implementiral logiko za predobdelavo in organizacijo slikovnih podatkov
* 🤖 Izvedel treniranje modela z uporabo MobileNetV2
* 💾 Poskrbel za hranjenje in ponovno nalaganje modelov
* 🐳 Pripravil Docker okolje (Dockerfile, setup/clean skripte)

## 📝 Git dnevnik

```bash
git log --author="GalPovsod8"
```
