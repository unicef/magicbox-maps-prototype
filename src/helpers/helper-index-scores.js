/**
 * Returns array of features with index based on value in properties
 * @param  {Array} features
 * @param  {String} source
 * @param  {String} destination
 * @return {Array} features array
 */

export function diagonal_activity(features , activity_array ,  destination){
  console.log('Diagonal' + activity_array);
  let scores = get_scores(activity_array)
  console.log('score' + JSON.stringify(scores))
  features.forEach((f, i) => {
    f.properties[destination] = scores[i];
  })
  return features
}

export function calculate_index(features, source, destination) {
  // In case no value (threats or violence or activity), just use 0. (a temp hack :|)
  let scores = get_scores(features.map(f => { return f.properties[source] || 0}))
  console.log('score' + JSON.stringify(scores))
  features.forEach((f, i) => {
    f.properties[destination] = scores[i];
  })
  return features
}


/**
 * Returns array of scores between 0 and 1
 * @param  {Array} ary
 * @return {Boolean} score
 */
function get_scores(ary) {
  console.log('ary' + JSON.stringify(ary))
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
  console.log('min, max, number' + JSON.stringify(min) + ',' +JSON.stringify(max) + ',' + JSON.stringify(number) )
  let score_min = min
  let score_max = max
  let low_bound = 0
  let top_bound = 1
  return (number - score_min) / (score_max - score_min) *
  (top_bound - low_bound) + low_bound
}
