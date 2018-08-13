import React, { Component } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import config from './config'
// Third-party React components
import 'react-select/dist/react-select.css';
import 'react-virtualized/styles.css';
import 'react-virtualized-select/styles.css';
import Select from 'react-virtualized-select';
import createFilterOptions from 'react-select-fast-filter-options';

// Custom React components
import ControlPanel from './components/control-panel';

// Helpers
import apiConfig from './helpers/api-config';

// Main style
import './css/App.css';

mapboxgl.accessToken = apiConfig.accessToken
class App extends Component {
  constructor(props: Props) {
    super(props);
    this.state = {
      map: {},
      connectivity_totals: null,
      options: [],
      search_value: '',
      schools: {},
      regions: {},
      ...config.map
    };
  }

  componentDidMount() {
    const map = new mapboxgl.Map({
      container: this.mapContainer,
      style: 'mapbox://styles/mapbox/streets-v9',
      center: [this.state.lng, this.state.lat],
      zoom: this.state.zoom
    });

    this.setState({map});

    // Promises
    let shapesPromise  = fetch(apiConfig.shapes).then((response) => response.json())
    let schoolsPromise = fetch(apiConfig.schools).then((response) => response.json())

    // When data arrives, process them in the background
    // to build a list of names for the search component
    Promise.all([schoolsPromise, shapesPromise]).then(([schoolsGeojson, shapesGeojson]) => {
      return new Promise((resolve, reject) => {
        let webWorker = new Worker('ww-process-names.js')

        webWorker.onmessage = (event) => {
          resolve(event.data)
        }

        webWorker.onerror = (err) => {
          reject(err)
        }

        // send geojsons to worker
        webWorker.postMessage([schoolsGeojson, shapesGeojson])
      })
    }).then((options) => {
      this.setState({
        options,
        filter: createFilterOptions({options})
      })
    })

    // Make map respond when user zooms or moves it around
    map.on('move', () => {
      const { lng, lat } = map.getCenter();
      this.setState({
        lng: lng.toFixed(4),
        lat: lat.toFixed(4),
        zoom: map.getZoom().toFixed(2)
      });
    });
  }

  render() {
    let mainMap_class_name = config.login_required ? 'mainMap' : 'mainMap mainMap-noLogin'
    return (
      <div className="App">
        <div>
          <div ref={el => this.mapContainer = el} className={mainMap_class_name} />
        </div>
        <ControlPanel>
          <Select
            name="search"
            placeholder="School or municipality"
            multi={true}
            className="search"
            value={this.state.search_value}
            onChange={(selectedOption) => {
              let regionFilter = null
              let schoolFilter = null

              // Set current state
              this.setState({search_value: selectedOption})

              // If one of the school or municipality is selected from the dropdown list
              if (selectedOption.length) {
                // Create filter for regions to look into all 'NOMBRE's
                regionFilter = ['any'].concat(...selectedOption.map((input) => {
                  return [
                    ['==', ['get', 'NOMBRE_C'], input.value],
                    ['==', ['get', 'NOMBRE_D'], input.value],
                    ['==', ['get', 'NOMBRE_M'], input.value]
                  ]
                }))

                // Create filter for schools to look into every 'name'
                schoolFilter = ['any'].concat(selectedOption.map((input) => {
                  return ['==', ['get', 'name'], input.value]
                }))
              }

              // Set filters
              this.state.map.setFilter('regions', regionFilter)
              this.state.map.setFilter('schools', schoolFilter)
            }}
            filterOptions={this.state.filter}
            options={this.state.options}
            arrowRenderer={() => <i className="fas fa-search" />}
          />
        </ControlPanel>
      </div>
    );
  }
}

export default App;
