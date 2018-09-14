const helperMatrix = {
  getMatrix: function(mobility, lookup) {
    // hw is for height and width of matrix, i.e. the number of geo features high and wide
    let hw = Object.keys(lookup).length;
    /* Mobility arrives in a two dimensional array where first array is colomn names [origin, destination, person] and each following array is a mobility [col_0_1_2-santibanko, col_0_1_3-santiblanko, 32]
    */
    let ary = new Array(hw);
    for (let outer = 0 ; outer < hw ; outer++){
      ary[outer] = new Array(hw);
      ary[outer].fill(0);
    }

    /* Create a new array of size 1122 when a new admin is found. This array can be considered as a new row that is created everytime a origin id is found in the csv file. Later all the destination ID are filled in for that row.
    */
    for (let index = 0 ; index < mobility.length; index ++){
      let row = mobility[index];
      ary[lookup[row.id_origin]][lookup[row.id_destination]] = parseInt(row.people, 10)
    }

    return ary
  },

  getDiagonal: function(matrix) {
    let mmm = matrix.reduce((a, e, i) => {
      a[i] = matrix[i][i] || 0
      return a
    }, []);
    return mmm
  },
  
  /**
   * Combines all vectors for clicked admins
   * @param  {Object} admin_index
   * @param  {Object} matrix
   * @param  {Object} selected_admins
   * @return {Array} diagonal
   */
   combineVectors: function(admin_index, matrix, selected_admins) {
     let arys = Object.keys(selected_admins).map(admin_id => {
       console.log(admin_id)
       let admin_id_index = admin_index[admin_id]
       let values = matrix[admin_index[admin_id]] || [] // a 1D array
       // Mute the value for root admin. Why? Because movement within the clicked admin may skew the values of movement from that admin to other admins
       if (values.length > 1) {
         values[admin_id_index] = 0;
       }
       return values
     })
     console.log(arys.length, arys)
     return arys[0].map((_, i) =>
      // sum elements at the same index in array of arrays into a single array
      arys.reduce((p, item, j) => p + (arys[j][i] || 0), 0));
   }
}
export default helperMatrix
