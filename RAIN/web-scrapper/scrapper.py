from bs4 import BeautifulSoup
from requests_html import HTMLSession
import time
import json
import subprocess
import urllib.parse
import csv

def geocode(place): # Pretvori ime znamenitosti v GPS koordinate
    encoded_place = urllib.parse.quote(place)
    curl = ['curl', f"https://nominatim.openstreetmap.org/search?q={encoded_place}&limit=2&format=json"]
    result = subprocess.run(curl, capture_output=True, text=True)
    if result.returncode == 0:
        data = json.loads(result.stdout)
        if data:
            return f"{data[0]['lat']},{data[0]['lon']}"
    return "-,-"

session = HTMLSession()
response = session.get("https://www.visitmaribor.si/si/kaj-poceti/znamenitosti/")
response.html.render() # izvede javascript kodo

soup = BeautifulSoup(response.html.html, "html.parser")
landmarks = soup.find_all("h3", attrs={"class":"catalogue-item__title"})

with open('landmarks.csv', mode='w', newline='', encoding='utf-8') as file:
    writer = csv.writer(file)
    writer.writerow(['Landmark', 'Coordinates'])

    for landmark in landmarks:
        name = landmark.text.strip()
        coordinates = geocode(f"{name} Maribor")
        print(f"{name}: {coordinates}")
        
        if coordinates != "-,-":
            writer.writerow([name, coordinates])
        
        time.sleep(1)