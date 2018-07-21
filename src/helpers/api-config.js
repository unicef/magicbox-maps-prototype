// The school data is on a temporary Azure store and should be replaced
// with a longer-term storage solution in the future.

const apiConfig = {
  schools: process.env.REACT_APP_SCHOOLS_URL,
  shapes: process.env.REACT_APP_SHAPES_URL,
  mobilityMon:process.env.REACT_APP_MOBILITY_MON_URL,
  mobilityTue:process.env.REACT_APP_MOBILITY_TUE_URL,
  mobilityWed:process.env.REACT_APP_MOBILITY_WED_URL,
  mobilityThu:process.env.REACT_APP_MOBILITY_THU_URL,
  mobilityFri:process.env.REACT_APP_MOBILITY_FRI_URL,
  mobilitySat:process.env.REACT_APP_MOBILITY_SAT_URL,
  mobilitySun:process.env.REACT_APP_MOBILITY_SUN_URL,
  accessToken: process.env.REACT_APP_MAPBOX_TOKEN
}

export default apiConfig;
