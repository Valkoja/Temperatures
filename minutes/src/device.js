import io from 'socket.io-client';
import Sensor from './sensor.js';

export default class {
    constructor(aServer) {
        this.sensors = {};

        this.client = io(aServer + '/clients');
        this.client.on('Init minutes', this.init.bind(this));
        this.client.on('Update minutes', this.update.bind(this));
        this.client.on('connect_error', this.showError.bind(this));
        this.client.on('reconnect', this.hideError.bind(this));
    }

    init(aPayload) {
        try {
            const init = JSON.parse(aPayload);

            if (typeof init['sensor'] !== 'string' || typeof init['name'] !== 'string' || !Array.isArray(init['data'])) {
                throw 'Invalid minute init data';
            }

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

            if (typeof update['sensor'] !== 'string' || typeof update['timestamp'] !== 'string' || typeof update['temperature'] !== 'number') {
                throw 'Invalid minute update';
            }
            else if (typeof this.sensors[update['sensor']] === 'undefined') {
                throw 'Uninitialized sensor';
            }
            else {
                this.sensors[update['sensor']].update(update['timestamp'], update['temperature']);
            }
        }
        catch(err) {
            console.error(err);
        }
    }

    showError() {
        Object.values(this.sensors).forEach((sensor) => {
            sensor.showError();
        });
    }

    hideError() {
        Object.values(this.sensors).forEach((sensor) => {
            sensor.hideError();
        });
    }
}