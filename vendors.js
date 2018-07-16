
//green
function makeRest(csvData) {
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
                id: 'cluster-count_cafe',
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

function makeDessert(csvData) {

    csv2geojson.csv2geojson(csvData, {
        latfield: 'latitude',
        lonfield: 'longitude',
        delimiter: ','
    }, function(err, data) {

            map.addSource("desserts",
                {
                    type: "geojson",
                    data: data,
                    cluster: true, // Enable clustering
                    clusterRadius: 50, // Radius of each cluster when clustering points
                    clusterMaxZoom: 1 // Max zoom to cluster points on
                });


            map.addLayer({
                id: 'cluster-count_dest',
                type: 'symbol',
                source: 'desserts',
                filter: ['has', 'point_count'],
                layout: {
                    'text-field': '{point_count}',
                    'text-font': ['Arial'],
                    'text-size': 12
                }
            });
            addDessertLayers();

        });
}

function makeGrocery(csvData) {

    csv2geojson.csv2geojson(csvData, {
        latfield: 'latitude',
        lonfield: 'longitude',
        delimiter: ','
    }, function(err, data) {

            map.addSource("groceries",
                {
                    type: "geojson",
                    data: data,
                    cluster: true, // Enable clustering
                    clusterRadius: 50, // Radius of each cluster when clustering points
                    clusterMaxZoom: 1 // Max zoom to cluster points on
                });


            map.addLayer({
                id: 'cluster-count_groc',
                type: 'symbol',
                source: 'groceries',
                filter: ['has', 'point_count'],
                layout: {
                    'text-field': '{point_count}',
                    'text-font': ['Arial'],
                    'text-size': 12
                }
            });
            addGroceryLayers();

        });
}
//yellow
function addCafeLayers(){
    map.addLayer({
        id: 'clusters_cafe',
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
function addDessertLayers(){

    map.addLayer({
        id: 'clusters_dest',
        type: 'circle',
        source: 'desserts',
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
            'circle-opacity': 0.2
        }
    });

    map.addLayer({
        id: 'dest',
        type: 'circle',
        source: 'desserts',
        filter: ['!has', 'point_count'],
        paint: {
            'circle-color': '#ffff00',
            'circle-radius': 6,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff',
            'circle-opacity': 0.2
        },
    });
}
function addGroceryLayers(){

    map.addLayer({
        id: 'clusters_groc',
        type: 'circle',
        source: 'groceries',
        paint: {
            'circle-color': {
                property: 'point_count',
                type: 'interval',
                stops: [
                    [0, '#00F'],
                    [10, '#00F'],
                    [100, '#00F'],
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
        id: 'groc',
        type: 'circle',
        source: 'groceries',
        filter: ['!has', 'point_count'],
        paint: {
            'circle-color': '#00F',
            'circle-radius': 6,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff',
            'circle-opacity': 0.2
        },
    });
}
function addAllVendorLayers(){
    addRestLayers();
    addPharmLayers();
    addCafeLayers();
    addDessertLayers();
    addGroceryLayers();
}

function get_cluster(value){
    map.getStyle().layers.forEach(function(layer) {
        if (layer.type === 'circle') {
            map.removeLayer(layer.id);
        }
    });

    if (value=="Restaurants"){

        addRestLayers();
    }
    else if (value=="Pharmacy"){

        addPharmLayers();
    
    }
    else if (value=="Cafe & Desserts"){

        addCafeLayers();
        addDessertLayers();

    }
    else if (value=="Grocery"){

        addGroceryLayers();
    
    }
    else if (value=="All"){
        addAllVendorLayers();

    }

}

function get_restaurants(){
    $.ajax({
        type: "GET",
        url: 'https://query.data.world/s/jky2ynsxvx2nfcx24uhbjybilmpihp',
        dataType: "text",
        success: function(csvData) {makeRest(csvData);}
     });
}

function get_pharms(){
    $.ajax({
        type: "GET",
        url: 'https://query.data.world/s/mj7crve6q7a5qctnmdb23rg7biozgt',
        dataType: "text",
        success: function(csvData) {makePharm(csvData);}
     });
}

function get_cafes(){
    $.ajax({
        type: "GET",
        url: 'https://query.data.world/s/lwgwstl3krs3wk27bnkb7e7cqhbgyb',
        dataType: "text",
        success: function(csvData) {
                makeCafe(csvData); 
            ;}
     });
}

function get_desserts(){
    $.ajax({
        type: "GET",
        url: 'https://query.data.world/s/abgif5awfl3b2enk5tqwloki5zbovm',
        dataType: "text",
        success: function(csvData) {
                makeDessert(csvData); 
            ;}
     });
}

function get_grocery(){
    $.ajax({
        type: "GET",
        url: 'https://query.data.world/s/n5qsd6cmgc3a352x6mmwek7dbia6s7',
        dataType: "text",
        success: function(csvData) {
                makeGrocery(csvData); 
            ;}
     });
}

function get_vendors(){

    get_grocery();
    get_pharms();
    get_cafes();
    get_desserts();
    get_restaurants();

}
