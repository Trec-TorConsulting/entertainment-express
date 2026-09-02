"""Starter column maps. Keys are EE fields; values are likely CSV headers."""

from __future__ import annotations

import json
from pathlib import Path

# Built-in presets (also mirrored as JSON under data_migration/presets/)
PRESETS = {
    "honeybook": {
        "customers": {"name": "Full Name", "email": "Email", "phone": "Phone Number"},
        "leads": {"name": "Lead Name", "email": "Email", "phone": "Phone"},
        "bookings": {"name": "Project Name", "email": "Client Email", "date": "Event Date", "address": "Venue"},
    },
    "djeventplanner": {
        "customers": {"name": "Client", "email": "Email", "phone": "Phone"},
        "bookings": {"name": "Event", "email": "Email", "date": "Date", "address": "Location"},
        "songs": {"title": "Title", "artist": "Artist"},
    },
    "checkcherry": {
        "customers": {"name": "Name", "email": "Email", "phone": "Mobile"},
        "bookings": {"name": "Event Name", "email": "Email", "date": "Event Date"},
        "packages": {"name": "Package", "rate": "Price"},
    },
    "booqable": {
        "customers": {"name": "Name", "email": "Email"},
        "gear": {"name": "Product", "type": "Category"},
        "packages": {"name": "Product", "rate": "Price"},
    },
    # Phase 36 competitor pack
    "io": {
        "customers": {"name": "Client Name", "email": "Email Address", "phone": "Phone"},
        "bookings": {"name": "Event Name", "email": "Client Email", "date": "Event Date", "address": "Venue Name"},
        "packages": {"name": "Package Name", "rate": "Price"},
        "leads": {"name": "Lead Name", "email": "Email", "phone": "Phone"},
    },
    "ers": {
        "customers": {"name": "Customer", "email": "Email", "phone": "Phone"},
        "bookings": {"name": "Job Name", "email": "Email", "date": "Start Date", "address": "Location"},
        "gear": {"name": "Item", "type": "Category"},
    },
    "bcn": {
        "customers": {"name": "Contact", "email": "Email", "phone": "Mobile"},
        "bookings": {"name": "Booking", "email": "Email", "date": "Date", "address": "Venue"},
        "packages": {"name": "Service", "rate": "Amount"},
    },
    "goodshuffle": {
        "customers": {"name": "Company / Contact", "email": "Email", "phone": "Phone"},
        "bookings": {"name": "Project", "email": "Contact Email", "date": "Event Date", "address": "Venue"},
        "gear": {"name": "Inventory Item", "type": "Category"},
        "packages": {"name": "Package", "rate": "Sell Price"},
    },
    "djep": {
        "customers": {"name": "Client", "email": "Email", "phone": "Phone"},
        "bookings": {"name": "Event", "email": "Email", "date": "Date", "address": "Location"},
        "songs": {"title": "Song", "artist": "Artist"},
    },
    "dji": {
        "customers": {"name": "Name", "email": "Email", "phone": "Phone"},
        "bookings": {"name": "Event Title", "email": "Client Email", "date": "Event Date", "address": "Venue Address"},
        "packages": {"name": "Package", "rate": "Price"},
        "songs": {"title": "Title", "artist": "Artist"},
    },
}


def load_json_presets() -> dict:
    """Merge JSON files from data_migration/presets/ over built-ins."""
    merged = dict(PRESETS)
    root = Path(__file__).resolve().parents[1] / "data_migration" / "presets"
    if not root.is_dir():
        return merged
    for path in root.glob("*.json"):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            key = path.stem.lower()
            if isinstance(data, dict):
                merged[key] = data
        except Exception:
            continue
    return merged
