# Uporabimo uradno Python sliko
FROM python:3.11-slim

# Nastavi delovno mapo
WORKDIR /app

# Kopiraj vse potrebne datoteke
COPY mqtt.py requirements.txt example.txt ./

# Namesti odvisnosti
RUN pip install --no-cache-dir -r requirements.txt

# Zaženi mqtt skripto
CMD ["python", "mqtt.py"]
