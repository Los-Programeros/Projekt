# FLoCIC – Lossless Image Compression Module

Ta repozitorij vsebuje implementacijo algoritma **FLoCIC** (Fast Lossless Color Image Compression) za brezizgubno stiskanje sivinskih slik. Modul je zasnovan za uporabo v Python okolju in vključuje integracijo v strežniški cevovod za obdelavo podatkov pred strojnim učenjem.

Algoritem uporablja kombinacijo **MED (Median Edge Detection)** predikcije in rekurzivnega **interpolacijskega kodiranja (Interpolative Coding)**.

---

## Struktura projekta

Modul je sestavljen iz treh ključnih komponent, ki se nahajajo v direktoriju `/ORV/app/`:

| Datoteka | Pot | Opis |
|---------|-----|------|
| **flocic_util.py** | `scripts/flocic_util.py` | Glavna knjižnica. Vsebuje logiko za predikcijo, interpolacijsko kodiranje (IC) ter funkcije za branje in pisanje binarnih datotek (`.bin`). |
| **bitstream.py** | `scripts/bitstream.py` | Pomožni razred za manipulacijo bitov (bit-level I/O), potreben za interpolacijsko kodiranje. |
| **server.py** | `server.py` | Strežniška skripta, ki uporablja FLoCIC za samodejno dekompresijo učnih podatkov pred začetkom učenja modela. |

---

## Zahteve

Za delovanje kode so potrebne naslednje Python knjižnice:

```bash
pip install numpy pillow
```

---

## Uporaba

### 1. Stiskanje in razširjanje (samostojna uporaba)

Datoteka `flocic_util.py` omogoča stiskanje `numpy` polj v binarni format in obratno.

```python
import numpy as np
from scripts import flocic_util

# STISKANJE
image_array = np.array([...], dtype=np.uint8)
flocic_util.compress_to_file(image_array, "output_image.bin")

# RAZŠIRJANJE
restored_array = flocic_util.decompress_to_array("output_image.bin")
```

---

### 2. Integracija v strežnik

V datoteki `server.py` se modul uporablja za pripravo podatkov pred učenjem modela. Sistem samodejno zazna `.bin` datoteke, jih dekompresira in pretvori v `.jpg` format, ki je primeren za knjižnice strojnega učenja (npr. Keras).

#### Logika procesiranja

- Poišči vse `.bin` datoteke v uporabniškem direktoriju.
- Dekompresiraj vsako datoteko z uporabo `flocic_util`.
- Shrani sliko kot `.jpg`.
- Izbriši originalno `.bin` datoteko za prihranek prostora.

```python
def train_model(user_id, user_data_dir):
    print(f"[INFO] Checking for FLoCIC compressed data in {user_data_dir}...")

    bin_files = list(Path(user_data_dir).rglob("*.bin"))

    for bin_file in bin_files:
        try:
            img_array = flocic_util.decompress_to_array(str(bin_file))
            img_obj = Image.fromarray(img_array).convert("RGB")
            img_obj.save(str(bin_file.with_suffix(".jpg")))
            os.remove(bin_file)
        except Exception as e:
            print(f"[ERROR] Failed to decompress {bin_file}: {e}")
```

---

## Tehnične podrobnosti

Algoritem deluje v dveh glavnih fazah:

### 1. Predikcija (Prediction)

- MED prediktor napove vrednost piksla na podlagi sosednjih pikslov (levo, zgoraj, zgoraj-levo).
- Izračuna se napaka **E** (razlika med dejansko in napovedano vrednostjo).
- Napake se preslikajo v pozitivna cela števila **N** in združijo v kumulativni vektor **C**.

### 2. Interpolacijsko kodiranje (Interpolative Coding)

- Vektor **C** se stisne z uporabo rekurzivne binarne delitve.
- Shrani se le srednja vrednost območja, kadar se leva in desna meja razlikujeta.
- Dosežena je visoka stopnja kompresije pri gladkih območjih slike.
- Bitni zapis poteka preko razreda **BitStream**.

---

## Opombe

- **Recursion limit**  
  Zaradi rekurzivne narave interpolacijskega kodiranja se uporablja:
  `sys.setrecursionlimit(2000000)`

- **Format datoteke**  
  Izhodna `.bin` datoteka vsebuje:
  - širino slike,
  - začetno in končno vrednost,
  - število pikslov,
  - binarni tok stisnjenih podatkov.
