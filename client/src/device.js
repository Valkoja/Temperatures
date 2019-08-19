import io from 'socket.io-client';
import Sensor from './sensor.js';

export default class {
    constructor(aServer) {
        this.sensors = {};

        this.client = io(aServer + '/clients');
        this.client.on('Init hours', this.initHours.bind(this));
        this.client.on('Init minutes', this.initMinutes.bind(this));
        this.client.on('Update hours', this.updateHours.bind(this));
        this.client.on('Update minutes', this.updateMinutes.bind(this));
        this.client.on('connect_error', this.showError.bind(this));
        this.client.on('reconnect', this.hideError.bind(this));
    }

    isValidInit(aInit) {
        let result = true;

        if (typeof aInit['sensor'] !== 'string' || typeof aInit['name'] !== 'string' || !Array.isArray(aInit['data'])) {
            result = false;
        }

        aInit['data'].forEach((row) => {
            if (typeof row.timestamp !== 'string' || typeof row.temperature !== 'number') {
                result = false;
            }
        });

        return result;
    }

    initMinutes(aPayload) {
        try {
            const init = JSON.parse(aPayload);

            if (!this.isValidInit(init)) {
                throw 'Invalid minute init data';
            }

            if (typeof this.sensors[init['sensor']] === 'undefined') {
                this.sensors[init['sensor']] = new Sensor(init['name']);
            }

            this.sensors[init['sensor']].initMinutes(init['data']);
        }
        catch(err) {
            console.error(err);
        }
    }

    initHours(aPayload) {
        try {
            const init = JSON.parse(aPayload);

            if (!this.isValidInit(init)) {
                throw 'Invalid hours init data';
            }

            if (typeof this.sensors[init['sensor']] === 'undefined') {
                this.sensors[init['sensor']] = new Sensor(init['name']);
            }

            this.sensors[init['sensor']].initHours(init['data']);
        }
        catch(err) {
            console.error(err);
        }
    }

    isValidUpdate(aUpdate) {
        if (typeof aUpdate['sensor'] !== 'string' || typeof aUpdate['timestamp'] !== 'string' || typeof aUpdate['temperature'] !== 'number') {
            return false;
        }

        return true;
    }

    updateMinutes(aPayload) {
        try {
            const update = JSON.parse(aPayload);

            if (!this.isValidUpdate(update)) {
                throw 'Invalid minute update';
            }
            else if (typeof this.sensors[update['sensor']] === 'undefined') {
                throw 'Uninitialized sensor';
            }
            else {
                this.sensors[update['sensor']].updateMinutes(update['timestamp'], update['temperature']);
            }
        }
        catch(err) {
            console.error(err);
        }
    }

    updateHours(aPayload) {
        try {
            const update = JSON.parse(aPayload);

            if (!this.isValidUpdate(update)) {
                throw 'Invalid hour update';
            }
            else if (typeof this.sensors[update['sensor']] === 'undefined') {
                throw 'Uninitialized sensor';
            }
            else {
                this.sensors[update['sensor']].updateHours(update['timestamp'], update['temperature']);
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