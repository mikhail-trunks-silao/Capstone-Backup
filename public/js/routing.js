import { findBestRoute } from "./testeralgo.js";
import { findShortestPath } from "../algo/findShortestPath.js";

const body = document.querySelector('body'),
  sidebar = body.querySelector('nav'),
  toggle = body.querySelector(".toggle"),

  modeText = body.querySelector(".mode-text");


toggle.addEventListener("click", () => {
  sidebar.classList.toggle("close");
  
  let menuButtons = document.querySelectorAll('.custom-button');
    menuButtons.forEach((btn) => {
        btn.classList.toggle('overflow');
    });
})

//For the text in the map
const map_text = document.getElementById('map-text');
map_text.innerHTML = "Click on the map to set your origin";

const overlay = document.querySelector('.loading-overlay');
const totalFareContainer = document.querySelector('.total-fare-container');


var map = L.map('map', { zoomControl: false }).setView([10.712637, 122.551853], 14);
var googleMapTile = L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', { maxZoom: 20, subdomains: ['mt0', 'mt1', 'mt2', 'mt3'] });
googleMapTile.addTo(map);

var zoomControl = L.control.zoom({ position: 'topright' });
zoomControl.addTo(map);

const currentLocationIcon = L.icon({
  iconUrl: '../pictures/marker-icon-yellow.png',
  iconRetinaUrl: '../pictures/marker-icon-yellow-2x.png',
  shadowUrl: '../pictures/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const destinationIcon = L.icon({
  iconUrl: '../pictures/marker-icon-red.png',
  iconRetinaUrl: '../pictures/marker-icon-red-2x.png',
  shadowUrl: '../pictures/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const userLocationAPIicon = L.icon({
  iconUrl: '../pictures/marker-icon-blue.png',
  iconRetinaUrl: '../pictures/marker-icon-blue-2x.png',
  shadowUrl: '../pictures/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Global variables to store markers
let originMarker = null;
let destinationMarker = null;


function initMap() {
  // Create the map and set its initial view
  // Handle map click events
  map.on('click', function (event) {
    // Check if origin marker is not set
    if (!originMarker) {
      // Create the origin marker
      originMarker = L.marker(event.latlng, { draggable: true, icon: currentLocationIcon }).addTo(map);
      originMarker.bindPopup('Origin').openPopup();

      //Chnage the text on the map
      map_text.innerHTML = "Click on the map to set your destination";

    } else if (!destinationMarker) {
      // Create the destination marker
      destinationMarker = L.marker(event.latlng, { draggable: true, icon: destinationIcon }).addTo(map);
      destinationMarker.bindPopup('Destination').openPopup();

      //Change the text on the map
      map_text.innerHTML = "";

    }
  });
}

// Call the initMap function to initialize the map
initMap();

let total_traditional_fare = 0;
let total_modernized_fare = 0;



var CustomControl = L.Control.extend({
  options: {
    position: 'topright'
  },

  onAdd: function (map) {
    var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
    container.style.backgroundColor = 'white';
    container.style.width = 'auto';
    container.style.height = 'auto';

    var calculate = L.DomUtil.create('button', 'btn btn-primary', container);
    calculate.innerHTML = 'Calculate Route';
    calculate.style.cursor = 'pointer';


    L.DomEvent.on(calculate, 'click', function () {
      
      //Loading spinner
      overlay.style.display = 'block';
      
      //Removing the draggable of marker
      originMarker.dragging.disable();
      destinationMarker.dragging.disable();

      const coordinatesCurrentLocation = originMarker.getLatLng();
      const coordinatesDestination = destinationMarker.getLatLng();

      const currentLocation = [coordinatesCurrentLocation.lat, coordinatesCurrentLocation.lng];
      const destination = [coordinatesDestination.lat, coordinatesDestination.lng];

      //getting the waypoints of all the routes
      fetch('/api/routing-waypoints')
        .then(response => response.json())
        .then(data => {
          //Open the sidebar


          //Getting the shortest path from the algorithm
          const transferDistance = 50;
          const distanceThreshold = 100;
          const bestRoute = findBestRoute(data, currentLocation, destination, transferDistance, distanceThreshold);
          // const bestRoute = findShortestPath(data, currentLocation, destination,  distanceThreshold);
          console.log(bestRoute);

          //Open the sidebar
          sidebar.classList.toggle("close");


          async function getRouteDetails(routeId) {
            const response = await fetch(`/api/get-route/${routeId}`);

            if (response.ok) {
              const routeDetails = await response.json();
              return routeDetails;
            } else {
              console.error('Error getting route details for routeId:', routeId);
            }
          }

          async function processResults() {
            const apiResults = [];

            for (const result of bestRoute) {
              const apiResult = await getRouteDetails(result.routeId); // Changed from bestRoute.routeId to result.routeId
              apiResults.push(apiResult);
            }



            //Get the fare matrix
            const response = await fetch('/api/fare-matrix');
            let traditional_1st4km;
            let traditional_succeeding;
            let modernized_1st4km;
            let modernized_succeeding;

      

            if (response.ok) {
              const data = await response.json();
              traditional_1st4km = data.traditional_1st4km;
              traditional_succeeding = data.traditional_succeeding;
              modernized_1st4km = data.modernized_1st4km;
              modernized_succeeding = data.modernized_succeeding;
              
            } else {
              console.error('Error fetching fare matrix');
            }
 
            function getRouteWaypoints(route_id) {
              return bestRoute.find((item) => parseInt(item.routeId) === route_id);
            }

            //Display the trip
            function createRouteButton(route_number, route_name, route_color, route_id) {
    
              //Create the polyline
              //Get the waypoints of the shortesta path
              const routeWaypoints = getRouteWaypoints(route_id);
              console.log(routeWaypoints)

              const latlang = routeWaypoints.waypoints;
              console.log(latlang);
              const polyline = L.polyline(latlang, { color: "Black", weight: 3 }).bindPopup(route_name);
        
              polyline.addTo(map);

              //Arrows in polyline

              const decorator = L.polylineDecorator(polyline, {
                patterns: [
                  {
                    
                    offset: 30,
                    repeat: 150,
                    symbol: L.Symbol.arrowHead({ fill: true, fillColor:"Black" ,fillOpacity: 1 ,pixelSize: 10, polygon: true, pathOptions: { stroke: true, color: route_color, weight: 2 } }),
                  },
                ],
              }).bindPopup(route_name);
        
              map.addLayer(decorator);
            
              //Calculate the distance of the route
              const distance = calculateDistance(latlang);

              //Calculate the fare
              const distanceMinusFour = Math.max(distance - 4, 0);
              const traditionalPUJFare = (traditional_1st4km + (distanceMinusFour)*(traditional_succeeding)).toFixed(2);
              const discountedTraditionalPUJFare = (traditionalPUJFare * 0.8).toFixed(2);;

              const modernizedPUJFare = (modernized_1st4km + (distanceMinusFour)*(modernized_succeeding)).toFixed(2);
              const discountedModernizedPUJFare = (modernizedPUJFare * 0.8).toFixed(2);

              total_traditional_fare += parseFloat(traditionalPUJFare);
              total_modernized_fare += parseFloat(modernizedPUJFare);


              //Create a button for the polyline and to display the infor
              const button = document.createElement('button');
              button.classList.add('btn', 'btn-primary', 'custom-button');

              button.style.borderColor = route_color;

              button.addEventListener('mouseover', function() {
                button.style.backgroundColor = route_color; // Change background color on hover
              });
              
              // Add event listener for mouseout (hover off) event
              button.addEventListener('mouseout', function() {
                button.style.backgroundColor = '#fafafa'; // Reset background color on hover off
              });

              button.addEventListener('click', function() {
                map.fitBounds(polyline.getBounds());
              });

              const routeNumberDiv = document.createElement('div');
              routeNumberDiv.classList.add('route-number');
              routeNumberDiv.textContent = route_number;

              const routeDetailsDiv = document.createElement('div');
              routeDetailsDiv.classList.add('route-details');

              const routeNameDiv = document.createElement('div');
              routeNameDiv.classList.add('route-name');
              routeNameDiv.textContent = route_name;

              const fareDetailsDiv = document.createElement('div');
              fareDetailsDiv.classList.add('fare-details');

              const fareTitleRow = document.createElement('div');
              fareTitleRow.classList.add('row', 'fare-title');
              fareTitleRow.innerHTML = `<div class="col">Trad. PUJ Fare</div><div class="col">Mod. PUJ Fare</div>`;

              fareDetailsDiv.appendChild(fareTitleRow);

              const fareRow1 = document.createElement('div');
              fareRow1.classList.add('row', 'fare');
              fareRow1.innerHTML = `
                <div class="col"><span>Reg: </span>${traditionalPUJFare}</div>
                <div class="col"><span>Reg: </span>${modernizedPUJFare}</div>
              `;
              fareDetailsDiv.appendChild(fareRow1);

              const fareRow2 = document.createElement('div');
              fareRow2.classList.add('row', 'fare');
              fareRow2.innerHTML = `
                <div class="col"><span>Disc: </span>${discountedTraditionalPUJFare}</div>
                <div class="col"><span>Disc: </span>${discountedModernizedPUJFare}</div>
              `;
              fareDetailsDiv.appendChild(fareRow2);

              routeDetailsDiv.appendChild(routeNameDiv);
              routeDetailsDiv.appendChild(fareDetailsDiv);

              button.appendChild(routeNumberDiv);
              button.appendChild(routeDetailsDiv);


              return button;
            }

            console.log(apiResults)

            //Make a poly decorator that connects the current location and destination to the routes
            const firstRouteFirstWaypoint = bestRoute[0].waypoints[0];
            const lastRouteLastWaypoint = bestRoute[bestRoute.length - 1].waypoints.slice(-1)[0];
            console.log(firstRouteFirstWaypoint);
            console.log(lastRouteLastWaypoint)
            
            // Create a polyline from the current location to the first waypoint
            const currentLocationToFirstWaypointPolyline = L.polyline([currentLocation, firstRouteFirstWaypoint], { dashArray: '5, 5', color: 'grey', weight: 2 }).addTo(map);

            // Create a polyline from the last waypoint to the destination
            const lastWaypointToDestinationPolyline = L.polyline([lastRouteLastWaypoint, destination], { dashArray: '5, 5', color: 'grey', weight: 2}).addTo(map);

            overlay.style.display = 'none';
            const containerforroutes = document.querySelector('.containerforroutes');
            for (const innerArray of apiResults) {
              for (const routeDetails of innerArray) {
                const { route_number, route_name, route_color, route_id } = routeDetails;
                const button = createRouteButton(route_number, route_name, route_color, route_id);
                containerforroutes.appendChild(button);
              }
            }

            const trad_reg = document.getElementById('trad_reg');
            const mod_reg = document.getElementById('mod_reg');
            const trad_disc = document.getElementById('trad_disc');
            const mod_disc = document.getElementById('mod_disc');
  
            console.log(total_traditional_fare);
            console.log(total_modernized_fare)
  
            trad_reg.textContent = total_traditional_fare;
            mod_reg.textContent = total_modernized_fare;
            trad_disc.textContent = (total_traditional_fare*.8).toFixed(2);
            mod_disc.textContent = (total_modernized_fare*.8).toFixed(2);

            const farecontainer = document.getElementById('containerforfare')
            function showDiv() {
              farecontainer.style.display = 'block';
              refresh_button.style.display = 'block';
            }


            showDiv();
    
          }
          processResults();




         




        })
        .catch(error => {
          overlay.style.display = 'none';
          console.error('Error fetching data:', error);
        });



    });

    return container;
  }
});

map.addControl(new CustomControl());

function calculateDistance(latlngs) {
  const earthRadius = 6371; // Earth's radius in kilometers
  let totalDistance = 0;

  for (let i = 0; i < latlngs.length - 1; i++) {
    const lat1 = latlngs[i][0];
    const lon1 = latlngs[i][1];
    const lat2 = latlngs[i + 1][0];
    const lon2 = latlngs[i + 1][1];

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadius * c;

    totalDistance += distance;
  }

  return totalDistance.toFixed(2); // Return total distance rounded to 2 decimal places
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

function onLocationFound(e) {
  

  // Add a marker at the user's location
  L.marker(e.latlng).addTo(map)
  

  

  // Add a circle around the user's location to indicate accuracy

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

//Remove scroll control for media withl little screen
function checkScreenSize() {
  if (window.innerWidth < 768) { // Adjust the breakpoint as needed
    map.removeControl(zoomControl);
  } else {
    map.addControl(zoomControl);
  }
}

// Call the function initially
checkScreenSize();

// Listen for window resize event and call the function
window.addEventListener('resize', checkScreenSize);

const refresh_button = document.getElementById('btn-refresh');
refresh_button.addEventListener('click', () => {
  location.reload();
});




// async function fetchRoutes() {
//   const response = await fetch('api/routes');
//   const routes = await response.json();
//   return routes;
// }

// const routePolylines = {};
// const routeDecorators = {};

// function createRouteButton(routes) {
//   const button = document.createElement('button');
//   button.innerText = routes.route_number +": "+ routes.route_name;
//   button.classList.add( 'mx-2', 'my-2', 'custom-button', "btn");
//   button.style.borderColor = routes.route_color;
//   button.style.backgroundColor = '#e0e0e0';

//   let clickCounter = 0;


  
//   // Add event listener for mouseout (hover off) event
  

//   button.addEventListener('click', async () => {
//       clickCounter++;
  
//       setTimeout(async () => {
//         if (clickCounter === 1) {
//           // Single-click event
//           const routeId = routes.route_id;
//           // If the polyline exists on the map, remove it
//           if (routePolylines[routeId]) {
//             map.removeLayer(routePolylines[routeId]);
//             map.removeLayer(routeDecorators[routeId]);
//             routePolylines[routeId] = null;
//             routeDecorators[routeId] = null;
//             button.style.backgroundColor = '#e0e0e0';
//           } else {
//             // Fetch the data and add the polyline to the map
//             const response = await fetch(`/api/route/${routeId}`);
//             const data = await response.json();
//             const latlang = data[0].waypoints;
//             const route_color = data[0].route_color;
//             const polyline = L.polyline(latlang, { color: route_color, weight: 3 }).bindPopup(data[0].route_name);
      
//             map.addLayer(polyline);
      
//             // Add an arrow decorator to the polyline
//             const decorator = L.polylineDecorator(polyline, {
//               patterns: [
//                 {
                  
//                   offset: '5%',
//                   repeat: 150,
//                   symbol: L.Symbol.arrowHead({ fill: true, fillColor:route_color ,fillOpacity: 1 ,pixelSize: 10, polygon: true, pathOptions: { stroke: true, color: route_color, weight: 2 } }),
//                 },
//               ],
//             }).bindPopup(data[0].route_name);
      
//             map.addLayer(decorator);
//             map.fitBounds(polyline.getBounds());
//             button.style.backgroundColor = route_color;
      
//             // Store the polyline and decorator in the corresponding objects
//             routePolylines[routeId] = polyline;
//             routeDecorators[routeId] = decorator;
//           }
  
  
//         } else if (clickCounter === 2) {
//           // Double-click event
//           const routeId = routes.route_id;
//           const route_color = routes.route_color;
//           const polyline = routePolylines[routeId];
//           button.style.backgroundColor = route_color;
  
//           if (polyline) {
//               map.fitBounds(polyline.getBounds());
//               button.style.backgroundColor = route_color;
//           } else {
//               const response = await fetch(`/api/route/${routeId}`);
//             const data = await response.json();
//             const latlang = data[0].waypoints;
//             const route_color = data[0].route_color;
//             const polyline = L.polyline(latlang, { color: route_color, weight: 3 }).bindPopup(data[0].route_name);
      
//             map.addLayer(polyline);
      
//             // Add an arrow decorator to the polyline
//             const decorator = L.polylineDecorator(polyline, {
//               patterns: [
//                 {
                  
//                   offset: 0,
//                   repeat: 150,
//                   symbol: L.Symbol.arrowHead({ fill: true, fillColor:route_color ,fillOpacity: 1 ,pixelSize: 10, polygon: true, pathOptions: { stroke: true, color: route_color, weight: 2 } }),
//                 },
//               ],
//             }).bindPopup(data[0].route_name);
      
//             map.addLayer(decorator);
            
      
//             // Store the polyline and decorator in the corresponding objects
//             routePolylines[routeId] = polyline;
//             routeDecorators[routeId] = decorator;


//             button.style.backgroundColor = route_color;
//           }
//         }
  
//         clickCounter = 0;
//       }, 250);
//     });

// //     button.addEventListener('click', async () => {
// //     clickCounter ++;

// //     const routeId = routes.route_id;
// //     // If the polyline exists on the map, remove it
// //     if (routePolylines[routeId]) {
// //       map.removeLayer(routePolylines[routeId]);
// //       map.removeLayer(routeDecorators[routeId]);
// //       routePolylines[routeId] = null;
// //       routeDecorators[routeId] = null;
// //     } else {
// //       // Fetch the data and add the polyline to the map
// //       const response = await fetch(`http://localhost:5000/api/route/${routeId}`);
// //       const data = await response.json();
// //       const latlang = data[0].waypoints;
// //       const route_color = data[0].route_color;
// //       const polyline = L.polyline(latlang, { color: route_color, weight: 3 }).bindPopup(data[0].route_name);

// //       map.addLayer(polyline);

// //       // Add an arrow decorator to the polyline
// //       const decorator = L.polylineDecorator(polyline, {
// //         patterns: [
// //           {
          
// //             offset: '5%',
// //             repeat: 150,
// //             symbol: L.Symbol.arrowHead({ fill: true, fillColor:route_color ,fillOpacity: 1 ,pixelSize: 10, polygon: true, pathOptions: { stroke: true, color: route_color, weight: 2 } }),
// //           },
// //         ],
// //       }).bindPopup(data[0].route_name);

// //       map.addLayer(decorator);

// //       // Store the polyline and decorator in the corresponding objects
// //       routePolylines[routeId] = polyline;
// //       routeDecorators[routeId] = decorator;
// //     }
// //   });

// return button;
// }


// async function generateRoutesButtons() {
//   const routes = await fetchRoutes();
//   const buttonsContainer = document.getElementById('routesContainer');
//   routes.forEach(route => {
//     const button = createRouteButton(route);
//     buttonsContainer.appendChild(button);
//   });
// }

// generateRoutesButtons();