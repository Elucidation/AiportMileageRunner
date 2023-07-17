"""
airport_distance.py

A module to calculate the great circle distance between two airports given their
IATA codes. The script loads airport data from a CSV file and uses the argparse
library to parse command-line arguments.

Usage:
    python airport_distance.py <IATA code 1> <IATA code 2>
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
              tuple containing the corresponding latitude and longitude.
    """
    # Define the dictionary
    airport_dict = {}

    # Open the file
    with open(filename, "r", encoding="utf-8") as f:
        # Create a CSV reader
        reader = csv.DictReader(f)
        # Iterate over the rows
        for row in reader:
            # Get the IATA code, latitude, and longitude
            iata_code = row["IATA"]
            lat = float(row["lat"])
            lon = float(row["long"])
            # Only keep rows where the IATA code is not empty
            if iata_code:
                airport_dict[iata_code] = (lat, lon)

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


def main():
    """
    Main function to parse command-line arguments and calculate the distance
    between two airports.
    """
    parser = argparse.ArgumentParser(
        description="Calculate the distance between two airports."
    )
    parser.add_argument("airport1", help="IATA code of the first airport")
    parser.add_argument("airport2", help="IATA code of the second airport")

    args = parser.parse_args()

    airport_dict = load_airports("airports_corrected.csv")

    if args.airport1 in airport_dict and args.airport2 in airport_dict:
        lat1, lon1 = airport_dict[args.airport1]
        lat2, lon2 = airport_dict[args.airport2]
        distance = calculate_distance(lat1, lon1, lat2, lon2)
        print(
            f"The distance between {args.airport1} and {args.airport2} is {distance:.2f} miles."
        )
    else:
        print("One or both IATA codes are not found in the dataset.")


if __name__ == "__main__":
    main()
