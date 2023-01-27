var dist_map = {}; // dist_map['SEA_DEN'] -> 1021
function submit_form(event) {
    let queryset = document.getElementById('content_box1').value;
    // Split query up by commas into separate routes
    let querys = queryset.split(',')
    let routes = [];
    for (const query in querys) {
        let parts = querys[query].match(/[^ ]+/g);
        if (parts.length <= 1) {
            continue;
        }
        for (let i = 0; i < parts.length - 1; i++) {
            let a = parts[i];
            let b = parts[i + 1];
            let key = getEdgeKey(a, b);
            let dist = dist_map[key]; // undefined if edge not there.
            routes.push([a, b, dist]);
        }

    }
    update_results(routes);
    event.preventDefault(); // Don't reload page
}

function getEdgeKey(start, destination) {
    return start + '_' + destination;
}

function update_results(routes) {
    let total_distance = 0;
    let results_box = document.getElementById('results');
    results_box.innerHTML = '<ol>';
    routes.forEach(route => {
        start = route[0];
        destination = route[1];
        miles = route[2];
        if (miles) {
            total_distance += miles;
        }
        results_box.innerHTML += `<li>${start} → ${destination} : ${miles ? miles+' miles' : '<em>Not in database</em>'}</li>`
    });
    results_box.innerHTML += '</ol>'
    results_box.innerHTML += `<p>Total Base Miles: ${total_distance} miles</p>`

}

// Load city-city distance dictionary from CSV file.
Promise.all([
    d3.csv('./city_pair_alaska_miles.csv')
]).then(
    function (initialize) {
        let city_pair_alaska_miles = initialize[0];
        // ex. city_pair_alaska_miles[0] -> {start: 'ABQ', destination: 'SEA', miles: '1178'}
        city_pair_alaska_miles.forEach(element => {
            let key = getEdgeKey(element.start, element.destination); // ABQ_SEA
            dist_map[key] = parseInt(element.miles);
        });
    }
)