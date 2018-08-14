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
      zoom: this.state.zoom,
      pitch: this.state.pitch,
      bearing: this.state.bearing
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
    Promise.all([shapesPromise, mapLoadPromise, mobilityPromise, schoolsPromise]).then(([geojson, map, mobility, schools]) => {
      // GeoJon file is read line by line and all admin are assigned an index
      // One potential problem: If geoJSON WCOLGEN02_ id are different from MOBILITY file admin
      // Here WCOLGEN02_ for admin 2 is 0 and is col_0_44_2_santiblanko the first row in the CSV file
      let index_admin = {}
      let admin_index = geojson.features.reduce((h, f, i) => {
       h[f.properties.admin_id] = i;
       index_admin[i] = f.properties.admin_id
       return h;
      }, {});

      let matrix = helperMatrix.getMatrix(mobility, admin_index);
      window.matrix = matrix
      let no_data_admin_lookup = matrix.reduce((h, v, i) => {
        if (v.filter(e => { return e > 0}).length === 0) {
          h[index_admin[i]] = 1
        }
        return h
      }, {})
      let diagonal = helperMatrix.getDiagonal(matrix);
      let geojson_for_borders = helperGeojson.empty_geojson()
      geojson = helperGeojson.updateGeojsonWithConvertedValues(
        geojson,
        diagonal,
        'activity_value',
        null,
        null,
        no_data_admin_lookup
      )
      this.setState({
        matrix : matrix,
        diagonal: diagonal,
        admin_index : admin_index,
        selected_features: geojson_for_borders,
        no_data_admin_lookup: no_data_admin_lookup,
        geojson: geojson
      });

      map.addLayer({
        id: 'regions',
        type: 'fill-extrusion',
        // Add a GeoJSON source containing place coordinates and information.
        source: {
          type: 'geojson',
          data: geojson
        },
        'paint': {
          'fill-extrusion-color': ['get', 'color'],

          'fill-extrusion-height': {
            "property": 'height',
            "stops": [
              [0, 0],
              [0.1, 1000],
              [0.5, 20000],
              [1,   30000]
            ]
          },
          'fill-extrusion-opacity': 1,
          'fill-extrusion-base': 1,
        }
      });
      console.log(geojson)
      // geojson.features = geojson.features.filter(f => { return !f.properties.height > 0})
      // console.log(geojson.features)
      map.addLayer({
        id: 'region-outlines',
        type: 'fill',
        // Add a GeoJSON source containing place coordinates and information.
        source: {
          type: 'geojson',
          data: geojson
        },
        layout: {
          visibility: 'visible'
        },
        paint: {
          'fill-opacity': 0.1,
          'fill-outline-color': 'black'
        }
      });

      // map.addLayer({
      //   id: 'schools',
      //   type: 'fill-extrusion',
      //   // Add a GeoJSON source containing place coordinates and information.
      //   source: {
      //     type: 'geojson',
      //     data: schools
      //   },
      //   'paint': {
      //     'fill-extrusion-color': {
      //       'property': 'height',
      //       'stops': [
      //         [0, 'white'],
      //         [0.00001, 'green'],
      //         [0.1, 'blue'],
      //         [1000, 'red']
      //       ]
      //     },
      //     'fill-extrusion-height': {
      //       "property": 'height',
      //       "stops": [
      //         [1, 0],
      //         [25, 1000],
      //         [1000, 65535]
      //       ]
      //     },
      //     'fill-extrusion-opacity': 0.9,
      //     'fill-extrusion-base': 1,
      //   }
      // });
      map.addLayer({
        id: 'schools',
        type: 'circle',
        // Add a GeoJSON source containing place coordinates and information.
        source: {
          type: 'geojson',
          data: schools
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
          "circle-pitch-scale": "map",
          "circle-pitch-alignment": "map",
          'circle-opacity': 0.8,
          'circle-color': 'orange' //['get', 'color']
        }
      });
      // map.getSource('regions').setData(geojson)
      // map.getLayer('regions').setPaintProperty(
      //   'fill-color',
      //   ['get', 'activity_value']
      // )

      // this.state.map.setPaintProperty(
      //   'regions',
      //   'fill-extrusion-color',
      //   {
      //     'property': 'height',
      //     'stops': [
      //       [1, 'white'],
      //       [25, 'orange'],
      //       [1000, 'firebrick']
      //     ]
      //   }
      // )
      // this.state.map.setPaintProperty(
      //   'regions',
      //   'fill-extrusion-height': {
      //     "property": 'height',
      //     "stops": [
      //       [1, 0],
      //       [25, 1000],
      //       [1000, 65535]
      //     ]
      //   }
      // )
//       map.getLayer('regions').setPaintProperty('fill-extrusion-color', {
//                 'property': 'height',
//                 'stops': [
//                   [1, 'white'],
//                   [25, 'orange'],
//                   [1000, 'firebrick']
//                 ]
//               })
// map.getLayer('regions').setPaintProperty('fill-extrusion-height', {
//           "property": 'height',
//           "stops": [
//             [1, 0],
//             [25, 1000],
//             [1000, 65535]
//           ]
//         })
      // this.state.map.setPaintProperty(
      //   'borders',
      //   'fill-outline-color',
      //   ['get', 'black']
      // )
      // this.state.map.setPaintProperty(
      //   'regions',
      //   'fill-outline-color',
      //   ['get', 'outline_color']
      // )
    })

    //     // Set data for schools when schools and map are available
    // Promise.all([schoolsPromise, mapLoadPromise]).then(([geojson, map]) => {
    //   map.getSource('schools').setData(geojson)
    // })

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
      // Add click event to update the Region layer when polygons are clicked
      map.on('click', 'regions', (e) => {
        console.log('Clicked On Admin Number', this.state.selected_admin )
        // selected_admin is string
        let selected_admin = e.features[0].properties.admin_id;
        let row_index = this.state.admin_index[selected_admin]
        console.log(row_index, selected_admin)
        let value_to_scale_by = 'mobility_value'
        let row = []
        let combined_vectors = []
        // Here selected_admin is integer
        // if (this.state.selected_admin === row_index) {
        if (this.state.selected_admins[selected_admin]) {
          delete this.state.selected_admins[selected_admin]
        } else {
          // Setting this selected_admin to integer
          this.state.selected_admins[selected_admin] = 1
        }
          console.log('Start create vector')
          // Create vector
          if (Object.keys(this.state.selected_admins).length > 0) {
            combined_vectors = helperMatrix.combine_vectors(
              this.state.admin_index,
              this.state.matrix,
              this.state.selected_admins
            )
          } else {
            combined_vectors = this.state.diagonal
          }

        console.log('Start update geojson')
        this.state.geojson = helperGeojson.updateGeojsonWithConvertedValues(
          this.state.geojson,
          combined_vectors,
          value_to_scale_by,
          this.state.selected_admins,
          this.state.admin_index,
          this.state.no_data_admin_lookup
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
          'fill-extrusion-color',
          ['get', 'color']
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

  changeMapPitch(e) {
    // pitch should be stored in event
    let pitch = e.target.value
    //Set pitch with "ease" to smooth tranisition
    this.state.map.easeTo({pitch: pitch})


  }

  changeMapBearing(e) {
    // bearing should be stored in event
    let bearing = e.target.value
    //set bearing with "ease" to smooth tranisition
    this.state.map.easeTo({bearing: bearing})
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
      'fill-extrusion-color',
      ['get', 'color']
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
          <Section title="Pitch">
            <InputGroup type="range" name="school" group={[
              { label: ' Map Pitch',
                min: '0',
                max: '60',
                value: this.state.map.pitch,
                onChange: this.changeMapPitch.bind(this),
                step: '2'
              }
            ]} onChange={(e) => {}} />
          </Section>
          <Section title="Bearing">
            <InputGroup type="range" name="school" group={[
              { label: ' Map Bearing',
                min: '0',
                max: '180',
                value: this.state.map.bearing,
                onChange: this.changeMapBearing.bind(this),
                step: '2'
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
