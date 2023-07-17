"""
airport_distance.py

A module to calculate the great circle distance between each leg of a sequence 
of airports given their IATA codes. The script loads airport data from a CSV 
file and uses the argparse library to parse command-line arguments. 

The user can specify a sequence of airports as command-line arguments, and the 
script will calculate the distance between each consecutive pair of airports in 
the sequence.

Usage:
    python airport_distance.py <IATA code 1> <IATA code 2> <IATA code 3> ...

Example:
    python airport_distance.py SEA DEN JFK LAX
"""


import csv
import math
import argparse


def load_airports(filename):
    """
    Load airport data from a CSV file into a dictionary.

    Args:
        filename (str): The name of the CSV file.

    Returns:
        dict: A dictionary where each key is an IATA code and each value is a
              tuple containing the corresponding airport name, latitude, and longitude.
    """
    # Define the dictionary
    airport_dict = {}

    # Open the file
    with open(filename, "r", encoding="utf-8") as file_airports:
        # Create a CSV reader
        reader = csv.DictReader(file_airports)
        # Iterate over the rows
        for row in reader:
            # Get the IATA code, airport name, latitude, and longitude
            iata_code = row["IATA"]
            name = row["name"]
            lat = float(row["lat"])
            lon = float(row["long"])
            # Only keep rows where the IATA code is not empty
            if iata_code:
                airport_dict[iata_code] = (name, lat, lon)

    return airport_dict


def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points on the earth.

    Args:
        lat1 (float): Latitude of the first point.
        lon1 (float): Longitude of the first point.
        lat2 (float): Latitude of the second point.
        lon2 (float): Longitude of the second point.

    Returns:
        float: The distance in miles between the two points.
    """
    # Convert latitude and longitude from degrees to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

    # Haversine formula
    delta_longitude = lon2 - lon1
    delta_latitude = lat2 - lat1
    haversine_formula = (
        math.sin(delta_latitude / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(delta_longitude / 2) ** 2
    )
    angular_distance = 2 * math.asin(math.sqrt(haversine_formula))

    # Radius of earth in miles
    earth_radius_miles = 3958.8
    return angular_distance * earth_radius_miles


def calculate_leg_distances(airport_sequence, airport_dict):
    """
    Calculate the distances between each leg of a sequence of airports.

    Args:
        airport_sequence (list): A list of IATA codes representing the sequence of airports.
        airport_dict (dict): A dictionary where each key is an IATA code and each value is a
                             tuple containing the corresponding latitude and longitude.

    Returns:
        list: A list of distances between each leg of the sequence of airports.
    """
    distances = []
    for i in range(len(airport_sequence) - 1):
        _, lat1, lon1 = airport_dict[airport_sequence[i]]
        _, lat2, lon2 = airport_dict[airport_sequence[i + 1]]
        distance = calculate_distance(lat1, lon1, lat2, lon2)
        distances.append(distance)
    return distances


def main():
    """
    Main function to parse command-line arguments and calculate the distance
    between each leg of a sequence of airports.
    """
    parser = argparse.ArgumentParser(
        description="Calculate the distances between each leg of a sequence of airports."
    )
    parser.add_argument(
        "airports", nargs="+", help="The IATA codes of the airports in sequence"
    )

    args = parser.parse_args()

    airport_dict = load_airports("airports_corrected.csv")

    missing_airports = [iata for iata in args.airports if iata not in airport_dict]
    if missing_airports:
        print(
            f"The following IATA codes are not found in the dataset: {', '.join(missing_airports)}"
        )
    else:
        distances = calculate_leg_distances(args.airports, airport_dict)
        print("Leg | Distance")
        print("---|---")
        for i, distance in enumerate(distances):
            name1, _, _ = airport_dict[args.airports[i]]
            name2, _, _ = airport_dict[args.airports[i + 1]]
            print(
                f"{name1} ({args.airports[i]}) - {name2} ({args.airports[i+1]}) | {int(distance)} mi"
            )
        print(f"{' - '.join(args.airports)} | {int(sum(distances))} mi")


if __name__ == "__main__":
    main()
