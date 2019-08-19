import moment from 'moment';

export default class {
    constructor(aTitle) {
        this.elements = {
            'wrap': this.newElement('div', 'sensor'),
            'title': this.newElement('h1', 'title'),
            'error': this.newElement('h1', 'error'),
            'minutes': this.newElement('div', 'minutes')
        };

        this.elements.title.appendChild(document.createTextNode(aTitle));
        this.elements.error.appendChild(document.createTextNode('Ei yhteyttä mittariin'));

        this.elements.wrap.appendChild(this.elements.title);
        this.elements.wrap.appendChild(this.elements.error);
        this.elements.wrap.appendChild(this.elements.minutes);

        document.getElementById('wrapper').appendChild(this.elements.wrap);
    }

    newElement(aType, aClass) {
        let element = document.createElement(aType);
            element.className = aClass;

        return element;
    }

    init(aMinutes) {
        aMinutes.forEach((minute) => {
            if (typeof minute.timestamp === 'string' && typeof minute.temperature === 'number') {
                this.update(minute.timestamp, minute.temperature);
            }
        });
    }

    update(aTimestamp, aTemperature) {
        let timestamp = document.createElement('span');
            timestamp.appendChild(document.createTextNode(moment(aTimestamp).format('DD.MM.YYYY HH:mm:ss')));

        let temperature = document.createElement('span');
            temperature.appendChild(document.createTextNode(aTemperature.toFixed(1) + ' \u00B0C'));

        let row = this.newElement('div', 'row');
            row.appendChild(timestamp);
            row.appendChild(temperature);
            
        if (typeof this.elements.minutes.childNodes[0] === 'undefined') {
            this.elements.minutes.appendChild(row);
        }
        else {
            this.elements.minutes.insertBefore(row, this.elements.minutes.childNodes[0]);
        }
    }

    showError() {
        this.elements.error.style.display = 'block';
    }

    hideError() {
        this.elements.error.style.display = 'none';
    }
}