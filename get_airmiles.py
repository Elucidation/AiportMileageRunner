import requests
import bs4
import pandas as pd

# ex. https://www.airmilescalculator.com/distance/sea-to-hnl/ for SEA -> HNL
def getMiles(a: str, b: str) -> int:
    r = requests.get(f'https://www.airmilescalculator.com/distance/{a}-to-{b}/')
    if (r.status_code != 200):
        raise Exception('Bad status: ', r)

    soup = bs4.BeautifulSoup(r.content, 'html.parser')
    divs = soup.findAll("div", {"class": "numberline"})
    if len(divs) <= 0:
        raise Exception('HTML has changed', divs)
    
    return int(divs[0].text)

# a = 'sea'
# b = 'bos'
# miles = getMiles(a,b)
# print(f'It is {miles} mi from {a} to {b}')

# with open('air_prices.txt', 'r') as f:
#     rows = f.readlines()
#     data = []
#     for row in rows:
#         parts = row.strip().split()
#         if len(parts) == 3:
#             # parts.append(0) # Add zero miles
#             parts.append(getMiles(parts[0], parts[1]))
#         if len(parts) == 4:
#             parts[3] = int(parts[3])
#         else:
#             continue # Bad data, skip 
#         # parts = [A B Price Dist]
#         parts[2] = int(parts[2].lstrip('$'))
#         data.append(parts)
# for (a,b,price,dist) in data:
#     print(f'{a} -> {b} = {dist} miles, ${price}')

def loadAirportCodeToPositions():
    pos_data = pd.read_csv(r'iata-icao.csv', sep=',')
    pos_data = pos_data[pos_data['country_code'] == 'US'] # Strip to just US
    p = pos_data[['iata', 'latitude', 'longitude']].set_index('iata')
    p = p.astype({'latitude':'float64', 'longitude': 'float64'})
    return p.T.to_dict('list')

airport_code_to_position = loadAirportCodeToPositions()

data = pd.read_csv(r'air_prices.csv')
print(data)

# ex: airport_code_to_position['BOS'] --> [42.36429977, -71.00520325]