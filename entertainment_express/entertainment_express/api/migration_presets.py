"""Starter column maps. Keys are EE fields; values are likely CSV headers."""

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
}
