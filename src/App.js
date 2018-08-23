import React, { Component } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// Third-party React components
import 'react-select/dist/react-select.css'
import 'react-virtualized/styles.css'
import 'react-virtualized-select/styles.css'
import Select from 'react-virtualized-select'
import createFilterOptions from 'react-select-fast-filter-options'

// Custom React components
import ControlPanel from './components/control-panel'
import Section from './components/section'
import Legend from './components/legend'
import ConnectivityChart from './components/connectivity-chart'
import RadioGroup from './components/radiogroup'

// Helpers
import apiConfig from './helpers/api-config'
import config from './config'
import countConnectivity from './helpers/count-connectivity'
import setColor from './helpers/set-color'

// Main style
import './css/App.css'
// Map colors
const mapColors = {
    // higher color will be shown where indexes are 1
    higher: '#ff0000',
    // lower color will be shown where indexes are 0
    lower: '#0000ff'
}
mapboxgl.accessToken = apiConfig.accessToken
class App extends Component {
    constructor(props) {
        super(props)
        this.state = {
            map: {},
            lng: -74.2973,
            lat: 4.5709,
            zoom: 4.5,
            connectivityTotalsM: null,
            displayChartM : true,
            schools: {},
        }
    }

    componentDidMount() {

        const map = new mapboxgl.Map({
            container: this.mapContainer,
            style: 'mapbox://styles/mapbox/streets-v9',
            center: [this.state.lng, this.state.lat],
            zoom: this.state.zoom
        })

        this.setState({map})
        // Promises
        let schoolsPromise = fetch(apiConfig.schools).then((response) => response.json())
        let mapLoadPromise = new Promise((resolve, reject) => {
            map.on('load', (e) => {
                resolve(map)
            })

            map.on('error', (e) => {
                reject(map)
            })
        })


        Promise.all([schoolsPromise, mapLoadPromise]).then(([geojson, map]) => {
            this.state.map.getSource('schools').setData(geojson)
        })

        // Handle school data
        schoolsPromise.then((geojson) => {
            this.setState({
                connectivityTotalsM: countConnectivity(geojson.features),
            })
            setColor(geojson)
        })


        map.on('move', () => {
            const { lng, lat } = map.getCenter()

            this.setState({
                lng: lng.toFixed(4),
                lat: lat.toFixed(4),
                zoom: map.getZoom().toFixed(2)
            })
        })

        map.on('load', function(e) {

            map.addLayer({
                id: 'schools',
                type: 'circle',
                // Add a GeoJSON source containing place coordinates and information.
                source: {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
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

            })

            // Add click event to schools layer
            map.on('click', 'schools', (e) => {
                let coordinates = e.features[0].geometry.coordinates.slice()
                let schoolProperties = e.features[0].properties

                // output all properties besides color
                let html = Object.keys(schoolProperties)
                    .filter((key) => key !== 'color' && key != 'color_4G' &&  key != 'color_3G' &&  key != 'color_2G' && key != 'color_unknown')
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
        })
    }

    displayLayerHandler(e) {
    // layer name should be stored in element's value property
        let layerName = e.target.getAttribute('value')
        // will be 'visible' or 'none'
        let currentState = e.target.checked ? 'visible' : 'none'
        let atts_to_aggregate = null
        if (layerName === 'schools_4G'){
            atts_to_aggregate = ['get' , 'color_4G']
            this.setState({
                displayChartF : true,
                displayChartM : false,
            })
        } else if (layerName === 'schools_3G'){
            atts_to_aggregate = ['get' , 'color_3G']
            this.setState({
                displayChartF : true,
                displayChartM : false,
            });
        } else if (layerName === 'schools_2G'){
            atts_to_aggregate = ['get' , 'color_2G']
            this.setState({
                displayChartF : true,
                displayChartM : false,
            });
        } else if (layerName === 'schools_unknown'){
            atts_to_aggregate = ['get' , 'color_unknown']
            this.setState({
                displayChartF : true,
                displayChartM : false,
            });
        } else if (layerName === 'schools_m'){
            atts_to_aggregate = ['get' , 'color']
            this.setState({
                displayChartF : false,
                displayChartM : true,
            })
        }
        this.state.map.setPaintProperty(
            'schools',
            'circle-color',
            atts_to_aggregate
        )
        // Set layer visibility
        this.state.map.setLayoutProperty(layerName, 'visibility', currentState)
    }


    render() {
        let PieChart = null;
        let legends = null;
        let text  = null;
        if (this.state.displayChartM === true){
            PieChart =
      <Section title="Connectivity Details">
          <ConnectivityChart totals={this.state.connectivityTotalsM}></ConnectivityChart>
      </Section>
        legends = null;
        text = null;
        } else {
            PieChart = null
            text = <p> Points colored in black indicate no schools were found for selected coverage </p>
            legends = <Legend from={mapColors.lower} to={mapColors.higher} steps={10} leftText="Lower Risk" rightText="Higher Risk" />

        }
        return (
            <div className="App">
                <div>
                    <div ref={el => this.mapContainer = el} className="mainMap" />
                </div>
                <ControlPanel>
                        <RadioGroup type="radio" name="school" group={[
                            { value: 'schools_m',
                                label: 'Connectivity M',
                                onChange: this.displayLayerHandler.bind(this),
                                defaultChecked:'checked'
                            },
                            { value: 'schools_4G',
                                label: 'Coverage 4G',
                                onChange: this.displayLayerHandler.bind(this),
                            },
                            { value: 'schools_3G',
                                label: 'Coverage 3G',
                                onChange: this.displayLayerHandler.bind(this),
                            },
                            { value: 'schools_2G',
                                label: 'Coverage 2G',
                                onChange: this.displayLayerHandler.bind(this),
                            },
                            { value: 'schools_unknown',
                                label: 'No Coverage',
                                onChange: this.displayLayerHandler.bind(this),
                            }
                        ]} onChange={(e) => {}} />
                    {text}
                    {PieChart}
                </ControlPanel>
                {legends}
            </div>
        )
    }
}

export default App
