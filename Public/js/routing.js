const body = document.querySelector('body'),
sidebar = body.querySelector('nav'),
toggle = body.querySelector(".toggle"),

modeText = body.querySelector(".mode-text");


toggle.addEventListener("click" , () =>{
sidebar.classList.toggle("close");
})


var map = L.map('map', {zoomControl: false}).setView([10.712637, 122.551853], 14);
var googleMapTile = L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',{maxZoom: 20,subdomains:['mt0','mt1','mt2','mt3']});
googleMapTile.addTo(map);
 
var zoomControl = L.control.zoom({ position: 'topright' });
zoomControl.addTo(map);

const currentLocationIcon = L.icon({
    iconUrl: '../pictures/marker-icon-blue.png',
    iconRetinaUrl: '../pictures/marker-icon-blue-2x.png',
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

// Global variables to store markers
let originMarker = null;
let destinationMarker = null;
const destinationDiv = document.getElementById('destinationDiv');

function initMap() {
  // Create the map and set its initial view
  // Handle map click events
  map.on('click', function (event) {
    // Check if origin marker is not set
    if (!originMarker) {
      // Create the origin marker
      originMarker = L.marker(event.latlng, { draggable: true, icon: currentLocationIcon }).addTo(map);
      originMarker.bindPopup('Origin').openPopup();

      //Displaying the coords of dragable marker
      var latLng = originMarker.getLatLng();
        currentLocationDiv.innerHTML = `Current Location:  Lat: ${latLng.lat.toFixed(6)}, Lng: ${latLng.lng.toFixed(6)}`;

      
      destinationDiv.innerHTML = `Select map to enter destination`;
      originMarker.on('drag', function (e) {
        var latLng = originMarker.getLatLng();
        currentLocationDiv.innerHTML = `Current Location:  Lat: ${latLng.lat.toFixed(6)}, Lng: ${latLng.lng.toFixed(6)}`;
      });


    } else if (!destinationMarker) {
      // Create the destination marker
      destinationMarker = L.marker(event.latlng, { draggable: true, icon:destinationIcon }).addTo(map);
      destinationMarker.bindPopup('Destination').openPopup();

      //Displaying the coords of dragable marker
      var latLng = destinationMarker.getLatLng();
      destinationDiv.innerHTML = `Destination:  Lat: ${latLng.lat.toFixed(6)}, Lng: ${latLng.lng.toFixed(6)}`;
      destinationMarker.on('drag', function (e) {
        var latLng = destinationMarker.getLatLng();
        destinationDiv.innerHTML = `Destination:  Lat: ${latLng.lat.toFixed(6)}, Lng: ${latLng.lng.toFixed(6)}`;
      });
    }
  });
}

// Call the initMap function to initialize the map
initMap();

const currentLocationDiv = document.getElementById('currentLocationDiv');
currentLocationDiv.innerHTML = `Select map to enter current location`;


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
        button.innerHTML = 'Calculate Route';
        button.style.cursor = 'pointer';

        
        L.DomEvent.on(button, 'click', function () {
            const coordinatesCurrentLocation = originMarker.getLatLng();
            const coordinatesDestination = destinationMarker.getLatLng(); 

            const currentLocation = [coordinatesCurrentLocation.lat, coordinatesCurrentLocation.lng];
            const destination = [coordinatesDestination.lat, coordinatesDestination.lng];


            fetch('/api/routing-waypoints')
            .then(response => response.json())
            .then(data => {
                console.log(data)

                const output= findShortestPath(data, currentLocation, destination);
                console.log(output)

                for (let i = 1; i < output.length; i++) {
                    function getRandomColor() {
                      // Generate random values for the red, green, and blue components of the color
                      const r = Math.floor(Math.random() * 256);
                      const g = Math.floor(Math.random() * 256);
                      const b = Math.floor(Math.random() * 256);
                    
                      // Construct the color string in RGB format
                      const color = `rgb(${r}, ${g}, ${b})`;
                    
                      // Return the color string
                      return color;
                    }
                  
                    const randomColor = getRandomColor();
                  
                    const latLngs = output[i][1].map(coord => L.latLng(coord[0], coord[1]));
                    const polyline = L.polyline(latLngs, { color: randomColor, weight: 5, opacity: 0.7 }).addTo(map);
                    polyline.bindPopup(`Route: ${output[i][0]}`);
                    
                  }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });


            
        });

        return container;
    }
});

map.addControl(new CustomControl());


// Update the coordinates display when the marker is dragged
