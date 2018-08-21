function countConnectivity(schools) {
  let numHigh = 0; // Above 3Mbps
  let numLow = 0; // Below 3Mbps
  let numNone = 0; // No connectivity
  let numUnknown = 0;

  schools.forEach(school => {
    let speed_unit = school.properties["скорость"];
    let speed = speed_unit.match(/[+-]?\d+(\.\d+)?/g)
    let unit = speed_unit.replace(speed , "").trim()
    speed = parseFloat(speed);
    if ( unit !== "" && unit[0].match("М") && speed >= 3) {
        numHigh++;
    } else if ( (unit !== "" && unit[0].match("К") ) || (unit !== "" && unit[0].match("М") && speed < 3 && speed > 0) ) {
        numLow++;
    } else if (speed === 0) {
        numNone++;
    }
    else if (isNaN(speed) ) {
      numUnknown++;
    }
  });

  return {
    numHigh,
    numLow,
    numNone,
    numUnknown
  };
}

export default countConnectivity;
