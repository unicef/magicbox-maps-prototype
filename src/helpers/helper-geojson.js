import { interpolateRgb } from 'd3-interpolate'
import config from '../config'
const helperGeojson = {
  format_regions_for_select: function (geojson) {
    return geojson.features.map((feature) => {
      // get all region names from geojson
      return [
        feature.properties.NOMBRE_D,
        feature.properties.NOMBRE_M,
        feature.properties.NOMBRE_C
      ]
    }).reduce((acc, el) => {
      // join all names in the same array
      return acc.concat(el)
    }, []).filter((el, i, self) => {
      // filter for unicity
      return self.indexOf(el) === i
    })
  },

  format_schools_for_select: function (geojson) {
    return geojson.features.map((feature) => {
      // Get school name
      return feature.properties.name
    }).filter((name, i, self) => {
      // Remove duplicates
      return self.indexOf(name) === i
    })
  },
  /*
  Values passed in here will be converted to range 0:1. In addition, values in the lowest quarter will be buffed up by 4 times.
  */
  updateGeojsonWithConvertedValues: function (geojson, values_arr, value_type, feature_index) {
    const colors = interpolateRgb('blue', 'red')
    // Inter admin mobility needs to be muted before finding max

    if (feature_index) {
      values_arr[feature_index] = 0
    }

    let max = values_arr.reduce((a, b) => {
      return Math.max(a, b)
    });

    // push the converted values into the geojson file
    geojson.features.forEach((f, i) => {
      f.properties.outline_color = 'yellow'
      // This is mobility
      let gradient_val = 0
      // This is activity (diagonal)

      if (values_arr[i] >= max/4) {
        gradient_val = values_arr[i]/max || 0
      } else {
        gradient_val = (4 * values_arr[i])/max || 0
      }
      let rgb = colors(gradient_val)
      let shade = rgb.substring(4, rgb.length-1).replace(/ /g, '').split(',').map(e => { return parseInt(e)})
      shade.push(config.opacity)
      f.properties[value_type] = shade
      if (feature_index === i) {
        // f.properties.outline_color = 'aqua'
        f.properties[value_type] = [155,128,128, 0.6] //f.properties['activity_value']
      }
    })
    return geojson
  }
}
export default helperGeojson
