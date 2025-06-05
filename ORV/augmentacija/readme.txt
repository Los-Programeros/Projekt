Datoteko zaženemo z "python run.py", ta skripta požene vse 3 skripte (PripravaPodatkov.py, PredProcesiranje.py, Augmentacija.py)

Vsi zajeti podatki se shranejo v folderju 1, kjer se ustavi novi folder 00000001, oz +1 od prejšnjega največjega folderja.

V tem folderju se bodo nahajali 3 folderji, original v katerem je originalnih 50 slik (10 iz vsake perspektive), 
predprocesiranje v katerem so predprocesirane slike in augmentacija v katerem so augmentirane slike.

Ko se požene run.py se bo prvo zagnal PripravaPodatkov.py. Ta programček bo z navodili na zaslonu usmeril uporabnika in s pritiskom na <SPACE>
bo zajel 10 slikic za vsako od 5ih perspektiv uporabnika, nato pa se bota zagnala se PredProcesiranje.py in Augmentacija.py.