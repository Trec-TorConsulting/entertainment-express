# Copyright (c) 2026, Trec-Tor Consulting and contributors
# For license information, please see license.txt

from datetime import date
from entertainment_express.copilot.solar import calculate_solar_times


def test_calculate_solar_times():
    """Verify offline solar position calculations for latitude and longitude."""
    # Test coordinates for New York (40.7128 N, 74.0060 W)
    res = calculate_solar_times(latitude=40.7128, longitude=-74.0060, target_date=date(2026, 9, 16))

    assert res["date"] == "2026-09-16"
    assert "sunset" in res
    assert "golden_hour_start" in res
    assert "sunrise" in res
    assert len(res["sunset"]) == 5  # Format HH:MM
    assert len(res["golden_hour_start"]) == 5
