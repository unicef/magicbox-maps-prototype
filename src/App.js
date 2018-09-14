import config from './config';
import 'mapbox-gl/dist/mapbox-gl.css';
import mapboxgl from 'mapbox-gl';
import React, { Component } from 'react';

// Third-party React components
import 'react-select/dist/react-select.css';
import 'react-virtualized/styles.css';
import 'react-virtualized-select/styles.css';

// Custom React components
import ConnectivityChart from './components/connectivity-chart';
import ControlPanel from './components/control-panel';
import Legend from './components/legend';
import InputGroup from './components/input-group';
import RadioGroup from './components/radio-group';
import Section from './components/section';

// Helpers
import apiConfig from './helpers/api-config';
import { calculate_index } from './helpers/helper-index-scores';
import helperGeojson from './helpers/helper-geojson';
import helperMap from './helpers/helper-map';
import helperMatrix from './helpers/helper-matrix';
import { getConnectivityTotals, setChartLabels, setConnectivityColor } from './helpers/helper-connectivity';

// Main style
import './css/App.css';
// Map colors
const mapColors = {
  // higher color will be shown where indexes are 1
  higher: '#c21500', // strong red; prev: #0068EA - pure blue
  // lower color will be shown where indexes are 0
  lower: '#ffc500', // light orange; prev: #DCDCDC - very light gray
  polygon_outline: '#3c2800' // very dark orange (brown tone) - border of the polygons
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

    // Set data for mobility when regions, mobility and map are available
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
      // here, h is the lookup table; f is each feature (which in this case is a polygon/a municipality region); i is the index of a given feature in the geojson
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

      map.getSource('baseline').setData(geojson)

      // Only uncomment the following lines if want to visualize Acitivity as soon as the app loads
      // this.state.map.setPaintProperty(
      //   'baseline',
      //   'fill-color',
      //   ['get', 'activity_value']
      // )
    })

    // Set data for vulnerabilities when regions and map are available
    Promise.all([shapesPromise, mapLoadPromise]).then(([geojson, map]) => {
      // Calculate indexes for the vulnerabilities metrics
      geojson.features = calculate_index(
        geojson.features, 'population', 'pop'
      )
      geojson.features = calculate_index(
        geojson.features, 'threats', 'threats_index'
      )
      geojson.features = calculate_index(
        geojson.features, 'violence', 'violence_index'
      )

      map.getSource('vulnerabilities').setData(geojson)
    })

    // Set data for schools when schools and map are available
    Promise.all([schoolsPromise, mapLoadPromise]).then(([geojson, map]) => {
      // Set colors on-the-fly for all kinds of connectivity
      setConnectivityColor(geojson)

      // Default connectivity to show is connectivityM
      this.setState({
        schools: geojson,
        connectivity_totals: getConnectivityTotals(geojson.features, 'M'),
        pie_labels: setChartLabels('M')
      })

      map.getSource('connectivity').setData(geojson)
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
    - Adding 3 layers: 'baseline', 'vulnerabilities' & 'connectivity'
    - Defining 'click' events for the layers where applicable
    */
    map.on('load', function(e) {

      map.addLayer({
        id: 'baseline',
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
          'fill-opacity': config.opacity,
          'fill-outline-color': mapColors.polygon_outline
        }
      });

      map.addLayer({
        id: 'vulnerabilities',
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
          'fill-opacity': config.opacity,
          'fill-outline-color': mapColors.polygon_outline
        }
      });

      map.addLayer({
        id: 'connectivity',
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
          'circle-color': ['get', 'color'] // this generic "get color" is referring to the connectivityM
        }
      });

      // Add click event to update the baseline mobility layer when polygons are clicked
      map.on('click', 'baseline', (e) => {

        if (this.state.map.getLayoutProperty('connectivity', 'visibility') === 'visible') {
          // don't take action on the baseline layer if the school layer is being shown
          return
        }

        // clicked_admin is string
        let clicked_admin = e.features[0].properties.admin_id;
        let values = []
        let value_to_paint_by = 'mobility_value'

        // if the clicked admin is already selected before, deselect it
        if (this.state.selected_admins[clicked_admin]) {
          delete this.state.selected_admins[clicked_admin]
        } else { // set it to Yes
          this.state.selected_admins[clicked_admin] = 1
        }

        // If there is at least 1 admin selected, use the combineVectors method to obtain the combined 'mobility' values.
        if (Object.keys(this.state.selected_admins).length > 0) {
          values = helperMatrix.combineVectors(
            this.state.admin_index,
            this.state.matrix,
            this.state.selected_admins
          )
        } else { // no admin selected means just show the diagonal i.e. the activity rather than mobiity
          values = this.state.diagonal
        }

        this.setState({
          geojson: helperGeojson.updateGeojsonWithConvertedValues(
            this.state.geojson,
            values, // array of values
            value_to_paint_by, // value type
            this.state.selected_admins
          )
        })
        // tell Map to update its data source
        this.state.map.getSource('baseline').setData(this.state.geojson)

        this.state.map.setPaintProperty(
          'baseline',
          'fill-color',
          ['get', value_to_paint_by]
        )
      })

      // Add click event to connectivity layer
      map.on('click', 'connectivity', (e) => {
        let coordinates = e.features[0].geometry.coordinates.slice()
        let schoolProperties = e.features[0].properties

        // output all properties besides color
        let html = Object.keys(schoolProperties)
          .filter((key) => key !== 'color' && key !== 'color_4G' &&  key !== 'color_3G' &&  key !== 'color_2G')
          .reduce((acc, key) => {
          return acc + `<p><strong>${key}:</strong> ${schoolProperties[key]}</p>`
        }, '')

        new mapboxgl.Popup().setLngLat(coordinates).setHTML(html).addTo(map)
      })

      // Change the cursor to a pointer
      map.on('mouseenter', 'baseline', (e) => {
        map.getCanvas().style.cursor = 'pointer'
      })

      map.on('mouseleave', 'baseline', (e) => {
        map.getCanvas().style.cursor = ''
      })

      map.on('mouseenter', 'connectivity', (e) => {
        map.getCanvas().style.cursor = 'pointer'
      })

      map.on('mouseleave', 'connectivity', (e) => {
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

    // disable the selection of connectivity type if this metric is not checked
    if (layerName === 'connectivity') {
      if (e.target.checked) {
        document.getElementsByName('connectivity_type').forEach(e => e.disabled = false)
      } else {
        document.getElementsByName('connectivity_type').forEach(e => e.disabled = true)
      }
    }
  }

  changeConnectivityPaintPropertyHandler(e) {
    let selectedType = e.target.getAttribute('value')
    let value_to_paint_by =
      selectedType === 'schools_m' ? 'color' :
      'color' + selectedType.substr(-3) // because selectedType will be e.g. "schools_4G" and the corresponding value to get is "color_4G"

    // Set new paint property to color the map
    this.state.map.setPaintProperty('connectivity', 'circle-color', ['get', value_to_paint_by])

    let type_to_display =
      selectedType === 'schools_m' ? 'M' : selectedType.substr(-2) // type will be either M or the last two characters i.e. 4G / 3G / 2G
    let schools = this.state.schools.features
    this.setState({
      connectivity_totals: getConnectivityTotals(schools, type_to_display),
      pie_labels: setChartLabels(type_to_display)
    })
  }

  changeMobilityPaintPropertyHandler(e) {
    // Get the checked input for whether or not activity/mobility is selected
    let matches = document.querySelectorAll("input[name=mobility]:checked");

    // Make the mobility layer visible if there are matches
    this.state.map.setLayoutProperty('baseline', 'visibility', matches.length ? 'visible' : 'none')

    // if activity/mobility is not selected
    if (!matches.length) {
      // reset value of selected_admins, so that next time Daily Activity/Mobility is clicked, activity will be displayed rather than the mobility of the previously selected admins
      // also, hide the gradient legend bar
      this.setState({ selected_admins: {}, legend_shown: false })

      // also, none clicked means Daily Activity/Mobility is not clicked either, hence disabling day selection
      document.getElementsByName('day').forEach(e => e.disabled = true)

      // re-enable vulnerabilities metrics
      document.getElementsByName('vulnerabilities').forEach(e => e.disabled = false)

      return
    }

    // show the gradient legend bar
    this.setState({ legend_shown: true })
    // disable vulnerabilities metrics
    document.getElementsByName('vulnerabilities').forEach(e => e.disabled = true)

    // build the aggregation query; at the same time check if day selection will be enabled or not
    let aggregation_query =
      Array.prototype.slice.call(matches).reduce((q,t) => {
        // if Baseline ACtivity/Mobility is checked, user can now select day
        if (t.value === 'baseline') {
          document.getElementsByName('day').forEach(e => e.disabled = false)
          q.push('activity_value')
        } else {
          q.push(t.value)
        }
        return q
      }, ['get'])

    // Set new paint property to color the map
    this.state.map.setPaintProperty('baseline', 'fill-color', aggregation_query)
  }

  changeDayPaintPropertyHandler(e) {
    // Get the checked input for which day of the week is selected
    let day_selected = e.target.getAttribute('value')
    let index = parseInt(day_selected.slice(3), 10); // day_selected has the format 'day0', 'day1', etc.
    let updatedMatrix =
      helperMatrix.getMatrix(this.state.mobility_alldays[index], this.state.admin_index);
    let updatedDiagonal =
      helperMatrix.getDiagonal(updatedMatrix);

    let value_type = ''
    let values = []

    if (Object.keys(this.state.selected_admins).length > 0) { // if currently in 'mobility' mode aka at least 1 admin is being selected
      value_type = 'mobility_value'
      values = helperMatrix.combineVectors(
        this.state.admin_index,
        updatedMatrix,
        this.state.selected_admins
      )
    } else { // no admin selected means currently in 'activity' mode
      value_type = 'activity_value'
      values = updatedDiagonal;
    }

    this.setState({
      matrix: updatedMatrix,
      diagonal: updatedDiagonal,
      geojson: helperGeojson.updateGeojsonWithConvertedValues(this.state.geojson, values, value_type, this.state.selected_admins)
    })

    // tell Map to update its data source
    this.state.map.getSource('baseline').setData(this.state.geojson)

    // Set new paint property to color the map
    this.state.map.setPaintProperty(
      'mobiity',
      'fill-color',
      ['get', value_type]
    )
  }

  changeVulnerabilitiesPaintPropertyHandler(e) {
    // Get all checked inputs for vulnerabilities
    let matches = document.querySelectorAll("input[name=vulnerabilities]:checked");

    // Make the vulnerabilities layer visible if there are matches
    this.state.map.setLayoutProperty('vulnerabilities', 'visibility', matches.length ? 'visible' : 'none')

    // no vulnerabilities metrics selected
    if (!matches.length) {
      // hide the gradient legend bar
      this.setState({ legend_shown: false })

      // re-enable mobility metric
      document.getElementsByName('mobility').forEach(e => e.disabled = false)

      return
    }

    // show the gradient legend bar
    this.setState({ legend_shown: true })

    // disable mobility metric
    document.getElementsByName('mobility').forEach(e => e.disabled = true)

    // build the aggregation query
    let atts_to_aggregate = Array.prototype.slice.call(matches).reduce((a,t) => {
      a.push(['get', t.value])
      return a
    }, ['+'])

    // Set new paint property to color the map
    this.state.map.setPaintProperty(
      'vulnerabilities',
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

    let noteMessage =
      <p className="controlPanel__footerMessage">The selected items will be considered when calculating the risk level of schools and areas.</p>

    let pieChart =
      <Section title="Connectivity Details">
        <ConnectivityChart
          totals={this.state.connectivity_totals}
          labels={this.state.pie_labels}
        ></ConnectivityChart>
      </Section>

    let gradientLegend =
      <Legend from={mapColors.lower} to={mapColors.higher} steps={10} leftText="Less" rightText="More"/>

    return (
      <div className="App">

        <div>
          <div ref={el => this.mapContainer = el} className={mainMap_class_name} />
        </div>

        <ControlPanel>

          <Section title="Region Mobility">
            <InputGroup
              type="checkbox"
              name="mobility"
              group={[
                { value: 'baseline',
                  label: 'Baseline Activity/Mobility Index'}
              ]}
              onChange={this.changeMobilityPaintPropertyHandler.bind(this)}
            />
            <RadioGroup
              disabled // because by default Activity/Mobility is not checked
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

          <Section title="Region Threats">
            <InputGroup
              type="checkbox"
              name="vulnerabilities"
              group={[
                { value: 'threats_index',
                  label: 'Natural Disasters Index' },
                { value: 'violence_index',
                  label: 'Violence Index' },
                { value: 'zika_risk',
                  label: 'Zika Risk Index' }
              ]}
              onChange={this.changeVulnerabilitiesPaintPropertyHandler.bind(this)}
           />
         </Section>

          <Section title="Region Vulnerabilities">
            <InputGroup
              type="checkbox"
              name="vulnerabilities"
              group={[
                { value: 'hdi',
                  label: 'Human Development Index (inverted)' },
                { value: 'pop',
                  label: 'Population' }
              ]} onChange={this.changeVulnerabilitiesPaintPropertyHandler.bind(this)}
            />
          </Section>

          <Section title="School Capabilities">
            <InputGroup type="checkbox" name="schools" group={[
              { value: 'connectivity',
                label: 'Connectivity',
                onChange: this.displayLayerHandler.bind(this),
                defaultChecked: 'checked'
              }
            ]} />
            <RadioGroup type="radio" name="connectivity_type"
              group={[
                { value: 'schools_m',
                  label: 'Internet Connectivity',
                  onChange: this.changeConnectivityPaintPropertyHandler.bind(this),
                  defaultChecked:'checked'
                },
                { value: 'schools_4G',
                  label: '4G Coverage',
                  onChange: this.changeConnectivityPaintPropertyHandler.bind(this),
                },
                { value: 'schools_3G',
                  label: '3G Coverage',
                  onChange: this.changeConnectivityPaintPropertyHandler.bind(this),
                },
                { value: 'schools_2G',
                  label: '2G Coverage',
                  onChange: this.changeConnectivityPaintPropertyHandler.bind(this),
                }
            ]} onChange={(e) => {}} />
          </Section>

          {noteMessage}

          {pieChart}

        </ControlPanel>

        {this.state.legend_shown ? gradientLegend : null}
      </div>
    );
  }
}

export default App;
