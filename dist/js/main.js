// =========================
// main.js — WebGIS Project
// =========================

// 1) Penampung layer yang diunggah (shapefile ZIP/SHP)
var uploadedLayers = [];

// 2) Inisialisasi peta
var map = L.map('map').setView([-6.3960396135632545, 106.69422324044139], 16);
map.zoomControl.setPosition('topright');

// 3) Basemap
var esriSatellite = L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  { minZoom: 5, maxZoom: 22, attribution: '&copy; Esri' }
).addTo(map);

var googleStreet = L.tileLayer(
  'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
  { minZoom: 5, maxZoom: 22, attribution: '&copy; <a href="https://www.google.com/permissions/geoguidelines.html">Google</a>' }
);

var googleSatellite = L.tileLayer(
  'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
  { minZoom: 5, maxZoom: 22, attribution: '&copy; <a href="https://www.google.com/permissions/geoguidelines.html">Google</a>' }
);

var osm = L.tileLayer(
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  { minZoom: 5, maxZoom: 22, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }
);

var mapbox = L.tileLayer(
  'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}',
  {
    attribution: '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>',
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1IjoibXVhcmllZmFobHVuMTMxMyIsImEiOiJjbTFiajJvenEwYmcxMmtzNjRmemo0a2xrIn0.EKPGeGMUtse3tNmmzwVMhw'
  }
);

var darkBaseMap = L.tileLayer(
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  { minZoom: 5, maxZoom: 22, attribution: '&copy; <a href="https://carto.com/attributions">carto</a>' }
);

// 4) Marker contoh di pusat peta
var singleMarker = L.marker([-6.3960396135632545, 106.69422324044139]).bindPopup('Central Point');

// 5) Overlay raster hasil gdal2tiles (TMS)
//    Catatan: path folder sesuaikan dengan struktur Anda
var ortho = L.tileLayer('./data/raster/baru/{z}/{x}/{y}.png', {
  tms: true,
  minZoom: 5,
  maxZoom: 22,
  attribution: ''
}).addTo(map);

// 6) ==== MEMUAT GEOJSON BOUNDARY ====
//     File ./data/boundery.js mendefinisikan var global "boundary"
//     Pastikan <script src="./data/boundery.js"></script> ada sebelum main.js di index.html (sudah benar). :contentReference[oaicite:2]{index=2} :contentReference[oaicite:3]{index=3}
var boundaryStyle = {
  color: '#ff0000',   
  weight: 2,
  opacity: 1,
  fillOpacity: 0 
};

// Helper untuk popup properti yang rapi
function buildPropertiesTable(props) {
  if (!props) return 'No properties';
  return '<table style="margin:0;">' + Object.keys(props).map(function (k) {
    return '<tr><th style="text-align:left;padding-right:6px;">' + k + '</th><td>' + props[k] + '</td></tr>';
  }).join('') + '</table>';
}

// Buat layer GeoJSON untuk boundary
// "boundary" berasal dari boundery.js (FeatureCollection Polygon). :contentReference[oaicite:4]{index=4}
var boundaryLayer = L.geoJSON(boundary, {
  style: boundaryStyle,
  onEachFeature: function (feature, layer) {
    layer.bindPopup(buildPropertiesTable(feature.properties));
  }
}).addTo(map);

// Opsional: zoom awal mengikuti boundary jika ingin
try {
  var bndBounds = boundaryLayer.getBounds();
  if (bndBounds.isValid()) {
    map.fitBounds(bndBounds, { padding: [20, 20] });
  }
} catch (e) {
  console.warn('Boundary bounds invalid or not polygon:', e);
}

// 7) Skala peta
L.control.scale().addTo(map);

// 8) Koordinat kursor
map.on('mousemove', function (e) {
  $('.coordinate').html('Lat: ' + e.latlng.lat.toFixed(4) + ' Lng: ' + e.latlng.lng.toFixed(4));
});

// 9) Upload Shapefile (ZIP/SHP) -> tampilkan sebagai layer + masukkan ke Layer Control
function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    const shpBuffer = e.target.result;
    shp(shpBuffer).then(function (geojson) {
      displayShapefile(geojson, file.name);
    }).catch(function (error) {
      console.error('Error memproses shapefile:', error);
      alert('Gagal memproses shapefile. Pastikan file ZIP berisi SHP, SHX, DBF, PRJ.');
    });
  };
  reader.readAsArrayBuffer(file);
}

function displayShapefile(geojson, fileName) {
  var shapefileLayer = L.geoJSON(geojson, {
    style: function () {
      return { color: '#0000ff', weight: 2, opacity: 0.8, fillOpacity: 0.1 };
    },
    onEachFeature: function (feature, layer) {
      if (feature.properties) {
        layer.bindPopup(buildPropertiesTable(feature.properties));
      }
    }
  }).addTo(map);

  uploadedLayers.push(shapefileLayer);
  if (shapefileLayer.getBounds && shapefileLayer.getBounds().isValid()) {
    map.fitBounds(shapefileLayer.getBounds(), { padding: [20, 20] });
  }
  updateLayerControl(fileName, shapefileLayer);
}

function updateLayerControl(fileName, shapefileLayer) {
  if (!layerControl || !shapefileLayer) return;
  var layerName = fileName ? fileName.replace(/\.[^/.]+$/, '') : 'Uploaded Shapefile';
  layerControl.addOverlay(shapefileLayer, layerName);
}

// Pasang event upload input dari index.html
document.getElementById('shpFileInput').addEventListener('change', handleFileUpload);

// 10) Definisi Layer Control (basemap & overlay)
var baseMaps = {
  'Esri Satellite': esriSatellite,
  'Google Satellite': googleSatellite,
  'Google Street': googleStreet,
  'Mapbox': mapbox,
  'OSM': osm,
  'Dark Maps': darkBaseMap
};

var overlayMaps = {
  'Central Point': singleMarker,
  'November Week 1 ': ortho,
  'Boundary': boundaryLayer // <— boundary ikut layer control
};

var layerControl = L.control.layers(baseMaps, overlayMaps, {
  collapsed: true,
  position: 'topleft'
}).addTo(map);

// 11) Tombol "Zoom to layer" (pojok kiri — ikon rumah di index.html)
//     Akan nge-zoom ke gabungan boundary + semua layer yang di-upload.
function zoomToVectorLayers() {
  var groupMembers = [];

  // Boundary
  if (boundaryLayer && boundaryLayer.getBounds) groupMembers.push(boundaryLayer);

  // Uploaded GeoJSON (shapefile)
  uploadedLayers.forEach(function (lyr) {
    if (lyr && lyr.getBounds) groupMembers.push(lyr);
  });

  if (groupMembers.length === 0) {
    alert('Belum ada layer vektor untuk di-zoom.');
    return;
  }

  var fg = L.featureGroup(groupMembers);
  var bounds = fg.getBounds();
  if (bounds && bounds.isValid()) {
    map.fitBounds(bounds, { padding: [24, 24] });
  }
}

// Kaitkan ke tombol di HTML
var zoomBtn = document.querySelector('.zoom-to-layer');
if (zoomBtn) {
  zoomBtn.addEventListener('click', zoomToVectorLayers);
}

// 12) (Opsional) Fallback jika fungsi fullScreenView tidak didefinisikan di file lain
if (typeof fullScreenView !== 'function') {
  window.fullScreenView = function () {
    var elem = document.getElementById('map');
    if (!document.fullscreenElement) {
      if (elem.requestFullscreen) elem.requestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };
}
