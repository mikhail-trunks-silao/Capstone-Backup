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

async function fetchRoutes() {
    const response = await fetch('http://localhost:5000/api/routes');
    const routes = await response.json();
    return routes;
}

const routePolylines = {};
const routeDecorators = {};

function createRouteButton(routes) {
    const button = document.createElement('button');
    button.innerText = routes.route_number +": "+ routes.route_name;
    button.classList.add( 'mx-2', 'my-2', 'custom-button');
    button.style.borderColor = routes.route_color;
    button.style.backgroundColor = '#e0e0e0';

    let clickCounter = 0;


    button.addEventListener('mouseover', function() {
      button.style.backgroundColor = routes.route_color; // Change background color on hover
    });
    
    // Add event listener for mouseout (hover off) event
    button.addEventListener('mouseout', function() {
      button.style.backgroundColor = '#e0e0e0'; // Reset background color on hover off
    });

    button.addEventListener('click', async () => {
        clickCounter++;
    
        setTimeout(async () => {
          if (clickCounter === 1) {
            // Single-click event
            const routeId = routes.route_id;
            // If the polyline exists on the map, remove it
            if (routePolylines[routeId]) {
              map.removeLayer(routePolylines[routeId]);
              map.removeLayer(routeDecorators[routeId]);
              routePolylines[routeId] = null;
              routeDecorators[routeId] = null;
            } else {
              // Fetch the data and add the polyline to the map
              const response = await fetch(`http://localhost:5000/api/route/${routeId}`);
              const data = await response.json();
              const latlang = data[0].waypoints;
              const route_color = data[0].route_color;
              const polyline = L.polyline(latlang, { color: route_color, weight: 3 }).bindPopup(data[0].route_name);
        
              map.addLayer(polyline);
        
              // Add an arrow decorator to the polyline
              const decorator = L.polylineDecorator(polyline, {
                patterns: [
                  {
                    
                    offset: '5%',
                    repeat: 150,
                    symbol: L.Symbol.arrowHead({ fill: true, fillColor:route_color ,fillOpacity: 1 ,pixelSize: 10, polygon: true, pathOptions: { stroke: true, color: route_color, weight: 2 } }),
                  },
                ],
              }).bindPopup(data[0].route_name);
        
              map.addLayer(decorator);
              map.fitBounds(polyline.getBounds());
        
              // Store the polyline and decorator in the corresponding objects
              routePolylines[routeId] = polyline;
              routeDecorators[routeId] = decorator;
            }
    
    
          } else if (clickCounter === 2) {
            // Double-click event
            const routeId = routes.route_id;
            const polyline = routePolylines[routeId];
    
            if (polyline) {
                map.fitBounds(polyline.getBounds());
            } else {
                const response = await fetch(`http://localhost:5000/api/route/${routeId}`);
              const data = await response.json();
              const latlang = data[0].waypoints;
              const route_color = data[0].route_color;
              const polyline = L.polyline(latlang, { color: route_color, weight: 3 }).bindPopup(data[0].route_name);
        
              map.addLayer(polyline);
        
              // Add an arrow decorator to the polyline
              const decorator = L.polylineDecorator(polyline, {
                patterns: [
                  {
                    
                    offset: 0,
                    repeat: 150,
                    symbol: L.Symbol.arrowHead({ fill: true, fillColor:route_color ,fillOpacity: 1 ,pixelSize: 10, polygon: true, pathOptions: { stroke: true, color: route_color, weight: 2 } }),
                  },
                ],
              }).bindPopup(data[0].route_name);
        
              map.addLayer(decorator);
        
              // Store the polyline and decorator in the corresponding objects
              routePolylines[routeId] = polyline;
              routeDecorators[routeId] = decorator;

            }
          }
    
          clickCounter = 0;
        }, 250);
      });

//     button.addEventListener('click', async () => {
//     clickCounter ++;

//     const routeId = routes.route_id;
//     // If the polyline exists on the map, remove it
//     if (routePolylines[routeId]) {
//       map.removeLayer(routePolylines[routeId]);
//       map.removeLayer(routeDecorators[routeId]);
//       routePolylines[routeId] = null;
//       routeDecorators[routeId] = null;
//     } else {
//       // Fetch the data and add the polyline to the map
//       const response = await fetch(`http://localhost:5000/api/route/${routeId}`);
//       const data = await response.json();
//       const latlang = data[0].waypoints;
//       const route_color = data[0].route_color;
//       const polyline = L.polyline(latlang, { color: route_color, weight: 3 }).bindPopup(data[0].route_name);

//       map.addLayer(polyline);

//       // Add an arrow decorator to the polyline
//       const decorator = L.polylineDecorator(polyline, {
//         patterns: [
//           {
            
//             offset: '5%',
//             repeat: 150,
//             symbol: L.Symbol.arrowHead({ fill: true, fillColor:route_color ,fillOpacity: 1 ,pixelSize: 10, polygon: true, pathOptions: { stroke: true, color: route_color, weight: 2 } }),
//           },
//         ],
//       }).bindPopup(data[0].route_name);

//       map.addLayer(decorator);

//       // Store the polyline and decorator in the corresponding objects
//       routePolylines[routeId] = polyline;
//       routeDecorators[routeId] = decorator;
//     }
//   });

  return button;
}


async function generateRoutesButtons() {
    const routes = await fetchRoutes();
    const buttonsContainer = document.getElementById('routesContainer');
    routes.forEach(route => {
      const button = createRouteButton(route);
      buttonsContainer.appendChild(button);
    });
}

generateRoutesButtons();

var CustomControl = L.Control.extend({
  options: {
      position: 'bottomright'
  },

  onAdd: function (map) {
      var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
      container.style.backgroundColor = 'white';
      container.style.width = 'auto';
      container.style.height = 'auto';
      container.classList.add('routingButton');

      var button = L.DomUtil.create('button', 'btn btn-primary', container,'routingButton');
      button.innerHTML = 'Plan Your Trip';
      button.style.cursor = 'pointer';
      button.classList.add('routingButton');
      

      
      L.DomEvent.on(button, 'click', function () {

        window.location.href = `/routing`;
      });

      return container;
  }
});

map.addControl(new CustomControl());



// Function to handle successful location retrieval
function onLocationFound(e) {
  var radius = e.accuracy / 2;

  // Add a marker at the user's location
  L.marker(e.latlng).addTo(map)
    .bindPopup("You are within " + radius + " meters from this point").openPopup();

  // Add a circle around the user's location to indicate accuracy
  L.circle(e.latlng, radius).addTo(map);
}

// Function to handle errors while retrieving location
function onLocationError(e) {
  alert(e.message);
}

// Get the user's location
map.locate({ setView: true, maxZoom: 16 });

// Attach event listeners for location found and location error events
map.on('locationfound', onLocationFound);
map.on('locationerror', onLocationError);