import config from '../config'
let red = [255,0,0];
let green = [0,255,0];
let orange = [255,165,0];
let blue = [0,0,255];

function superiority(ary, i) {
  let percent = (ary[i] / ary[i+1]) * 100
  if (!percent) {
    percent = 0
  }

  if(percent >= config.acceptable_percent) {
    if (ary[i+1]) {
      ary[i+1] = ary[i]
    }
  }
  if (i === ary.length-1) {
    return ary[i]
  } else {
    return superiority(ary, i+1)
  }

}

function setConnectivityColor(school) {
  let f_connectivity_vals = [
    school.properties.connectivity4G,
    school.properties.connectivity3G,
    school.properties.connectivity2G
  ]
  let superior = superiority(f_connectivity_vals, 0)

  let max = Math.max(...f_connectivity_vals)
  let indexOfValue = f_connectivity_vals.indexOf(superior);
  let lookup = {
    0: green,
    1: orange,
    2: red
  }
  let color_val = superior ? lookup[indexOfValue] : blue
  school.properties.f_color = color_val
  return school
}

// function setConnectivityColor(school) {
//   let f_connectivity_vals = [
//     school.properties.connectivity4G,
//     school.properties.connectivity3G,
//     school.properties.connectivity2G
//   ]
//   let max = Math.max(...f_connectivity_vals)
//   let indexOfMaxValue = f_connectivity_vals.indexOf(max);
//   let lookup = {
//     0: 'connectivity4G',
//     1: 'connectivity3G',
//     2: 'connectivity2G'
//   }
//   let connectivity_type = lookup[indexOfMaxValue]
//   if (max === 0) {
//     school.properties.f_color = blue
//   } else if(connectivity_type.match('connectivity4G')){
//     school.properties.f_color = green
//   } else if(connectivity_type.match('connectivity3G')){
//     school.properties.f_color = orange
//   } else {
//     school.properties.f_color = red
//   }
//   return school
// }

export default setConnectivityColor
