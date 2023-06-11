const routeNumber = sessionStorage.getItem('routeNumber');
const routeName = sessionStorage.getItem('routeName');
const routeColor = sessionStorage.getItem('routeColor');

if(routeName == null){
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


var editableLayers = new L.FeatureGroup();
map.addLayer(editableLayers);

var drawControl = new L.Control.Draw({
    position: "topright",
    draw: {
        polyline: true,
        polygon: false,
        rectangle: false,
        circle: false,
        marker: false,
        circlemarker: false
    },
    edit: {
        featureGroup: editableLayers,
    }
});

map.addControl(drawControl);

map.on('draw:created', function (e) {
    var type = e.layerType;
    var layer = e.layer;

    if (type === 'polyline') {
        editableLayers.addLayer(layer);

        // Disable the drawing control after adding the first polyline
        if (editableLayers.getLayers().length === 1) {
            map.removeControl(drawControl);

            drawControl = new L.Control.Draw({
                position: "topright",
                draw: {
                    polyline: false,
                    polygon: false,
                    rectangle: false,
                    circle: false,
                    marker: false,
                    circlemarker: false
                },
                edit: {
                    featureGroup: editableLayers, // Reuse the existing editableLayers feature group
                }
            });

            map.addControl(drawControl);

            console.log('Polyline created:', layer.editing.latlngs[0]);
        }
    }
});

map.on('draw:deleted', function (e) {
    if (editableLayers.getLayers().length === 0) {
        updateDrawControl(true);
    }
});

function updateDrawControl(enablePolyline) {
    map.removeControl(drawControl);

    drawControl = new L.Control.Draw({
        position: "topright",
        draw: {
            polyline: true,
            polygon: false,
            rectangle: false,
            circle: false,
            marker: false,
            circlemarker: false
        },
        edit: {
            featureGroup: editableLayers,
        }
    });

    map.addControl(drawControl);
}



const saveRouteButton = document.getElementById('saveRoute');
saveRouteButton.addEventListener('click', async ()=> {
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
                      routeWaypoints: routeWaypoints
                    };
                  
                    try {
                      const response = await fetch('/api/insert-route', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                      });
                  
                      const jsonResponse = await response.json();
                      console.log('Server response:', jsonResponse);
                      alert('Route successfully added!');
                        window.location.href = '/admin/addroute';
                    } catch (error) {
                      console.error('Error sending data to server:', error.message);
                    }
                  }

                  sendDataToServer();
              });  
    
});