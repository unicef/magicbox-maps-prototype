import config from '../config'

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
}
export default helperGeojson
