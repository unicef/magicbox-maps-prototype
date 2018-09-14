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
      legend_shown: false // Legend is by default hidden because we don't show the polygon layers first thing when the app loads
    };
  }
}
export default helperMap
