import chart from 'chart.js';
import moment from 'moment';

export default class {
    constructor(aContainer, aType) {
        this.last = null;
        this.type = aType;
        this.chart = null;
        this.container = aContainer;
    }

    set(aData) {
        let data = [];
        let index = null;
        let value = null;
        let timestamp = null;

        // Nykyhetki- ja iteraattori -timestampit
        if (this.type === 'hour') {
            this.last = moment().minutes(0).seconds(0);
            timestamp = moment().subtract(30, 'day').minutes(0).seconds(0);
        }
        else {
            this.last = moment().seconds(0);
            timestamp = moment().subtract(1, 'hour').seconds(0);
        }

        // Lisätään iteraattori -timestamppia kunnes se saavuttaa nykyhetken
        while (timestamp.diff(this.last) < 0) {
            timestamp.add(1, this.type);

            index = timestamp.format();
            value = null;

            if (typeof aData[index] === 'number') {
                value = aData[index];
                this.checkLimits(value);
            }

            data.push({'x': index, 'y': value});
        }

        // Arvot kuvaajaan
        if (this.chart === null) {
            this.createChart(data);
            window.temperatures.resize();
        }
        else {
            this.chart.data.datasets[0].data = data;
            this.chart.update();
        }
    }

    add(aTimestamp, aTemperature) {
        if (this.chart !== null) {
            let timestamp = moment(aTimestamp);
            let data = this.chart.data.datasets[0].data;

            // Lisätään viimeisin -timestamppia kunnes saavutetaan uusi
            while (this.last.diff(timestamp) < 0) {
                this.last.add(1, this.type);

                if (this.last.diff(timestamp) < 0) {
                    data.shift();
                    data.push({'x': this.last.format(), 'y': null});
                }
            }

            data.shift();
            data.push({'x': this.last.format(), 'y': aTemperature});

            // Tarkistetaan onko min & max yhä kunnossa
            this.checkLimits(aTemperature);

            // Arvot käyttöön
            this.chart.data.datasets[0].data = data;
            this.chart.update();
        }
    }

    checkLimits(aValue) {
        if (window.temperatures.max < aValue) {
            window.temperatures.setMax(aValue);
        }

        if (window.temperatures.min > aValue) {
            window.temperatures.setMin(aValue);
        }
    }

    updateLimits() {
        if (this.chart !== null) {
            this.chart.config.options.scales.yAxes[0].ticks.suggestedMin = Math.floor(window.temperatures.min - 0.2);
            this.chart.config.options.scales.yAxes[0].ticks.suggestedMax = Math.ceil(window.temperatures.max + 0.2);
            this.chart.update();
        }
    }

    createChart(aData) {
        // Tyhjennetään container varmuuden vuoksi
        while(this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }

        // Luodaan canvas ja lisätään se containeriin
        this.canvas = document.createElement('canvas');
        this.container.appendChild(this.canvas);

        // Alustetaan chart.js
        this.chart = new chart(this.canvas, {
            'type': 'line',
			'data': {
				'datasets': [{
					'label': 'Lämpötila',
					'data': aData,
					'type': 'line',
					'fill': true,
                    'pointRadius': 0,
                    'pointHoverRadius': 0,
					'lineTension': 0,
                    'borderWidth': 2,
                    'borderColor': 'rgba(235, 140, 140, 1.0)',
                    'backgroundColor': 'rgba(255, 160, 160, 0.6)'
				}]
			},
			'options': {
                'scales': {
                    'xAxes': [{
                        'type': 'time',
                        'distribution': 'series',
                        'time': {
                            'unit': this.type === 'hour' ? 'day' : 'minute',
                            'displayFormats': {
                                'minute': 'HH:mm',
                                'day': 'DD.MM'
                            }
                        },
                        'gridLines': {
                            'display': false,
                        }
                    }],
                    'yAxes': [{
                        'ticks': {
                            'precision': 0,
                            'suggestedMin': Math.floor(window.temperatures.min - 0.2),
                            'suggestedMax': Math.ceil(window.temperatures.max + 0.2)
                        },
                        'gridLines': {
                            'color': 'rgba(0, 0, 0, 0.2)'
                        }
                    }]
                },
                'tooltips': {
                    'mode': 'index',
                    'intersect': false,
                    'callbacks': {
                        'title': (title) => {
                            return moment(title[0].xLabel).format('DD.MM HH:mm');
                        },
                        'label': (item) => {
                            return item.yLabel.toFixed(1) + ' astetta';
                        }
                    },
                    'displayColors': false
                },
                'legend': {
                    'display': false
                },
                'maintainAspectRatio': false
			}
        });
    }
}