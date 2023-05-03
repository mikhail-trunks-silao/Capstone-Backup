const body = document.querySelector('body'),
    sidebar = body.querySelector('nav'),
    toggle = body.querySelector(".toggle"),

    modeText = body.querySelector(".mode-text");


toggle.addEventListener("click", () => {
    sidebar.classList.toggle("close");
})

var map = L.map('map', { zoomControl: false }).setView([10.712637, 122.551853], 14);
var googleMapTile = L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', { maxZoom: 20, subdomains: ['mt0', 'mt1', 'mt2', 'mt3'] });
googleMapTile.addTo(map);

var zoomControl = L.control.zoom({ position: 'topright' });
zoomControl.addTo(map);

const routeNumber = sessionStorage.getItem('routeNumber');
const routeName = sessionStorage.getItem('routeName');
const routeColor = sessionStorage.getItem('routeColor');



if (routeName == null) {
    window.location.href = '/admin/addroute';
}

async function getUsername() {
    const response = await fetch('/api/username');

    if (response.ok) {
        const data = await response.json();
        return data
    } else {
        console.error('Error fetching username');
    }
}


const url = new URL(window.location.href);
const routeId = url.pathname.split('/').pop();

var editableLayers = new L.FeatureGroup();
map.addLayer(editableLayers);

var drawControl;

function updateDrawControl(enablePolyline) {
    if (drawControl) {
        map.removeControl(drawControl);
    }

    drawControl = new L.Control.Draw({
        position: "topright",
        draw: {
            polyline: enablePolyline,
            polygon: false,
            rectangle: false,
            circle: false,
            marker: false,
            circlemarker: false
        },
        edit: {
            featureGroup: editableLayers
        }
    });

    map.addControl(drawControl);
}

async function fetchRouteWaypoints(routeId) {
    const response = await fetch(`/api/get-waypoints/${routeId}`);

    if (response.ok) {
        const data = await response.json();
        var waypointsArray = JSON.parse(data[0].waypoints);
        var polyline = L.polyline(waypointsArray);
        editableLayers.addLayer(polyline);
        updateDrawControl(false);
    } else {
        console.error('Error fetching waypoints data');
    }
}

fetchRouteWaypoints(routeId);

updateDrawControl(true);

map.on('draw:created', function (e) {
    var type = e.layerType;
    var layer = e.layer;

    if (type === 'polyline') {
        editableLayers.addLayer(layer);

        // Disable the drawing control after adding the first polyline
        if (editableLayers.getLayers().length === 1) {
            updateDrawControl(false);
            console.log('Polyline created:', layer.editing.latlngs[0]);
        }
    }
});

map.on('draw:deleted', function (e) {
    if (editableLayers.getLayers().length === 0) {
        updateDrawControl(true);
    }
});



var CustomControl = L.Control.extend({
    options: {
        position: 'bottomright'
    },

    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
        container.style.backgroundColor = 'white';
        container.style.width = 'auto';
        container.style.height = 'auto';

        var button = L.DomUtil.create('button', 'btn btn-primary', container);
        button.innerHTML = 'Update Route';
        button.style.cursor = 'pointer';


        L.DomEvent.on(button, 'click', function () {

            var layer = editableLayers.getLayers();

            const object_latlang = layer[0].editing.latlngs[0];


            const routeWaypoints = [];

            for (const item of object_latlang) {
                const waypoint = [item.lat, item.lng];
                routeWaypoints.push(waypoint);
            }

            const username1 = getUsername().then((result) => {
                const username = result.username;

                async function sendDataToServer() {

                    const data = {
                        username: username,
                        routeNumber: routeNumber,
                        routeName: routeName,
                        routeColor: routeColor,
                        routeWaypoints: routeWaypoints,
                        routeId: routeId
                    };

                    try {
                        const response = await fetch(`/api/update-route/`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(data)
                        });
                    
                        const jsonResponse = await response.json();
                        console.log('Server response:', jsonResponse);
                        alert('Route successfully updated!');
                        window.location.href = '/admin';
                    } catch (error) {
                        console.error('Error sending data to server:', error.message);
                    }
                }

                sendDataToServer();
            });
        });

        return container;
    }
});

map.addControl(new CustomControl());

