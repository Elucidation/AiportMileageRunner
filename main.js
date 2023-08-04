var dist_map = {}; // dist_map['SEA_DEN'] -> 1021
function submit_form(event) {
    // Make upper-case
    let content_box = document.getElementById('content_box1');
    content_box.value = content_box.value.toUpperCase();
    let queryset = content_box.value;
    // Split query up by commas into separate routes
    let queries = queryset.split(',')
    let routes = [];
    for (const query in queries) {
        let parts = queries[query].match(/[^ ]+/g);
        let route = [];
        if (parts.length <= 1) {
            continue; // Need at least 2 cities in route, skip.
        }
        for (let i = 0; i < parts.length - 1; i++) {
            let a = parts[i];
            let b = parts[i + 1];
            let [dist, in_db] = getDistance(a, b); // get distance from getDistance function
            route.push([a, b, dist, in_db]);
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

// Calculate distances, either from alaska mapping (true), or estimated by dist (false)
function getDistance(airport1, airport2) {
    var key = getEdgeKey(airport1, airport2);
    if (dist_map[key]) {
        return [dist_map[key], true];
    } 
    if (!airportData[airport1] || !airportData[airport2]) {
        // start or end destination not in airportData.
        return [null, false];
    }
    // Get the latitude and longitude for the two airports
    var lat1 = airportData[airport1][0];
    var lon1 = airportData[airport1][1];
    var lat2 = airportData[airport2][0];
    var lon2 = airportData[airport2][1];

    // Calculate the great circle distance between the two airports
    // This uses the Haversine formula
    var R = 3958.8; // Radius of the earth in miles
    var dLat = deg2rad(lat2-lat1);
    var dLon = deg2rad(lon2-lon1); 
    var a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2)
        ; 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; // Distance in miles
    return [Math.floor(d), false]; // Return to the closest mile
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}


function generate_route_html(single_route) {
    let total_distance = 0;
    let output = '<table><tr><th>Trip</th><th>Base Miles</th></tr>';
    single_route.forEach(trip => {
        start = trip[0];
        destination = trip[1];
        miles = trip[2];
        in_db = trip[3]
        if (miles) {
            total_distance += miles;
        }
        output += `<tr><td>${start} → ${destination}</td><td>${miles ? miles : '<em>Not in database</em>'}${in_db ? '':'*'}</td></tr>`
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
    let width = 960;
    let height = 650;
    let scale = 400;

    svg = d3.select("usmap")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    projection = d3.geoMercator()
        .center([-98.58, 39.83])
        .translate([width * 0.5, height * 0.72])
        .scale(scale);
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
        .attr("fill", "rgb(121, 193, 10)")
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
        .attr('fill', 'rgb(121, 193, 10)')
        .attr('y', -5)
        .attr("font-weight", "bold")
        .attr("font-size", ".65em");
}

function draw_routes(routes) {
    // Draw routes onto map
    d3.selectAll(".iata_routes").remove();
    let links = [];
    let routes_data = routes.forEach(route => {
        // ex. route = [['HNL', 'SEA', 2675],['SEA', 'HNL', 2675]]
        route.forEach(trip => {
            try {
                let a = iata_location_map[trip[0]];
                let b = iata_location_map[trip[1]];
                let linestring = {
                    type: "LineString",
                    coordinates: [[a.longitude, a.latitude], [b.longitude, b.latitude]]
                }

                links.push(linestring);
            } catch (error) {
                console.error('Skipping', trip);
            }

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
        .style("stroke-width", 2)
}

var us;
var iata_location_map = {};

// IATA: lat/long mapping
var airportData;

// Load city-city distance dictionary from CSV file.
Promise.all([
    d3.csv('./city_pair_alaska_miles.csv', d3.autoType),
    d3.csv('./airport_locations.csv', d3.autoType),
    d3.csv('./airports_corrected.csv', d3.autoType),
    d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')
]).then(
    function (initialize) {
        let city_pair_alaska_miles = initialize[0];
        let iata_locations = initialize[1];
        airportData = initialize[2].reduce(function(obj, item){
            obj[item.IATA] = [item.lat, item.long];
            return obj;
        }, {});
        us = initialize[3]
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
