function countConnectivityMultiple(schools) {
    let num2G = 0
    let num3G = 0
    let num4G = 0

    schools.forEach(school => {
        let speed2G = school.properties.connectivity2G
        let speed3G = school.properties.connectivity3G
        let speed4G = school.properties.connectivity4G

        num2G += speed2G
        num3G += speed3G
        num4G += speed4G
    })

    return {
        num4G,
        num3G,
        num2G,
    }
}

export default countConnectivityMultiple
