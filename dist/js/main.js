// 1) Penampung layer yang diunggah (shapefile ZIP/SHP)
var uploadedLayers = [];
var map = L.map('map').setView([-6.3960396135632545, 106.69422324044139], 16);
map.zoomControl.setPosition('topright');

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

var singleMarker = L.marker([-6.3960396135632545, 106.69422324044139]).bindPopup('Central Point');

var ortho2 = L.tileLayer('./data/raster/Jan/{z}/{x}/{y}.png', {
  tms: true,
  minZoom: 5,
  maxZoom: 22,
  attribution: ''
}).addTo(map);


var ortho1 = L.tileLayer('./data/raster/Des/{z}/{x}/{y}.png', {
  tms: true,
  minZoom: 5,
  maxZoom: 22,
  attribution: ''
});

var ortho = L.tileLayer('./data/raster/Nov/{z}/{x}/{y}.png', {
  tms: true,
  minZoom: 5,
  maxZoom: 22,
  attribution: ''
});


var boundaryStyle = {
  color: '#ff0000',   
  weight: 2,
  opacity: 1,
  fillOpacity: 0 
};


function buildPropertiesTable(props) {
  if (!props) return 'No properties';
  return '<table style="margin:0;">' + Object.keys(props).map(function (k) {
    return '<tr><th style="text-align:left;padding-right:6px;">' + k + '</th><td>' + props[k] + '</td></tr>';
  }).join('') + '</table>';
}

var boundaryLayer = L.geoJSON(boundary, {
  style: boundaryStyle,
  onEachFeature: function (feature, layer) {
    layer.bindPopup(buildPropertiesTable(feature.properties));
  }
}).addTo(map);


try {
  var bndBounds = boundaryLayer.getBounds();
  if (bndBounds.isValid()) {
    map.fitBounds(bndBounds, { padding: [20, 20] });
  }
} catch (e) {
  console.warn('Boundary bounds invalid or not polygon:', e);
}


L.control.scale().addTo(map);

map.on('mousemove', function (e) {
  $('.coordinate').html('Lat: ' + e.latlng.lat.toFixed(4) + ' Lng: ' + e.latlng.lng.toFixed(4));
});


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
      return { color: '#0000ff', weight: 2, opacity: 0.8, fillOpacity: 0 };
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

document.getElementById('shpFileInput').addEventListener('change', handleFileUpload);

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
  'Januari 2026': ortho2,
  'Desember 2025': ortho1,
  'November 2025': ortho,
  'Boundary': boundaryLayer
};

var layerControl = L.control.layers(baseMaps, overlayMaps, {
  collapsed: true,
  position: 'topleft'
}).addTo(map);

function zoomToVectorLayers() {
  var groupMembers = [];


  if (boundaryLayer && boundaryLayer.getBounds) groupMembers.push(boundaryLayer);


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

var zoomBtn = document.querySelector('.zoom-to-layer');
if (zoomBtn) {
  zoomBtn.addEventListener('click', zoomToVectorLayers);
}

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
