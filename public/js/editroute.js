const body = document.querySelector('body'),
sidebar = body.querySelector('nav'),
toggle = body.querySelector(".toggle"),

modeText = body.querySelector(".mode-text");


toggle.addEventListener("click" , () =>{
sidebar.classList.toggle("close");
})
 
const url = new URL(window.location.href);
const routeId = url.pathname.split('/').pop();



async function fetchRouteData(routeId) {
    const response = await fetch(`/api/get-route/${routeId}`);
  
    if (response.ok) {
      const data = await response.json();
      console.log(data);
      var routeForm = document.getElementById("routeForm");
      var routeNumberInput = routeForm.elements["routeNumber"];
      routeNumberInput.value = data[0].route_number;

      var routeNameInput = routeForm.elements["routeName"];
        routeNameInput.value = data[0].route_name;

        var routeColorInput = routeForm.elements["routeColor"];
        routeColorInput.value = data[0].route_color;
    } else {
      console.error('Error fetching route data');
    }
  }
  
  // Call the fetchRouteData function with the routeId you got from the URL
  fetchRouteData(routeId);

  document.getElementById('routeForm').addEventListener('submit', function (event) {
    event.preventDefault();

    // Save form data to sessionStorage
    sessionStorage.setItem('routeNumber', document.getElementById('routeNumber').value);
    sessionStorage.setItem('routeName', document.getElementById('routeName').value);
    sessionStorage.setItem('routeColor', document.getElementById('routeColor').value);

    // Redirect to the new page
    window.location.href = `/admin/editwaypoints/${routeId}`;
  });