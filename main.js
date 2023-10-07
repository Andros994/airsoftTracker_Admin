var initialLat, initialLon, link, map, mapLayers;
var dynamicInterval;
var osmMap = L.tileLayer.provider('OpenStreetMap.Mapnik');
var topoMap = L.tileLayer.provider('OpenTopoMap');
var imageryMap = L.tileLayer.provider('Esri.WorldImagery');

var baseMaps = {
    OSM: osmMap,
    'Stamen Watercolor': topoMap,
    'World imagery': imageryMap
}

$(document).ready(function(){

    initialize();

    $(document).on('click', '#btnSearch', function(){
        link = $('#ngLink').val().split(" ").join("");
        if (link != '' && link != undefined && link != null){
            $('#spinner').show();
            dynamicInterval = setInterval(getDynamicPosition(link), 60000);
        }
    })
})

function initialize(){
    $('#spinner').hide();
    $('#connected').hide();
    $('#notConnected').hide();
    if ("geolocation" in navigator){
        navigator.geolocation.getCurrentPosition(
            // Successo nel trovare la tua posizione
            (position) => {
                initialLat = position.coords.latitude;
                initialLon = position.coords.longitude;
                buildMap(initialLat, initialLon)
            },
            (error) => {
                alert("Errore nel calcolo della posizione", error)
            }
        )
    } else {
        alert("Questo browser non supporta la geolocalizzazione");
    }
}


function buildMap(lat, lon){

    map = L.map('map', {
        center: [lat, lon],
        zoom: 13,
        layers: [osmMap]
    });

    map.addControl(new L.Control.LinearMeasurement({
        unitSystem: 'metric',
        color: '#FF0080',
        type: 'line'
    }));

    mapLayers = L.control.layers(baseMaps).addTo(map);

    // You are here marker
    var youAreHereIcon = L.icon({
        iconUrl: 'images/youAreHere.png',
        iconSize: [40, 40]
        // iconAchor: [lat,lon]
    })
    var yourPositionMarker = L.marker([lat, lon], {
        draggable: false,
        title: "Tu sei qui",
        icon: youAreHereIcon
    }).addTo(map);
    yourPositionMarker.bindPopup("Tu sei qui")

    //? Se vogliamo leggere dei geoJSON da inserire su mappa
    // $.getJson("link", function(data){
    //     L.geoJSON(data).addTo(map)
    // })
    // setInterval(initialize(link), 60000);
}

function addDynamicMarkers(lista){
    lista.forEach(el => {
        // default icon
        var icon = L.icon({
            iconUrl: 'images/dot.png',
            iconSize: [20, 20]
        })
        // icona in base al colore
        if (el.iconColor == "red"){
            icon = L.icon({
                iconUrl: 'images/dot_red.png',
                iconSize: [20, 20]
            }) 
        } else if (el.iconColor == "blue"){
            icon = L.icon({
                iconUrl: 'images/dot_blue.png',
                iconSize: [20, 20]
            }) 
        }
        L.marker([el.coords.latitude, el.coords.longitude], {
            draggable: false,
            title: el.nick,
            icon: icon
        }).bindPopup(`
        <div>
            <label>nick: ${el.nick}</label><br>
            <label>asd: ${el.asd}</label><br>
            <label>tel: ${el.phone}</label><br>
            <label>ruolo: ${el.ruolo}</label><br>
            <label>fazione: ${el.fazione}</label><br>
            <label>plotone: ${el.plotone}</label>
        </div>`
        )
        .addTo(map);
    });
}

function getDynamicPosition(link){

    $.ajax({
        type: "GET",
        // async: false,
        url: link+'/geoData/list',
        headers: {'ngrok-skip-browser-warning': true},
        success: function(data){
            console.log('data received');
            $('#connected').show();
            $('#notConnected').hide();
            $('#spinner').hide();
            addDynamicMarkers(data.listaDati);
        },
        error: function(){
            console.log('failed to receive data')
            $('#connected').hide();
            $('#notConnected').show();
            $('#spinner').hide();
        }
    });
}