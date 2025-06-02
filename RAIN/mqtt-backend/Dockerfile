FROM python:3.11-slim

WORKDIR /app

COPY mqtt.py requirements.txt example.txt ./

RUN pip install --no-cache-dir -r requirements.txt

CMD ["python", "-u", "mqtt.py"]
