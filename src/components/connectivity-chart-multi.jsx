import React, { Component } from 'react';
import Chart from 'chart.js';

class ConnectivityChartMultiple extends Component {
  constructor(props: Props) {
    super(props);
    this.state = {
      chart: null
    };
  }

  formatTotals(totals) {
    return [
      totals.num4G,
      totals.num3G,
      totals.num2G,
    ]
  }

  render() {
    return (
      <canvas ref={el => this.canvasEl = el} width="400" height="400"></canvas>
    )
  }

  createChart() {
    console.log('Create Chart')
    console.dir(this.props)
    let ctx = this.canvasEl.getContext("2d");
    let totals = this.formatTotals(this.props.totals);
    let chart = new Chart(ctx,{
      type: 'pie',
      data: {
        datasets: [{
          data: totals,
          backgroundColor: [
            'rgb(0, 255, 0)',
            'rgb(245, 165, 0)',
            'rgb(255, 0, 0)',
          ]
        }],
        labels: [
          '4G Connectivity',
          '3G Connectivity',
          '2G Connectivity',
        ],
      },
      options: {
        animation: {
          duration: 0
        },
        legend: {
          position: 'bottom'
        }
      }
    });
    this.setState(chart);
  }

  updateChart() {
    let chart = this.state.chart;
    chart.data.datasets[0].data = this.formatTotals(this.props.totals);
    chart.update();
  }

  componentDidMount() {
    if (! this.props.totals) {
      return;
    }
    this.createChart();
  }

  componentDidUpdate() {
    if (! this.props.totals) {
      return;
    }
    if (this.state.chart) {
      this.updateChart();
    } else {
      this.createChart();
    }
  }
}

export default ConnectivityChartMultiple
