import Chart from './chart.js';
import moment from 'moment';

export default class {
    constructor(aTitle) {
        this.elements = {
            'wrap': this.newElement('div', 'sensor'),
            'title': this.newElement('h1', 'title'),
            'error': this.newElement('h1', 'error'),
            'chart': this.newElement('div', 'chart')
        };

        this.elements.title.appendChild(document.createTextNode(aTitle));
        this.elements.error.appendChild(document.createTextNode('Ei yhteyttä mittariin'));

        this.elements.wrap.appendChild(this.elements.title);
        this.elements.wrap.appendChild(this.elements.error);
        this.elements.wrap.appendChild(this.elements.chart);

        document.getElementById('wrapper').appendChild(this.elements.wrap);

        this.chart = new Chart(this.elements.chart);
    }

    newElement(aType, aClass) {
        let element = document.createElement(aType);
            element.className = aClass;

        return element;
    }

    init(aDays) {
        let days = {};

        aDays.forEach((day) => {
            let {timestamp, ...values} = day;

            days[this.roundTimestamp(timestamp)] = values;
        });

        this.chart.set(days);
    }

    update(aUpdate) {
        this.chart.add(this.roundTimestamp(aUpdate['timestamp']), aUpdate['min'], aUpdate['avg'], aUpdate['max']);
    }

    updateLimits() {
        this.chart.updateLimits();
    }

    roundTimestamp(aTimestamp) {
        return moment(aTimestamp).hours(0).minutes(0).seconds(0).format();
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
        this.elements.chart.style.width = width + 'px';
        this.elements.chart.style.height = height + 'px';
    }
}