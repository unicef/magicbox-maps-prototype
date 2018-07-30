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

  console.log(max);
  features.forEach( feature => {
    if(feature.properties[source] > max/ 4){
    feature.properties[destination] = feature.properties[source] / max || 0
  }else{
    feature.properties[destination] = (4 * feature.properties[source])  / max || 0
  }
  });


  // In case no value (threats or violence), just use 0. (a temp hack :|)
  //let scores = get_scores(features.map(f => { return f.properties[source] || 0}))
  // console.dir(features)
  //   let max = features.reduce(function(a, b) {
  //     return Math.max(a, b.properties[source]);
  //   });
  //   // push the converted values into the geojson file
  //   features.forEach((f, i) => {
  //     if ( f.properties[source] >= max/4) {
  //       f.properties[destination] = f.properties[source]/max || 0
  //     } else {
  //       f.properties[destination] = (4 * f.properties[source] ) /max || 0
  //     }
  //   });


  return features
}


/**
 * Returns array of scores between 0 and 1
 * @param  {Array} ary
 * @return {Boolean} score
 */
function get_scores(ary) {
  if (ary.length < 1) {
    return []
  }
  let max = ary.reduce(function(a, b) {
    return Math.max(a, b);
  });
  let min = ary.reduce(function(a, b) {
    return Math.min(a, b);
  });

  return ary.map(function(e) {
    return score(min, max, parseInt(e, 10))
  })
}

/**
 * Returns score between 0 and 1
 * @param  {Integer} min
 * @param  {Integer} max
 * @param  {Integer} number
 * @return {boolean} score
 */
function score(min, max, number) {
  let score_min = min
  let score_max = max
  let low_bound = 0
  let top_bound = 1
  return (number - score_min) / (score_max - score_min) *
  (top_bound - low_bound) + low_bound
}
