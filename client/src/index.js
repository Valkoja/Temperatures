import Device from './device.js';

class Temperatures {
    constructor() {
        this.min = 100;
        this.max = 0;
        this.padding = 4;
        this.devices = [];
        this.timeout = null;

        window.addEventListener('resize', () => {
            this.resize();
        });

        if (Array.isArray(window.devices)) {
            window.devices.forEach((server) => {
                this.devices.push(new Device(server));        
            });
        }
    }

    resize(aTimeout = false) {
        if (aTimeout) {
            let sensors = 0;

            this.devices.forEach((device) => {
                sensors += Object.keys(device.sensors).length;
            });

            if (sensors > 0) {
                const elem = document.getElementById('wrapper');
                const width = elem.offsetWidth - (2 * this.padding);
                const height = (elem.offsetHeight - this.padding - (this.padding * sensors)) / sensors;

                this.devices.forEach((device) => {
                    device.resize(width, height);
                });
            }
        }
        else {
            clearTimeout(this.timeout);
            this.timeout = setTimeout(() => {this.resize(true)}, 200);
        }
    }

    setMin(aMin) {
        this.min = aMin;

        this.devices.forEach((device) => {
            device.updateLimits();
        });
    }

    setMax(aMax) {
        this.max = aMax;

        this.devices.forEach((device) => {
            device.updateLimits();
        });
    }
}

window.temperatures = new Temperatures();