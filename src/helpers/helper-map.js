const helperMap = {
  initializeMapState: function (config) {
    return {
      map: {},
      ...config.map, // e.g. lng, lat, zoom
      connectivity_totals: null,
      pie_labels: [],
      admin_index : {},
      matrix : [],
      diagonal: [],
      geojson: {},
      schools: {},
      mobility_alldays: [],
      selected_admins: {},
    };
  }
}
export default helperMap
