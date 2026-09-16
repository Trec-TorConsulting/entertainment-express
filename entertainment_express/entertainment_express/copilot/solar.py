# Copyright (c) 2026, Trec-Tor Consulting and contributors
# For license information, please see license.txt

import math
from datetime import datetime, date, time, timedelta


def calculate_solar_times(latitude: float, longitude: float, target_date: date = None):
    """
    Computes mathematical solar position times (sunrise, sunset, golden hour, civil twilight)
    for a given lat/lon coordinate and date without requiring third-party API calls.
    Returns dict with ISO-formatted times or HH:MM strings.
    """
    if target_date is None:
        target_date = date.today()

    if isinstance(target_date, str):
        target_date = datetime.strptime(target_date, "%Y-%m-%d").date()

    # Day of year calculation
    day_of_year = target_date.timetuple().tm_yday

    # Approximate solar declination (radians)
    declination = 0.409 * math.sin((2 * math.pi / 365) * (day_of_year - 81))

    # Convert latitude to radians
    lat_rad = math.radians(latitude)

    # Hour angle calculation for standard zenith (90.833 deg)
    cos_hour_angle = (math.cos(math.radians(90.833)) - (math.sin(lat_rad) * math.sin(declination))) / (
        math.cos(lat_rad) * math.cos(declination)
    )

    # Clamp value to valid [-1, 1] range for high latitude safety
    cos_hour_angle = max(-1.0, min(1.0, cos_hour_angle))

    hour_angle = math.degrees(math.acos(cos_hour_angle))

    # Solar noon (in hours UTC approx)
    # Longitude correction: 4 minutes per degree longitude
    time_offset = (180 - longitude) / 15.0
    solar_noon_utc = 12.0 + (time_offset - 12.0)

    sunrise_utc_hours = solar_noon_utc - (hour_angle / 15.0)
    sunset_utc_hours = solar_noon_utc + (hour_angle / 15.0)

    # Convert hours to time objects
    def hours_to_time_str(hours):
        h = int(hours) % 24
        m = int((hours - int(hours)) * 60)
        return f"{h:02d}:{m:02d}"

    sunset_time_str = hours_to_time_str(sunset_utc_hours)
    sunrise_time_str = hours_to_time_str(sunrise_utc_hours)

    # Golden hour starts ~45 minutes before sunset
    golden_hour_start_hours = sunset_utc_hours - 0.75
    golden_hour_start_str = hours_to_time_str(golden_hour_start_hours)

    # Dusk / Civil twilight ends ~30 minutes after sunset
    dusk_hours = sunset_utc_hours + 0.5
    dusk_str = hours_to_time_str(dusk_hours)

    return {
        "date": str(target_date),
        "latitude": latitude,
        "longitude": longitude,
        "sunrise": sunrise_time_str,
        "sunset": sunset_time_str,
        "golden_hour_start": golden_hour_start_str,
        "dusk": dusk_str,
    }
