import csv
import requests
import json

api = "http://server:3000/landmarks"

with open('landmarks.csv', newline='', encoding='utf-8') as csvfile:
    reader = csv.DictReader(csvfile)
    
    for row in reader:
        name = row['Landmark']
        coordinates = row['Coordinates']

        payload = {
            'name': row['Landmark'],
            'coordinates': row['Coordinates']
        }

        try:
            response = requests.post(api, headers={ 'Content-Type': 'application/json' }, data=json.dumps(payload))
            
            if response.status_code == 200 or response.status_code == 201:
                print(f"Uspešno poslal {row['Landmark']}")
            else:
                print(f"Napaka {row['Landmark']}: {response.status_code} - {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"Napaka {row['Landmark']}: {e}")