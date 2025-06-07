# Avtomatski deployment (Jožef)

Avtomatsko namesti kodo na strežnik vsakič, ko pošljemo spremembe v main branch.

## Kako deluje

Workflow je sestavljen iz treh glavnih korakov, ki se izvajajo eden za drugim:

### 1. Nalaganje na strežnik (Server Upload)

Prvi korak prenese vse datoteke projekta na strežnik preko SFTP protokola.

### 2. Nastavitev strežnika (Server Setup)

Drugi korak razpakira arhiv z negativnimi podatki: `ORV/app/data/negatives.zip`, odstrani stare kontejnerje in zažene nove kontejnerje.

### 3. Testiranje kontejnerjev (Test Containers)

Tretji korak preveri, ali vsi sistemi delujejo pravilno.


V GitHub repozitoriju smo morali tudi nastaviti secrets za
`SERVER_URL`, `SSH_USERNAME` in `SSH_PASSWORD` in imeti nastavljen self-hosted GitHub runner.