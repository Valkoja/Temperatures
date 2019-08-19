import io from 'socket.io-client';
import Sensor from './sensor.js';

export default class {
    constructor(aServer) {
        this.sensors = {};

        this.client = io(aServer + '/clients');
        this.client.on('Init days', this.init.bind(this));
        this.client.on('Update days', this.update.bind(this));
        this.client.on('connect_error', this.showError.bind(this));
        this.client.on('reconnect', this.hideError.bind(this));
    }

    isValidRow(aRow) {
        if (typeof aRow['timestamp'] !== 'string' || typeof aRow['min'] !== 'number' || typeof aRow['avg'] !== 'number' || typeof aRow['max'] !== 'number') {
            return false;
        }

        return true;
    }

    init(aPayload) {
        try {
            const init = JSON.parse(aPayload);

            if (typeof init['sensor'] !== 'string' || typeof init['name'] !== 'string' || !Array.isArray(init['data'])) {
                throw 'Invalid init data';
            }

            init['data'].forEach((row) => {
                if (!this.isValidRow(row)) {
                    throw 'Invalid init data';
                }
            });

            if (typeof this.sensors[init['sensor']] === 'undefined') {
                this.sensors[init['sensor']] = new Sensor(init['name']);
            }

            this.sensors[init['sensor']].init(init['data']);
        }
        catch(err) {
            console.error(err);
        }
    }

    update(aPayload) {
        try {
            const update = JSON.parse(aPayload);

            if (typeof update['sensor'] !== 'string' || !this.isValidRow(update)) {
                throw 'Invalid update';
            }
            else if (typeof this.sensors[update['sensor']] === 'undefined') {
                throw 'Uninitialized sensor';
            }
            else {
                this.sensors[update['sensor']].update(update);
            }
        }
        catch(err) {
            console.error(err);
        }
    }

    updateLimits() {
        Object.keys(this.sensors).forEach((i) => {
            this.sensors[i].updateLimits();
        });
    }

    showError() {
        Object.keys(this.sensors).forEach((i) => {
            this.sensors[i].showError();
        });
    }

    hideError() {
        Object.keys(this.sensors).forEach((i) => {
            this.sensors[i].hideError();
        });
    }

    resize(aWidth, aHeight) {
        Object.keys(this.sensors).forEach((i) => {
            this.sensors[i].resize(aWidth, aHeight);
        });
    }
}