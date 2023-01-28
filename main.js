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

function generateUsMap(us, iata_locations) {
    // Make Mercator stuff
    var width = 1000;
    var height = 650;
    var svg = d3.select("usmap").append("svg")
        .attr("width", width)
        .attr("height", height);

    const projection = d3.geoAlbersUsa().scale(1300).translate([487.5, 305]);
    var path = d3.geoPath()

    svg.append("g")
        .attr("class", "states")
        .selectAll("path")
        .data(topojson.feature(us, us.objects.states).features)
        .enter().append("path")
        .attr("fill", "gray")
        .attr("d", path)

    // Filter IATA locations to those Alaska Airlines has
    let alaska_iatas = new Set(['ABQ', 'ADK', 'ADQ', 'ANC', 'ATL', 'AUS', 'BET', 'BLI', 'BNA', 'BOI', 'BOS', 'BRW', 'BUR', 'BWI', 'CDV', 'CHS', 'CUN', 'DCA', 'DEN', 'DFW', 'DTW', 'EWR', 'FAI', 'FLL', 'GDL', 'GEG', 'HAV', 'HNL', 'IAD', 'IAH', 'IND', 'JFK', 'JNU', 'KOA', 'KTN', 'LAS', 'LAX', 'LIH', 'LIR', 'LTO', 'LWS', 'MCI', 'MCO', 'MEX', 'MSP', 'MSY', 'MZT', 'OAK', 'OGG', 'OMA', 'OME', 'ONT', 'ORD', 'OTZ', 'PDX', 'PHL', 'PHX', 'PSG', 'PSP', 'PUW', 'PVR', 'RDU', 'SAN', 'SAT', 'SBA', 'SCC', 'SEA', 'SFO', 'SIT', 'SJC', 'SJD', 'SJO', 'SLC', 'SMF', 'SNA', 'STL', 'TPA', 'TUS', 'WRG', 'YAK', 'YVR', 'ZIH', 'ZLO']);
    let alaska_iata_locations = iata_locations.filter(function ({ iata, longitude, latitude }) { return alaska_iatas.has(iata); })
    alaska_iata_locations.map(({ iata, longitude, latitude }) => {
        try {
            let g = svg.append("g");
            g.attr("transform", `translate(${projection([longitude, latitude]).join(",")})`)
                .append("circle").attr('r', 2);

            g.append("text").text(iata).attr('y', -3).attr("font-size", ".5em")
        } catch (error) {
            console.log(iata, 'failed');
        }
    })
}

// Load city-city distance dictionary from CSV file.
Promise.all([
    d3.csv('./city_pair_alaska_miles.csv', d3.autoType),
    d3.csv('./airport_locations.csv', d3.autoType),
    d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json')
]).then(
    function (initialize) {
        let city_pair_alaska_miles = initialize[0];
        let iata_locations = initialize[1];
        let us = initialize[2]
        // ex. city_pair_alaska_miles[0] -> {start: 'ABQ', destination: 'SEA', miles: '1178'}
        // dist_map['ABQ_SEA'] -> 1178
        city_pair_alaska_miles.forEach(element => {
            let key = getEdgeKey(element.start, element.destination); // ABQ_SEA
            dist_map[key] = parseInt(element.miles);
        });

        generateUsMap(us, iata_locations);
    }
)