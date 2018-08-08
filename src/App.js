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
import Section from './components/section';
import InputGroup from './components/input-group';
import Legend from './components/legend';
import ConnectivityChart from './components/connectivity-chart';

// Helpers
import {calculate_index} from './helpers/helper-index-scores';
import apiConfig from './helpers/api-config';
import countConnectivity from './helpers/count-connectivity';
import helperMatrix from './helpers/helper-matrix'
import helperGeojson from './helpers/helper-geojson'
import helperMap from './helpers/helper-map'

// Main style
import './css/App.css';
// Map colors
const mapColors = {
  // higher color will be shown where indexes are 1
  higher: '#ff0000',
  // lower color will be shown where indexes are 0
  lower: '#0068EA'
}

mapboxgl.accessToken = apiConfig.accessToken
class App extends Component {
  constructor(props: Props) {
    super(props);
    this.state = helperMap.initializeMapState(config)
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
    let mobilityPromise = fetch(apiConfig.mobility).then((resp) => resp.json())
    let mapLoadPromise = new Promise((resolve, reject) => {
      map.on('load', (e) => {
        resolve(map)
      })
      map.on('error', (e) => {
        reject(map)
      })
    })

    let mobility = []
    // Set data for regions when regions and map are available
    Promise.all([shapesPromise, mapLoadPromise, mobilityPromise]).then(([geojson, map, mobility]) => {
      // GeoJon file is read line by line and all admin are assigned an index
      // One potential problem: If geoJSON WCOLGEN02_ id are different from MOBILITY file admin
      // Here WCOLGEN02_ for admin 2 is 0 and is col_0_44_2_santiblanko the first row in the CSV file
      let admin_index = geojson.features.reduce((h, f, i) => {
       h[f.properties.admin_id] = i;
       return h;
      }, {});
      let matrix = helperMatrix.getMatrix(mobility, admin_index);
      let diagonal = helperMatrix.getDiagonal(matrix);
      geojson = helperGeojson.updateGeojsonWithConvertedValues(geojson, diagonal, 'activity_value')
      this.setState({
        matrix : matrix,
        diagonal: diagonal,
        admin_index : admin_index,
        geojson: geojson
      });
      map.getSource('regions').setData(geojson)
      this.state.map.setPaintProperty(
        'regions',
        'fill-color',
        ['get', 'activity_value']
      )
      this.state.map.setPaintProperty(
        'regions',
        'fill-outline-color',
        ['get', 'outline_color']
      )
    })

        // Set data for schools when schools and map are available
    Promise.all([schoolsPromise, mapLoadPromise]).then(([geojson, map]) => {
      map.getSource('schools').setData(geojson)
    })

    // Handle school data if any
    schoolsPromise.then((geojson) => {
      this.setState({
        connectivity_totals: countConnectivity(geojson.features)
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
    /*
    Define map's properties when it's first loaded.
    This includes:
    - Adding 2 layers: 'regions' (for socio-econ metrics) & 'schools' (for school info & connectivity)
    - Defining 'click' events for these 2 layers
    */
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
      });

      map.addLayer({
        id: 'schools',
        type: 'circle',
        // Add a GeoJSON source containing place coordinates and information.
        source: {
          type: 'geojson',
          data: {
            type: "FeatureCollection",
            features: []
          }
        },
        paint: {
          'circle-radius': {
            'property': 'people_moving_from_here',
            type: 'exponential',
            stops: [
              [124, 2],
              [34615, 10]
            ]
          },
          'circle-opacity': 0.8,
          'circle-color': 'orange' //['get', 'color']
        }
      });

      // Add click event to update the Region layer when polygons are clicked
      map.on('click', 'regions', (e) => {
        console.log('Clicked On Admin Number', this.state.selected_admin )
        let selected_admin = e.features[0].properties.admin_id;
        let row_index = this.state.admin_index[selected_admin]
        let value_to_scale_by = 'mobility_value'
        let row = []

        if (this.state.selected_admin === row_index) {
          this.state.selected_admin = null
          value_to_scale_by = 'activity_value'
          row_index = null
          row = this.state.diagonal
        } else {
          console.log('Start create vector')
          // Create vector
          this.state.selected_admin = row_index
          for (let col_index = 0; col_index < Object.keys(this.state.admin_index).length; col_index++ ){
            row[col_index] = this.state.matrix[row_index][col_index];
          }
          row[row_index] = this.state.diagonal[row_index]
        }
        console.log('Start update geojson')
        console.log(this.state)
        this.state.geojson = helperGeojson.updateGeojsonWithConvertedValues(
          this.state.geojson,
          row,
          value_to_scale_by,
          row_index
        )
        console.log('Start apply geojson to map')
        // tell Map to update its data source
        this.state.map.getSource('regions').setData(this.state.geojson)

        // build the aggregation query that will be used for color interpolation
        let atts_to_aggregate = []
        atts_to_aggregate.push("+")
        let query = []
        query.push("get")
        query.push("mobility_value")
        atts_to_aggregate.push(query)
        console.log('Start update colors')
        this.state.map.setPaintProperty(
          'regions',
          'fill-color',
          ['get', value_to_scale_by]
        )
        console.log('End')
        // this.state.map.setPaintProperty(
        //   'regions',
        //   'fill-outline-color',
        //   ['get', 'outline_color']
        // )
      })

      // Add click event to schools layer
      map.on('click', 'schools', (e) => {
        let coordinates = e.features[0].geometry.coordinates.slice()
        let schoolProperties = e.features[0].properties

        // output all properties besides color
        let html = Object.keys(schoolProperties)
          .filter((key) => key !== 'color')
          .reduce((acc, key) => {
          return acc + `<p><strong>${key}:</strong> ${schoolProperties[key]}</p>`
        }, '')

        new mapboxgl.Popup().setLngLat(coordinates).setHTML(html).addTo(map)
      })

      // Change the cursor to a pointer
      map.on('mouseenter', 'regions', (e) => {
        map.getCanvas().style.cursor = 'pointer'
      })

      map.on('mouseleave', 'regions', (e) => {
        map.getCanvas().style.cursor = ''
      })

      map.on('mouseenter', 'schools', (e) => {
        map.getCanvas().style.cursor = 'pointer'
      })

      map.on('mouseleave', 'schools', (e) => {
        map.getCanvas().style.cursor = ''
      })

    }.bind(this));
  }

