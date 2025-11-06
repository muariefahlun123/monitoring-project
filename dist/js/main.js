// Inisialisasi array untuk menyimpan semua layer yang diunggah
var uploadedLayers = [];

// map class initialize
var map = L.map('map').setView(
    [-6.3960396135632545, 106.69422324044139], 16); 
map.zoomControl.setPosition('topright');

// Adding BaseMpas Tilelayer
// Esri Satellite
var esriSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    minZoom: 5,
    maxZoom: 22,
    attribution: '&copy; Esri'
}).addTo(map);

// Google Maps (Streets)
var googleStreet = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    minZoom: 5,
    maxZoom: 22,
    attribution: '&copy; <a href="https://www.google.com/permissions/geoguidelines.html">Google</a> '
});

// Google Maps (Satellite)
var googleSatellite = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    minZoom: 5,
    maxZoom: 22,
    attribution: '&copy; <a href="https://www.google.com/permissions/geoguidelines.html">Google</a>'
});

// Open Street Maps
var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    minZoom: 5,
    maxZoom: 22,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> '
});

// Mapbox
var mapbox = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>',
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoibXVhcmllZmFobHVuMTMxMyIsImEiOiJjbTFiajJvenEwYmcxMmtzNjRmemo0a2xrIn0.EKPGeGMUtse3tNmmzwVMhw'
});

// Adding a dark map base layer (darkBaseMap)
var darkBaseMap = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
    minZoom: 5,
    maxZoom: 22,
    attribution: '&copy; <a href="https://carto.com/attributions">catro</a>'
});

// Add marker in the center of map
var singleMarker = L.marker([-6.3960396135632545, 106.69422324044139])
    .bindPopup('Central Point');

// Menambahkan layer raster hasil gdal2tiles // Overlay layers (TMS)

var ortho = L.tileLayer('./data/raster/baru/{z}/{x}/{y}.png', {
    tms: true,
    attribution: "",
    minZoom: 5,
    maxZoom: 22
}).addTo(map);

// Add map scale
L.control.scale().addTo(map);

// Map coordinate display
map.on('mousemove', function (e) {
    $('.coordinate').html(`Lat: ${e.latlng.lat.toFixed(4)} Lng: ${e.latlng.lng.toFixed(4)}`);
});

// Function to handle file upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const shpBuffer = e.target.result;
        shp(shpBuffer).then(function(geojson) {
            displayShapefile(geojson, file.name);
        }).catch(function(error) {
            console.error('Error memproses shapefile:', error);
        });
    }
    reader.readAsArrayBuffer(file);
}

// Function to display the Shapefile on the map
function displayShapefile(geojson, fileName) {
    // Membuat layer baru untuk shapefile yang diunggah
    var shapefileLayer = L.geoJSON(geojson, {
        style: function(feature) {
            return {
                color: "#df0000",
                weight: 2,
                opacity: 0.65
            };
        },
        onEachFeature: function(feature, layer) {
            if (feature.properties) {
                layer.bindPopup(Object.keys(feature.properties).map(function(k) {
                    return k + ": " + feature.properties[k];
                }).join("<br />"));
            }
        }
    }).addTo(map);

    uploadedLayers.push(shapefileLayer);    // Memasukkan layer baru ke dalam array `uploadedLayers`
    map.fitBounds(shapefileLayer.getBounds());   // Menyesuaikan tampilan peta untuk mencakup semua layer
    updateLayerControl(fileName, shapefileLayer);  // Memperbarui kontrol layer dengan nama file
}

// Fungsi untuk memperbarui kontrol layer dengan nama file
function updateLayerControl(fileName, shapefileLayer) {
    if (shapefileLayer) {
        // Mengambil nama file tanpa ekstensi untuk dijadikan nama layer
        let layerName = fileName ? fileName.split('.')[0] : 'Shapefile yang Diupload';
        layerControl.addOverlay(shapefileLayer, layerName);
    }
}

// Menambahkan event listener ke input file
document.getElementById('shpFileInput').addEventListener('change', handleFileUpload);

// LBaseMaps layer control
var baseMaps = {
    'Esri Satellite': esriSatellite,
    'Google Satellite': googleSatellite,
    'Google Street': googleStreet,
    'Mapbox': mapbox,
    'OSM': osm,
    'Dark Maps': darkBaseMap
};

// Overlay Content of WebGIS
var overlayMaps = {
    'Central Point': singleMarker,
    'November Week 1': ortho
};


//Layer Control on BaseMaps
var layerControl = L.control.layers(baseMaps, overlayMaps, {
    collapsed: true,
    position: 'topleft'
}).addTo(map);