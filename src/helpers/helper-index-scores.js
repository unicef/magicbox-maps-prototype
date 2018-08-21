import config from '../config'
/**
 * Returns array of features with index based on value in properties
 * @param  {Array} features
 * @param  {String} source
 * @param  {String} destination
 * @return {Array} features array
 */
export function calculate_index(features, source, destination) {
  let max = features.reduce(function(a, b) {
      return Math.max(a, b.properties[source]);
  }, 0);

  if( config.populationScale == "linear"){
    features.forEach( feature => {
      feature.properties[destination] = feature.properties[source] / max
    });
  }

  if( config.populationScale == "log"){
    features.forEach((f) => {
        if ( f.properties[source] >= max/4) {
          f.properties[destination] = f.properties[source]/max || 0
        } else {
          f.properties[destination] = (4 * f.properties[source] ) /max || 0
        }
      });
  }

  return features
}
