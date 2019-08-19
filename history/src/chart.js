import chart from 'chart.js';
import moment from 'moment';

export default class {
    constructor(aContainer) {
        this.last = null;
        this.chart = null;
        this.container = aContainer;
    }

    set(aData) {
        let max = [];
        let avg = [];
        let min = [];
        let index = null;
        let values = null;

        this.last = moment().hours(0).minutes(0).seconds(0);
        let timestamp = moment(this.last).subtract(1, 'year');

        // Lisätään iteraattori -timestamppia kunnes se saavuttaa nykyhetken
        while (timestamp.diff(this.last) < 0) {
            timestamp.add(1, 'day');

            index = timestamp.format();
            values = {'max': null, 'avg': null, 'min': null};

            if (typeof aData[index] !== 'undefined') {
                values = aData[index];
                this.checkLimits(values['min'], values['max']);
            }

            max.push({'x': index, 'y': values['max']});
            avg.push({'x': index, 'y': values['avg']});
            min.push({'x': index, 'y': values['min']});
        }

        // Alustetaan kuvaaja jos sitä ei vielä ole
        if (this.chart === null) {
            this.createChart(min, avg, max);
            window.temperatures.resize();
        }
        else {
            this.chart.data.datasets[0].data = max;
            this.chart.data.datasets[1].data = avg;
            this.chart.data.datasets[2].data = min;
            this.chart.update();
        }
    }

    add(aTimestamp, aMin, aAvg, aMax) {
        if (this.chart !== null) {
            let timestamp = moment(aTimestamp);

            let max = this.chart.data.datasets[0].data;
            let avg = this.chart.data.datasets[1].data;
            let min = this.chart.data.datasets[2].data;

            // Lisätään viimeisin -timestamppia kunnes saavutetaan uusi
            while (this.last.diff(timestamp) < 0) {
                this.last.add(1, 'day');

                if (this.last.diff(timestamp) < 0) {
                    max.shift();
                    avg.shift();
                    min.shift();

                    max.push({'x': this.last.format(), 'y': null});
                    avg.push({'x': this.last.format(), 'y': null});
                    min.push({'x': this.last.format(), 'y': null});
                }
            }

            max.shift();
            avg.shift();
            min.shift();

            max.push({'x': this.last.format(), 'y': aMax});
            avg.push({'x': this.last.format(), 'y': aAvg});
            min.push({'x': this.last.format(), 'y': aMin});

            // Tarkistetaan onko min & max yhä kunnossa
            this.checkLimits(aMin, aMax);

            // Arvot käyttöön
            this.chart.data.datasets[0].data = max;
            this.chart.data.datasets[1].data = avg;
            this.chart.data.datasets[2].data = min;
            this.chart.update();
        }
    }

    checkLimits(aMin, aMax) {
        if (window.temperatures.max < aMax) {
            window.temperatures.setMax(aMax);
        }

        if (window.temperatures.min > aMin) {
            window.temperatures.setMin(aMin);
        }
    }

    updateLimits() {
        if (this.chart !== null) {
            this.chart.config.options.scales.yAxes[0].ticks.suggestedMin = Math.floor(window.temperatures.min - 0.2);
            this.chart.config.options.scales.yAxes[0].ticks.suggestedMax = Math.ceil(window.temperatures.max + 0.2);
            this.chart.update();
        }
    }

    createChart(aMin, aAvg, aMax) {
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
                    'label': 'Ylin lämpötila',
					'data': aMax,
					'type': 'line',
					'fill': false,
                    'pointRadius': 0,
                    'pointHoverRadius': 0,
					'lineTension': 0,
                    'borderWidth': 2,
                    'borderColor': 'rgba(235, 140, 140, 1.0)'

                },
                {
					'label': 'Keskiarvo',
					'data': aAvg,
					'type': 'line',
					'fill': false,
                    'pointRadius': 0,
                    'pointHoverRadius': 0,
					'lineTension': 0,
                    'borderWidth': 2,
                    'borderColor': 'rgba(140, 235, 140, 1.0)'
                },
                {
					'label': 'Alin lämpötila',
					'data': aMin,
					'type': 'line',
					'fill': false,
                    'pointRadius': 0,
                    'pointHoverRadius': 0,
					'lineTension': 0,
                    'borderWidth': 2,
                    'borderColor': 'rgba(140, 140, 235, 1.0)'
                }]
			},
			'options': {
                'scales': {
                    'xAxes': [{
                        'type': 'time',
                        'distribution': 'series',
                        'time': {
                            'unit': 'month',
                            'displayFormats': {
                                'month': 'MM.YYYY'
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
                    'mode': 'label',
                    'intersect': false,
                    'callbacks': {
                        'title': (title) => {
                            return moment(title[0].xLabel).format('DD.MM.YYYY');
                        },
                        'label': (item) => {
                            return this.chart.data.datasets[item.datasetIndex].label + ': ' + item.yLabel.toFixed(1) + ' \u00B0C';
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