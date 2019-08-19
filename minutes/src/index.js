import Device from './device.js';

class Temperatures {
    constructor() {
        this.devices = [];

        if (Array.isArray(window.devices)) {
            window.devices.forEach((server) => {
                this.devices.push(new Device(server));        
            });
        }
    }
}

window.temperatures = new Temperatures();