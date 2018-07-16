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
import Legend from './components/legend';
import ConnectivityChart from './components/connectivity-chart';
// Helpers
import {calculate_index} from './helpers/helper-index-scores';
import {diagonal_activity} from './helpers/helper-index-scores';

import apiConfig from './helpers/api-config';
import countConnectivity from './helpers/count-connectivity';

// Main style
import './App.css';
// Map colors
const mapColors = {
  // higher color will be shown where indexes are 1
  higher: '#0068EA',
  // lower color will be shown where indexes are 0
  lower: '#DCDCDC'
}

mapboxgl.accessToken = apiConfig.accessToken
console.log(apiConfig)
class App extends Component {
  constructor(props: Props) {
    super(props);
    this.state = {
      map: {},
      lng: -74.2973,
      lat: 4.5709,
      zoom: 4.5,
      connectivityTotals: null,
      options: [],
      searchValue: '',
      schools: {},
      regions: {},
      admin_index : {},
      matrix : [],
      geojson:{}
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
    console.log('***')
    console.log(apiConfig);
    // Promises
    let shapesPromise  = fetch(apiConfig.shapes).then((response) => response.json())
    let schoolsPromise = fetch(apiConfig.schools).then((response) => response.json())
    let mapLoadPromise = new Promise((resolve, reject) => {
      map.on('load', (e) => {
        resolve(map)
      })

      map.on('error', (e) => {
        reject(map)
      })
    })

    function getMatrix(mobility, lookup) {
      //console.log(JSON.stringify(mobility))
      // hw is for height and width of matrix, i.e. the number of geo features high and wide
      let hw = Object.keys(lookup).length;
      console.log('hw', hw)
      // Mobility arrives in a two dimensional array
      // where first array is colomn names [origin, destination, person, journey]
      // and each following array is a mobility [col_0_1_2-santibanko, col_0_1_3-santiblanko, 32]
      let matrix = mobility.reduce((ary, row, i) => {
        // Create a new array of size 1122 when a new admin is found. This array can be considered as a new row
        //that is created everytime a origin id is found in the csv file. Later all the destination ID are
        // filled in for that row.
        if (Array.isArray(ary[lookup[row.id_origin]])) {
          if (lookup[row.id_destination]) {
            ary[lookup[row.id_origin]][lookup[row.id_destination]] =
            parseInt(row.people)
          } else{
            ary[lookup[row.id_origin]][lookup[row.id_destination]] = 0
          }
        } else {
          ary[lookup[row.id_origin]] = new Array(hw);
          ary[lookup[row.id_origin]].fill(0);
          ary[lookup[row.id_origin]][lookup[row.id_destination]] =
          parseInt(row.people)

        }

        return ary
      }, Array(hw))
      return matrix
    }

    function get_diagonal(matrix) {
      let mmm = matrix.reduce((a, e, i) => {
      a[i] = matrix[i][i] || 0
    // console.log(a.length,i, matrix[i][i], '****')
      return a
      }, []);
      return mmm
    }

    console.log(apiConfig.mobility)
    let mobilityPromise = fetch(apiConfig.mobility).then((response) => response.json())
    let admin_index = null;
    let mobility = []
    // Set data for regions when regions and map are available
    Promise.all([shapesPromise, mapLoadPromise, mobilityPromise]).then(([geojson, map, mobility]) => {
      //GeoJon file is read line by line and all admin are assigned an index
      //One potential problem: If geoJSON WCOLGEN02_ id are different from MOBILITY file admin
      //Here WCOLGEN02_ for admin 2 is 0 and is col_0_44_2_santiblanko the first row in the CSV file
      let admin_index = geojson.features.reduce((h, f, i) => {
        h[f.properties.admin_id] = i;
        return h;
      }, {});

      let matrix = getMatrix( mobility , admin_index);
      console.log('matrix')
      console.log(matrix)
      let diagonal = get_diagonal(matrix);
      let max = null
      diagonal.forEach((ele , i) =>{
        if(i == 0){
          max = ele
        }
        else if( ele > max){
          max = ele
        }
      })

      geojson.features.forEach((f, i) =>{
        if(diagonal[i] >= max/4){
          f.properties.activity_index = diagonal[i]/max || 0
        } else{
          f.properties.activity_index = (diagonal[i] * 4 ) / max || 0
        }
      })

      this.setState({matrix : matrix ,
        admin_index : admin_index,
        geojson: geojson});

      console.log(geojson)
      map.getSource('regions').setData(geojson)
    })



    // Set data for schools when regions and map are available
    Promise.all([schoolsPromise, mapLoadPromise]).then(([geojson, map]) => {
      map.getSource('schools').setData(geojson)
    })

    // Handle shapes data


    // Handle school data
    schoolsPromise.then((geojson) => {
      this.setState({
        connectivityTotals: countConnectivity(geojson.features)
      })
    })

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

      map.on('click', 'regions', (e) => {
        console.log('Clicked On Admin Number' )
        console.dir(e.features[0].properties.WCOLGEN02_)
        let row_index = e.features[0].properties.WCOLGEN02_;
        console.log(row_index)
        let row = []
        for (var col_index = 0; col_index < Object.keys(this.state.admin_index).length; col_index++ ){
            console.log('Row Index');
            console.log(this.state.matrix[row_index]);
            console.log(this.state.matrix[row_index][col_index])
            row[col_index] = this.state.matrix[row_index][col_index] || 0
        }

        let max = null

        row.forEach((ele , i) =>{
          if(i == 0){
            max = ele
          }
          else if( ele > max){
            max = ele
          }
        })
        //index : col 1, col2 , .....

        this.state.geojson.features.forEach((f, i) =>{
          if(row[i] >= max/4){
            f.properties.mobility_value = row[i]/max
          } else{
            f.properties.mobility_value = row[i] * 4 / max
          }
        })

        this.state.map.getSource('regions').setData(this.state.geojson)
        let atts_to_aggregate = []
        atts_to_aggregate.push("+")
        let query = []
        query.push("get")
        query.push("mobility_value")
        atts_to_aggregate.push(query)

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
      map.on('mouseenter', 'schools', (e) => {
        map.getCanvas().style.cursor = 'pointer'
      })

      map.on('mouseleave', 'schools', (e) => {
        map.getCanvas().style.cursor = ''
      })

    map.on('mouseenter', 'regions', (e) => {
      map.getCanvas().style.cursor = 'pointer'
    })

    map.on('mouseleave', 'regions', (e) => {
      map.getCanvas().style.cursor = ''
    })
  }.bind(this));
  }

  displayLayerHandler(e) {
    // layer name should be stored in element's value property
    let layerName = e.target.getAttribute('value')
    // will be 'visible' or 'none'
    let currentState = e.target.checked ? 'visible' : 'none'

    // Set layer visibility
    this.state.map.setLayoutProperty(layerName, 'visibility', currentState)
  }

  changeRegionPaintPropertyHandler(e) {
    // Get all checked inputs for regions
    // let gjson = this.state.gjson
    // gjson.features.forEach(f => {
    //   f.properties.activity_index = Math.random()
    // })
    // this.state.map.getSource('regions').setData(gjson)
    let matches = document.querySelectorAll("input[name=region]:checked");
    console.dir( matches)
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

    console.log('atts_to_aggregate' + JSON.stringify(atts_to_aggregate))
    // Set new paint property to color the map
    this.state.map.setPaintProperty(
      'regions',
      'fill-color',
      // linear interpolation for colors going from lowerColor to higherColor accordingly to aggregation value
      ['interpolate',
        ['exponential' , 1/10],
        ['/', atts_to_aggregate, atts_to_aggregate.length-1],
        0, mapColors.lower,
        1, mapColors.higher
      ]
    )
  }

  render() {
    return (
      <div className="App">
        <div>
          <div ref={el => this.mapContainer = el} className="mainMap" />
        </div>
        <ControlPanel>
          <Select name="search" placeholder="School or municipality" multi={true} className="search" value={this.state.searchValue} onChange={(selectedOption) => {
            let regionFilter = null
            let schoolFilter = null

            // Set current state
            this.setState({searchValue: selectedOption})

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
          }} filterOptions={this.state.filter} options={this.state.options} arrowRenderer={() => <i className="fas fa-search" />} />
          <Section title="Region mobility">
            <InputGroup type="checkbox" name="region" group={[
              { value: 'activity_index',
                label: 'Daily Activity Index'}
            ]}
            onChange={this.changeRegionPaintPropertyHandler.bind(this)}
            />
          </Section>
          {/* <Section title="Region threats">
            <InputGroup type="checkbox" name="region" group={[
              { value: 'threats_index',
                label: 'Natural Disasters Index' },
              { value: 'violence_index',
                label: 'Violence Index' }
            ]} onChange={this.changeRegionPaintPropertyHandler.bind(this)} />
          </Section>
          <Section title="Region vulnerabilities">
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
            <ConnectivityChart totals={this.state.connectivityTotals}></ConnectivityChart>
          </Section>
        </ControlPanel>
        <Legend from={mapColors.higher} to={mapColors.lower} steps={10} leftText="More" rightText="Less" />
      </div>
    );
  }
}

export default App;
