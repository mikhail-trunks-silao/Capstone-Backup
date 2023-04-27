var map = L.map('map').setView([10.712637, 122.551853], 14);
var googleMapTile = L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',{maxZoom: 20,subdomains:['mt0','mt1','mt2','mt3']});
googleMapTile.addTo(map);

var sidebar = L.control.sidebar({ container: 'sidebar' })
.addTo(map)
.open('home');


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
    button.classList.add('btn', 'btn-primary', 'mx-2', 'my-2');
    button.style.backgroundColor = routes.route_color;
    button.style.borderColor = routes.route_color;

    let clickCounter = 0;

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
    const buttonsContainer = document.getElementById('buttonsContainer');
    routes.forEach(route => {
      const button = createRouteButton(route);
      buttonsContainer.appendChild(button);
    });
}

generateRoutesButtons();



// add panels dynamically to the sidebar
// sidebar
// .addPanel({
//     id:   'js-api',
//     tab:  '<i class="fa fa-gear"></i>',
//     title: 'JS API',
//     pane: '<p>The Javascript API allows to dynamically create or modify the panel state.<p/><p><button onclick="sidebar.enablePanel(\'mail\')">enable mails panel</button><button onclick="sidebar.disablePanel(\'mail\')">disable mails panel</button></p><p><button onclick="addUser()">add user</button></b>',
// })

// // add a tab with a click callback, initially disabled
// .addPanel({
//     id:   'mail',
//     tab:  '<i class="fa fa-envelope"></i>',
//     title: 'Messages',
//     button: function() { alert('opened via JS callback') },
//     disabled: true,
// })

// // be notified when a panel is opened
// sidebar.on('content', function (ev) {
// switch (ev.id) {
//     case 'autopan':
//     sidebar.options.autopan = true;
//     break;
//     default:
//     sidebar.options.autopan = false;
// }
// });

// var userid = 0
// function addUser() {
// sidebar.addPanel({
//     id:   'user' + userid++,
//     tab:  '<i class="fa fa-user"></i>',
//     title: 'User Profile ' + userid,
//     pane: '<p>user ipsum dolor sit amet</p>',
// });
// }

