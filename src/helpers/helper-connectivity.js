export function getConnectivityTotals(schools, type) {
  let numHigh = 0,
      numLow = 0,
      numNone = 0,
      numUnknown = 0;

  switch(type) {
    case 'M':
      schools.forEach(school => {
        let speed = school.properties.speed_connectivity;
        if (speed >= 3) { // Above 3Mbps
          numHigh++;
        } else if (speed > 0) { // Below 3Mbps
          numLow++;
        } else if (speed === 0) { // No connectivity
          numNone++;
        } else { // No data
          numUnknown++;
        }
      })
      break;
    case '4G': case '3G': case '2G':
      schools.forEach(school => {
        let attributeName = 'color_' + type // so it will be e.g. color_4G
        switch(school.properties[attributeName][0]) { // extract the first element in the color array. This "hacky" way is acceptable because our 4 choices of color (green, yellow, red, purple) don't coincide in their first element. We can't use the entire color array because such a type is not acceptable in switch statements (source: https://stackoverflow.com/a/20660031)
          case 92: // green
            numHigh++
            break
          case 245: // yellow
            numLow++
            break
          case 217: // red
            numNone++
            break
          case 106: // purple
            numUnknown++
            break
        }
      })
      break;
  };

  return { numHigh, numLow, numNone, numUnknown };
}

export function setChartLabels(type) {
  switch(type) {
    case 'M':
      return [
       'Above 3Mbps',
       'Below 3Mbps',
       'Zero Connectivity',
       'No Data']
    default:
      return [
       'Above Average',
       'Below Average',
       'Zero Connectivity',
       'No Data']
  }
}

export function setConnectivityColor(geojson) {
  const green = [92, 184, 92],
        yellow = [245, 166, 35],
        red = [217, 83, 79],
        purple = [106, 30, 116]
  let arr4G = [],
      arr3G = [],
      arr2G = [];
  let sum4G = 0,
      sum3G = 0,
      sum2G = 0;

  geojson.features.forEach((school, index) => {
    // Internet connectivity
    let speed = school.properties.speed_connectivity
    school.properties.color =
      speed >= 3 ? green : // above 3Mbps
      speed > 0 ? yellow : // below 3Mbps
      speed === 0 ? red : // zero connectivity
      purple

    // 4G, 3G, 2G connectivity
    let school_4G = school.properties.connectivity4G,
        school_3G = school.properties.connectivity3G,
        school_2G = school.properties.connectivity2G;
    arr4G.push(school_4G);
    arr3G.push(school_3G);
    arr2G.push(school_2G);

    sum4G += school_4G === 'no data' ? 0 : school_4G;
    sum3G += school_3G === 'no data' ? 0 : school_3G;
    sum2G += school_2G === 'no data' ? 0 : school_2G;
  });

  let avg4G = sum4G/arr4G.length,
      avg3G = sum3G/arr3G.length,
      avg2G = sum2G/arr2G.length;

  geojson = geojson.features.forEach((school, index) => {
    let school_4G = school.properties.connectivity4G,
        school_3G = school.properties.connectivity3G,
        school_2G = school.properties.connectivity2G;

    school.properties.color_4G =
      school_4G === 'no data' ? purple :
      school_4G > avg4G ? green : // above average
      school_4G > 0 ? yellow : // below average
      red  // zero coverage
    school.properties.color_3G =
      school_3G === 'no data' ? purple :
      school_3G > avg3G ? green : // above average
      school_3G > 0 ? yellow : // below average
      red  // zero coverage
    school.properties.color_2G =
      school_2G === 'no data' ? purple :
      school_2G > avg2G ? green : // above average
      school_2G > 0 ? yellow : // below average
      red  // zero coverage
  });

  return geojson;
}

/**
 * The "median" is the "middle" value in a sorted list of numbers.
 *
 * @param {Array} arr An array of numbers.
 * @return {Number} The calculated median value from the specified numbers.
 * Source: https://jonlabelle.com/snippets/view/javascript/calculate-mean-median-mode-and-range-in-javascript
 */
function median(arr) {
    var median = 0, numsLen = arr.length;
    arr.sort();

    if (numsLen % 2 === 0) { // is even
      // average of two middle numbers
      median = (arr[numsLen / 2 - 1] + arr[numsLen / 2]) / 2;
    } else { // is odd
      // middle number only
      median = arr[(numsLen - 1) / 2];
    }

    return median;
}
