const logger = require('./logger.js');
const minute = require('./update_minutes.js');
const hour = require('./update_hours.js');
const day = require('./update_days.js');

// Update minutes
exports.minutes = function(aSocket, aMysqlPool, aPayload) {
    try {
        const payload = JSON.parse(aPayload);

        if (typeof payload[0] !== 'string' || typeof payload[1] !== 'number') {
            throw 'Tietoja puuttuu';
        }

        minute.update(aSocket, aMysqlPool, payload[0], payload[1]);
    }
    catch(err) {
        logger.write(__filename, 'JSON virhe: ' + err);
    }
}

// Update hours
exports.hours = function(aSocket, aMysqlPool) {
    hour.update(aSocket, aMysqlPool);
}

// Update days
exports.days = function(aSocket, aMysqlPool) {
    day.update(aSocket, aMysqlPool);
}