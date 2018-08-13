import React, { Component } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import config from './config'
// Third-party React components
import 'react-select/dist/react-select.css';
import 'react-virtualized/styles.css';
import 'react-virtualized-select/styles.css';

// Custom React components
import ControlPanel from './components/control-panel';
import Section from './components/section';
import InputGroup from './components/input-group';
import Legend from './components/legend';

// Helpers
import {calculate_index} from './helpers/helper-index-scores';
import apiConfig from './helpers/api-config';
// Main style
import './css/App.css';
// Map colors
const mapColors = {
  // higher color will be shown where indexes are 1
  higher: '#0068EA',
  // lower color will be shown where indexes are 0
  lower: '#DCDCDC'
}

mapboxgl.accessToken = apiConfig.accessToken
class App extends Component {
  constructor(props: Props) {
    super(props);
    this.state = {
      map: {},
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
    let mapLoadPromise = new Promise((resolve, reject) => {
      map.on('load', (e) => {
        resolve(map)
      })

      map.on('error', (e) => {
        reject(map)
      })
    })

    // Set data for regions when regions and map are available
    Promise.all([shapesPromise, mapLoadPromise]).then(([geojson, map]) => {
      map.getSource('regions').setData(geojson)
    })

    // Handle shapes data
    shapesPromise.then((myJson) => {
      // Calculate indexes
      myJson.features = calculate_index(
        myJson.features, 'population', 'pop'
      )
      myJson.features = calculate_index(
        myJson.features, 'threats', 'threats_index'
      )
      myJson.features = calculate_index(
        myJson.features, 'violence', 'violence_index'
      )
      return myJson
    })

    map.on('move', () => {
      const { lng, lat } = map.getCenter();

      this.setState({
        lng: lng.toFixed(4),
        lat: lat.toFixed(4),
        zoom: map.getZoom().toFixed(2)
      });
    });

    map.on('load', function(e) {
      map.addLayer({
        id: 'regions',
        type: 'fill',
        // Add a GeoJSON source containing place coordinates and information.
        source: {
          type: 'geojson',
          data: {
            type: "FeatureCollection",
            features: []
          }
        },
        layout: {
          visibility: 'none'
        },
        paint: {
          'fill-opacity': 0.5
        }
      });

      // Change the cursor to a pointer
      map.on('mouseenter', 'regions', (e) => {
        map.getCanvas().style.cursor = 'pointer'
      })

      map.on('mouseleave', 'regions', (e) => {
        map.getCanvas().style.cursor = ''
      })

  }

  changeRegionPaintPropertyHandler(e) {
    // Get all checked inputs for regions
    let matches = document.querySelectorAll("input[name=region]:checked");

    // Change layer visibility if there are matches
    this.state.map.setLayoutProperty('regions', 'visibility', matches.length ? 'visible' : 'none')

    if (!matches.length) {
      // no region selected
      return
    }

    // build the aggregation query
    let atts_to_aggregate = Array.prototype.slice.call(matches).reduce((a,t) => {
      a.push(['get', t.value])
      return a
    }, ['+'])

    // Set new paint property to color the map
    this.state.map.setPaintProperty(
      'regions',
      'fill-color',
      // linear interpolation for colors going from lowerColor to higherColor accordingly to aggregation value
      ['interpolate',
        ['linear'],
        ['/', atts_to_aggregate, atts_to_aggregate.length-1],
        0, mapColors.lower,
        1, mapColors.higher
      ]
    )
  }

  render() {
    let mainMap_class_name = config.login_required ? 'mainMap' : 'mainMap mainMap-noLogin'
    return (
      <div className="App">
        <div>
          <div ref={el => this.mapContainer = el} className={mainMap_class_name} />
        </div>
        <ControlPanel>

          <Section title="Region Threats">
            <InputGroup type="checkbox" name="region" group={[
              { value: 'threats_index',
                label: 'Natural Disasters Index' },
              { value: 'violence_index',
                label: 'Violence Index' }
            ]} onChange={this.changeRegionPaintPropertyHandler.bind(this)} />
          </Section>

          <Section title="Region Vulnerabilities">
            <InputGroup type="checkbox" name="region" group={[
              { value: 'hdi',
                label: 'Human Development Index (inverted)' },
              { value: 'pop',
                label: 'Population' }
            ]} onChange={this.changeRegionPaintPropertyHandler.bind(this)} />
          </Section>

          <p className="controlPanel__footerMessage">The selected items will be considered when calculating the risk level of schools and areas.</p>

        </ControlPanel>
        <Legend from={mapColors.higher} to={mapColors.lower} steps={10} leftText="Most Risk" rightText="Least Risk" />
      </div>
    );
  }
}

export default App;
