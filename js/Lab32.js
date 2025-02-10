// Declare map variables globally
var map2
var geojson
var info = L.control();

//Function to instantiate the Leaflet map
function createMap2() {
    // Create the map
    map2 = L.map('map2', {
        center: [44, -120.5],                               //center the map on Oregon
        zoom: 7                                             //set zoom level to fit state
    });

    // Add base tile layer
    L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=4c175b69-da77-4ffe-b10b-9edb2c25a733', {
        attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map2);

    // Call data function
    getCounty();   
    info.addTo(map2);
    legend.addTo(map2);
    } 

//FUNCTIONS:
//define colors for categories in choropleth 
function getColor(d) {
    return  d > 800000 ? '#a63603' :
            d > 300000 ? '#e6550d' :
            d > 60000  ? '#fd8d3c' :
            d > 12000  ? '#fdbe85' :
                         '#feedde';
}

//define style features for the county map
function style(feature) {
    return {
        fillColor: getColor(feature.properties.population),
        weight: 1,
        opacity: 1,
        color: 'black',
        dashArray: '1',
        fillOpacity: 0.8
    };
}

//highlight feature on mouse hover
function highlightFeature(e) {
    var layer = e.target;
    layer.setStyle({
        weight: 5,
        color: '#d73f09',
        dashArray: '',
        fillOpacity: 0.7
    })
    layer.bringToFront();
    info.update(layer.feature.properties);
}

//reset highlight on mouse exit
function resetHighlight(e) {
    if (geojson) {
        geojson.resetStyle(e.target);
    }
    info.update();
}

//zoom to feature on mouse click
function zoomToFeature(e) {
    map2.fitBounds(e.target.getBounds());
}

//add event listeners to each feature
function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}

//custom control code
info.onAdd = function (map2) {
    this._div = L.DomUtil.create('div', 'info'); //create a div with a class of info
    this.update();
    return this._div;
};

//method to update the control based on feature properties passed
info.update = function (props) {
    this._div.innerHTML = '<h4></h4>' + (props ?
        '<b>County: </b>' + props.Name + '<br><b> Population:</b> ' + props.population.toLocaleString()
        : '<b>For info hover<br>over a county</b>');
};

//add a legend to the map
var legend = L.control({position: 'bottomright'});

legend.onAdd = function (map2) {
    var div = L.DomUtil.create('div', 'info legend'),
        grades = ['less than 12,000', 12000, 60000, 300000, 800000],
        labels = [];
    //add a title to the legend
    div.innerHTML += '<b>Population:</b><br>';

    for (var i = 0; i < grades.length; i++) {
        var thousands = grades[i].toLocaleString();                     //format the numbers with thousands separators
        div.innerHTML += 
            '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' + thousands;
            if (grades [i +1]) {
                div.innerHTML += (i === 0 ? '<br>' : ' &ndash; ' + grades[i + 1].toLocaleString() + '<br>');
            } else {
                div.innerHTML += '+';
           // } + (grades[i + 1] ? '&ndash;' + grades[i + 1].toLocaleString() + '<br>' : '+');
    }
    }
    return div;
};

//Function to retrieve Oregon counties data
function getCounty() {
    fetch("data/OrCoPoly.geojson")
        .then(response => response.json())
        .then(data => {
            geojson = L.geoJSON(data, {
                style: style,
                onEachFeature: onEachFeature
            }).addTo(map2);
        })

        .catch(error => console.error('Error loading county data:', error));
    }
// Initialize map
document.addEventListener('DOMContentLoaded', createMap2);