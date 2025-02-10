// Declare map variable globally
var map

//Function to create the Leaflet map
function createMap() {
    // Create the map
    map = L.map('map', {
        center: [44, -120.5],                               //center the map on Oregon
        zoom: 7                                             //set zoom level to fit state
    });

    // Add base tile layer from stadia maps
    L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=4c175b69-da77-4ffe-b10b-9edb2c25a733', {
        attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Call data functions
    getData();                              //calls function to add county point geoJSON to map
    fetchCountyBoundaries();                //calls function to fetch county boundaries for reference layer
    createLegend();
}

//Function to retrieve Oregon county polys GeoJSON for reference
function fetchCountyBoundaries() {
    fetch('https://services1.arcgis.com/KbxwQRRfWyEYLgp4/arcgis/rest/services/BLM_OR_County_Boundaries_Polygon_Hub/FeatureServer/1/query?outFields=*&where=1%3D1&f=geojson')
        .then(response => response.json())
        .then(data => {
            let oregonCounties = {
                type: "FeatureCollection",
                features: data.features.filter(feature => feature.properties.COBCODE?.startsWith('OR'))         //filters the source layer to only show Oregon counties
            };

            // Add the filtered data to the map with improved styling
            L.geoJSON(oregonCounties, {
                style: {
                    color: 'black',
                    fillColor: 'white',
                    weight: 1,
                    opacity: 1,
                    interactive: false              //makes sure that the layer will not respond to mouse events and interfere with the graduated symbol popups
                }
            }).addTo(map);
        })
        .catch(error => console.error('Error loading county data:', error));
}

//Function to add circle markers for point features
function createPropSymbols(data) {
    var attribute = "population";
    var geojsonMarkerOptions = {
        fillColor: "#d73f09",
        color: 'white',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8,
    };

    L.geoJson(data, {
        onEachFeature: function (feature, layer) {
            if (feature.properties && feature.properties.name) {
                layer.bindPopup('Name: ' + feature.properties.name + '<br>Population: ' + feature.properties.population);   
                } 
        }
    });

    L.geoJson(data, {
        pointToLayer: function (feature, latlng) {
            var attValue = Number(feature.properties[attribute]) || 0;
            geojsonMarkerOptions.radius = Math.max(3, attValue / 10000);                                //define graduated circles and sets minimum size
          
            var layer = L.circleMarker(latlng, geojsonMarkerOptions);
            var thousands = attValue.toLocaleString();                                                  //add comma separator for thousands
            var popupContent = `<strong>County:</strong> ${feature.properties.name || "Unknown"}<br>            
                                <strong>Population:</strong> ${thousands}`;                              //define pop-up fields, attributes, defaults
            layer.bindPopup(popupContent);                                                               //bind popup to marker click
            layer.on('click', function () {
                this.openPopup();
            });
            return layer;
        }
    }).addTo(map);
}

function createLegend(attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },
        onAdd: function () {
            //create the control container with a particular class name
            var container = L.DomUtil.create('div', 'info');
            var title = '<b>Population:</b><br>';
            
            var svg = '<svg id="attribute-legend" width="130px" height="100px">';
            svg += '<circle cx="50" cy="52" r="49" fill="#d73f09" fill-opacity="0.8" stroke="white" stroke-width="1"/>';
            svg += '<text x="50" y="9"> -------- 500,000</text>';
            svg += '<circle cx="50" cy="70" r="30" fill="#d73f09" fill-opacity="0.6" stroke="white" stroke-width="1"/>';
            svg += '<text x="50" y="44">  -------- 300,000</text>';
            svg += '<circle cx="50" cy="90" r="10" fill="#d73f09" fill-opacity="0.4" stroke="white" stroke-width="1"/>';
            svg += '<text x="50" y="84">  -------- 100,000</text>';
            svg += '<circle cx="50" cy="95" r="3" fill="#d73f09" fill-opacity="0.8" stroke="white" stroke-width="1"/>';
            svg += '<text x="50" y="95">------- < 12,000</text>';
            svg += '</svg>';
            container.innerHTML = title + svg;
            return container;
        }
    });
    map.addControl(new LegendControl());

};

//Retrieve Oregon county point GeoJSON data with population
function getData() {
    fetch("data/OrCoPts.geojson")
        .then(response => response.json())
        .then(json => {
            json.features.sort((a, b) => b.properties.population - a.properties.population);        //sort the geoJSON by population so small symbols are written on top of large ones
            createPropSymbols(json);
        })
        .catch(error => console.error('Error loading point data:', error));
    }

// Initialize map
document.addEventListener('DOMContentLoaded', createMap);