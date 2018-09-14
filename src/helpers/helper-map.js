const helperMap = {
  initializeMapState: function (config) {
    return {
      map: {},
      ...config.map, // e.g. lng, lat, zoom
      connectivity_totals: null,
      admin_index : {},
      matrix : [],
      diagonal: [],
      geojson: {},
      mobility_alldays: [],
      selected_admins: {},
    };
  }
}
export default helperMap