  displayLayerHandler(e) {
    // layer name should be stored in element's 'value' property
    let layerName = e.target.getAttribute('value')
    // will be 'visible' or 'none'
    let currentState = e.target.checked ? 'visible' : 'none'

    // Set layer visibility
    this.state.map.setLayoutProperty(layerName, 'visibility', currentState)
  }

  changeRegionPaintPropertyHandler(e) {
    // Get all checked inputs for regions
    let matches = document.querySelectorAll("input[name=region]:checked");
    console.dir(matches)
    // Make 'regions' layer visible if there are matches
    this.state.map.setLayoutProperty('regions', 'visibility', matches.length ? 'visible' : 'none')

    if (!matches.length) {
      // no region selected
      return
    }

    // build the aggregation query
    let atts_to_aggregate =
      Array.prototype.slice.call(matches).reduce((a,t) => {
        a.push(['get', t.value])
        return a
      }, ['+'])

    console.log('atts_to_aggregate' + JSON.stringify(atts_to_aggregate))
    // Set new paint property to color the map
    this.state.map.setPaintProperty(
      'regions',
      'fill-color',
      ['get', 'activity_value']
    )
  }

  render() {
    return (
      <div className="App">
        <div>
          <div ref={el => this.mapContainer = el} className="mainMap" />
        </div>
        <ControlPanel>
          <Section title="Region Mobility">
            <InputGroup
              type="checkbox"
              name="region"
              group={[
                {
                  defaultChecked: 'checked',
                  value: 'activity_value',
                  label: 'Mobility Index'}
              ]}
              onChange={this.changeRegionPaintPropertyHandler.bind(this)}
            />
          </Section>



          <Section title="Towns">
            <InputGroup type="checkbox" name="school" group={[
              { value: 'schools',
                label: 'Connectivity points',
                onChange: this.displayLayerHandler.bind(this),
                defaultChecked: 'checked'
              }
            ]} onChange={(e) => {}} />
          </Section>

{/*     <p className="controlPanel__footerMessage">The selected items will be considered when calculating the risk level of schools and areas.</p>
*/}
        </ControlPanel>


        <Legend from={mapColors.lower} to={mapColors.higher} steps={10} leftText="Less" rightText="More" />
      </div>
    );
  }
}


export default App;
