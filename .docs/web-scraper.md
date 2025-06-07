# Web scraper (Jožef)

Spletni pobere znamenitosti z visitmaribor.si, jih geocodira in pošlje na API.

## Kako deluje

`scrapper.py` pobere seznam znamenitosti, za vsako najde GPS koordinate in jih shrani v CSV imenovan `landmarks.csv`. 

`api_sender.py` pošlje podatke na Node.js strežnik.

## Uporaba

1. Nastavi virtualno okolje.
2. `python scrapper.py`
3. `python api_sender.py` 