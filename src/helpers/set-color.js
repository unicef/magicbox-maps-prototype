function setColor(schools){

  schools.forEach(school => {
    let speed_unit = school.properties["скорость"];
    let speed = speed_unit.match(/[+-]?\d+(\.\d+)?/g)
    let unit = speed_unit.replace(speed , "").trim()
    speed = parseFloat(speed);

    if ( unit !== "" && unit[0].match("М") && speed >= 3) {
        school.properties.color = "green";
    } else if ( (unit !== "" && unit[0].match("К") ) || (unit !== "" && unit[0].match("М") && speed < 3 && speed > 0) ) {
        school.properties.color = "orange";
    } else if ( speed == 0) {
        school.properties.color = "red";
    } else if ( isNaN(speed) ){
      school.properties.color = "purple";
    }
  });

  return schools;
}

export default setColor;
