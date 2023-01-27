import pandas as pd
import matplotlib.pyplot as plt
from collections import deque

airport_locations = pd.read_csv(r'airport_locations.csv').set_index('iata')
airport_code_to_position = airport_locations.T.to_dict('list')
# ex: airport_code_to_position['BOS'] --> [42.36429977, -71.00520325]

trip_miles = pd.read_csv('trip_miles_costs.csv')
# print(trip_miles[['start','destination','miles']])

# plt.xlim(-160,-60)
# plt.ylim(20,70)

# places_in_trips = set()
# for start, destination, price, miles in trip_miles.to_numpy():
#     places_in_trips.add(start)
#     places_in_trips.add(destination)

#     sy, sx = airport_code_to_position[start]
#     dy, dx = airport_code_to_position[destination]

#     mx, my = (sx+dx)/2, (sy+dy)/2
#     plt.plot([sx, dx], [sy, dy], '-')
#     plt.text(mx, my, f'{miles}')


# for airport in airport_code_to_position:
#     if airport not in places_in_trips:
#         continue
#     lat, long = airport_code_to_position[airport]
#     plt.plot(long, lat, 'o')
#     plt.text(long, lat, airport)

# plt.grid()
# plt.show()

def get_edges(iata):
    return trip_miles[trip_miles['start'] == iata][['destination','miles']].to_numpy().tolist()
    # [[dest, miles],...]


def get_mileage_run(goal_miles=10000, start='SEA', end='SEA', max_flights=6):
    start_block = [0, [start]] # [miles, path]
    stack = deque([start_block])
    runs = []
    while stack:
        miles, path = stack.popleft()
        if len(path) >= max_flights:
            # runs.append([miles, path])
            continue
        if miles > goal_miles and path[-1] == end:
            runs.append([miles, path])
            continue
        
        for neighbor, dist in get_edges(path[-1]):
            new_path = path + [neighbor]
            new_miles = miles + dist
            stack.append([new_miles, new_path])
            # todo still
        # print(stack)
    runs = sorted(runs, reverse=True)
    return runs

runs = get_mileage_run()
for miles, route in runs:
    print(f'Route: {" -> ".join(route)} : {miles:,.0f} mi')

# for start, destination, price, miles in trip_miles.to_numpy():
#     lat_s, lon_s = airport_code_to_position[start]
#     lat_d, lon_d = airport_code_to_position[destination]
#     print(f'{start} {destination} {[[lon_s, lat_s], [lon_d, lat_d]]}')