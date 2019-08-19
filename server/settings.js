// Uudelleenohjataan käyttäjä frontendin suuntaan
exports.address = 'Osoite jossa client löytyy';
exports.minutes = 'Osoite josta minutes löytyy';
exports.history = 'Osoite josta history löytyy';

// Laitteella olevat sensorit
exports.sensors = [
    {'id': 'Sensorin ID', 'name': 'Selkokielinen nimi sensorille'}
];

// Tiedosto jonne virheet logitetaan
exports.logFile = '/var/log/temperature_errors.log';

// Lämpötilaraja
exports.limit = 30;

// Montako minuuttia odotetaan sähköpostien välissä
exports.cooldown = 180;

// Nousu edellisestä hälytyksestä jolloin cooldown ohitetaan
exports.override = 5;

// Sähköpostin asetuksia
exports.to = 'Vastaanottajat';
exports.from = 'Osoite jona palvelin esiintyy';
exports.alertTitle = 'Lämpötilahuomautuksen otsikko';
exports.systemTitle = 'Mittarivirheiden otsikko';

// Sähköpostipalvelimen osoite
exports.host = 'Sähköpostipalvelimen osoite';
exports.port = 'Sähköpostipalvelimen portti';