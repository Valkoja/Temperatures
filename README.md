### Scripts
**read_temperature.py** - Hakee annetulta mittarilta lämpötilan, laskee niistä keskiarvon ja lähettä sen palvelimelle.  
**update_hourly.py** - Lähettää palvelimelle käskyn laskea tunnin keskiarvot.  
**update_daily.py** - Lähettää palvelimelle käskyn laskea päivän minimin, keskiarvon ja maksimin.  
**socket_wrap.py** - Wrapper Socket.io viestien lähettämiseen.  

Python scriptit joita crontab ajaa: read_temperature joka minuutti, hourly kerran tunnissa ja daily kerran päivässä. Sensoriksi valittu DS1820 on siitä oikein mukava että arvon lukeminen on varsin yksinkertaista (read_temperature rivit 15-19). Tämän lisäksi scriptien vastuulla onkin lähinnä toiminnan ajastaminen. Koska cronilla on harmittava tapa lähettää kaikki virheet sähköpostiin, on logger asetettu kirjoittamaan kaikki errorit ja korkeammat virheet tiedostoon.

### Server
NodeJS palvelin jonka kanssa sekä scriptit että clientit keskustelevat. Hoitaa tietojen vastaanottamisen, tallentamisen kantaan ja lähettämisen clienteille. Tarjoaa myös aikaisemmat tiedot kuvaajan piirtämistä varten kun client yhdistää. Tarkkailee myös lämpötiloja ja lähettää sähköpostia jos se nousee rajan ylitse. Node:n MySQL paketti on valitettavasti kovin callback -henkinen. Se kyllä toimii ja kun pilkoin suorituksen osiin on ihan luettava, mutta jos olisi ylimääräistä aikaa voisi siihen kirjoittaa jonkun promise -wrapperin ympärille. Alla esimerkki mitä tapahtuu joka minuutti kun mittarilta tulee uusi lämpötila (update.js ja update_minutes.js):

1. Python -scripti ilmoittaa socketilla sensorin lämpötilan
2. Tarkistetaan että tietoja on ainakin oikea määrä
3. Haetaan poolista mysql -yhteys
4. Viedään uusi rivi kantaan ja toivotaan että se oli lämpötila
5. Haetaan äsken viety rivi kannasta: annetaan tietokannan hoitaa aikaleima, pyöristys ja tietotyyppi
6. Lähetetään lämpötila socketilla asiakkaille
7. Jos lämpötila oli suurempi kuin asetukissa määritelty raja-arvo, haetaan aktiiviset hälytykset
8. Jos aktiivista hälytystä ei löydy, tai lämpötila on noussut tarpeeksi, lähetetään hälytys sähköpostilla
9. Tallennetaan hälytys kantaan, jotta sitä ei lähetetä uudestaan heti seuraavan minuutin aikana

### Client
Asiakasohjelma joka näyttää mittarien tiedot kuvaajissa: viimeisen kuukauden tunnin tarkkuudella ja viimeisen tunnin minuutin tarkuudella. Jää myös kuuntelemaan päivityksiä palvelimelta ja lisää niitä kuvaajiin sitä mukaan kun tietoja saapuu. Luokkarakenteeseen olen aika tyytyväinen: window.temperatures pitää koko pakkaa kasassa, jokainen palvelin (käytännössä raspberry pi) on oma device jolla on n määrä mittareita (sensor) joilla taas jokaisella on kaksi kuvaajaa (chart). Ollaan kuitenkin aika rajalla olisiko tuohon kannattanut ottaa esim. redux hoitamaan raja-arvoja ja resize -eventtiä tuon window.temperatures:in sijaan. Päätin olla ottamatta koska ei puhuta kuin parista tiedosta, vaikka nyt saakin esim käskyä päivittää rajat kelkkoa koko rakenteen läpi aina charteille asti. 

### History
Pidemmän aikavälin historia. Hyvin samanlainen kuin client, nyt vain eri tiedoilla ja kuvaajalla. Jos historia olisi ollu alusta asti suunnitelmissa mukana, olisi luulvasti ollut järkevää tehdä luokat suoraan sellaisiksi että kumpikin esitystapa voisi niitä käyttää. Nyt on käytännössä identtinen index.js ja lähes samanlainen device.js. Sensorissa ja chartissa onkin hieman enemmän eroja clientin vastaaviin verrattuna, mutta pienellä suunnittelulla nekin olisi voinut helposti periyttää jostain yhteisestä kantaluokasta.

### Minutes
Käsittelemätön lista vuorokauden lämpötiloista. Samaa koodipohjaa kuin kaksi edellistä, mutta kovasti karsittu ja koska kuvaajaa ei ole, hoitaa sensor.js tietojen tulostamisen ruudulle.