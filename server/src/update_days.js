const logger = require('./logger.js');

// Varataan poolista kantayhteys
exports.update = function(aSocket, aMysqlPool) {
    aMysqlPool.getConnection((err, connection) => {
        if (err) {
            logger.write('Tietokantavirhe: ' + err.message);
        }
        else {
            insertAverages(aSocket, connection);
        }
    });
}

// Lasketaan minimi, keskiarvo ja maksimi jokaiselle sensorille
function insertAverages(aSocket, aConnection) {
    let query  = 'INSERT INTO days (sensor, min, avg, max) ';
        query += 'SELECT sensor, MIN(temperature) AS min, ROUND(AVG(temperature), 1) AS avg, MAX(temperature) AS max FROM minutes ';
        query += 'WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 1 DAY) GROUP BY sensor;';

    aConnection.query(query, (err) => {
        if (err) {
            stop('Tietokantavirhe: ' + err.message, aConnection);
        }
        else {
            selectAverages(aSocket, aConnection);
        }
    });
}

// Haetaan kannasta uudet tiedot (suoritetaan kerran vuorokaudessa joten 12 tuntia pitäisi rajata liian vanhat pois)
function selectAverages(aSocket, aConnection) {
    let query  = 'SELECT sensor, timestamp, min, avg, max FROM days x ';
        query += 'INNER JOIN (SELECT MAX(id) AS id FROM days WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 12 HOUR) GROUP BY sensor) y ';
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

// Lähetetään tiedot käyttäjille
function updateClients(aSocket, aConnection, aResponse) {
    aResponse.forEach((row) => {
        aSocket.emit('Update days', JSON.stringify(row));
    });

    aConnection.release();
}

function stop(aMessage, aConnection) {
    logger.write(__filename, aMessage);
    aConnection.release();
}