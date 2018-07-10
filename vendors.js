

//green
function makeGeoJSON(csvData) {
    csv2geojson.csv2geojson(csvData, {
        latfield: 'latitude',
        lonfield: 'longitude',
        delimiter: ','
    }, function(err, data) {
	map.on('load',
        () => {
            map.addSource("restaurants",
                {
                    type: "geojson",
                    data: data,
                    cluster: true, // Enable clustering
                    clusterRadius: 50, // Radius of each cluster when clustering points
                    clusterMaxZoom: 1 // Max zoom to cluster points on
                });

            map.addLayer({
                id: 'cluster-count_rest',
                type: 'symbol',
                source: 'restaurants',
                filter: ['has', 'point_count'],
                layout: {
                    'text-field': '{point_count}',
                    'text-font': ['Arial'],
                    'text-size': 12
                }
            });
            addRestLayers();
            
        });
    });
}
function addRestLayers(){
	map.addLayer({
        id: 'clusters_rest',
        type: 'circle',
        source: 'restaurants',
        paint: {
            'circle-color': {
                property: 'point_count',
                type: 'interval',
                stops: [
                    [0, '#41A337'],
                    [10, '#2D7026'],
                    [100, '#0B5703'],
                ]
            },
            'circle-radius': {
                property: 'point_count',
                type: 'interval',
                stops: [
                    [0, 20],
                    [10, 30],
                    [100, 50]
                ]
            },
            'circle-opacity': 0.2
        }
    });


    map.addLayer({
        id: 'restaurant',
        type: 'circle',
        source: 'restaurants',
        filter: ['!has', 'point_count'],
        paint: {
            'circle-color': '#1EF008',
            'circle-radius': 6,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff',
            'circle-opacity': 0.2
        },
    });
}

function addPharmLayers(){

    map.addLayer({
        id: 'clusters_pharm',
        type: 'circle',
        source: 'pharmacies',
        paint: {
            'circle-color': {
                property: 'point_count',
                type: 'interval',
                stops: [
                    [0, '#F00'],
                    [10, '#F00'],
                    [100, '#F00'],
                ]
            },
            'circle-radius': {
                property: 'point_count',
                type: 'interval',
                stops: [
                    [0, 20],
                    [10, 30],
                    [100, 50]
                ]
            },
            'circle-opacity': 0.2
        }
    });

    map.addLayer({
        id: 'pharms',
        type: 'circle',
        source: 'pharmacies',
        filter: ['!has', 'point_count'],
        paint: {
            'circle-color': '#F00',
            'circle-radius': 6,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff',
            'circle-opacity': 0.2
        },
    });
}
//red
function makePharm(csvData) {

    csv2geojson.csv2geojson(csvData, {
        latfield: 'latitude',
        lonfield: 'longitude',
        delimiter: ','
    }, function(err, data) {

            map.addSource("pharmacies",
                {
                    type: "geojson",
                    data: data,
                    cluster: true, // Enable clustering
                    clusterRadius: 50, // Radius of each cluster when clustering points
                    clusterMaxZoom: 1 // Max zoom to cluster points on
                });


            map.addLayer({
                id: 'cluster-count_pharm',
                type: 'symbol',
                source: 'pharmacies',
                filter: ['has', 'point_count'],
                layout: {
                    'text-field': '{point_count}',
                    'text-font': ['Arial'],
                    'text-size': 12
                }
            });
            addPharmLayers();

        });

}
//blue
function makeCafe(csvData) {

    csv2geojson.csv2geojson(csvData, {
        latfield: 'latitude',
        lonfield: 'longitude',
        delimiter: ','
    }, function(err, data) {

            map.addSource("cafes",
                {
                    type: "geojson",
                    data: data,
                    cluster: true, // Enable clustering
                    clusterRadius: 50, // Radius of each cluster when clustering points
                    clusterMaxZoom: 1 // Max zoom to cluster points on
                });


            map.addLayer({
                id: 'cluster-count',
                type: 'symbol',
                source: 'cafes',
                filter: ['has', 'point_count'],
                layout: {
                    'text-field': '{point_count}',
                    'text-font': ['Arial'],
                    'text-size': 12
                }
            });
            addCafeLayers();

        });

}

function addCafeLayers(){
    map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'cafes',
        paint: {
            'circle-color': {
                property: 'point_count',
                type: 'interval',
                stops: [
                    [0, '#ffff00'],
                    [10, '#ffff00'],
                    [100, '#ffff00'],
                ]
            },
            'circle-radius': {
                property: 'point_count',
                type: 'interval',
                stops: [
                    [0, 20],
                    [10, 30],
                    [100, 50]
                ]
            },
            'circle-opacity': 0.5
        }
    });
    map.addLayer({
        id: 'cafe',
        type: 'circle',
        source: 'cafes',
        filter: ['!has', 'point_count'],
        paint: {
            'circle-color': '#ffff00',
            'circle-radius': 6,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff',
            'circle-opacity': 0.5
        },
    });
}
