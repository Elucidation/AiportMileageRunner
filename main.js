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
    draw_routes(routes);

    results_box.innerHTML = output;
}

function run_query(query) {
    let content_box = document.getElementById('content_box1');
    content_box.value = query;
    submit_form();
}

var projection;
var path;
var asa_points;
var svg;

function generateUsMap() {
    // Composite Mercator projection for the US
    geoMercatorUsa = function (width, height, scale) {
        let continental = d3.geoMercator()
            .center([-98.58, 39.83])
            .translate([width * 0.5, height * 0.42])
            .scale(scale);

        let hawaii = d3.geoMercator()
            .center([-157.25, 20.8])
            .scale(scale)
            .translate([width * 0.35, height * 0.87])

        let alaska = d3.geoMercator()
            .center([-152.5, 65])
            .translate([width * 0.15, height * 0.8])
            .scale(scale * 0.3)

        let projection = d3.geoTransform({
            point: function (x, y) {
                if (y < 50 && x < -140) {
                    this.stream.point(...hawaii([x, y]));
                }
                else if (y > 50) {
                    this.stream.point(...alaska([x, y]));
                }
                else {
                    this.stream.point(...continental([x, y]));
                }
            }
        });
        return projection;
    }

    let width = 960;
    let height = 550;
    let scale = 800;

    svg = d3.select("usmap")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    projection = geoMercatorUsa(width, height, scale);
    path = d3.geoPath(projection);
    path.pointRadius(2);

    // Draw US borders.
    svg.append("g")
        .attr("class", "states")
        .selectAll("path")
        .data(topojson.feature(us, us.objects.states).features)
        .enter().append("path")
        .attr("fill", "gray")
        .attr("stroke", "black")
        .attr("d", path)

    // Draw city circles using path
    svg.append("g")
        .attr("class", "iatas")
        .selectAll("path")
        .data(asa_points)
        .enter().append("path")
        .attr("fill", "rgb(121, 273, 140)")
        .attr("stroke", "none")
        .attr("d", path)

    // Draw city circles direct
    // svg
    //     .append("g")
    //     .selectAll("circle")
    //     .data(asa_points)
    //     .join("circle")
    //     .attr("transform", d => {
    //         const [cx, cy] = path.centroid(d);
    //         return `translate(${cx}, ${cy})`;
    //     })
    //     .attr("r", 2)
    //     .style("fill", "red");

    svg.append("g")
        .attr("class", "iata_labels")
        .selectAll("text")
        .data(asa_points)
        .join("text")
        .attr("transform", d => {
            const [cx, cy] = path.centroid(d);
            return `translate(${cx}, ${cy})`;
        })
        .text(d => { return d.iata; })
        .attr('x', -9)
        .attr('fill', 'black')
        .attr('y', -5)
        .attr("font-size", ".65em");
}

function draw_routes(routes) {
    // Draw routes onto map
    d3.selectAll(".iata_routes").remove();
    let links = [];
    let routes_data = routes.forEach(route => {
        // ex. route = [['HNL', 'SEA', 2675],['SEA', 'HNL', 2675]]
        route.forEach(trip => {
            let a = iata_location_map[trip[0]];
            let b = iata_location_map[trip[1]];
            let linestring = {
                type: "LineString",
                coordinates: [[a.longitude, a.latitude], [b.longitude, b.latitude]]
            }

            links.push(linestring);
        })
    })
    svg.append("g")
        .attr("class", "iata_routes")
        .selectAll("routes")
        .data(links)
        .enter()
        .append("path")
        .attr("d", function (d) { return path(d) })
        .style("fill", "none")
        .style("stroke", "orange")
        .style("stroke-width", 7)
}

var us;
var iata_location_map = {};

// Load city-city distance dictionary from CSV file.
Promise.all([
    d3.csv('./city_pair_alaska_miles.csv', d3.autoType),
    d3.csv('./airport_locations.csv', d3.autoType),
    d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')
]).then(
    function (initialize) {
        let city_pair_alaska_miles = initialize[0];
        let iata_locations = initialize[1];
        us = initialize[2]
        // ex. city_pair_alaska_miles[0] -> {start: 'ABQ', destination: 'SEA', miles: '1178'}
        // dist_map['ABQ_SEA'] -> 1178
        city_pair_alaska_miles.forEach(element => {
            let key = getEdgeKey(element.start, element.destination); // ABQ_SEA
            dist_map[key] = parseInt(element.miles);
        });

        // Filter IATA locations to those Alaska Airlines has
        let alaska_iatas = new Set(['ABQ', 'ADK', 'ADQ', 'ANC', 'ATL', 'AUS', 'BET', 'BLI', 'BNA', 'BOI', 'BOS', 'BRW', 'BUR', 'BWI', 'CDV', 'CHS', 'CUN', 'DCA', 'DEN', 'DFW', 'DTW', 'EWR', 'FAI', 'FLL', 'GDL', 'GEG', 'HAV', 'HNL', 'IAD', 'IAH', 'IND', 'JFK', 'JNU', 'KOA', 'KTN', 'LAS', 'LAX', 'LIH', 'LIR', 'LTO', 'LWS', 'MCI', 'MCO', 'MEX', 'MSP', 'MSY', 'MZT', 'OAK', 'OGG', 'OMA', 'OME', 'ONT', 'ORD', 'OTZ', 'PDX', 'PHL', 'PHX', 'PSG', 'PSP', 'PUW', 'PVR', 'RDU', 'SAN', 'SAT', 'SBA', 'SCC', 'SEA', 'SFO', 'SIT', 'SJC', 'SJD', 'SJO', 'SLC', 'SMF', 'SNA', 'STL', 'TPA', 'TUS', 'WRG', 'YAK', 'YVR', 'ZIH', 'ZLO']);
        let alaska_iata_locations = iata_locations.filter(function ({ iata, longitude, latitude }) { return alaska_iatas.has(iata); })
        alaska_iata_locations.forEach(entry => {
            iata_location_map[entry.iata] = entry;
        })


        asa_points = alaska_iata_locations.map(({ iata, longitude, latitude }) => {
            return { type: "Feature", 'iata': iata, geometry: { type: "Point", coordinates: [longitude, latitude] } };
        });

        generateUsMap();
    }
)