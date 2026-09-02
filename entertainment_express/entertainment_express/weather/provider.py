"""Pluggable weather forecast providers. Default: Open-Meteo (no API key)."""

from __future__ import annotations

import json
from typing import Any
from urllib.error import URLError, HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


class WeatherProviderError(Exception):
    """Provider unavailable or returned unusable data."""


def fetch_forecast(
    lat: float,
    lon: float,
    start_iso: str,
    end_iso: str,
    provider: str = "open_meteo",
) -> dict[str, Any]:
    """
    Return normalized forecast:
      wind_mph, precip_inch, lightning_risk (bool), source, raw (truncated str)
    """
    if provider == "open_meteo" or not provider:
        return _open_meteo(lat, lon, start_iso, end_iso)
    raise WeatherProviderError(f"Unknown weather provider: {provider}")


def _open_meteo(lat: float, lon: float, start_iso: str, end_iso: str) -> dict[str, Any]:
    # Open-Meteo expects YYYY-MM-DD for daily; use hourly for event window.
    start_date = start_iso[:10]
    end_date = end_iso[:10] if end_iso else start_date
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "wind_speed_10m,precipitation,weather_code",
        "wind_speed_unit": "mph",
        "precipitation_unit": "inch",
        "timezone": "auto",
        "start_date": start_date,
        "end_date": end_date,
    }
    url = f"https://api.open-meteo.com/v1/forecast?{urlencode(params)}"
    try:
        req = Request(url, headers={"User-Agent": "EntertainmentExpress/1.0"})
        with urlopen(req, timeout=12) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except (URLError, HTTPError, TimeoutError, json.JSONDecodeError, ValueError) as exc:
        raise WeatherProviderError(str(exc)) from exc

    hourly = payload.get("hourly") or {}
    times = hourly.get("time") or []
    winds = hourly.get("wind_speed_10m") or []
    precip = hourly.get("precipitation") or []
    codes = hourly.get("weather_code") or []

    # Filter to event window when timestamps available
    idxs = list(range(len(times)))
    if times and start_iso and end_iso:
        idxs = [i for i, t in enumerate(times) if start_iso[:16] <= str(t)[:16] <= end_iso[:16]]
        if not idxs:
            idxs = list(range(len(times)))

    wind_vals = [float(winds[i]) for i in idxs if i < len(winds) and winds[i] is not None]
    precip_vals = [float(precip[i]) for i in idxs if i < len(precip) and precip[i] is not None]
    code_vals = [int(codes[i]) for i in idxs if i < len(codes) and codes[i] is not None]

    # WMO codes 95–99 ≈ thunderstorm
    lightning = any(c >= 95 for c in code_vals)

    raw = json.dumps(payload)[:1800]
    return {
        "wind_mph": max(wind_vals) if wind_vals else 0.0,
        "precip_inch": sum(precip_vals) if precip_vals else 0.0,
        "lightning_risk": lightning,
        "source": "open_meteo",
        "raw": raw,
    }
