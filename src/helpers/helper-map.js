const helperMap = {
  initializeMapState: function (config) {
    return {
      map: {},
      lng: config.map.lng,
      lat: config.map.lat,
      zoom: config.map.zoom,
      connectivity_totals: null,
      options: [],
      searchValue: '',
      schools: {},
      regions: {},
      admin_index : {},
      matrix : [],
      geojson: {},
      selected_admin: null,
      diagonal: []
    };
  }
}
export default helperMap
