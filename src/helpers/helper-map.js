const helperMap = {
  initializeMapState: function (config) {
    return {
      map: {},
      lng: config.map.lng,
      lat: config.map.lat,
      zoom: config.map.zoom,
      pitch: config.map.pitch,
      bearing: config.map.bearing,
      connectivity_totals: null,
      options: [],
      searchValue: '',
      schools: {},
      regions: {},
      admin_index : {},
      matrix : [],
      geojson: {},
      selected_admins: {},
      diagonal: []
    };
  }
}
export default helperMap
