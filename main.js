var dist_map = {}; // dist_map['SEA_DEN'] -> 1021
function submit_form(event) {
    // Make upper-case
    let content_box = document.getElementById('content_box1');
    content_box.value = content_box.value.toUpperCase();
    let queryset = content_box.value;
    // Split query up by commas into separate routes
    let querys = queryset.split(',')
    let routes = [];
    for (const query in querys) {
        let parts = querys[query].match(/[^ ]+/g);
        let route = [];
        if (parts.length <= 1) {
            continue; // Need at least 2 cities in route, skip.
        }
        for (let i = 0; i < parts.length - 1; i++) {
            let a = parts[i];
            let b = parts[i + 1];
            let key = getEdgeKey(a, b);
            let dist = dist_map[key]; // undefined if edge not there.
            route.push([a, b, dist]);
        }
        routes.push(route);
    }
    update_results(routes);
    if (event)
        event.preventDefault(); // Don't reload page
}

function getEdgeKey(start, destination) {
    return start + '_' + destination;
}

function generate_route_html(single_route) {
    let total_distance = 0;
    let output = '<table><tr><th>Trip</th><th>Base Miles</th></tr>';
    single_route.forEach(trip => {
        start = trip[0];
        destination = trip[1];
        miles = trip[2];
        if (miles) {
            total_distance += miles;
        }
        output += `<tr><td>${start} → ${destination}</td><td>${miles ? miles : '<em>Not in database</em>'}</td></tr>`
    });
    output += `<tr><td><strong>Total</strong></td><td>${total_distance}</td></tr>`
    output += '</table>'
    return output;
}

function update_results(routes) {
    // Make not hidden.
    document.getElementById('results_article').removeAttribute('hidden');

    let results_box = document.getElementById('results');
    let output = '<ol>';
    routes.forEach(route => {
        route_output = generate_route_html(route);
        output += `<li>${route_output}</li>`;
    })
    output += '</ol>';

    results_box.innerHTML = output;
}

function run_query(query) {
    let content_box = document.getElementById('content_box1');
    content_box.value = query;
    submit_form();
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