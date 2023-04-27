const body = document.querySelector('body'),
sidebar = body.querySelector('nav'),
toggle = body.querySelector(".toggle"),

modeText = body.querySelector(".mode-text");


toggle.addEventListener("click" , () =>{
sidebar.classList.toggle("close");
})


document.getElementById('routeForm').addEventListener('submit', function (event) {
    event.preventDefault();

    // Save form data to sessionStorage
    sessionStorage.setItem('routeNumber', document.getElementById('routeNumber').value);
    sessionStorage.setItem('routeName', document.getElementById('routeName').value);
    sessionStorage.setItem('routeColor', document.getElementById('routeColor').value);

    // Redirect to the new page
    window.location.href = '/admin/addwaypoints';
  });