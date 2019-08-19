const logger = require('./logger.js');
const settings = require('../settings.js');

exports.minutes = function(aSocket, aConnection) {
    const query = 'SELECT sensor, timestamp, temperature FROM minutes WHERE sensor IN (?) ORDER BY timestamp ASC;';
    executeQuery(aSocket, aConnection, query, 'Init minutes');
}

exports.hours = function(aSocket, aConnection) {
    const query = 'SELECT sensor, timestamp, temperature FROM hours WHERE sensor IN (?) ORDER BY timestamp ASC;';
    executeQuery(aSocket, aConnection, query, 'Init hours');
}

exports.days = function(aSocket, aConnection) {
    const query = 'SELECT sensor, timestamp, min, avg, max FROM days WHERE sensor IN (?) ORDER BY timestamp ASC;';
    executeQuery(aSocket, aConnection, query, 'Init days');
}

// Suoritetaan query, rajataan haku vain asetuksissa määriteltyihin sensoreihin
function executeQuery(aSocket, aConnection, aQuery, aEvent) {
    let input = [];

    settings.sensors.forEach((sensor) => {
        input.push(sensor.id);
    });

    aConnection.query(aQuery, [input], (err, res) => {
        if (err) {
            stop('Tietokantavirhe: ' + err.message, aConnection);
        }
        else if (!Array.isArray(res)) {
            stop('Tietokantavirhe: kysely ei palauttanut listaa', aConnection);
        }
        else {
            emitResults(aSocket, aEvent, res)
        }
    });
}

// Niputetaan kannasta tulleet rivit sensorin id:n perusteella ja lähetetään clienteille
function emitResults(aSocket, aEvent, aResponse) {
    let payload = {};

    settings.sensors.forEach((sensor) => {
        payload[sensor.id] = {'sensor': sensor.id, 'name': sensor.name, 'data': []};
    });

    aResponse.forEach((row) => {
        let {sensor, ...values} = row;
        payload[sensor].data.push(values);
    });

    Object.values(payload).forEach((sensor) => {
        aSocket.emit(aEvent, JSON.stringify(sensor));
    });
}

function stop(aMessage, aConnection) {
    logger.write(__filename, aMessage);
    aConnection.release();
}