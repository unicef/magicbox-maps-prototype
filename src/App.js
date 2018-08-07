import React, { Component } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

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
import RadioGroup from './components/day-radio-group';
import Legend from './components/legend';
import ConnectivityChart from './components/connectivity-chart';

// Helpers
// import {calculate_index} from './helpers/helper-index-scores';
import apiConfig from './helpers/api-config';
import countConnectivity from './helpers/count-connectivity';
import config from './config';
import helperMatrix from './helpers/helper-matrix';
import helperGeojson from './helpers/helper-geojson';
import helperMap from './helpers/helper-map';

// Main style
import './App.css';
// Map colors
const mapColors = {
  // higher color will be shown where indexes are 1
  higher: '#c21500', // strong red; prev: #0068EA - pure blue
  // lower color will be shown where indexes are 0
  lower: '#ffc500' // light orange; prev: #DCDCDC - very light gray
}

mapboxgl.accessToken = apiConfig.accessToken
class App extends Component {
  constructor(props: Props) {
    super(props);
    this.state = helperMap.initializeMapState(config);
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
    let shapesPromise  = fetch(apiConfig.shapes).then((resp) => resp.json())
    let schoolsPromise = fetch(apiConfig.schools).then((resp) => resp.json())
    let mobilityMondayPromise =
      fetch(apiConfig.mobilityMon).then((resp) => resp.json())
    let mobilityTuesdayPromise =
      fetch(apiConfig.mobilityTue).then((resp) => resp.json())
    let mobilityWednesdayPromise =
      fetch(apiConfig.mobilityWed).then((resp) => resp.json())
    let mobilityThursdayPromise =
      fetch(apiConfig.mobilityThu).then((resp) => resp.json())
    let mobilityFridayPromise =
      fetch(apiConfig.mobilityFri).then((resp) => resp.json())
    let mobilitySaturdayPromise =
      fetch(apiConfig.mobilitySat).then((resp) => resp.json())
    let mobilitySundayPromise =
      fetch(apiConfig.mobilitySun).then((resp) => resp.json())
    let mapLoadPromise = new Promise((resolve, reject) => {
      map.on('load', (e) => {
        resolve(map)
      })
      map.on('error', (e) => {
        reject(map)
      })
    })

// Set data for regions when regions and map are availableD
Promise.all([
shapesPromise,
mapLoadPromise,
mobilityMondayPromise,
mobilityTuesdayPromise,
mobilityWednesdayPromise,
mobilityThursdayPromise,
mobilityFridayPromise,
mobilitySaturdayPromise,
mobilitySundayPromise])
.then(([geojson, map, mobilityMon, mobilityTue, mobilityWed, mobilityThu, mobilityFri, mobilitySat, mobilitySun]) => {
// GeoJon file is read line by line and all admin are assigned an index
// One potential problem: If geoJSON WCOLGEN02_ id are different from MOBILITY file admin
// Here WCOLGEN02_ for admin 2 is 0 and is col_0_44_2_santiblanko the first row in the CSV file
let admin_index = geojson.features.reduce((h, f, i) => {
h[f.properties.admin_id] = i;
return h;
}, {});

let mobility_alldays = [mobilityMon, mobilityTue, mobilityWed, mobilityThu, mobilityFri, mobilitySat, mobilitySun]

// initial fetch of mobility is set to Monday as default. Monday mobility has index 0 in the array of all mobility
let matrix = helperMatrix.getMatrix(mobility_alldays[0], admin_index);
let diagonal = helperMatrix.getDiagonal(matrix);

geojson = helperGeojson.updateGeojsonWithConvertedValues(geojson, diagonal, 'activity_value')

this.setState({
matrix: matrix,
diagonal: diagonal,
admin_index: admin_index,
        geojson: geojson,
        mobility_alldays: mobility_alldays
      });

      map.getSource('regions').setData(geojson)
    })


    // Set data for schools when schools and map are available
    Promise.all([schoolsPromise, mapLoadPromise]).then(([geojson, map]) => {
      map.getSource('schools').setData(geojson)
    })

    // Handle shapes data if any
    // shapesPromise.then(function(myJson) {
    //    // Calculate indexes
    //   myJson.features = calculate_index(
    //     myJson.features, 'population', 'pop'
    //   )
    //   myJson.features = calculate_index(
    //     myJson.features, 'threats', 'threats_index'
    //   )
    //   myJson.features = calculate_index(
    //     myJson.features, 'violence', 'violence_index'
    //   )
    //
    //   return myJson
    // })

    // Handle school data if any
    schoolsPromise.then((geojson) => {
      this.setState({
        connectivity_totals: countConnectivity(geojson.features)
      })
    })

    // When data arrives, process them in the background
    // to build a list of names for the search component
    Promise.all([schoolsPromise, shapesPromise])
    .then(([schoolsGeojson, shapesGeojson]) => {
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
        layout: {
          visibility: 'none'
        },
        paint: {
          'fill-opacity': 0.5
        }
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
            'base': 1.75,
            'stops':[[12, 2], [22, 180]]
          },
          'circle-color': ['get', 'color']
        }
      });

      // Add click event to update the Region layer when polygons are clicked
      map.on('click', 'regions', (e) => {
        let selected_admin = e.features[0].properties.admin_id;

        let row_index = this.state.admin_index[selected_admin]
        let row = []
        let value_to_paint_by = 'mobility_value'

        // If the same admin is clicked, give us back the activity (= diagonal)
        if (this.state.selected_admin === row_index) {
          this.setState({ selected_admin: null  }) // reset selected_admin
          value_to_paint_by = 'activity_value'
          row_index = null
          row = this.state.diagonal
        } else { // If a different admin is clicked, show its outward mobility
          this.setState({ selected_admin: row_index  })
          // Start creating vector
          for (let col_index = 0; col_index < Object.keys(this.state.admin_index).length; col_index++ ){
                row[col_index] = this.state.matrix[row_index][col_index];
          }
          row[row_index] = this.state.diagonal[row_index] // WHY THIS LINE??
        }

        console.log('Start update geojson')
        this.setState({
          geojson: helperGeojson.updateGeojsonWithConvertedValues(
            this.state.geojson,
            row, // array of values
            value_to_paint_by, // value type
            row_index
          )
        })
        console.log('Start apply geojson to map')
        // tell Map to update its data source
        this.state.map.getSource('regions').setData(this.state.geojson)

        this.state.map.setPaintProperty(
          'regions',
          'fill-color',
          ['get', value_to_paint_by]
        )
        console.log('End')
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

    // no socio-econ metric selected
    if (!matches.length) {
      // reset value of selected_admin, so that next time Daily Activity/Mobility is clicked, activity will be displayed rather than the mobility of the old selected_admin
      // also, none clicked means Daily Activity/Mobility is not clicked either, hence disabling day selection
      this.setState({
        selected_admin: null,
        daySelectDisabled: true
      })
      return
    }

    // build the aggregation query; at the same time check if day selection will be enabled or not
    let daySelectDisabled = true
    let aggregation_query =
      Array.prototype.slice.call(matches).reduce((q,t) => {
        // if Daily Activity/Mobility is checked, user can now select day
        if (t.value === 'activity_value') {
          daySelectDisabled = false
        }
        q.push(t.value)
        return q
      }, ['get'])

    this.setState({ daySelectDisabled: daySelectDisabled  })

    // Set new paint property to color the map
    this.state.map.setPaintProperty(
      'regions',
      'fill-color',
      aggregation_query
      //['get', 'activity_value']
    )
    this.state.map.setPaintProperty(
      'regions',
      'fill-outline-color',
      ['get', 'outline_color']
    )
  }

  changeDayPaintPropertyHandler(e) {
    // Get the checked input for which day of the week is selected
    let matches = document.querySelectorAll("input[name=day]:checked");

    if (!matches.length) {
      // no day selected
      return
    }

    // Since only 1 day can be selected at a time, we can point directly to that day
    let day_selected = matches[0].value;
    let index = parseInt(day_selected.slice(3), 10); // day_selected has the format 'day0', 'day1', etc.
    let updatedMatrix =
      helperMatrix.getMatrix(this.state.mobility_alldays[index], this.state.admin_index);

    let value_type = ''
    let values = []

    if (this.state.selected_admin) { // if currently in 'mobility' mode aka an admin is being selected
      value_type = 'mobility_value'
      let row_index = this.state.selected_admin;
      for (
        let col_index = 0;
        col_index < Object.keys(this.state.admin_index).length;
        col_index++
      ) {
          values[col_index] = updatedMatrix[row_index][col_index];
        }
    } else { // no admin selected means currently in 'activity' mode
      value_type = 'activity_value'
      values = helperMatrix.getDiagonal(updatedMatrix);
    }

    this.setState({
      matrix: updatedMatrix,
      geojson: helperGeojson.updateGeojsonWithConvertedValues(this.state.geojson, values, value_type, this.state.selected_admin)
    })

    // tell Map to update its data source
    this.state.map.getSource('regions').setData(this.state.geojson)

    // set new paint property to color the map
    this.state.map.setPaintProperty(
      'regions',
      'fill-color',
      ['get', value_type]
    )
  }

  render() {
    return (
      <div className="App">
        <div>
          <div ref={el => this.mapContainer = el} className="mainMap" />
        </div>
        <ControlPanel>
          <Select
            name="search"
            placeholder="School or municipality"
            multi={true}
            className="search"
            value={this.state.searchValue}
            onChange={(selectedOption) => {
              let regionFilter = null
              let schoolFilter = null

              // Set current state
              this.setState({searchValue: selectedOption})

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

          <Section title="Region Mobility">
            <InputGroup
              type="checkbox"
              name="region"
              group={[
                { value: 'activity_value',
                  label: 'Daily Activity/Mobility Index'}
              ]}
              onChange={this.changeRegionPaintPropertyHandler.bind(this)}
            />
            <RadioGroup
              disabled={this.state.daySelectDisabled}
              type="radio"
              name="day"
              group={[
                { value: 'day0',
                  label: 'Monday',
                  defaultChecked: 'checked'},
                { value: 'day1',
                  label: 'Tuesday'},
                { value: 'day2',
                  label: 'Wednesday'},
                { value: 'day3',
                  label: 'Thursday'},
                { value: 'day4',
                  label: 'Friday'},
                { value: 'day5',
                  label: 'Saturday'},
                { value: 'day6',
                  label: 'Sunday'}
              ]}
              onChange={this.changeDayPaintPropertyHandler.bind(this)}
            />
          </Section>

          {/* <Section title="Region Threats">
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
                label: 'Human Development Index' },
              { value: 'pop',
                label: 'Population' }
            ]} onChange={this.changeRegionPaintPropertyHandler.bind(this)} />
          </Section> */}

          <Section title="School Capabilities">
            <InputGroup type="checkbox" name="school" group={[
              { value: 'schools',
                label: 'Connectivity',
                onChange: this.displayLayerHandler.bind(this),
                defaultChecked: 'checked'
              }
            ]} onChange={(e) => {}} />
          </Section>

          <p className="controlPanel__footerMessage">The selected items will be considered when calculating the risk level of schools and areas.</p>

          <Section title="Connectivity Details">
            <ConnectivityChart totals={this.state.connectivity_totals}></ConnectivityChart>
          </Section>
        </ControlPanel>

        <Legend from={mapColors.lower} to={mapColors.higher} steps={10} leftText="Less" rightText="More" />
      </div>
    );
  }
}

export default App;
