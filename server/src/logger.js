const fs = require('fs');
const moment = require('moment');
const settings = require('../settings.js');

exports.write = function(aFilename, aMessage) {
    let fileHandle = null;

    try {
        fileHandle = fs.createWriteStream(settings.logFile, {'flags': 'a+'});
        fileHandle.write(moment().format('YYYY.MM.DD HH:mm:ss - ') + aFilename + ' - ' + aMessage + '\n');
    }
    catch(err) {
        console.error(err);
    }
    finally {
        fileHandle.destroy();
    }
}