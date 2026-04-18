"""Target cities across North America and Europe with significant African
diaspora populations. Coordinates are city center; radius_m is the search
radius used as a location bias."""

from __future__ import annotations

TARGET_CITIES: list[dict] = [
    # United States
    {"name": "New York", "country": "US", "lat": 40.7128, "lng": -74.0060, "radius_m": 45000},
    {"name": "Bronx", "country": "US", "lat": 40.8448, "lng": -73.8648, "radius_m": 20000},
    {"name": "Newark", "country": "US", "lat": 40.7357, "lng": -74.1724, "radius_m": 20000},
    {"name": "Philadelphia", "country": "US", "lat": 39.9526, "lng": -75.1652, "radius_m": 30000},
    {"name": "Washington DC", "country": "US", "lat": 38.9072, "lng": -77.0369, "radius_m": 40000},
    {"name": "Baltimore", "country": "US", "lat": 39.2904, "lng": -76.6122, "radius_m": 30000},
    {"name": "Boston", "country": "US", "lat": 42.3601, "lng": -71.0589, "radius_m": 30000},
    {"name": "Atlanta", "country": "US", "lat": 33.7490, "lng": -84.3880, "radius_m": 45000},
    {"name": "Houston", "country": "US", "lat": 29.7604, "lng": -95.3698, "radius_m": 45000},
    {"name": "Dallas", "country": "US", "lat": 32.7767, "lng": -96.7970, "radius_m": 45000},
    {"name": "Chicago", "country": "US", "lat": 41.8781, "lng": -87.6298, "radius_m": 40000},
    {"name": "Minneapolis", "country": "US", "lat": 44.9778, "lng": -93.2650, "radius_m": 30000},
    {"name": "Columbus", "country": "US", "lat": 39.9612, "lng": -82.9988, "radius_m": 30000},
    {"name": "Los Angeles", "country": "US", "lat": 34.0522, "lng": -118.2437, "radius_m": 45000},
    {"name": "Oakland", "country": "US", "lat": 37.8044, "lng": -122.2712, "radius_m": 25000},
    {"name": "Seattle", "country": "US", "lat": 47.6062, "lng": -122.3321, "radius_m": 30000},
    {"name": "Phoenix", "country": "US", "lat": 33.4484, "lng": -112.0740, "radius_m": 35000},
    {"name": "Charlotte", "country": "US", "lat": 35.2271, "lng": -80.8431, "radius_m": 30000},
    # Canada
    {"name": "Toronto", "country": "CA", "lat": 43.6532, "lng": -79.3832, "radius_m": 40000},
    {"name": "Montreal", "country": "CA", "lat": 45.5019, "lng": -73.5674, "radius_m": 35000},
    {"name": "Ottawa", "country": "CA", "lat": 45.4215, "lng": -75.6972, "radius_m": 30000},
    {"name": "Calgary", "country": "CA", "lat": 51.0447, "lng": -114.0719, "radius_m": 30000},
    {"name": "Edmonton", "country": "CA", "lat": 53.5461, "lng": -113.4938, "radius_m": 30000},
    {"name": "Vancouver", "country": "CA", "lat": 49.2827, "lng": -123.1207, "radius_m": 30000},
    {"name": "Winnipeg", "country": "CA", "lat": 49.8951, "lng": -97.1384, "radius_m": 25000},
    # United Kingdom
    {"name": "London", "country": "GB", "lat": 51.5074, "lng": -0.1278, "radius_m": 45000},
    {"name": "Birmingham", "country": "GB", "lat": 52.4862, "lng": -1.8904, "radius_m": 25000},
    {"name": "Manchester", "country": "GB", "lat": 53.4808, "lng": -2.2426, "radius_m": 25000},
    {"name": "Leeds", "country": "GB", "lat": 53.8008, "lng": -1.5491, "radius_m": 20000},
    # Germany
    {"name": "Berlin", "country": "DE", "lat": 52.5200, "lng": 13.4050, "radius_m": 35000},
    {"name": "Hamburg", "country": "DE", "lat": 53.5511, "lng": 9.9937, "radius_m": 30000},
    {"name": "Munich", "country": "DE", "lat": 48.1351, "lng": 11.5820, "radius_m": 25000},
    {"name": "Frankfurt", "country": "DE", "lat": 50.1109, "lng": 8.6821, "radius_m": 25000},
    {"name": "Cologne", "country": "DE", "lat": 50.9375, "lng": 6.9603, "radius_m": 25000},
    # France
    {"name": "Paris", "country": "FR", "lat": 48.8566, "lng": 2.3522, "radius_m": 35000},
    {"name": "Marseille", "country": "FR", "lat": 43.2965, "lng": 5.3698, "radius_m": 25000},
    {"name": "Lyon", "country": "FR", "lat": 45.7640, "lng": 4.8357, "radius_m": 25000},
    # Netherlands
    {"name": "Amsterdam", "country": "NL", "lat": 52.3676, "lng": 4.9041, "radius_m": 25000},
    {"name": "Rotterdam", "country": "NL", "lat": 51.9244, "lng": 4.4777, "radius_m": 25000},
    {"name": "The Hague", "country": "NL", "lat": 52.0705, "lng": 4.3007, "radius_m": 20000},
    # Sweden
    {"name": "Stockholm", "country": "SE", "lat": 59.3293, "lng": 18.0686, "radius_m": 30000},
    {"name": "Gothenburg", "country": "SE", "lat": 57.7089, "lng": 11.9746, "radius_m": 25000},
    {"name": "Malmo", "country": "SE", "lat": 55.6050, "lng": 13.0038, "radius_m": 20000},
]
