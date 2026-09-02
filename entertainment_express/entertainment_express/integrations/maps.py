"""Geocode and travel time. Empty result if no maps key."""

from __future__ import annotations

import os
from urllib.parse import quote

from entertainment_express.integrations.credentials import secrets
from entertainment_express.integrations.http import request
from entertainment_express.integrations import observe


def _token():
    mb = secrets("mapbox")
    if mb.get("token") or mb.get("access_token"):
        return "mapbox", mb.get("token") or mb.get("access_token")
    env = os.environ.get("EE_MAPBOX_TOKEN") or os.environ.get("MAPBOX_TOKEN")
    if env:
        return "mapbox", env
    gm = secrets("google_maps")
    if gm.get("key") or gm.get("api_key"):
        return "google_maps", gm.get("key") or gm.get("api_key")
    envg = os.environ.get("EE_GOOGLE_MAPS_KEY")
    if envg:
        return "google_maps", envg
    return None, None


def geocode(address: str) -> dict:
    address = (address or "").strip()
    if not address:
        return {"lat": None, "lon": None, "geo": "", "formatted": ""}
    provider, token = _token()
    if not token:
        observe.log_sync("mapbox", "geocode", "skipped")
        return {"lat": None, "lon": None, "geo": "", "formatted": ""}

    def _call():
        if provider == "mapbox":
            url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{quote(address)}.json?access_token={token}&limit=1"
            data = request("GET", url)
            feats = (data or {}).get("features") or []
            if not feats:
                return {"lat": None, "lon": None, "geo": "", "formatted": address}
            center = feats[0].get("center") or [None, None]
            lon, lat = center[0], center[1]
            geo = f"{lat},{lon}" if lat is not None else ""
            return {"lat": lat, "lon": lon, "geo": geo, "formatted": feats[0].get("place_name") or address}
        url = f"https://maps.googleapis.com/maps/api/geocode/json?address={quote(address)}&key={token}"
        data = request("GET", url)
        results = (data or {}).get("results") or []
        if not results:
            return {"lat": None, "lon": None, "geo": "", "formatted": address}
        loc = ((results[0].get("geometry") or {}).get("location")) or {}
        lat, lon = loc.get("lat"), loc.get("lng")
        geo = f"{lat},{lon}" if lat is not None else ""
        return {"lat": lat, "lon": lon, "geo": geo, "formatted": results[0].get("formatted_address") or address}

    return observe.run(provider, "geocode", _call) or {"lat": None, "lon": None, "geo": "", "formatted": ""}


def travel_minutes(from_geo: str, to_geo: str) -> int | None:
    provider, token = _token()
    if not token or not from_geo or not to_geo:
        return None

    def _call():
        try:
            flat, flon = [x.strip() for x in from_geo.split(",")[:2]]
            tlat, tlon = [x.strip() for x in to_geo.split(",")[:2]]
        except Exception:
            return None
        if provider == "mapbox":
            url = f"https://api.mapbox.com/directions/v5/mapbox/driving/{flon},{flat};{tlon},{tlat}?access_token={token}"
            data = request("GET", url)
            routes = (data or {}).get("routes") or []
            if not routes:
                return None
            return int(round((routes[0].get("duration") or 0) / 60))
        url = f"https://maps.googleapis.com/maps/api/distancematrix/json?origins={quote(from_geo)}&destinations={quote(to_geo)}&key={token}"
        data = request("GET", url)
        rows = (data or {}).get("rows") or []
        el = ((rows[0].get("elements") or [{}])[0] if rows else {})
        sec = ((el.get("duration") or {}).get("value"))
        return int(round(sec / 60)) if sec else None

    return observe.run(provider, "travel_minutes", _call)
