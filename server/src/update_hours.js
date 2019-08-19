const moment = require('moment');
const nodemailer = require('nodemailer');

const logger = require('./logger.js');
const settings = require('../settings.js');

// Varataan poolista kantayhteys
exports.update = function(aSocket, aMysqlPool) {
    aMysqlPool.getConnection((err, connection) => {
        if (err) {
            logger.write(__filename, 'Tietokantavirhe: ' + err.message);
        }
        else {
            deleteHours(aSocket, connection);
        }
    });
}

// Siivotaan hours -taulusta vanhat rivit
function deleteHours(aSocket, aConnection) {
    const query = 'DELETE FROM hours WHERE timestamp < DATE_SUB(NOW(), INTERVAL 2 MONTH);';

    aConnection.query(query, (err) => {
        if (err) {
            stop('Tietokantavirhe: ' + err.message, aConnection);
        }
        else {
            deleteMinutes(aSocket, aConnection);
        }
    });
}

// Siivotaan minutes -taulusta vanhat rivit
function deleteMinutes(aSocket, aConnection) {
    const query = 'DELETE FROM minutes WHERE timestamp < DATE_SUB(NOW(), INTERVAL 1 DAY);';

    aConnection.query(query, (err) => {
        if (err) {
            stop('Tietokantavirhe: ' + err.message, aConnection);
        }
        else {
            insertAverages(aSocket, aConnection);
        }
    });
}

// Lasketaan jokaiselle sensorille viimeisen tunnin keskiarvo
function insertAverages(aSocket, aConnection) {
    let query  = 'INSERT INTO hours (sensor, temperature) ';
        query += 'SELECT sensor, ROUND(AVG(temperature), 1) AS temperature FROM minutes ';
        query += 'WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 1 HOUR) GROUP BY sensor;';

    aConnection.query(query, (err) => {
        if (err) {
            stop('Tietokantavirhe: ' + err.message, aConnection);
        }
        else {
            selectAverages(aSocket, aConnection);
        }
    });
}

// Haetaan kannasta jokaisen sensorin uusin rivi (suoritetaan kerran tunnissa joten 30 minuuttia pitäisi rajata liian vanhat pois)
function selectAverages(aSocket, aConnection) {
    let query  = 'SELECT sensor, timestamp, temperature FROM hours x ';
        query += 'INNER JOIN (SELECT MAX(id) AS id FROM hours WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 30 MINUTE) GROUP BY sensor) y ';
        query += 'ON y.id = x.id;';

    aConnection.query(query, (err, res) => {
        if (err) {
            stop('Tietokantavirhe: ' + err.message, aConnection);
        }
        else if (!Array.isArray(res)) {
            stop('Tietokantavirhe: kysely ei palauttanut listaa', aConnection);
        }
        else {
            updateClients(aSocket, aConnection, res);
        }
    });
}

// Lähetetään käyttäjille rivit ja tarkistetaan että jokaiselle sensorille saatiin laskettua keskiarvo
function updateClients(aSocket, aConnection, aResponse) {
    let checklist = {};

    settings.sensors.forEach((sensor) => {
        checklist[sensor.id] = false;
    });

    aResponse.forEach((row) => {
        checklist[row.sensor] = true;
        aSocket.emit('Update hours', JSON.stringify(row));
    });

    // Jäikö checklist -listaan yhtään false -arvoa
    if (Object.values(checklist).includes(false)) {
        selectActiveAlert(aConnection);
    }
    else {
        aConnection.release();
    }
}

// Tarkistetaan onko virheestä lähetetty ilmoitus viimeisen päivän aikana, jos ei niin lähetetään
function selectActiveAlert(aConnection) {
    const query = "SELECT timestamp FROM alerts WHERE type = 'system' AND timestamp > DATE_SUB(NOW(), INTERVAL 1 DAY);";

    aConnection.query(query, (err, res) => {
        if (err) {
            stop('Tietokantavirhe: ' + err.message, aConnection);
        }
        else if (typeof res[0] === 'undefined') {
            sendAlert(aConnection);
        }
        else {
            aConnection.release();
        }
    });
}

// Lähetetään ilmoitus sähköpostiin
function sendAlert(aConnection) {
    let message  = moment().format('YYYY.MM.DD HH:mm') + ' - Viimeisen tunnin aikana sensorilta ei ole tullut lämpötilatietoja<br />';
        message += '<br />';
        message += 'Seuranta: ' + settings.address + '<br />';
        message += 'Minuutit: ' + settings.minutes + '<br />';
        message += 'Historia: ' + settings.history + '<br />';
    
    const transporter = nodemailer.createTransport({'host': settings.host, 'port': settings.port});
    const mailOptions = {'from': settings.from, 'to': settings.to, 'subject': settings.systemTitle, 'html': message};

    transporter.sendMail(mailOptions, (err) => {
        if (err) {
            stop('Sähköpostin lähettäminen epäonnistui: ' + err, aConnection);
        }
        else {
            insertAlert(aConnection);
        }
    });
}

// Tallennetaan lähetetty hälytys kantaan
function insertAlert(aConnection) {
    const query = "INSERT INTO alerts (type, temperature) VALUES ('system', 0);";

    aConnection.query(query, (err) => {
        if (err) {
            logger.write(__filename, 'Tietokantavirhe: ' + err.message);
        }

        aConnection.release();
    });
}

function stop(aMessage, aConnection) {
    logger.write(__filename, aMessage);
    aConnection.release();
}