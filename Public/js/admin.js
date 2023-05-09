const body = document.querySelector('body'),
sidebar = body.querySelector('nav'),
toggle = body.querySelector(".toggle"),

modeText = body.querySelector(".mode-text");


toggle.addEventListener("click" , () =>{
sidebar.classList.toggle("close");
})


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
  
  // Call the function to fetch the username
  getUsername();




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
    routeElement.className = 'route-item mb-3';
    routeElement.style.backgroundColor = route.route_color;
    routeElement.id = `route-row-${route.route_id}`; // Add the id attribute here

    const routeInfo = document.createElement('span');
    routeInfo.textContent = `${route.route_number}: ${route.route_name}`;

    const buttonsContainer = document.createElement('div');

    const editButton = document.createElement('button');
    editButton.className = 'btn btn-light me-2';
    editButton.textContent = 'Edit';
    editButton.onclick = () => editRoute(route.route_id);

    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn btn-light';
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
  } else {
    console.error('Error deleting route');
  }
}

// Call the displayRoutes function when the page loads
displayRoutes();




