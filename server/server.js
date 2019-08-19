const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const init = require('./src/init.js');
const update = require('./src/update.js');
const settings = require('./settings.js');
const logger = require('./src/logger.js');

// Tietokanta
const mysql = require('mysql');
const mysqlPool = mysql.createPool({'connectionLimit': 10, 'host': 'localhost', 'user': '_user_', 'password': '_pass_', 'database': '_db_'});

// Socket.io asiakkaille
const clients = io.of('/clients');

clients.on('connection', (socket) => {
    mysqlPool.getConnection((err, connection) => {
        if (err) {
            logger.write(__filename, 'Tietokantavirhe: ' + err.message);
        }
        else {
            init.days(socket, connection);
            init.hours(socket, connection);
            init.minutes(socket, connection);

            connection.release();
        }
    });
});

// Socket.io palvelimen scripteille
const scripts = io.of('/scripts');

scripts.on('connection', (socket) => {
    socket.on('New temperature', (payload) => {
        update.minutes(clients, mysqlPool, payload);
        socket.emit('confirm');
    });

    socket.on('Hourly update', () => {
        update.hours(clients, mysqlPool)
        socket.emit('confirm');
    });

    socket.on('Daily update', () => {
        update.days(clients, mysqlPool)
        socket.emit('confirm');
    });
});

// Uudelleenohjaukset, palvelin käyntiin
app.get('/minutes', (req, res) => {res.redirect(settings.minutes)});
app.get('/history', (req, res) => {res.redirect(settings.history)});
app.all('*', (req, res) => {res.redirect(settings.address)});

http.listen(80, () => {
    console.log('Palvelin käynnistyi, kuuntelee porttia 80');
    logger.write(__filename, 'Palvelin käynnistyi, kuuntelee porttia 80');
});