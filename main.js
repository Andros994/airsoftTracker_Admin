var initialLat, initialLon, link, map, mapLayers;
var dynamicInterval;
var osmMap = L.tileLayer.provider('OpenStreetMap.Mapnik');
var topoMap = L.tileLayer.provider('OpenTopoMap');
var imageryMap = L.tileLayer.provider('Esri.WorldImagery');
var geoJsonPoints = [];
var listaMarker = [];

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
    // Nascondo gli elementi del caso
    $('#modalAddMarker').hide();
    $('#spinner').hide();
    $('#connected').hide();
    $('#notConnected').hide();
    $('#divRaggioMarker').hide();

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

    var LLcurrent = new LatLng(lat, lon);
    var UTMcurrent = LLcurrent.toUTMRef();
    $('#utmLat').val(UTMcurrent.easting.toString().split('.')[0]);
    $('#utmLon').val(UTMcurrent.northing.toString().split('.')[0]);

    map = L.map('map', {
        center: [lat, lon],
        zoom: 13,
        layers: [osmMap]
    });

    // button for adding markers
    addMarkerBtn();

    createMekerOnClick();
    
    // add linear measurement tool
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

function addMarkerBtn(){
    var addMarker = `
    <div class="leaflet-control leaflet-bar">
        <a id="addMarker" class="icon-addMarker" href="#" title="Aggiungi marker"></a>
    </div>
    `;
    $('.leaflet-top:eq(0)').append(addMarker);

    $('#addMarker').on('click', function(){
        $('#modalAddMarker').fadeIn();
    })

    $('#closeModalMarker').on('click', function(){
        $('#modalAddMarker').fadeOut();
    })

    $('#tipoMarker').on('change', function(){
        if (this.value == 'cerchio'){
            $('#divRaggioMarker').fadeIn();
        } else {
            $('#divRaggioMarker').fadeOut();
        }
    })

    $('#salvaMarkerBtn').on('click', function(){
        var utmLat = $('#utmLat').val();
        var utmLon = $('#utmLon').val();
        var markerTitle = $('#nomeMarker').val();
        var desrizioneMarker = $('#descrizioneMarker').val();
        var tipoMarker = $('#tipoMarker option:selected').val();
        var raggioCerchio = '';
        tipoMarker == "cerchio" ? raggioCerchio = $('#raggioMarker').val() : '';
        if (utmLat.length != 6 || utmLon.length != 7){
            alert("Lunghezza coordinate errata");
        } else {
            if (markerTitle != ''){
                if (checkExistingName(markerTitle) == true) {
                    return
                };
                var utmMarker = new UTMRef(utmLat, utmLon, "N", "33");
                var llMarker = utmMarker.toLatLng();
                if (tipoMarker == "punto"){             // Marker tipo punto
                    var marker = L.marker([llMarker.lat, llMarker.lng], {
                        draggable: false,
                        title: markerTitle
                    }).bindPopup(`
                    <div>
                        <label>${markerTitle}</label><br>
                        <label>${desrizioneMarker}</label><br>
                        <button type="button" referrer="${markerTitle}" class="deleteMarker btn btn-danger mt-2">Cancella</button>
                    </div>
                    `
                    ).addTo(map);
                } else if (tipoMarker == 'cerchio'){    // Marker tipo cerchio
                    var marker = L.circle([llMarker.lat, llMarker.lng], {
                        draggable: false,
                        title: markerTitle,
                        radius: raggioCerchio
                    }).bindPopup(`
                    <div>
                        <label>${markerTitle}</label><br>
                        <label>${desrizioneMarker}</label><br>
                        <button type="button" referrer="${markerTitle}" class="deleteMarker btn btn-danger mt-2">Cancella</button>
                    </div>
                    `
                    ).addTo(map)
                }
                listaMarker.push(marker);
            } else {
                alert('Inserire nome del marker');
            }
        }
    })

    $(document).on('click', '.deleteMarker', function(){
        nomeMarker = $(this).attr('referrer');
        listaMarker.forEach(el => {
            if (el.options.title == nomeMarker){
                map.removeLayer(el);
                listaMarker.splice(listaMarker.indexOf(listaMarker[el]), 1)
            }
        })
    })
}

function createMekerOnClick(){
    map.on('click', onMapClick);
    function onMapClick(e){
        $('#modalAddMarker').fadeIn();
        console.log(e);
        var LL = new LatLng(e.latlng.lat, e.latlng.lng);
        var UTM = LL.toUTMRef();
        $('#utmLat').val(UTM.easting.toString().split('.')[0]);
        $('#utmLon').val(UTM.northing.toString().split('.')[0]);
    }
}

function checkExistingName(nome){
    var exists = false
    listaMarker.forEach(el => {
        if (el.options.title == nome){
            alert("Nome già un uso")
            exists = true
        }
    })
    return exists
}

function getCircularReplacer() {
    const ancestors = [];
    return function (key, value) {
      if (typeof value !== "object" || value === null) {
        return value;
      }
      // `this` is the object that value is contained in,
      // i.e., its direct parent.
      while (ancestors.length > 0 && ancestors.at(-1) !== this) {
        ancestors.pop();
      }
      if (ancestors.includes(value)) {
        return "[Circular]";
      }
      ancestors.push(value);
      return value;
    };
  }