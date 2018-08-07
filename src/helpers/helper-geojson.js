import { interpolateRgb } from 'd3-interpolate';
const helperGeojson = {
  format_regions_for_select: function(geojson) {
    return geojson.features.map(feature => {
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

  format_schools_for_select: function(geojson) {
    return geojson.features.map(feature => {
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
  updateGeojsonWithConvertedValues(geojson, values_arr, value_type, feature_index) {
    const colors = interpolateRgb('#ffc550', '#c21500') // light orange (less) & strong red (more)

    // Inter admin mobility, if existing, needs to be muted before finding max
    if (feature_index) {
      values_arr[feature_index] = 0
    }

    let max = values_arr.reduce(function(a, b) {
      return Math.max(a, b);
    });

    // push the converted values into the geojson file
    geojson.features.forEach((f, i) => {

      // first, color the "border" of the polygons
      f.properties.outline_color = '#3c2800' // very dark orange (brown tone)

      // then, color the metric of interest (could be activity, mobility, or anything that is specified by "value_type")
      let gradient_val = 0
      if (values_arr[i] >= max/4) {
        gradient_val = values_arr[i]/max || 0
      } else {
        gradient_val = (4 * values_arr[i])/max || 0
      }
      f.properties[value_type] = colors(gradient_val)

      // color the inter admin differently
      if (feature_index === i) {
        f.properties[value_type] = '#50ffc5' // light cyan - lime green
      }
    })
    return geojson
  }
}
export default helperGeojson
