# Treniranje modela (Jožef)

Model je namenjen prepoznavanju obrazov za potrebe 2FA in klasificira slike v dve kategoriji - je prava oseba ali ni. Uporabil sem pristop prenosnega učenja, kjer sem za osnovni model uporabil MobileNetV2, saj smo imeli manj učnih podatkov.

### Hiperparametri

Velikost slike je 64 pikslov, saj treniramo model na CPU, ki je počasnejši kot GPU in število epohov na 3, ki je majhno število, da uporabnik ne čaka predolgo ob registraciji.

### Arhitektura

Najprej gre slika čez MobileNetV2, ki je optimiziran predtrenirani model, za katerim imam svoje dodatne sloje. Na koncu je sigmoid aktivacijska funkcija za verjetnost med 0 in 1.

### Dodatne funkcionalosti

Uporabil sem early stopping, ki prekine treniranje, če se validation loss ne izboljša 10 epohov zaporedoma ter learning rate reduction, ki zmanjša učno stopnjo. Poleg tega imam tudi avtomatsko uravnoteženje razredov, ki izračuna uteži za vsak razred glede na frekvenco pojavitve.

### Razdelitev

80% podatkov za treniranje in 20% podatkov za validacijo, katera razdelitev se izvede avtomatsko z `validation_split=0.2`.

### Face cropping

Da se model ne natrenira še poleg obraza tudi ozadja, smo se odločili, da bomo odrezali ozadje izven slike in ohranili samo obraz, pri tem smo uporabili Haar Cascade klasifikator za prepoznavo obrazov, ki izreže prvi najdeni obraz iz slike.

### Izhod modela

V kolikor je vrednost razreda > 0.5, potem je prava oseba, drugače pa ni prava oseba.