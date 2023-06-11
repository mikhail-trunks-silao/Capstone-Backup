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

async function getUsername() {
  const response = await fetch('/api/username');

  if (response.ok) {
    const data = await response.json();
    const username = document.querySelector('#username');
    username.textContent = data.username;
  } else {
    console.error('Error fetching username');
  }
}





async function fetchRoutes() {
  const response = await fetch('/api/routes');
  const routes = await response.json();
  return routes;
}

async function displayRoutes() {
  // Replace this with the actual function or API call to get the routes array
  const routes = await fetchRoutes();

  const routesContainer = document.getElementById('routes-container');

  routes.forEach(route => {
    const routeElement = document.createElement('div');
    routeElement.className = 'route-item mb-4';
    routeElement.style.backgroundColor = route.route_color;
    routeElement.id = `route-row-${route.route_id}`; // Add the id attribute here
    routeElement.style.width = '100%';


    // Changed from span to button
    const routeInfo = document.createElement('button');
    routeInfo.className = 'btn btn-primary custom-button';  // Add Bootstrap classes for button styling
    routeInfo.textContent = `${route.route_number}: ${route.route_name}`;
    routeInfo.style.backgroundColor = '#e0e0e0';
    routeInfo.style.borderColor = route.route_color;

    const routePolylines = {};
    const routeDecorators = {};

    routeInfo.onclick = async () => {
      const routeId = routes.route_id;
      // If the polyline exists on the map, remove it
      if (routePolylines[routeId]) {
        map.removeLayer(routePolylines[routeId]);
        map.removeLayer(routeDecorators[routeId]);
        routePolylines[routeId] = null;
        routeDecorators[routeId] = null;
        routeInfo.style.backgroundColor = '#e0e0e0';
  
      } else {
        const response = await fetch(`/api/route/${route.route_id}`);
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
              symbol: L.Symbol.arrowHead({ fill: true, fillColor: route_color, fillOpacity: 1, pixelSize: 10, polygon: true, pathOptions: { stroke: true, color: route_color, weight: 2 } }),
            },
          ],
        }).bindPopup(data[0].route_name);

        map.addLayer(decorator);
        map.fitBounds(polyline.getBounds());

        routePolylines[routeId] = polyline;
        routeDecorators[routeId] = decorator;
        routeInfo.style.backgroundColor = route_color;
      }
    }

    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'buttons-container';

    const editButton = document.createElement('button');
    editButton.className = 'btn btn-light me-2 button2';
    editButton.textContent = 'Edit';
    editButton.onclick = () => editRoute(route.route_id);

    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn btn-light button3';
    deleteButton.textContent = 'Delete';
    deleteButton.onclick = () => deleteRoute(route.route_id);

    buttonsContainer.appendChild(editButton);
    buttonsContainer.appendChild(deleteButton);
    routeElement.appendChild(routeInfo);
    routeElement.appendChild(buttonsContainer);
    routesContainer.appendChild(routeElement);
  });
}





// Replace these with the actual functions to handle edit and delete actions
async function editRoute(routeId) {

  window.location.href = `/admin/editroute/${routeId}`;

  // const response = await fetch(`/api/get-route/${routeId}`);

  // if (response.ok) {
  //   const routeData = await response.json();
  //   console.log(routeData);
  //   // Do something here with the routeData

  //   event.preventDefault();

  //   // Save form data to sessionStorage
  //   sessionStorage.setItem('routeID', routeData.route_id);
  //   sessionStorage.setItem('routeNumber', routeData.route_number);
  //   sessionStorage.setItem('routeName', routeData.route_name);
  //   sessionStorage.setItem('username', routeData.username);
  //   sessionStorage.setItem('routeColor', routeData.route_color);

  //   // Redirect to the new page
  //   window.location.href = '/admin/editwaypoints';
  // } else {
  //   console.error('Error fetching route data');
  // }
}

async function deleteRoute(routeId) {
  const response = await fetch(`/api/delete-route/${routeId}`, {
    method: 'DELETE',
  });

  if (response.ok) {
    // Remove the route row from the DOM
    const routeRow = document.getElementById(`route-row-${routeId}`);
    routeRow.remove();
    alert('Route has been deleted successfully');
  } else {
    console.error('Error deleting route');
  }
}

// Call the displayRoutes function when the page loads
displayRoutes();




