import { interpolateRgb } from 'd3-interpolate'

function rgbtorgba(rgb, alpha){
  let red = rgb[0];
  let green = rgb[1];
  let blue = rgb[2];
  return "rgba" + "("  + red + "," +  green + "," + blue + "," + alpha + ")";
}

const colors = interpolateRgb("red", "blue");

function setColor (geojson) {
  let red = [255,0,0];
  let blue = [0,0,255];
  let orange = [255,165,0];
  let black = [0,0,0];
  let unknown = [128,0,128];
  let arr4G = [];
  let arr3G = [];
  let arr2G = [];
  let median4G = 0;
  let median3G = 0;
  let median2G = 0;

  let avg4G = 0;
  let avg3G = 0;
  let avg2G = 0;
  let count = 0;

  geojson.features.forEach((school, index) => {
    arr4G.push(school.properties.connectivity4G);
    arr3G.push(school.properties.connectivity3G);
    arr2G.push(school.properties.connectivity2G);
  });

  let max4G = Math.max(...arr4G);
  let max3G = Math.max(...arr3G);
  let max2G = Math.max(...arr2G);

  let sum4G = arr4G.reduce( (sum , number) => {
    return sum + number ;
  },0);

  let sum3G = arr3G.reduce( (sum , number) => {
    return sum + number ;
  },0);

  let sum2G = arr2G.reduce( (sum , number) => {
    return sum + number ;
  },0);

  avg4G = sum4G/arr4G.length;
  avg3G = sum3G/arr3G.length;
  avg2G = sum2G/arr2G.length;

  geojson = geojson.features.forEach((school, index) => {
    let gradient_val_4G =  school.properties.connectivity4G/max4G;
    let gradient_val_3G =  school.properties.connectivity3G/max3G;
    let gradient_val_2G =  school.properties.connectivity2G/max2G;

    if( (school.properties.connectivity4G + school.properties.connectivity3G + school.properties.connectivity2G) == 0  ){
      school.properties.color_unknown = red;
    }

    // if( school.properties.connectivity4G != 0  ){
    //     school.properties.color_4G = colors(gradient_val_4G);
    // } else if (school.properties.connectivity4G == 0) {
    //     school.properties.color_4G = black;
    // if( school.properties.connectivity3G != 0){
    //    school.properties.color_3G = colors(gradient_val_3G);
    // } else {
    //    school.properties.color_3G = [0,0,0];
    // }
    //
    // if(school.properties.connectivity2G != 0){
    //   school.properties.color_2G = colors(gradient_val_2G);
    // } else {
    //   school.properties.color_2G = [0,0,0];
    // }
    // }


    if( school.properties.connectivity4G != 0 && school.properties.connectivity4G > avg4G ){
        let color = rgbtorgba( blue , gradient_val_4G )
        school.properties.color_4G = color;
        //school.properties.color_4G = colors(gradient_val_4G);
    } else if( school.properties.connectivity4G != 0 && school.properties.connectivity4G <= avg4G ){
        let color = rgbtorgba( red , ( 1 - gradient_val_4G) )
        school.properties.color_4G = color;
    } else if (school.properties.connectivity4G == 0) {
        school.properties.color_4G = black;
    }

    if( school.properties.connectivity3G != 0 && school.properties.connectivity3G > avg3G ){
        let color = rgbtorgba( blue , gradient_val_3G )
        school.properties.color_3G = color;
        //school.properties.color_4G = colors(gradient_val_4G);
    } else if( school.properties.connectivity3G != 0 && school.properties.connectivity3G <= avg3G ){
        let color = rgbtorgba( red , ( 1 - gradient_val_3G) )
        school.properties.color_3G = color;
    } else if (school.properties.connectivity3G == 0) {
        school.properties.color_3G = black;
    }

    if( school.properties.connectivity2G != 0 && school.properties.connectivity2G > avg2G ){
        let color = rgbtorgba( blue , gradient_val_2G )
        school.properties.color_2G = color;
        //school.properties.color_4G = colors(gradient_val_4G);
    } else if( school.properties.connectivity2G != 0 && school.properties.connectivity2G <= avg2G ){
        let color = rgbtorgba( red , ( 1 - gradient_val_2G) )
        school.properties.color_2G = color;
    } else if (school.properties.connectivity2G == 0) {
        school.properties.color_2G = black;
    }

  });

  return geojson;
}
export default setColor;
