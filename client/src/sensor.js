import Chart from './chart.js';
import moment from 'moment';

export default class {
    constructor(aTitle) {
        this.elements = {
            'wrap': this.newElement('div', 'sensor'),
            'title': this.newElement('h1', 'title'),
            'error': this.newElement('h1', 'error'),
            'charts': this.newElement('div', 'charts'),
            'hours': this.newElement('div', 'hours'),
            'minutes': this.newElement('div', 'minutes')
        };

        this.elements.title.appendChild(document.createTextNode(aTitle));
        this.elements.error.appendChild(document.createTextNode('Ei yhteyttä mittariin'));

        this.elements.charts.appendChild(this.elements.hours);
        this.elements.charts.appendChild(this.elements.minutes);

        this.elements.wrap.appendChild(this.elements.error);
        this.elements.wrap.appendChild(this.elements.title);
        this.elements.wrap.appendChild(this.elements.charts);

        document.getElementById('wrapper').appendChild(this.elements.wrap);

        this.charts = {
            'hour': new Chart(this.elements.hours, 'hour'),
            'minute': new Chart(this.elements.minutes, 'minute')
        };
    }

    newElement(aType, aClass) {
        let element = document.createElement(aType);
            element.className = aClass;

        return element;
    }

    initMinutes(aMinutes) {
        let minutes = {};

        aMinutes.forEach((minute) => {
            minutes[this.roundTimestamp(minute.timestamp, 'minute')] = minute.temperature;
        });

        this.charts['minute'].set(minutes);
    }

    initHours(aHours) {
        let hours = {};

        aHours.forEach((hour) => {
            hours[this.roundTimestamp(hour.timestamp, 'hour')] = hour.temperature;
        });

        this.charts['hour'].set(hours);
    }

    updateMinutes(aTimestamp, aTemperature) {
        this.charts['minute'].add(this.roundTimestamp(aTimestamp, 'minute'), aTemperature);
    }

    updateHours(aTimestamp, aTemperature) {
        this.charts['hour'].add(this.roundTimestamp(aTimestamp, 'hour'), aTemperature);
    }

    updateLimits() {
        this.charts['hour'].updateLimits();
        this.charts['minute'].updateLimits();
    }

    roundTimestamp(aTimestamp, aType) {
        let timestamp = moment(aTimestamp);

        if (aType === 'hour') {
            if (timestamp.minutes() > 30) {
                timestamp.add(1, 'hour');
            }

            timestamp.minutes(0).seconds(0);
        }
        else {
            if (timestamp.seconds() > 30) {
                timestamp.add(1, 'minute');
            }

            timestamp.seconds(0);
        }

        return timestamp.format();
    }

    showError() {
        this.elements.error.style.display = 'block';
    }

    hideError() {
        this.elements.error.style.display = 'none';
    }

    resize(aWidth, aHeight) {
        let width = Math.floor(aWidth);
        let height = Math.floor(aHeight - this.elements.title.offsetHeight);

        this.elements.title.style.width = width + 'px';
        this.elements.error.style.width = width + 'px';
        this.elements.charts.style.width = width + 'px';
        this.elements.charts.style.height = height + 'px';

        this.elements.hours.style.width = Math.floor(aWidth * 0.8) + 'px';
        this.elements.hours.style.height = height + 'px';

        this.elements.minutes.style.width = Math.floor(aWidth * 0.2) + 'px';
        this.elements.minutes.style.height = height + 'px';
    }
}