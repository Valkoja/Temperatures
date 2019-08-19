const moment = require('moment');
const nodemailer = require('nodemailer');

const logger = require('./logger.js');
const settings = require('../settings.js');

// Varataan poolista kantayhteys
exports.update = function(aSocket, aMysqlPool, aSensor, aTemperature) {
    aMysqlPool.getConnection((err, connection) => {
        if (err) {
            logger.write(__filename, 'Tietokantavirhe: ' + err.message);
        }
        else {
            insertTemperature(aSocket, connection, aSensor, aTemperature);
        }
    });
}

// Viedään mittaustulos kantaan
function insertTemperature(aSocket, aConnection, aSensor, aTemperature) {
    let query = 'INSERT INTO minutes (sensor, temperature) VALUES (?, ?);';
    let input = [aSensor, aTemperature];

    aConnection.query(query, input, (err, res) => {
        if (err) {
            stop('Tietokantavirhe: ' + err.message, aConnection);
        }
        else if (typeof res.insertId === 'undefined') {
            stop('Tietokantavirhe: insert ei palauttanut insertId:tä', aConnection);
        }
        else {
            selectInsertedRow(aSocket, aConnection, res.insertId);
        }
    });
}

// Haetaan kantaan viety rivi
function selectInsertedRow(aSocket, aConnection, aID) {
    const query = 'SELECT sensor, timestamp, temperature FROM minutes WHERE id = ?;';
    const input = [aID];

    aConnection.query(query, input, (err, res) => {
        if (err) {
            stop('Tietokantavirhe: ' + err.message, aConnection);
        }
        else if (typeof res[0] === 'undefined') {
            stop('Tietokantavirhe: juuri lisättyä riviä ei löytynyt kannasta', aConnection);
        }
        else if (typeof res[0].sensor !== 'string' || typeof res[0].timestamp !== 'object' || typeof res[0].temperature !== 'number') {
            stop('Tietokantavirhe: puuttuvia tai virheellisiä tietoja', aConnection);
        }
        else {
            updateClients(aSocket, aConnection, res[0]);
        }
    });
}

// Lähetetään päivitys clienteille, tarkistetaan onko lämpötila hälytysrajan yläpuolella
function updateClients(aSocket, aConnection, aResponse) {
    aSocket.emit('Update minutes', JSON.stringify(aResponse));

    if (aResponse.temperature > settings.limit) {
        selectActiveAlert(aConnection, aResponse.timestamp, aResponse.temperature);
    }
    else {
        aConnection.release();
    }
}

// Onko lämpötilasta olemassa aktiivinen hälytys ja onko tarvetta lähettää uusi
function selectActiveAlert(aConnection, aTimestamp, aTemperature) {
    const query = 'SELECT timestamp, temperature FROM alerts WHERE type = ? AND timestamp > DATE_SUB(NOW(), INTERVAL ? MINUTE) ORDER BY TIMESTAMP DESC;';
    const input = ['temperature', settings.cooldown];

    aConnection.query(query, input, (err, res) => {
        if (err) {
            stop('Tietokantavirhe: ' + err.message, aConnection);
        }
        else if (typeof res[0] === 'undefined' || typeof res[0].temperature !== 'number' || aTemperature > res[0].temperature + settings.override) {
            sendAlert(aConnection, aTimestamp, aTemperature);
        }
        else {
            aConnection.release();
        }
    });
}

// Lähetetään hälytys
function sendAlert(aConnection, aTimestamp, aTemperature) {
    let message  = moment(aTimestamp).format('YYYY.MM.DD HH:mm') + ' - Lämpötila on ' + aTemperature + ' astetta (rajaksi asetettu ' + settings.limit + ')<br />';
        message += '<br />';
        message += 'Seuranta: ' + settings.address + '<br />';
        message += 'Minuutit: ' + settings.minutes + '<br />';
        message += 'Historia: ' + settings.history + '<br />';

    const transporter = nodemailer.createTransport({'host': settings.host, 'port': settings.port});
    const mailOptions = {'from': settings.from, 'to': settings.to, 'subject': settings.alertTitle + aTemperature + ' astetta.', 'html': message};

    transporter.sendMail(mailOptions, (err) => {
        if (err) {
            stop('Sähköpostin lähettäminen epäonnistui: ' + err, aConnection);
        }
        else {
            insertAlert(aConnection, aTemperature);
        }
    });
}

// Tallennetaan lähetetty hälytys kantaan
function insertAlert(aConnection, aTemperature) {
    const query = 'INSERT INTO alerts (type, temperature) VALUES (?, ?)';
    const input = ['temperature', aTemperature];

    aConnection.query(query, input, (err) => {
        if (err) {
            logger.write(__filename, 'Hälytyksen tallentaminen kantaan epäonnistui: ' + err.message);
        }

        aConnection.release();
    });
}

function stop(aMessage, aConnection) {
    logger.write(__filename, aMessage);
    aConnection.release();
}