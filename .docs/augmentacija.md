# AUGMENTACIJA (Jan)

Augmentacija poteka v treh korakih:

## 1. Zajem 
Zajem poteka znotraj aplikacije. Na začetku je bila narejena skripta imenovana predpriprava.py, v kateri je bil
python programček za zajem slik. Zaradi potreb aplikacije je bil ta scrapan in je na podlagi tega bil narejen identičen
način zajema v aplikaciji. (glej [NPO/App](appNPO.md))

## 2. Predprocesiranje
Predprocesiranje podatkov se dogaja v datoteki [predprocesiranje.py](../ORV/augmentacija/Predprocesiranje.py)
Program preko argumentov prejme pot direktorija kjer se nahajajo slike, ki jih je aplikacija zajela.
Program zažene Gausov filter, da zmanjša šum na sliki, razdeli sliko na posamezne barvne kanale in jih pretvori v sivinsko.
Osrednje dogajanje se dogaja v sledečih vrsticah kode.
```python
# Uporabi Gaussovo zameglitev za zmanjšanje šuma na sliki
denoise = cv2.GaussianBlur(img, (5, 5), 0)

# Razdeli zamegljeno barvno sliko na posamezne barvne kanale (modri, zeleni, rdeči)
b, g, r = cv2.split(denoise)

# Pretvori barvno sliko v sivinsko z uporabo tehtanega povprečja barvnih kanalov
gray = np.clip(0.0722 * b + 0.7152 * g + 0.2126 * r, 0, 255).astype(np.uint8)
```

## 3. Augmentacija
[Augmentacija](../ORV/augmentacija/Augmentacija.py) prav tako kot predprocesiranje prejme slike iz direktorija preko argumentov, nato pa izvede sledeče augmentacije

### Naključna svetlost in kontrast
Funkcija naključno nastavi svetlost in kontrast slike.
```python
# Naključno prilagodi svetlost in kontrast slike
def rand_brightness_contrast(img):
    a = random.uniform(0.6, 1.4)  # Naključni faktor kontrasta (0.6–1.4)
    b = random.randint(-20, 20)   # Naključna vrednost svetlosti (-20 do 20)
    # Prilagodi sliko in omeji vrednosti med 0 in 255
    return np.clip(img.astype(np.int16) * a + b, 0, 255).astype(np.uint8)
```

### Mikrorotacije slike
Funkcija opravi mikrorotacije nad sliko
```python
# Rahlo zavrti sliko za naključen majhen kot
def micro_rotate(img):
    angle = random.uniform(-7, 7)        # Naključni kot rotacije med -7 in 7 stopinj
    h, w = img.shape[:2]                 # Višina in širina slike
    # Izračunaj rotacijsko matriko okoli centra slike
    M = cv2.getRotationMatrix2D((w / 2, h / 2), angle, 1.0)
    # Uporabi afino transformacijo z odbojem na robovih
    return cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_LINEAR,
                          borderMode=cv2.BORDER_REFLECT101)
```

### Zrcaljenje slike in zamik
Funkcija opravi zrcaljenje in sliko za malo premakne v naključni smeri
```python
# Zrcali sliko in jo rahlo premakni v naključni smeri (maks ±3 pike)
def flip_shift(img):
    f = cv2.flip(img, 1)                            # Zrcaljenje slike po navpični osi
    dx, dy = random.randint(-3, 3), random.randint(-3, 3)  # Naključni premik
    s = np.roll(np.roll(f, dy, axis=0), dx, axis=1)        # Premik po y in nato po x osi
    # Nastavi premaknjene robove na 0 (črna)
    if dx > 0:  s[:, :dx] = 0
    if dx < 0:  s[:, dx:] = 0
    if dy > 0:  s[:dy, :] = 0
    if dy < 0:  s[dy:, :] = 0
    return s
```

### Kvadratek na sredini slike
Funkcija na sredino slike doda črni kvradratek
```python
# Doda kvadratno črno zaporo (okluzijo) nekje na sredini slike
def occlusion_patch(img):
    h, w = img.shape[:2]                     # Višina in širina slike
    size = 25                                # Velikost zapore (25x25 pik)
    # Naključna pozicija znotraj osrednjega dela slike
    x = random.randint(int(w * 0.3), int(w * 0.7) - size)
    y = random.randint(int(h * 0.3), int(h * 0.7) - size)
    out = img.copy()
    out[y:y+size, x:x+size] = 0              # Znotraj izbranega kvadrata nastavi vrednosti na 0 (črna zapora)
    return out
```
