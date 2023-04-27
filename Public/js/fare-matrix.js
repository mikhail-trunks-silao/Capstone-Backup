const body = document.querySelector('body'),
    sidebar = body.querySelector('nav'),
    toggle = body.querySelector(".toggle"),

    modeText = body.querySelector(".mode-text");


toggle.addEventListener("click", () => {
    sidebar.classList.toggle("close");
})

async function fetchFareMatrix() {
    const response = await fetch('/api/fare-matrix');

    if (response.ok) {
        const data = await response.json();
        document.getElementById('traditional_1st4km').value = data.traditional_1st4km;
        document.getElementById('traditional_succeeding').value = data.traditional_succeeding;
        document.getElementById('modernized_1st4km').value = data.modernized_1st4km;
        document.getElementById('modernized_succeeding').value = data.modernized_succeeding;
    } else {
        console.error('Error fetching fare matrix');
    }
}

fetchFareMatrix();


document.querySelector('form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const traditional_1st4km = document.getElementById('traditional_1st4km').value;
    const traditional_succeeding = document.getElementById('traditional_succeeding').value;
    const modernized_1st4km = document.getElementById('modernized_1st4km').value;
    const modernized_succeeding = document.getElementById('modernized_succeeding').value;

    const response = await fetch('/api/update-fare-matrix', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            traditional_1st4km,
            traditional_succeeding,
            modernized_1st4km,
            modernized_succeeding
        }),
    });

    if (response.ok) {
        alert('Fare matrix updated successfully');
    } else {
        console.error('Error updating fare matrix');
    }
});